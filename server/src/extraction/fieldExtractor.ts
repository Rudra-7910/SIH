/**
 * Field Extractor
 *
 * ARCHITECTURAL DECISION: Uses deterministic keyword matching + regex to extract
 * structured fields from raw OCR text. No LLM is used here.
 *
 * Each extraction function:
 * 1. Scans OCR text lines for keyword matches
 * 2. Applies regex patterns to extract the value
 * 3. Returns the value, confidence (from OCR), and the bounding box ID
 *
 * LIMITATIONS (honest):
 * - Keyword matching may miss unusual label formats
 * - Regex patterns cover common Indian product labeling but not all variations
 * - Multi-line declarations may not be fully captured
 * In production, more sophisticated NLP or a trained NER model would improve accuracy.
 */

import { OcrResult, OcrTextLine, ExtractedField, FieldName, getConfidenceLevel } from '../types';

interface ExtractionPattern {
  fieldName: FieldName;
  displayName: string;
  /** Keywords to search for in OCR text (case-insensitive) */
  keywords: string[];
  /** Regex patterns to extract the value from a matched line */
  valuePatterns: RegExp[];
  /** If true, also check the next line for continuation of the value */
  multiLine?: boolean;
}

const EXTRACTION_PATTERNS: ExtractionPattern[] = [
  {
    fieldName: 'mrp',
    displayName: 'Maximum Retail Price (MRP)',
    keywords: [
      'mrp', 'm.r.p', 'retail price', 'maximum retail',
      'max. retail', 'max retail', 'price:', 'price rs',
      'selling price', 'inclusive of all tax', 'incl. of all tax',
      'incl. tax', 'excl. tax', 'total price',
    ],
    valuePatterns: [
      // M.R.P. / MRP with optional colon, then currency symbol and value
      /m\.?r\.?p\.?\s*[:\-]?\s*(?:rs\.?|₹|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i,
      // Rs. or ₹ followed by digits
      /(?:rs\.?|₹|inr)\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i,
      // plain digits followed by /- (common Indian format like 250/-)
      /([\d,]+(?:\.\d{1,2})?)\s*\/\s*-/,
      // value with incl./excl. all taxes
      /([\d,]+(?:\.\d{1,2})?)\s*(?:incl|inclusive|excl|exclusive)/i,
      // "Price: 250" or "Selling Price 250"
      /(?:price|selling price)\s*[:\-]?\s*(?:rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    ],
  },
  {
    fieldName: 'net_quantity',
    displayName: 'Net Quantity / Weight',
    keywords: [
      'net wt', 'net weight', 'net content', 'net qty', 'net quantity',
      'net vol', 'net volume', 'contents', 'pack of', 'count:', 'nos.',
      'pieces', 'pcs', 'units', 'net mass', 'netto', 'e mark',
    ],
    valuePatterns: [
      // "Net Wt. 500 g" / "Net Content: 1 kg" etc.
      /net\s*(?:wt\.?|weight|content|qty\.?|quantity|vol\.?|volume|mass)\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)\s*(g|gm|gms|gram|grams|kg|kilograms?|ml|l|ltr|litre|liter|oz|lb|lbs|pcs|pieces?|nos?\.?|units?|count)/i,
      // standalone weight/volume values like "500 g" or "1 kg"
      /([\d,]+(?:\.\d{1,2})?)\s*(g|gm|gms|gram|grams|kg|kilograms?|ml|l|ltr|litre|liter)\b/i,
      // "Pack of 10 pieces" / "Count: 24"
      /(?:pack\s*of|count|pieces?|pcs?|units?|nos?\.?)\s*[:\-]?\s*(\d+)/i,
      // EU 'e' mark e.g. "500 g e"
      /([\d,]+(?:\.\d{1,2})?)\s*(g|ml)\s*e\b/i,
    ],
  },
  {
    fieldName: 'manufacturer',
    displayName: 'Manufacturer / Packer',
    keywords: [
      'mfg by', 'mfd by', 'manufactured by', 'packed by', 'packer',
      'manufacturer', 'mfg.', 'mfd.', 'marketed by', 'mktd. by',
      'mktd by', 'distributed by', 'dist. by', 'imported by',
      'sole distributor', 'importer', 'blended by', 'processed by',
      'prepared by', 'for:', 'by:', 'an unit of', 'a unit of',
    ],
    valuePatterns: [
      /(?:mf[gd]\.?\s*by|manufactured\s*by|packed\s*by|packer|marketed\s*by|mktd\.?\s*by|distributed\s*by|dist\.?\s*by|imported\s*by|sole\s*distributor|importer|blended\s*by|processed\s*by|prepared\s*by)\s*[:\-]?\s*(.+)/i,
    ],
    multiLine: true,
  },
  {
    fieldName: 'consumer_care',
    displayName: 'Consumer Care / Helpline',
    keywords: [
      'consumer care', 'customer care', 'helpline', 'toll free',
      'grievance', 'complaint', 'feedback', 'contact us', 'reach us',
      'write to', 'call us', '1800', 'support', 'care@', 'help@',
      'customercare@', 'consumer@',
    ],
    valuePatterns: [
      /(?:consumer|customer)\s*(?:care|helpline|service|support)\s*[:\-]?\s*(.+)/i,
      // Toll-free numbers: 1800-xxx-xxxx
      /(1800[\-\s]?\d{3}[\-\s]?\d{4,5})/i,
      // Indian phone number +91 / 0xx
      /(\+?91[\-\s]?\d{10}|\b0\d{10}\b)/,
      // Helpline short codes 
      /helpline\s*[:\-]?\s*(.+)/i,
    ],
  },
  {
    fieldName: 'date_of_manufacture',
    displayName: 'Date of Manufacture',
    keywords: [
      'mfg date', 'mfd date', 'date of mfg', 'date of manufacture',
      'manufacturing date', 'mfg:', 'mfd:', 'mfd ', 'dom:', 'dom ',
      'mfg month', 'mfg year', 'packed on', 'packed date',
      'manufacture date', 'production date', 'mfg dt', 'mfd dt',
    ],
    valuePatterns: [
      // DD/MM/YYYY or MM/YYYY or MM-YY format
      /(?:mf[gd]\.?\s*(?:date|dt)?|date\s*of\s*mf[gd]\.?|manufacturing\s*date|dom\.?|packed\s*on|production\s*date)\s*[:\-]?\s*(\d{1,2}[\/-]\d{2,4}(?:[\/-]\d{2,4})?)/i,
      // "Apr 2024" or "April 2024"
      /(?:mf[gd]\.?\s*(?:date|dt)?|date\s*of\s*mf[gd]\.?|dom\.?|packed\s*on)\s*[:\-]?\s*([A-Za-z]{3,9}\.?\s*\d{4})/i,
      // Purely numeric MMYYYY or MMYY
      /(?:mf[gd]|dom)\s*[:\-]?\s*(\d{2,6})/i,
    ],
  },
  {
    fieldName: 'best_before',
    displayName: 'Best Before / Expiry',
    keywords: [
      'best before', 'best by', 'use by', 'expiry', 'exp date',
      'shelf life', 'use before', 'consume before', 'bb:', 'bbd',
      'best before end', 'expiry date', 'exp.', 'expires', 'valid till',
      'valid until', 'use within',
    ],
    valuePatterns: [
      /(?:best\s*before(?:\s*end)?|best\s*by|use\s*by|use\s*before|consume\s*before|expiry(?:\s*date)?|exp\.?\s*(?:date)?|bbd?|valid\s*(?:till|until))\s*[:\-]?\s*(.+)/i,
      // "12 months from date of manufacture"
      /(\d+\s*months?\s*from\s*(?:date\s*of\s*)?(?:mfg|manufacture|mfd|packing))/i,
      // shelf life: 18 months
      /shelf\s*life\s*[:\-]?\s*(.+)/i,
      // "use within X months/days"
      /use\s*within\s*(.+)/i,
    ],
  },
  {
    fieldName: 'country_of_origin',
    displayName: 'Country of Origin',
    keywords: [
      'country of origin', 'product of', 'made in', 'origin',
      'manufactured in', 'produce of', 'country:', 'origin:',
      'country of manufacture',
    ],
    valuePatterns: [
      /(?:country\s*of\s*(?:origin|manufacture)|product\s*of|made\s*in|manufactured\s*in|produce\s*of)\s*[:\-]?\s*([\w][\w\s,.-]*)/i,
      /origin\s*[:\-]?\s*([\w][\w\s]*)/i,
    ],
  },
];

/**
 * Extract structured fields from OCR results using keyword matching + regex.
 */
export function extractFields(
  ocrResult: OcrResult,
  viewLabel: string
): ExtractedField[] {
  const extracted: ExtractedField[] = [];
  const lines = ocrResult.lines;

  for (const pattern of EXTRACTION_PATTERNS) {
    const match = findFieldInLines(lines, pattern);
    if (match) {
      extracted.push({
        fieldName: pattern.fieldName,
        displayName: pattern.displayName,
        value: match.value,
        confidence: match.confidence,
        confidenceLevel: getConfidenceLevel(match.confidence),
        boundingBoxId: match.boundingBoxId,
        sourceView: viewLabel,
      });
    }
  }

  // Also scan all lines for email addresses (consumer care fallback)
  if (!extracted.find(f => f.fieldName === 'consumer_care')) {
    const emailMatch = findEmailInLines(lines);
    if (emailMatch) {
      extracted.push({
        fieldName: 'consumer_care',
        displayName: 'Consumer Care / Helpline',
        value: emailMatch.value,
        confidence: emailMatch.confidence,
        confidenceLevel: getConfidenceLevel(emailMatch.confidence),
        boundingBoxId: emailMatch.boundingBoxId,
        sourceView: viewLabel,
      });
    }
  }

  // Website URL fallback for consumer care (www.brand.com / brand.in)
  if (!extracted.find(f => f.fieldName === 'consumer_care')) {
    const webMatch = findWebsiteInLines(lines);
    if (webMatch) {
      extracted.push({
        fieldName: 'consumer_care',
        displayName: 'Consumer Care / Helpline',
        value: webMatch.value,
        confidence: webMatch.confidence,
        confidenceLevel: getConfidenceLevel(webMatch.confidence),
        boundingBoxId: webMatch.boundingBoxId,
        sourceView: viewLabel,
      });
    }
  }

  return extracted;
}

interface FieldMatch {
  value: string;
  confidence: number;
  boundingBoxId: string;
}

function findFieldInLines(
  lines: OcrTextLine[],
  pattern: ExtractionPattern
): FieldMatch | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerText = line.text.toLowerCase();

    // Check if any keyword matches
    const hasKeyword = pattern.keywords.some(kw => lowerText.includes(kw.toLowerCase()));
    if (!hasKeyword) continue;

    // Try each regex pattern
    for (const regex of pattern.valuePatterns) {
      const match = line.text.match(regex);
      if (match && match[1]) {
        let value = match[1].trim();

        // For multi-line fields (e.g. manufacturer address), append next line if it's a continuation
        if (pattern.multiLine && i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const nextIsNewField = EXTRACTION_PATTERNS.some(p =>
            p.keywords.some(kw => nextLine.text.toLowerCase().includes(kw.toLowerCase()))
          );
          if (!nextIsNewField && nextLine.text.trim().length > 0) {
            value += ', ' + nextLine.text.trim();
            // Check one more line (3-line address support)
            if (i + 2 < lines.length) {
              const line3 = lines[i + 2];
              const line3IsNewField = EXTRACTION_PATTERNS.some(p =>
                p.keywords.some(kw => line3.text.toLowerCase().includes(kw.toLowerCase()))
              );
              if (!line3IsNewField && /\d{6}/.test(line3.text)) {
                // Looks like a PIN code continuation
                value += ', ' + line3.text.trim();
              }
            }
          }
        }

        return {
          value,
          confidence: line.confidence,
          boundingBoxId: line.boundingBox.id,
        };
      }
    }

    // Keyword matched but no regex captured → return the whole line as value
    // This handles unusual formats we haven't seen yet
    return {
      value: line.text.trim(),
      confidence: line.confidence * 0.85, // Slightly lower confidence for whole-line fallback
      boundingBoxId: line.boundingBox.id,
    };
  }

  return null;
}

function findEmailInLines(lines: OcrTextLine[]): FieldMatch | null {
  const emailRegex = /[\w.+-]+@[\w.-]+\.\w{2,}/;
  for (const line of lines) {
    const match = line.text.match(emailRegex);
    if (match) {
      return {
        value: match[0],
        confidence: line.confidence,
        boundingBoxId: line.boundingBox.id,
      };
    }
  }
  return null;
}

function findWebsiteInLines(lines: OcrTextLine[]): FieldMatch | null {
  // Match www.xxx.com / xxx.in / xxx.co.in (common for Indian FMCG brands)
  const webRegex = /(?:www\.[\w.-]+\.\w{2,}|[\w-]+\.(?:com|in|co\.in|net|org))/i;
  for (const line of lines) {
    const match = line.text.match(webRegex);
    if (match) {
      return {
        value: match[0],
        confidence: line.confidence * 0.9,
        boundingBoxId: line.boundingBox.id,
      };
    }
  }
  return null;
}

/**
 * Layer 2: LLM Extraction Fallback
 *
 * If EXTRACTION_PROVIDER=gemini and GEMINI_API_KEY is configured,
 * and heuristic Layer 1 extracted < 4 declarations or has low confidence,
 * call Gemini 1.5 Flash to extract declarations from raw OCR text.
 */
export async function extractFieldsWithLLMFallback(
  ocrResult: OcrResult,
  viewLabel: string
): Promise<ExtractedField[]> {
  // Layer 1: Heuristic regex extraction (instant, zero cost, deterministic)
  const layer1Fields = extractFields(ocrResult, viewLabel);

  const apiKey = process.env.GEMINI_API_KEY;
  const provider = process.env.EXTRACTION_PROVIDER || (apiKey ? 'gemini' : 'heuristic');

  // If not configured or not using gemini, return Layer 1
  if (provider !== 'gemini' || !apiKey) {
    return layer1Fields;
  }

  // Check if Layer 2 is needed:
  // If fewer than 4 fields found OR any field has low confidence (< 0.70)
  const needsFallback = layer1Fields.length < 4 || layer1Fields.some(f => f.confidence < 0.70);
  if (!needsFallback || !ocrResult.rawText || ocrResult.rawText.trim().length < 10) {
    return layer1Fields;
  }

  try {
    const prompt = `You are a Legal Metrology AI assistant specialized in Indian Packaged Commodities Rules.
Extract mandatory packaging declarations from the following raw OCR text.
Return ONLY a valid JSON object with the following optional keys (omit or set to null if not present):
- mrp: string (e.g. "Rs. 250.00 incl. of all taxes" or "250")
- net_quantity: string (e.g. "500 g", "1 kg", "200 ml")
- manufacturer: string (name and address of manufacturer or packer)
- consumer_care: string (helpline phone number, email, address)
- date_of_manufacture: string (month and year, e.g. "04/2024" or "Apr 2024")
- best_before: string (e.g. "12 months from mfg", "best before 05/2025")
- country_of_origin: string (e.g. "India", "Made in India")
- generic_name: string (common name of commodity)

Raw OCR Text:
"""
${ocrResult.rawText}
"""`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      console.warn(`[Gemini LLM] API error ${response.status}: ${response.statusText}`);
      return layer1Fields;
    }

    const data: any = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return layer1Fields;

    const parsed = JSON.parse(candidateText);
    const merged: ExtractedField[] = [...layer1Fields];

    const keys: FieldName[] = [
      'mrp', 'net_quantity', 'manufacturer', 'consumer_care',
      'date_of_manufacture', 'best_before', 'country_of_origin', 'generic_name'
    ];

    for (const key of keys) {
      const val = parsed[key];
      if (typeof val === 'string' && val.trim().length > 0) {
        const existingIdx = merged.findIndex(f => f.fieldName === key);
        if (existingIdx === -1) {
          const matchingLine = ocrResult.lines.find(l =>
            l.text.toLowerCase().includes(val.toLowerCase().slice(0, 8))
          );
          merged.push({
            fieldName: key,
            displayName: EXTRACTION_PATTERNS.find(p => p.fieldName === key)?.displayName || key,
            value: val.trim(),
            confidence: 0.85,
            confidenceLevel: 'MEDIUM',
            boundingBoxId: matchingLine ? matchingLine.boundingBox.id : `bbox-llm-${key}`,
            sourceView: viewLabel,
          });
        } else if (merged[existingIdx].confidence < 0.70) {
          merged[existingIdx].value = val.trim();
          merged[existingIdx].confidence = 0.85;
          merged[existingIdx].confidenceLevel = 'MEDIUM';
        }
      }
    }

    return merged;
  } catch (err) {
    console.warn('[Gemini LLM] Fallback error, returning heuristic extraction:', err);
    return layer1Fields;
  }
}
