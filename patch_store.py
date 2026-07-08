import re

with open('src/store.ts', 'r') as f:
    content = f.read()

search = """       if (p.shopProductId) {
         updatedShopProducts = updatedShopProducts.map(sp => 
            sp.id === p.shopProductId ? { ...sp, stockQuantity: Math.max(0, sp.stockQuantity - p.qty) } : sp
         );
       }"""

replace = """       if (p.shopProductId) {
         updatedShopProducts = updatedShopProducts.map(sp => {
            if (sp.id === p.shopProductId) {
                const newStock = Math.max(0, sp.stockQuantity - p.qty);
                // Trigger alert if stock falls below or equals minStockAlert
                if (sp.minStockAlert !== undefined && newStock <= sp.minStockAlert && sp.stockQuantity > sp.minStockAlert) {
                    triggerAlert('warning', `Le produit ${sp.name} est en rupture ou proche de la rupture de stock (${newStock} restants).`, 'low_stock');
                } else if (sp.minStockAlert !== undefined && newStock <= sp.minStockAlert && sp.stockQuantity <= sp.minStockAlert) {
                    // Already alerted, but maybe still trigger or not. We'll trigger it anyway to be safe, or only when it crosses the threshold.
                    // Actually, let's only trigger if it crossed the threshold to avoid spamming alerts on every sale.
                    // Wait, if they sell it again while it's low, they might still want an alert. 
                    // Let's keep it simple: trigger it every time if they sell a low stock item.
                    triggerAlert('warning', `Le produit ${sp.name} est en rupture ou proche de la rupture de stock (${newStock} restants).`, 'low_stock');
                }
                return { ...sp, stockQuantity: newStock };
            }
            return sp;
         });
       }"""

if search in content:
    content = content.replace(search, replace)
    with open('src/store.ts', 'w') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Could not find search string.")

