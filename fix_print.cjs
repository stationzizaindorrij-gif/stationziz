const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "<aside className={`",
  "<aside className={`\\n        print:hidden"
);

code = code.replace(
  "function Header",
  "function Header"
); // let's find header

fs.writeFileSync('src/App.tsx', code);
