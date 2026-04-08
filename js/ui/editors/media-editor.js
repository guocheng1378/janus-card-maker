// ─── Media Editor: image / video / lottie ─────────────────────────
import { fieldHtml, colorFieldHtml2, esc } from './common.js';

export function renderImageEditor(el, idx) {
  var html = '';
  html += '<div class="field"><label>适配</label><select data-prop="fit" data-idx="' + idx + '">' +
    ['cover', 'contain', 'fill', 'none'].map(function (f) {
      return '<option value="' + f + '"' + ((el.fit || 'cover') === f ? ' selected' : '') + '>' + f + '</option>';
    }).join('') + '</select></div>';
  html += fieldHtml('圆角', '<input type="number" value="' + (el.radius || 0) + '" data-prop="radius" data-idx="' + idx + '" min="0" max="500">');

  // CSS 滤镜
  html += fieldHtml('亮度', '<input type="range" min="0" max="200" value="' + (el.brightness !== undefined ? el.brightness : 100) + '" data-prop="brightness" data-idx="' + idx + '"><span style="font-size:10px;color:var(--text3)">' + (el.brightness !== undefined ? el.brightness : 100) + '%</span>');
  html += fieldHtml('饱和度', '<input type="range" min="0" max="200" value="' + (el.saturate !== undefined ? el.saturate : 100) + '" data-prop="saturate" data-idx="' + idx + '"><span style="font-size:10px;color:var(--text3)">' + (el.saturate !== undefined ? el.saturate : 100) + '%</span>');
  html += fieldHtml('色相', '<input type="range" min="0" max="360" value="' + (el.hueRotate || 0) + '" data-prop="hueRotate" data-idx="' + idx + '"><span style="font-size:10px;color:var(--text3)">' + (el.hueRotate || 0) + '°</span>');

  if (el.fileName) {
    html += '<div style="grid-column:1/-1"><button class="el-btn" data-pick="image" style="font-size:11px">🖼 替换图片</button></div>';
  }
  return html;
}

export function renderVideoEditor(el, idx) {
  var html = '';
  html += '<div class="field"><label>适配</label><select data-prop="fit" data-idx="' + idx + '">' +
    ['cover', 'contain', 'fill', 'none'].map(function (f) {
      return '<option value="' + f + '"' + ((el.fit || 'cover') === f ? ' selected' : '') + '>' + f + '</option>';
    }).join('') + '</select></div>';
  html += fieldHtml('圆角', '<input type="number" value="' + (el.radius || 0) + '" data-prop="radius" data-idx="' + idx + '" min="0" max="500">');

  // CSS 滤镜
  html += fieldHtml('亮度', '<input type="range" min="0" max="200" value="' + (el.brightness !== undefined ? el.brightness : 100) + '" data-prop="brightness" data-idx="' + idx + '"><span style="font-size:10px;color:var(--text3)">' + (el.brightness !== undefined ? el.brightness : 100) + '%</span>');
  html += fieldHtml('饱和度', '<input type="range" min="0" max="200" value="' + (el.saturate !== undefined ? el.saturate : 100) + '" data-prop="saturate" data-idx="' + idx + '"><span style="font-size:10px;color:var(--text3)">' + (el.saturate !== undefined ? el.saturate : 100) + '%</span>');
  html += fieldHtml('色相', '<input type="range" min="0" max="360" value="' + (el.hueRotate || 0) + '" data-prop="hueRotate" data-idx="' + idx + '"><span style="font-size:10px;color:var(--text3)">' + (el.hueRotate || 0) + '°</span>');

  if (el.fileName) {
    html += '<div style="grid-column:1/-1"><button class="el-btn" data-pick="video" style="font-size:11px">🎬 替换视频</button></div>';
  }
  return html;
}

export function renderLottieEditor(el, idx) {
  var html = '';
  html += fieldHtml('资源', '<input type="text" value="' + esc(el.src || el.fileName || '') + '" data-prop="src" data-idx="' + idx + '" placeholder="如 assets/play.json">');
  html += fieldHtml('名称', '<input type="text" value="' + esc(el.name || '') + '" data-prop="name" data-idx="' + idx + '" placeholder="MAML name 属性">');
  html += fieldHtml('对齐', '<select data-prop="align" data-idx="' + idx + '">' +
    ['center', 'left', 'right', 'top', 'bottom'].map(function (a) {
      return '<option value="' + a + '"' + ((el.align || 'center') === a ? ' selected' : '') + '>' + a + '</option>';
    }).join('') + '</select>');
  html += fieldHtml('循环', '<input type="number" value="' + (el.loop !== undefined ? el.loop : 0) + '" data-prop="loop" data-idx="' + idx + '" min="0" max="999"><span style="font-size:10px;color:var(--text3)">0=无限</span>');
  html += fieldHtml('速度', '<input type="range" min="1" max="50" value="' + Math.round((el.speed || 1) * 10) + '" data-prop="speed" data-idx="' + idx + '"><span style="font-size:10px;color:var(--text3)">' + (el.speed || 1).toFixed(1) + 'x</span>');
  return html;
}
