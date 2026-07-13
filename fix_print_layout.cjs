const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '<header className="md:hidden',
  '<header className="md:hidden print:hidden'
);

code = code.replace(
  '<div className="flex-1 flex flex-col h-screen overflow-hidden relative">',
  '<div className="flex-1 flex flex-col h-screen overflow-hidden relative print:h-auto print:overflow-visible print:bg-white">'
);

code = code.replace(
  '<main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">',
  '<main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 print:p-0 print:overflow-visible print:bg-white">'
);

fs.writeFileSync('src/App.tsx', code);
