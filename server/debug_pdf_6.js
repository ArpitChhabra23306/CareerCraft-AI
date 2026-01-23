import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfLib = require('pdf-parse');

async function test() {
    try {
        const dummyBuffer = Buffer.from('dummy');
        // Try calling the PDFParse property
        if (typeof pdfLib.PDFParse === 'function') {
            console.log('Attemping to call pdfLib.PDFParse()...');
            const result = pdfLib.PDFParse(dummyBuffer);
            console.log('Result instance of Promise?', result instanceof Promise);

            try {
                const data = await result;
                console.log('Resolved:', data);
            } catch (e) {
                console.log('Promise rejected (expected for dummy data):', e.message);
            }
        } else {
            console.log('pdfLib.PDFParse is not a function');
        }

    } catch (e) {
        console.log('Crash calling function:', e.message);
    }
}

test();
