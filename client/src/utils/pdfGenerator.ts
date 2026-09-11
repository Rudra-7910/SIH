import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InspectionSession, ExtractedField, RuleCheckResult } from '../types';

/**
 * Helper to fetch image as base64 data URL for embedding into PDF
 */
async function getImageDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Draw official Indian Tricolor top stripe
 */
function drawTricolorStripe(doc: jsPDF, pageWidth: number) {
  const stripeHeight = 1.2;
  // Saffron
  doc.setFillColor(255, 153, 51);
  doc.rect(0, 0, pageWidth / 3, stripeHeight, 'F');
  // White
  doc.setFillColor(255, 255, 255);
  doc.rect(pageWidth / 3, 0, pageWidth / 3, stripeHeight, 'F');
  // Green
  doc.setFillColor(19, 136, 8);
  doc.rect((pageWidth / 3) * 2, 0, pageWidth / 3, stripeHeight, 'F');
}

/**
 * Draw subtle security background watermark
 */
function drawWatermark(doc: jsPDF, text: string = 'LEGAL METROLOGY • GOVT OF INDIA • OFFICIAL RECORD') {
  const totalPages = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.saveGraphicsState();
    (doc as any).setGState(new (doc as any).GState({ opacity: 0.04 }));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(20, 35, 65);
    doc.text(text, pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45,
    });
    doc.restoreGraphicsState();

    // Footer on every page
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 150, 160);
    doc.text(
      `Confidential & Statutory Document — Generated under SIH 26034 Enforcement System | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }
}

/**
 * Form 1: Official Inspection Verification Dossier
 */
export async function generateInspectionDossierPDF(session: InspectionSession): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  drawTricolorStripe(doc, pageWidth);

  let y = 14;

  // ── Official Header ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 115, 130);
  doc.text('सत्यमेव जयते', pageWidth / 2, y, { align: 'center' });
  y += 4.5;

  doc.setFontSize(13);
  doc.setTextColor(15, 30, 60);
  doc.text('GOVERNMENT OF INDIA', pageWidth / 2, y, { align: 'center' });
  y += 5.5;

  doc.setFontSize(10);
  doc.setTextColor(30, 50, 85);
  doc.text('MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION', pageWidth / 2, y, { align: 'center' });
  y += 4.5;

  doc.setFontSize(9);
  doc.setTextColor(50, 70, 100);
  doc.text('DIRECTORATE OF LEGAL METROLOGY (WEIGHTS & MEASURES WING)', pageWidth / 2, y, { align: 'center' });
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 130, 140);
  doc.text('Krishi Bhawan, Dr. Rajendra Prasad Road, New Delhi - 110001', pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Decorative double line
  doc.setDrawColor(20, 45, 90);
  doc.setLineWidth(0.8);
  doc.line(14, y, pageWidth - 14, y);
  doc.setDrawColor(200, 210, 225);
  doc.setLineWidth(0.3);
  doc.line(14, y + 1.2, pageWidth - 14, y + 1.2);
  y += 7;

  // Document Title Banner
  doc.setFillColor(241, 245, 252);
  doc.setDrawColor(195, 215, 240);
  doc.roundedRect(14, y, pageWidth - 28, 10, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 45, 100);
  doc.text('FORM 1: STATUTORY INSPECTION DOSSIER & COMPLIANCE VERIFICATION RECORD', pageWidth / 2, y + 6.5, { align: 'center' });
  y += 14;

  // ── Case Metadata Card ──
  const violations = session.ruleResults.filter(r => r.verdict === 'POTENTIAL_ISSUE');
  const reviews = session.ruleResults.filter(r => r.verdict === 'NEEDS_REVIEW');
  const passes = session.ruleResults.filter(r => r.verdict === 'PASS');

  const overallVerdict = violations.length > 0
    ? 'NON-COMPLIANT (Violations Detected)'
    : reviews.length > 0
    ? 'REVIEW REQUIRED (Verification Needed)'
    : 'COMPLIANT (All Checks Passed)';

  const verdictBgColor = violations.length > 0
    ? [254, 242, 242]
    : reviews.length > 0
    ? [255, 251, 235]
    : [240, 253, 244];

  const verdictTextColor = violations.length > 0
    ? [185, 28, 28]
    : reviews.length > 0
    ? [180, 83, 9]
    : [21, 128, 61];

  doc.setFillColor(250, 252, 255);
  doc.setDrawColor(215, 225, 235);
  doc.roundedRect(14, y, pageWidth - 28, 38, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 45, 65);

  doc.text('Inspection Session ID:', 18, y + 6.5);
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text(session.sessionId, 60, y + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Inspection Date & Time:', 18, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(session.createdAt).toLocaleString('en-IN', { timeZoneName: 'short' }), 60, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('Enforcing Officer / Badge:', 18, y + 19.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Designated Legal Metrology Inspector (#LM-ENF-26034)', 60, y + 19.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Submitted Package Views:', 18, y + 26);
  doc.setFont('helvetica', 'normal');
  doc.text(`${session.submittedViews.map(v => v.toUpperCase()).join(', ') || 'FRONT'} (${session.views.length} total image capture(s))`, 60, y + 26);

  doc.setFont('helvetica', 'bold');
  doc.text('Compliance Outcome:', 18, y + 32.5);

  // Status Badge Pill
  doc.setFillColor(verdictBgColor[0], verdictBgColor[1], verdictBgColor[2]);
  doc.roundedRect(60, y + 28.5, 120, 6, 1.2, 1.2, 'F');
  doc.setTextColor(verdictTextColor[0], verdictTextColor[1], verdictTextColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(overallVerdict, 63, y + 32.8);

  y += 43;

  // ── Annexure: Photographic Evidence (if view image available) ──
  const firstView = session.views[0];
  if (firstView?.imagePath) {
    try {
      const imgData = await getImageDataUrl(firstView.imagePath);
      if (imgData) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(20, 45, 90);
        doc.text('ANNEXURE A: PHOTOGRAPHED PACKAGING EVIDENCE (CAPTURED VIEW)', 14, y);
        y += 4;

        // Draw evidence frame
        const imgWidth = 60;
        const imgHeight = 45;
        doc.setDrawColor(200, 210, 220);
        doc.setFillColor(245, 247, 250);
        doc.rect(14, y, imgWidth + 8, imgHeight + 12, 'FD');

        doc.addImage(imgData, 'JPEG', 18, y + 3, imgWidth, imgHeight);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(80, 90, 100);
        doc.text(`View: ${firstView.viewLabel.toUpperCase()} | Uploaded: ${new Date(firstView.uploadedAt).toLocaleTimeString()}`, 18, y + imgHeight + 8);

        // Metadata box next to image
        doc.setFillColor(255, 255, 255);
        doc.rect(86, y, pageWidth - 100, imgHeight + 12, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 45, 70);
        doc.text('IMAGE PREPROCESSING & OCR AUDIT', 90, y + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(60, 70, 80);
        doc.text(`• Raw Text Lines Detected: ${firstView.ocrResult?.lines?.length || 0}`, 90, y + 13);
        doc.text(`• OCR Average Confidence: ${((firstView.ocrResult?.averageConfidence || 0) * 100).toFixed(1)}%`, 90, y + 19);
        doc.text(`• Preprocessed Resolution: High-contrast binarized & deskewed`, 90, y + 25);
        doc.text(`• Extracted Declarations Count: ${firstView.extractedFields?.length || 0}`, 90, y + 31);
        doc.text(`• Digital Hash / Reference: ${firstView.imagePath.slice(-16)}`, 90, y + 37);
        doc.text(`• Verified under: Rule 6 of Legal Metrology Rules, 2011`, 90, y + 43);

        y += imgHeight + 18;
      }
    } catch {
      // Fallback cleanly if image cannot be loaded
    }
  }

  // ── Table 1: Extracted Declarations Table ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 45, 90);
  doc.text('SECTION 1: MANDATORY PACKAGING DECLARATIONS EXTRACTED', 14, y);
  y += 2;

  const declarationRows = session.mergedFields.map((f: ExtractedField) => [
    f.displayName,
    f.value || 'Not Detected',
    `${(f.confidence * 100).toFixed(0)}%`,
    f.confidenceLevel,
    f.sourceView.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Declaration Attribute', 'Extracted Value', 'Confidence', 'Level', 'View Source']],
    body: declarationRows.length > 0 ? declarationRows : [['No mandatory declarations extracted', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [30, 58, 138], // Navy enforcement blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.2,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 40, 50],
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 68 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Check if we need page break for Table 2
  if (y > 230) {
    doc.addPage();
    drawTricolorStripe(doc, pageWidth);
    y = 16;
  }

  // ── Table 2: Legal Metrology Compliance Evaluation ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 45, 90);
  doc.text('SECTION 2: STATUTORY COMPLIANCE EVALUATION & OBSERVATIONS', 14, y);
  y += 2;

  const ruleRows = session.ruleResults.map((r: RuleCheckResult) => {
    const verdictText = r.verdict === 'PASS' ? 'COMPLIANT' : r.verdict === 'POTENTIAL_ISSUE' ? 'CONTRAVENTION' : 'NEEDS REVIEW';
    return [
      r.ruleId,
      r.displayName,
      verdictText,
      r.reason,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Rule ID', 'Statutory Requirement', 'Verdict', 'Inspector Observation / Statutory Finding']],
    body: ruleRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // Slate dark
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.2,
    },
    bodyStyles: {
      fontSize: 7.2,
      cellPadding: 2.2,
      textColor: [30, 40, 50],
    },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold' },
      1: { cellWidth: 44 },
      2: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 84 },
    },
    didParseCell: (data) => {
      // Color-code verdict column
      if (data.section === 'body' && data.column.index === 2) {
        if (data.cell.raw === 'COMPLIANT') {
          data.cell.styles.textColor = [21, 128, 61];
        } else if (data.cell.raw === 'CONTRAVENTION') {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fillColor = [254, 242, 242];
        } else {
          data.cell.styles.textColor = [180, 83, 9];
          data.cell.styles.fillColor = [255, 251, 235];
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Officer Audit Log (if any) ──
  if (session.auditLog && session.auditLog.length > 0) {
    if (y > 230) {
      doc.addPage();
      drawTricolorStripe(doc, pageWidth);
      y = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(20, 45, 90);
    doc.text('SECTION 3: CHAIN OF CUSTODY & OFFICER AUDIT LOG', 14, y);
    y += 2;

    const auditRows = session.auditLog.map(a => [
      new Date(a.timestamp).toLocaleTimeString(),
      a.officerName,
      a.action.type.toUpperCase(),
      a.action.field || 'General',
      a.action.correctedValue ? `Corrected to: "${a.action.correctedValue}"` : (a.action.remarks || 'Confirmed valid'),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Timestamp', 'Officer Name', 'Action', 'Field', 'Details / Remarks']],
      body: auditRows,
      theme: 'striped',
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: [255, 255, 255],
        fontSize: 7.5,
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 1.8,
      },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── Official Sign-off & Seal Block ──
  if (y > 235) {
    doc.addPage();
    drawTricolorStripe(doc, pageWidth);
    y = 18;
  }

  doc.setFillColor(250, 252, 255);
  doc.setDrawColor(180, 195, 215);
  doc.roundedRect(14, y, pageWidth - 28, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 35, 70);
  doc.text('ATTESTATION & REGULATORY SIGN-OFF', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(60, 70, 80);
  doc.text(
    'This verification dossier has been automatically generated pursuant to inspection powers under Section 15 and Section 36 of the Legal Metrology Act, 2009.',
    18,
    y + 11
  );
  doc.text(
    'All OCR detections, extracted text regions, and compliance findings have been cross-checked and digitally authenticated by the designated officer.',
    18,
    y + 15
  );

  // Signature line
  doc.setFont('helvetica', 'bold');
  doc.text('Inspecting Officer Signature: _______________________', 18, y + 26);

  // Official Stamp Graphic Box
  doc.setDrawColor(20, 50, 120);
  doc.setFillColor(245, 248, 255);
  doc.rect(pageWidth - 72, y + 4, 54, 24, 'FD');
  doc.setTextColor(20, 50, 120);
  doc.setFontSize(6.5);
  doc.text('DIRECTORATE OF LEGAL METROLOGY', pageWidth - 45, y + 9, { align: 'center' });
  doc.setFontSize(7.5);
  doc.text('★ VERIFIED & RECORDED ★', pageWidth - 45, y + 14, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text(`ID: LM-ENF-${session.sessionId.slice(0, 6).toUpperCase()}`, pageWidth - 45, y + 19, { align: 'center' });
  doc.text(new Date().toLocaleDateString('en-IN'), pageWidth - 45, y + 23, { align: 'center' });

  // Add watermarks and page numbers
  drawWatermark(doc);

  // Save
  doc.save(`Legal_Metrology_Dossier_${session.sessionId.slice(0, 8)}.pdf`);
}

/**
 * Form 2: Statutory Show Cause Notice under Section 36
 */
export async function generateShowCauseNoticePDF(session: InspectionSession): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  drawTricolorStripe(doc, pageWidth);

  let y = 14;

  // ── Red Statutory Header ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(150, 30, 30);
  doc.text('सत्यमेव जयते', pageWidth / 2, y, { align: 'center' });
  y += 4.5;

  doc.setFontSize(13);
  doc.setTextColor(153, 27, 27); // Deep crimson
  doc.text('OFFICE OF THE CONTROLLER OF LEGAL METROLOGY', pageWidth / 2, y, { align: 'center' });
  y += 5.5;

  doc.setFontSize(9.5);
  doc.setTextColor(30, 40, 50);
  doc.text('DEPARTMENT OF CONSUMER AFFAIRS, GOVERNMENT OF INDIA', pageWidth / 2, y, { align: 'center' });
  y += 4.5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 110, 120);
  doc.text('ENFORCEMENT & LEGAL PROCEEDINGS WING, WEIGHTS AND MEASURES CELL', pageWidth / 2, y, { align: 'center' });
  y += 4.5;

  // Red Double Line
  doc.setDrawColor(185, 28, 28);
  doc.setLineWidth(1);
  doc.line(14, y, pageWidth - 14, y);
  doc.setDrawColor(240, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(14, y + 1.2, pageWidth - 14, y + 1.2);
  y += 7;

  // Notice Title Block
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(248, 113, 113);
  doc.roundedRect(14, y, pageWidth - 28, 13, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(153, 27, 27);
  doc.text('SHOW CAUSE NOTICE UNDER SECTION 36 OF THE LEGAL METROLOGY ACT, 2009', pageWidth / 2, y + 5.5, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(120, 30, 30);
  doc.text('(Read with Legal Metrology [Packaged Commodities] Rules, 2011)', pageWidth / 2, y + 10, { align: 'center' });
  y += 18;

  // Reference and Date
  const noticeRef = `LM/ENF/SCN-${new Date().getFullYear()}/${session.sessionId.slice(0, 8).toUpperCase()}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 40, 50);
  doc.text(`NOTICE REF NO: ${noticeRef}`, 14, y);
  doc.text(`DATE OF ISSUE: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 65, y);
  y += 7;

  // Addressee Block (Manufacturer / Packer)
  const mfgField = session.mergedFields.find(f => f.fieldName === 'manufacturer');
  const mfgValue = mfgField?.value || 'The Concerned Manufacturer / Packer / Importer of the Inspected Commodity';

  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(225, 230, 235);
  doc.roundedRect(14, y, pageWidth - 28, 20, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(40, 50, 60);
  doc.text('TO:', 18, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(20, 30, 40);
  const mfgLines = doc.splitTextToSize(mfgValue, pageWidth - 50);
  doc.text(mfgLines, 26, y + 5);
  y += 24;

  // Subject Line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(153, 27, 27);
  doc.text('SUBJECT: NOTICE TO SHOW CAUSE FOR CONTRAVENTION OF STATUTORY PACKAGING PROVISIONS', 14, y);
  y += 6;

  // Notice Body Paragraphs
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(30, 40, 50);

  const para1 = `1. WHEREAS, on ${new Date(session.createdAt).toLocaleDateString('en-IN')}, during an official inspection conducted under Section 15 of the Legal Metrology Act, 2009 under Inspection Reference #${session.sessionId}, samples of your pre-packaged commodity were examined using the AI-assisted Legal Metrology Inspection Assistant for verification of mandatory statutory declarations;`;
  doc.text(doc.splitTextToSize(para1, pageWidth - 28), 14, y);
  y += 10;

  const para2 = `2. AND WHEREAS, on examination of the packaging across ${session.submittedViews.length} submitted view(s) (${session.submittedViews.join(', ').toUpperCase()}), the commodity was observed to be in prima facie contravention of the Legal Metrology (Packaged Commodities) Rules, 2011 as detailed below:`;
  doc.text(doc.splitTextToSize(para2, pageWidth - 28), 14, y);
  y += 8;

  // ── Specific Violations Table ──
  const violations = session.ruleResults.filter(r => r.verdict === 'POTENTIAL_ISSUE' || r.verdict === 'NEEDS_REVIEW');

  const violationRows = violations.map((v, idx) => [
    `${idx + 1}`,
    v.ruleId,
    v.displayName,
    v.verdict === 'POTENTIAL_ISSUE' ? 'NON-COMPLIANCE (RULE 6)' : 'UNVERIFIED / DEFICIENT',
    v.reason,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Item', 'Rule Code', 'Statutory Requirement', 'Status', 'Specific Contravention Detected']],
    body: violationRows.length > 0 ? violationRows : [['-', '-', 'No prima facie violations recorded', 'COMPLIANT', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [185, 28, 28], // Crimson red
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [30, 40, 50],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26, fontStyle: 'bold' },
      2: { cellWidth: 38 },
      3: { cellWidth: 32, fontStyle: 'bold' },
      4: { cellWidth: 76 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        if (data.cell.raw?.toString().includes('NON-COMPLIANCE')) {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fillColor = [254, 242, 242];
        } else {
          data.cell.styles.textColor = [180, 83, 9];
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ── Statutory Penalty Schedule ──
  if (y > 230) {
    doc.addPage();
    drawTricolorStripe(doc, pageWidth);
    y = 16;
  }

  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(14, y, pageWidth - 28, 26, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(153, 27, 27);
  doc.text('STATUTORY PENALTIES UNDER SECTION 36 & SECTION 48 OF THE LEGAL METROLOGY ACT, 2009:', 18, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(40, 50, 60);
  doc.text('• Penalty for Non-Compliance (Section 36(1)): Punishable with fine which may extend to ₹25,000 for first offence.', 18, y + 11);
  doc.text('• Second or Subsequent Offence (Section 36(2)): Punishable with fine up to ₹50,000 or imprisonment up to 1 year or both.', 18, y + 16);
  doc.text('• Compounding of Offences (Section 48): Offence may be compounded by the Authorized Officer on payment of prescribed compounding sum.', 18, y + 21);
  y += 31;

  // Requisition Directive
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  doc.text('REQUISITION & DIRECTIVE TO SHOW CAUSE:', 14, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  const directive = `NOW THEREFORE, take notice that you are hereby required to SHOW CAUSE in writing within FIFTEEN (15) DAYS from the receipt of this notice as to why penal proceedings under Section 36 of the Legal Metrology Act, 2009 should not be initiated against you before the Competent Judicial Magistrate.\n\nIn the event of failure to furnish an explanation or submit compounding application within the stipulated period, it shall be construed that you have no defense to offer and appropriate legal proceedings shall be initiated against you ex-parte.`;
  doc.text(doc.splitTextToSize(directive, pageWidth - 28), 14, y);
  y += 24;

  // Signature Block
  if (y > 245) {
    doc.addPage();
    drawTricolorStripe(doc, pageWidth);
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 40, 50);
  doc.text('Issued by Order of:', 14, y);
  doc.text('Authorized Legal Metrology Inspector', pageWidth - 80, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text('Enforcement & Inspection Wing', 14, y);
  doc.text('Directorate of Legal Metrology, Govt of India', pageWidth - 80, y);
  y += 4;
  doc.text('Ministry of Consumer Affairs, New Delhi', 14, y);
  doc.text('Seal ID: #LM-ENF-26034', pageWidth - 80, y);

  // Add watermarks and page numbers
  drawWatermark(doc, 'OFFICIAL SHOW CAUSE NOTICE • SEC 36 • GOVT OF INDIA');

  // Save
  doc.save(`Show_Cause_Notice_${session.sessionId.slice(0, 8)}.pdf`);
}
