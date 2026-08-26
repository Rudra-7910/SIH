const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

const generateComplianceReport = async (scan) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const fontSize = 12;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Header
  page.drawText('LabelCheck Compliance Report', { x: 50, y: height - 50, size: 20, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
  
  // Product Info
  page.drawText(`Scan ID: ${scan._id}`, { x: 50, y: height - 80, size: 10, font });
  page.drawText(`Date: ${new Date(scan.createdAt).toLocaleDateString()}`, { x: 50, y: height - 95, size: 10, font });
  
  page.drawText(`Compliance Status: ${scan.complianceStatus}`, { x: 50, y: height - 120, size: 14, font: boldFont, color: scan.complianceStatus === 'COMPLIANT' ? rgb(0.1, 0.7, 0.3) : rgb(0.9, 0.2, 0.2) });
  page.drawText(`Risk Score: ${scan.riskScore}/100`, { x: 300, y: height - 120, size: 14, font: boldFont });

  // Extracted Declarations
  page.drawText('Extracted Declarations:', { x: 50, y: height - 150, size: 14, font: boldFont });
  
  let yPos = height - 170;
  scan.declarations.forEach(decl => {
    const status = decl.found ? 'FOUND' : 'MISSING';
    const color = decl.found ? rgb(0.1, 0.7, 0.3) : rgb(0.9, 0.2, 0.2);
    page.drawText(`${decl.field.toUpperCase()}:`, { x: 50, y: yPos, size: 10, font: boldFont });
    page.drawText(`[${status}]`, { x: 180, y: yPos, size: 10, font: boldFont, color });
    page.drawText(decl.value ? (decl.value.length > 50 ? decl.value.substring(0, 50) + '...' : decl.value) : 'N/A', { x: 240, y: yPos, size: 10, font });
    yPos -= 20;
  });

  // Notes
  if (scan.notes) {
    yPos -= 20;
    page.drawText('Officer Notes:', { x: 50, y: yPos, size: 12, font: boldFont });
    yPos -= 20;
    page.drawText(scan.notes.length > 100 ? scan.notes.substring(0, 100) + '...' : scan.notes, { x: 50, y: yPos, size: 10, font });
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

module.exports = {
  generateComplianceReport
};
