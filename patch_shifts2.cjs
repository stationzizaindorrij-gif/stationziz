const fs = require('fs');
let code = fs.readFileSync('src/components/Shifts.tsx', 'utf8');

code = code.replace(
  '<th className="p-3.5">Dépenses</th>',
  '<th className="p-3.5">Dépenses / Manquant</th>'
);

const targetDepenses = `                        <td className="p-3.5 font-mono text-rose-600 font-semibold">
                          {(() => {
                            const depenses = s.expenses?.filter(e => e.method === 'cash').reduce((sum, e) => sum + e.amount, 0) || 0;
                            return depenses.toFixed(2);
                          })()} MAD
                        </td>`;

const replaceDepenses = `                        <td className="p-3.5 font-mono text-rose-600 font-semibold">
                          {(() => {
                            const carteSntl = s.nonCashPayments?.carteSntl?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const espece = s.nonCashPayments?.espece?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const vignette = s.nonCashPayments?.vignette?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const bonClient = s.nonCashPayments?.bonClient?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const encaissements = carteSntl + espece + (s.nonCashPayments?.bonCarburantsVivo?.reduce((sum: any, item: any) => sum + item.amount, 0) || 0) + vignette + bonClient;
                            
                            const carburantsTotal = s.totalAmount || 0;
                            const ecart = carburantsTotal - encaissements;
                            return (ecart > 0 ? "-" : "+") + Math.abs(ecart).toFixed(2);
                          })()} MAD
                        </td>`;

code = code.replace(targetDepenses, replaceDepenses);
fs.writeFileSync('src/components/Shifts.tsx', code);
