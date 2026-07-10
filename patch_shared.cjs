const fs = require('fs');
let code = fs.readFileSync('src/components/SharedShiftReport.tsx', 'utf8');

code = code.replace(
  '<div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Dépenses</div>',
  '<div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Dépenses / Manquant</div>'
);
code = code.replace(
  '<div className="font-mono font-bold text-rose-600 text-lg">-{depensesTotal.toFixed(2)} DH</div>',
  '<div className="font-mono font-bold text-rose-600 text-lg">{carburantsTotal - nonCashTotal > 0 ? "-" : "+"}{Math.abs(carburantsTotal - nonCashTotal).toFixed(2)} DH</div>'
);

fs.writeFileSync('src/components/SharedShiftReport.tsx', code);
