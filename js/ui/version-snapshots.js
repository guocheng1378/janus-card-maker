// ─── Version Snapshots: 自动版本快照 ─────────────────────────────
import * as S from '../state.js';
import { toast } from './toast.js';

var STORAGE_KEY = 'rear-eye-snapshots';
var MAX_SNAPSHOTS = 30;

function _load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { return []; }
}
function _save(snaps) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snaps)); } catch (e) {}
}

// Auto-save snapshot on export
export function autoSnapshot(label) {
  if (!S.tpl) return;
  var snaps = _load();
  snaps.unshift({
    id: 'snap_' + Date.now(),
    label: label || '自动快照',
    tplId: S.tpl.id,
    tplName: S.tpl.name,
    icon: S.tpl.icon,
    cfg: JSON.parse(JSON.stringify(S.cfg)),
    elements: JSON.parse(JSON.stringify(S.elements)),
    timestamp: Date.now(),
  });
  if (snaps.length > MAX_SNAPSHOTS) snaps = snaps.slice(0, MAX_SNAPSHOTS);
  _save(snaps);
}

export function getSnapshots() { return _load(); }

export function restoreSnapshot(snapId) {
  var snap = _load().find(function (s) { return s.id === snapId; });
  return snap || null;
}

export function deleteSnapshot(snapId) {
  var snaps = _load().filter(function (s) { return s.id !== snapId; });
  _save(snaps);
}

export function showSnapshotsModal(stepCallbacks) {
  var snaps = _load();
  var existing = document.getElementById('snapshotsModal');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'snapshotsModal';
  overlay.style.display = '';
  overlay.onclick = function () { overlay.remove(); };

  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '500px';
  modal.style.maxHeight = '70vh';
  modal.onclick = function (e) { e.stopPropagation(); };

  var html = '<div class="modal-header"><h3>📸 版本快照</h3><button class="modal-close" onclick="document.getElementById(\'snapshotsModal\').remove()">✕</button></div>';
  html += '<div class="modal-body" style="max-height:50vh;overflow-y:auto">';

  if (snaps.length === 0) {
    html += '<div style="text-align:center;padding:30px;color:var(--text3)">暂无快照<br><span style="font-size:11px">导出时会自动保存快照</span></div>';
  } else {
    snaps.forEach(function (snap) {
      var timeStr = new Date(snap.timestamp).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      html += '<div class="card-lib-item">' +
        '<div class="card-lib-icon">' + (snap.icon || '📸') + '</div>' +
        '<div class="card-lib-info"><div class="card-lib-name">' + snap.label + '</div>' +
        '<div class="card-lib-meta"><span>' + (snap.tplName || snap.tplId) + '</span><span>·</span><span>' + timeStr + '</span></div></div>' +
        '<div class="card-lib-actions">' +
        '<button class="card-lib-btn" data-snap-compare="' + snap.id + '" title="与当前版本对比">🔀</button>' +
        '<button class="card-lib-btn" data-snap-restore="' + snap.id + '" title="恢复">📂</button>' +
        '<button class="card-lib-btn" data-snap-delete="' + snap.id + '" title="删除" style="color:var(--red)">🗑️</button>' +
        '</div></div>';
    });
  }

  html += '</div>';
  modal.innerHTML = html;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.querySelectorAll('[data-snap-restore]').forEach(function (btn) {
    btn.onclick = function () {
      var snap = restoreSnapshot(btn.dataset.snapRestore);
      if (!snap) return toast('快照不存在', 'error');
      var TEMPLATES = window.__jcm_templates;
      if (!TEMPLATES) return toast('模板未加载', 'error');
      var tpl = TEMPLATES.find(function (t) { return t.id === snap.tplId; }) || TEMPLATES.find(function (t) { return t.id === 'custom'; });
      S.setTpl(tpl);
      var newCfg = {};
      tpl.config.forEach(function (g) { g.fields.forEach(function (f) { newCfg[f.key] = snap.cfg[f.key] !== undefined ? snap.cfg[f.key] : f.default; }); });
      S.setCfg(newCfg);
      S.setElements(snap.elements || []);
      S.setUploadedFiles({});
      S.setSelIdx(-1);
      S.setDirty(true);
      if (stepCallbacks) { stepCallbacks.renderTplGrid(); stepCallbacks.goStep(1); }
      overlay.remove();
      toast('📸 已恢复快照: ' + snap.label, 'success');
    };
  });

  overlay.querySelectorAll('[data-snap-delete]').forEach(function (btn) {
    btn.onclick = function () {
      deleteSnapshot(btn.dataset.snapDelete);
      showSnapshotsModal(stepCallbacks);
      toast('🗑️ 快照已删除', 'success');
    };
  });

  // 版本对比
  overlay.querySelectorAll('[data-snap-compare]').forEach(function (btn) {
    btn.onclick = function () {
      var snapA = restoreSnapshot(btn.dataset.snapCompare);
      if (!snapA) return;
      // Find current state as B
      var snapB = {
        label: '当前',
        tplId: S.tpl ? S.tpl.id : '',
        tplName: S.tpl ? S.tpl.name : '',
        cfg: JSON.parse(JSON.stringify(S.cfg)),
        elements: JSON.parse(JSON.stringify(S.elements)),
      };
      showCompareView(snapA, snapB, overlay);
    };
  });
}

// 版本对比视图
function showCompareView(snapA, snapB, parentOverlay) {
  var existing = document.getElementById('compareModal');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'compareModal';
  overlay.style.display = '';
  overlay.onclick = function () { overlay.remove(); };

  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '700px';
  modal.style.maxHeight = '80vh';
  modal.onclick = function (e) { e.stopPropagation(); };

  // Diff elements count
  var countA = (snapA.elements || []).length;
  var countB = (snapB.elements || []).length;
  var changes = [];

  // Compare configs
  var allKeys = {};
  Object.keys(snapA.cfg || {}).forEach(function (k) { allKeys[k] = true; });
  Object.keys(snapB.cfg || {}).forEach(function (k) { allKeys[k] = true; });
  Object.keys(allKeys).forEach(function (k) {
    var vA = JSON.stringify(snapA.cfg[k]);
    var vB = JSON.stringify(snapB.cfg[k]);
    if (vA !== vB) changes.push({ key: k, a: vA, b: vB });
  });

  var html = '<div class="modal-header"><h3>📸 版本对比</h3><button class="modal-close" onclick="document.getElementById(\'compareModal\').remove()">✕</button></div>';
  html += '<div class="modal-body" style="max-height:60vh;overflow-y:auto">';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">';
  html += '<div style="padding:10px;background:var(--surface2);border-radius:8px"><div style="font-size:12px;font-weight:600;color:var(--accent)">' + snapA.label + '</div><div style="font-size:11px;color:var(--text3)">' + countA + ' 个元素</div></div>';
  html += '<div style="padding:10px;background:var(--surface2);border-radius:8px"><div style="font-size:12px;font-weight:600;color:var(--green)">' + snapB.label + '</div><div style="font-size:11px;color:var(--text3)">' + countB + ' 个元素</div></div>';
  html += '</div>';

  if (countA !== countB) {
    html += '<div style="padding:8px;background:rgba(253,203,110,0.1);border:1px solid rgba(253,203,110,0.3);border-radius:6px;font-size:12px;color:var(--orange);margin-bottom:12px">⚠️ 元素数量不同: ' + countA + ' → ' + countB + '</div>';
  }

  if (changes.length > 0) {
    html += '<div style="font-size:11px;font-weight:600;margin-bottom:6px">配置变更 (' + changes.length + '):</div>';
    changes.forEach(function (c) {
      html += '<div style="padding:6px 10px;margin-bottom:4px;background:var(--surface2);border-radius:6px;font-size:11px">' +
        '<div style="color:var(--text2);font-weight:600">' + esc(c.key) + '</div>' +
        '<div style="color:var(--red);text-decoration:line-through">' + esc(c.a || '(空)') + '</div>' +
        '<div style="color:var(--green)">' + esc(c.b || '(空)') + '</div></div>';
    });
  } else {
    html += '<div style="text-align:center;padding:20px;color:var(--text3)">✅ 配置无变化</div>';
  }

  html += '<div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end">';
  html += '<button class="btn btn-secondary" onclick="document.getElementById(\'compareModal\').remove()">关闭</button>';
  if (parentOverlay) {
    html += '<button class="btn btn-secondary" onclick="document.getElementById(\'compareModal\').remove()" style="border-color:var(--accent)">返回快照列表</button>';
  }
  html += '</div></div>';

  modal.innerHTML = html;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
