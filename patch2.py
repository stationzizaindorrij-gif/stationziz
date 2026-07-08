import re

with open('src/components/ShiftWizard.tsx', 'r') as f:
    content = f.read()

# Replace the grid item class for BON CLIENT
content = content.replace(
    """  ].map(method => (
                  <div key={method.key} className="p-4 bg-slate-50 rounded-xl border border-slate-200">""",
    """  ].map(method => (
                  <div key={method.key} className={`p-4 bg-slate-50 rounded-xl border border-slate-200 ${method.key === 'bonClient' ? 'md:col-span-2' : ''}`}>"""
)

# Replace the bonClient flex-col with flex-row and flex-[2]
content = content.replace(
    """                        {method.key === 'bonClient' && (
                          <div className="flex-1 w-full flex flex-col gap-2">
                              <select 
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded focus:ring-indigo-500 focus:border-indigo-500 block p-2 h-[38px]"
                                value={store.clients?.some(c => c.name === (entry as any).clientName) ? (entry as any).clientName : ''}""",
    """                        {method.key === 'bonClient' && (
                          <div className="flex-[2] w-full flex flex-col lg:flex-row gap-2">
                              <select 
                                className="w-full lg:w-1/2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded focus:ring-indigo-500 focus:border-indigo-500 block p-2 h-[38px]"
                                value={store.clients?.some(c => c.name === (entry as any).clientName) ? (entry as any).clientName : ''}"""
)

content = content.replace(
    """                              <input
                                type="text"
                                placeholder="Ou saisir un nouveau client"
                                value={(entry as any).clientName || ''}
                                onChange={e => {
                                  const newArr = [...nonCashPayments[method.key as keyof typeof nonCashPayments]] as any[];
                                  newArr[idx].clientName = e.target.value;
                                  setNonCashPayments({ ...nonCashPayments, [method.key]: newArr });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded focus:ring-indigo-500 focus:border-indigo-500 block p-2 h-[38px]"
                              />""",
    """                              <input
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
)

with open('src/components/ShiftWizard.tsx', 'w') as f:
    f.write(content)
