const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src');
let filesModified = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // replace exact string
  const target = "new Date().toISOString().split('T')[0]";
  const replacement = "(new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0])";
  
  if (content.includes(target)) {
    content = content.split(target).join(replacement);
    fs.writeFileSync(file, content);
    console.log("Patched timezone in", file);
    filesModified++;
  }
});

console.log("Total files modified:", filesModified);
