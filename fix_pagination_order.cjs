const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const targetApp = `.eq('user_id', session.user.id)
              .range(from, from + step - 1);`;

const replaceApp = `.eq('user_id', session.user.id)
              .order('id')
              .range(from, from + step - 1);`;

if (appCode.includes(targetApp)) {
    appCode = appCode.replace(targetApp, replaceApp);
    fs.writeFileSync('src/App.tsx', appCode);
    console.log("Patched App.tsx pagination");
}

let storeCode = fs.readFileSync('src/store.ts', 'utf8');
const targetStore = `.eq('user_id', user_id).range(from, from + step - 1);`;
const replaceStore = `.eq('user_id', user_id).order('id').range(from, from + step - 1);`;

if (storeCode.includes(targetStore)) {
    storeCode = storeCode.replace(targetStore, replaceStore);
    fs.writeFileSync('src/store.ts', storeCode);
    console.log("Patched store.ts pagination");
}

