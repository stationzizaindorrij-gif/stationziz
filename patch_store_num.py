import re

with open('src/store.ts', 'r') as f:
    content = f.read()

content = content.replace("parseFloat(endCount.elec)", "Number(endCount.elec)")
content = content.replace("parseFloat(startCount.elec)", "Number(startCount.elec)")
content = content.replace("parseFloat(endCount.mech)", "Number(endCount.mech)")
content = content.replace("parseFloat(startCount.mech)", "Number(startCount.mech)")

with open('src/store.ts', 'w') as f:
    f.write(content)
print("Store patched for Number()")
