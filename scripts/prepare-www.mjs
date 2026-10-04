import fs from 'node:fs';
const required = ['www/index.html','www/style.css','www/app.js','www/questions.js'];
for (const p of required) {
  if (!fs.existsSync(p)) throw new Error(`Missing required web asset: ${p}`);
}
console.log('Web assets ready.');
