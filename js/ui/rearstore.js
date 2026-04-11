// ─── RearStore: 社区组件商店（接入 NekoStash widgets-index）────────
import * as S from '../state.js';
import { TEMPLATES } from '../templates/index.js';
import { resetHistory } from '../history.js';
import { toast, toastProgress } from './toast.js';
import { escHtml } from '../utils.js';
import { importZip } from '../export.js';

var INDEX_BASE = 'https://raw.githubusercontent.com/NekoStash/widgets-index/main';

var _modal = null;
var _cache = {};

// ─── GitHub Proxy 配置 ────────────────────────────────────────────
var GITHUB_HOSTS = new Set([
  'github.com', 'raw.githubusercontent.com', 'objects.githubusercontent.com',
  'release-assets.githubusercontent.com', 'avatars.githubusercontent.com',
]);

function _getProxyPrefix() {
  return localStorage.getItem('jcm-gh-proxy-prefix') || '';
}
function _setProxyPrefix(v) {
  localStorage.setItem('jcm-gh-proxy-prefix', v);
}
function _getHostOverride() {
  return localStorage.getItem('jcm-gh-host-override') || '';
}
function _setHostOverride(v) {
  localStorage.setItem('jcm-gh-host-override', v);
}

function normalizeProxyPrefix(prefix) {
  var p = (prefix || '').trim();
  if (!p) return '';
  return p.endsWith('/') ? p : p + '/';
}

function normalizeHostOverride(value) {
  var v = (value || '').trim();
  if (!v) return null;
  try {
    var url = v.indexOf('://') >= 0 ? new URL(v) : new URL('https://' + v);
    return { protocol: url.protocol, host: url.host };
  } catch (e) { return null; }
}

function withGitHubProxy(inputUrl) {
  var prefix = normalizeProxyPrefix(_getProxyPrefix());
  if (!prefix) return inputUrl;
  if (inputUrl.indexOf(prefix) === 0) return inputUrl;
  try {
    var parsed = new URL(inputUrl);
    if (!GITHUB_HOSTS.has(parsed.hostname)) return inputUrl;
  } catch (e) { return inputUrl; }
  return prefix + inputUrl;
}

function rewriteGitHubHost(inputUrl) {
  var override = normalizeHostOverride(_getHostOverride());
  if (!override) return inputUrl;
  try {
    var parsed = new URL(inputUrl);
    if (parsed.hostname !== 'github.com') return inputUrl;
    parsed.protocol = override.protocol;
    parsed.host = override.host;
    return parsed.toString();
  } catch (e) { return inputUrl; }
}

function prepareDownloadUrl(inputUrl) {
  var rewritten = rewriteGitHubHost(inputUrl);
  if (normalizeHostOverride(_getHostOverride())) return rewritten;
  return withGitHubProxy(rewritten);
}

// ─── API ──────────────────────────────────────────────────────────
function fetchJSON(url) {
  if (_cache[url]) return Promise.resolve(_cache[url]);
  return fetch(url)
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      _cache[url] = data;
      return data;
    });
}

function getWidgets() {
  return fetchJSON(INDEX_BASE + '/indexes/widgets.json');
}

function getSummaries() {
  return fetchJSON(INDEX_BASE + '/indexes/component-summaries.json');
}

function getWidgetReleases(id) {
  return fetchJSON(INDEX_BASE + '/data/' + encodeURIComponent(id) + '/releases.json').catch(function () { return null; });
}

// ─── Modal ────────────────────────────────────────────────────────
export function openRearStoreModal(stepCallbacks) {
  if (_modal) { _modal.remove(); _modal = null; }

  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = '';
  overlay.onclick = function () { closeRearStoreModal(); };

  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '720px';
  modal.style.maxHeight = '85vh';
  modal.onclick = function (e) { e.stopPropagation(); };

  var html = '<div class="modal-header">' +
    '<h3>🛒 RearStore 组件商店</h3>' +
    '<div style="display:flex;gap:8px;align-items:center">' +
    '<button class="btn btn-secondary" id="rsProxyBtn" style="font-size:11px;padding:3px 10px" title="GitHub 代理设置">🌐 代理</button>' +
    '<button class="modal-close" id="rsCloseBtn" aria-label="关闭">✕</button>' +
    '</div></div>';

  html += '<div style="padding:12px 16px;border-bottom:1px solid var(--border)">' +
    '<input type="text" id="rsSearchInput" placeholder="🔍 搜索组件..." ' +
    'style="width:100%;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);' +
    'border-radius:8px;color:var(--text);font-size:13px;outline:none">' +
    '</div>';

  html += '<div class="modal-body" id="rsBody" style="max-height:60vh;overflow-y:auto;padding:16px">' +
    '<div style="text-align:center;padding:40px;color:var(--text3)">⏳ 加载中...</div>' +
    '</div>';

  modal.innerHTML = html;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  _modal = overlay;

  overlay.querySelector('#rsCloseBtn').onclick = function () { closeRearStoreModal(); };
  overlay.querySelector('#rsProxyBtn').onclick = function () { showProxySettings(); };

  var searchInput = overlay.querySelector('#rsSearchInput');
  var searchTimer = null;
  searchInput.addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { renderWidgetList(searchInput.value.trim()); }, 300);
  });

  searchInput.focus();
  renderWidgetList('');
}

function renderWidgetList(query) {
  var bodyEl = _modal && _modal.querySelector('#rsBody');
  if (!bodyEl) return;

  Promise.all([getWidgets(), getSummaries()])
    .then(function (results) {
      var widgets = results[0];
      var summaries = results[1];

      if (!Array.isArray(widgets) || widgets.length === 0) {
        bodyEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3)">' +
          '<div style="font-size:48px;margin-bottom:16px">🏪</div>' +
          '<div>商店暂无组件</div></div>';
        return;
      }

      var filtered = widgets;
      if (query) {
        var q = query.toLowerCase();
        filtered = widgets.filter(function (w) {
          return (w.name || '').toLowerCase().indexOf(q) >= 0 ||
                 (w.description || '').toLowerCase().indexOf(q) >= 0 ||
                 (w.authorName || '').toLowerCase().indexOf(q) >= 0;
        });
      }

      if (filtered.length === 0) {
        bodyEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3)">' +
          '<div style="font-size:36px;margin-bottom:12px">🔍</div>' +
          '<div>没有找到匹配的组件</div></div>';
        return;
      }

      var proxyActive = !!_getProxyPrefix() || !!_getHostOverride();
      var proxyBadge = proxyActive ? '<span style="font-size:11px;color:var(--green);margin-left:8px">🌐 代理已启用</span>' : '';

      var html = '<div class="rs-widget-list">' +
        '<div style="font-size:11px;color:var(--text3);padding:0 2px;margin-bottom:4px">' +
        '共 ' + filtered.length + ' 个组件' + proxyBadge + '</div>';
      filtered.forEach(function (w) {
        var summary = summaries.components && summaries.components[w.id];
        var avatarUrl = summary && summary.author && summary.author.avatarUrl;
        var starsHtml = w.stars ? '<span style="color:#f39c12;margin-left:6px">⭐ ' + w.stars + '</span>' : '';
        var dateStr = w.latestReleasePublishedAt
          ? new Date(w.latestReleasePublishedAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
          : '';

        html += '<div class="rs-widget-card">' +
          '<div class="rs-widget-header">' +
          (avatarUrl ? '<img class="rs-avatar" src="' + escHtml(avatarUrl) + '" alt="" loading="lazy">'
                     : '<div class="rs-avatar-placeholder">📦</div>') +
          '<div class="rs-widget-info">' +
          '<div class="rs-widget-name">' + escHtml(w.name) + starsHtml + '</div>' +
          '<div class="rs-widget-meta">' +
          '<span>@' + escHtml(w.authorName || 'unknown') + '</span>' +
          (w.latestReleaseTag ? '<span> · ' + escHtml(w.latestReleaseTag) + '</span>' : '') +
          (dateStr ? '<span> · ' + dateStr + '</span>' : '') +
          '</div></div></div>' +
          '<div class="rs-widget-desc">' + escHtml(w.description || '') + '</div>' +
          '<div class="rs-widget-actions">' +
          '<button class="btn btn-primary rs-install-btn" data-rs-install="' + escHtml(w.id) + '" style="font-size:12px;padding:4px 12px">📥 安装最新版</button>' +
          '</div></div>';
      });
      html += '</div>';

      bodyEl.innerHTML = html;

      bodyEl.querySelectorAll('[data-rs-install]').forEach(function (btn) {
        btn.onclick = function () { installWidget(btn.dataset.rsInstall, stepCallbacks); };
      });
    })
    .catch(function (err) {
      bodyEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--err)">' +
        '<div style="font-size:36px;margin-bottom:12px">❌</div>' +
        '<div>加载失败: ' + escHtml(err.message) + '</div>' +
        '<button class="btn btn-secondary" id="rsRetryBtn" style="margin-top:12px;font-size:12px">🔄 重试</button></div>';
      bodyEl.querySelector('#rsRetryBtn').onclick = function () {
        bodyEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3)">⏳ 重试中...</div>';
        _cache = {};
        renderWidgetList(query);
      };
    });
}

// ─── Proxy Settings ───────────────────────────────────────────────
function showProxySettings() {
  var existing = document.getElementById('rsProxyModal');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'rsProxyModal';
  overlay.style.display = '';
  overlay.onclick = function () { overlay.remove(); };

  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '520px';
  modal.onclick = function (e) { e.stopPropagation(); };

  var curPrefix = _getProxyPrefix();
  var curHost = _getHostOverride();

  var html = '<div class="modal-header">' +
    '<h3>🌐 GitHub 代理设置</h3>' +
    '<button class="modal-close" onclick="document.getElementById(\'rsProxyModal\').remove()">✕</button>' +
    '</div>' +
    '<div class="modal-body" style="padding:16px">' +

    '<div style="margin-bottom:16px">' +
    '<div style="font-size:13px;font-weight:600;margin-bottom:6px">代理前缀 (CDN 加速)</div>' +
    '<div style="font-size:11px;color:var(--text3);margin-bottom:8px;line-height:1.5">' +
    '在 GitHub 下载链接前加代理前缀，适用于 Cloudflare Workers、自建加速等。<br>' +
    '例：<code style="background:var(--surface2);padding:1px 4px;border-radius:3px">https://ghproxy.com/</code></div>' +
    '<input type="text" id="rsProxyPrefix" value="' + escHtml(curPrefix) + '" placeholder="https://your-proxy.com/" ' +
    'style="width:100%;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);' +
    'border-radius:8px;color:var(--text);font-size:13px;outline:none;font-family:monospace">' +
    '</div>' +

    '<div style="margin-bottom:16px">' +
    '<div style="font-size:13px;font-weight:600;margin-bottom:6px">Host 覆写</div>' +
    '<div style="font-size:11px;color:var(--text3);margin-bottom:8px;line-height:1.5">' +
    '将 <code style="background:var(--surface2);padding:1px 4px;border-radius:3px">github.com</code> 替换为镜像地址，' +
    '适合有反代的场景。<br>' +
    '例：<code style="background:var(--surface2);padding:1px 4px;border-radius:3px">github.example.com</code></div>' +
    '<input type="text" id="rsHostOverride" value="' + escHtml(curHost) + '" placeholder="留空不启用" ' +
    'style="width:100%;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);' +
    'border-radius:8px;color:var(--text);font-size:13px;outline:none;font-family:monospace">' +
    '</div>' +

    '<div style="padding:10px;background:rgba(108,92,231,0.06);border-radius:8px;font-size:11px;color:var(--text3);line-height:1.6;margin-bottom:16px">' +
    '<div style="font-weight:600;margin-bottom:4px">💡 常用代理服务</div>' +
    '• <a href="https://gh-proxy.com" target="_blank" style="color:var(--accent)">gh-proxy.com</a> — 免费 GitHub 代理<br>' +
    '• <a href="https://mirror.ghproxy.com" target="_blank" style="color:var(--accent)">mirror.ghproxy.com</a> — 镜像加速<br>' +
    '• 自建 Cloudflare Worker — 参考 NekoStash 的 esa-edge-function.js<br>' +
    '• 两项都填时，Host 覆写优先（代理前缀不生效）' +
    '</div>' +

    '<div style="display:flex;gap:8px;justify-content:flex-end">' +
    '<button class="btn btn-secondary" onclick="document.getElementById(\'rsProxyModal\').remove()" style="font-size:12px;padding:6px 14px">取消</button>' +
    '<button class="btn btn-secondary" id="rsProxyClear" style="font-size:12px;padding:6px 14px;color:var(--err)">🗑️ 清除</button>' +
    '<button class="btn btn-primary" id="rsProxySave" style="font-size:12px;padding:6px 14px">💾 保存</button>' +
    '</div>' +

    '</div>';

  modal.innerHTML = html;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.querySelector('#rsProxySave').onclick = function () {
    var prefix = overlay.querySelector('#rsProxyPrefix').value.trim();
    var host = overlay.querySelector('#rsHostOverride').value.trim();
    _setProxyPrefix(prefix);
    _setHostOverride(host);
    overlay.remove();
    toast('✅ 代理设置已保存', 'success');
    // Refresh list to show proxy badge
    if (_modal) {
      var q = (_modal.querySelector('#rsSearchInput') || {}).value || '';
      renderWidgetList(q.trim());
    }
  };

  overlay.querySelector('#rsProxyClear').onclick = function () {
    _setProxyPrefix('');
    _setHostOverride('');
    overlay.remove();
    toast('🗑️ 代理设置已清除', 'success');
    if (_modal) {
      var q = (_modal.querySelector('#rsSearchInput') || {}).value || '';
      renderWidgetList(q.trim());
    }
  };
}

// ─── Install ──────────────────────────────────────────────────────
function installWidget(id, stepCallbacks) {
  getWidgetReleases(id).then(function (releases) {
    if (!releases || !releases.releases || releases.releases.length === 0) {
      return toast('该组件暂无发布版本', 'warning');
    }
    var latest = releases.releases[0];
    if (!latest.assets || latest.assets.length === 0) {
      return toast('该版本无可用文件', 'warning');
    }
    var asset = latest.assets[0];
    downloadAndImport(asset.downloadUrl, asset.name, stepCallbacks);
  }).catch(function (e) {
    toast('获取版本信息失败: ' + e.message, 'error');
  });
}

function downloadAndImport(url, fileName, stepCallbacks) {
  // 应用 GitHub 代理
  var proxyUrl = prepareDownloadUrl(url);
  var proxyActive = proxyUrl !== url;
  var pLabel = proxyActive ? '通过代理下载 ' : '正在下载 ';
  var p = toastProgress(pLabel + fileName + '...');

  fetch(proxyUrl)
    .then(function (r) {
      if (!r.ok) throw new Error('下载失败 HTTP ' + r.status);
      return r.blob();
    })
    .then(function (blob) {
      p.update('正在导入...');
      var file = new File([blob], fileName, { type: 'application/zip' });

      if (fileName.endsWith('.zip')) {
        return importZip(file).then(function (data) {
          S.setTpl(TEMPLATES.find(function (t) { return t.id === 'custom'; }));
          S.setCfg({ cardName: data.cardName, bgColor: data.bgColor, bgImage: data.bgImage || '' });
          S.setElements(data.elements);
          S.setUploadedFiles(data.files || {});
          S.setSelIdx(-1);
          S.setDirty(true);
          resetHistory();
          if (stepCallbacks) {
            stepCallbacks.renderTplGrid();
            stepCallbacks.goStep(1);
          }
          closeRearStoreModal();
          p.close('✅ 已导入: ' + fileName, 'success');
        });
      }

      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(a.href);
      p.close('✅ 已下载: ' + fileName, 'success');
    })
    .catch(function (err) {
      // 代理下载失败，尝试直连
      if (proxyActive) {
        p.update('代理失败，尝试直连...');
        fetch(url)
          .then(function (r) {
            if (!r.ok) throw new Error('直连也失败 HTTP ' + r.status);
            return r.blob();
          })
          .then(function (blob) {
            p.update('正在导入...');
            var file = new File([blob], fileName, { type: 'application/zip' });
            if (fileName.endsWith('.zip')) {
              return importZip(file).then(function (data) {
                S.setTpl(TEMPLATES.find(function (t) { return t.id === 'custom'; }));
                S.setCfg({ cardName: data.cardName, bgColor: data.bgColor, bgImage: data.bgImage || '' });
                S.setElements(data.elements);
                S.setUploadedFiles(data.files || {});
                S.setSelIdx(-1); S.setDirty(true);
                resetHistory();
                if (stepCallbacks) { stepCallbacks.renderTplGrid(); stepCallbacks.goStep(1); }
                closeRearStoreModal();
                p.close('✅ 已导入: ' + fileName + '（直连）', 'success');
              });
            }
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob); a.download = fileName; a.click();
            URL.revokeObjectURL(a.href);
            p.close('✅ 已下载: ' + fileName + '（直连）', 'success');
          })
          .catch(function (e2) { p.close('❌ 代理和直连均失败', 'error'); });
      } else {
        p.close('❌ ' + err.message, 'error');
      }
    });
}

// ─── Helpers ──────────────────────────────────────────────────────
export function closeRearStoreModal() {
  if (_modal) { _modal.remove(); _modal = null; }
}
