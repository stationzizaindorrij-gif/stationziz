import re

with open('src/store.ts', 'r') as f:
    content = f.read()

search = """    // Pump & Nozzles CRUD
    addPump,
    updatePump,
    deletePump,"""

replace = """    // Pump & Nozzles CRUD
    addPump,
    updatePump,
    deletePump,
    reorderPumps,"""

if search in content:
    content = content.replace(search, replace)
    with open('src/store.ts', 'w') as f:
        f.write(content)
    print("Export patched")
else:
    print("Export not found")
