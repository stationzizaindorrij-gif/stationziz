const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const t1 = `            const oldestRecorded = Math.min(...existingForProduct.map(pc => new Date(pc.date).getTime()));
            return new Date(gc.date).getTime() < oldestRecorded;`;
const r1 = `            const oldestRecorded = Math.min(...existingForProduct.map(pc => new Date(pc.date).getTime()));
            const newestRecorded = Math.max(...existingForProduct.map(pc => new Date(pc.date).getTime()));
            const gcTime = new Date(gc.date).getTime();
            return gcTime < oldestRecorded || gcTime > newestRecorded;`;

code = code.replace(t1, r1);
fs.writeFileSync('src/store.ts', code);
console.log('Fixed migration filter');
