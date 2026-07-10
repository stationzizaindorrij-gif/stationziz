const fs = require('fs');
let code = fs.readFileSync('src/components/Shifts.tsx', 'utf8');

code = code.replace(
  '<th className="p-3.5">Total Global</th>',
  ''
);

const targetTd = `                        <td className="p-3.5 font-mono font-bold text-slate-800">
                          {(() => {
                            const carburantsTotal = s.totalAmount || 0;
                            return carburantsTotal.toFixed(2);
                          })()} MAD
                        </td>`;

code = code.replace(targetTd, '');

fs.writeFileSync('src/components/Shifts.tsx', code);
