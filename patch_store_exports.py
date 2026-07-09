import re

with open('src/store.ts', 'r') as f:
    content = f.read()

search = """    auditLogs,
    alerts,
    users,
    config,
    currentRole,"""

replace = """    auditLogs,
    alerts,
    users,
    config,
    currentRole,
    priceChanges,"""

if search in content:
    content = content.replace(search, replace)
    with open('src/store.ts', 'w') as f:
        f.write(content)
    print("Store patched for priceChanges export")
else:
    print("search not found in store")
