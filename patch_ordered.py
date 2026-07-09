import re

with open('src/components/ShiftWizard.tsx', 'r') as f:
    content = f.read()

search_state = "const [draggedPumpId, setDraggedPumpId] = useState<string | null>(null);"
replace_state = """const [draggedPumpId, setDraggedPumpId] = useState<string | null>(null);

  const orderedSelectedPumps = store.pumps.filter(p => selectedPumps.includes(p.id)).map(p => p.id);"""

if search_state in content:
    content = content.replace(search_state, replace_state)
    print("State replaced")
else:
    print("State not found")

content = content.replace("selectedPumps.forEach", "orderedSelectedPumps.forEach")

# Wait, we should also change the handleTogglePump
# Actually handleTogglePump updates selectedPumps which is fine.
# But when saving shift, we should save `pumpIds: orderedSelectedPumps`
content = content.replace("pumpIds: selectedPumps,", "pumpIds: orderedSelectedPumps,")

# Let's also check dependencies for useEffects and useMemos
content = content.replace("[selectedPumps, store.nozzles, editingShift]", "[orderedSelectedPumps, store.nozzles, editingShift]")
content = content.replace("[selectedPumps, startCounters, endCounters, store.nozzles, store.products]", "[orderedSelectedPumps, startCounters, endCounters, store.nozzles, store.products]")
content = content.replace("[selectedPumps, store.shifts, store.nozzles, editingShift]", "[orderedSelectedPumps, store.shifts, store.nozzles, editingShift]")

with open('src/components/ShiftWizard.tsx', 'w') as f:
    f.write(content)

