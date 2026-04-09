// ─── Gist Backup: GitHub Gist 云备份 ──────────────────────────────
import * as S from '../state.js';
import { toast, toastProgress } from './toast.js';

var GIST_API = 'https://api.github.com/gists';

function getToken() {
  return localStorage.getItem('jcm-gh-token') || '';
}

function saveToken(t) {
  localStorage.setItem('jcm-gh-token', t);
}

function decodeToken(encoded) {
  try {
    var key = navigator.userAgent.length + '_' + screen.width + 'x' + screen.height;
    var decoded = atob(encoded);
    var result = '';
    for (var i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch (e) { return ''; }
}

function getRealToken() {
  var raw = getToken();
  if (!raw) return '';
  return decodeToken(raw);
}

export function showGistBackupModal() {
  var existing = document.getElementById('gistBackupModal');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'gistBackupModal';
  overlay.style.display = '';
  overlay.onclick = function () { overlay.remove(); };

  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '480px';
  modal.onclick = function (e) { e.stopPropagation(); };

  var hasToken = !!getRealToken();

  var html = '<div class="modal-header"><h3>🌐 Gist 云备份</h3><button class="modal-close" onclick="document.getElementById(\'gistBackupModal\').remove()">✕</button></div>';
  html += '<div class="modal-body">';

  if (!hasToken) {
    html += '<div style="text-align:center;padding:20px">' +
      '<div style="font-size:32px;margin-bottom:12px">🔑</div>' +
      '<div style="font-size:13px;color:var(--text2);margin-bottom:16px">需要 GitHub Token 来使用 Gist 备份<br><small style="color:var(--text3)">Token 需要 gist 权限</small></div>' +
      '<button class="btn btn-secondary" onclick="JCM.showGistTokenInput()" style="width:100%">设置 GitHub Token</button>' +
      '</div>';
  } else {
    html += '<div style="display:flex;flex-direction:column;gap:10px;padding:8px 0">';
    html += '<button class="btn btn-secondary" onclick="JCM.gistBackup()" style="width:100%;justify-content:flex-start"><span style="margin-right:8px">☁️</span> 备份到 Gist</button>';
    html += '<button class="btn btn-secondary" onclick="JCM.gistRestore()" style="width:100%;justify-content:flex-start"><span style="margin-right:8px">📥</span> 从 Gist 恢复</button>';
    html += '<div style="border-top:1px solid var(--border);padding-top:10px;margin-top:4px">';
    html += '<div style="font-size:11px;color:var(--text3);margin-bottom:8px">备份内容: 模板配置 + 元素数据 (不含图片/视频)</div>';
    html += '<button class="el-btn" onclick="JCM.showGistTokenInput()" style="font-size:11px;width:100%">🔑 更换 Token</button>';
    html += '</div></div>';
  }

  html += '</div>';
  modal.innerHTML = html;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

export function showGistTokenInput() {
  var existing = document.getElementById('gistBackupModal');
  if (existing) existing.remove();

  var token = prompt('输入 GitHub Personal Access Token (需要 gist 权限):\n\n⚠️ Token 以 Base64 明文存储在浏览器本地，仅限个人设备使用。');
  if (!token) return;

  // Simple obfuscation
  var key = navigator.userAgent.length + '_' + screen.width + 'x' + screen.height;
  var encoded = '';
  for (var i = 0; i < token.length; i++) {
    encoded += String.fromCharCode(token.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  saveToken(btoa(encoded));
  toast('🔑 Token 已保存', 'success');
  showGistBackupModal();
}

export function gistBackup() {
  if (!S.tpl) return toast('请先选择模板', 'error');

  var token = getRealToken();
  if (!token) return toast('请先设置 Token', 'error');

  var data = {
    templateId: S.tpl.id,
    templateName: S.tpl.name,
    config: S.cfg,
    elements: S.elements,
    timestamp: Date.now(),
  };

  var p = toastProgress('正在备份到 Gist...');
  fetch(GIST_API, {
    method: 'POST',
    headers: {
      'Authorization': 'token ' + token,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'REAREye 卡片备份: ' + (S.cfg.cardName || S.tpl.name) + ' @ ' + new Date().toLocaleString('zh-CN'),
      public: false,
      files: {
        'rear-eye-card.json': {
          content: JSON.stringify(data, null, 2),
        },
      },
    }),
  }).then(function (res) {
    if (res.status === 201) return res.json();
    if (res.status === 401) throw new Error('Token 无效');
    if (res.status === 403) throw new Error('权限不足，Token 需要 gist 权限');
    throw new Error('HTTP ' + res.status);
  }).then(function (gist) {
    p.close('✅ 备份成功!', 'success');
    // Save gist ID for future updates
    try {
      var backups = JSON.parse(localStorage.getItem('jcm-gist-backups') || '[]');
      backups.unshift({ id: gist.id, name: S.cfg.cardName || S.tpl.name, url: gist.html_url, time: Date.now() });
      if (backups.length > 10) backups = backups.slice(0, 10);
      localStorage.setItem('jcm-gist-backups', JSON.stringify(backups));
    } catch (e) {}
    toast('🔗 ' + gist.html_url, 'info');
  }).catch(function (e) {
    p.close('❌ 备份失败: ' + e.message, 'error');
  });
}

export function gistRestore() {
  var token = getRealToken();
  if (!token) return toast('请先设置 Token', 'error');

  // Show list of recent backups
  var backups = [];
  try { backups = JSON.parse(localStorage.getItem('jcm-gist-backups') || '[]'); } catch (e) {}

  if (backups.length > 0) {
    showGistRestorePicker(backups, token);
  } else {
    var gistId = prompt('输入 Gist ID 或 URL:');
    if (!gistId) return;
    // Extract ID from URL if needed
    var match = gistId.match(/([a-f0-9]{32})/);
    if (match) gistId = match[1];
    fetchGist(gistId, token);
  }
}

function showGistRestorePicker(backups, token) {
  var existing = document.getElementById('gistRestorePicker');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'gistRestorePicker';
  overlay.style.display = '';
  overlay.onclick = function () { overlay.remove(); };

  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '400px';
  modal.onclick = function (e) { e.stopPropagation(); };

  var html = '<div class="modal-header"><h3>📥 选择备份</h3><button class="modal-close" onclick="document.getElementById(\'gistRestorePicker\').remove()">✕</button></div>';
  html += '<div class="modal-body" style="max-height:40vh;overflow-y:auto">';
  backups.forEach(function (b) {
    var timeStr = new Date(b.time).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    html += '<div class="card-lib-item" style="cursor:pointer" data-gist-restore="' + b.id + '">' +
      '<div class="card-lib-icon">☁️</div>' +
      '<div class="card-lib-info"><div class="card-lib-name">' + (b.name || '备份') + '</div>' +
      '<div class="card-lib-meta"><span>' + timeStr + '</span></div></div></div>';
  });
  html += '<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">' +
    '<button class="el-btn" onclick="JCM.gistRestoreById()" style="width:100%;font-size:11px">🔗 输入 Gist ID</button></div>';
  html += '</div>';
  modal.innerHTML = html;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.querySelectorAll('[data-gist-restore]').forEach(function (btn) {
    btn.onclick = function () {
      overlay.remove();
      fetchGist(btn.dataset.gistRestore, token);
    };
  });
}

export function gistRestoreById() {
  var existing = document.getElementById('gistRestorePicker');
  if (existing) existing.remove();
  var gistId = prompt('输入 Gist ID 或 URL:');
  if (!gistId) return;
  var match = gistId.match(/([a-f0-9]{32})/);
  if (match) gistId = match[1];
  var token = getRealToken();
  if (!token) return toast('请先设置 Token', 'error');
  fetchGist(gistId, token);
}

function fetchGist(gistId, token) {
  var p = toastProgress('正在从 Gist 恢复...');
  fetch(GIST_API + '/' + gistId, {
    headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github+json' },
  }).then(function (res) {
    if (res.ok) return res.json();
    throw new Error('HTTP ' + res.status);
  }).then(function (gist) {
    var file = gist.files['rear-eye-card.json'];
    if (!file) throw new Error('不是 REAREye 备份');
    var data = JSON.parse(file.content);
    p.close('✅ 数据已获取', 'success');
    // Apply
    var TEMPLATES = window.__jcm_templates;
    if (!TEMPLATES) return toast('模板未加载', 'error');
    var tpl = TEMPLATES.find(function (t) { return t.id === data.templateId; }) || TEMPLATES.find(function (t) { return t.id === 'custom'; });
    S.setTpl(tpl);
    S.setCfg(data.config || {});
    S.setElements(data.elements || []);
    S.setUploadedFiles({});
    S.setSelIdx(-1);
    S.setDirty(true);
    toast('✅ 已从 Gist 恢复', 'success');
    // Go to step 1
    if (window.JCM) window.JCM.goStep(1);
  }).catch(function (e) {
    p.close('❌ 恢复失败: ' + e.message, 'error');
  });
}
