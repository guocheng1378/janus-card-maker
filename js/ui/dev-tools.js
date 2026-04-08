// ─── Dev Tools: 模拟数据 + 表达式调试 + 性能仪表盘 + 模板对比 ───
import * as S from '../state.js';
import { getDevice } from '../devices.js';
import { renderTemplatePreview, PreviewRenderer } from '../live-preview.js';
import { toast } from './toast.js';

// ─── 1. 模拟数据开关 ──────────────────────────────────────────────
var _mockMode = true; // default: mock data on

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
    '<div class="expr-debug-field"><label>表达式</label><input type="text" id="exprInput" placeholder="例如: formatDate(\'HH:mm\', #time_sys)" style="width:100%;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:monospace;font-size:13px;outline:none" /></div>' +
    '<div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-primary" onclick="JCM.evalExpr()"><span class="btn-icon">▶</span> 求值</button><button class="btn btn-secondary" onclick="JCM.insertExprPreset()"><span class="btn-icon">📋</span> 示例</button></div>' +
    '<div class="expr-debug-result" id="exprResult" style="margin-top:16px;padding:16px;background:var(--surface2);border-radius:10px;border:1px solid var(--border);min-height:60px">' +
    '<div style="font-size:11px;color:var(--text3);margin-bottom:8px">结果</div>' +
    '<div id="exprResultValue" style="font-family:monospace;font-size:16px;color:var(--accent2)">输入表达式后点击求值</div>' +
    '</div>' +
    '<div class="expr-debug-vars" style="margin-top:16px">' +
    '<div style="font-size:11px;color:var(--text3);margin-bottom:8px">可用变量</div>' +
    '<div class="expr-var-chips" id="exprVarChips"></div>' +
    '</div>' +
    '</div></div>';
  document.body.appendChild(_exprModal);
  _exprModal.addEventListener('click', function () { _exprModal.style.display = 'none'; });
  // Populate variable chips
  var chips = _exprModal.querySelector('#exprVarChips');
  var vars = [
    '#time_sys', '#step_count', '#battery_level', '#battery_state',
    '#weather_temp', '#weather_desc', '#weather_city',
    '#heart_rate', '#blood_oxygen', '#sleep_hours',
    '#view_width', '#view_height', '#marginL',
    '#year', '#month', '#date', '#utcNow', '#dayIdx',
    '#step_distance', '#step_calorie', '#goalN', '#pct'
  ];
  chips.innerHTML = vars.map(function (v) {
    return '<span class="expr-var-chip" onclick="JCM.insertVar(\'' + v + '\')">' + v + '</span>';
  }).join('');
  // Focus input
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
  var renderer = new PreviewRenderer(device, false);
  var result = renderer.evalExpression(expr);
  if (result === expr) {
    resultEl.textContent = '⚠️ 无法求值: ' + expr;
    resultEl.style.color = 'var(--orange)';
  } else {
    resultEl.textContent = result;
    resultEl.style.color = 'var(--green)';
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

  var textCount = 0, rectCount = 0, imgCount = 0, vidCount = 0, otherCount = 0;
  var totalChars = 0, totalExpressions = 0;
  var hasVideo = false, hasLottie = false;
  var maxNesting = 0;

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

  // Score: 100 = perfect, lower = worse
  var score = 100;
  var warnings = [];
  if (els.length > 15) { score -= 15; warnings.push('元素过多 (>15)，可能影响渲染性能'); }
  if (hasVideo) { score -= 10; warnings.push('包含视频元素，耗电量较高'); }
  if (hasLottie) { score -= 5; warnings.push('Lottie 动画可能有兼容性问题'); }
  if (xml.length > 8000) { score -= 10; warnings.push('XML 过长 (>8KB)'); }
  if (totalExpressions > 10) { score -= 10; warnings.push('表达式过多 (>10)，计算开销大'); }
  if (imgCount > 3) { score -= 5; warnings.push('图片元素较多 (>3)，内存占用高'); }

  var level = score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor';
  var levelLabel = score >= 90 ? '优秀' : score >= 70 ? '良好' : score >= 50 ? '一般' : '需优化';

  return {
    total: els.length, text: textCount, rect: rectCount, img: imgCount, vid: vidCount, other: otherCount,
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
    '<div class="perf-stat"><div class="perf-stat-value">' + stats.total + '</div><div class="perf-stat-label">元素总数</div></div>' +
    '<div class="perf-stat"><div class="perf-stat-value">' + stats.text + '</div><div class="perf-stat-label">文字</div></div>' +
    '<div class="perf-stat"><div class="perf-stat-value">' + stats.rect + '</div><div class="perf-stat-label">矩形</div></div>' +
    '<div class="perf-stat"><div class="perf-stat-value">' + stats.img + '</div><div class="perf-stat-label">图片</div></div>' +
    '<div class="perf-stat"><div class="perf-stat-value">' + stats.vid + '</div><div class="perf-stat-label">视频</div></div>' +
    '<div class="perf-stat"><div class="perf-stat-value">' + stats.totalExpressions + '</div><div class="perf-stat-label">表达式</div></div>' +
    '<div class="perf-stat"><div class="perf-stat-value">' + (stats.xmlSize / 1024).toFixed(1) + 'KB</div><div class="perf-stat-label">XML 大小</div></div>' +
    '<div class="perf-stat"><div class="perf-stat-value">' + stats.totalChars + '</div><div class="perf-stat-label">文字字符</div></div>' +
    '</div>' +
    (stats.warnings.length > 0 ? '<div class="perf-warnings">' + stats.warnings.map(function (w) { return '<div class="perf-warn-item">⚠️ ' + w + '</div>'; }).join('') + '</div>' : '<div style="text-align:center;padding:16px;color:var(--green);font-size:14px">✅ 无性能问题</div>') +
    '</div></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', function () { modal.remove(); });
}

// ─── 4. 模板对比模式 ──────────────────────────────────────────────
var _compareMode = false;
var _compareTplId = null;

export function isCompareMode() { return _compareMode; }

export function toggleTemplateCompare() {
  _compareMode = !_compareMode;
  if (!_compareMode) {
    _compareTplId = null;
    // Remove compare UI
    var existing = document.getElementById('templateCompareOverlay');
    if (existing) existing.remove();
    toast('模板对比已关闭', 'info');
    return;
  }
  toast('请选择第二个模板进行对比', 'info');
  // Show template selector for comparison
  openCompareSelector();
}

function openCompareSelector() {
  var { TEMPLATES } = require_templates();
  var modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'compareSelectorModal';
  modal.innerHTML = '<div class="modal" style="max-width:500px;max-height:70vh" onclick="event.stopPropagation()">' +
    '<div class="modal-header"><h3>🔄 选择对比模板</h3><button class="modal-close" onclick="JCM.cancelCompare()">✕</button></div>' +
    '<div class="modal-body" style="overflow-y:auto;max-height:50vh">' +
    '<div class="compare-tpl-list" id="compareTplList"></div>' +
    '</div></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', function () { cancelCompare(); });
  // Populate template list
  var list = modal.querySelector('#compareTplList');
  try {
    var TPLS = getTemplateList();
    list.innerHTML = TPLS.map(function (t) {
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
    list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3)">加载模板列表失败</div>';
  }
}

function getTemplateList() {
  // Access templates from the state
  try {
    var grid = document.getElementById('tplGrid');
    var cards = grid.querySelectorAll('.tpl-card');
    return Array.from(cards).map(function (card) {
      var id = card.dataset.tpl;
      var name = (card.querySelector('.tpl-card-name') || {}).textContent || id;
      var desc = (card.querySelector('.tpl-card-desc') || {}).textContent || '';
      var icon = (card.querySelector('.tpl-icon') || {}).textContent || '📱';
      return { id: id, name: name, desc: desc, icon: icon };
    });
  } catch (e) { return []; }
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
  var showCam = document.getElementById('showCamera').checked;
  // Render current template
  var leftHtml = renderTemplatePreview(device, showCam, S.tpl, S.cfg);
  leftHtml += new PreviewRenderer(device, showCam).renderElements(S.elements, S.uploadedFiles, -1);
  // Render compare template - get its default config
  var rightTpl = null;
  try {
    var grid = document.getElementById('tplGrid');
    var rightCard = grid.querySelector('[data-tpl="' + _compareTplId + '"]');
    var rightName = rightCard ? (rightCard.querySelector('.tpl-card-name') || {}).textContent : _compareTplId;
  } catch (e) {}

  // Create overlay
  var existing = document.getElementById('templateCompareOverlay');
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.id = 'templateCompareOverlay';
  overlay.className = 'template-compare-overlay';
  overlay.innerHTML = '<div class="template-compare-header">' +
    '<span>🔄 模板对比</span>' +
    '<div><span class="template-compare-label-left">' + (S.tpl.name || '当前') + '</span>' +
    '<span style="margin:0 8px;color:var(--text3)">VS</span>' +
    '<span class="template-compare-label-right">' + (rightName || _compareTplId) + '</span></div>' +
    '<button class="btn btn-secondary" style="font-size:12px;padding:4px 12px" onclick="JCM.cancelCompare()">关闭对比</button>' +
    '</div>' +
    '<div class="template-compare-body">' +
    '<div class="template-compare-pane"><div class="preview-phone" style="transform:none;width:100%;max-width:420px;height:auto;aspect-ratio:976/596"><div class="preview-screen">' + leftHtml + '</div></div></div>' +
    '<div class="template-compare-pane"><div class="preview-phone" style="transform:none;width:100%;max-width:420px;height:auto;aspect-ratio:976/596"><div class="preview-screen"><div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text3);font-size:13px">请在左侧选择模板后配置对比</div></div></div></div>' +
    '</div>';
  document.querySelector('.page-preview').prepend(overlay);
  toast('🔄 对比模式: 左右滑动查看差异', 'success');
}

// ─── Init ─────────────────────────────────────────────────────────
export function initDevTools() {
  // Set global mock mode flag
  window.__mockMode = _mockMode;

  // Mock toggle button
  var mockBtn = document.getElementById('mockToggle');
  if (mockBtn) {
    mockBtn.classList.toggle('active', _mockMode);
    mockBtn.addEventListener('click', function () {
      toggleMockMode();
      // Trigger re-render
      if (typeof window.JCM !== 'undefined') {
        if (window.JCM.renderPreview) window.JCM.renderPreview();
        if (window.JCM.renderLivePreview) window.JCM.renderLivePreview();
      }
    });
  }
}
