const fs = require('fs');
let storeCode = fs.readFileSync('src/store.ts', 'utf8');

const storeTarget = `    const newShift: Shift = {
      ...shiftData,
      id: \`shift_\${Date.now()}\`,
      status: 'completed'
    };`;

const storeReplace = `    const newShift: Shift = {
      ...shiftData,
      id: shiftData.id || \`shift_\${Date.now()}\`,
      status: 'completed'
    };`;

storeCode = storeCode.replace(storeTarget, storeReplace);

const storeTarget2 = `    saveState('shifts', [newShift, ...shifts], setShifts);`;
const storeReplace2 = `    if (shiftData.id) {
      saveState('shifts', shifts.map(s => s.id === shiftData.id ? newShift : s), setShifts);
    } else {
      saveState('shifts', [newShift, ...shifts], setShifts);
    }`;

storeCode = storeCode.replace(storeTarget2, storeReplace2);
fs.writeFileSync('src/store.ts', storeCode);

let wizardCode = fs.readFileSync('src/components/ShiftWizard.tsx', 'utf8');

const wizardTarget = `    if (editingShift) {
      store.updateShift(editingShift.id, shiftData, store.currentRole);
    } else {
      store.addCompletedShift(shiftData, store.currentRole);
    }`;

const wizardReplace = `    if (editingShift) {
      if (editingShift.status === 'open') {
        store.addCompletedShift({ ...shiftData, id: editingShift.id } as any, store.currentRole);
      } else {
        store.updateShift(editingShift.id, shiftData, store.currentRole);
      }
    } else {
      store.addCompletedShift(shiftData as any, store.currentRole);
    }`;

wizardCode = wizardCode.replace(wizardTarget, wizardReplace);
fs.writeFileSync('src/components/ShiftWizard.tsx', wizardCode);

console.log("Patched store.ts and ShiftWizard.tsx");
