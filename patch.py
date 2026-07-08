import re

with open('src/components/ShiftWizard.tsx', 'r') as f:
    content = f.read()

state_inject = """  const [selectedPumps, setSelectedPumps] = useState<string[]>(editingShift?.pumpIds || []);
  const [draggedPumpId, setDraggedPumpId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedPumpId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
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
  };

  const handleDragEnd = () => {
    setDraggedPumpId(null);
  };
"""

content = content.replace("  const [selectedPumps, setSelectedPumps] = useState<string[]>(editingShift?.pumpIds || []);", state_inject)

ui_search = """                <label className="block text-sm font-bold text-slate-700 mb-4">Pompes gérées (Sélectionnez)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {store.pumps.map(pump => {
                    const isSelected = selectedPumps.includes(pump.id);
                    return (
                      <div 
                        key={pump.id}
                        onClick={() => handleTogglePump(pump.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-200'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Fuel className={`w-5 h-5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                          {isSelected && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                        </div>
                        <h4 className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{pump.number}</h4>
                      </div>
                    );
                  })}
                </div>"""

ui_inject = """                <label className="block text-sm font-bold text-slate-700 mb-4">Pompes gérées (Sélectionnez et glissez pour ordonner)</label>
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
                </div>"""

# Replace exact string
if ui_search in content:
    content = content.replace(ui_search, ui_inject)
else:
    # use a regex to match properly because spaces might differ
    search_re = re.compile(r'<label className="block text-sm font-bold text-slate-700 mb-4">Pompes gérées \(Sélectionnez\)</label>.*?</div>\s*</div>\s*</div>\s*\)\}', re.DOTALL)
    
    match = search_re.search(content)
    if match:
        print("Found with regex, attempting replace")
    else:
        print("Could not find the UI section to replace!")

with open('src/components/ShiftWizard.tsx', 'w') as f:
    f.write(content)
