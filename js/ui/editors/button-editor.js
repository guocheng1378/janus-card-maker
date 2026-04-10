// ─── Button Editor: 交互按钮编辑器（含 onclick 事件配置）─────────
import { fieldHtml, esc, LAYER_ICONS } from './common.js';

// MAML 支持的交互动作
var ONCLICK_ACTIONS = [
  { v: 'none', l: '无动作', icon: '🚫', desc: '不触发任何事件' },
  { v: 'toggle_visibility', l: '切换可见性', icon: '👁️', desc: '切换目标变量/元素的可见状态', needsTarget: true },
  { v: 'set_variable', l: '设置变量', icon: '📦', desc: '将目标变量设为指定值', needsTarget: true, needsValue: true },
  { v: 'music_play', l: '播放音乐', icon: '▶️', desc: '开始播放音乐' },
  { v: 'music_pause', l: '暂停音乐', icon: '⏸️', desc: '暂停当前音乐' },
  { v: 'music_toggle', l: '播放/暂停', icon: '⏯️', desc: '切换音乐播放状态' },
  { v: 'music_next', l: '下一首', icon: '⏭️', desc: '切换到下一首歌' },
  { v: 'music_prev', l: '上一首', icon: '⏮️', desc: '切换到上一首歌' },
  { v: 'multi', l: '组合命令', icon: '⚡', desc: '执行多条命令（高级）' },
];

// 常用变量列表
var COMMON_VARS = [
  { name: 'enable_material', desc: '材质开关' },
  { name: 'enable_anim', desc: '动画开关' },
  { name: 'page_index', desc: '页面索引' },
  { name: 'show_detail', desc: '详情显示' },
  { name: 'music_panel', desc: '音乐面板' },
  { name: 'counter', desc: '计数器' },
  { name: 'theme_mode', desc: '主题模式' },
];

export function renderButtonEditor(el, idx) {
  var html = '';

  // 基本属性
  html += fieldHtml('名称', '<input type="text" value="' + esc(el.name || '') + '" data-prop="name" data-idx="' + idx + '" placeholder="btn_xxx">');
  html += fieldHtml('宽度', '<input type="number" value="' + (el.w || 100) + '" data-prop="w" data-idx="' + idx + '" min="10" max="1000">');
  html += fieldHtml('高度', '<input type="number" value="' + (el.h || 40) + '" data-prop="h" data-idx="' + idx + '" min="10" max="1000">');
  html += fieldHtml('穿透触摸', '<label class="toggle-switch"><input type="checkbox" data-prop="interceptTouch" data-idx="' + idx + '"' + (el.interceptTouch ? ' checked' : '') + '><span class="toggle-slider"></span></label>');
  html += fieldHtml('可触摸', '<label class="toggle-switch"><input type="checkbox" data-prop="touchable" data-idx="' + idx + '"' + (el.touchable !== false ? ' checked' : '') + '><span class="toggle-slider"></span></label>');

  // ═══ onclick 事件配置 ═══
  html += '<div style="grid-column:1/-1;margin-top:12px;padding:12px;background:rgba(33,150,243,0.06);border:1px solid rgba(33,150,243,0.2);border-radius:10px">';
  html += '<div style="font-size:12px;font-weight:700;margin-bottom:10px;color:#2196f3;display:flex;align-items:center;gap:6px">⚡ 点击事件 (onclick)</div>';

  // 动作选择
  html += '<div style="margin-bottom:10px">';
  html += '<div style="font-size:11px;color:var(--text2);margin-bottom:6px">触发动作</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">';
  ONCLICK_ACTIONS.forEach(function (action) {
    var isActive = (el.onClickAction || 'none') === action.v;
    html += '<button class="el-btn onclick-action-btn" data-idx="' + idx + '" data-action="' + action.v + '" style="font-size:10px;padding:6px 4px;flex-direction:column;gap:2px;border-radius:6px;' +
      (isActive ? 'background:rgba(33,150,243,0.15);border-color:#2196f3;color:#2196f3' : '') +
      '" title="' + action.desc + '">' +
      '<span style="font-size:14px">' + action.icon + '</span>' +
      '<span>' + action.l + '</span></button>';
  });
  html += '</div></div>';

  // 动作描述
  var currentAction = ONCLICK_ACTIONS.find(function (a) { return a.v === (el.onClickAction || 'none'); });
  if (currentAction && currentAction.v !== 'none') {
    html += '<div style="padding:6px 10px;background:rgba(33,150,243,0.08);border-radius:6px;font-size:11px;color:#2196f3;margin-bottom:10px">💡 ' + currentAction.desc + '</div>';
  }

  // 目标变量（toggle_visibility / set_variable 需要）
  if (currentAction && currentAction.needsTarget) {
    html += '<div style="margin-bottom:10px">';
    html += '<div style="font-size:11px;color:var(--text2);margin-bottom:4px">目标变量名</div>';
    html += '<input type="text" value="' + esc(el.onClickTarget || '') + '" data-prop="onClickTarget" data-idx="' + idx + '" placeholder="如 enable_material" style="width:100%;padding:6px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:12px;font-family:monospace">';
    // 常用变量快捷按钮
    html += '<div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:4px">';
    COMMON_VARS.forEach(function (v) {
      html += '<button class="el-btn" data-set-target="' + v.name + '" data-idx="' + idx + '" style="font-size:9px;padding:2px 6px" title="' + v.desc + '">' + v.name + '</button>';
    });
    html += '</div></div>';
  }

  // 目标值（set_variable 需要）
  if (currentAction && currentAction.needsValue) {
    html += '<div style="margin-bottom:10px">';
    html += '<div style="font-size:11px;color:var(--text2);margin-bottom:4px">目标值</div>';
    html += '<input type="text" value="' + esc(el.onClickValue || '') + '" data-prop="onClickValue" data-idx="' + idx + '" placeholder="如 true / 1 / #counter + 1" style="width:100%;padding:6px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:12px;font-family:monospace">';
    html += '<div style="display:flex;gap:3px;margin-top:4px">';
    ['true', 'false', '0', '1', '!#target'].forEach(function (v) {
      html += '<button class="el-btn" data-set-value="' + v + '" data-idx="' + idx + '" style="font-size:9px;padding:2px 6px">' + v + '</button>';
    });
    html += '</div></div>';
  }

  // 组合命令（multi 需要）
  if (currentAction && currentAction.v === 'multi') {
    html += '<div style="margin-bottom:10px">';
    html += '<div style="font-size:11px;color:var(--text2);margin-bottom:6px">命令列表</div>';

    var cmds = el.onClickCommands || [];
    if (cmds.length > 0) {
      html += '<div style="max-height:120px;overflow-y:auto;margin-bottom:6px">';
      cmds.forEach(function (cmd, ci) {
        html += '<div style="display:flex;gap:4px;align-items:center;padding:4px 6px;margin-bottom:3px;background:var(--surface2);border-radius:4px;font-size:10px;font-family:monospace">' +
          '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">&lt;' + esc(cmd.tag) + (cmd.attrs ? ' ' + esc(cmd.attrs) : '') + ' /&gt;</span>' +
          '<button class="el-btn" data-remove-cmd="' + ci + '" data-idx="' + idx + '" style="font-size:9px;padding:1px 4px;color:var(--red)">✕</button></div>';
      });
      html += '</div>';
    }

    // 添加命令按钮
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap">';
    [
      { tag: 'VariableCommand', label: '📦 变量', default: 'target="var_name" value="true"' },
      { tag: 'MusicCommand', label: '🎵 音乐', default: 'action="toggle"' },
      { tag: 'FrameRateCommand', label: '⚡ 帧率', default: 'frameRate="30"' },
    ].forEach(function (cmdType) {
      html += '<button class="el-btn" data-add-cmd="' + cmdType.tag + '" data-cmd-default="' + cmdType.default + '" data-idx="' + idx + '" style="font-size:10px;padding:4px 8px">' + cmdType.label + '</button>';
    });
    html += '</div>';
    html += '</div>';
  }

  // 生成的 MAML 预览
  if (currentAction && currentAction.v !== 'none') {
    html += '<div style="margin-top:8px;padding:8px;background:var(--surface2);border-radius:6px">';
    html += '<div style="font-size:10px;color:var(--text3);margin-bottom:4px">生成的 MAML 代码预览：</div>';
    html += '<pre style="margin:0;font-size:10px;font-family:monospace;color:var(--accent);white-space:pre-wrap;word-break:break-all">' + esc(generateTriggerPreview(el)) + '</pre>';
    html += '</div>';
  }

  html += '</div>'; // end onclick section

  // 子元素管理
  html += '<div style="grid-column:1/-1;margin-top:8px;padding:8px;background:rgba(33,150,243,0.06);border-radius:6px">';
  html += '<div style="font-size:11px;font-weight:600;margin-bottom:6px;color:#2196f3">🔘 子元素（按钮内的内容） (' + (el.children ? el.children.length : 0) + ')</div>';
  html += '<div style="display:flex;gap:4px;flex-wrap:wrap">';
  ['text', 'rectangle', 'circle', 'image'].forEach(function (childType) {
    var icon = LAYER_ICONS[childType] || '❓';
    html += '<button class="el-btn" data-add-child="' + idx + '" data-child-type="' + childType + '" style="font-size:10px;padding:3px 8px">+ ' + childType + '</button>';
  });
  html += '</div>';
  if (el.children && el.children.length > 0) {
    html += '<div style="margin-top:6px;max-height:100px;overflow-y:auto">';
    el.children.forEach(function (child, ci) {
      var childIcon = LAYER_ICONS[child.type] || '❓';
      html += '<div style="display:flex;align-items:center;gap:4px;padding:2px 0;font-size:11px">' +
        '<span>' + childIcon + '</span>' +
        '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (child.name || child.text || child.type) + '</span>' +
        '<button class="el-btn" data-remove-child="' + idx + '" data-child-idx="' + ci + '" style="font-size:9px;padding:1px 4px;color:var(--red)">✕</button></div>';
    });
    html += '</div>';
  }
  html += '</div>';

  return html;
}

function generateTriggerPreview(el) {
  var action = el.onClickAction;
  var lines = ['<Trigger action="click">'];

  switch (action) {
    case 'toggle_visibility':
      lines.push('  <VariableCommand target="' + (el.onClickTarget || '?') + '" expression="!#' + (el.onClickTarget || '?') + '" />');
      break;
    case 'set_variable':
      lines.push('  <VariableCommand target="' + (el.onClickTarget || '?') + '" value="' + (el.onClickValue || '?') + '" />');
      break;
    case 'music_play':
      lines.push('  <MusicCommand action="play" />');
      break;
    case 'music_pause':
      lines.push('  <MusicCommand action="pause" />');
      break;
    case 'music_toggle':
      lines.push('  <MusicCommand action="toggle" />');
      break;
    case 'music_next':
      lines.push('  <MusicCommand action="next" />');
      break;
    case 'music_prev':
      lines.push('  <MusicCommand action="prev" />');
      break;
    case 'multi':
      if (el.onClickCommands) {
        el.onClickCommands.forEach(function (cmd) {
          lines.push('  <' + cmd.tag + (cmd.attrs ? ' ' + cmd.attrs : '') + ' />');
        });
      }
      break;
  }

  lines.push('</Trigger>');
  return lines.join('\n');
}
