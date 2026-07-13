const fs = require('fs');
let code = fs.readFileSync('src/components/Billing.tsx', 'utf8');

const lines = code.split('\n');
let fixIndex = -1;
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes("Page 1 / 1")) {
    fixIndex = i;
    break;
  }
}

if (fixIndex > -1) {
  // Let's print out what is there from fixIndex to fixIndex + 15
  console.log(lines.slice(fixIndex, fixIndex + 15).join('\n'));
}

