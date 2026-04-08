// ─── Template Market: 模板市场（社区 + 预设方案）────────────────
import * as S from '../state.js';
import { TEMPLATES } from '../templates/index.js';
import { resetHistory } from '../history.js';
import { toast } from './toast.js';
import { escHtml } from '../utils.js';

var MARKET_FILENAME = 'rear-eye-templates.json';

function _getMarketGistId() {
  return localStorage.getItem('jcm-market-gist-id') || '';
}
function _setMarketGistId(id) {
  localStorage.setItem('jcm-market-gist-id', id);
}

// ─── 预设方案：基于 45 个模板自动生成配色变体 ─────────────────
// 每个方案 = { tplId, name, icon, desc, category, tags, cfg }
function _buildPresets() {
  var presets = [];

  function P(id, name, icon, desc, cat, tags, tplId, cfg) {
    presets.push({ id: id, name: name, icon: icon, desc: desc, category: cat, tags: tags, template: { tplId: tplId, cfg: cfg }, likes: Math.floor(Math.random() * 300) + 50, author: 'REAREye' });
  }

  // ── 时钟 ──
  P('pr_cyber_clock', '赛博朋克时钟', '🌃', '霓虹绿 + 深紫背景', 'clock', ['时钟','暗色','赛博'], 'clock', { cardName: '赛博朋克时钟', bgColor: '#0d0221', timeColor: '#39ff14', dateColor: '#ff00ff', accentColor: '#39ff14', timeSize: 64, timeFormat: 'HH:mm', dateFormat: 'MM/dd EEEE' });
  P('pr_ocean_clock', '海洋时钟', '🌊', '海蓝底 + 青色时间', 'clock', ['时钟','暗色','冷色'], 'clock', { cardName: '海洋时钟', bgColor: '#0c2461', timeColor: '#48dbfb', dateColor: '#74b9ff', accentColor: '#0984e3', timeSize: 60, timeFormat: 'HH:mm', dateFormat: 'MM/dd EEEE' });
  P('pr_neon_clock', '霓虹时钟', '💜', '纯黑底 + 紫色霓虹', 'clock', ['时钟','暗色','紫色'], 'clock', { cardName: '霓虹时钟', bgColor: '#000000', timeColor: '#a29bfe', dateColor: '#6c5ce7', accentColor: '#a29bfe', timeSize: 64, timeFormat: 'HH:mm', dateFormat: 'yyyy/MM/dd EEEE' });
  P('pr_white_clock', '极简时钟', '⬜', '白底黑字，干净利落', 'clock', ['时钟','亮色','极简'], 'clock', { cardName: '极简时钟', bgColor: '#ffffff', timeColor: '#1a1a2e', dateColor: '#888888', accentColor: '#6c5ce7', timeSize: 64, timeFormat: 'HH:mm', dateFormat: 'MM-dd EEEE' });
  P('pr_retro_clock', '复古终端', '🕹️', '绿色终端风格', 'clock', ['时钟','暗色','复古'], 'clock', { cardName: '复古终端', bgColor: '#0a0a0a', timeColor: '#00ff41', dateColor: '#008f11', accentColor: '#00ff41', timeSize: 56, timeFormat: 'HH:mm', dateFormat: 'yyyy/MM/dd' });
  P('pr_warm_clock', '暖色时钟', '🔥', '深棕底 + 暖橙色', 'clock', ['时钟','暗色','暖色'], 'clock', { cardName: '暖色时钟', bgColor: '#1a0f00', timeColor: '#fdcb6e', dateColor: '#e17055', accentColor: '#f39c12', timeSize: 60, timeFormat: 'HH:mm', dateFormat: 'MM/dd EEEE' });
  P('pr_sec_clock', '带秒时钟', '⏱️', '显示秒数的大时钟', 'clock', ['时钟','暗色','实用'], 'clock', { cardName: '带秒时钟', bgColor: '#0a0a1a', timeColor: '#ffffff', dateColor: '#555555', accentColor: '#ff6b6b', timeSize: 56, timeFormat: 'HH:mm', dateFormat: 'yyyy/MM/dd EEEE', showSeconds: 'true' });

  // ── 模拟时钟 ──
  P('pr_classic_analog', '经典模拟时钟', '🕐', '传统表盘风格', 'clock', ['模拟时钟','经典'], 'analog_clock', { cardName: '经典模拟时钟', bgColor: '#0a0a1a', faceColor: '#1a1a2e', ringColor: '#333355', hourColor: '#ffffff', minuteColor: '#6c5ce7', dotColor: '#ff6b6b', tickColor: '#555555', clockSize: 120 });
  P('pr_gold_analog', '金色模拟时钟', '🏆', '金色指针 + 黑底', 'clock', ['模拟时钟','暗色','奢华'], 'analog_clock', { cardName: '金色模拟时钟', bgColor: '#0a0a0a', faceColor: '#1a1a1a', ringColor: '#f39c12', hourColor: '#f39c12', minuteColor: '#fdcb6e', dotColor: '#e17055', tickColor: '#886600', clockSize: 130 });

  // ── 翻页时钟 ──
  P('pr_green_flip', '绿色翻页时钟', '🟢', '绿色 LED 风格', 'clock', ['翻页时钟','暗色'], 'flip_clock', { cardName: '绿色翻页时钟', bgColor: '#000000', digitColor: '#00ff41', cardBgColor: '#0a1a0a', sepColor: '#008f11', showSeconds: 'true' });
  P('pr_white_flip', '白色翻页时钟', '⬜', '白底黑字卡片', 'clock', ['翻页时钟','亮色'], 'flip_clock', { cardName: '白色翻页时钟', bgColor: '#f5f5f5', digitColor: '#1a1a2e', cardBgColor: '#ffffff', sepColor: '#6c5ce7', showSeconds: 'false' });

  // ── 像素时钟 ──
  P('pr_matrix_pixel', '矩阵像素时钟', '🟩', '黑客帝国绿色矩阵', 'clock', ['像素时钟','暗色','赛博'], 'pixel_clock', { cardName: '矩阵像素时钟', bgColor: '#000000', pixelOn: '#00ff41', pixelOff: '#0a1a0a', pixelSize: 6, colonColor: '#00ff41', dateColor: '#008f11' });
  P('pr_amber_pixel', '琥珀像素时钟', '🟧', '琥珀色复古终端', 'clock', ['像素时钟','暗色','复古'], 'pixel_clock', { cardName: '琥珀像素时钟', bgColor: '#0a0a00', pixelOn: '#ffaa00', pixelOff: '#1a1a00', pixelSize: 6, colonColor: '#ff8800', dateColor: '#886600' });

  // ── 名言 ──
  P('pr_aurora_quote', '极光名言', '✨', '深蓝 + 励志名言', 'quote', ['名言','暗色','励志'], 'quote', { cardName: '极光名言', bgColor: '#0a1628', textColor: '#ffffff', textSize: 22, author: '— Leonard Cohen', authorColor: '#a29bfe', text: '万物皆有裂痕\n那是光照进来的地方' });
  P('pr_sunset_quote', '日落名言', '🌅', '暖橙 + 古诗词', 'quote', ['名言','暖色','诗词'], 'quote', { cardName: '日落名言', bgColor: '#e55039', textColor: '#ffffff', textSize: 24, author: '— 莎士比亚', authorColor: '#ffeaa7', text: '凡是过往\n皆为序章' });
  P('pr_snow_quote', '雪夜名言', '❄️', '冷白 + 冬日意境', 'quote', ['名言','冷色','诗词'], 'quote', { cardName: '雪夜名言', bgColor: '#1a1a2e', textColor: '#dfe6e9', textSize: 20, author: '— 白居易', authorColor: '#74b9ff', text: '晚来天欲雪\n能饮一杯无' });

  // ── 每日一句 ──
  P('pr_poetry7', '七日诗词', '📜', '7天循环古诗词', 'quote', ['每日一句','诗词'], 'dailyquote', { cardName: '七日诗词', bgColor: '#0a0a1a', textColor: '#ffffff', textSize: 26, accentColor: '#f39c12', dayColor: '#555555', quote1: '人生若只如初见\n何事秋风悲画扇', quote2: '大鹏一日同风起\n扶摇直上九万里', quote3: '长风破浪会有时\n直挂云帆济沧海', quote4: '天生我材必有用\n千金散尽还复来', quote5: '海内存知己\n天涯若比邻', quote6: '落霞与孤鹜齐飞\n秋水共长天一色', quote7: '但愿人长久\n千里共婵娟' });
  P('pr_enquote7', '英文励志7日', '💪', '7天英文励志语录', 'quote', ['每日一句','英文','励志'], 'dailyquote', { cardName: '英文励志', bgColor: '#0a0e1a', textColor: '#ffffff', textSize: 22, accentColor: '#6c5ce7', dayColor: '#555555', quote1: 'Stay hungry\nStay foolish', quote2: 'Be the change\nyou wish to see', quote3: 'Dream big\nStart small\nAct now', quote4: 'Less is more', quote5: 'Think different', quote6: 'Just do it', quote7: 'Impossible is nothing' });

  // ── 渐变 ──
  P('pr_sunset_grad', '日落渐变', '🌇', '橙红渐变', 'gradient', ['渐变','暖色'], 'gradient', { cardName: '日落渐变', bgColor1: '#e55039', bgColor2: '#f39c12', textColor: '#ffffff', textSize: 28, text: '每一天都是\n新的开始' });
  P('pr_galaxy_grad', '银河渐变', '🌌', '紫黑深空渐变', 'gradient', ['渐变','暗色','紫色'], 'gradient', { cardName: '银河渐变', bgColor1: '#0d0221', bgColor2: '#3d157e', textColor: '#e2b0ff', textSize: 24, text: '星辰大海\n皆为征途' });
  P('pr_candy_grad', '糖果渐变', '🍬', '粉蓝甜美渐变', 'gradient', ['渐变','亮色','粉色'], 'gradient', { cardName: '糖果渐变', bgColor1: '#ff9ff3', bgColor2: '#48dbfb', textColor: '#ffffff', textSize: 28, text: 'Sweet\nDay' });
  P('pr_forest_grad', '森林渐变', '🌲', '深绿自然渐变', 'gradient', ['渐变','暗色','绿色'], 'gradient', { cardName: '森林渐变', bgColor1: '#0a1a0a', bgColor2: '#1a3a1a', textColor: '#badc58', textSize: 26, text: '山川异域\n风月同天' });

  // ── 电池 ──
  P('pr_neon_battery', '霓虹电池', '🔋', '绿色霓虹风格', 'battery', ['电池','暗色','赛博'], 'battery', { cardName: '霓虹电池', bgColor: '#0a0a0a', textColor: '#00ff41', barColor: '#00ff41', demoLevel: 78 });
  P('pr_flame_battery', '烈焰电池', '🔥', '红色火焰风格', 'battery', ['电池','暗色','暖色'], 'battery', { cardName: '烈焰电池', bgColor: '#1a0500', textColor: '#ff6b6b', barColor: '#e17055', demoLevel: 65 });
  P('pr_ice_battery', '冰霜电池', '🧊', '蓝白冰晶风格', 'battery', ['电池','暗色','冷色'], 'battery', { cardName: '冰霜电池', bgColor: '#0a1628', textColor: '#74b9ff', barColor: '#48dbfb', demoLevel: 82 });

  // ── 步数 ──
  P('pr_night_steps', '夜间步数', '🌙', '深蓝夜间主题', 'steps', ['步数','暗色'], 'steps', { cardName: '夜间步数', bgColor: '#0a1628', textColor: '#e0e0e0', barColor: '#4ecdc4', accentColor: '#74b9ff', goal: '10000' });
  P('pr_sport_steps', '运动步数', '🏃', '活力红橙运动风', 'steps', ['步数','暖色','运动'], 'steps', { cardName: '运动步数', bgColor: '#1a0a00', textColor: '#ffffff', barColor: '#ff6b6b', accentColor: '#fdcb6e', goal: '8000' });
  P('pr_nature_steps', '自然步数', '🌿', '绿色自然风格', 'steps', ['步数','绿色','自然'], 'steps', { cardName: '自然步数', bgColor: '#0a1a0a', textColor: '#badc58', barColor: '#6ab04c', accentColor: '#55efc4', goal: '10000' });

  // ── 环形进度 ──
  P('pr_gold_ring', '金色环形', '🏆', '金色环 + 暗底', 'ring', ['环形','暗色','奢华'], 'ring', { cardName: '金色环形', bgColor: '#0a0a0a', ringColor: '#f39c12', trackColor: '#2a2a2a', textColor: '#ffffff', labelColor: '#888888', ringSize: 8, source: 'battery', goal: '10000' });
  P('pr_rainbow_ring', '彩虹环形', '🌈', '多彩环形进度', 'ring', ['环形','暗色','彩色'], 'ring', { cardName: '彩虹环形', bgColor: '#0a0a1a', ringColor: '#ff6b6b', trackColor: '#1a1a2e', textColor: '#ffffff', labelColor: '#a29bfe', ringSize: 10, source: 'step', goal: '10000' });

  // ── 倒计时 ──
  P('pr_newyear_cd', '新年倒计时', '🎆', '紫色星空 + 新年', 'countdown', ['倒计时','节日'], 'countdown', { cardName: '新年倒计时', bgColor: '#1a0a2e', eventName: '距离新年', targetDate: '0101', accentColor: '#a29bfe', textColor: '#ffffff' });
  P('pr_birthday_cd', '生日倒计时', '🎂', '粉色系生日', 'countdown', ['倒计时','粉色'], 'countdown', { cardName: '生日倒计时', bgColor: '#1a0a1a', eventName: '距离生日', targetDate: '0601', accentColor: '#fd79a8', textColor: '#ffffff' });
  P('pr_vacation_cd', '假期倒计时', '🏖️', '海洋蓝 + 假期', 'countdown', ['倒计时','冷色'], 'countdown', { cardName: '假期倒计时', bgColor: '#0a1628', eventName: '距离暑假', targetDate: '0701', accentColor: '#48dbfb', textColor: '#ffffff' });

  // ── 日历 ──
  P('pr_white_cal', '极简日历', '📅', '白底大字', 'calendar', ['日历','亮色','极简'], 'calendar', { cardName: '极简日历', bgColor: '#ffffff', dayColor: '#1a1a2e', daySize: 72, accentColor: '#6c5ce7', textColor: '#888888', event1: '09:00 团队会议', event2: '14:30 代码评审', event3: '' });
  P('pr_dark_cal', '暗色日历', '🗓️', '深色主题日历', 'calendar', ['日历','暗色'], 'calendar', { cardName: '暗色日历', bgColor: '#0f0f1a', dayColor: '#ffffff', daySize: 72, accentColor: '#6c5ce7', textColor: '#888888', event1: '10:00 站会', event2: '15:00 1v1', event3: '18:00 健身' });

  // ── 仪表盘 ──
  P('pr_sci_dash', '科幻仪表盘', '📊', '蓝色科技风', 'dashboard', ['仪表盘','暗色','科技'], 'dashboard', { cardName: '科幻仪表盘', bgColor: '#0a0e1a', timeColor: '#48dbfb', accentColor: '#0984e3', textColor: '#cccccc', dimColor: '#333355' });
  P('pr_warm_dash', '暖色仪表盘', '🌅', '暖橙聚合面板', 'dashboard', ['仪表盘','暖色'], 'dashboard', { cardName: '暖色仪表盘', bgColor: '#1a0f00', timeColor: '#fdcb6e', accentColor: '#e17055', textColor: '#f0c090', dimColor: '#886644' });

  // ── 双时钟 ──
  P('pr_world_clk', '北京+纽约', '🌍', '双时区世界时钟', 'clock', ['双时钟','实用'], 'dualclock', { cardName: '世界时钟', bgColor: '#000000', city1: '北京', offset1: 8, timeColor1: '#ffffff', city2: '纽约', offset2: -5, timeColor2: '#6c5ce7', timeSize: 44, dateColor: '#666666', dividerColor: '#333333' });
  P('pr_work_clk', '上海+伦敦', '💼', '工作时区', 'clock', ['双时钟','工作'], 'dualclock', { cardName: '工作时钟', bgColor: '#0a0a1a', city1: '上海', offset1: 8, timeColor1: '#48dbfb', city2: '伦敦', offset2: 0, timeColor2: '#fdcb6e', timeSize: 44, dateColor: '#666666', dividerColor: '#222222' });

  // ── 呼吸灯 ──
  P('pr_aurora_breath', '极光呼吸', '🌊', '紫绿极光渐变', 'breathing', ['呼吸灯','动态'], 'breathing', { cardName: '极光呼吸', color1: '#6c5ce7', color2: '#00cec9', color3: '#00b894', text: '深呼吸', textColor: '#ffffff', textSize: 36, showText: 'true' });
  P('pr_sunset_breath', '日落呼吸', '🌅', '红橙日落呼吸', 'breathing', ['呼吸灯','暖色'], 'breathing', { cardName: '日落呼吸', color1: '#e17055', color2: '#f39c12', color3: '#fdcb6e', text: '', textColor: '#ffffff', textSize: 36, showText: 'false' });

  // ── 农历 ──
  P('pr_red_lunar', '红色农历', '🌙', '传统红金配色', 'lunar', ['农历','传统'], 'lunar', { cardName: '红色农历', bgColor: '#1a0a0a', solarColor: '#ffffff', lunarColor: '#e74c3c', termColor: '#f39c12', yiColor: '#00b894', jiColor: '#e74c3c', accentColor: '#e74c3c', lunarText: '二月十六', termText: '清明', yiText: '出行 签约 开业', jiText: '搬家 动土' });
  P('pr_elegant_lunar', '雅致农历', '🏮', '深蓝白字农历', 'lunar', ['农历','现代'], 'lunar', { cardName: '雅致农历', bgColor: '#0a1628', solarColor: '#ffffff', lunarColor: '#48dbfb', termColor: '#fdcb6e', yiColor: '#55efc4', jiColor: '#ff7675', accentColor: '#48dbfb', lunarText: '二月十六', termText: '清明', yiText: '出行 签约', jiText: '搬家 动土' });

  // ── 番茄钟 ──
  P('pr_classic_pomo', '经典番茄', '🍅', '红白经典番茄钟', 'pomodoro', ['番茄钟','专注'], 'pomodoro', { cardName: '经典番茄', bgColor: '#1a0a0a', timerColor: '#ffffff', workColor: '#e74c3c', breakColor: '#00b894', trackColor: '#333333', workMin: 25, breakMin: 5 });

  // ── 语录轮播 ──
  P('pr_poetry_carousel', '诗词轮播', '📜', '5条古诗词自动切换', 'quote_carousel', ['语录轮播','诗词'], 'quote_carousel', { cardName: '诗词轮播', bgColor: '#0a0a1a', textColor: '#ffffff', textSize: 24, authorColor: '#f39c12', showDots: 'true', interval: 8, quote1: '人生若只如初见\n何事秋风悲画扇', quote2: '大鹏一日同风起\n扶摇直上九万里', quote3: '长风破浪会有时\n直挂云帆济沧海', quote4: '海内存知己\n天涯若比邻', quote5: '但愿人长久\n千里共婵娟' });

  // ── 骰子 ──
  P('pr_neon_dice', '霓虹骰子', '🎲', '紫黑霓虹风格', 'dice', ['骰子','趣味'], 'dice', { cardName: '霓虹骰子', bgColor: '#1a1a2e', dotColor: '#a29bfe', faceColor: '#2d2d44', labelColor: '#888888', accentColor: '#6c5ce7' });

  // ── 翻页 ──
  P('pr_retro_flip', '复古翻页', '🔄', '绿底黑字复古', 'flip_clock', ['翻页时钟','复古'], 'flip_clock', { cardName: '复古翻页', bgColor: '#0a1a0a', digitColor: '#00ff41', cardBgColor: '#001a00', sepColor: '#008f11', showSeconds: 'true' });

  return presets;
}

var _presets = null;
function _getPresets() {
  if (!_presets) _presets = _buildPresets();
  return _presets;
}

var _marketModal = null;
var _sortBy = 'likes'; // 'likes' | 'name' | 'category'
var _filterCat = 'all';
var _remoteTemplates = null;

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
  return fetch('https://api.github.com/gists/' + gistId)
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (gist) {
      if (!gist || !gist.files || !gist.files[MARKET_FILENAME]) return null;
      try {
        var data = JSON.parse(gist.files[MARKET_FILENAME].content);
        _remoteTemplates = Array.isArray(data) ? data : data.templates || [];
        return _remoteTemplates;
      } catch (e) { return null; }
    })
    .catch(function () { return null; });
}

// ─── 分类定义 ───────────────────────────────────────────────
var MARKET_CATS = [
  { id: 'all', label: '🌐 全部' },
  { id: 'clock', label: '⏰ 时钟' },
  { id: 'quote', label: '💬 名言' },
  { id: 'battery', label: '🔋 电池' },
  { id: 'steps', label: '🏃 步数' },
  { id: 'gradient', label: '🌈 渐变' },
  { id: 'ring', label: '🎯 环形' },
  { id: 'countdown', label: '⏳ 倒计时' },
  { id: 'calendar', label: '📅 日历' },
  { id: 'dashboard', label: '📊 仪表盘' },
  { id: 'lunar', label: '🌙 农历' },
  { id: 'pomodoro', label: '🍅 番茄钟' },
  { id: 'breathing', label: '🌊 呼吸灯' },
  { id: 'quote_carousel', label: '📜 语录轮播' },
  { id: 'dice', label: '🎲 骰子' },
  { id: 'flip_clock', label: '🔄 翻页时钟' },
];

// ─── 发布模板 ───────────────────────────────────────────────
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
    category: S.tpl.id,
    template: { tplId: S.tpl.id, cfg: JSON.parse(JSON.stringify(S.cfg)) },
  };

  var p = toast('📤 正在发布...', 'info');
  var gistId = _getMarketGistId();
  var ghHeaders = {
    'Authorization': 'token ' + token,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };

  function _doPublish(list) {
    list = list.filter(function (t) { return t.name !== entry.name; });
    list.push(entry);
    var method = gistId ? 'PATCH' : 'POST';
    var url = gistId ? 'https://api.github.com/gists/' + gistId : 'https://api.github.com/gists';
    var body = gistId
      ? { files: { [MARKET_FILENAME]: { content: JSON.stringify(list, null, 2) } } }
      : { description: 'REAREye 模板市场', public: true, files: { [MARKET_FILENAME]: { content: JSON.stringify(list, null, 2) } } };

    return fetch(url, { method: method, headers: ghHeaders, body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (gist) {
        if (!gistId) _setMarketGistId(gist.id);
        _remoteTemplates = null;
        p.close('✅ 已发布！', 'success');
      });
  }

  if (gistId) {
    fetch('https://api.github.com/gists/' + gistId, { headers: ghHeaders })
      .then(function (r) {
        if (!r.ok) { _setMarketGistId(''); return _doPublish([entry]); }
        return r.json().then(function (gist) {
          var list = [];
          if (gist && gist.files && gist.files[MARKET_FILENAME]) {
            try { list = JSON.parse(gist.files[MARKET_FILENAME].content); } catch (e) { list = []; }
          }
          return _doPublish(Array.isArray(list) ? list : []);
        });
      })
      .catch(function (e) { p.close('❌ ' + e.message, 'error'); });
  } else {
    _doPublish([entry]).catch(function (e) { p.close('❌ ' + e.message, 'error'); });
  }
}

// ─── 导入模板 ───────────────────────────────────────────────
function _importTemplate(tpl, stepCallbacks) {
  var targetTpl = TEMPLATES.find(function (t) { return t.id === tpl.template.tplId; });
  if (!targetTpl) return toast('找不到对应模板: ' + tpl.template.tplId, 'error');

  S.setTpl(targetTpl);
  var newCfg = {};
  targetTpl.config.forEach(function (g) {
    g.fields.forEach(function (f) {
      newCfg[f.key] = tpl.template.cfg[f.key] !== undefined ? tpl.template.cfg[f.key] : f.default;
    });
  });
  S.setCfg(newCfg);
  S.setElements([]);
  S.setUploadedFiles({});
  S.setSelIdx(-1);
  S.setDirty(true);
  resetHistory();
  if (stepCallbacks) { stepCallbacks.renderTplGrid(); stepCallbacks.goStep(1); }
  closeMarketModal();
  toast('✅ 已导入: ' + tpl.name, 'success');
}

// ─── 主渲染 ─────────────────────────────────────────────────
export function openMarketModal(stepCallbacks) {
  if (_marketModal) { _marketModal.remove(); _marketModal = null; }

  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = '';
  overlay.onclick = function () { closeMarketModal(); };

  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '680px';
  modal.style.maxHeight = '85vh';
  modal.onclick = function (e) { e.stopPropagation(); };

  // Loading
  modal.innerHTML = '<div class="modal-header"><h3>🏪 模板市场</h3><button class="modal-close" id="mktClose">✕</button></div>' +
    '<div class="modal-body" style="max-height:70vh;overflow-y:auto;text-align:center;padding:40px;color:var(--text3)">加载中...</div>';
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  _marketModal = overlay;
  overlay.querySelector('#mktClose').onclick = closeMarketModal;

  // Fetch remote + render
  fetchRemoteTemplates().then(function (remote) {
    var all = _getPresets().slice();
    if (remote && Array.isArray(remote)) {
      remote.forEach(function (r) {
        if (!all.find(function (t) { return t.id === r.id; })) {
          r._remote = true;
          all.push(r);
        }
      });
    }

    // Filter
    var filtered = _filterCat === 'all' ? all : all.filter(function (t) { return t.category === _filterCat; });

    // Sort
    if (_sortBy === 'likes') filtered.sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); });
    else filtered.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });

    var presetCount = _getPresets().length;
    var remoteCount = remote ? remote.length : 0;

    // Build HTML
    var html = '<div class="modal-header">';
    html += '<h3>🏪 模板市场 <span style="font-size:11px;color:var(--text3)">' + presetCount + ' 预设';
    if (remoteCount) html += ' + ' + remoteCount + ' 社区';
    html += '</span></h3>';
    html += '<div style="display:flex;gap:6px;align-items:center">';
    html += '<button class="lang-switch" data-sort="likes"' + (_sortBy === 'likes' ? ' style="border-color:var(--accent);color:var(--accent)"' : '') + '>🔥</button>';
    html += '<button class="lang-switch" data-sort="name"' + (_sortBy === 'name' ? ' style="border-color:var(--accent);color:var(--accent)"' : '') + '>🔤</button>';
    html += '<button class="lang-switch" id="mktPublish" title="发布当前模板">📤</button>';
    html += '<button class="modal-close" id="mktClose" aria-label="关闭">✕</button>';
    html += '</div></div>';

    // Category tabs
    html += '<div style="display:flex;gap:4px;padding:8px 16px;overflow-x:auto;border-bottom:1px solid var(--border);flex-wrap:wrap">';
    MARKET_CATS.forEach(function (cat) {
      var active = _filterCat === cat.id;
      html += '<button data-mkt-cat="' + cat.id + '" style="padding:4px 10px;border-radius:12px;border:1px solid ' + (active ? 'var(--accent)' : 'var(--border)') + ';background:' + (active ? 'var(--accent)' : 'transparent') + ';color:' + (active ? '#fff' : 'var(--text3)') + ';font-size:11px;cursor:pointer;white-space:nowrap">' + cat.label + '</button>';
    });
    html += '</div>';

    // Template list
    html += '<div class="modal-body" style="max-height:55vh;overflow-y:auto;padding:8px 16px">';

    if (filtered.length === 0) {
      html += '<div style="text-align:center;padding:40px;color:var(--text3)">暂无该分类的模板</div>';
    } else {
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">';
      filtered.forEach(function (tpl) {
        var catInfo = MARKET_CATS.find(function (c) { return c.id === tpl.category; });
        var catLabel = catInfo ? catInfo.label : '📱';
        html += '<div data-mkt-import="' + tpl.id + '" style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:14px;cursor:pointer;transition:border-color .15s" onmouseenter="this.style.borderColor=\'var(--accent)\'" onmouseleave="this.style.borderColor=\'var(--border)\'">';
        html += '<div style="font-size:28px;margin-bottom:8px">' + (tpl.icon || '📱') + '</div>';
        html += '<div style="font-size:13px;font-weight:600;color:var(--text1);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(tpl.name) + '</div>';
        html += '<div style="font-size:11px;color:var(--text3);line-height:1.4;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + escHtml(tpl.desc || '') + '</div>';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;color:var(--text3)">';
        html += '<span>🔥 ' + (tpl.likes || 0) + '</span>';
        html += '<span>' + (tpl._remote ? '🌐 社区' : catLabel) + '</span>';
        html += '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
    modal.innerHTML = html;

    // Events: sort
    modal.querySelectorAll('[data-sort]').forEach(function (btn) {
      btn.onclick = function () { _sortBy = btn.dataset.sort; openMarketModal(stepCallbacks); };
    });

    // Events: category filter
    modal.querySelectorAll('[data-mkt-cat]').forEach(function (btn) {
      btn.onclick = function () { _filterCat = btn.dataset.mktCat; openMarketModal(stepCallbacks); };
    });

    // Events: publish
    var pubBtn = modal.querySelector('#mktPublish');
    if (pubBtn) {
      pubBtn.onclick = function () {
        if (!S.tpl) return toast('请先选择模板', 'error');
        var name = prompt('模板名称:', S.cfg.cardName || S.tpl.name);
        if (!name) return;
        var desc = prompt('描述:', S.tpl.desc);
        publishTemplate(name, desc, S.tpl.icon);
      };
    }

    // Events: import
    modal.querySelectorAll('[data-mkt-import]').forEach(function (el) {
      el.onclick = function () {
        var tpl = filtered.find(function (t) { return t.id === el.dataset.mktImport; });
        if (tpl) _importTemplate(tpl, stepCallbacks);
      };
    });

    modal.querySelector('#mktClose').onclick = closeMarketModal;
  });
}

export function closeMarketModal() {
  if (_marketModal) { _marketModal.remove(); _marketModal = null; }
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
      var tpl = Array.isArray(content) ? content[0] : content;
      if (!tpl.template && tpl.tplId) tpl = { template: tpl };
      _importTemplate(tpl, null);
    })
    .catch(function (e) { toast('❌ 导入失败: ' + e.message, 'error'); });
}
