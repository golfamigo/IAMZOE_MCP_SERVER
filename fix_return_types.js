const fs = require('fs');
const path = require('path');

// 获取路由文件夹路径
const routesDir = path.join(__dirname, 'src', 'routes');
const files = fs.readdirSync(routesDir);

// 针对每个路由文件
files.forEach(file => {
  if (file.endsWith('.ts')) {
    const filePath = path.join(routesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 正则表达式匹配所有的 return res.status... 和 return res.send()
    let updatedContent = content.replace(/return\s+res\.status/g, 'res.status');
    updatedContent = updatedContent.replace(/return\s+res\.send/g, 'res.send');
    updatedContent = updatedContent.replace(/return\s+res\.json/g, 'res.json');
    
    // 在函数结尾添加 return;
    updatedContent = updatedContent.replace(/res\.(status|send|json)([^;]*);(?!\s*return)/g, 'res.$1$2;\nreturn;');

    // 还需要修复 advertisements.ts 文件中的类型问题
    if (file === 'advertisements.ts') {
      updatedContent = updatedContent.replace(
        /advertisements: result\.records\.map\(record => \{\s+const a = record\.get\('a'\)\.properties;\s+return \{[^}]+\};/g,
        'advertisements: result.records.map(record => {\n      const a = record.get(\'a\').properties;\n      return {\n        advertisement_id: a.advertisement_id,\n        business_id: a.business_id,\n        advertisement_name: a.advertisement_name,\n        advertisement_description: a.advertisement_description,\n        advertisement_image_url: a.advertisement_image_url,\n        advertisement_landing_page_url: a.advertisement_landing_page_url,\n        advertisement_start_date: a.advertisement_start_date.toString(),\n        advertisement_end_date: a.advertisement_end_date.toString(),\n        advertisement_budget: a.advertisement_budget,\n        advertisement_target_audience: a.advertisement_target_audience\n      };'
      );
    }
    
    // 保存修改后的文件
    fs.writeFileSync(filePath, updatedContent);
    console.log(`已处理文件: ${file}`);
  }
});

console.log('所有文件处理完成');
