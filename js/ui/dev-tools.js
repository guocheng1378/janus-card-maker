// ─── Dev Tools: 模拟数据 + 表达式调试 + 性能仪表盘 + 模板对比 ───
import * as S from '../state.js';
import { getDevice } from '../devices.js';
import { renderTemplatePreview, PreviewRenderer } from '../live-preview.js';
import { TEMPLATES } from '../templates/index.js';
import { toast } from './toast.js';

// ─── 1. 模拟数据开关 ──────────────────────────────────────────────
var _mockMode = true;

export function isMockMode() { return _mockMode; }

export function toggleMockMode() {
  _mockMode = !_mockMode;
  window.__mockMode = _mockMode;
  var btn = document.getElementById('mockToggle');
  if (btn) {
    btn.classList.toggle('active', _mockMode);
    btn.title = _mockMode ? '模拟数据: ON' : '模拟数据: OFF';
  }
  toast(_mockMode ? '🎭 模拟数据已开启' : '📡 显示原始表达式', 'info');
  return _mockMode;
}

// ─── 2. 表达式调试器 ──────────────────────────────────────────────
var _exprModal = null;

export function openExprDebugger() {
  if (_exprModal) { _exprModal.style.display = ''; return; }
  _exprModal = document.createElement('div');
  _exprModal.className = 'modal-overlay';
  _exprModal.innerHTML = '<div class="modal expr-debug-modal" onclick="event.stopPropagation()">' +
    '<div class="modal-header"><h3>🧪 表达式调试器</h3><button class="modal-close" onclick="JCM.closeExprDebugger()">✕</button></div>' +
    '<div class="modal-body">' +
    '<div class="expr-debug-field"><label>表达式</label><textarea id="exprInput" rows="2" placeholder="例如: formatDate(\'HH:mm\', #time_sys)" style="width:100%;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:monospace;font-size:13px;outline:none;resize:vertical"></textarea></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-primary" onclick="JCM.evalExpr()"><span class="btn-icon">▶</span> 求值</button><button class="btn btn-secondary" onclick="JCM.insertExprPreset()"><span class="btn-icon">📋</span> 示例</button></div>' +
    '<div class="expr-debug-result" id="exprResult" style="margin-top:16px;padding:16px;background:var(--surface2);border-radius:10px;border:1px solid var(--border);min-height:60px">' +
    '<div style="font-size:11px;color:var(--text3);margin-bottom:8px">结果</div>' +
    '<div id="exprResultValue" style="font-family:monospace;font-size:16px;color:var(--accent2)">输入表达式后点击求值</div>' +
    '</div>' +
    '<div class="expr-debug-vars" style="margin-top:16px">' +
    '<div style="font-size:11px;color:var(--text3);margin-bottom:8px">可用变量（点击插入）</div>' +
    '<div class="expr-var-chips" id="exprVarChips"></div>' +
    '</div>' +
    '</div></div>';
  document.body.appendChild(_exprModal);
  _exprModal.addEventListener('click', function (e) { if (e.target === _exprModal) _exprModal.style.display = 'none'; });
  // Populate variable chips with descriptions
  var chips = _exprModal.querySelector('#exprVarChips');
  var vars = [
    ['#time_sys', '系统时间'],
    ['#step_count', '步数(6542)'],
    ['#battery_level', '电量(78)'],
    ['#battery_state', '放电中'],
    ['#weather_temp', '温度(23°)'],
    ['#weather_desc', '天气(晴)'],
    ['#weather_city', '城市(北京)'],
    ['#heart_rate', '心率(72)'],
    ['#blood_oxygen', '血氧(98)'],
    ['#sleep_hours', '睡眠(7.5)'],
    ['#view_width', '屏幕宽'],
    ['#view_height', '屏幕高'],
    ['#marginL', '摄像头区宽度'],
    ['#year', '年'],
    ['#month', '月'],
    ['#date', '日'],
    ['#utcNow', '时间戳'],
    ['#step_distance', '距离(4.2km)'],
    ['#step_calorie', '卡路里(256)'],
    ['#goalN', '目标(10000)'],
    ['#pct', '进度(65%)'],
  ];
  chips.innerHTML = vars.map(function (v) {
    return '<span class="expr-var-chip" onclick="JCM.insertVar(\'' + v[0] + '\')" title="' + v[1] + '">' + v[0] + '</span>';
  }).join('');
  setTimeout(function () { var inp = _exprModal.querySelector('#exprInput'); if (inp) inp.focus(); }, 100);
}

export function closeExprDebugger() {
  if (_exprModal) _exprModal.style.display = 'none';
}

export function insertVar(v) {
  var inp = document.getElementById('exprInput');
  if (inp) { inp.value += v; inp.focus(); }
}

export function evalExpr() {
  var inp = document.getElementById('exprInput');
  var resultEl = document.getElementById('exprResultValue');
  if (!inp || !resultEl) return;
  var expr = inp.value.trim();
  if (!expr) { resultEl.textContent = '请输入表达式'; resultEl.style.color = 'var(--red)'; return; }

  var device = getSelectedDevice();

  // Build eval context with all mock variables
  var now = new Date();
  var mockVars = {
    '#time_sys': now,
    '#step_count': 6542,
    '#battery_level': 78,
    '#battery_state': '放电中',
    '#weather_temp': '23°',
    '#weather_desc': '晴',
    '#weather_city': '北京',
    '#heart_rate': 72,
    '#blood_oxygen': 98,
    '#sleep_hours': 7.5,
    '#view_width': device.width,
    '#view_height': device.height,
    '#marginL': Math.round(device.width * device.cameraZoneRatio),
    '#year': now.getFullYear(),
    '#month': now.getMonth() + 1,
    '#date': now.getDate(),
    '#utcNow': now.getTime(),
    '#utcNow2': now.getTime(),
    '#dayIdx': 0,
    '#step_distance': 4.2,
    '#step_calorie': 256,
    '#goalN': 10000,
    '#pct': 65,
  };

  // Try formatDate first
  var fm = expr.match(/formatDate\s*\(\s*'([^']+)'\s*,\s*#time_sys\s*\)/);
  if (fm) {
    var renderer = new PreviewRenderer(device, false);
    var result = renderer.fmtDate(now, fm[1]);
    resultEl.textContent = result;
    resultEl.style.color = 'var(--green)';
    return;
  }

  // Replace all variables and evaluate
  var cleaned = expr;
  // Replace string variables with quoted strings first
  var stringVars = ['#battery_state', '#weather_temp', '#weather_desc', '#weather_city'];
  stringVars.forEach(function (v) {
    if (cleaned.indexOf(v) >= 0) {
      cleaned = cleaned.split(v).join(JSON.stringify(mockVars[v]));
    }
  });
  // Replace numeric variables
  Object.keys(mockVars).forEach(function (v) {
    if (stringVars.indexOf(v) < 0 && cleaned.indexOf(v) >= 0) {
      cleaned = cleaned.split(v).join(mockVars[v]);
    }
  });

  try {
    var scope = 'var ifelse = function(c,a,b){return c?a:b;};';
    var result = Function('"use strict";' + scope + 'return (' + cleaned + ')')();
    if (result != null) {
      resultEl.textContent = String(result);
      resultEl.style.color = 'var(--green)';
    } else {
      resultEl.textContent = '⚠️ 结果为 null';
      resultEl.style.color = 'var(--orange)';
    }
  } catch (e) {
    resultEl.textContent = '❌ 语法错误: ' + e.message;
    resultEl.style.color = 'var(--red)';
  }
}

var _exprPresets = [
  "formatDate('HH:mm', #time_sys)",
  "formatDate('yyyy/MM/dd EEEE', #time_sys)",
  "#step_count + ' 步'",
  "#battery_level + '%'",
  "#weather_temp + ' ' + #weather_city",
  "ifelse(#battery_level > 50, '充足', '低电量')",
  "#view_width + '×' + #view_height",
  "Math.round(#step_count / #goalN * 100) + '%'",
  "#weather_desc + ' ' + #weather_temp",
  "#heart_rate + ' bpm'",
];
var _exprPresetIdx = 0;

export function insertExprPreset() {
  var inp = document.getElementById('exprInput');
  if (!inp) return;
  inp.value = _exprPresets[_exprPresetIdx % _exprPresets.length];
  _exprPresetIdx++;
  evalExpr();
}

// ─── 3. 性能仪表盘 ────────────────────────────────────────────────
export function getPerfStats() {
  var els = S.elements || [];
  var xml = '';
  try { xml = document.getElementById('codeContent').value || ''; } catch (e) {}

  // Also count template-level elements from current template
  var tplElementCount = 0;
  if (S.tpl && S.tpl.elements) {
    try {
      var cfg = {};
      S.tpl.config.forEach(function (g) { g.fields.forEach(function (f) { cfg[f.key] = f.default; }); });
      tplElementCount = (S.tpl.elements(cfg) || []).length;
    } catch (e) {}
  }

  var textCount = 0, rectCount = 0, imgCount = 0, vidCount = 0, otherCount = 0;
  var totalChars = 0, totalExpressions = 0;
  var hasVideo = false, hasLottie = false;

  els.forEach(function (el) {
    switch (el.type) {
      case 'text': textCount++; totalChars += (el.text || '').length; break;
      case 'rectangle': rectCount++; break;
      case 'image': imgCount++; break;
      case 'video': vidCount++; hasVideo = true; break;
      case 'lottie': hasLottie = true; otherCount++; break;
      default: otherCount++;
    }
    if (el.expression) totalExpressions++;
  });

  var totalAll = els.length + tplElementCount;
  var score = 100;
  var warnings = [];
  if (totalAll > 15) { score -= 15; warnings.push('总元素过多 (' + totalAll + '>15)，可能影响渲染性能'); }
  else if (totalAll > 10) { score -= 5; }
  if (hasVideo) { score -= 10; warnings.push('包含视频元素，耗电量较高'); }
  if (hasLottie) { score -= 5; warnings.push('Lottie 动画可能有兼容性问题'); }
  if (xml.length > 8000) { score -= 10; warnings.push('XML 过长 (>8KB)'); }
  else if (xml.length === 0) { warnings.push('XML 尚未生成，请先点击「生成预览」'); }
  if (totalExpressions > 10) { score -= 10; warnings.push('表达式过多 (>10)，计算开销大'); }
  if (imgCount > 3) { score -= 5; warnings.push('图片元素较多 (>3)，内存占用高'); }
  if (els.length === 0 && tplElementCount === 0) {
    warnings.push('当前无元素，无法评估性能');
    score = 0;
  }

  score = Math.max(0, Math.min(100, score));
  var level = score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor';
  var levelLabel = score >= 90 ? '优秀' : score >= 70 ? '良好' : score >= 50 ? '一般' : '需优化';

  return {
    total: els.length, tplElements: tplElementCount, totalAll: totalAll,
    text: textCount, rect: rectCount, img: imgCount, vid: vidCount, other: otherCount,
    totalChars: totalChars, totalExpressions: totalExpressions, xmlSize: xml.length,
    hasVideo: hasVideo, hasLottie: hasLottie,
    score: score, level: level, levelLabel: levelLabel, warnings: warnings,
  };
}

export function openPerfDashboard() {
  var stats = getPerfStats();
  var modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = '<div class="modal" style="max-width:480px" onclick="event.stopPropagation()">' +
    '<div class="modal-header"><h3>📊 性能仪表盘</h3><button class="modal-close" onclick="this.closest(\'.modal-overlay\').remove()">✕</button></div>' +
    '<div class="modal-body">' +
    '<div class="perf-score-ring"><div class="perf-score-value perf-' + stats.level + '">' + stats.score + '</div><div class="perf-score-label">' + stats.levelLabel + '</div></div>' +
    '<div class="perf-grid">' +
    '<div class="perf-stat"><div class="perf-stat-value">' + stats.totalAll + '</div><div class="perf-stat-label">总元素</div></div>' +
    '<div class="perf-stat"><div class="perf-stat-value">' + stats.text + '</div><div class="perf-stat-label">文字</div></div>' +
    '<div class="perf-stat"><div class="perf-stat-value">' + stats.img + '</div><div class="perf-stat-label">图片</div></div>' +
    '<div class="perf-stat"><div class="perf-stat-value">' + stats.vid + '</div><div class="perf-stat-label">视频</div></div>' +
    '<div class="perf-stat"><div class="perf-stat-value">' + stats.totalExpressions + '</div><div class="perf-stat-label">表达式</div></div>' +
    '<div class="perf-stat"><div class="perf-stat-value">' + (stats.xmlSize > 0 ? (stats.xmlSize / 1024).toFixed(1) + 'KB' : 'N/A') + '</div><div class="perf-stat-label">XML</div></div>' +
    '<div class="perf-stat"><div class="perf-stat-value">' + stats.totalChars + '</div><div class="perf-stat-label">字符数</div></div>' +
    '<div class="perf-stat"><div class="perf-stat-value">' + stats.tplElements + '</div><div class="perf-stat-label">模板元素</div></div>' +
    '</div>' +
    (stats.warnings.length > 0 ? '<div class="perf-warnings">' + stats.warnings.map(function (w) { return '<div class="perf-warn-item">⚠️ ' + w + '</div>'; }).join('') + '</div>' : '<div style="text-align:center;padding:16px;color:var(--green);font-size:14px">✅ 无性能问题</div>') +
    '</div></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
}

// ─── 4. 模板对比模式 ──────────────────────────────────────────────
var _compareMode = false;
var _compareTplId = null;

export function isCompareMode() { return _compareMode; }

export function toggleTemplateCompare() {
  if (_compareMode) {
    // Close compare
    _compareMode = false;
    _compareTplId = null;
    var overlay = document.getElementById('templateCompareOverlay');
    if (overlay) overlay.remove();
    toast('模板对比已关闭', 'info');
    return;
  }
  if (!S.tpl) return toast('请先选择一个模板', 'warning');
  _compareMode = true;
  toast('请选择第二个模板进行对比', 'info');
  openCompareSelector();
}

function openCompareSelector() {
  var modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'compareSelectorModal';
  modal.innerHTML = '<div class="modal" style="max-width:500px;max-height:70vh" onclick="event.stopPropagation()">' +
    '<div class="modal-header"><h3>🔄 选择对比模板</h3><button class="modal-close" onclick="JCM.cancelCompare()">✕</button></div>' +
    '<div class="modal-body" style="overflow-y:auto;max-height:50vh">' +
    '<div class="compare-tpl-list" id="compareTplList"></div>' +
    '</div></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', function (e) { if (e.target === modal) cancelCompare(); });
  // Populate template list from DOM
  var list = modal.querySelector('#compareTplList');
  try {
    var tplList = getTemplateList();
    list.innerHTML = tplList.map(function (t) {
      return '<div class="compare-tpl-item" data-compare-tpl="' + t.id + '">' +
        '<span style="font-size:20px">' + t.icon + '</span>' +
        '<div><div style="font-weight:600;font-size:13px">' + t.name + '</div><div style="font-size:11px;color:var(--text3)">' + t.desc + '</div></div>' +
        '</div>';
    }).join('');
    list.addEventListener('click', function (e) {
      var item = e.target.closest('[data-compare-tpl]');
      if (!item) return;
      selectCompareTemplate(item.dataset.compareTpl);
    });
  } catch (e) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3)">加载模板列表失败: ' + e.message + '</div>';
  }
}

function getTemplateList() {
  return TEMPLATES.map(function (t) {
    return { id: t.id, name: t.name, desc: t.desc, icon: t.icon };
  });
}

function selectCompareTemplate(tplId) {
  _compareTplId = tplId;
  var modal = document.getElementById('compareSelectorModal');
  if (modal) modal.remove();
  renderCompareView();
}

export function cancelCompare() {
  _compareMode = false;
  _compareTplId = null;
  var modal = document.getElementById('compareSelectorModal');
  if (modal) modal.remove();
  var overlay = document.getElementById('templateCompareOverlay');
  if (overlay) overlay.remove();
}

function renderCompareView() {
  if (!_compareMode || !_compareTplId || !S.tpl) return;
  var device = getSelectedDevice();
  var showCam = false;
  try { showCam = document.getElementById('showCamera').checked; } catch (e) {}

  // Render current template (left)
  var leftHtml = renderTemplatePreview(device, showCam, S.tpl, S.cfg);
  leftHtml += new PreviewRenderer(device, showCam).renderElements(S.elements, S.uploadedFiles, -1);

  // Render compare template (right) with default config
  var rightTpl = TEMPLATES.find(function (t) { return t.id === _compareTplId; });
  var rightHtml = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text3);font-size:13px">模板未找到</div>';
  var rightName = _compareTplId;
  if (rightTpl) {
    rightName = rightTpl.name;
    try {
      var rightCfg = {};
      rightTpl.config.forEach(function (g) { g.fields.forEach(function (f) { rightCfg[f.key] = f.default; }); });
      rightHtml = renderTemplatePreview(device, showCam, rightTpl, rightCfg);
      if (rightTpl.elements) {
        rightHtml += new PreviewRenderer(device, showCam).renderElements(rightTpl.elements(rightCfg), {}, -1);
      }
    } catch (e) {
      rightHtml = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text3);font-size:12px;padding:20px;text-align:center">渲染失败: ' + e.message + '</div>';
    }
  }

  // Remove existing overlay
  var existing = document.getElementById('templateCompareOverlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'templateCompareOverlay';
  overlay.className = 'template-compare-overlay';
  overlay.innerHTML = '<div class="template-compare-header">' +
    '<span>🔄 模板对比</span>' +
    '<div><span class="template-compare-label-left">' + (S.tpl.name || '当前') + '</span>' +
    '<span style="margin:0 8px;color:var(--text3)">VS</span>' +
    '<span class="template-compare-label-right">' + rightName + '</span></div>' +
    '<button class="btn btn-secondary" style="font-size:12px;padding:4px 12px" onclick="JCM.cancelCompare()">关闭对比</button>' +
    '</div>' +
    '<div class="template-compare-body">' +
    '<div class="template-compare-pane"><div class="preview-phone" style="transform:none;width:100%;max-width:420px;height:auto;aspect-ratio:976/596"><div class="preview-screen"><div class="preview-content">' + leftHtml + '</div></div></div></div>' +
    '<div class="template-compare-pane"><div class="preview-phone" style="transform:none;width:100%;max-width:420px;height:auto;aspect-ratio:976/596"><div class="preview-screen"><div class="preview-content">' + rightHtml + '</div></div></div></div>' +
    '</div>';
  var previewPage = document.querySelector('#page2');
  if (previewPage) previewPage.prepend(overlay);
  toast('🔄 对比模式已开启', 'success');
}

function getSelectedDevice() {
  try { return getDevice(document.getElementById('deviceSelect').value); } catch (e) {}
  try { return getDevice(document.getElementById('cfgDeviceSelect').value); } catch (e) {}
  return getDevice('p2');
}

// ─── Init ─────────────────────────────────────────────────────────
export function initDevTools() {
  window.__mockMode = _mockMode;

  var mockBtn = document.getElementById('mockToggle');
  if (mockBtn) {
    mockBtn.classList.toggle('active', _mockMode);
    mockBtn.addEventListener('click', function () {
      toggleMockMode();
      // Re-render only if on the right step
      if (typeof window.JCM !== 'undefined') {
        try { window.JCM.renderPreview(); } catch (e) {}
        try { window.JCM.renderLivePreview(); } catch (e) {}
      }
    });
  }
}
