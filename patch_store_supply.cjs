const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

code = code.replace(
  "  addSupply: (supply: Omit<Supply, 'id'>, author: string) => void;",
  "  addSupply: (supply: Omit<Supply, 'id'>, author: string) => void;\n  deleteSupply: (id: string, author: string) => void;"
);

const deleteImpl = `  const deleteSupply = (id: string, author: string) => {
    const supplyToDelete = supplies.find(s => s.id === id);
    if (!supplyToDelete) return;

    // Remove from supplies
    const updatedSupplies = supplies.filter(s => s.id !== id);
    saveState('supplies', updatedSupplies, setSupplies);

    // Automatically decrease tank level
    const tank = tanks.find(t => t.id === supplyToDelete.tankId);
    if (tank) {
      const newLevel = Math.max(0, tank.currentLevel - supplyToDelete.qtyDelivered);
      updateTank(tank.id, { currentLevel: newLevel }, author);
    }

    logAction(author, 'Suppression Livraison', 'Approvisionnement', \`Suppression de livraison de \${supplyToDelete.qtyDelivered} L de \${supplyToDelete.productName} (Facture: \${supplyToDelete.invoiceNumber})\`);
  };

  // MODULE 10: CASH REGISTRY (CAISSE)`;

code = code.replace("  // MODULE 10: CASH REGISTRY (CAISSE)", deleteImpl);

code = code.replace(
  "    addSupply,",
  "    addSupply,\n    deleteSupply,"
);

fs.writeFileSync('src/store.ts', code);
