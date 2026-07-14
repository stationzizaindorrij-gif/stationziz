const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const targetLoad = `        if (data.price_changes) setPriceChanges(data.price_changes);`;
const replaceLoad = `        if (data.price_changes) {
          const sanitizedChanges = data.price_changes.map(pc => {
            if (pc.date.includes('T') && pc.date.split('T').length > 2) {
               return { ...pc, date: pc.date.replace(/T.*T/, 'T') }; // just a quick fix
            }
            if (pc.date.match(/T\\d{2}:\\d{2}:\\d{2}$/)) {
               return { ...pc, date: pc.date + '.000Z' }; // ensure valid JS date if it misses timezone
            }
            return pc;
          });
          setPriceChanges(sanitizedChanges);
        }`;

code = code.replace(targetLoad, replaceLoad);
fs.writeFileSync('src/store.ts', code);
console.log('Fixed loadInitialData');
