// ─── Template Market: Gist 后端社区市场 ────────────────────────
import * as S from '../state.js';
import { TEMPLATES } from '../templates/index.js';
import { resetHistory } from '../history.js';
import { toast } from './toast.js';
import { escHtml } from '../utils.js';

// 公共模板注册表 — 首次发布时自动创建，Gist ID 缓存到 localStorage
var MARKET_FILENAME = 'rear-eye-templates.json';

function _getMarketGistId() {
  return localStorage.getItem('jcm-market-gist-id') || '';
}
function _setMarketGistId(id) {
  localStorage.setItem('jcm-market-gist-id', id);
}

// Fallback hardcoded templates
var LOCAL_TEMPLATES = [
  // ─── 时钟类 ───
  { id: 'ct_cyberpunk_clock', name: '赛博朋克时钟', author: 'REAREye', icon: '🌃', desc: '霓虹风格，深紫背景 + 荧光绿时间', likes: 256,
    template: { tplId: 'clock', cfg: { cardName: '赛博朋克时钟', bgColor: '#0d0221', timeColor: '#39ff14', dateColor: '#ff00ff', timeSize: 56, dateFormat: 'MM/dd EEEE', timeFormat: 'HH:mm' } } },
  { id: 'ct_ocean_clock', name: '海洋时钟', author: 'REAREye', icon: '🌊', desc: '海蓝色调 + 大号时间显示', likes: 198,
    template: { tplId: 'clock', cfg: { cardName: '海洋时钟', bgColor: '#0c2461', timeColor: '#48dbfb', dateColor: '#74b9ff', timeSize: 60, dateFormat: 'MM/dd EEEE', timeFormat: 'HH:mm' } } },
  { id: 'ct_neon_clock', name: '霓虹时钟', author: 'REAREye', icon: '💜', desc: '纯黑底 + 紫色霓虹光效', likes: 187,
    template: { tplId: 'clock', cfg: { cardName: '霓虹时钟', bgColor: '#000000', timeColor: '#a29bfe', dateColor: '#6c5ce7', timeSize: 64, dateFormat: 'yyyy/MM/dd EEEE', timeFormat: 'HH:mm' } } },
  { id: 'ct_minimal_clock', name: '极简时钟', author: 'REAREye', icon: '⬜', desc: '白底黑字，干净利落', likes: 175,
    template: { tplId: 'clock', cfg: { cardName: '极简时钟', bgColor: '#ffffff', timeColor: '#1a1a2e', dateColor: '#888888', timeSize: 64, dateFormat: 'MM-dd EEEE', timeFormat: 'HH:mm' } } },
  { id: 'ct_retro_clock', name: '复古时钟', author: 'REAREye', icon: '🕹️', desc: '绿色终端风格，老式计算机', likes: 142,
    template: { tplId: 'clock', cfg: { cardName: '复古时钟', bgColor: '#0a0a0a', timeColor: '#00ff41', dateColor: '#008f11', timeSize: 56, dateFormat: 'yyyy/MM/dd', timeFormat: 'HH:mm:ss' } } },
  { id: 'ct_warm_clock', name: '暖色时钟', author: 'REAREye', icon: '🔥', desc: '深棕底色 + 暖橙色时间', likes: 134,
    template: { tplId: 'clock', cfg: { cardName: '暖色时钟', bgColor: '#1a0f00', timeColor: '#fdcb6e', dateColor: '#e17055', timeSize: 60, dateFormat: 'MM/dd EEEE', timeFormat: 'HH:mm' } } },

  // ─── 名言类 ───
  { id: 'ct_aurora_quote', name: '极光名言', author: 'REAREye', icon: '✨', desc: '深蓝渐变 + 励志名言', likes: 201,
    template: { tplId: 'quote', cfg: { cardName: '极光名言', bgColor: '#0a1628', textColor: '#ffffff', authorColor: '#a29bfe', accentColor: '#6c5ce7', textSize: 22, text: '万物皆有裂痕\n那是光照进来的地方', author: '— Leonard Cohen' } } },
  { id: 'ct_sunset_quote', name: '日落名言', author: 'REAREye', icon: '🌅', desc: '温暖日落渐变 + 励志文字', likes: 189,
    template: { tplId: 'quote', cfg: { cardName: '日落名言', bgColor: '#e55039', textColor: '#ffffff', authorColor: '#ffeaa7', accentColor: '#f39c12', textSize: 24, text: '凡是过往\n皆为序章', author: '— 莎士比亚' } } },
  { id: 'ct_forest_quote', name: '森林名言', author: 'REAREye', icon: '🌲', desc: '深绿森林色调 + 自然名言', likes: 156,
    template: { tplId: 'quote', cfg: { cardName: '森林名言', bgColor: '#0a1a0a', textColor: '#badc58', authorColor: '#6ab04c', accentColor: '#4a7c23', textSize: 22, text: '山川异域\n风月同天', author: '— 古诗' } } },
  { id: 'ct_snow_quote', name: '雪夜名言', author: 'REAREye', icon: '❄️', desc: '冷白色调 + 冬日意境', likes: 148,
    template: { tplId: 'quote', cfg: { cardName: '雪夜名言', bgColor: '#1a1a2e', textColor: '#dfe6e9', authorColor: '#74b9ff', accentColor: '#0984e3', textSize: 20, text: '晚来天欲雪\n能饮一杯无', author: '— 白居易' } } },

  // ─── 渐变类 ───
  { id: 'ct_sunset_gradient', name: '日落渐变', author: 'REAREye', icon: '🌇', desc: '橙红渐变 + 励志文字', likes: 210,
    template: { tplId: 'gradient', cfg: { cardName: '日落渐变', bgColor1: '#e55039', bgColor2: '#f39c12', textColor: '#ffffff', textSize: 28, text: '每一天都是\n新的开始' } } },
  { id: 'ct_ocean_gradient', name: '深海渐变', author: 'REAREye', icon: '🌀', desc: '蓝紫深海渐变', likes: 178,
    template: { tplId: 'gradient', cfg: { cardName: '深海渐变', bgColor1: '#0c2461', bgColor2: '#6c5ce7', textColor: '#ffffff', textSize: 32, text: '深海\n宁静' } } },
  { id: 'ct_candy_gradient', name: '糖果渐变', author: 'REAREye', icon: '🍬', desc: '粉蓝渐变，甜美风格', likes: 165,
    template: { tplId: 'gradient', cfg: { cardName: '糖果渐变', bgColor1: '#ff9ff3', bgColor2: '#48dbfb', textColor: '#ffffff', textSize: 28, text: 'Sweet\nDay' } } },
  { id: 'ct_galaxy_gradient', name: '银河渐变', author: 'REAREye', icon: '🌌', desc: '紫黑银河深空渐变', likes: 192,
    template: { tplId: 'gradient', cfg: { cardName: '银河渐变', bgColor1: '#0d0221', bgColor2: '#3d157e', textColor: '#e2b0ff', textSize: 24, text: '星辰大海\n皆为征途' } } },

  // ─── 电池类 ───
  { id: 'ct_retro_battery', name: '复古电池', author: 'REAREye', icon: '🔋', desc: '复古游戏机风格', likes: 167,
    template: { tplId: 'battery', cfg: { cardName: '复古电池', bgColor: '#1a1a1a', textColor: '#00ff00', barColor: '#00ff41', demoLevel: 78 } } },
  { id: 'ct_flame_battery', name: '烈焰电池', author: 'REAREye', icon: '🔥', desc: '红色火焰风格电量显示', likes: 143,
    template: { tplId: 'battery', cfg: { cardName: '烈焰电池', bgColor: '#1a0500', textColor: '#ff6b6b', barColor: '#e17055', demoLevel: 65 } } },
  { id: 'ct_ice_battery', name: '冰霜电池', author: 'REAREye', icon: '🧊', desc: '蓝白色调冰晶风格', likes: 128,
    template: { tplId: 'battery', cfg: { cardName: '冰霜电池', bgColor: '#0a1628', textColor: '#74b9ff', barColor: '#48dbfb', demoLevel: 82 } } },

  // ─── 步数类 ───
  { id: 'ct_night_steps', name: '夜间步数', author: 'REAREye', icon: '🌙', desc: '深蓝夜间主题', likes: 155,
    template: { tplId: 'steps', cfg: { cardName: '夜间步数', bgColor: '#0a1628', textColor: '#e0e0e0', barColor: '#4ecdc4', accentColor: '#74b9ff', goal: '10000' } } },
  { id: 'ct_sport_steps', name: '运动步数', author: 'REAREye', icon: '🏃', desc: '活力红橙运动风格', likes: 139,
    template: { tplId: 'steps', cfg: { cardName: '运动步数', bgColor: '#1a0a00', textColor: '#ffffff', barColor: '#ff6b6b', accentColor: '#fdcb6e', goal: '8000' } } },
  { id: 'ct_nature_steps', name: '自然步数', author: 'REAREye', icon: '🌿', desc: '绿色自然风格', likes: 121,
    template: { tplId: 'steps', cfg: { cardName: '自然步数', bgColor: '#0a1a0a', textColor: '#badc58', barColor: '#6ab04c', accentColor: '#55efc4', goal: '10000' } } },

  // ─── 环形进度 ───
  { id: 'ct_golden_ring', name: '金色环形', author: 'REAREye', icon: '🏆', desc: '金色环形 + 暗色背景', likes: 176,
    template: { tplId: 'ring', cfg: { cardName: '金色环形', bgColor: '#0a0a0a', ringColor: '#f39c12', trackColor: '#2a2a2a', textColor: '#ffffff', labelColor: '#888888', ringSize: 8, demoValue: 72, source: 'battery', goal: '10000' } } },
  { id: 'ct_rainbow_ring', name: '彩虹环形', author: 'REAREye', icon: '🌈', desc: '多彩渐变环形进度', likes: 164,
    template: { tplId: 'ring', cfg: { cardName: '彩虹环形', bgColor: '#0a0a1a', ringColor: '#ff6b6b', trackColor: '#1a1a2e', textColor: '#ffffff', labelColor: '#a29bfe', ringSize: 10, demoValue: 85, source: 'step', goal: '10000' } } },
  { id: 'ct_emerald_ring', name: '翡翠环形', author: 'REAREye', icon: '💎', desc: '翠绿色环形 + 黑底', likes: 148,
    template: { tplId: 'ring', cfg: { cardName: '翡翠环形', bgColor: '#000000', ringColor: '#00b894', trackColor: '#1a1a1a', textColor: '#ffffff', labelColor: '#55efc4', ringSize: 8, demoValue: 68, source: 'step', goal: '10000' } } },

  // ─── 倒计时 ───
  { id: 'ct_newyear_countdown', name: '新年倒计时', author: 'REAREye', icon: '🎆', desc: '紫色星空 + 新年倒数', likes: 195,
    template: { tplId: 'countdown', cfg: { cardName: '新年倒计时', bgColor: '#1a0a2e', eventName: '距离新年', targetDate: '0101', accentColor: '#a29bfe', textColor: '#ffffff' } } },
  { id: 'ct_birthday_countdown', name: '生日倒计时', author: 'REAREye', icon: '🎂', desc: '粉色系生日倒数', likes: 158,
    template: { tplId: 'countdown', cfg: { cardName: '生日倒计时', bgColor: '#1a0a1a', eventName: '距离生日', targetDate: '0601', accentColor: '#fd79a8', textColor: '#ffffff' } } },
  { id: 'ct_vacation_countdown', name: '假期倒计时', author: 'REAREye', icon: '🏖️', desc: '蓝色海洋 + 假期倒数', likes: 172,
    template: { tplId: 'countdown', cfg: { cardName: '假期倒计时', bgColor: '#0a1628', eventName: '距离暑假', targetDate: '0701', accentColor: '#48dbfb', textColor: '#ffffff' } } },

  // ─── 日历 ───
  { id: 'ct_minimal_calendar', name: '极简日历', author: 'REAREye', icon: '📅', desc: '白底大字日期 + 日程', likes: 161,
    template: { tplId: 'calendar', cfg: { cardName: '极简日历', bgColor: '#ffffff', dayColor: '#1a1a2e', daySize: 72, accentColor: '#6c5ce7', textColor: '#888888', event1: '09:00 团队会议', event2: '14:30 代码评审', event3: '' } } },
  { id: 'ct_dark_calendar', name: '暗色日历', author: 'REAREye', icon: '🗓️', desc: '深色主题日历 + 日程', likes: 144,
    template: { tplId: 'calendar', cfg: { cardName: '暗色日历', bgColor: '#0f0f1a', dayColor: '#ffffff', daySize: 72, accentColor: '#6c5ce7', textColor: '#888888', event1: '10:00 站会', event2: '15:00 1v1', event3: '18:00 健身' } } },

  // ─── 仪表盘 ───
  { id: 'ct_sci_dashboard', name: '科幻仪表盘', author: 'REAREye', icon: '📊', desc: '蓝色科技风聚合面板', likes: 188,
    template: { tplId: 'dashboard', cfg: { cardName: '科幻仪表盘', bgColor: '#0a0e1a', timeColor: '#48dbfb', accentColor: '#0984e3', textColor: '#cccccc', dimColor: '#333355' } } },
  { id: 'ct_warm_dashboard', name: '暖色仪表盘', author: 'REAREye', icon: '🌅', desc: '暖橙色聚合信息面板', likes: 152,
    template: { tplId: 'dashboard', cfg: { cardName: '暖色仪表盘', bgColor: '#1a0f00', timeColor: '#fdcb6e', accentColor: '#e17055', textColor: '#f0c090', dimColor: '#886644' } } },

  // ─── 每日一句 ───
  { id: 'ct_poetry_daily', name: '诗词每日', author: 'REAREye', icon: '📜', desc: '7天循环古诗词', likes: 183,
    template: { tplId: 'dailyquote', cfg: { cardName: '诗词每日', bgColor: '#0a0a1a', quote1: '人生若只如初见\n何事秋风悲画扇', quote2: '大鹏一日同风起\n扶摇直上九万里', quote3: '长风破浪会有时\n直挂云帆济沧海', quote4: '天生我材必有用\n千金散尽还复来', quote5: '海内存知己\n天涯若比邻', quote6: '落霞与孤鹜齐飞\n秋水共长天一色', quote7: '但愿人长久\n千里共婵娟' } } },
  { id: 'ct_motivation_daily', name: '励志每日', author: 'REAREye', icon: '💪', desc: '7天循环励志语录', likes: 167,
    template: { tplId: 'dailyquote', cfg: { cardName: '励志每日', bgColor: '#0a0e1a', quote1: 'Stay hungry\nStay foolish', quote2: 'The only way to do great work\nis to love what you do', quote3: 'Innovation distinguishes\nbetween a leader\nand a follower', quote4: 'Your time is limited\ndon\'t waste it', quote5: 'Think different', quote6: 'Less is more', quote7: 'Just do it' } } },

  // ─── 双时钟 ───
  { id: 'ct_world_clock', name: '世界时钟', author: 'REAREye', icon: '🌍', desc: '北京 + 纽约双时区', likes: 155,
    template: { tplId: 'dualclock', cfg: { cardName: '世界时钟', bgColor: '#000000', city1: '北京', offset1: 8, timeColor1: '#ffffff', city2: '纽约', offset2: -5, timeColor2: '#6c5ce7', timeSize: 44 } } },
  { id: 'ct_work_clock', name: '工作时钟', author: 'REAREye', icon: '💼', desc: '本地 + 伦敦工作时间', likes: 138,
    template: { tplId: 'dualclock', cfg: { cardName: '工作时钟', bgColor: '#0a0a1a', city1: '上海', offset1: 8, timeColor1: '#48dbfb', city2: '伦敦', offset2: 0, timeColor2: '#fdcb6e', timeSize: 44 } } },
];

var _marketModal = null;
var _sortBy = 'likes';
var _remoteTemplates = null;
var _loading = false;

function _getGH() {
  try {
    var raw = localStorage.getItem('jcm-gh-token');
    if (!raw) return null;
    var decoded = '';
    var key = navigator.userAgent.length + '_' + screen.width + 'x' + screen.height;
    var bin = atob(raw);
    for (var i = 0; i < bin.length; i++) decoded += String.fromCharCode(bin.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    return decoded;
  } catch (e) { return null; }
}

function fetchRemoteTemplates() {
  if (_remoteTemplates) return Promise.resolve(_remoteTemplates);
  var gistId = _getMarketGistId();
  if (!gistId) return Promise.resolve(null);
  _loading = true;
  return fetch('https://api.github.com/gists/' + gistId)
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (gist) {
      _loading = false;
      if (!gist || !gist.files || !gist.files[MARKET_FILENAME]) return null;
      var data = JSON.parse(gist.files[MARKET_FILENAME].content);
      _remoteTemplates = Array.isArray(data) ? data : data.templates || [];
      return _remoteTemplates;
    })
    .catch(function () { _loading = false; return null; });
}

// ─── 发布模板到公共注册表 ─────────────────────────────────────
export function publishTemplate(name, desc, icon) {
  var token = _getGH();
  if (!token) return toast('❌ 请先设置 GitHub Token（设置→构建 APK）', 'error');
  if (!S.tpl) return toast('请先选择模板', 'error');

  var entry = {
    id: 'ct_' + Date.now(),
    name: name || S.cfg.cardName || S.tpl.name,
    author: 'user',
    icon: icon || S.tpl.icon,
    desc: desc || S.tpl.desc,
    likes: 0,
    template: {
      tplId: S.tpl.id,
      cfg: JSON.parse(JSON.stringify(S.cfg)),
    },
  };

  var p = toast('📤 正在发布...', 'info');
  var gistId = _getMarketGistId();
  var ghHeaders = {
    'Authorization': 'token ' + token,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };

  function _createAndPublish() {
    // 首次发布：创建公共 Gist
    return fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: ghHeaders,
      body: JSON.stringify({
        description: 'REAREye 模板市场注册表',
        public: true,
        files: { [MARKET_FILENAME]: { content: JSON.stringify([entry], null, 2) } },
      }),
    }).then(function (r) {
      if (r.status === 201) return r.json();
      throw new Error('HTTP ' + r.status);
    }).then(function (gist) {
      _setMarketGistId(gist.id);
      _remoteTemplates = [entry];
      p.close('✅ 已发布（首次创建注册表）！', 'success');
    });
  }

  function _appendAndPublish() {
    // 读取现有注册表 → 追加 → 更新
    return fetch('https://api.github.com/gists/' + gistId, { headers: ghHeaders })
      .then(function (r) {
        if (!r.ok) throw new Error('读取注册表失败 HTTP ' + r.status);
        return r.json();
      })
      .then(function (gist) {
        var list = [];
        if (gist && gist.files && gist.files[MARKET_FILENAME]) {
          try { list = JSON.parse(gist.files[MARKET_FILENAME].content); } catch (e) { list = []; }
        }
        if (!Array.isArray(list)) list = [];

        // 去重：同名模板只保留最新的
        list = list.filter(function (t) { return t.name !== entry.name; });
        list.push(entry);

        return fetch('https://api.github.com/gists/' + gistId, {
          method: 'PATCH',
          headers: ghHeaders,
          body: JSON.stringify({
            files: { [MARKET_FILENAME]: { content: JSON.stringify(list, null, 2) } },
          }),
        });
      })
      .then(function (r) {
        if (!r.ok) throw new Error('更新注册表失败 HTTP ' + r.status);
        _remoteTemplates = null; // 清缓存，下次打开市场会重新拉取
        p.close('✅ 已发布到模板市场！', 'success');
      });
  }

  // 如果有缓存的 Gist ID，先验证它是否还存在
  if (gistId) {
    fetch('https://api.github.com/gists/' + gistId, { headers: ghHeaders })
      .then(function (r) {
        if (r.ok) return _appendAndPublish();
        // Gist 不存在或无权访问，重新创建
        _setMarketGistId('');
        return _createAndPublish();
      })
      .catch(function (e) { p.close('❌ 发布失败: ' + e.message, 'error'); });
  } else {
    _createAndPublish()
      .catch(function (e) { p.close('❌ 发布失败: ' + e.message, 'error'); });
  }
}

export function importFromGist(gistId) {
  toast('📥 正在从 Gist 导入...', 'info');
  fetch('https://api.github.com/gists/' + gistId)
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (gist) {
      if (!gist) throw new Error('Gist 不存在');
      var files = gist.files;
      var content = null;
      for (var key in files) {
        if (key.endsWith('.json')) { content = JSON.parse(files[key].content); break; }
      }
      if (!content) throw new Error('未找到模板数据');
      // Handle both single template and array
      var tpl = Array.isArray(content) ? content[0] : content;
      if (tpl.template) tpl = tpl;
      else if (tpl.tplId) tpl = { template: tpl };
      else throw new Error('格式不正确');

      var targetTpl = TEMPLATES.find(function (t) { return t.id === (tpl.template.tplId || tpl.tplId); });
      if (!targetTpl) throw new Error('找不到对应模板');
      var cfg = tpl.template.cfg || tpl.cfg || {};
      S.setTpl(targetTpl);
      var newCfg = {};
      targetTpl.config.forEach(function (g) { g.fields.forEach(function (f) { newCfg[f.key] = cfg[f.key] !== undefined ? cfg[f.key] : f.default; }); });
      S.setCfg(newCfg);
      S.setElements([]);
      S.setUploadedFiles({});
      S.setSelIdx(-1);
      S.setDirty(true);
      resetHistory();
      toast('✅ 已导入: ' + (tpl.name || targetTpl.name), 'success');
    })
    .catch(function (e) { toast('❌ 导入失败: ' + e.message, 'error'); });
}

export function openMarketModal(stepCallbacks) {
  if (_marketModal) { _marketModal.remove(); _marketModal = null; }

  // Show loading state first
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = '';
  overlay.onclick = function () { closeMarketModal(); };

  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '640px';
  modal.style.maxHeight = '80vh';
  modal.onclick = function (e) { e.stopPropagation(); };

  modal.innerHTML = '<div class="modal-header"><h3>🏪 模板市场</h3><button class="modal-close" id="marketCloseBtn">✕</button></div>' +
    '<div class="modal-body" style="max-height:60vh;overflow-y:auto;text-align:center;padding:40px;color:var(--text3)">加载中...</div>';
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  _marketModal = overlay;
  overlay.querySelector('#marketCloseBtn').onclick = function () { closeMarketModal(); };

  // Fetch remote + render
  fetchRemoteTemplates().then(function (remote) {
    var all = LOCAL_TEMPLATES.slice();
    if (remote && Array.isArray(remote)) {
      remote.forEach(function (r) {
        if (!all.find(function (t) { return t.id === r.id; })) all.push(r);
      });
    }
    if (_sortBy === 'likes') all.sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); });
    else all.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });

    var remoteCount = remote ? remote.length : 0;

    var html = '<div class="modal-header">' +
      '<h3>🏪 模板市场 <span style="font-size:11px;color:var(--text3)">(' + all.length + '，含 ' + remoteCount + ' 个社区)</span></h3>' +
      '<div style="display:flex;gap:8px;align-items:center">' +
      '<button class="lang-switch" data-sort="likes"' + (_sortBy === 'likes' ? ' style="border-color:var(--accent);color:var(--accent)"' : '') + '>🔥 最热</button>' +
      '<button class="lang-switch" data-sort="name"' + (_sortBy === 'name' ? ' style="border-color:var(--accent);color:var(--accent)"' : '') + '>🔤 名称</button>' +
      '<button class="lang-switch" id="publishBtn" title="发布当前模板">📤 发布</button>' +
      '<button class="modal-close" id="marketCloseBtn" aria-label="关闭">✕</button>' +
      '</div></div>';

    html += '<div class="modal-body" style="max-height:60vh;overflow-y:auto">';
    html += '<div style="display:flex;flex-direction:column;gap:10px">';

    all.forEach(function (tpl) {
      html += '<div class="card-lib-item" style="cursor:pointer" data-market-import="' + tpl.id + '">' +
        '<div class="card-lib-icon" style="font-size:24px">' + (tpl.icon || '📱') + '</div>' +
        '<div class="card-lib-info">' +
        '<div class="card-lib-name">' + escHtml(tpl.name) + '</div>' +
        '<div class="card-lib-meta"><span>' + escHtml(tpl.desc || '') + '</span></div>' +
        '<div class="card-lib-meta" style="margin-top:4px">' +
        '<span>🔥 ' + (tpl.likes || 0) + '</span><span>·</span><span>by ' + escHtml(tpl.author || 'unknown') + '</span></div>' +
        '</div>' +
        '<div class="card-lib-actions"><button class="card-lib-btn" data-market-import="' + tpl.id + '" title="导入">📥</button></div>' +
        '</div>';
    });

    html += '</div></div>';

    modal.innerHTML = html;

    // Sort buttons
    modal.querySelectorAll('[data-sort]').forEach(function (btn) {
      btn.onclick = function () {
        _sortBy = btn.dataset.sort;
        openMarketModal(stepCallbacks);
      };
    });

    // Publish button
    var pubBtn = modal.querySelector('#publishBtn');
    if (pubBtn) {
      pubBtn.onclick = function () {
        if (!S.tpl) return toast('请先选择模板', 'error');
        var name = prompt('模板名称:', S.cfg.cardName || S.tpl.name);
        if (!name) return;
        var desc = prompt('描述:', S.tpl.desc);
        publishTemplate(name, desc, S.tpl.icon);
      };
    }

    // Import buttons
    modal.querySelectorAll('[data-market-import]').forEach(function (btn) {
      btn.onclick = function () {
        var tpl = all.find(function (t) { return t.id === btn.dataset.marketImport; });
        if (!tpl) return;
        var targetTpl = TEMPLATES.find(function (t) { return t.id === tpl.template.tplId; });
        if (!targetTpl) return toast('找不到对应模板', 'error');
        S.setTpl(targetTpl);
        var newCfg = {};
        targetTpl.config.forEach(function (g) { g.fields.forEach(function (f) { newCfg[f.key] = tpl.template.cfg[f.key] !== undefined ? tpl.template.cfg[f.key] : f.default; }); });
        S.setCfg(newCfg);
        S.setElements([]);
        S.setUploadedFiles({});
        S.setSelIdx(-1);
        S.setDirty(true);
        resetHistory();
        if (stepCallbacks) { stepCallbacks.renderTplGrid(); stepCallbacks.goStep(1); }
        closeMarketModal();
        toast('✅ 已导入: ' + tpl.name, 'success');
      };
    });

    modal.querySelector('#marketCloseBtn').onclick = function () { closeMarketModal(); };
  });
}

export function closeMarketModal() {
  if (_marketModal) { _marketModal.remove(); _marketModal = null; }
}
