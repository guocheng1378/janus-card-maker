#!/usr/bin/env node
// ─── build.js: 将 CSS/JS 内联到单个 HTML，供 Android WebView 使用 ───
// v2: 支持 ES Modules 打包（去除 import/export，按依赖顺序拼接）

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// 依赖顺序（从无依赖的模块开始）
const JS_FILES = [
  'js/utils.js',           // 无依赖
  'js/state.js',           // 无依赖
  'js/devices.js',         // 无依赖
  'js/maml.js',            // 依赖 utils（escXml 内联）
  'js/templates/clock.js',
  'js/templates/quote.js',
  'js/templates/battery.js',
  'js/templates/status.js',
  'js/templates/countdown.js',
  'js/templates/music.js',
  'js/templates/gradient.js',
  'js/templates/weather.js',
  'js/templates/steps.js',
  'js/templates/calendar.js',
  'js/templates/dualclock.js',
  'js/templates/dailyquote.js',
  'js/templates/ring.js',
  'js/templates/dashboard.js',
  'js/templates/image.js',
  'js/templates/custom.js',
  'js/templates/weather_real.js',
  'js/templates/music_real.js',
  'js/templates/index.js',  // 汇总所有模板
  'js/live-preview.js',     // 依赖 utils, devices
  'js/history.js',          // 依赖 state
  'js/canvas.js',           // 依赖 state, devices
  'js/ui.js',               // 依赖所有上面的
  'js/main.js',             // 入口
];

// 读取并转换模块文件
function stripModules(code) {
  // 移除 import 语句（值已通过拼接顺序保证）
  code = code.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
  code = code.replace(/^import\s+\{[^}]*\}\s+from\s+['"].*?['"];?\s*$/gm, '');
  // 将 export default 转为普通赋值
  code = code.replace(/^export\s+default\s+/gm, '');
  // 将 export function/class/const/var 转为普通声明
  code = code.replace(/^export\s+(function|class|const|var|let)\s+/gm, '$1 ');
  // 将 export { ... } 移除
  code = code.replace(/^export\s*\{[^}]*\};?\s*$/gm, '');
  return code;
}

// 读取所有 JS
const jsParts = JS_FILES.map(f => {
  const fullPath = path.join(ROOT, f);
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  Missing: ${f}`);
    return `// --- MISSING: ${f} ---`;
  }
  const raw = fs.readFileSync(fullPath, 'utf8');
  return `// ─── ${f} ───\n${stripModules(raw)}`;
});

const js = jsParts.join('\n');

// Read CSS
const css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');

// Read JSZip
const jszip = fs.readFileSync(path.join(ROOT, 'lib', 'jszip.min.js'), 'utf8');

// Read index.html and inline everything
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// Replace <link rel="stylesheet" href="css/style.css"> with inline <style>
html = html.replace(
  /<link\s+rel="stylesheet"\s+href="css\/style\.css">/,
  '<style>' + css + '</style>'
);

// Remove manifest and PWA meta (not needed for APK)
html = html.replace(/<link\s+rel="manifest"[^>]*>\s*\n?/, '');
html = html.replace(/<meta\s+name="theme-color"[^>]*>\s*\n?/, '');

// Remove all script tags (both src and module)
html = html.replace(/<script\s+[^>]*><\/script>\s*\n?/g, '');

// Insert inline scripts before </body>
const inlineScripts = [
  '<!-- Inlined by build.js v2 -->',
  '<script>' + jszip + '<\/script>',
  '<script>' + js + '<\/script>',
].join('\n');
html = html.replace('</body>', inlineScripts + '\n</body>');

// Clean up empty lines
html = html.replace(/\n{3,}/g, '\n\n');

// Write output
const outDir = path.join(ROOT, 'app', 'src', 'main', 'assets');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
console.log('✅ Built: ' + path.join(outDir, 'index.html') + ' (' + (html.length / 1024).toFixed(1) + 'KB)');
