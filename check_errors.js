const { execSync } = require('child_process');
try {
  const output = execSync('npx tsc --noEmit', { encoding: 'utf8' });
  console.log("TypeScript 檢查通過，沒有錯誤。");
} catch (error) {
  console.log("TypeScript 檢查仍有錯誤：");
  console.log(error.stdout);
}
