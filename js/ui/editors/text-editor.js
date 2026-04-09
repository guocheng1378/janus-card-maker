// ─── Text Element Editor ──────────────────────────────────────────
import { fieldHtml, colorFieldHtml, esc, FONT_OPTIONS } from './common.js';

var GRAD_PRESETS = [
  { name: '赛博朋克', c1: '#ff00ff', c2: '#00ffff' },
  { name: '日落', c1: '#e55039', c2: '#f39c12' },
  { name: '海洋', c1: '#0984e3', c2: '#00cec9' },
  { name: '森林', c1: '#2d5016', c2: '#6ab04c' },
  { name: '极光', c1: '#6c5ce7', c2: '#00b894' },
  { name: '霓虹', c1: '#ff00ff', c2: '#39ff14' },
  { name: '暗金', c1: '#2c3e50', c2: '#f39c12' },
  { name: '玫瑰', c1: '#e84393', c2: '#fd79a8' },
];

export function renderTextEditor(el, idx) {
  var html = '';

  // ── 内容 ──
  html += fieldHtml('文字', '<input type="text" value="' + esc(el.text || '') + '" data-prop="text" data-idx="' + idx + '">', true);
  html += fieldHtml('表达式', '<input type="text" value="' + esc(el.expression || '') + '" data-prop="expression" data-idx="' + idx + '" placeholder="如 formatDate(\'HH:mm\', #time_sys)" style="font-size:11px"><div style="font-size:10px;color:var(--text3);margin-top:2px">留空使用静态文字，填写后用 textExp 生成</div>', true);

  // ── 字体 & 大小 ──
  html += fieldHtml('字号', '<input type="number" value="' + el.size + '" data-prop="size" data-idx="' + idx + '" min="8" max="200">');
  html += colorFieldHtml('颜色', el.color || '#ffffff', 'color', idx);
  html += '<div class="field"><label>字体</label><select data-prop="fontFamily" data-idx="' + idx + '">' +
    FONT_OPTIONS.map(function (f) {
      return '<option value="' + f.id + '"' + (el.fontFamily === f.id ? ' selected' : '') + '>' + f.name + '</option>';
    }).join('') + '</select></div>';

  // ── 对齐 ──
  html += '<div class="field"><label>对齐</label><div style="display:flex;gap:2px">' +
    ['left', 'center', 'right'].map(function (a) {
      var icons = { left: '⬅', center: '≡', right: '➡' };
      var isActive = (el.textAlign || 'left') === a;
      return '<button class="el-btn" data-prop="textAlign" data-idx="' + idx + '" data-val="' + a + '" style="flex:1;justify-content:center;font-size:12px;padding:6px;background:' + (isActive ? 'var(--accent-glow)' : '') + ';border-color:' + (isActive ? 'var(--accent)' : 'var(--border)') + '">' + icons[a] + '</button>';
    }).join('') + '</div></div>';

  // ── 样式开关 ──
  html += fieldHtml('加粗', '<label class="toggle-switch"><input type="checkbox" data-prop="bold" data-idx="' + idx + '"' + (el.bold ? ' checked' : '') + '><span class="toggle-slider"></span></label>');
  html += fieldHtml('下划线', '<label class="toggle-switch"><input type="checkbox" data-prop="underline" data-idx="' + idx + '"' + (el.underline ? ' checked' : '') + '><span class="toggle-slider"></span></label>');
  html += fieldHtml('删除线', '<label class="toggle-switch"><input type="checkbox" data-prop="strikethrough" data-idx="' + idx + '"' + (el.strikethrough ? ' checked' : '') + '><span class="toggle-slider"></span></label>');

  // ── 间距 & 多行 ──
  html += fieldHtml('字间距', '<input type="number" value="' + (el.letterSpacing || 0) + '" data-prop="letterSpacing" data-idx="' + idx + '" min="-5" max="20" step="0.5">');
  html += fieldHtml('多行', '<label class="toggle-switch"><input type="checkbox" data-prop="multiLine" data-idx="' + idx + '"' + (el.multiLine ? ' checked' : '') + '><span class="toggle-slider"></span></label>');
  if (el.multiLine) {
    html += fieldHtml('行高', '<input type="range" min="10" max="30" value="' + Math.round((el.lineHeight || 1.4) * 10) + '" data-prop="lineHeight" data-idx="' + idx + '" step="1"><span style="font-size:10px;color:var(--text3)">' + (el.lineHeight || 1.4).toFixed(1) + '</span>');
  }
  html += fieldHtml('宽度', '<input type="number" value="' + (el.w || 200) + '" data-prop="w" data-idx="' + idx + '" min="20" max="999">');

  // ── 阴影 ──
  html += '<div class="field"><label>阴影</label><select data-prop="shadow" data-idx="' + idx + '">' +
    [{ v: 'none', l: '无' }, { v: 'light', l: '轻阴影' }, { v: 'dark', l: '深阴影' }, { v: 'glow', l: '发光' }].map(function (s) {
      return '<option value="' + s.v + '"' + ((el.shadow || 'none') === s.v ? ' selected' : '') + '>' + s.l + '</option>';
    }).join('') + '</select></div>';

  // ── 文字渐变 ──
  html += renderTextGradient(el, idx);

  // ── 文字描边 ──
  html += fieldHtml('描边', '<div style="display:flex;gap:6px;align-items:center">' +
    '<input type="number" value="' + (el.textStroke || 0) + '" data-prop="textStroke" data-idx="' + idx + '" min="0" max="10" style="width:60px">' +
    (el.textStroke > 0 ? '<input type="color" value="' + (el.textStrokeColor || '#000000') + '" data-prop="textStrokeColor" data-idx="' + idx + '" style="width:32px;height:28px;padding:2px;border-radius:4px;cursor:pointer;border:1px solid var(--border)">' : '') +
    '</div>');

  return html;
}

function renderTextGradient(el, idx) {
  var gc1 = el.color || '#6c5ce7';
  var gc2 = el.gradientColor2 || '#00b894';
  var html = '<div class="el-editor-section"><div class="el-editor-section-title">🌈 文字渐变</div>';
  html += '<div style="height:36px;border-radius:8px;background:linear-gradient(135deg,' + gc1 + ',' + gc2 + ');margin-bottom:10px"></div>';
  html += '<div style="display:flex;gap:10px;margin-bottom:10px">';
  html += '<div class="field field-color" style="flex:1"><label>起始色</label><input type="color" value="' + gc1 + '" data-prop="color" data-idx="' + idx + '"><span class="color-val">' + gc1 + '</span></div>';
  html += '<div class="field field-color" style="flex:1"><label>结束色</label><input type="color" value="' + gc2 + '" data-prop="gradientColor2" data-idx="' + idx + '"><span class="color-val">' + gc2 + '</span></div>';
  html += '</div>';
  // 渐变方向
  var gradOpts = [
    { v: 'top_bottom', l: '⬇ 上→下' }, { v: 'left_right', l: '➡ 左→右' },
    { v: 'tl_br', l: '↘ 左上→右下' }, { v: 'tr_bl', l: '↙ 右上→左下' },
  ];
  html += '<div class="field"><label>方向</label><select data-prop="gradientOrientation" data-idx="' + idx + '">' +
    gradOpts.map(function (o) {
      return '<option value="' + o.v + '"' + ((el.gradientOrientation || 'top_bottom') === o.v ? ' selected' : '') + '>' + o.l + '</option>';
    }).join('') + '</select></div>';
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">';
  GRAD_PRESETS.forEach(function (p) {
    html += '<div class="grad-preset" data-gp-c1="' + p.c1 + '" data-gp-c2="' + p.c2 + '" data-gp-idx="' + idx + '" data-gp-type="text" style="height:28px;border-radius:5px;background:linear-gradient(135deg,' + p.c1 + ',' + p.c2 + ');cursor:pointer;position:relative" title="' + p.name + '"><span style="position:absolute;bottom:1px;left:0;right:0;text-align:center;font-size:8px;color:rgba(255,255,255,.8);text-shadow:0 1px 2px rgba(0,0,0,.5)">' + p.name + '</span></div>';
  });
  html += '</div></div>';
  return html;
}
