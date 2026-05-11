import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function inspect() {
    const pdfBytes = fs.readFileSync('netlify/functions/templates/proposal-blank.pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        console.log(`Page ${index + 1}: Width = ${width}, Height = ${height}`);
    });
}

inspect();
