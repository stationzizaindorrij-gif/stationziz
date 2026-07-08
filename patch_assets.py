import re

with open('src/components/Assets.tsx', 'r') as f:
    content = f.read()

# Import PriceHistory
content = content.replace(
    "import { ERPStoreType } from '../store';",
    "import { ERPStoreType } from '../store';\nimport PriceHistory from './PriceHistory';"
)

# Add tab type
content = content.replace(
    "const [activeTab, setActiveTab] = useState<'products' | 'pumps' | 'nozzles'>('products');",
    "const [activeTab, setActiveTab] = useState<'products' | 'pumps' | 'nozzles' | 'history'>('products');"
)

# Add tab button
search_tabs = """          <button 
            onClick={() => setActiveTab('nozzles')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'nozzles' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Pistolets & Compteurs
          </button>
        </div>"""

replace_tabs = """          <button 
            onClick={() => setActiveTab('nozzles')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'nozzles' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Pistolets & Compteurs
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'history' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Historique des Prix
          </button>
        </div>"""

content = content.replace(search_tabs, replace_tabs)

# Render PriceHistory component
content = content + """
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <PriceHistory store={store} />
        </div>
      )}
"""

# Actually, PriceHistory has its own header maybe? Let's check PriceHistory's render to see if it looks fine inside Assets.

with open('src/components/Assets.tsx', 'w') as f:
    f.write(content)
