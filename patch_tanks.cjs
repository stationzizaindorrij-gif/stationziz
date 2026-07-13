const fs = require('fs');
let code = fs.readFileSync('src/components/Tanks.tsx', 'utf8');

code = code.replace(
  "Volume Théorique: <strong className=\"text-slate-700\">{theorique} L</strong>",
  "Volume Théorique: <strong className=\"text-slate-700\">{theorique.toFixed(2)} L</strong>"
);

code = code.replace(
  "{ecart > 0 ? '+' : ''}{ecart} L",
  "{ecart > 0 ? '+' : ''}{ecart.toFixed(2)} L"
);

fs.writeFileSync('src/components/Tanks.tsx', code);
