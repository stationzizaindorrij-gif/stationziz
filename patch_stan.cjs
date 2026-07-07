const fs = require('fs');
const filePath = 'src/components/ShiftWizard.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const targetStr = `                          {method.key === 'bonClient' && (
                          <div className="flex-1 w-full">
                              <input
                                type="text"
                                placeholder="Nom du client"
                                value={(entry as any).clientName || ''}
                                onChange={e => {
                                  const newArr = [...nonCashPayments[method.key as keyof typeof nonCashPayments]] as any[];
                                  newArr[idx].clientName = e.target.value;
                                  setNonCashPayments({ ...nonCashPayments, [method.key]: newArr });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded focus:ring-indigo-500 focus:border-indigo-500 block p-2 h-[38px]"
                              />
                          </div>
                        )}`;

const replacementStr = `                          {method.key === 'carteSntl' && (
                          <div className="w-24 shrink-0">
                              <input
                                type="text"
                                placeholder="STAN"
                                value={(entry as any).stan || ''}
                                onChange={e => {
                                  const newArr = [...nonCashPayments[method.key as keyof typeof nonCashPayments]] as any[];
                                  newArr[idx].stan = e.target.value;
                                  setNonCashPayments({ ...nonCashPayments, [method.key]: newArr });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded focus:ring-indigo-500 focus:border-indigo-500 block p-2 h-[38px] font-mono"
                              />
                          </div>
                        )}
                        {method.key === 'bonClient' && (
                          <div className="flex-1 w-full">
                              <input
                                type="text"
                                placeholder="Nom du client"
                                value={(entry as any).clientName || ''}
                                onChange={e => {
                                  const newArr = [...nonCashPayments[method.key as keyof typeof nonCashPayments]] as any[];
                                  newArr[idx].clientName = e.target.value;
                                  setNonCashPayments({ ...nonCashPayments, [method.key]: newArr });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded focus:ring-indigo-500 focus:border-indigo-500 block p-2 h-[38px]"
                              />
                          </div>
                        )}`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync(filePath, content);
    console.log("Patched successfully!");
} else {
    console.log("Could not find target string.");
}
