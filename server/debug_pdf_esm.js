import pdf from 'pdf-parse';

console.log('Type of default import:', typeof pdf);
if (typeof pdf === 'object') {
    console.log('Keys:', Object.keys(pdf));
}
