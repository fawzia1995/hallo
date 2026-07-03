const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { generateTicketPdf } = require('../lib/pdf-utils');

const outputDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const run = async (name, fn) => {
  try {
    await fn();
    console.log(`✔ ${name}`);
  } catch (error) {
    console.error(`✖ ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
};

(async () => {
  const pdfFile = path.join(outputDir, 'ticket-test.pdf');

  await run('generateTicketPdf creates a PDF file', async () => {
    await generateTicketPdf(
      {
        eventTitle: 'مهرجان الاختبار',
        ticketType: 'VIP',
        ticketCode: 'TEST123',
        isVirtual: false,
        seatCategory: 'A',
        seatNumber: 10
      },
      '',
      pdfFile
    );

    const stats = fs.statSync(pdfFile);
    assert.ok(stats.size > 0, 'Expected generated PDF to have content');
  });

  if (fs.existsSync(pdfFile)) {
    fs.unlinkSync(pdfFile);
  }
})();
