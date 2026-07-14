const fs = require('fs');
let storeCode = fs.readFileSync('src/store.ts', 'utf8');

let target1 = `const litersSold: { [nozzleId: string]: number } = {};`;
storeCode = storeCode.replace(`const litersSold: { [nozzleId: string]: number } = {};`, `const litersSold: { [nozzleId: string]: number } = {};`);

// Just check if we need to do anything else.
