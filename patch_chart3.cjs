const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const target = `        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 font-display">Courbe d'activité</h3>
              <p className="text-xs text-slate-400">Volume (Litres) et chiffre d'affaires cumulés</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setChartPeriod('day')}
                  className={\`px-3 py-1 text-xs font-bold rounded-md transition-colors \${chartPeriod === 'day' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  Jour
                </button>
                <button 
                  onClick={() => setChartPeriod('month')}
                  className={\`px-3 py-1 text-xs font-bold rounded-md transition-colors \${chartPeriod === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  Mois
                </button>
                <button 
                  onClick={() => setChartPeriod('year')}
                  className={\`px-3 py-1 text-xs font-bold rounded-md transition-colors \${chartPeriod === 'year' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  Année
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold hidden sm:flex">
                <span className="flex items-center gap-1 text-sky-500"><span className="w-2.5 h-2.5 bg-sky-500 rounded-sm"></span> Ventes (MAD)</span>
                <span className="flex items-center gap-1 text-blue-500"><span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span> Volume (L)</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(value) => Number(value).toFixed(0)} width={60} />
                <Tooltip formatter={(value: any, name: any) => [\`\${Number(value).toFixed(2)} \${name.includes("Volume") ? "L" : "MAD"}\`, name]} />
                <Bar dataKey="ventes" name="Recettes (MAD)" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="litres" name="Volume (L)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>`;

const replace = `        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 font-display">Courbe d'activité</h3>
              <p className="text-xs text-slate-400">Volume (Litres) cumulé</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setChartPeriod('day')}
                  className={\`px-3 py-1 text-xs font-bold rounded-md transition-colors \${chartPeriod === 'day' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  Jour
                </button>
                <button 
                  onClick={() => setChartPeriod('month')}
                  className={\`px-3 py-1 text-xs font-bold rounded-md transition-colors \${chartPeriod === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  Mois
                </button>
                <button 
                  onClick={() => setChartPeriod('year')}
                  className={\`px-3 py-1 text-xs font-bold rounded-md transition-colors \${chartPeriod === 'year' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  Année
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold hidden sm:flex">
                <span className="flex items-center gap-1 text-blue-500"><span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span> Volume (L)</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(value) => Math.round(Number(value)).toString()} width={60} />
                <Tooltip formatter={(value: any) => [\`\${Number(value).toFixed(2)} L\`, "Volume (L)"]} />
                <Bar dataKey="litres" name="Volume (L)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/Dashboard.tsx', code);
