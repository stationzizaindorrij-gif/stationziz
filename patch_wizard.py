import re

with open('src/components/ShiftWizard.tsx', 'r') as f:
    content = f.read()

search_handleDrop = """  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedPumpId && draggedPumpId !== targetId) {
      const newPumps = [...selectedPumps];
      const sourceIndex = newPumps.indexOf(draggedPumpId);
      const targetIndex = newPumps.indexOf(targetId);
      if (sourceIndex !== -1 && targetIndex !== -1) {
        newPumps.splice(sourceIndex, 1);
        newPumps.splice(targetIndex, 0, draggedPumpId);
        setSelectedPumps(newPumps);
      }
    }
    setDraggedPumpId(null);
  };"""

replace_handleDrop = """  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedPumpId && draggedPumpId !== targetId) {
      if ((store as any).reorderPumps) {
        (store as any).reorderPumps(draggedPumpId, targetId, store.currentRole);
      }
    }
    setDraggedPumpId(null);
  };"""

if search_handleDrop in content:
    content = content.replace(search_handleDrop, replace_handleDrop)
    print("handleDrop replaced")
else:
    print("handleDrop not found")

search_render = """              <div>
                <label className="block text-sm font-bold text-slate-700 mb-4">Pompes gérées (Sélectionnez et glissez pour ordonner)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedPumps.map(id => store.pumps.find(p => p.id === id)!).filter(Boolean).map(pump => (
                    <div 
                      key={pump.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, pump.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, pump.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleTogglePump(pump.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all border-indigo-500 bg-indigo-50 shadow-sm relative ${draggedPumpId === pump.id ? 'opacity-50 border-dashed' : 'opacity-100'} hover:border-indigo-600`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="cursor-move p-1 -ml-1 hover:bg-indigo-100 rounded text-indigo-400 hover:text-indigo-600" onClick={(e) => e.stopPropagation()} title="Glisser pour ordonner">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                          </div>
                          <Fuel className="w-5 h-5 text-indigo-600" />
                        </div>
                        <CheckCircle className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h4 className="font-bold text-indigo-900">{pump.number}</h4>
                    </div>
                  ))}
                  
                  {store.pumps.filter(p => !selectedPumps.includes(p.id)).map(pump => (
                    <div 
                      key={pump.id}
                      onClick={() => handleTogglePump(pump.id)}
                      className="p-4 rounded-xl border-2 cursor-pointer transition-all border-slate-200 bg-white hover:border-indigo-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Fuel className="w-5 h-5 text-slate-400" />
                      </div>
                      <h4 className="font-bold text-slate-700">{pump.number}</h4>
                    </div>
                  ))}
                </div>
              </div>"""

replace_render = """              <div>
                <label className="block text-sm font-bold text-slate-700 mb-4">Pompes gérées (Glissez pour ordonner globalement, Cliquez pour sélectionner)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {store.pumps.map(pump => {
                    const isSelected = selectedPumps.includes(pump.id);
                    return (
                    <div 
                      key={pump.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, pump.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, pump.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleTogglePump(pump.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-sm hover:border-indigo-600' : 'border-slate-200 bg-white hover:border-indigo-200'} relative ${draggedPumpId === pump.id ? 'opacity-50 border-dashed' : 'opacity-100'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="cursor-move p-1 -ml-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600" onClick={(e) => e.stopPropagation()} title="Glisser pour ordonner">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                          </div>
                          <Fuel className={`w-5 h-5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                        </div>
                        {isSelected && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                      </div>
                      <h4 className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{pump.number}</h4>
                    </div>
                  )})}
                </div>
              </div>"""

if search_render in content:
    content = content.replace(search_render, replace_render)
    print("render replaced")
else:
    print("render not found")

with open('src/components/ShiftWizard.tsx', 'w') as f:
    f.write(content)

