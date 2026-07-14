const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

code = code.replace(`diffLiters.toFixed(2)))`, `parseFloat(diffLiters.toFixed(2)))`);
code = code.replace(`startCount.mech {`, `startCount.mech) {`);

fs.writeFileSync('src/store.ts', code);
