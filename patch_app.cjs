const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add import
if (!content.includes("import Clients from")) {
    content = content.replace("import { Shop } from './components/Shop';", "import { Shop } from './components/Shop';\nimport Clients from './components/Clients';");
}

// 2. Add 'clients' to ActiveModule type
if (!content.includes("'clients'")) {
    content = content.replace("| 'billing'", "| 'billing'\n  | 'clients'");
}

// 3. Add to navigationItems
// Let's find "Billing" or "Shop" and put it there.
// We'll put it right after "Billing" which is Facturation & Achats.
const navItemSearch = "{ id: 'billing', label: 'Facturation & Achats', icon: FileText, badge: 0 },";
if (content.includes(navItemSearch) && !content.includes("id: 'clients'")) {
    content = content.replace(navItemSearch, navItemSearch + "\n    { id: 'clients', label: 'Clients', icon: Users, badge: 0 },");
} else if (!content.includes("id: 'clients'")) {
    const backupSearch = "{ id: 'shop', label: 'Boutique', icon: Package, badge: 0 },";
    content = content.replace(backupSearch, backupSearch + "\n    { id: 'clients', label: 'Clients', icon: Users, badge: 0 },");
}

// 4. Add to Main Viewport
const routerSearch = "{activeModule === 'settings' && <Settings store={store} />}";
if (content.includes(routerSearch) && !content.includes("<Clients store={store} />")) {
    content = content.replace(routerSearch, "{activeModule === 'clients' && <Clients store={store} />}\n            " + routerSearch);
}

fs.writeFileSync('src/App.tsx', content);
console.log('App patched!');
