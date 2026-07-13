const fs = require('fs');
let code = fs.readFileSync('src/components/SharedShiftReport.tsx', 'utf8');

const target = '<div className="font-mono font-bold text-rose-600 text-lg">{carburantsTotal - nonCashTotal > 0 ? "-" : "+"}{Math.abs(carburantsTotal - nonCashTotal).toFixed(2)} DH</div>';

const replacement = "<div className={`font-mono font-bold text-lg ${carburantsTotal - nonCashTotal < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{carburantsTotal - nonCashTotal > 0 ? \"-\" : \"+\"}{Math.abs(carburantsTotal - nonCashTotal).toFixed(2)} DH</div>";

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/SharedShiftReport.tsx', code);
  console.log("Patched SharedShiftReport.tsx");
} else {
  console.log("Target not found");
}
