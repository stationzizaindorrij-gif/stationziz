const fs = require('fs');
let code = fs.readFileSync('src/components/Billing.tsx', 'utf8');

code = code.replace(
  'className="fixed inset-0 bg-[#0f172a80] backdrop-blur-sm flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:relative print:z-auto"',
  'className="fixed inset-0 bg-[#0f172a80] backdrop-blur-sm flex items-center justify-center z-50 p-4 print:static print:block print:p-0 print:bg-white print:z-auto"'
);

code = code.replace(
  'className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl mx-auto flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300"',
  'className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl mx-auto flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300 print:shadow-none print:max-w-none print:m-0 print:rounded-none print:block print:overflow-visible"'
);

code = code.replace(
  '<div className="flex-1 overflow-y-auto bg-[#f8fafc80] print:p-0 print:bg-white" ref={printRef}>',
  '<div className="flex-1 overflow-y-auto bg-[#f8fafc80] print:p-0 print:bg-white print:overflow-visible" ref={printRef}>'
);

fs.writeFileSync('src/components/Billing.tsx', code);
