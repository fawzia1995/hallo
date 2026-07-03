const fs = require('fs');
const PDFDocument = require('pdfkit');

const generateTicketPdf = (ticketData, qrFile, pdfFile) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A6', margin: 20 });
    const stream = fs.createWriteStream(pdfFile);
    doc.pipe(stream);

    doc.fontSize(16).text('تذكرة فعالية', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`الفعالية: ${ticketData.eventTitle || ''}`);
    doc.text(`النوع: ${ticketData.ticketType || 'عام'}`);
    if (ticketData.isVirtual) {
      doc.text('تذكرة افتراضية للبث المباشر');
    } else {
      doc.text(`المقعد: ${ticketData.seatCategory || '-'} رقم ${ticketData.seatNumber || '-'}`);
    }
    doc.text(`رمز التذكرة: ${ticketData.ticketCode}`);
    doc.moveDown();

    if (qrFile && fs.existsSync(qrFile)) {
      try {
        doc.image(qrFile, { fit: [150, 150], align: 'center' });
      } catch (imgErr) {
        console.error('Unable to embed QR in PDF:', imgErr);
      }
    }

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
};

module.exports = {
  generateTicketPdf
};
