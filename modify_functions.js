const fs = require('fs');
const path = require('path');

// 定义函数修改文件内容
function modifyFile(filePath) {
  console.log(`正在处理: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 替换 return res.status...
  let modifiedContent = content.replace(/return\s+res\.status\(/g, 'res.status(');
  modifiedContent = modifiedContent.replace(/return\s+res\.send\(/g, 'res.send(');
  modifiedContent = modifiedContent.replace(/return\s+res\.json\(/g, 'res.json(');
  
  // 在函数末尾添加 return;
  modifiedContent = modifiedContent.replace(/res\.(status|send|json)\(([^)]*)\);(?!\s*return)/g, 'res.$1($2);\nreturn;');
  
  fs.writeFileSync(filePath, modifiedContent);
  console.log(`已修改文件: ${filePath}`);
}

// 处理指定的路由文件
const routesPath = path.join(__dirname, 'src', 'routes');
const files = fs.readdirSync(routesPath).filter(file => file.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(routesPath, file);
  modifyFile(filePath);
}

console.log('所有文件处理完成!');
