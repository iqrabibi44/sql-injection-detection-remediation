import PDFDocument from 'pdfkit';
import fs from 'fs';

try {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream('test.pdf'));
  doc.text('Hello World!');
  doc.end();
  console.log('PDF generated successfully!');
} catch (e) {
  console.error('Failed to generate PDF:', e);
}
