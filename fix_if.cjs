const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const target = `if (noz.currentElecCounter as any > shift.endCounters[nozId].elec as any) || noz.currentMechCounter as any > shift.endCounters[nozId].mech as any) {`;
const replace = `if ((noz.currentElecCounter as any > shift.endCounters[nozId].elec as any) || (noz.currentMechCounter as any > shift.endCounters[nozId].mech as any)) {`;

code = code.replace(target, replace);
fs.writeFileSync('src/store.ts', code);
