import fs from 'node:fs';
const required = ['www/index.html','www/style.css','www/app.js','www/questions_1.js','www/questions_2.js','www/questions_3.js','www/images/home_bg.webp','www/images/category_bg.webp','www/images/quiz_bg.webp','www/images/answer_bg.webp','www/images/settings_bg.webp','www/audio/bgm_main.mp3','www/audio/se_tap.mp3','www/audio/se_answer.mp3'];
for (const p of required) {
  if (!fs.existsSync(p)) throw new Error(`Missing required web asset: ${p}`);
}
console.log('Web assets ready.');
