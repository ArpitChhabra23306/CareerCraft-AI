import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

async function testPdf() {
    // Picking one file from the uploads directory check
    // 1769103726553-727155266.pdf
    const filepath = 'uploads/1769103726553-727155266.pdf';
    try {
        console.log(`Testing PDF parse on: ${filepath}`);
        if (!fs.existsSync(filepath)) {
            console.error("File does not exist!");
            return;
        }
        const dataBuffer = fs.readFileSync(filepath);
        const data = await pdf(dataBuffer);
        console.log("PDF Pages:", data.numpages);
        console.log("PDF Text Prefix:", data.text.substring(0, 100));
    } catch (error) {
        console.error("PDF Parsing Error:", error);
    }
}

testPdf();
