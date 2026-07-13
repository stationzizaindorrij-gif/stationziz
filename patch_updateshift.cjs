const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const target = `    updateShift: (id: string, updatedFields: Partial<Shift>, author: string) => {
      const updated = shifts.map(s => s.id === id ? { ...s, ...updatedFields } : s);
      saveState('shifts', updated, setShifts);
      //
    },`;

const replace = `    updateShift: (id: string, updatedFields: Partial<Shift>, author: string) => {
      const oldShift = shifts.find(s => s.id === id);
      if (!oldShift) return;

      const isCompleted = oldShift.status === 'completed' || oldShift.status === 'ready_to_close';

      // If the shift was completed, we need to rollback old tanks and apply new tanks
      let currentTanks = [...tanks];
      let tanksChanged = false;

      if (isCompleted && updatedFields.litersSold) {
        // Rollback old liters
        if (oldShift.litersSold) {
           Object.keys(oldShift.litersSold).forEach(nozId => {
             const qty = oldShift.litersSold[nozId];
             const noz = nozzles.find(n => n.id === nozId);
             if (noz && qty > 0) {
               const tankIndex = currentTanks.findIndex(t => t.id === noz.tankId);
               if (tankIndex !== -1) {
                 currentTanks[tankIndex] = { ...currentTanks[tankIndex], currentLevel: currentTanks[tankIndex].currentLevel + qty };
                 tanksChanged = true;
               }
             }
           });
        }
        
        // Apply new liters
        Object.keys(updatedFields.litersSold).forEach(nozId => {
             const qty = updatedFields.litersSold[nozId];
             const noz = nozzles.find(n => n.id === nozId);
             if (noz && qty > 0) {
               const tankIndex = currentTanks.findIndex(t => t.id === noz.tankId);
               if (tankIndex !== -1) {
                 currentTanks[tankIndex] = { ...currentTanks[tankIndex], currentLevel: Math.max(0, currentTanks[tankIndex].currentLevel - qty) };
                 tanksChanged = true;
               }
             }
        });
      }

      if (tanksChanged) {
        saveState('tanks', currentTanks, setTanks);
      }

      const updated = shifts.map(s => s.id === id ? { ...s, ...updatedFields } : s);
      saveState('shifts', updated, setShifts);
    },`;

code = code.replace(target, replace);
fs.writeFileSync('src/store.ts', code);
console.log("Patched updateShift.");
