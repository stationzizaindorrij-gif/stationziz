import re

with open('src/store.ts', 'r') as f:
    content = f.read()

search = """  const deletePump = (id: string, author: string) => {
    const original = pumps.find(p => p.id === id);
    const updated = pumps.filter(p => p.id !== id);
    saveState('pumps', updated, setPumps);
    logAction(author, 'Suppression Pompe', 'Pompes', `Pompe ${original?.number} supprimée`);
  };"""

replace = """  const deletePump = (id: string, author: string) => {
    const original = pumps.find(p => p.id === id);
    const updated = pumps.filter(p => p.id !== id);
    saveState('pumps', updated, setPumps);
    logAction(author, 'Suppression Pompe', 'Pompes', `Pompe ${original?.number} supprimée`);
  };

  const reorderPumps = (sourceId: string, targetId: string, author: string) => {
    const newPumps = [...pumps];
    const sourceIndex = newPumps.findIndex(p => p.id === sourceId);
    const targetIndex = newPumps.findIndex(p => p.id === targetId);
    if (sourceIndex !== -1 && targetIndex !== -1) {
      const [moved] = newPumps.splice(sourceIndex, 1);
      newPumps.splice(targetIndex, 0, moved);
      saveState('pumps', newPumps, setPumps);
      logAction(author, 'Réorganisation Pompes', 'Pompes', `Ordre des pompes modifié`);
    }
  };"""

if search in content:
    content = content.replace(search, replace)
    with open('src/store.ts', 'w') as f:
        f.write(content)
    print("store patched successfully")
else:
    print("Search string not found in store")
