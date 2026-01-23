import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfLib = require('pdf-parse');

console.log('Main export type:', typeof pdfLib);
for (const key of Object.keys(pdfLib)) {
    try {
        console.log(`Key: ${key}, Type: ${typeof pdfLib[key]}`);
    } catch (e) {
        console.log(`Key: ${key}, Error accessing`);
    }
}
