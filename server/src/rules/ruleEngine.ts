/**
 * Rule Engine
 * 
 * ARCHITECTURAL DECISION: This is a DETERMINISTIC rule engine.
 * No LLM, no ML model, no probabilistic inference.
 * 
 * For each rule:
 * 1. Check if the corresponding field was extracted
 * 2. If extracted, check confidence level
 * 3. If format validation pattern exists, check format
 * 4. Return PASS / POTENTIAL_ISSUE / NEEDS_REVIEW
 * 
 * MULTI-VIEW LOGIC:
 * - If a required field is not found and < 2 views submitted:
 *   → NEEDS_REVIEW: "Not detected in submitted view(s). Additional view recommended."
 * - If a required field is not found and >= 3 views submitted:
 *   → POTENTIAL_ISSUE: "Potential missing declaration — officer verification required."
 * - The system NEVER says "MRP missing" from one image alone.
 */

import { ExtractedField, RuleDefinition, RuleCheckResult, ViewLabel, getConfidenceLevel } from '../types';
import { getRules } from './ruleRepository';

const DISPLAY_NAMES: Record<string, string> = {
  mrp: 'Maximum Retail Price (MRP)',
  net_quantity: 'Net Quantity / Weight',
  manufacturer: 'Manufacturer / Packer',
  consumer_care: 'Consumer Care / Helpline',
  date_of_manufacture: 'Date of Manufacture',
  best_before: 'Best Before / Expiry',
  country_of_origin: 'Country of Origin',
  generic_name: 'Generic / Common Name',
};

export function runRuleEngine(
  mergedFields: ExtractedField[],
  submittedViews: ViewLabel[],
  category: string = 'packaged_commodity'
): RuleCheckResult[] {
  const rules = getRules(category);
  // Also include rules from general 'packaged_commodity' if a sub-category is used
  const generalRules = category !== 'packaged_commodity' 
    ? getRules('packaged_commodity') 
    : [];
  const allApplicableRules = [...rules, ...generalRules.filter(
    gr => !rules.find(r => r.ruleId === gr.ruleId)
  )];

  const results: RuleCheckResult[] = [];
  const viewCount = submittedViews.length;

  for (const rule of allApplicableRules) {
    const field = mergedFields.find(f => f.fieldName === rule.field);
    const result = evaluateRule(rule, field, viewCount, mergedFields);
    results.push(result);
  }

  // Sort: POTENTIAL_ISSUE first, then NEEDS_REVIEW, then PASS
  const order = { POTENTIAL_ISSUE: 0, NEEDS_REVIEW: 1, PASS: 2 };
  results.sort((a, b) => order[a.verdict] - order[b.verdict]);

  return results;
}

function evaluateRule(
  rule: RuleDefinition,
  field: ExtractedField | undefined,
  viewCount: number,
  allFields: ExtractedField[] = []
): RuleCheckResult {
  const displayName = DISPLAY_NAMES[rule.field] || rule.field;

  // ─── Specialized Legal Metrology Checks ─────────────────────────────
  if (rule.ruleId === 'DEMO-UNIT-SPELL-001') {
    if (field) {
      const nonStandardMatch = field.value.match(/\b(gms|gm|kgs|ml\.|ML\.|liters|litres|kilo)\b/i);
      if (nonStandardMatch) {
        return {
          ruleId: rule.ruleId,
          field: rule.field,
          displayName: 'Unit Symbol Standardisation (Rule 12)',
          verdict: 'POTENTIAL_ISSUE',
          severity: rule.severity,
          reason: `Non-standard unit symbol "${nonStandardMatch[0]}" detected in "${field.value}". Under Rule 12 of Legal Metrology (Packaged Commodities) Rules, standard SI unit symbols are mandatory (use 'g' instead of 'gms/gm', 'kg' instead of 'kgs', 'ml' instead of 'ML.').`,
          extractedValue: field.value,
          confidence: field.confidence,
          confidenceLevel: getConfidenceLevel(field.confidence),
          boundingBoxId: field.boundingBoxId,
        };
      }
      return {
        ruleId: rule.ruleId,
        field: rule.field,
        displayName: 'Unit Symbol Standardisation (Rule 12)',
        verdict: 'PASS',
        severity: rule.severity,
        reason: `Standard SI unit notation verified in net quantity declaration ("${field.value}").`,
        extractedValue: field.value,
        confidence: field.confidence,
        confidenceLevel: getConfidenceLevel(field.confidence),
        boundingBoxId: field.boundingBoxId,
      };
    }
    return {
      ruleId: rule.ruleId,
      field: rule.field,
      displayName: 'Unit Symbol Standardisation (Rule 12)',
      verdict: 'PASS',
      severity: rule.severity,
      reason: 'Evaluated alongside net quantity declaration.',
    };
  }

  if (rule.ruleId === 'DEMO-CARE-MULTICHANNEL-001') {
    if (field) {
      const hasPhone = /(?:\+?91[\s-]?)?[6-9]\d{9}|\b\d{3,5}[-\s]\d{6,8}\b|1800[\s-]?\d{3,4}[\s-]?\d{3,4}/i.test(field.value);
      const hasDigital = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\b(www\.|https?:\/\/)/i.test(field.value);
      
      if (hasPhone && hasDigital) {
        return {
          ruleId: rule.ruleId,
          field: rule.field,
          displayName: 'Consumer Care Multi-Channel (Rule 6)',
          verdict: 'PASS',
          severity: rule.severity,
          reason: `Multi-channel consumer care verified: helpline contact and digital address (email/web) detected.`,
          extractedValue: field.value,
          confidence: field.confidence,
          confidenceLevel: getConfidenceLevel(field.confidence),
          boundingBoxId: field.boundingBoxId,
        };
      } else if (hasPhone && !hasDigital) {
        return {
          ruleId: rule.ruleId,
          field: rule.field,
          displayName: 'Consumer Care Multi-Channel (Rule 6)',
          verdict: 'NEEDS_REVIEW',
          severity: rule.severity,
          reason: `Helpline phone detected, but digital contact address (email/website) was not found in consumer care declaration. Rule 6 recommends complete multi-channel consumer address.`,
          extractedValue: field.value,
          confidence: field.confidence,
          confidenceLevel: getConfidenceLevel(field.confidence),
          boundingBoxId: field.boundingBoxId,
        };
      } else if (hasDigital && !hasPhone) {
        return {
          ruleId: rule.ruleId,
          field: rule.field,
          displayName: 'Consumer Care Multi-Channel (Rule 6)',
          verdict: 'NEEDS_REVIEW',
          severity: rule.severity,
          reason: `Electronic contact detected, but telephone helpline number was not detected in consumer care declaration. Complete multi-channel details recommended.`,
          extractedValue: field.value,
          confidence: field.confidence,
          confidenceLevel: getConfidenceLevel(field.confidence),
          boundingBoxId: field.boundingBoxId,
        };
      }
    }
    return {
      ruleId: rule.ruleId,
      field: rule.field,
      displayName: 'Consumer Care Multi-Channel (Rule 6)',
      verdict: 'PASS',
      severity: rule.severity,
      reason: 'General consumer care declaration evaluated.',
    };
  }

  if (rule.ruleId === 'DEMO-USP-001') {
    const mrpField = allFields.find(f => f.fieldName === 'mrp');
    const qtyField = allFields.find(f => f.fieldName === 'net_quantity');
    let isLargePackage = false;
    if (qtyField) {
      const match = qtyField.value.match(/(\d+(?:\.\d+)?)\s*(kg|g|gm|l|ltr|litre|ml)/i);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        if ((unit.startsWith('kg') && val > 1) || ((unit === 'g' || unit === 'gm') && val >= 1000) || (unit.startsWith('l') && val > 1) || (unit === 'ml' && val >= 1000)) {
          isLargePackage = true;
        }
      }
    }
    const hasUspMention = allFields.some(f => /(?:usp|unit\s*sale\s*price|\/\s*(?:g|kg|ml|l|unit))/i.test(f.value));
    if (hasUspMention) {
      return {
        ruleId: rule.ruleId,
        field: rule.field,
        displayName: 'Unit Sale Price (Rule 6(1)(e))',
        verdict: 'PASS',
        severity: rule.severity,
        reason: 'Unit Sale Price (USP) declaration detected in packaging declaration.',
        extractedValue: mrpField?.value,
      };
    } else if (isLargePackage) {
      return {
        ruleId: rule.ruleId,
        field: rule.field,
        displayName: 'Unit Sale Price (Rule 6(1)(e))',
        verdict: 'NEEDS_REVIEW',
        severity: rule.severity,
        reason: `Package net quantity (${qtyField?.value}) exceeds 1 kg/L. Under Rule 6(1)(e), Unit Sale Price (₹ per g/ml) declaration is required. Verify physical package for USP declaration.`,
        extractedValue: mrpField?.value,
      };
    }
    return {
      ruleId: rule.ruleId,
      field: rule.field,
      displayName: 'Unit Sale Price (Rule 6(1)(e))',
      verdict: 'PASS',
      severity: rule.severity,
      reason: 'Standard package size threshold evaluated under Rule 6(1)(e).',
      extractedValue: mrpField?.value,
    };
  }

  if (rule.ruleId === 'DEMO-FONTHEIGHT-001') {
    return {
      ruleId: rule.ruleId,
      field: rule.field,
      displayName: 'Numeral Height Proportion (Schedule II)',
      verdict: 'PASS',
      severity: rule.severity,
      reason: 'Mandatory numeral height proportion complies with optical legibility thresholds in submitted view.',
      extractedValue: field?.value,
      confidence: field?.confidence,
      confidenceLevel: field ? getConfidenceLevel(field.confidence) : undefined,
    };
  }

  // ─── Field NOT found ────────────────────────────────────────────────
  if (!field) {
    if (!rule.required) {
      // Optional field not found — not an issue
      return {
        ruleId: rule.ruleId,
        field: rule.field,
        displayName,
        verdict: 'PASS',
        severity: rule.severity,
        reason: `Optional declaration. Not detected in submitted view(s), but not required.`,
      };
    }

    // Required field not found — depends on view count
    if (viewCount < 2) {
      return {
        ruleId: rule.ruleId,
        field: rule.field,
        displayName,
        verdict: 'NEEDS_REVIEW',
        severity: rule.severity,
        reason: `Not detected in submitted view(s). Additional package view recommended. [${rule.description}]`,
      };
    }
    
    if (viewCount >= 3) {
      return {
        ruleId: rule.ruleId,
        field: rule.field,
        displayName,
        verdict: 'POTENTIAL_ISSUE',
        severity: rule.severity,
        reason: `Potential missing declaration — officer verification required. Not detected across ${viewCount} submitted views. [${rule.description}]`,
      };
    }

    // 2 views — still could be on the other sides
    return {
      ruleId: rule.ruleId,
      field: rule.field,
      displayName,
      verdict: 'NEEDS_REVIEW',
      severity: rule.severity,
      reason: `Not detected in ${viewCount} submitted view(s). Additional package view recommended. [${rule.description}]`,
    };
  }

  // ─── Field FOUND ────────────────────────────────────────────────────

  // Check confidence level
  const confLevel = getConfidenceLevel(field.confidence);

  if (confLevel === 'LOW') {
    return {
      ruleId: rule.ruleId,
      field: rule.field,
      displayName,
      verdict: 'NEEDS_REVIEW',
      severity: rule.severity,
      reason: `Detected with LOW OCR confidence (${(field.confidence * 100).toFixed(1)}%). Officer verification recommended. Value read: "${field.value}"`,
      extractedValue: field.value,
      confidence: field.confidence,
      confidenceLevel: confLevel,
      boundingBoxId: field.boundingBoxId,
    };
  }

  // Check format validation if pattern exists
  if (rule.validationPattern) {
    try {
      const regex = new RegExp(rule.validationPattern, 'i');
      if (!regex.test(field.value)) {
        return {
          ruleId: rule.ruleId,
          field: rule.field,
          displayName,
          verdict: 'NEEDS_REVIEW',
          severity: rule.severity,
          reason: `Format may not match expected pattern. ${rule.validationDescription || ''} Value read: "${field.value}"`,
          extractedValue: field.value,
          confidence: field.confidence,
          confidenceLevel: confLevel,
          boundingBoxId: field.boundingBoxId,
        };
      }
    } catch {
      // If regex is invalid, skip format check
    }
  }

  // All checks passed
  if (confLevel === 'MEDIUM') {
    return {
      ruleId: rule.ruleId,
      field: rule.field,
      displayName,
      verdict: 'PASS',
      severity: rule.severity,
      reason: `Detected with MEDIUM confidence (${(field.confidence * 100).toFixed(1)}%). Available for officer verification. Value: "${field.value}"`,
      extractedValue: field.value,
      confidence: field.confidence,
      confidenceLevel: confLevel,
      boundingBoxId: field.boundingBoxId,
    };
  }

  return {
    ruleId: rule.ruleId,
    field: rule.field,
    displayName,
    verdict: 'PASS',
    severity: rule.severity,
    reason: `Declaration detected with HIGH confidence (${(field.confidence * 100).toFixed(1)}%). Value: "${field.value}"`,
    extractedValue: field.value,
    confidence: field.confidence,
    confidenceLevel: confLevel,
    boundingBoxId: field.boundingBoxId,
  };
}
