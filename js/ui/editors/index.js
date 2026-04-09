// ─── Editor Registry: 统一入口，按类型分发 ────────────────────────
import { renderTextEditor } from './text-editor.js';
import { renderRectangleEditor, renderCircleEditor, renderArcEditor, renderProgressEditor } from './shape-editor.js';
import { renderImageEditor, renderVideoEditor, renderLottieEditor } from './media-editor.js';
import { renderGroupEditor, renderLayerEditor, renderMusicControlEditor } from './container-editor.js';
import {
  fieldHtml, colorFieldHtml, esc, renderColorPresets,
  renderCameraWarning, getElementTypeLabel, LAYER_ICONS
} from './common.js';
import { hasStyleClipboard } from '../elements.js';
import * as S from '../../state.js';

// ── Registry: 每种元素类型的专属编辑器 ──
var EDITORS = {
  text: renderTextEditor,
  rectangle: renderRectangleEditor,
  circle: renderCircleEditor,
  arc: renderArcEditor,
  progress: renderProgressEditor,
  image: renderImageEditor,
  video: renderVideoEditor,
  lottie: renderLottieEditor,
  group: renderGroupEditor,
  layer: renderLayerEditor,
  musiccontrol: renderMusicControlEditor,
};

// ── 动画选项列表 ──
var ANIM_LIST = [
  { v: 'none', l: '无动画' }, { v: 'fadeIn', l: '淡入' }, { v: 'fadeOut', l: '淡出' },
  { v: 'slideInLeft', l: '从左滑入' }, { v: 'slideInRight', l: '从右滑入' },
  { v: 'slideInUp', l: '从下滑入' }, { v: 'slideInDown', l: '从上滑入' },
  { v: 'zoomIn', l: '放大进入' }, { v: 'zoomOut', l: '缩小退出' },
  { v: 'bounce', l: '弹跳' }, { v: 'pulse', l: '脉冲' }, { v: 'shake', l: '抖动' },
  { v: 'rotate', l: '旋转' }, { v: 'blink', l: '闪烁' },
];

// ── MAML 变量列表 ──
var MAML_VARS = [
  { var: '#step', desc: '步数', group: '健康' },
  { var: '#battery_level', desc: '电量百分比', group: '健康' },
  { var: '#battery_charging', desc: '是否充电', group: '健康' },
  { var: '#weather_temp', desc: '天气温度', group: '天气' },
  { var: '#weather_desc', desc: '天气描述', group: '天气' },
  { var: '#weather_humidity', desc: '湿度', group: '天气' },
  { var: '#weather_city', desc: '城市名', group: '天气' },
  { var: '#music_title', desc: '音乐标题', group: '音乐' },
  { var: '#music_artist', desc: '音乐歌手', group: '音乐' },
  { var: '#view_width', desc: '视图宽度', group: '系统' },
  { var: '#view_height', desc: '视图高度', group: '系统' },
  { var: '#marginL', desc: '左边距(摄像头)', group: '系统' },
  { var: '#hour', desc: '当前小时', group: '时间' },
  { var: '#minute', desc: '当前分钟', group: '时间' },
  { var: '#month', desc: '当前月份', group: '时间' },
  { var: '#day', desc: '当前日期', group: '时间' },
  { var: '#day_of_week', desc: '星期几', group: '时间' },
];

// ═══════════════════════════════════════════════════════════════════
// Public API: 渲染指定元素的完整编辑器
// ═══════════════════════════════════════════════════════════════════
export function renderElementEditor(el, idx, device) {
  var html = '<div class="el-detail">';

  // 摄像头警告
  html += renderCameraWarning(el, idx, device);

  // 元素头部 (类型 badge + 可见/锁定)
  html += renderHeader(el, idx);

  // ── Section: 位置 & 大小 ──
  html += wrapSection('📍 位置 & 大小', renderPositionSection(el, idx));

  // ── Section: 类型专属属性 (从注册表分发) ──
  var typeEditor = EDITORS[el.type];
  if (typeEditor) {
    var label = getElementTypeLabel(el);
    html += wrapSection('🎨 ' + label + '属性', '<div class="config-grid">' + typeEditor(el, idx) + '</div>');
  }

  // ── Section: 变换 & 效果 ──
  html += wrapSection('✨ 变换 & 效果', '<div class="config-grid">' + renderTransformSection(el, idx) + '</div>');

  // ── Section: MAML 变量绑定 ──
  html += wrapSection('🔗 MAML 变量绑定', renderMamlVars(el, idx));

  // ── Section: 颜色预设 ──
  if (el.color !== undefined) {
    html += wrapSection('🎨 颜色预设', renderColorPresets('color', idx));
  }

  // ── Section: 动画效果 ──
  html += wrapSection('✨ 动画效果', '<div class="config-grid">' + renderAnimationSection(el, idx) + '</div>');

  // ── Section: 快捷操作 ──
  html += wrapSection('⚡ 快捷操作', renderQuickActions(el, idx));

  html += '</div>';
  return html;
}

// ═══════════════════════════════════════════════════════════════════
// Private: 各 Section 渲染
// ═══════════════════════════════════════════════════════════════════

function renderHeader(el, idx) {
  var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">';
  html += '<div style="display:flex;align-items:center;gap:8px">';
  html += '<span class="el-badge">' + el.type + '</span>';
  html += '<span style="font-size:13px;font-weight:600">' + getElementTypeLabel(el) + '</span>';
  html += '</div>';
  html += '<div style="display:flex;gap:8px;align-items:center">';
  html += '<label class="check-label" style="font-size:11px"><input type="checkbox" data-prop="visible" data-idx="' + idx + '"' + (el.visible !== false ? ' checked' : '') + '> 👁</label>';
  html += '<label class="check-label" style="font-size:11px"><input type="checkbox" data-prop="locked" data-idx="' + idx + '"' + (el.locked ? ' checked' : '') + '> 🔒</label>';
  html += '</div></div>';
  return html;
}

function nudgeBtn(prop, idx, delta, label) {
  return '<button class="el-nudge-btn" data-nudge-prop="' + prop + '" data-nudge-idx="' + idx + '" data-nudge-delta="' + delta + '" title="' + (delta > 0 ? '+' : '') + delta + '">' + label + '</button>';
}

function renderPositionSection(el, idx) {
  var html = '<div class="config-grid">';

  // X with +/- buttons
  html += '<div class="field"><label>X</label><div class="el-nudge-wrap">' +
    nudgeBtn('x', idx, -1, '−') +
    '<input type="number" value="' + el.x + '" data-prop="x" data-idx="' + idx + '">' +
    nudgeBtn('x', idx, 1, '+') +
    '</div></div>';

  // Y with +/- buttons
  html += '<div class="field"><label>Y</label><div class="el-nudge-wrap">' +
    nudgeBtn('y', idx, -1, '−') +
    '<input type="number" value="' + el.y + '" data-prop="y" data-idx="' + idx + '">' +
    nudgeBtn('y', idx, 1, '+') +
    '</div></div>';

  if (el.w !== undefined) {
    html += '<div class="field"><label>宽</label><div class="el-nudge-wrap">' +
      nudgeBtn('w', idx, -1, '−') +
      '<input type="number" value="' + (el.w || 100) + '" data-prop="w" data-idx="' + idx + '" min="1" max="9999">' +
      nudgeBtn('w', idx, 1, '+') +
      '</div></div>';
  }
  if (el.h !== undefined) {
    html += '<div class="field"><label>高</label><div class="el-nudge-wrap">' +
      nudgeBtn('h', idx, -1, '−') +
      '<input type="number" value="' + (el.h || 100) + '" data-prop="h" data-idx="' + idx + '" min="1" max="9999">' +
      nudgeBtn('h', idx, 1, '+') +
      '</div></div>';
  }
  if (el.r !== undefined) {
    html += '<div class="field"><label>半径</label><div class="el-nudge-wrap">' +
      nudgeBtn('r', idx, -1, '−') +
      '<input type="number" value="' + (el.r || 30) + '" data-prop="r" data-idx="' + idx + '" min="1" max="999">' +
      nudgeBtn('r', idx, 1, '+') +
      '</div></div>';
  }
  html += '</div>';

  // 对齐按钮
  html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:8px">';
  html += '<button class="el-btn" data-align="left" data-ai="' + idx + '" style="font-size:10px;padding:4px 8px">⬅ 左</button>';
  html += '<button class="el-btn" data-align="hcenter" data-ai="' + idx + '" style="font-size:10px;padding:4px 8px">↔ 中</button>';
  html += '<button class="el-btn" data-align="right" data-ai="' + idx + '" style="font-size:10px;padding:4px 8px">➡ 右</button>';
  html += '<button class="el-btn" data-align="top" data-ai="' + idx + '" style="font-size:10px;padding:4px 8px">⬆ 顶</button>';
  html += '<button class="el-btn" data-align="vcenter" data-ai="' + idx + '" style="font-size:10px;padding:4px 8px">↕ 中</button>';
  html += '<button class="el-btn" data-align="bottom" data-ai="' + idx + '" style="font-size:10px;padding:4px 8px">⬇ 底</button>';
  html += '</div>';

  // 快捷尺寸
  if (el.type === 'rectangle' || el.type === 'image' || el.type === 'video' || el.type === 'progress') {
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">';
    html += '<button class="el-btn" data-qsize="full" data-qi="' + idx + '" style="font-size:10px;padding:4px 8px">⛶ 全屏</button>';
    html += '<button class="el-btn" data-qsize="half" data-qi="' + idx + '" style="font-size:10px;padding:4px 8px">◧ 半屏</button>';
    html += '<button class="el-btn" data-qsize="quarter" data-qi="' + idx + '" style="font-size:10px;padding:4px 8px">◫ 1/4</button>';
    html += '</div>';
  }
  return html;
}

function renderTransformSection(el, idx) {
  var html = '';
  html += fieldHtml('旋转', '<div style="display:flex;gap:6px;align-items:center"><input type="range" min="0" max="360" value="' + (el.rotation || 0) + '" data-prop="rotation" data-idx="' + idx + '" style="flex:1"><span style="font-size:11px;color:var(--text3);min-width:30px;text-align:right">' + (el.rotation || 0) + '°</span></div>');
  html += fieldHtml('透明度', '<div style="display:flex;gap:6px;align-items:center"><input type="range" min="0" max="100" value="' + (el.opacity !== undefined ? el.opacity : 100) + '" data-prop="opacity" data-idx="' + idx + '" style="flex:1"><span style="font-size:11px;color:var(--text3);min-width:30px;text-align:right">' + (el.opacity !== undefined ? el.opacity : 100) + '%</span></div>');
  return html;
}

function renderAnimationSection(el, idx) {
  var html = '';
  html += '<div class="field"><label>动画类型</label><select data-prop="animationName" data-idx="' + idx + '">';
  ANIM_LIST.forEach(function (a) {
    html += '<option value="' + a.v + '"' + ((el.animationName || '') === a.v ? ' selected' : '') + '>' + a.l + '</option>';
  });
  html += '</select></div>';
  html += fieldHtml('持续 (ms)', '<input type="number" value="' + (el.animationDuration || 500) + '" data-prop="animationDuration" data-idx="' + idx + '" min="100" max="5000" step="100">');
  html += fieldHtml('延迟 (ms)', '<input type="number" value="' + (el.animationDelay || 0) + '" data-prop="animationDelay" data-idx="' + idx + '" min="0" max="3000" step="100">');
  html += fieldHtml('重复', '<input type="number" value="' + (el.animationRepeat || 1) + '" data-prop="animationRepeat" data-idx="' + idx + '" min="1" max="99">');
  html += fieldHtml('无限循环', '<label class="toggle-switch"><input type="checkbox" data-prop="animationInfinite" data-idx="' + idx + '"' + (el.animationInfinite ? ' checked' : '') + '><span class="toggle-slider"></span></label>');
  return html;
}

function renderMamlVars(el, idx) {
  var html = '<div style="margin-bottom:6px"><input type="text" id="mamlVarSearch" placeholder="搜索变量..." style="width:100%;padding:5px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:11px;outline:none"></div>';
  var groups = {};
  MAML_VARS.forEach(function (v) {
    if (!groups[v.group]) groups[v.group] = [];
    groups[v.group].push(v);
  });
  Object.keys(groups).forEach(function (g) {
    html += '<div style="margin-bottom:4px"><div style="font-size:10px;color:var(--text3);font-weight:600;margin-bottom:2px">' + g + '</div>';
    html += '<div style="display:flex;gap:3px;flex-wrap:wrap">';
    groups[g].forEach(function (v) {
      html += '<button class="el-btn maml-var-btn" data-var-insert="' + v.var + '" data-var-idx="' + idx + '" style="font-size:10px;padding:3px 8px" title="' + v.desc + '">' + v.var + '</button>';
    });
    html += '</div></div>';
  });
  // 表达式编辑
  html += '<div style="margin-top:6px"><label style="font-size:10px;color:var(--text2)">表达式 (绑定到文字/宽度等)</label>';
  html += '<input type="text" value="' + esc(el.expression || '') + '" data-prop="expression" data-idx="' + idx + '" placeholder="如: #step 步 或 #weather_temp°" style="width:100%;padding:5px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:11px;outline:none;margin-top:3px"></div>';
  return html;
}

function renderQuickActions(el, idx) {
  var html = '<div style="display:flex;gap:4px;flex-wrap:wrap">';
  html += '<button class="el-btn" data-duplicate="' + idx + '" style="font-size:11px">📋 复制</button>';
  if (S.clipboard) html += '<button class="el-btn" data-paste-el style="font-size:11px">📌 粘贴</button>';
  html += '<button class="el-btn" data-copy-style="' + idx + '" style="font-size:11px">🎨 复制样式</button>';
  if (hasStyleClipboard()) html += '<button class="el-btn" data-paste-style="' + idx + '" style="font-size:11px">📌 粘贴样式</button>';
  html += '<button class="el-btn" data-del="' + idx + '" style="font-size:11px;color:var(--red)">🗑️ 删除</button>';
  html += '</div>';

  if (S.elements.length >= 3) {
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">';
    html += '<button class="el-btn" data-distribute="horizontal" style="font-size:10px;padding:4px 8px">↔ 水平分布</button>';
    html += '<button class="el-btn" data-distribute="vertical" style="font-size:10px;padding:4px 8px">↕ 垂直分布</button>';
    html += '</div>';
  }
  if (S.elements.length >= 2) {
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">';
    html += '<button class="el-btn" data-match-size="width" style="font-size:10px;padding:4px 8px">📏 同宽</button>';
    html += '<button class="el-btn" data-match-size="height" style="font-size:10px;padding:4px 8px">📐 同高</button>';
    html += '<button class="el-btn" data-match-size="both" style="font-size:10px;padding:4px 8px">⬛ 同大小</button>';
    html += '</div>';
  }
  html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">';
  html += '<button class="el-btn" data-save-style="' + idx + '" style="font-size:11px">💾 保存样式</button>';
  html += '<button class="el-btn" data-apply-styles style="font-size:11px">📦 应用样式</button>';
  html += '</div>';
  return html;
}

// ── 工具: 包裹 section ──
function wrapSection(title, inner) {
  return '<div class="el-editor-section"><div class="el-editor-section-title">' + title + '</div>' + inner + '</div>';
}
