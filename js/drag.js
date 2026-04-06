// ─── Drag & Drop: 预览区拖拽 + 缩放 + 智能对齐 ───────────────────

var _dragging = null;
var _resizing = null;
var _rafPending = false;

function getPointerPos(e) {
  if (e.touches && e.touches.length > 0) {
    return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
  }
  return { clientX: e.clientX, clientY: e.clientY };
}

function onPreviewPointerDown(e) {
  var target = e.target;

  // Resize handle
  var rh = target.closest('[data-resize-idx]');
  if (rh) {
    var idx = parseInt(rh.dataset.resizeIdx, 10);
    if (!isNaN(idx) && idx < _elements.length) {
      e.preventDefault();
      e.stopPropagation();
      var pos = getPointerPos(e);
      var device = getSelectedDevice();
      var screen = document.querySelector('.preview-screen');
      var rect = screen.getBoundingClientRect();
      var scale = rect.width / device.width;
      _resizing = {
        idx: idx,
        startX: pos.clientX,
        startY: pos.clientY,
        origW: _elements[idx].w || 100,
        origH: _elements[idx].h || 100,
        scale: scale
      };
      captureState();
      document.addEventListener('mousemove', onResizeMove);
      document.addEventListener('mouseup', onResizeUp);
      document.addEventListener('touchmove', onResizeMove, { passive: false });
      document.addEventListener('touchend', onResizeUp);
      return;
    }
  }

  // Element drag
  var el = target.closest('[data-el-idx]');
  if (!el) return;
  var idx = parseInt(el.dataset.elIdx, 10);
  if (isNaN(idx) || idx >= _elements.length) return;
  if (_elements[idx].locked) return;

  e.preventDefault();
  var pos = getPointerPos(e);
  var device = getSelectedDevice();
  var screen = document.querySelector('.preview-screen');
  var rect = screen.getBoundingClientRect();
  var scale = rect.width / device.width;

  // Alt+拖拽 = 复制元素
  if (e.altKey) {
    captureState('复制并拖拽');
    var clone = JSON.parse(JSON.stringify(_elements[idx]));
    clone.x += 10;
    clone.y += 10;
    // 重新生成 blob URL（不会被 JSON 序列化）
    _elements.push(clone);
    idx = _elements.length - 1;
    _selIdx = idx;
    _dirty = true;
    renderConfig();
  }

  _dragging = {
    idx: idx,
    startX: pos.clientX,
    startY: pos.clientY,
    origX: _elements[idx].x,
    origY: _elements[idx].y,
    scale: scale,
    device: device
  };

  captureState();
  _selIdx = idx;
  _dirty = true;
  renderConfig();

  document.addEventListener('mousemove', onPreviewMouseMove);
  document.addEventListener('mouseup', onPreviewMouseUp);
  document.addEventListener('touchmove', onPreviewMouseMove, { passive: false });
  document.addEventListener('touchend', onPreviewMouseUp);
}

function onResizeMove(e) {
  if (!_resizing) return;
  e.preventDefault();
  var pos = getPointerPos(e);
  var dx = (pos.clientX - _resizing.startX) / _resizing.scale;
  var dy = (pos.clientY - _resizing.startY) / _resizing.scale;
  var nw = Math.max(20, Math.round(_resizing.origW + dx));
  var nh = Math.max(20, Math.round(_resizing.origH + dy));

  var snap = document.getElementById('snapToggle');
  if (snap && snap.checked) {
    nw = Math.round(nw / SNAP_GRID) * SNAP_GRID;
    nh = Math.round(nh / SNAP_GRID) * SNAP_GRID;
  }

  _elements[_resizing.idx].w = nw;
  _elements[_resizing.idx].h = nh;
  renderPreview();
  var wInput = document.querySelector('[data-prop="w"][data-idx="' + _resizing.idx + '"]');
  var hInput = document.querySelector('[data-prop="h"][data-idx="' + _resizing.idx + '"]');
  if (wInput) wInput.value = nw;
  if (hInput) hInput.value = nh;
}

function onResizeUp() {
  _resizing = null;
  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeUp);
  document.removeEventListener('touchmove', onResizeMove);
  document.removeEventListener('touchend', onResizeUp);
  renderConfig();
}

function applySmartAlign(nx, ny) {
  var el = _elements[_dragging.idx];
  var elW = el.w || (el.r ? el.r * 2 : 0) || 50;
  var elH = el.h || (el.r ? el.r * 2 : 0) || 30;
  var elCX = nx + elW / 2;
  var elCY = ny + elH / 2;
  var snapThreshold = 6;
  var device = _dragging.device;
  var guides = [];

  // 画布中心对齐
  if (Math.abs(elCX - device.width / 2) < snapThreshold) {
    nx = Math.round(device.width / 2 - elW / 2);
    guides.push({ type: 'v', pos: device.width / 2 });
  }
  if (Math.abs(elCY - device.height / 2) < snapThreshold) {
    ny = Math.round(device.height / 2 - elH / 2);
    guides.push({ type: 'h', pos: device.height / 2 });
  }

  // 与其他元素对齐
  for (var i = 0; i < _elements.length; i++) {
    if (i === _dragging.idx) continue;
    var other = _elements[i];
    var oW = other.w || (other.r ? other.r * 2 : 0) || 50;
    var oH = other.h || (other.r ? other.r * 2 : 0) || 30;
    var oCX = other.x + oW / 2;
    var oCY = other.y + oH / 2;

    if (Math.abs(nx - other.x) < snapThreshold) { nx = other.x; guides.push({ type: 'v', pos: other.x }); }
    if (Math.abs(nx + elW - (other.x + oW)) < snapThreshold) { nx = other.x + oW - elW; guides.push({ type: 'v', pos: other.x + oW }); }
    if (Math.abs(elCX - oCX) < snapThreshold) { nx = Math.round(oCX - elW / 2); guides.push({ type: 'v', pos: oCX }); }
    if (Math.abs(ny - other.y) < snapThreshold) { ny = other.y; guides.push({ type: 'h', pos: other.y }); }
    if (Math.abs(ny + elH - (other.y + oH)) < snapThreshold) { ny = other.y + oH - elH; guides.push({ type: 'h', pos: other.y + oH }); }
    if (Math.abs(elCY - oCY) < snapThreshold) { ny = Math.round(oCY - elH / 2); guides.push({ type: 'h', pos: oCY }); }
  }
  return { x: nx, y: ny, guides: guides };
}

function onPreviewMouseMove(e) {
  if (!_dragging || _rafPending) return;
  e.preventDefault();
  _rafPending = true;
  requestAnimationFrame(function () {
    _rafPending = false;
    if (!_dragging) return;
    var pos = getPointerPos(e);
    var dx = (pos.clientX - _dragging.startX) / _dragging.scale;
    var dy = (pos.clientY - _dragging.startY) / _dragging.scale;

    var nx = Math.round(_dragging.origX + dx);
    var ny = Math.round(_dragging.origY + dy);

    var snap = document.getElementById('snapToggle');
    if (snap && snap.checked) {
      nx = Math.round(nx / SNAP_GRID) * SNAP_GRID;
      ny = Math.round(ny / SNAP_GRID) * SNAP_GRID;
    }

    var aligned = applySmartAlign(nx, ny);
    _elements[_dragging.idx].x = Math.max(0, Math.min(aligned.x, _dragging.device.width - 10));
    _elements[_dragging.idx].y = Math.max(0, Math.min(aligned.y, _dragging.device.height - 10));
    renderPreview();
    renderGuideLines(aligned.guides || [], _dragging.scale);
  });
}

function renderGuideLines(guides, scale) {
  var screen = document.querySelector('.preview-screen');
  if (!screen) return;
  screen.querySelectorAll('.align-guide').forEach(function (g) { g.remove(); });
  guides.forEach(function (g) {
    var div = document.createElement('div');
    div.className = 'align-guide ' + (g.type === 'h' ? 'align-guide-h' : 'align-guide-v');
    if (g.type === 'h') div.style.top = (g.pos * scale) + 'px';
    else div.style.left = (g.pos * scale) + 'px';
    screen.appendChild(div);
  });
}

function clearGuideLines() {
  document.querySelectorAll('.align-guide').forEach(function (g) { g.remove(); });
}

function onPreviewMouseUp() {
  _dragging = null;
  clearGuideLines();
  document.removeEventListener('mousemove', onPreviewMouseMove);
  document.removeEventListener('mouseup', onPreviewMouseUp);
  document.removeEventListener('touchmove', onPreviewMouseMove);
  document.removeEventListener('touchend', onPreviewMouseUp);
}
