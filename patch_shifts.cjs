const fs = require('fs');
let code = fs.readFileSync('src/components/Shifts.tsx', 'utf8');

const targetStr = `                        <td className="p-3.5 font-mono font-bold text-slate-800">
                          {(() => {
                            const carteSntl = s.nonCashPayments?.carteSntl?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const espece = s.nonCashPayments?.espece?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const vignette = s.nonCashPayments?.vignette?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const bonClient = s.nonCashPayments?.bonClient?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const encaissements = carteSntl + espece + (s.nonCashPayments?.bonCarburantsVivo?.reduce((sum: any, item: any) => sum + item.amount, 0) || 0) + vignette + bonClient;
                            
                            const depenses = s.expenses?.filter(e => e.method === 'cash').reduce((sum, e) => sum + e.amount, 0) || 0;
                            
                            return (encaissements - depenses).toFixed(2);
                          })()} MAD
                        </td>`;

const replaceStr = `                        <td className="p-3.5 font-mono font-bold text-slate-800">
                          {(() => {
                            const carburantsTotal = s.totalAmount || 0;
                            return carburantsTotal.toFixed(2);
                          })()} MAD
                        </td>`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/components/Shifts.tsx', code);
