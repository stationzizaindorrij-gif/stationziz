import re

with open('src/types.ts', 'r') as f:
    content = f.read()

content = content.replace(
    "  stockQuantity: number;\n  status: 'active' | 'inactive';",
    "  stockQuantity: number;\n  minStockAlert?: number;\n  status: 'active' | 'inactive';"
)

with open('src/types.ts', 'w') as f:
    f.write(content)
