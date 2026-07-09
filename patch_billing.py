import re

with open('src/components/Billing.tsx', 'r') as f:
    content = f.read()

content = content.replace('STATION ERP', '{config.name}')
content = content.replace('123 Route Nationale<br/>Casablanca, Maroc', '{config.address || "123 Route Nationale\\nCasablanca, Maroc"}')
content = content.replace('ICE: 012345678900011', 'ICE: {config.taxId || "012345678900011"}')

with open('src/components/Billing.tsx', 'w') as f:
    f.write(content)

print("Billing patched")
