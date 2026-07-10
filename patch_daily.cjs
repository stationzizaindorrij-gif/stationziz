const fs = require('fs');
let code = fs.readFileSync('src/components/DailyClosing.tsx', 'utf8');

code = code.replace(
  '<div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Dépenses</div>',
  '<div className="text-[10px] uppercase text-slate-500 mb-1 font-bold">Dépenses / Manquant</div>'
);
code = code.replace(
  '<div className="font-mono font-bold text-rose-600 text-lg">-{totalExpenses.toFixed(2)} DH</div>',
  '<div className="font-mono font-bold text-rose-600 text-lg">{fuelSalesDetails.totalFuelAmount - totalNonCashPayments > 0 ? "-" : "+"}{Math.abs(fuelSalesDetails.totalFuelAmount - totalNonCashPayments).toFixed(2)} DH</div>'
);

fs.writeFileSync('src/components/DailyClosing.tsx', code);
