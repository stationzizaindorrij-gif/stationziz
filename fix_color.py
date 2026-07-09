with open('src/components/Shop.tsx', 'r') as f:
    content = f.read()

search = """                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                      product.stockQuantity > 10 ? 'bg-emerald-100 text-emerald-700' :
                      product.stockQuantity > 0 ? 'bg-orange-100 text-orange-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {product.stockQuantity} en stock
                    </span>"""

replace = """                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                      (product.minStockAlert !== undefined && product.stockQuantity <= product.minStockAlert) || (product.minStockAlert === undefined && product.stockQuantity <= 0) ? 'bg-rose-100 text-rose-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {product.stockQuantity} en stock
                    </span>"""

if search in content:
    content = content.replace(search, replace)
    with open('src/components/Shop.tsx', 'w') as f:
        f.write(content)
    print("Fixed stock colors in Shop")
else:
    print("Could not find the target string")
