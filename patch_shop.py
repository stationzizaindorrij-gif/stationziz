import re

with open('src/components/Shop.tsx', 'r') as f:
    content = f.read()

# Replace lucide imports
content = content.replace(
    "import { Package, Plus, Search, Edit2, Trash2, Camera, Tag, DollarSign, Archive, Check } from 'lucide-react';",
    "import { Package, Plus, Search, Edit2, Trash2, Camera, Tag, DollarSign, Archive, Check, AlertTriangle } from 'lucide-react';"
)

# Initialize formData with minStockAlert
content = content.replace(
    "setFormData({ name: '', photo: '', purchasePrice: 0, salePrice: 0, stockQuantity: 0, status: 'active' });",
    "setFormData({ name: '', photo: '', purchasePrice: 0, salePrice: 0, stockQuantity: 0, minStockAlert: 0, status: 'active' });"
)
content = content.replace(
    """  const [formData, setFormData] = useState<Partial<ShopProduct>>({
    name: '',
    photo: '',
    purchasePrice: 0,
    salePrice: 0,
    stockQuantity: 0,
    status: 'active'
  });""",
    """  const [formData, setFormData] = useState<Partial<ShopProduct>>({
    name: '',
    photo: '',
    purchasePrice: 0,
    salePrice: 0,
    stockQuantity: 0,
    minStockAlert: 0,
    status: 'active'
  });"""
)

# Add minStockAlert input field to the form
search_field = """            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantité en stock</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Archive className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={e => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>"""

replace_field = search_field + """
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Alerte stock minimum</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AlertTriangle className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="number"
                  min="0"
                  value={formData.minStockAlert || 0}
                  onChange={e => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>"""

content = content.replace(search_field, replace_field)

# Change grid col from 2 to 3 maybe? No, let's keep it as is, it might just wrap to the next line.
# Actually grid grid-cols-1 md:grid-cols-2 is used for the form. Let's make it 3 to fit it better if needed, or leave it.

# Update product card to show stock alert
search_card = """            <div className="p-4 bg-white">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-800 line-clamp-2">{product.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  product.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {product.status === 'active' ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div className="flex justify-between items-end mt-4">
                <div>
                  <div className="text-sm text-slate-500">Stock: <span className="font-bold text-slate-700">{product.stockQuantity}</span></div>
                  <div className="text-lg font-black text-indigo-600 mt-1">{product.salePrice.toFixed(2)} DH</div>
                </div>"""

replace_card = """            <div className="p-4 bg-white">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-800 line-clamp-2">{product.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  product.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {product.status === 'active' ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div className="flex justify-between items-end mt-4">
                <div>
                  <div className={`text-sm flex items-center gap-1 ${product.minStockAlert !== undefined && product.stockQuantity <= product.minStockAlert ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                    Stock: <span className={product.minStockAlert !== undefined && product.stockQuantity <= product.minStockAlert ? 'text-red-600' : 'font-bold text-slate-700'}>{product.stockQuantity}</span>
                    {product.minStockAlert !== undefined && product.stockQuantity <= product.minStockAlert && (
                      <AlertTriangle className="w-3.5 h-3.5" title="Stock critique" />
                    )}
                  </div>
                  <div className="text-lg font-black text-indigo-600 mt-1">{product.salePrice.toFixed(2)} DH</div>
                </div>"""

content = content.replace(search_card, replace_card)


with open('src/components/Shop.tsx', 'w') as f:
    f.write(content)
