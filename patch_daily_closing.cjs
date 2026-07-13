const fs = require('fs');
let code = fs.readFileSync('src/components/DailyClosing.tsx', 'utf8');

const target = '<div className="font-mono font-bold text-rose-600 text-lg">{fuelSalesDetails.totalFuelAmount - totalNonCashPayments > 0 ? "-" : "+"}{Math.abs(fuelSalesDetails.totalFuelAmount - totalNonCashPayments).toFixed(2)} DH</div>';

const replacement = "<div className={`font-mono font-bold text-lg ${fuelSalesDetails.totalFuelAmount - totalNonCashPayments < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fuelSalesDetails.totalFuelAmount - totalNonCashPayments > 0 ? \"-\" : \"+\"}{Math.abs(fuelSalesDetails.totalFuelAmount - totalNonCashPayments).toFixed(2)} DH</div>";

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/DailyClosing.tsx', code);
  console.log("Patched DailyClosing.tsx");
} else {
  console.log("Target not found");
}
