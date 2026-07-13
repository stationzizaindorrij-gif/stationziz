const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const targetStr = `  const addPurchaseInvoice = (invoice: Omit<PurchaseInvoice, 'id'>, author: string) => {
    const newInvoice = { ...invoice, id: \`pinv_\${Date.now()}\` };
    const updated = [...purchaseInvoices, newInvoice];
    saveState('purchase_invoices', updated, setPurchaseInvoices);
    
    // Automatically add stock and create a supply record when validated/added
    const tank = tanks.find(t => t.id === invoice.tankId);
    if (tank) {
      const updatedTanks = tanks.map(t => 
        t.id === tank.id ? { ...t, currentLevel: t.currentLevel - invoice.quantity } : t
      );
      saveState('tanks', updatedTanks, setTanks);
      
      const supplier = suppliers.find(s => s.id === invoice.supplierId);
      
      const newSupply: Supply = {
        id: \`sup_\${Date.now()}\`,
        supplier: supplier?.name || invoice.supplierId,
        productId: invoice.productId,
        productName: products.find(p => p.id === invoice.productId)?.name || 'Inconnu',
        tankId: tank.id,
        tankNumber: tank.number,
        qtyDelivered: invoice.quantity,
        purchasePrice: invoice.pricePerLiter,
        date: invoice.date,
        invoiceNumber: invoice.invoiceNumber
      };
      
      const updatedSupplies = [newSupply, ...supplies];
      saveState('supplies', updatedSupplies, setSupplies);
    }
    
    logAction(author, 'Facture Achat Créée', 'Facturation', \`Facture \${invoice.invoiceNumber} enregistrée (\${invoice.amountTTC.toFixed(2)} MAD)\`);
  };`;

const replaceStr = `  const addPurchaseInvoice = (invoice: Omit<PurchaseInvoice, 'id'>, author: string) => {
    const newInvoice = { ...invoice, id: \`pinv_\${Date.now()}\` };
    const updated = [...purchaseInvoices, newInvoice];
    saveState('purchase_invoices', updated, setPurchaseInvoices);
    
    logAction(author, 'Facture Achat Créée', 'Facturation', \`Facture \${invoice.invoiceNumber} enregistrée (\${invoice.amountTTC.toFixed(2)} MAD)\`);
  };`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('src/store.ts', code);
  console.log("Patched addPurchaseInvoice successfully");
} else {
  console.log("Target string not found in store.ts");
}
