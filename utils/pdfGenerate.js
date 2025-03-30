const { jsPDF } = require("jspdf");

const generatePDF = (data, reportType) => {
  const doc = new jsPDF();

  /**Page dimensions (A4 size: 210mm x 297mm) */
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 20; // Margin from top and bottom
  const maxY = pageHeight - margin; // Maximum y position before needing a new page
  const lineHeight = 10; // Height of each row
  const headerHeight = 50; // Starting y position for headers

  /**Function to add headers on each page*/
  const addHeaders = (yPosition) => {
    doc.setFontSize(16);
    doc.text(
      `${reportType} Report For Apartment Management System`,
      margin,
      margin
    );
    doc.setFontSize(12);
    doc.text(
      `Generated on: ${new Date().toLocaleString()}`,
      margin,
      margin + 10
    );

    /**Table headers*/
    const headers = Object.keys(data[0]);
    headers.forEach((header, index) => {
      doc.text(header, margin + index * 30, yPosition);
    });
    return yPosition + lineHeight; // Return the new y position after headers
  };

  /**Initial setup*/
  let y = headerHeight;
  y = addHeaders(y); // Add headers on the first page

  /**Table data*/
  data.forEach((row, rowIndex) => {
    // Check if the current y position exceeds the page height
    if (y + lineHeight > maxY) {
      doc.addPage(); // Add a new page
      y = headerHeight; // Reset y to the top of the new page (after margin)
      y = addHeaders(y); // Add headers on the new page
    }

    /**Here we shall be adding new data */
    const headers = Object.keys(data[0]);
    headers.forEach((header, index) => {
      doc.text(String(row[header]), margin + index * 30, y);
    });
    y += lineHeight;
  });

  return doc.output("blob");
};

module.exports = generatePDF;
