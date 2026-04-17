const html_to_pdf = require('html-pdf-node');
const fs = require('fs');

const content = '<h1>Test PDF</h1>';

async function test() {
    console.log('Starting PDF generation...');
    try {
        const file = { content };
        const pdfBuffer = await html_to_pdf.generatePdf(file, { format: 'A4' });
        fs.writeFileSync('test.pdf', pdfBuffer);
        console.log('PDF generated successfully!');
    } catch (err) {
        console.error('PDF generation failed:', err.message);
    }
}

test();
