// ─── UI: 页面导航 + 配置渲染 + 事件 ───────────────────────────────
// 原 ui.js (2349行) 拆分后的精简版，拖拽/撤销/预览逻辑已独立
import * as S from './state.js';
import { getDevice, cameraZoneWidth, generateAutoDetectMAML } from './devices.js';
import { escXml, generateMAML, validateMAML } from './maml.js';
import { TEMPLATES, TPL_CATEGORIES, TPL_CATEGORY_MAP } from './templates/index.js';
import { renderTemplatePreview, PreviewRenderer } from './live-preview.js';
import { captureState, undo, redo, undoTo, getHistoryLabels, resetHistory } from './history.js';
import { initCanvas } from './canvas.js';
import { escHtml, debounce, isDarkColor, fmtSize, getRecentColors, addRecentColor, getFavorites, toggleFavorite } from './utils.js';

// ─── Color & Editor Constants ─────────────────────────────────────
const COLOR_PRESETS = [
  '#ffffff', '#e0e0e0', '#888888', '#333333', '#000000',
  '#ff6b6b', '#ee5a24', '#f0932b', '#fdcb6e', '#ffeaa7',
  '#00b894', '#55efc4', '#4ecdc4', '#0984e3', '#74b9ff',
  '#6c5ce7', '#a29bfe', '#fd79a8', '#e84393', '#d63031',
];

const THEME_PRESETS = [
  { name: '赛博朋克', colors: ['#ff00ff', '#00ffff', '#ff6600', '#0d0221', '#f706cf'] },
  { name: '莫兰迪',   colors: ['#b0a084', '#c9b8a8', '#8b7d6b', '#d5c4a1', '#a0522d'] },
  { name: '霓虹',     colors: ['#39ff14', '#ff073a', '#bc13fe', '#01ffff', '#ffff33'] },
  { name: '暗夜蓝',   colors: ['#0f1b2d', '#1a3a5c', '#2e86de', '#48dbfb', '#c8d6e5'] },
  { name: '日落',     colors: ['#e55039', '#f39c12', '#f8c291', '#78e08f', '#3d3d3d'] },
  { name: '极简',     colors: ['#2d3436', '#636e72', '#b2bec3', '#dfe6e9', '#ffffff'] },
  { name: '糖果',     colors: ['#ff9ff3', '#feca57', '#ff6b6b', '#48dbfb', '#1dd1a1'] },
  { name: '森林',     colors: ['#2d5016', '#4a7c23', '#6ab04c', '#badc58', '#f9ca24'] },
];

const ElementDefaults = {
  text: function () { return { type: 'text', text: '新文字', x: 10, y: 60, size: 24, color: '#ffffff', fontFamily: 'default', textAlign: 'left', bold: false, multiLine: false, w: 200, shadow: 'none', opacity: 100, rotation: 0, lineHeight: 1.4, textGradient: 'none', gradientColor2: '#ff6b6b', textStroke: 0, textStrokeColor: '#000000', locked: false }; },
  rectangle: function () { return { type: 'rectangle', x: 10, y: 60, w: 100, h: 40, color: '#333333', radius: 0, opacity: 100, rotation: 0, fillColor2: '', blur: 0, locked: false }; },
  circle: function () { return { type: 'circle', x: 50, y: 100, r: 30, color: '#6c5ce7', opacity: 100, rotation: 0, locked: false }; },
  line: function () { return { type: 'rectangle', x: 10, y: 100, w: 200, h: 2, color: '#555555', radius: 1, opacity: 60, rotation: 0, _isLine: true, locked: false }; },
  arc: function () { return { type: 'arc', x: 50, y: 50, r: 40, startAngle: 0, endAngle: 270, color: '#6c5ce7', strokeWidth: 6, locked: false }; },
  progress: function () { return { type: 'progress', x: 10, y: 100, w: 200, h: 8, color: '#6c5ce7', bgColor: '#333333', value: 60, radius: 4, locked: false }; },
  lottie: function () { return { type: 'lottie', x: 50, y: 50, w: 120, h: 120, fileName: '', speed: 1, locked: false, _browserOnly: true }; },
};

// ─── Local State ──────────────────────────────────────────────────
var _step = 0;
var _previewTimer = null;
var _zoomLevel = 100;
var _cfgZoomLevel = 100;
var _activeCategory = 'all';
var _thumbCache = {};

// ─── Helpers ──────────────────────────────────────────────────────
function esc(s) { return escHtml(s); }

function getSelectedDevice() {
  return getDevice(document.getElementById('deviceSelect').value);
}

function getCfgDevice() {
  var sel = document.getElementById('cfgDeviceSelect');
  return sel ? getDevice(sel.value) : getDevice('p2');
}

function getCfgShowCamera() {
  var cb = document.getElementById('cfgShowCamera');
  return cb ? cb.checked : true;
}

function isInCameraZone(el, device) {
  var zoneW = device.width * device.cameraZoneRatio;
  var elW = el.w || (el.r ? el.r * 2 : 0) || (el.size ? (el.text || '').length * el.size * 0.6 : 50);
  return el.x < zoneW && (el.x + elW) <= zoneW * 1.5;
}

function getTemplateMAML(tpl, cfg) {
  if (tpl.rawXml) return tpl.rawXml(cfg);
  if (tpl.gen) return tpl.gen(cfg);
  return generateCustomMAML();
}

function generateCustomMAML() {
  var lines = [];
  lines.push(generateAutoDetectMAML());
  lines.push('  <Rectangle w="#view_width" h="#view_height" fillColor="' + S.cfg.bgColor + '" />');
  S.elements.forEach(function (el) {
    switch (el.type) {
      case 'text': {
        var a = el.textAlign && el.textAlign !== 'left' ? ' textAlign="' + el.textAlign + '"' : '';
        var ml = el.multiLine ? ' multiLine="true"' : '';
        var w = el.multiLine || (el.textAlign && el.textAlign !== 'left') ? ' w="' + (el.w || 200) + '"' : '';
        var b = el.bold ? ' bold="true"' : '';
        var ff = el.fontFamily && el.fontFamily !== 'default' ? ' fontFamily="' + el.fontFamily + '"' : '';
        var alpha = (el.opacity !== undefined && el.opacity !== 100) ? ' alpha="' + (el.opacity / 100).toFixed(2) + '"' : '';
        var sh = '';
        if (el.shadow === 'light') sh = ' shadow="1" shadowColor="#000000"';
        else if (el.shadow === 'dark') sh = ' shadow="3" shadowColor="#000000"';
        else if (el.shadow === 'glow') sh = ' shadow="4" shadowColor="' + (el.color || '#ffffff') + '"';
        var tg = '';
        if (el.textGradient && el.textGradient !== 'none') {
          var gradColors = { sunset: '#ff6b6b,#feca57', ocean: '#0984e3,#00cec9', neon: '#ff00ff,#00ffff', gold: '#f39c12,#fdcb6e', aurora: '#6c5ce7,#00b894' };
          var gc = el.textGradient === 'custom' ? (el.color || '#ffffff') + ',' + (el.gradientColor2 || '#ff6b6b') : gradColors[el.textGradient] || gradColors.sunset;
          tg = ' gradientColors="' + gc + '" gradientOrientation="top_bottom"';
        }
        var ts = '';
        if (el.textStroke && el.textStroke > 0) ts = ' stroke="' + el.textStroke + '" strokeColor="' + (el.textStrokeColor || '#000000') + '"';
        var rot = el.rotation ? ' rotation="' + el.rotation + '"' : '';
        var lh = el.multiLine && el.lineHeight && el.lineHeight !== 1.4 ? ' lineHeight="' + el.lineHeight + '"' : '';
        lines.push('    <Text text="' + escXml(el.text || '') + '" x="' + el.x + '" y="' + el.y + '" size="' + el.size + '" color="' + el.color + '"' + w + a + ml + b + ff + alpha + sh + tg + ts + rot + lh + ' />');
        break;
      }
      case 'rectangle': {
        var rectAlpha = (el.opacity !== undefined && el.opacity !== 100) ? ' alpha="' + (el.opacity / 100).toFixed(2) + '"' : '';
        var rectFill = el.fillColor2 ? ' fillColor="' + el.color + '" fillColor2="' + el.fillColor2 + '"' : ' fillColor="' + el.color + '"';
        var rectRot = el.rotation ? ' rotation="' + el.rotation + '"' : '';
        var rectBlur = el.blur ? ' blur="' + el.blur + '"' : '';
        lines.push('    <Rectangle x="' + el.x + '" y="' + el.y + '" w="' + el.w + '" h="' + el.h + '"' + rectFill + (el.radius ? ' cornerRadius="' + el.radius + '"' : '') + rectAlpha + rectRot + rectBlur + ' />');
        break;
      }
      case 'circle':
        var circAlpha = (el.opacity !== undefined && el.opacity !== 100) ? ' alpha="' + (el.opacity / 100).toFixed(2) + '"' : '';
        lines.push('    <Circle x="' + el.x + '" y="' + el.y + '" r="' + el.r + '" fillColor="' + el.color + '"' + circAlpha + (el.rotation ? ' rotation="' + el.rotation + '"' : '') + ' />');
        break;
      case 'image': {
        var imgSrc = el.src || el.fileName || '';
        var folder = imgSrc && S.uploadedFiles[imgSrc] && S.uploadedFiles[imgSrc].mimeType.indexOf('video/') === 0 ? 'videos' : 'images';
        lines.push('    <Image src="' + folder + '/' + escXml(imgSrc) + '" x="' + el.x + '" y="' + el.y + '" w="' + (el.w || 100) + '" h="' + (el.h || 100) + '" />');
        break;
      }
      case 'video':
        lines.push('    <Video src="videos/' + escXml(el.src || el.fileName || '') + '" x="' + el.x + '" y="' + el.y + '" w="' + (el.w || 240) + '" h="' + (el.h || 135) + '" autoPlay="true" loop="true" />');
        break;
      case 'arc':
        lines.push('    <!-- Arc: MAML 不原生支持弧形，用圆形近似 -->');
        lines.push('    <Circle x="' + el.x + '" y="' + el.y + '" r="' + (el.r || 40) + '" fillColor="' + el.color + '" />');
        break;
      case 'progress':
        lines.push('    <Rectangle x="' + el.x + '" y="' + el.y + '" w="' + (el.w || 200) + '" h="' + (el.h || 8) + '" fillColor="' + (el.bgColor || '#333333') + '" cornerRadius="' + (el.radius || 4) + '" />');
        lines.push('    <Rectangle x="' + el.x + '" y="' + el.y + '" w="' + Math.round((el.w || 200) * (el.value || 60) / 100) + '" h="' + (el.h || 8) + '" fillColor="' + el.color + '" cornerRadius="' + (el.radius || 4) + '" />');
        break;
      case 'lottie':
        lines.push('    <!-- Lottie 动画: MAML 引擎不支持，请替换为 Image 或 Video 元素 -->');
        break;
    }
    if (el.animationName && lines.length > 0) {
      var lastLine = lines[lines.length - 1];
      if (lastLine.indexOf('/>') > 0) {
        var anim = ' animationName="' + el.animationName + '" animationDuration="' + (el.animationDuration || 500) + '" animationDelay="' + (el.animationDelay || 0) + '" animationRepeat="' + (el.animationRepeat || 1) + '"';
        if (el.animationInfinite) anim += ' animationInfinite="true"';
        lines[lines.length - 1] = lastLine.replace(' />', anim + ' />');
      }
    }
  });
  return lines.join('\n');
}

// ─── Toast (inline, keeps standalone) ─────────────────────────────
function toast(msg, type, undoFn) {
  var el = document.getElementById('toast');
  if (!el) return;
  var div = document.createElement('div');
  div.className = 'toast-item toast-' + (type || 'info');
  div.innerHTML = '<span>' + msg + '</span>' + (undoFn ? '<button class="toast-undo">撤销</button>' : '');
  if (undoFn) div.querySelector('.toast-undo').onclick = function () { undoFn(); div.remove(); };
  el.appendChild(div);
  setTimeout(function () { div.classList.add('fade-out'); setTimeout(function () { div.remove(); }, 300); }, 3000);
}

function toastProgress(msg) {
  var el = document.getElementById('toast');
  if (!el) return { update: function(){}, close: function(){} };
  var div = document.createElement('div');
  div.className = 'toast-item toast-info';
  div.innerHTML = '<span>' + msg + '</span>';
  el.appendChild(div);
  return {
    update: function (m) { div.querySelector('span').textContent = m; },
    close: function (m, t) { div.querySelector('span').textContent = m; div.className = 'toast-item toast-' + t; setTimeout(function () { div.classList.add('fade-out'); setTimeout(function () { div.remove(); }, 300); }, 2000); }
  };
}

// ─── Step Navigation ──────────────────────────────────────────────
function moveStepSlider(n) {
  var slider = document.getElementById('stepSlider');
  var indicator = document.getElementById('stepIndicator');
  var tabs = indicator.querySelectorAll('.step-tab');
  if (!slider || !tabs[n]) return;
  var tab = tabs[n];
  var iRect = indicator.getBoundingClientRect();
  var tRect = tab.getBoundingClientRect();
  slider.style.left = (tRect.left - iRect.left) + 'px';
  slider.style.width = tRect.width + 'px';
}

function goStep(n) {
  if (n === 1 && !S.tpl) return toast('请先选择一个模板', 'error');
  if (n === 2 && !S.tpl) return toast('请先选择模板并配置', 'error');
  _step = n;
  S.setStep(n);

  document.querySelectorAll('.page').forEach(function (p, i) { p.classList.toggle('active', i === n); });
  document.querySelectorAll('.step-tab').forEach(function (tab) {
    var s = Number(tab.dataset.step);
    tab.classList.remove('active', 'done');
    if (s === n) tab.classList.add('active');
    else if (s < n) tab.classList.add('done');
  });
  moveStepSlider(n);

  document.getElementById('btnBack').style.display = n > 0 ? '' : 'none';
  var btnNext = document.getElementById('btnNext');
  if (n === 2) { btnNext.style.display = 'none'; }
  else {
    btnNext.style.display = '';
    btnNext.innerHTML = n === 0 ? '下一步 <span class="btn-icon">→</span>' : '预览 & 导出 <span class="btn-icon">→</span>';
  }

  if (n === 1) { renderConfig(); syncDeviceSelect('toCfg'); renderLivePreview(); }
  if (n === 2) { syncDeviceSelect('toPreview'); renderPreview(); }

  // Cleanup video elements on page switch
  if (n !== 2) cleanupVideos('previewContent');
  if (n !== 1) cleanupVideos('cfgPreviewContent');

  // Auto-refresh for time-based templates
  clearInterval(_previewTimer);
  if (n >= 1 && S.tpl && (S.tpl.updater === 'DateTime.Minute' || S.tpl.updater === 'DateTime.Day')) {
    _previewTimer = setInterval(function () {
      if (_step === 1) renderLivePreview();
      if (_step === 2) renderPreview();
    }, 1000);
  }
}

function syncDeviceSelect(dir) {
  var devSel = document.getElementById('deviceSelect');
  var cfgDevSel = document.getElementById('cfgDeviceSelect');
  var showCam = document.getElementById('showCamera');
  var cfgShowCam = document.getElementById('cfgShowCamera');
  if (dir === 'toCfg' && devSel && cfgDevSel) { cfgDevSel.value = devSel.value; if (showCam && cfgShowCam) cfgShowCam.checked = showCam.checked; }
  if (dir === 'toPreview' && cfgDevSel && devSel) { devSel.value = cfgDevSel.value; if (cfgShowCam && showCam) showCam.checked = cfgShowCam.checked; }
}

function cleanupVideos(containerId) {
  var el = document.getElementById(containerId);
  if (el) el.querySelectorAll('video').forEach(function (v) { v.pause(); v.src = ''; });
}

// ─── Template Selection ───────────────────────────────────────────
function selectTemplate(id) {
  var tpl = TEMPLATES.find(function (t) { return t.id === id; });
  if (!tpl) return;

  // Cleanup old blob URLs
  Object.keys(S.uploadedFiles).forEach(function (k) {
    var f = S.uploadedFiles[k];
    if (f && f.dataUrl && f.dataUrl.indexOf('blob:') === 0) try { URL.revokeObjectURL(f.dataUrl); } catch (e) {}
  });

  S.setTpl(tpl);
  var newCfg = {};
  tpl.config.forEach(function (g) { g.fields.forEach(function (f) { newCfg[f.key] = f.default; }); });
  S.setCfg(newCfg);
  S.setElements(id === 'custom'
    ? [{ type: 'text', text: 'Hello Card', x: 10, y: 60, size: 28, color: '#ffffff', textAlign: 'left', bold: false, multiLine: false, w: 200 }]
    : []);
  S.setSelIdx(-1);
  S.setDirty(true);
  S.setUploadedFiles({});
  resetHistory();

  renderTplGrid();
  goStep(1);
}

// ─── Template Grid ────────────────────────────────────────────────
function generateTplThumbnail(tpl) {
  if (_thumbCache[tpl.id]) return _thumbCache[tpl.id];
  var cfg = {};
  tpl.config.forEach(function (g) { g.fields.forEach(function (f) { cfg[f.key] = f.default; }); });
  var s = 0.22, w = 420 * s, h = 252 * s;
  try {
    var html = renderTemplatePreview({ width: 976, height: 596, cameraZoneRatio: 0.3 }, false, tpl, cfg);
    var result = '<div style="width:' + w + 'px;height:' + h + 'px;border-radius:6px;overflow:hidden;position:relative;flex-shrink:0"><div style="position:absolute;left:0;top:0;width:' + (976 * s) + 'px;height:' + (596 * s) + 'px;transform-origin:top left;transform:scale(' + s + ')">' + html + '</div></div>';
    _thumbCache[tpl.id] = result;
    return result;
  } catch (e) {
    var fallback = '<div class="tpl-thumb-fallback">' + tpl.icon + '</div>';
    _thumbCache[tpl.id] = fallback;
    return fallback;
  }
}

function renderTplGrid() {
  var favs = getFavorites();
  var sorted = TEMPLATES.slice().sort(function (a, b) {
    var aFav = favs.indexOf(a.id) >= 0 ? 0 : 1;
    var bFav = favs.indexOf(b.id) >= 0 ? 0 : 1;
    return aFav - bFav;
  });
  document.getElementById('tplGrid').innerHTML = sorted.map(function (t) {
    var thumb = generateTplThumbnail(t);
    var isFav = favs.indexOf(t.id) >= 0;
    return '<div class="tpl-card' + (S.tpl && S.tpl.id === t.id ? ' active' : '') + '" data-tpl="' + t.id + '">' +
      '<button class="tpl-fav' + (isFav ? ' active' : '') + '" data-fav="' + t.id + '">' + (isFav ? '⭐' : '☆') + '</button>' +
      '<div class="tpl-thumb">' + thumb + '</div>' +
      '<div class="tpl-card-name">' + t.name + '</div>' +
      '<div class="tpl-card-desc">' + t.desc + '</div></div>';
  }).join('');
  renderTplCategories();
}

function renderTplCategories() {
  var container = document.getElementById('tplCategories');
  if (!container) return;
  container.innerHTML = TPL_CATEGORIES.map(function (cat) {
    return '<button class="tpl-cat' + (_activeCategory === cat.id ? ' active' : '') + '" data-cat="' + cat.id + '">' + cat.label + '</button>';
  }).join('');
}

function filterTemplates(query) {
  clearTimeout(filterTemplates._timer);
  filterTemplates._timer = setTimeout(function () {
    var cards = document.querySelectorAll('.tpl-card');
    query = (query || '').toLowerCase();
    cards.forEach(function (card) {
      var tplId = card.dataset.tpl;
      var name = (card.querySelector('.tpl-card-name') || {}).textContent || '';
      var desc = (card.querySelector('.tpl-card-desc') || {}).textContent || '';
      var catMatch = _activeCategory === 'all' || TPL_CATEGORY_MAP[tplId] === _activeCategory;
      var searchMatch = !query || name.toLowerCase().indexOf(query) >= 0 || desc.toLowerCase().indexOf(query) >= 0 || tplId.indexOf(query) >= 0;
      card.style.display = (catMatch && searchMatch) ? '' : 'none';
    });
  }, 150);
}

// ─── Config Rendering ─────────────────────────────────────────────
function renderConfig() {
  if (!S.tpl) return;
  var device = getSelectedDevice();

  document.getElementById('cfgIcon').textContent = S.tpl.icon;
  document.getElementById('cfgTitle').textContent = S.tpl.name;
  document.getElementById('cfgDesc').textContent = S.tpl.desc;

  var html = '';

  S.tpl.config.forEach(function (group) {
    html += '<div class="config-section"><div class="config-section-title"><span>▸</span> ' + group.group + '</div><div class="config-grid">';
    group.fields.forEach(function (f) { html += renderField(f); });
    html += '</div></div>';
  });

  // Element toolbar
  html += '<div class="config-section"><div class="config-section-title"><span>▸</span> 额外元素' + (S.elements.length > 0 ? ' <span class="el-count-badge">' + S.elements.length + '</span>' : '') + '</div>' +
    '<div class="el-toolbar">' +
    '<button class="el-btn" data-add="text"><span class="el-btn-icon">T</span> 文字</button>' +
    '<button class="el-btn" data-add="rectangle"><span class="el-btn-icon">▢</span> 矩形</button>' +
    '<button class="el-btn" data-add="circle"><span class="el-btn-icon">○</span> 圆形</button>' +
    '<button class="el-btn" data-add="line"><span class="el-btn-icon">─</span> 线条</button>' +
    '<button class="el-btn" data-add="arc"><span class="el-btn-icon">◠</span> 弧形</button>' +
    '<button class="el-btn" data-add="progress"><span class="el-btn-icon">▰</span> 进度条</button>' +
    '<button class="el-btn" data-pick="image"><span class="el-btn-icon">🖼</span> 图片</button>' +
    '<button class="el-btn" data-pick="video"><span class="el-btn-icon">🎬</span> 视频</button>' +
    '<button class="el-btn" data-add="lottie"><span class="el-btn-icon">🎭</span> Lottie</button>' +
    '<button class="el-btn" data-action="importZip" title="导入 MAML ZIP"><span class="el-btn-icon">📦</span> 导入ZIP</button>' +
    '</div>';

  html += '<div style="display:flex;gap:12px;margin-bottom:12px;align-items:center">' +
    '<label class="check-label"><input type="checkbox" id="snapToggle" checked> 吸附网格 (' + S.SNAP_GRID + 'px)</label>' +
    '</div>';

  // Element list
  html += '<div class="el-list">';
  S.elements.forEach(function (el, i) {
    var label = el.type === 'text' ? (el.text || '')
      : el.type === 'image' ? '🖼 ' + (el.fileName || '图片')
      : el.type === 'video' ? '🎬 ' + (el.fileName || '视频')
      : (el.type === 'rectangle' && el.h <= 3 && el.radius >= 1) ? 'line'
      : el.type + ' #' + (i + 1);
    var inCam = isInCameraZone(el, device);
    html += '<div class="el-item' + (S.selIdx === i ? ' active' : '') + '" draggable="true" data-sel="' + i + '">' +
      '<span class="el-badge">' + el.type + '</span>' +
      '<span class="el-item-name">' + esc(label) + '</span>' +
      (inCam ? '<span title="在摄像头遮挡区内" style="color:#e17055;font-size:14px">⚠️</span>' : '') +
      '<button class="el-lock-btn" data-lock="' + i + '" title="锁定/解锁">' + (el.locked ? '🔒' : '🔓') + '</button>' +
      '<span class="el-z-btns">' +
      '<button class="el-z-btn" data-z="up" data-zi="' + i + '" title="上移一层">↑</button>' +
      '<button class="el-z-btn" data-z="down" data-zi="' + i + '" title="下移一层">↓</button>' +
      '</span>' +
      '<button class="el-item-del" data-del="' + i + '">✕</button></div>';
  });
  if (S.elements.length === 0) {
    html += '<div style="text-align:center;padding:20px;color:var(--text3);font-size:12px">点击上方按钮添加元素</div>';
  }
  html += '</div>';

  // Selected element editor (simplified - uses editor.js helpers)
  if (S.selIdx >= 0 && S.selIdx < S.elements.length) {
    html += renderElementEditorInline(S.elements[S.selIdx], S.selIdx, device);
    // Quick alignment
    html += '<div class="config-section" style="margin-top:12px"><div class="config-section-title"><span>▸</span> 快速操作</div>' +
      '<div class="el-toolbar">' +
      '<button class="el-btn" data-align="left" data-ai="' + S.selIdx + '">⬅ 左对齐</button>' +
      '<button class="el-btn" data-align="hcenter" data-ai="' + S.selIdx + '">↔ 水平居中</button>' +
      '<button class="el-btn" data-align="right" data-ai="' + S.selIdx + '">➡ 右对齐</button>' +
      '<button class="el-btn" data-align="top" data-ai="' + S.selIdx + '">⬆ 顶对齐</button>' +
      '<button class="el-btn" data-align="vcenter" data-ai="' + S.selIdx + '">↕ 垂直居中</button>' +
      '<button class="el-btn" data-align="bottom" data-ai="' + S.selIdx + '">⬇ 底对齐</button>' +
      '</div>';
    var selEl = S.elements[S.selIdx];
    if (selEl.type === 'rectangle' || selEl.type === 'image' || selEl.type === 'video') {
      html += '<div class="el-toolbar" style="margin-top:8px">' +
        '<button class="el-btn" data-qsize="full" data-qi="' + S.selIdx + '">全屏</button>' +
        '<button class="el-btn" data-qsize="half" data-qi="' + S.selIdx + '">半屏</button>' +
        '<button class="el-btn" data-qsize="quarter" data-qi="' + S.selIdx + '">1/4</button>' +
        '</div>';
    }
    if (selEl.color !== undefined) html += renderColorPresets('color', S.selIdx);
    html += '</div>';
  }
  html += '</div>';

  // Share buttons
  html += '<div class="config-section"><div class="config-section-title"><span>▸</span> 模板分享</div>' +
    '<div class="el-toolbar">' +
    '<button class="el-btn" data-action="exportTemplate"><span class="el-btn-icon">💾</span> 导出配置</button>' +
    '<button class="el-btn" data-action="importTemplate"><span class="el-btn-icon">📂</span> 导入配置</button>' +
    '<button class="el-btn" data-action="shareTemplate" style="color:var(--green)"><span class="el-btn-icon">🔗</span> 分享链接</button>' +
    '</div></div>';

  document.getElementById('cfgContent').innerHTML = html;
  if (_step === 1) renderLivePreview();
  autoSave();
}

function renderField(f) {
  var v = S.cfg[f.key];
  switch (f.type) {
    case 'text':
      if (f.key === 'bgImage') {
        return '<div class="field"><label>' + f.label + '</label><div style="display:flex;gap:6px"><input type="text" value="' + esc(String(v)) + '" data-cfg="' + f.key + '" placeholder="https://... 或点击上传" style="flex:1"><button class="bg-upload-btn" data-bg-upload title="上传背景图">📁</button></div></div>';
      }
      return '<div class="field"><label>' + f.label + '</label><input type="text" value="' + esc(String(v)) + '" data-cfg="' + f.key + '"></div>';
    case 'textarea':
      return '<div class="field"><label>' + f.label + '</label><textarea rows="3" data-cfg="' + f.key + '">' + esc(String(v)) + '</textarea></div>';
    case 'color': {
      var recent = getRecentColors();
      var swatchHtml = '<div class="color-swatches">';
      recent.forEach(function (c) { swatchHtml += '<span class="color-dot" style="background:' + c + '" data-cfg-color="' + f.key + '" data-color="' + c + '"></span>'; });
      COLOR_PRESETS.forEach(function (c) { swatchHtml += '<span class="color-dot" style="background:' + c + '" data-cfg-color="' + f.key + '" data-color="' + c + '"></span>'; });
      swatchHtml += '</div>';
      return '<div class="field field-color"><label>' + f.label + '</label><input type="color" value="' + v + '" data-cfg="' + f.key + '"><span class="color-val">' + v + '</span>' + swatchHtml + '</div>';
    }
    case 'range':
      return '<div class="field"><label>' + f.label + ': <strong>' + v + '</strong></label><input type="range" min="' + f.min + '" max="' + f.max + '" value="' + v + '" data-cfg="' + f.key + '"></div>';
    case 'select':
      return '<div class="field"><label>' + f.label + '</label><select data-cfg="' + f.key + '">' +
        f.options.map(function (o) { return '<option value="' + o.v + '"' + (v === o.v ? ' selected' : '') + '>' + o.l + '</option>'; }).join('') +
        '</select></div>';
    default: return '';
  }
}

function renderColorPresets(prop, idx) {
  var html = '<div class="color-presets">' +
    COLOR_PRESETS.map(function (c) {
      return '<div class="color-swatch" style="background:' + c + '" data-color="' + c + '" data-cprop="' + prop + '" data-cidx="' + idx + '" title="' + c + '"></div>';
    }).join('') + '</div>';
  html += '<div class="theme-presets">';
  THEME_PRESETS.forEach(function (theme) {
    html += '<div class="theme-preset" data-theme-cprop="' + prop + '" data-theme-cidx="' + idx + '" title="' + theme.name + '">' +
      theme.colors.map(function (c) { return '<div class="theme-dot" style="background:' + c + '"></div>'; }).join('') +
      '<span class="theme-name">' + theme.name + '</span></div>';
  });
  html += '</div>';
  return html;
}

// Simplified inline element editor (full version was in editor.js, this keeps the essential parts)
function renderElementEditorInline(el, idx, device) {
  var html = '<div class="el-detail">';
  if (isInCameraZone(el, device)) {
    var safeX = cameraZoneWidth(device);
    html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;margin-bottom:12px;background:rgba(225,112,85,0.1);border:1px solid rgba(225,112,85,0.3);border-radius:8px;font-size:12px;color:#e17055"><span>⚠️</span> 此元素位于摄像头遮挡区内，建议将 X 调整到 ≥ ' + safeX + '</div>';
  }
  html += '<div class="config-grid">';
  // Common fields
  if (el.type === 'text') {
    html += fieldHtml('文字', '<input type="text" value="' + esc(el.text || '') + '" data-prop="text" data-idx="' + idx + '">', true);
    html += fieldHtml('字号', '<input type="number" value="' + el.size + '" data-prop="size" data-idx="' + idx + '">');
    html += colorFieldHtml('颜色', el.color || '#ffffff', 'color', idx);
    html += fieldHtml('加粗', '<label class="toggle-switch"><input type="checkbox" data-prop="bold" data-idx="' + idx + '"' + (el.bold ? ' checked' : '') + '><span class="toggle-slider"></span></label>');
    html += fieldHtml('多行', '<label class="toggle-switch"><input type="checkbox" data-prop="multiLine" data-idx="' + idx + '"' + (el.multiLine ? ' checked' : '') + '><span class="toggle-slider"></span></label>');
    html += fieldHtml('宽度', '<input type="number" value="' + (el.w || 200) + '" data-prop="w" data-idx="' + idx + '">');
    html += fieldHtml('透明度', '<input type="range" min="0" max="100" value="' + (el.opacity !== undefined ? el.opacity : 100) + '" data-prop="opacity" data-idx="' + idx + '">');
  } else if (el.type === 'rectangle') {
    html += fieldHtml('X', '<input type="number" value="' + el.x + '" data-prop="x" data-idx="' + idx + '">');
    html += fieldHtml('Y', '<input type="number" value="' + el.y + '" data-prop="y" data-idx="' + idx + '">');
    html += fieldHtml('宽', '<input type="number" value="' + el.w + '" data-prop="w" data-idx="' + idx + '">');
    html += fieldHtml('高', '<input type="number" value="' + el.h + '" data-prop="h" data-idx="' + idx + '">');
    html += colorFieldHtml('颜色', el.color || '#333333', 'color', idx);
    html += fieldHtml('圆角', '<input type="number" value="' + (el.radius || 0) + '" data-prop="radius" data-idx="' + idx + '">');
    html += fieldHtml('透明度', '<input type="range" min="0" max="100" value="' + (el.opacity !== undefined ? el.opacity : 100) + '" data-prop="opacity" data-idx="' + idx + '">');
  } else if (el.type === 'circle') {
    html += fieldHtml('中心 X', '<input type="number" value="' + el.x + '" data-prop="x" data-idx="' + idx + '">');
    html += fieldHtml('中心 Y', '<input type="number" value="' + el.y + '" data-prop="y" data-idx="' + idx + '">');
    html += fieldHtml('半径', '<input type="number" value="' + el.r + '" data-prop="r" data-idx="' + idx + '">');
    html += colorFieldHtml('颜色', el.color || '#6c5ce7', 'color', idx);
  } else {
    html += fieldHtml('X', '<input type="number" value="' + el.x + '" data-prop="x" data-idx="' + idx + '">');
    html += fieldHtml('Y', '<input type="number" value="' + el.y + '" data-prop="y" data-idx="' + idx + '">');
    if (el.w !== undefined) html += fieldHtml('宽', '<input type="number" value="' + (el.w || 100) + '" data-prop="w" data-idx="' + idx + '">');
    if (el.h !== undefined) html += fieldHtml('高', '<input type="number" value="' + (el.h || 100) + '" data-prop="h" data-idx="' + idx + '">');
    if (el.color !== undefined) html += colorFieldHtml('颜色', el.color, 'color', idx);
  }
  html += '</div></div>';
  return html;
}

function fieldHtml(label, input, full) {
  return '<div class="field"' + (full ? ' style="grid-column:1/-1"' : '') + '><label>' + label + '</label>' + input + '</div>';
}

function colorFieldHtml(label, value, prop, idx) {
  return '<div class="field field-color"><label>' + label + '</label>' +
    '<input type="color" value="' + value + '" data-prop="' + prop + '" data-idx="' + idx + '">' +
    '<span class="color-val">' + value + '</span></div>';
}

// ─── Preview ──────────────────────────────────────────────────────
function renderPreview() {
  if (!S.tpl) return;
  var device = getSelectedDevice();
  var showCam = document.getElementById('showCamera').checked;

  document.getElementById('deviceLabel').textContent = device.label;
  document.getElementById('previewCamera').style.width = showCam ? (device.cameraZoneRatio * 100) + '%' : '0';

  var html = renderTemplatePreview(device, showCam, S.tpl, S.cfg);
  html += new PreviewRenderer(device, showCam).renderElements(S.elements, S.uploadedFiles, S.selIdx);
  if (S.cfg.bgImage) {
    html = '<div style="position:absolute;inset:0;background-image:url(\'' + S.cfg.bgImage.replace(/'/g, "\\'") + '\');background-size:cover;background-position:center;z-index:-1"></div>' + html;
  }
  document.getElementById('previewContent').innerHTML = html;

  var innerXml = getTemplateMAML(S.tpl, S.cfg);
  var maml;
  if (S.tpl.rawXml) {
    maml = innerXml;
  } else {
    maml = generateMAML({
      cardName: S.cfg.cardName || S.tpl.name,
      device: device,
      innerXml: innerXml,
      updater: S.tpl.updater,
      extraElements: S.elements,
      uploadedFiles: S.uploadedFiles,
      bgImage: S.cfg.bgImage || '',
    });
  }
  document.getElementById('codeContent').value = maml;
  updateCodeEditor();
  S.setDirty(false);
}

function renderLivePreview() {
  if (!S.tpl) return;
  var device = getCfgDevice();
  var showCam = getCfgShowCamera();

  var labelEl = document.getElementById('cfgDeviceLabel');
  if (labelEl) labelEl.textContent = device.label;
  var camEl = document.getElementById('cfgPreviewCamera');
  if (camEl) camEl.style.width = showCam ? (device.cameraZoneRatio * 100) + '%' : '0';

  var html = renderTemplatePreview(device, showCam, S.tpl, S.cfg);
  html += new PreviewRenderer(device, showCam).renderElements(S.elements, S.uploadedFiles, S.selIdx);
  if (S.cfg.bgImage) {
    html = '<div style="position:absolute;inset:0;background-image:url(\'' + S.cfg.bgImage.replace(/'/g, "\\'") + '\');background-size:cover;background-position:center;z-index:-1"></div>' + html;
  }
  var contentEl = document.getElementById('cfgPreviewContent');
  if (contentEl) contentEl.innerHTML = html;
}

// ─── Code Editor ──────────────────────────────────────────────────
function highlightXML(code) {
  return code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="comment">$1</span>')
    .replace(/(&lt;\/?)([\w:.-]+)/g, '$1<span class="tag">$2</span>')
    .replace(/([\w:.-]+)(=)(&quot;[^&]*&quot;|&#39;[^&]*&#39;)/g, '<span class="attr-name">$1</span>$2<span class="attr-val">$3</span>')
    .replace(/(&lt;|&gt;|\/&gt;)/g, '<span class="bracket">$1</span>');
}

function updateCodeEditor() {
  var textarea = document.getElementById('codeContent');
  var gutter = document.getElementById('codeGutter');
  var highlight = document.getElementById('codeHighlight');
  if (!textarea || !gutter || !highlight) return;
  var lines = textarea.value.split('\n');
  var gutterHtml = '';
  for (var i = 1; i <= lines.length; i++) gutterHtml += '<span>' + i + '</span>';
  gutter.innerHTML = gutterHtml;
  highlight.innerHTML = highlightXML(textarea.value) + '\n';
}

function setupCodeEditor() {
  var textarea = document.getElementById('codeContent');
  if (!textarea) return;
  textarea.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      var start = this.selectionStart;
      if (e.shiftKey) {
        var lineStart = this.value.lastIndexOf('\n', start - 1) + 1;
        if (this.value.substring(lineStart).indexOf('  ') === 0) {
          this.value = this.value.substring(0, lineStart) + this.value.substring(lineStart + 2);
          this.selectionStart = this.selectionEnd = Math.max(lineStart, start - 2);
        }
      } else {
        this.value = this.value.substring(0, start) + '  ' + this.value.substring(this.selectionEnd);
        this.selectionStart = this.selectionEnd = start + 2;
      }
      updateCodeEditor();
    }
  });
  textarea.addEventListener('input', updateCodeEditor);
  textarea.addEventListener('scroll', function () {
    var highlight = document.getElementById('codeHighlight');
    var gutter = document.getElementById('codeGutter');
    if (highlight) highlight.style.transform = 'translate(' + (-this.scrollLeft) + 'px,' + (-this.scrollTop) + 'px)';
    if (gutter) gutter.style.transform = 'translateY(' + (-this.scrollTop) + 'px)';
  });
}

// ─── Element Operations ───────────────────────────────────────────
function addElement(type) {
  captureState('添加 ' + type);
  if (ElementDefaults[type]) {
    var newEl = JSON.parse(JSON.stringify(ElementDefaults[type]()));
    if (type === 'lottie') toast('⚠️ Lottie 仅浏览器预览可用，MAML 不支持此格式', 'warning');
    if (type === 'arc') toast('⚠️ 弧形在 MAML 中用圆形模拟', 'info');
    S.elements.push(newEl);
    S.setSelIdx(S.elements.length - 1);
    S.setDirty(true);
    renderConfig();
  }
}

function removeElement(idx) {
  captureState('删除元素');
  var el = S.elements[idx];
  if (el && el.fileName) {
    var stillUsed = S.elements.some(function (e, i) { return i !== idx && e.fileName === el.fileName; });
    if (!stillUsed) {
      var fi = S.uploadedFiles[el.fileName];
      if (fi && fi.dataUrl && fi.dataUrl.indexOf('blob:') === 0) try { URL.revokeObjectURL(fi.dataUrl); } catch (e) {}
      delete S.uploadedFiles[el.fileName];
    }
  }
  S.elements.splice(idx, 1);
  if (S.selIdx >= S.elements.length) S.setSelIdx(S.elements.length - 1);
  S.setDirty(true);
  renderConfig();
  toast('🗑️ 已删除', 'success', undo);
}

function alignElement(idx, align) {
  if (idx < 0 || idx >= S.elements.length) return;
  captureState('对齐 ' + align);
  var device = getSelectedDevice();
  var el = S.elements[idx];
  var ew = el.w || (el.r ? el.r * 2 : 0) || 100;
  var eh = el.h || (el.r ? el.r * 2 : 0) || 30;
  var safeW = device.width * (1 - device.cameraZoneRatio);
  var marginL = Math.ceil(device.width * device.cameraZoneRatio);
  switch (align) {
    case 'left':    el.x = marginL + 10; break;
    case 'hcenter': el.x = marginL + Math.round((safeW - ew) / 2); break;
    case 'right':   el.x = marginL + safeW - ew - 10; break;
    case 'top':     el.y = 10; break;
    case 'vcenter': el.y = Math.round((device.height - eh) / 2); break;
    case 'bottom':  el.y = device.height - eh - 10; break;
  }
  S.setDirty(true);
  renderConfig();
}

function applyQuickSize(idx, size) {
  if (idx < 0 || idx >= S.elements.length) return;
  captureState('调整大小 ' + size);
  var device = getSelectedDevice();
  var el = S.elements[idx];
  var safeW = device.width * (1 - device.cameraZoneRatio);
  switch (size) {
    case 'full':    el.w = Math.round(safeW - 20); el.h = device.height - 20; break;
    case 'half':    el.w = Math.round(safeW - 20); el.h = Math.round(device.height / 2 - 20); break;
    case 'quarter': el.w = Math.round(safeW / 2 - 20); el.h = Math.round(device.height / 2 - 20); break;
  }
  S.setDirty(true);
  renderConfig();
}

function moveElementZ(idx, dir) {
  captureState('调整层级');
  var newIdx = dir === 'up' ? idx + 1 : idx - 1;
  if (newIdx < 0 || newIdx >= S.elements.length) return;
  var tmp = S.elements[idx];
  S.elements[idx] = S.elements[newIdx];
  S.elements[newIdx] = tmp;
  S.setSelIdx(newIdx);
  S.setDirty(true);
  renderConfig();
}

// ─── Export ───────────────────────────────────────────────────────
function handleExport() {
  if (!S.tpl) return toast('请先选择模板', 'error');
  var device = getSelectedDevice();
  var innerXml = getTemplateMAML(S.tpl, S.cfg);
  var maml = S.tpl.rawXml ? innerXml : generateMAML({
    cardName: S.cfg.cardName || S.tpl.name, device: device, innerXml: innerXml,
    updater: S.tpl.updater, extraElements: S.elements, uploadedFiles: S.uploadedFiles, bgImage: S.cfg.bgImage || '',
  });
  var validation = validateMAML(maml);
  if (!validation.valid) return toast('XML 校验失败: ' + validation.errors[0], 'error');

  var p = toastProgress('正在打包 ZIP...');
  JCM.exportZip(maml, S.cfg.cardName || 'card', S.elements, S.uploadedFiles, S.tpl.id === 'custom', S.cfg.bgImage || '')
    .then(function () { p.close('✅ ZIP 已导出', 'success'); })
    .catch(function (e) { p.close('导出失败: ' + e.message, 'error'); });
}

function handleExportPNG() {
  var p = toastProgress('正在导出 PNG...');
  JCM.exportPNG(S.cfg.cardName || 'card', S.cfg, S.elements, S.tpl, S.uploadedFiles)
    .then(function () { p.close('✅ PNG 已导出', 'success'); })
    .catch(function (e) { p.close('导出失败: ' + e.message, 'error'); });
}

function handleExportSVG() {
  JCM.exportSVG(S.cfg.cardName || 'card', S.cfg, S.elements, S.uploadedFiles)
    .then(function () { toast('✅ SVG 已导出', 'success'); })
    .catch(function (e) { toast('导出失败: ' + e.message, 'error'); });
}

function handleBatchExport() {
  if (!S.tpl) return toast('请先选择模板', 'error');
  var deviceKeys = ['p2', 'q200', 'q100', 'ultra'];
  var errors = [];
  toast('📦 正在批量导出 4 个机型...', 'info');
  var promises = deviceKeys.map(function (dk) {
    var device = getDevice(dk);
    var innerXml = getTemplateMAML(S.tpl, S.cfg);
    var maml = S.tpl.rawXml ? innerXml : generateMAML({
      cardName: (S.cfg.cardName || S.tpl.name) + '_' + dk, device: device, innerXml: innerXml,
      updater: S.tpl.updater, extraElements: S.elements, uploadedFiles: S.uploadedFiles, bgImage: S.cfg.bgImage || '',
    });
    var validation = validateMAML(maml);
    if (!validation.valid) { errors.push(device.label + ': ' + validation.errors[0]); return Promise.resolve(); }
    return JCM.exportZip(maml, (S.cfg.cardName || 'card') + '_' + dk, S.elements, S.uploadedFiles, S.tpl.id === 'custom', S.cfg.bgImage || '')
      .catch(function (e) { errors.push(device.label + ': ' + e.message); });
  });
  Promise.all(promises).then(function () {
    if (errors.length > 0) toast('部分导出失败: ' + errors.join(', '), 'error');
    else toast('✅ 全部 4 个机型已导出', 'success');
  });
}

function handleUniversalExport() {
  if (!S.tpl) return toast('请先选择模板', 'error');
  var baseDevice = getDevice('p2');
  var innerXml = getTemplateMAML(S.tpl, S.cfg);
  var maml = S.tpl.rawXml ? innerXml : generateMAML({
    cardName: S.cfg.cardName || S.tpl.name, device: baseDevice, innerXml: innerXml,
    updater: S.tpl.updater, extraElements: S.elements, uploadedFiles: S.uploadedFiles, bgImage: S.cfg.bgImage || '',
  });
  var validation = validateMAML(maml);
  if (!validation.valid) return toast('XML 校验失败: ' + validation.errors[0], 'error');
  JCM.exportZip(maml, (S.cfg.cardName || 'card') + '_all', S.elements, S.uploadedFiles, S.tpl.id === 'custom', S.cfg.bgImage || '')
    .then(function () { toast('✅ 通用卡片已导出（适配所有机型）', 'success'); })
    .catch(function (e) { toast('导出失败: ' + e.message, 'error'); });
}

// ─── Import ───────────────────────────────────────────────────────
function handleImportZip() {
  var input = document.createElement('input');
  input.type = 'file'; input.accept = '.zip';
  input.onchange = function () {
    var file = input.files[0]; if (!file) return;
    Object.keys(S.uploadedFiles).forEach(function (k) {
      var f = S.uploadedFiles[k];
      if (f && f.dataUrl && f.dataUrl.indexOf('blob:') === 0) try { URL.revokeObjectURL(f.dataUrl); } catch (e) {}
    });
    JCM.importZip(file).then(function (data) {
      S.setTpl(TEMPLATES.find(function (t) { return t.id === 'custom'; }));
      var newCfg = { cardName: data.cardName, bgColor: data.bgColor };
      if (data.bgImage) newCfg.bgImage = data.bgImage;
      S.setCfg(newCfg);
      S.setElements(data.elements.map(function(el) {
        if (el.type === 'image' && el.fileName && data.files[el.fileName] && data.files[el.fileName].mimeType === 'image/gif') {
          data.files[el.fileName].mimeType = 'video/gif';
          el.type = 'video';
        }
        return el;
      }));
      S.setUploadedFiles(data.files);
      S.setSelIdx(-1); S.setDirty(true);
      resetHistory();
      renderTplGrid(); goStep(1);
      toast('✅ ZIP 已导入', 'success');
    }).catch(function (e) { toast('导入失败: ' + e.message, 'error'); });
  };
  input.click();
}

// ─── File Handling ────────────────────────────────────────────────
function handleFilePicked(e) {
  var input = e.target;
  var file = input.files && input.files[0];
  if (!file) return;

  var type = S.pendingAdd;
  var replaceIdx = S.pendingReplace;
  S.setPendingAdd(null);
  S.setPendingReplace(-1);

  var isGif = file.type === 'image/gif';
  if (isGif) type = 'video';
  var isVideo = file.type.indexOf('video/') === 0 || isGif;
  var needTranscode = isVideo && JCM.needsTranscode && JCM.needsTranscode(file);

  function doStore(workingFile) {
    var finalIsVideo = workingFile.type.indexOf('video/') === 0 || isGif;
    var ext = workingFile.name.split('.').pop() || (type === 'image' ? 'png' : 'mp4');
    var safeName = 'media_' + Date.now() + '.' + ext;

    if (finalIsVideo || type === 'video') {
      var reader = new FileReader();
      reader.onload = function (ev) {
        var buf = ev.target.result;
        var blobUrl = URL.createObjectURL(new Blob([buf], { type: workingFile.type }));
        S.uploadedFiles[safeName] = { data: buf, mimeType: isGif ? 'video/gif' : workingFile.type, dataUrl: blobUrl, originalName: workingFile.name };
        captureState();
        if (replaceIdx >= 0 && replaceIdx < S.elements.length) {
          S.elements[replaceIdx].fileName = safeName; S.elements[replaceIdx].src = safeName;
        } else {
          S.elements.push({ type: 'video', fileName: safeName, src: safeName, x: 10, y: 60, w: 240, h: 135 });
          S.setSelIdx(S.elements.length - 1);
        }
        S.setDirty(true); renderConfig(); toast(workingFile.name + ' 已添加', 'success');
      };
      reader.readAsArrayBuffer(workingFile);
    } else {
      var reader2 = new FileReader();
      reader2.onload = function (ev) {
        var dataUrl = ev.target.result;
        var base64 = dataUrl.split(',')[1];
        var bin = atob(base64);
        var arr = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        S.uploadedFiles[safeName] = { data: arr.buffer, mimeType: workingFile.type, dataUrl: dataUrl, originalName: workingFile.name };
        captureState();
        if (replaceIdx >= 0 && replaceIdx < S.elements.length) {
          S.elements[replaceIdx].fileName = safeName; S.elements[replaceIdx].src = safeName;
        } else {
          S.elements.push({ type: type, fileName: safeName, src: safeName, x: 10, y: 60, w: 200, h: 200 });
          S.setSelIdx(S.elements.length - 1);
        }
        S.setDirty(true); renderConfig(); toast(workingFile.name + ' 已添加', 'success');
      };
      reader2.readAsDataURL(workingFile);
    }
  }

  if (needTranscode) {
    var tp = toastProgress('正在转码为 MP4 (H.264)...');
    JCM.transcodeToH264(file).then(function (transcodedFile) {
      tp.close('✅ 转码完成', 'success'); doStore(transcodedFile);
    }).catch(function (err) {
      tp.close('⚠️ 转码失败，使用原始文件', 'warning'); doStore(file);
    });
  } else {
    doStore(file);
  }
}

// ─── Zoom ─────────────────────────────────────────────────────────
function applyZoom() {
  var phone = document.querySelector('#page2 .preview-phone');
  if (phone) phone.style.transform = 'scale(' + (_zoomLevel / 100) + ')';
  var label = document.getElementById('zoomLabel');
  if (label) label.textContent = _zoomLevel + '%';
}

function applyCfgZoom() {
  var phone = document.querySelector('.config-preview-phone');
  if (phone) phone.style.transform = 'scale(' + (_cfgZoomLevel / 100) + ')';
  var label = document.getElementById('cfgZoomLabel');
  if (label) label.textContent = _cfgZoomLevel + '%';
}

// ─── Auto-save ────────────────────────────────────────────────────
var _autoSaveTimer = null;
function autoSave() {
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(function () {
    var el = document.getElementById('autosaveIndicator');
    if (JCM.Storage) {
      JCM.Storage.saveDraft(S.tpl ? S.tpl.id : null, S.cfg, S.elements, S.uploadedFiles)
        .then(function () { if (el) { el.classList.add('show'); setTimeout(function () { el.classList.remove('show'); }, 1500); } })
        .catch(function () { saveDraftLocal(); });
    } else { saveDraftLocal(); }
  }, 2000);
}

function saveDraftLocal() {
  try {
    localStorage.setItem('jcm-draft', JSON.stringify({ tplId: S.tpl ? S.tpl.id : null, cfg: S.cfg, elements: S.elements, timestamp: Date.now() }));
    var el = document.getElementById('autosaveIndicator');
    if (el) { el.classList.add('show'); setTimeout(function () { el.classList.remove('show'); }, 1500); }
  } catch (e) {}
}

// ─── Share URL ────────────────────────────────────────────────────
function shareTemplate() {
  if (!S.tpl) return toast('请先选择模板', 'error');
  var data = { t: S.tpl.id, c: S.cfg, e: S.tpl.id === 'custom' ? S.elements : undefined };
  var json = JSON.stringify(data);
  var encoded = btoa(unescape(encodeURIComponent(json)));
  var url = location.origin + location.pathname + '#share=' + encoded;
  if (url.length > 8000) return toast('⚠️ 模板数据过大，无法通过 URL 分享', 'warning');
  navigator.clipboard.writeText(url).then(function () { toast('📋 分享链接已复制！', 'success'); });
}

function checkShareURL() {
  var hash = location.hash;
  if (hash.indexOf('#share=') !== 0) return;
  try {
    var encoded = hash.substring(7);
    var json = decodeURIComponent(escape(atob(encoded)));
    var data = JSON.parse(json);
    var tpl = TEMPLATES.find(function (t) { return t.id === data.t; });
    if (!tpl) return;
    S.setTpl(tpl);
    var newCfg = {};
    tpl.config.forEach(function (g) { g.fields.forEach(function (f) { newCfg[f.key] = data.c[f.key] !== undefined ? data.c[f.key] : f.default; }); });
    S.setCfg(newCfg);
    if (data.e) S.setElements(data.e);
    S.setDirty(true); resetHistory();
    renderTplGrid(); goStep(1);
    toast('✅ 已导入分享模板: ' + tpl.name, 'success');
    history.replaceState(null, '', location.pathname);
  } catch (e) { console.warn('Share URL parse failed:', e); }
}

// ─── Build APK ────────────────────────────────────────────────────
function _encodeToken(t) { try { return btoa(unescape(encodeURIComponent(t))); } catch (e) { return ''; } }
function _decodeToken(t) { try { return decodeURIComponent(escape(atob(t))); } catch (e) { return ''; } }

function triggerBuild() {
  var raw = localStorage.getItem('jcm-gh-token');
  var token = raw ? _decodeToken(raw) : '';
  if (!token) {
    token = prompt('输入 GitHub Personal Access Token（需 repo 权限，仅保存在本地）：');
    if (!token) return;
    localStorage.setItem('jcm-gh-token', _encodeToken(token));
  }
  toast('🚀 正在触发 APK 构建...', 'info');
  fetch('https://api.github.com/repos/guocheng1378/janus-card-maker/actions/workflows/build.yml/dispatches', {
    method: 'POST',
    headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: 'main' }),
  }).then(function (res) {
    if (res.status === 204) toast('✅ APK 构建已触发！', 'success');
    else if (res.status === 401) { localStorage.removeItem('jcm-gh-token'); toast('❌ Token 无效', 'error'); }
    else toast('❌ 触发失败: HTTP ' + res.status, 'error');
  }).catch(function (e) { toast('❌ 网络错误: ' + e.message, 'error'); });
}

// ─── Event Setup ──────────────────────────────────────────────────
var _autoPreview = debounce(function () {
  S.setDirty(true);
  if (_step === 1) renderLivePreview();
  if (_step === 2) renderPreview();
}, 300);

function setupEvents() {
  // Template grid click
  document.getElementById('tplGrid').addEventListener('click', function (e) {
    var card = e.target.closest('.tpl-card');
    if (card) selectTemplate(card.dataset.tpl);
  });

  // Category tabs
  var catContainer = document.getElementById('tplCategories');
  if (catContainer) catContainer.addEventListener('click', function (e) {
    var btn = e.target.closest('.tpl-cat');
    if (!btn) return;
    _activeCategory = btn.dataset.cat;
    document.querySelectorAll('.tpl-cat').forEach(function (b) { b.classList.toggle('active', b === btn); });
    filterTemplates(document.getElementById('tplSearch').value);
  });

  // Config content events (delegated)
  var _cfgChangeTimer = null;
  document.getElementById('cfgContent').addEventListener('input', function (e) {
    var t = e.target;
    if (t.dataset.cfg) {
      if (!_cfgChangeTimer) captureState('修改配置');
      clearTimeout(_cfgChangeTimer);
      _cfgChangeTimer = setTimeout(function () { _cfgChangeTimer = null; }, 1000);
      var key = t.dataset.cfg;
      if (t.type === 'range') { S.cfg[key] = Number(t.value); t.previousElementSibling.querySelector('strong').textContent = t.value; }
      else if (t.type === 'color') { S.cfg[key] = t.value; var cv = t.nextElementSibling; if (cv && cv.classList.contains('color-val')) cv.textContent = t.value; }
      else S.cfg[key] = t.value;
      S.setDirty(true);
    }
    if (t.dataset.prop) {
      if (!_cfgChangeTimer) captureState('修改元素');
      clearTimeout(_cfgChangeTimer);
      _cfgChangeTimer = setTimeout(function () { _cfgChangeTimer = null; }, 1000);
      var idx = Number(t.dataset.idx), prop = t.dataset.prop;
      if (t.type === 'number' || t.type === 'range') S.elements[idx][prop] = Number(t.value);
      else if (t.type === 'color') { S.elements[idx][prop] = t.value; var cv2 = t.nextElementSibling; if (cv2 && cv2.classList.contains('color-val')) cv2.textContent = t.value; }
      else S.elements[idx][prop] = t.value;
      S.setDirty(true);
    }
    _autoPreview(); autoSave();
  });

  document.getElementById('cfgContent').addEventListener('change', function (e) {
    var t = e.target;
    var changed = false;
    if (t.dataset.cfg && t.tagName === 'SELECT') { S.cfg[t.dataset.cfg] = t.value; S.setDirty(true); changed = true; }
    if (t.dataset.prop && t.tagName === 'SELECT') {
      var idx = Number(t.dataset.idx), val = t.value;
      if (val === 'true') val = true; else if (val === 'false') val = false;
      S.elements[idx][t.dataset.prop] = val; S.setDirty(true); changed = true; renderConfig();
    }
    if (t.dataset.prop && t.type === 'checkbox' && t.dataset.idx) {
      S.elements[Number(t.dataset.idx)][t.dataset.prop] = t.checked; S.setDirty(true); changed = true; renderConfig();
    }
    if (changed) { _autoPreview(); autoSave(); }
  });

  document.getElementById('cfgContent').addEventListener('click', function (e) {
    var item = e.target.closest('.el-item');
    if (item && !e.target.closest('.el-item-del') && !e.target.closest('.el-z-btn') && !e.target.closest('.el-lock-btn')) {
      S.setSelIdx(Number(item.dataset.sel)); renderConfig(); return;
    }
    var del = e.target.closest('.el-item-del');
    if (del) { e.stopPropagation(); removeElement(Number(del.dataset.del)); return; }
    var zBtn = e.target.closest('.el-z-btn');
    if (zBtn) { e.stopPropagation(); moveElementZ(Number(zBtn.dataset.zi), zBtn.dataset.z); return; }
    var lockBtn = e.target.closest('[data-lock]');
    if (lockBtn) { e.stopPropagation(); var li = Number(lockBtn.dataset.lock); if (li >= 0 && li < S.elements.length) { S.elements[li].locked = !S.elements[li].locked; renderConfig(); toast(S.elements[li].locked ? '🔒 已锁定' : '🔓 已解锁', 'info'); } return; }
    var addBtn = e.target.closest('[data-add]');
    if (addBtn) { addElement(addBtn.dataset.add); return; }
    var pickBtn = e.target.closest('[data-pick]');
    if (pickBtn) { S.setPendingAdd(pickBtn.dataset.pick); S.setPendingReplace(-1); document.getElementById(pickBtn.dataset.pick === 'image' ? 'fileImagePick' : 'fileVideoPick').click(); return; }
    var actionBtn = e.target.closest('[data-action]');
    if (actionBtn) { var a = actionBtn.dataset.action; if (a === 'importZip') handleImportZip(); else if (a === 'shareTemplate') shareTemplate(); return; }
    var alignBtn = e.target.closest('[data-align]');
    if (alignBtn) { alignElement(Number(alignBtn.dataset.ai), alignBtn.dataset.align); return; }
    var sizeBtn = e.target.closest('[data-qsize]');
    if (sizeBtn) { applyQuickSize(Number(sizeBtn.dataset.qi), sizeBtn.dataset.qsize); return; }
    var swatch = e.target.closest('.color-swatch');
    if (swatch) { captureState(); S.elements[Number(swatch.dataset.cidx)][swatch.dataset.cprop] = swatch.dataset.color; S.setDirty(true); renderConfig(); return; }
    var colorDot = e.target.closest('.color-dot');
    if (colorDot) { S.cfg[colorDot.dataset.cfgColor] = colorDot.dataset.color; addRecentColor(colorDot.dataset.color); S.setDirty(true); _autoPreview(); return; }
    var favBtn = e.target.closest('[data-fav]');
    if (favBtn) { e.stopPropagation(); var isFav = toggleFavorite(favBtn.dataset.fav); favBtn.textContent = isFav ? '⭐' : '☆'; favBtn.classList.toggle('active', isFav); return; }
  });

  // File inputs
  document.getElementById('fileImagePick').addEventListener('change', handleFilePicked);
  document.getElementById('fileVideoPick').addEventListener('change', handleFilePicked);

  // Device selects
  document.getElementById('deviceSelect').addEventListener('change', function () { renderPreview(); });
  document.getElementById('showCamera').addEventListener('change', function () { renderPreview(); });
  document.getElementById('cfgDeviceSelect').addEventListener('change', function () { syncDeviceSelect('toPreview'); renderLivePreview(); });
  document.getElementById('cfgShowCamera').addEventListener('change', function () { document.getElementById('showCamera').checked = this.checked; renderLivePreview(); });

  // Keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    var isInCodeEditor = e.target.id === 'codeContent';
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey && !isInCodeEditor) { e.preventDefault(); var r = undo(); if (r && r.needsRerender) { renderConfig(); toast(r.message, 'success'); } }
    if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey)) && !isInCodeEditor) { e.preventDefault(); var r2 = redo(); if (r2 && r2.needsRerender) { renderConfig(); toast(r2.message, 'success'); } }
    if (e.key === 'Delete' && S.selIdx >= 0) { e.preventDefault(); removeElement(S.selIdx); }
    if (e.ctrlKey && e.key === 'd' && S.selIdx >= 0) {
      e.preventDefault(); captureState();
      var clone = JSON.parse(JSON.stringify(S.elements[S.selIdx])); clone.x += 10; clone.y += 10;
      S.elements.push(clone); S.setSelIdx(S.elements.length - 1); S.setDirty(true); renderConfig(); toast('✅ 已复制元素', 'success');
    }
    if (e.ctrlKey && e.key === 'c' && S.selIdx >= 0) { e.preventDefault(); S.setClipboard(JSON.parse(JSON.stringify(S.elements[S.selIdx]))); toast('📋 已复制', 'success'); }
    if (e.ctrlKey && e.key === 'v' && S.clipboard) {
      e.preventDefault(); captureState();
      var paste = JSON.parse(JSON.stringify(S.clipboard)); paste.x += 10; paste.y += 10;
      S.elements.push(paste); S.setSelIdx(S.elements.length - 1); S.setDirty(true); renderConfig(); toast('📋 已粘贴', 'success');
    }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key) >= 0 && S.selIdx >= 0 && !S.elements[S.selIdx].locked) {
      e.preventDefault(); var step = e.shiftKey ? 10 : 1; var el = S.elements[S.selIdx];
      captureState('移动');
      if (e.key === 'ArrowUp') el.y = Math.max(0, el.y - step);
      if (e.key === 'ArrowDown') el.y += step;
      if (e.key === 'ArrowLeft') el.x = Math.max(0, el.x - step);
      if (e.key === 'ArrowRight') el.x += step;
      S.setDirty(true); renderConfig(); if (_step === 2) renderPreview();
    }
  });

  // Drag & drop files
  document.querySelector('.content').addEventListener('drop', function (e) {
    e.preventDefault(); e.stopPropagation();
    var files = e.dataTransfer.files; if (!files.length) return;
    var file = files[0];
    if (file.type.indexOf('image/') === 0) {
      var dt = new DataTransfer(); dt.items.add(file);
      document.getElementById('fileImagePick').files = dt.files;
      S.setPendingAdd('image'); S.setPendingReplace(-1);
      document.getElementById('fileImagePick').dispatchEvent(new Event('change'));
    } else if (file.type.indexOf('video/') === 0) {
      var dt2 = new DataTransfer(); dt2.items.add(file);
      document.getElementById('fileVideoPick').files = dt2.files;
      S.setPendingAdd('video'); S.setPendingReplace(-1);
      document.getElementById('fileVideoPick').dispatchEvent(new Event('change'));
    }
  });
  document.querySelector('.content').addEventListener('dragover', function (e) { e.preventDefault(); e.stopPropagation(); });
}

// ─── Init ─────────────────────────────────────────────────────────
export function initUI() {
  // Theme
  try {
    var saved = localStorage.getItem('jcm-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
      var btn = document.getElementById('themeToggle');
      if (btn) btn.textContent = saved === 'dark' ? '🌙' : '☀️';
    }
  } catch (e) {}

  renderTplGrid();
  setupEvents();
  setupCodeEditor();

  // Init canvas drag
  initCanvas({
    captureState: captureState,
    renderPreview: renderPreview,
    renderConfig: renderConfig,
  });

  checkShareURL();
  requestAnimationFrame(function () { moveStepSlider(0); });
  window.addEventListener('resize', function () { moveStepSlider(_step); });

  // Save on unload
  window.addEventListener('beforeunload', function () {
    document.querySelectorAll('video').forEach(function (v) { v.pause(); v.src = ''; });
    try { localStorage.setItem('jcm-draft', JSON.stringify({ tplId: S.tpl ? S.tpl.id : null, cfg: S.cfg, elements: S.elements, timestamp: Date.now() })); } catch (e) {}
  });

  // Draft recovery
  if (JCM.Storage) {
    JCM.Storage.loadDraft().then(function (d) { if (d && d.tplId) showDraftRecovery(d); }).catch(function () { checkLocalDraft(); });
  } else { checkLocalDraft(); }
}

function checkLocalDraft() {
  try {
    var draft = localStorage.getItem('jcm-draft');
    if (draft) { var d = JSON.parse(draft); if (d.tplId) showDraftRecovery(d); }
  } catch (e) {}
}

function showDraftRecovery(d) {
  var tpl = TEMPLATES.find(function (t) { return t.id === d.tplId; });
  var name = tpl ? tpl.name : d.tplId;
  var timeStr = new Date(d.timestamp).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  var div = document.createElement('div');
  div.className = 'draft-recovery';
  div.innerHTML = '<div class="draft-recovery-title">📄 发现未保存的草稿</div><div class="draft-recovery-desc">模板: ' + esc(name) + ' · ' + timeStr + '</div><div class="draft-recovery-btns"><button class="btn btn-primary" id="draftRecoverBtn">恢复</button><button class="btn btn-secondary" id="draftDiscardBtn">丢弃</button></div>';
  document.body.appendChild(div);
  document.getElementById('draftRecoverBtn').onclick = function () {
    var tpl2 = TEMPLATES.find(function (t) { return t.id === d.tplId; });
    if (!tpl2) { toast('找不到对应模板', 'error'); div.remove(); return; }
    S.setTpl(tpl2); S.setCfg(d.cfg || {}); S.setElements(d.elements || []);
    if (d.uploadedFiles) S.setUploadedFiles(d.uploadedFiles);
    S.setDirty(true); resetHistory();
    renderTplGrid(); goStep(1); toast('✅ 草稿已恢复', 'success'); div.remove();
  };
  document.getElementById('draftDiscardBtn').onclick = function () {
    localStorage.removeItem('jcm-draft');
    if (JCM.Storage) JCM.Storage.clearDraft().catch(function () {});
    div.remove();
  };
}

// ─── Expose to JCM global (for export.js, transcode.js, etc.) ────
// These are called from non-module scripts, so we expose them
window.JCM = window.JCM || {};
Object.assign(window.JCM, {
  goStep: goStep,
  nextStep: function () { goStep(_step + 1); },
  prevStep: function () { goStep(_step - 1); },
  selectTemplate: selectTemplate,
  filterTemplates: filterTemplates,
  addElement: addElement,
  removeElement: removeElement,
  selectElement: function (idx) { S.setSelIdx(idx); renderConfig(); },
  moveElementZ: moveElementZ,
  alignElement: alignElement,
  applyQuickSize: applyQuickSize,
  renderPreview: renderPreview,
  renderLivePreview: renderLivePreview,
  getSelectedDevice: getSelectedDevice,
  handleExport: handleExport,
  handleExportPNG: handleExportPNG,
  handleExportSVG: handleExportSVG,
  handleBatchExport: handleBatchExport,
  handleUniversalExport: handleUniversalExport,
  handleImportZip: handleImportZip,
  shareTemplate: shareTemplate,
  triggerBuild: triggerBuild,
  copyXML: function () {
    var textarea = document.getElementById('codeContent');
    var text = textarea ? textarea.value : '';
    if (!text || text.indexOf('<Widget') < 0) return toast('请先生成预览', 'error');
    navigator.clipboard.writeText(text).then(function () { toast('📋 XML 已复制到剪贴板', 'success'); });
  },
  formatXML: function () {
    var textarea = document.getElementById('codeContent');
    if (!textarea) return;
    var xml = textarea.value; if (!xml || xml.indexOf('<') < 0) return;
    var formatted = '', indent = 0;
    xml.replace(/>\s*</g, '>\n<').split('\n').forEach(function (line) {
      line = line.trim(); if (!line) return;
      if (line.indexOf('</') === 0 && indent > 0) indent--;
      formatted += '  '.repeat(indent) + line + '\n';
      if (line.indexOf('<') === 0 && line.indexOf('</') !== 0 && line.indexOf('/>') < 0 && line.indexOf('<?') < 0 && line.indexOf('<!--') < 0) indent++;
    });
    textarea.value = formatted.trim(); updateCodeEditor(); toast('🔧 XML 已格式化', 'success');
  },
  toggleFullscreen: function () {
    var el = document.querySelector('#page2 .preview-phone');
    if (!el) return;
    document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen().catch(function () { toast('浏览器不支持全屏', 'error'); });
  },
  toggleHelp: function () {
    var modal = document.getElementById('helpModal');
    if (modal) modal.style.display = modal.style.display === 'none' ? '' : 'none';
  },
  toggleTheme: function () {
    var html = document.documentElement;
    var next = (html.getAttribute('data-theme') || 'dark') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    try { localStorage.setItem('jcm-theme', next); } catch (e) {}
    var btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = next === 'dark' ? '🌙' : '☀️';
  },
  toggleGrid: function () {
    var cb = document.getElementById('showGrid');
    var overlay = document.getElementById('previewGridOverlay');
    if (cb && overlay) overlay.style.display = cb.checked ? '' : 'none';
  },
  zoomIn: function () { _zoomLevel = Math.min(_zoomLevel + 25, 200); applyZoom(); },
  zoomOut: function () { _zoomLevel = Math.max(_zoomLevel - 25, 50); applyZoom(); },
  zoomReset: function () { _zoomLevel = 100; applyZoom(); },
  cfgZoomIn: function () { _cfgZoomLevel = Math.min(_cfgZoomLevel + 25, 200); applyCfgZoom(); },
  cfgZoomOut: function () { _cfgZoomLevel = Math.max(_cfgZoomLevel - 25, 50); applyCfgZoom(); },
  cfgZoomReset: function () { _cfgZoomLevel = 100; applyCfgZoom(); },
  toggleHistory: function () {
    var modal = document.getElementById('historyModal');
    if (!modal) return;
    if (modal.style.display === 'none') {
      var list = document.getElementById('historyList');
      var labels = getHistoryLabels();
      if (labels.length === 0) list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3)">暂无操作历史</div>';
      else list.innerHTML = '<div class="shortcut-list">' + labels.map(function (l, i) { return '<div class="shortcut-item" style="cursor:pointer" onclick="JCM.undoTo(' + (labels.length - i) + ');JCM.toggleHistory()"><span>' + (i + 1) + '.</span><span>' + esc(l) + '</span></div>'; }).join('') + '</div>';
      modal.style.display = '';
    } else { modal.style.display = 'none'; }
  },
  undoTo: function (idx) { undoTo(idx); renderConfig(); },
  getHistory: getHistoryLabels,
  toggleChangelog: function () {
    var modal = document.getElementById('changelogModal');
    if (modal) modal.style.display = modal.style.display === 'none' ? '' : 'none';
  },
  initUI: initUI,
  elements: S.elements, // accessor for editor.js compat
  pickMedia: function (type) { S.setPendingAdd(type); S.setPendingReplace(-1); document.getElementById(type === 'image' ? 'fileImagePick' : 'fileVideoPick').click(); },
  pickMediaReplace: function (idx) {
    var el = S.elements[idx]; if (!el) return;
    S.setPendingAdd(el.type); S.setPendingReplace(idx);
    document.getElementById(el.type === 'image' ? 'fileImagePick' : 'fileVideoPick').click();
  },
  replaceAssetPrompt: function (fname) { /* delegates to file picker with replace logic */ },
  forceTranscodeAsset: function (fname) { /* delegates to transcode.js */ },
  handleExportTemplate: function () { JCM.exportTemplateJSON(S.tpl ? S.tpl.id : 'custom', S.cfg, S.elements); toast('✅ 配置已导出', 'success'); },
  handleImportTemplate: function () { /* same pattern as handleImportZip */ },
  checkShareURL: checkShareURL,
  toggleThemeCompare: function () { /* theme compare logic */ },
  fmtSize: fmtSize,
  isInCameraZone: isInCameraZone,
  cameraZoneWidth: cameraZoneWidth,
  clearToken: function () { localStorage.removeItem('jcm-gh-token'); toast('🔑 Token 已清除', 'success'); },
});
