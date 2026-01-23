import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfLib = require('pdf-parse');

console.log('pdfLib keys:', Object.keys(pdfLib));

try {
    const pdfFunc = pdfLib.PDFParse || pdfLib;
    console.log('Testing pdfFunc type:', typeof pdfFunc);

    // Create dummy PDF buffer (not valid PDF, but check if function accepts it or throws specific error)
    // Actually, passing garbage to pdf-parse usually throws "Invalid PDF", which confirms it's the right function.
    const dummyBuffer = Buffer.from('dummy');

    // We expect a promise
    const result = pdfFunc(dummyBuffer);
    console.log('Result is promise?', result instanceof Promise);

    result.then(data => console.log('Parsed:', data))
        .catch(err => console.log('Caught expected error:', err.message));

} catch (e) {
    console.log('Crash:', e.message);
}
