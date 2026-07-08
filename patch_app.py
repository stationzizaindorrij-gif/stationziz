import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Remove navigation item
content = content.replace(
    "    { id: 'price_history', label: 'Historique des Prix', icon: History, badge: 0 },\n",
    ""
)

# Remove moduleNames entry
content = content.replace(
    "    price_history: 'Historique des Prix',\n",
    ""
)

# Remove activeModule case
content = content.replace(
    "            {activeModule === 'price_history' && <PriceHistory store={store} />}\n",
    ""
)

# Remove import
content = content.replace(
    "import PriceHistory from './components/PriceHistory';\n",
    ""
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
