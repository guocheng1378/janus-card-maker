// ─── Templates: 模板注册表 ────────────────────────────────────────
// 每个模板一个文件，新增模板只需在此 import + 加到数组

// ── 原有模板 ──
import clock from './clock.js';
import quote from './quote.js';
import battery from './battery.js';
import countdown from './countdown.js';
import gradient from './gradient.js';
import steps from './steps.js';
import calendar from './calendar.js';
import dualclock from './dualclock.js';
import dailyquote from './dailyquote.js';
import ring from './ring.js';
import dashboard from './dashboard.js';
import image from './image.js';
import custom from './custom.js';
import weather_real from './weather_real.js';
import music_real from './music_real.js';
import lyrics from './lyrics.js';
import video_wallpaper from './video_wallpaper.js';
import health from './health.js';
import schedule from './schedule.js';
import notification from './notification.js';
import carousel from './carousel.js';
import quick_settings from './quick_settings.js';

// ── 新增模板: 系统数据类 ──
import torch from './torch.js';
import screen_time from './screen_time.js';
import storage from './storage.js';
import signal from './signal.js';
import lunar from './lunar.js';

// ── 新增模板: 工具类 ──
import pomodoro from './pomodoro.js';
import water from './water.js';
import stopwatch from './stopwatch.js';
import analog_clock from './analog_clock.js';
import counter from './counter.js';

// ── 新增模板: 内容展示类 ──
import world_clock3 from './world_clock3.js';
import photo_calendar from './photo_calendar.js';
import quote_carousel from './quote_carousel.js';
import todo from './todo.js';
import multi_countdown from './multi_countdown.js';

// ── 新增模板: 联网类 ──
import hitokoto from './hitokoto.js';
import news from './news.js';
import exchange_rate from './exchange_rate.js';
import bilibili from './bilibili.js';

// ── 新增模板: 互动类 ──
import dice from './dice.js';
import flip_clock from './flip_clock.js';
import breathing from './breathing.js';
import pixel_clock from './pixel_clock.js';

export const TEMPLATES = [
  // 原有 22 个
  clock, quote, battery, countdown, gradient,
  steps, calendar, dualclock, dailyquote, ring, dashboard,
  image, custom, weather_real, music_real, lyrics, video_wallpaper,
  health, schedule, notification, carousel, quick_settings,
  // 新增 23 个
  analog_clock, lunar, pomodoro, water, stopwatch, counter,
  world_clock3, photo_calendar, quote_carousel, todo, multi_countdown,
  torch, screen_time, storage, signal,
  hitokoto, news, exchange_rate, bilibili,
  dice, flip_clock, breathing, pixel_clock,
];

export const TPL_CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'general', label: '🎨 通用' },
  { id: 'device', label: '📱 设备' },
  { id: 'tool', label: '🔧 工具' },
  { id: 'network', label: '🌐 联网' },
  { id: 'fun', label: '🎮 趣味' },
];

export const TPL_CATEGORY_MAP = {
  // 通用
  clock: 'general', quote: 'general', battery: 'general', countdown: 'general',
  gradient: 'general', steps: 'general',
  calendar: 'general', dualclock: 'general', dailyquote: 'general', ring: 'general', dashboard: 'general',
  image: 'general', custom: 'general', lyrics: 'general', video_wallpaper: 'general', carousel: 'general',
  analog_clock: 'general', photo_calendar: 'general', quote_carousel: 'general', pixel_clock: 'general', flip_clock: 'general',
  breathing: 'general', world_clock3: 'general', multi_countdown: 'general', lunar: 'general',
  // 设备绑定
  weather_real: 'device', music_real: 'device', health: 'device', schedule: 'device',
  notification: 'device', quick_settings: 'device', torch: 'device', screen_time: 'device',
  storage: 'device', signal: 'device', todo: 'device',
  // 工具
  pomodoro: 'tool', water: 'tool', stopwatch: 'tool', counter: 'tool',
  // 联网
  hitokoto: 'network', news: 'network', exchange_rate: 'network', bilibili: 'network',
  // 趣味
  dice: 'fun',
};
