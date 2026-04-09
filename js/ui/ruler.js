// ─── Ruler: 标尺 + 实时坐标显示 + 十字准线 ──────────────────────
import * as S from '../state.js';
import { getDevice } from '../devices.js';

var _enabled = true;
var _tooltipEl = null;
var _hLine = null;
var _vLine = null;
var _rulerH = null;
var _rulerV = null;

// ── Create DOM elements ──
function ensureElements(screen) {
  if (!_tooltipEl || !screen.contains(_tooltipEl)) {
    // Tooltip
    _tooltipEl = document.createElement('div');
    _tooltipEl.className = 'ruler-tooltip';
    _tooltipEl.innerHTML = '<span class="ruler-coord-x"></span> <span class="ruler-coord-sep">,</span> <span class="ruler-coord-y"></span>';
    screen.appendChild(_tooltipEl);

    // Crosshair lines
    _hLine = document.createElement('div');
    _hLine.className = 'ruler-crosshair ruler-crosshair-h';
    screen.appendChild(_hLine);

    _vLine = document.createElement('div');
    _vLine.className = 'ruler-crosshair ruler-crosshair-v';
    screen.appendChild(_vLine);

    // Ruler bars
    _rulerH = document.createElement('canvas');
    _rulerH.className = 'ruler-bar ruler-bar-h';
    screen.appendChild(_rulerH);

    _rulerV = document.createElement('canvas');
    _rulerV.className = 'ruler-bar ruler-bar-v';
    screen.appendChild(_rulerV);
  }
}

// ── Draw ruler marks ──
function drawRulerH(canvas, width, scale, offsetX) {
  canvas.width = width;
  canvas.height = 18;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, 18);

  var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  ctx.fillStyle = isDark ? 'rgba(15,15,25,0.85)' : 'rgba(245,247,250,0.9)';
  ctx.fillRect(0, 0, width, 18);

  var tickColor = isDark ? '#5e5e78' : '#9098a8';
  var labelColor = isDark ? '#9090ac' : '#5a6072';
  ctx.strokeStyle = tickColor;
  ctx.fillStyle = labelColor;
  ctx.font = '9px -apple-system, sans-serif';
  ctx.textAlign = 'center';

  // Determine step based on scale
  var step = 50;
  if (scale > 2) step = 10;
  else if (scale > 1) step = 20;

  var startPx = Math.floor(-offsetX / scale / step) * step;
  var endPx = Math.ceil((width / scale - offsetX / scale) / step) * step;

  for (var px = startPx; px <= endPx; px += step) {
    var screenX = (px * scale) + offsetX;
    if (screenX < 0 || screenX > width) continue;

    var isMajor = px % 100 === 0;
    ctx.beginPath();
    ctx.moveTo(Math.round(screenX) + 0.5, isMajor ? 8 : 13);
    ctx.lineTo(Math.round(screenX) + 0.5, 18);
    ctx.lineWidth = 1;
    ctx.stroke();

    if (isMajor && px >= 0) {
      ctx.fillText(String(px), Math.round(screenX), 8);
    }
  }

  // Bottom border
  ctx.strokeStyle = isDark ? 'rgba(94,94,120,0.4)' : 'rgba(144,152,168,0.4)';
  ctx.beginPath();
  ctx.moveTo(0, 17.5);
  ctx.lineTo(width, 17.5);
  ctx.stroke();
}

function drawRulerV(canvas, height, scale, offsetY) {
  canvas.width = 18;
  canvas.height = height;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 18, height);

  var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  ctx.fillStyle = isDark ? 'rgba(15,15,25,0.85)' : 'rgba(245,247,250,0.9)';
  ctx.fillRect(0, 0, 18, height);

  var tickColor = isDark ? '#5e5e78' : '#9098a8';
  var labelColor = isDark ? '#9090ac' : '#5a6072';
  ctx.strokeStyle = tickColor;
  ctx.fillStyle = labelColor;
  ctx.font = '9px -apple-system, sans-serif';
  ctx.textAlign = 'center';

  var step = 50;
  if (scale > 2) step = 10;
  else if (scale > 1) step = 20;

  var startPx = Math.floor(-offsetY / scale / step) * step;
  var endPx = Math.ceil((height / scale - offsetY / scale) / step) * step;

  for (var px = startPx; px <= endPx; px += step) {
    var screenY = (px * scale) + offsetY;
    if (screenY < 0 || screenY > height) continue;

    var isMajor = px % 100 === 0;
    ctx.beginPath();
    ctx.moveTo(isMajor ? 8 : 13, Math.round(screenY) + 0.5);
    ctx.lineTo(18, Math.round(screenY) + 0.5);
    ctx.lineWidth = 1;
    ctx.stroke();

    if (isMajor && px >= 0) {
      ctx.save();
      ctx.translate(7, Math.round(screenY));
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(String(px), 0, 0);
      ctx.restore();
    }
  }

  // Right border
  ctx.strokeStyle = isDark ? 'rgba(94,94,120,0.4)' : 'rgba(144,152,168,0.4)';
  ctx.beginPath();
  ctx.moveTo(17.5, 0);
  ctx.lineTo(17.5, height);
  ctx.stroke();
}

// ── Get screen container + scale ──
function getScreenInfo() {
  var cfgPage = document.getElementById('page1');
  var isCfgActive = cfgPage && cfgPage.classList.contains('active');
  var selId = isCfgActive ? 'cfgDeviceSelect' : 'deviceSelect';
  var device = getDevice(document.getElementById(selId).value);

  var screen;
  if (isCfgActive) {
    screen = document.querySelector('.config-live-right .preview-screen');
  } else {
    screen = document.querySelector('#page2 .preview-screen');
  }

  if (!screen) return null;
  var rect = screen.getBoundingClientRect();
  return {
    screen: screen,
    device: device,
    rect: rect,
    scale: rect.width / device.width,
  };
}

// ── Mouse move handler ──
function onMouseMove(e) {
  if (!_enabled) return;
  var info = getScreenInfo();
  if (!info) return;

  ensureElements(info.screen);

  var relX = (e.clientX - info.rect.left) / info.scale;
  var relY = (e.clientY - info.rect.top) / info.scale;

  // Update tooltip
  var cx = Math.round(relX);
  var cy = Math.round(relY);
  if (cx >= 0 && cx <= info.device.width && cy >= 0 && cy <= info.device.height) {
    _tooltipEl.style.display = '';
    _tooltipEl.querySelector('.ruler-coord-x').textContent = cx;
    _tooltipEl.querySelector('.ruler-coord-y').textContent = cy;

    // Position tooltip near cursor but keep in bounds
    var tx = (e.clientX - info.rect.left) + 16;
    var ty = (e.clientY - info.rect.top) - 8;
    if (tx + 80 > info.rect.width) tx -= 96;
    if (ty < 0) ty = (e.clientY - info.rect.top) + 16;
    _tooltipEl.style.left = tx + 'px';
    _tooltipEl.style.top = ty + 'px';

    // Crosshair
    _hLine.style.display = '';
    _hLine.style.top = (e.clientY - info.rect.top) + 'px';
    _vLine.style.display = '';
    _vLine.style.left = (e.clientX - info.rect.left) + 'px';

    // Rulers
    _rulerH.style.display = '';
    _rulerV.style.display = '';
    drawRulerH(_rulerH, info.rect.width, info.scale, 0);
    drawRulerV(_rulerV, info.rect.height, info.scale, 0);
  } else {
    hideAll();
  }
}

function onMouseLeave() {
  hideAll();
}

function hideAll() {
  if (_tooltipEl) _tooltipEl.style.display = 'none';
  if (_hLine) _hLine.style.display = 'none';
  if (_vLine) _vLine.style.display = 'none';
  if (_rulerH) _rulerH.style.display = 'none';
  if (_rulerV) _rulerV.style.display = 'none';
}

// ── Init ──
export function initRuler() {
  var containers = [
    document.getElementById('previewContent'),
    document.getElementById('cfgPreviewContent'),
  ];

  containers.forEach(function (el) {
    if (!el) return;
    var screen = el.closest('.preview-screen');
    if (!screen) return;

    screen.addEventListener('mousemove', onMouseMove);
    screen.addEventListener('mouseleave', onMouseLeave);
  });
}

export function toggleRuler() {
  _enabled = !_enabled;
  if (!_enabled) hideAll();
  return _enabled;
}

export function isRulerEnabled() {
  return _enabled;
}
