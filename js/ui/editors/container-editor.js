// ─── Container Editor: group / layer / musiccontrol ────────────────
import { fieldHtml, esc, LAYER_ICONS } from './common.js';

export function renderGroupEditor(el, idx) {
  var html = '';
  html += fieldHtml('名称', '<input type="text" value="' + esc(el.name || '') + '" data-prop="name" data-idx="' + idx + '" placeholder="MAML name">');
  html += fieldHtml('可见性', '<input type="text" value="' + esc(el.visibility || '') + '" data-prop="visibility" data-idx="' + idx + '" placeholder="如 !#enable_hyper_material">');
  html += fieldHtml('Folme', '<label class="toggle-switch"><input type="checkbox" data-prop="folmeMode" data-idx="' + idx + '"' + (el.folmeMode ? ' checked' : '') + '><span class="toggle-slider"></span></label>');
  html += fieldHtml('水平对齐', '<select data-prop="align" data-idx="' + idx + '">' +
    ['', 'left', 'center', 'right'].map(function (a) {
      return '<option value="' + a + '"' + ((el.align || '') === a ? ' selected' : '') + '>' + (a || '无') + '</option>';
    }).join('') + '</select>');
  html += fieldHtml('垂直对齐', '<select data-prop="alignV" data-idx="' + idx + '">' +
    ['', 'top', 'center', 'bottom'].map(function (a) {
      return '<option value="' + a + '"' + ((el.alignV || '') === a ? ' selected' : '') + '>' + (a || '无') + '</option>';
    }).join('') + '</select>');
  html += fieldHtml('描述', '<input type="text" value="' + esc(el.contentDescription || '') + '" data-prop="contentDescription" data-idx="' + idx + '" placeholder="contentDescriptionExp">');

  // 子元素管理
  html += '<div style="grid-column:1/-1;margin-top:8px;padding:8px;background:rgba(124,109,240,0.08);border-radius:6px">';
  html += '<div style="font-size:11px;font-weight:600;margin-bottom:6px;color:var(--accent)">📦 子元素 (' + (el.children ? el.children.length : 0) + ')</div>';
  html += '<div style="display:flex;gap:4px;flex-wrap:wrap">';
  ['text', 'rectangle', 'circle', 'image', 'group'].forEach(function (childType) {
    var icon = LAYER_ICONS[childType] || '❓';
    html += '<button class="el-btn" data-add-child="' + idx + '" data-child-type="' + childType + '" style="font-size:10px;padding:3px 8px">+ ' + childType + '</button>';
  });
  html += '</div>';
  if (el.children && el.children.length > 0) {
    html += '<div style="margin-top:6px;max-height:120px;overflow-y:auto">';
    el.children.forEach(function (child, ci) {
      var childIcon = LAYER_ICONS[child.type] || '❓';
      html += '<div style="display:flex;align-items:center;gap:4px;padding:2px 0;font-size:11px">' +
        '<span>' + childIcon + '</span>' +
        '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (child.name || child.text || child.type) + '</span>' +
        '<button class="el-btn" data-remove-child="' + idx + '" data-child-idx="' + ci + '" style="font-size:9px;padding:1px 4px;color:var(--red)">✕</button>' +
        '</div>';
    });
    html += '</div>';
  }
  html += '</div>';

  return html;
}

export function renderLayerEditor(el, idx) {
  var html = '';
  html += fieldHtml('名称', '<input type="text" value="' + esc(el.name || '') + '" data-prop="name" data-idx="' + idx + '" placeholder="MAML name">');
  html += fieldHtml('层类型', '<select data-prop="layerType" data-idx="' + idx + '">' +
    ['bottom', 'top', 'overlay'].map(function (t) {
      return '<option value="' + t + '"' + ((el.layerType || 'bottom') === t ? ' selected' : '') + '>' + t + '</option>';
    }).join('') + '</select>');
  html += fieldHtml('可见性', '<input type="text" value="' + esc(el.visibility || '') + '" data-prop="visibility" data-idx="' + idx + '" placeholder="如 #enable_hyper_material">');
  html += fieldHtml('模糊半径', '<input type="number" value="' + (el.blurRadius || 0) + '" data-prop="blurRadius" data-idx="' + idx + '" min="0" max="500">');
  html += fieldHtml('模糊色', '<input type="text" value="' + esc(el.blurColors || '') + '" data-prop="blurColors" data-idx="' + idx + '" placeholder="如 #00000000">');
  html += fieldHtml('颜色模式', '<input type="number" value="' + (el.colorModes || 0) + '" data-prop="colorModes" data-idx="' + idx + '">');
  html += fieldHtml('帧率', '<input type="number" value="' + (el.frameRate !== undefined ? el.frameRate : -1) + '" data-prop="frameRate" data-idx="' + idx + '"><span style="font-size:10px;color:var(--text3)">-1=跟随</span>');
  html += fieldHtml('更新位置', '<label class="toggle-switch"><input type="checkbox" data-prop="updatePosition" data-idx="' + idx + '"' + (el.updatePosition !== false ? ' checked' : '') + '><span class="toggle-slider"></span></label>');
  html += fieldHtml('更新大小', '<label class="toggle-switch"><input type="checkbox" data-prop="updateSize" data-idx="' + idx + '"' + (el.updateSize !== false ? ' checked' : '') + '><span class="toggle-slider"></span></label>');
  html += fieldHtml('更新位移', '<label class="toggle-switch"><input type="checkbox" data-prop="updateTranslation" data-idx="' + idx + '"' + (el.updateTranslation !== false ? ' checked' : '') + '><span class="toggle-slider"></span></label>');

  // 子元素
  html += renderChildManager(el, idx);

  return html;
}

export function renderMusicControlEditor(el, idx) {
  var html = '';
  html += fieldHtml('名称', '<input type="text" value="' + esc(el.name || 'music_control') + '" data-prop="name" data-idx="' + idx + '">');
  html += fieldHtml('歌词', '<label class="toggle-switch"><input type="checkbox" data-prop="enableLyric" data-idx="' + idx + '"' + (el.enableLyric !== false ? ' checked' : '') + '><span class="toggle-slider"></span></label>');
  html += fieldHtml('刷新', '<label class="toggle-switch"><input type="checkbox" data-prop="autoRefresh" data-idx="' + idx + '"' + (el.autoRefresh !== false ? ' checked' : '') + '><span class="toggle-slider"></span></label>');
  html += fieldHtml('自动显示', '<label class="toggle-switch"><input type="checkbox" data-prop="autoShow" data-idx="' + idx + '"' + (el.autoShow ? ' checked' : '') + '><span class="toggle-slider"></span></label>');
  html += fieldHtml('歌词间隔', '<input type="number" value="' + (el.updateLyricInterval || 100) + '" data-prop="updateLyricInterval" data-idx="' + idx + '" min="50" max="5000"><span style="font-size:10px;color:var(--text3)">ms</span>');

  // 子元素
  html += renderChildManager(el, idx);

  return html;
}

function renderChildManager(el, idx) {
  var html = '<div style="grid-column:1/-1;margin-top:8px;padding:8px;background:rgba(124,109,240,0.08);border-radius:6px">';
  html += '<div style="font-size:11px;font-weight:600;margin-bottom:6px;color:var(--accent)">📦 子元素 (' + (el.children ? el.children.length : 0) + ')</div>';
  html += '<div style="display:flex;gap:4px;flex-wrap:wrap">';
  ['text', 'rectangle', 'circle', 'image', 'group'].forEach(function (childType) {
    html += '<button class="el-btn" data-add-child="' + idx + '" data-child-type="' + childType + '" style="font-size:10px;padding:3px 8px">+ ' + childType + '</button>';
  });
  html += '</div>';
  if (el.children && el.children.length > 0) {
    html += '<div style="margin-top:6px;max-height:120px;overflow-y:auto">';
    el.children.forEach(function (child, ci) {
      var childIcon = LAYER_ICONS[child.type] || '❓';
      html += '<div style="display:flex;align-items:center;gap:4px;padding:2px 0;font-size:11px">' +
        '<span>' + childIcon + '</span>' +
        '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (child.name || child.text || child.type) + '</span>' +
        '<button class="el-btn" data-remove-child="' + idx + '" data-child-idx="' + ci + '" style="font-size:9px;padding:1px 4px;color:var(--red)">✕</button>' +
        '</div>';
    });
    html += '</div>';
  }
  html += '</div>';
  return html;
}
