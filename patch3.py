import re

with open('src/components/ShiftWizard.tsx', 'r') as f:
    content = f.read()

search = """                              <select 
                                className="w-full lg:w-1/2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded focus:ring-indigo-500 focus:border-indigo-500 block p-2 h-[38px]"
                                value={store.clients?.some(c => c.name === (entry as any).clientName) ? (entry as any).clientName : ''}
                                onChange={e => {
                                  if (e.target.value) {
                                    const newArr = [...nonCashPayments[method.key as keyof typeof nonCashPayments]] as any[];
                                    newArr[idx].clientName = e.target.value;
                                    setNonCashPayments({ ...nonCashPayments, [method.key]: newArr });
                                  }
                                }}
                              >"""

replace = """                              <select 
                                className="w-full lg:w-1/2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded focus:ring-indigo-500 focus:border-indigo-500 block p-2 h-[38px]"
                                value={store.clients?.some(c => c.name === (entry as any).clientName) ? (entry as any).clientName : ''}
                                onChange={e => {
                                  const newArr = [...nonCashPayments[method.key as keyof typeof nonCashPayments]] as any[];
                                  newArr[idx].clientName = e.target.value;
                                  setNonCashPayments({ ...nonCashPayments, [method.key]: newArr });
                                }}
                              >"""

content = content.replace(search, replace)


search2 = """                              <input
                                type="text"
                                placeholder="Ou saisir un nouveau client"
                                value={(entry as any).clientName || ''}
                                onChange={e => {
                                  const newArr = [...nonCashPayments[method.key as keyof typeof nonCashPayments]] as any[];
                                  newArr[idx].clientName = e.target.value;
                                  setNonCashPayments({ ...nonCashPayments, [method.key]: newArr });
                                }}
                                className="w-full lg:w-1/2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded focus:ring-indigo-500 focus:border-indigo-500 block p-2 h-[38px]"
                              />"""

replace2 = """                              <input
                                type="text"
                                placeholder="Ou saisir un nouveau client"
                                value={store.clients?.some(c => c.name === (entry as any).clientName) ? '' : ((entry as any).clientName || '')}
                                onChange={e => {
                                  const newArr = [...nonCashPayments[method.key as keyof typeof nonCashPayments]] as any[];
                                  newArr[idx].clientName = e.target.value;
                                  setNonCashPayments({ ...nonCashPayments, [method.key]: newArr });
                                }}
                                className="w-full lg:w-1/2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded focus:ring-indigo-500 focus:border-indigo-500 block p-2 h-[38px]"
                              />"""

content = content.replace(search2, replace2)

with open('src/components/ShiftWizard.tsx', 'w') as f:
    f.write(content)
