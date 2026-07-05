const fs = require('fs');
const content = fs.readFileSync('src/components/Shifts.tsx', 'utf-8');

const openDivs = (content.match(/<div(\s|>)/g) || []).length;
const closeDivs = (content.match(/<\/div>/g) || []).length;

console.log(`Open divs: ${openDivs}`);
console.log(`Close divs: ${closeDivs}`);

const openDetails = (content.match(/<details(\s|>)/g) || []).length;
const closeDetails = (content.match(/<\/details>/g) || []).length;

console.log(`Open details: ${openDetails}, close: ${closeDetails}`);

const openSummary = (content.match(/<summary(\s|>)/g) || []).length;
const closeSummary = (content.match(/<\/summary>/g) || []).length;

console.log(`Open summary: ${openSummary}, close: ${closeSummary}`);

