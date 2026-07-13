const fs = require('fs');
let code = fs.readFileSync('src/components/Shifts.tsx', 'utf8');

const targetStr = `<td className="p-3.5 font-mono text-rose-600 font-semibold">
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

const replaceStr = `<td className="p-3.5 font-mono font-semibold">
                          {(() => {
                            const carteSntl = s.nonCashPayments?.carteSntl?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const espece = s.nonCashPayments?.espece?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const vignette = s.nonCashPayments?.vignette?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const bonClient = s.nonCashPayments?.bonClient?.reduce((sum, item) => sum + item.amount, 0) || 0;
                            const encaissements = carteSntl + espece + (s.nonCashPayments?.bonCarburantsVivo?.reduce((sum: any, item: any) => sum + item.amount, 0) || 0) + vignette + bonClient;
                            
                            const carburantsTotal = s.totalAmount || 0;
                            const ecart = carburantsTotal - encaissements;
                            const surplus = ecart < 0;
                            return (
                                <span className={surplus ? "text-emerald-600" : "text-rose-600"}>
                                  {(ecart > 0 ? "-" : "+")}{Math.abs(ecart).toFixed(2)} MAD
                                </span>
                            );
                          })()}
                        </td>`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('src/components/Shifts.tsx', code);
  console.log("Patched successfully");
} else {
  console.log("Target string not found. Please verify.");
}
