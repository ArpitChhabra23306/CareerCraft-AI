import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

console.log('Type of pdf:', typeof pdf);
console.log('Is pdf a function?', typeof pdf === 'function');

async function test() {
    try {
        const dummyBuffer = Buffer.from('dummy pdf content');
        const data = await pdf(dummyBuffer);
        console.log('Parsed text:', data.text);
    } catch (e) {
        console.log('Error (expected for dummy):', e.message);
        // Standard pdf-parse usually says "Invalid PDF structure" or similar
    }
}
test();
