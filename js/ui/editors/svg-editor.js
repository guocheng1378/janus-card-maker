// ─── SVG Editor: SVG 矢量图元素编辑器 ──────────────────────────────
import { fieldHtml, colorFieldHtml, esc } from './common.js';

// 预设 SVG 形状
var SVG_PRESETS = [
  {
    name: '心形',
    icon: '❤️',
    svg: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#e74c3c"/>'
  },
  {
    name: '星形',
    icon: '⭐',
    svg: '<polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" fill="#f39c12"/>'
  },
  {
    name: '闪电',
    icon: '⚡',
    svg: '<polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="#f1c40f"/>'
  },
  {
    name: '箭头',
    icon: '➡️',
    svg: '<path d="M4 12h16m-4-4l4 4-4 4" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    name: '对勾',
    icon: '✅',
    svg: '<path d="M4 12l6 6L20 6" stroke="#2ecc71" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    name: '叉号',
    icon: '❌',
    svg: '<path d="M6 6l12 12M18 6L6 18" stroke="#e74c3c" stroke-width="4" fill="none" stroke-linecap="round"/>'
  },
  {
    name: '圆环',
    icon: '⭕',
    svg: '<circle cx="50" cy="50" r="40" stroke="#6c5ce7" stroke-width="8" fill="none"/>'
  },
  {
    name: '五边形',
    icon: '⬠',
    svg: '<polygon points="50,5 95,38 77,90 23,90 5,38" fill="none" stroke="#00b894" stroke-width="4"/>'
  },
  {
    name: '六边形',
    icon: '⬡',
    svg: '<polygon points="50,2 93,25 93,75 50,98 7,75 7,25" fill="none" stroke="#0984e3" stroke-width="4"/>'
  },
  {
    name: '波浪',
    icon: '〰️',
    svg: '<path d="M0 50 Q25 20 50 50 T100 50" stroke="#48dbfb" stroke-width="4" fill="none"/>'
  },
  {
    name: '三角形',
    icon: '🔺',
    svg: '<polygon points="50,5 95,95 5,95" fill="none" stroke="#e17055" stroke-width="4"/>'
  },
  {
    name: '钻石',
    icon: '💎',
    svg: '<polygon points="50,5 95,50 50,95 5,50" fill="none" stroke="#a29bfe" stroke-width="4"/>'
  },
  {
    name: '月亮',
    icon: '🌙',
    svg: '<path d="M48 4 A38 38 0 1 0 48 96 A28 28 0 1 1 48 4" fill="#f9ca24"/>'
  },
  {
    name: '播放',
    icon: '▶️',
    svg: '<polygon points="20,10 80,50 20,90" fill="#2ecc71"/>'
  },
  {
    name: '暂停',
    icon: '⏸️',
    svg: '<rect x="15" y="10" width="20" height="80" rx="4" fill="#74b9ff"/><rect x="65" y="10" width="20" height="80" rx="4" fill="#74b9ff"/>'
  },
];

export function renderSVGEditor(el, idx) {
  var html = '';

  // 基本属性
  html += fieldHtml('宽度', '<input type="number" value="' + (el.w || 100) + '" data-prop="w" data-idx="' + idx + '" min="10" max="1000">');
  html += fieldHtml('高度', '<input type="number" value="' + (el.h || 100) + '" data-prop="h" data-idx="' + idx + '" min="10" max="1000">');

  // 预设形状
  html += '<div style="grid-column:1/-1;margin-top:8px;padding:10px;background:rgba(156,39,176,0.06);border-radius:8px">';
  html += '<div style="font-size:11px;font-weight:600;margin-bottom:8px;color:var(--accent)">🎨 预设形状（点击应用）</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">';
  SVG_PRESETS.forEach(function (preset, pi) {
    html += '<button class="el-btn svg-preset-btn" data-svg-preset="' + pi + '" data-idx="' + idx + '" style="flex-direction:column;padding:6px 4px;gap:2px;font-size:16px;border-radius:8px" title="' + preset.name + '">' +
      '<span>' + preset.icon + '</span>' +
      '<span style="font-size:9px">' + preset.name + '</span></button>';
  });
  html += '</div></div>';

  // SVG 代码编辑
  html += '<div style="grid-column:1/-1;margin-top:8px">';
  html += '<div style="font-size:11px;font-weight:600;margin-bottom:4px">SVG 代码（&lt;svg&gt; 内部内容）</div>';
  html += '<textarea data-prop="svgContent" data-idx="' + idx + '" rows="5" style="width:100%;padding:8px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:monospace;font-size:11px;resize:vertical" placeholder="粘贴 SVG 标签内容，如 &lt;circle cx=&quot;50&quot; cy=&quot;50&quot; r=&quot;40&quot; fill=&quot;red&quot;/&gt;">' + esc(el.svgContent || '') + '</textarea>';
  html += '</div>';

  // 快速导出按钮
  html += '<div style="grid-column:1/-1;margin-top:8px">';
  html += '<button class="el-btn" data-svg-export="' + idx + '" style="font-size:11px;width:100%;justify-content:center">📥 导出为 PNG 图片</button>';
  html += '<div style="font-size:10px;color:var(--text3);margin-top:4px">💡 SVG 代码作为注释嵌入 MAML，导出 PNG 可替换为 Image 元素</div>';
  html += '</div>';

  return html;
}

// 导出 SVG 预设供外部使用
export { SVG_PRESETS };
