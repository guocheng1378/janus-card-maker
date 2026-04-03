// ─── UI: 页面导航 + 配置渲染 + 状态管理 ──────────────────────────

// ─── State ────────────────────────────────────────────────────────
var _step = 0;
var _tpl = null;
var _cfg = {};
var _elements = [];
var _selIdx = -1;
var _dirty = true;
JCM.uploadedFiles = {};
var _pendingAdd = null;
var _pendingReplace = -1;

// ─── Step Navigation ──────────────────────────────────────────────
JCM.goStep = function (n) {
  if (n === 1 && !_tpl) return toast('请先选择一个模板', 'error');
  if (n === 2 && !_tpl) return toast('请先选择模板并配置', 'error');
  _step = n;

  document.querySelectorAll('.page').forEach(function (p, i) { p.classList.toggle('active', i === n); });
  document.querySelectorAll('.step-dot').forEach(function (d, i) {
    d.classList.remove('active', 'done');
    if (i === n) d.classList.add('active');
    else if (i < n) d.classList.add('done');
  });
  document.querySelectorAll('.step-line').forEach(function (l, i) { l.classList.toggle('done', i < n); });

  var btnBack = document.getElementById('btnBack');
  btnBack.style.display = n > 0 ? '' : 'none';

  var btnNext = document.getElementById('btnNext');
  if (n === 2) {
    btnNext.style.display = 'none';
  } else {
    btnNext.style.display = '';
    btnNext.innerHTML = n === 0 ? '下一步 <span class="btn-icon">→</span>' : '预览 & 导出 <span class="btn-icon">→</span>';
  }

  if (n === 1) renderConfig();
  if (n === 2 && _dirty) renderPreview();
};

JCM.nextStep = function () { JCM.goStep(_step + 1); };
JCM.prevStep = function () { JCM.goStep(_step - 1); };

// ─── Template Selection ───────────────────────────────────────────
JCM.selectTemplate = function (id) {
  var tpl = JCM.TEMPLATES.find(function (t) { return t.id === id; });
  if (!tpl) return;

  _tpl = tpl;
  _cfg = {};
  tpl.config.forEach(function (g) { g.fields.forEach(function (f) { _cfg[f.key] = f.default; }); });
  _elements = id === 'custom'
    ? [{ type: 'text', text: 'Hello Card', x: 10, y: 60, size: 28, color: '#ffffff', textAlign: 'left', bold: false, multiLine: false, w: 200 }]
    : [];
  _selIdx = -1;
  _dirty = true;
  JCM.uploadedFiles = {};

  renderTplGrid();
  JCM.goStep(1);
};

// ─── Template Grid ────────────────────────────────────────────────
function renderTplGrid() {
  var grid = document.getElementById('tplGrid');
  grid.innerHTML = JCM.TEMPLATES.map(function (t) {
    return '<div class="tpl-card' + (_tpl && _tpl.id === t.id ? ' active' : '') + '" data-tpl="' + t.id + '">' +
      '<span class="tpl-icon">' + t.icon + '</span>' +
      '<div class="tpl-card-name">' + t.name + '</div>' +
      '<div class="tpl-card-desc">' + t.desc + '</div></div>';
  }).join('');
}

// ─── Config Rendering ─────────────────────────────────────────────
function renderConfig() {
  if (!_tpl) return;
  var device = getSelectedDevice();

  document.getElementById('cfgIcon').textContent = _tpl.icon;
  document.getElementById('cfgTitle').textContent = _tpl.name;
  document.getElementById('cfgDesc').textContent = _tpl.desc;

  var html = '';

  // Config groups
  _tpl.config.forEach(function (group) {
    html += '<div class="config-section"><div class="config-section-title"><span>▸</span> ' + group.group + '</div><div class="config-grid">';
    group.fields.forEach(function (f) { html += renderField(f); });
    html += '</div></div>';
  });

  // Custom elements
  html += '<div class="config-section"><div class="config-section-title"><span>▸</span> 额外元素</div>' +
    '<div class="el-toolbar">' +
    '<button class="el-btn" data-add="text"><span class="el-btn-icon">T</span> 文字</button>' +
    '<button class="el-btn" data-add="rectangle"><span class="el-btn-icon">▢</span> 矩形</button>' +
    '<button class="el-btn" data-add="circle"><span class="el-btn-icon">○</span> 圆形</button>' +
    '<button class="el-btn" data-pick="image"><span class="el-btn-icon">🖼</span> 图片</button>' +
    '<button class="el-btn" data-pick="video"><span class="el-btn-icon">🎬</span> 视频</button>' +
    '</div><div class="el-list">';

  _elements.forEach(function (el, i) {
    var label = el.type === 'text' ? (el.text || '')
      : el.type === 'image' ? '🖼 ' + (el.fileName || '图片')
      : el.type === 'video' ? '🎬 ' + (el.fileName || '视频')
      : el.type + ' #' + (i + 1);
    var inCam = JCM.isInCameraZone(el, device);
    html += '<div class="el-item' + (_selIdx === i ? ' active' : '') + '" data-sel="' + i + '">' +
      '<span class="el-badge">' + el.type + '</span>' +
      '<span class="el-item-name">' + escH(label) + '</span>' +
      (inCam ? '<span title="在摄像头遮挡区内" style="color:#e17055;font-size:14px">⚠️</span>' : '') +
      '<button class="el-item-del" data-del="' + i + '">✕</button></div>';
  });

  if (_elements.length === 0) {
    html += '<div style="text-align:center;padding:20px;color:var(--text3);font-size:12px">点击上方按钮添加元素</div>';
  }
  html += '</div>';

  if (_selIdx >= 0 && _selIdx < _elements.length) {
    html += JCM.renderElementEditor(_elements[_selIdx], _selIdx, device);
  }
  html += '</div>';

  document.getElementById('cfgContent').innerHTML = html;

  // Restore color values
  document.querySelectorAll('.color-val').forEach(function (el) {
    var input = el.previousElementSibling;
    if (input) el.textContent = input.value;
  });
}

function renderField(f) {
  var v = _cfg[f.key];
  switch (f.type) {
    case 'text':
      return '<div class="field"><label>' + f.label + '</label><input type="text" value="' + escH(String(v)) + '" data-cfg="' + f.key + '"></div>';
    case 'textarea':
      return '<div class="field"><label>' + f.label + '</label><textarea rows="3" data-cfg="' + f.key + '">' + escH(String(v)) + '</textarea></div>';
    case 'color':
      return '<div class="field field-color"><label>' + f.label + '</label><input type="color" value="' + v + '" data-cfg="' + f.key + '"><span class="color-val">' + v + '</span></div>';
    case 'range':
      return '<div class="field"><label>' + f.label + ': <strong>' + v + '</strong></label><input type="range" min="' + f.min + '" max="' + f.max + '" value="' + v + '" data-cfg="' + f.key + '"></div>';
    case 'select':
      return '<div class="field"><label>' + f.label + '</label><select data-cfg="' + f.key + '">' +
        f.options.map(function (o) { return '<option value="' + o.v + '"' + (v === o.v ? ' selected' : '') + '>' + o.l + '</option>'; }).join('') +
        '</select></div>';
    default: return '';
  }
}

// ─── Config Actions ───────────────────────────────────────────────
JCM.addElement = function (type) {
  var defs = JCM.ElementDefaults;
  if (defs[type]) {
    _elements.push(JSON.parse(JSON.stringify(defs[type]())));
    _selIdx = _elements.length - 1;
    _dirty = true;
    renderConfig();
  }
};

JCM.selectElement = function (idx) {
  _selIdx = idx;
  renderConfig();
};

JCM.removeElement = function (idx) {
  var el = _elements[idx];
  if (el && el.fileName) {
    var stillUsed = _elements.some(function (e, i) { return i !== idx && e.fileName === el.fileName; });
    if (!stillUsed) delete JCM.uploadedFiles[el.fileName];
  }
  _elements.splice(idx, 1);
  if (_selIdx >= _elements.length) _selIdx = _elements.length - 1;
  _dirty = true;
  renderConfig();
};

JCM.pickMedia = function (type) {
  _pendingAdd = type;
  _pendingReplace = -1;
  document.getElementById(type === 'image' ? 'fileImagePick' : 'fileVideoPick').click();
};

JCM.pickMediaReplace = function (idx) {
  var el = _elements[idx];
  if (!el) return;
  _pendingAdd = el.type;
  _pendingReplace = idx;
  document.getElementById(el.type === 'image' ? 'fileImagePick' : 'fileVideoPick').click();
};

// ─── Preview ──────────────────────────────────────────────────────
function getSelectedDevice() {
  return JCM.getDevice(document.getElementById('deviceSelect').value);
}

function renderPreview() {
  if (!_tpl) return;
  var device = getSelectedDevice();
  var showCam = document.getElementById('showCamera').checked;

  document.getElementById('deviceLabel').textContent = device.label;
  document.getElementById('previewCamera').style.width = showCam ? '30%' : '0';

  var r = new JCM.PreviewRenderer(device, showCam);
  var html = '';
  switch (_tpl.id) {
    case 'clock':     html = r.renderClock(_cfg); break;
    case 'quote':     html = r.renderQuote(_cfg); break;
    case 'battery':   html = r.renderBattery(_cfg); break;
    case 'status':    html = r.renderStatus(_cfg); break;
    case 'countdown': html = r.renderCountdown(_cfg); break;
    case 'music':     html = r.renderMusic(_cfg); break;
    case 'gradient':  html = r.renderGradient(_cfg); break;
    case 'custom':    html = r.renderCustom(_cfg); break;
  }
  html += r.renderElements(_elements, JCM.uploadedFiles, _selIdx);
  document.getElementById('previewContent').innerHTML = html;

  // Generate MAML
  var innerXml = _tpl.gen ? _tpl.gen(_cfg) : generateCustomMAML(device);
  var maml = JCM.generateMAML({
    cardName: _cfg.cardName || _tpl.name,
    device: device,
    innerXml: innerXml,
    updater: _tpl.updater,
    extraElements: _elements,
    uploadedFiles: JCM.uploadedFiles,
  });
  document.getElementById('codeContent').textContent = maml;
  _dirty = false;
}

function generateCustomMAML(device) {
  var lines = [
    '  <Var name="marginL" type="number" expression="(#view_width * 0.30)" />',
    '  <Rectangle w="#view_width" h="#view_height" fillColor="' + _cfg.bgColor + '" />',
    '  <Group x="#marginL" y="0">',
  ];
  _elements.forEach(function (el) {
    switch (el.type) {
      case 'text': {
        var a = el.textAlign && el.textAlign !== 'left' ? ' textAlign="' + el.textAlign + '"' : '';
        var ml = el.multiLine ? ' multiLine="true"' : '';
        var w = el.multiLine || (el.textAlign && el.textAlign !== 'left') ? ' w="' + (el.w || 200) + '"' : '';
        var b = el.bold ? ' bold="true"' : '';
        lines.push('    <Text text="' + JCM.escXml(el.text || '') + '" x="' + el.x + '" y="' + el.y + '" size="' + el.size + '" color="' + el.color + '"' + w + a + ml + b + ' />');
        break;
      }
      case 'rectangle':
        lines.push('    <Rectangle x="' + el.x + '" y="' + el.y + '" w="' + el.w + '" h="' + el.h + '" fillColor="' + el.color + '"' + (el.radius ? ' cornerRadius="' + el.radius + '"' : '') + ' />');
        break;
      case 'circle':
        lines.push('    <Circle x="' + el.x + '" y="' + el.y + '" r="' + el.r + '" fillColor="' + el.color + '" />');
        break;
      case 'image': {
        var folder = el.src && JCM.uploadedFiles[el.src] && JCM.uploadedFiles[el.src].mimeType.indexOf('video/') === 0 ? 'videos' : 'images';
        lines.push('    <Image src="' + folder + '/' + (el.src || '') + '" x="' + el.x + '" y="' + el.y + '" w="' + (el.w || 100) + '" h="' + (el.h || 100) + '" />');
        break;
      }
      case 'video':
        lines.push('    <Video src="videos/' + (el.src || '') + '" x="' + el.x + '" y="' + el.y + '" w="' + (el.w || 240) + '" h="' + (el.h || 135) + '" autoPlay="true" loop="true" />');
        break;
    }
  });
  lines.push('  </Group>');
  return lines.join('\n');
}

// ─── Export ────────────────────────────────────────────────────────
JCM.handleExport = function () {
  if (!_tpl) return toast('请先选择模板', 'error');
  var device = getSelectedDevice();
  var innerXml = _tpl.gen ? _tpl.gen(_cfg) : generateCustomMAML(device);
  var maml = JCM.generateMAML({
    cardName: _cfg.cardName || _tpl.name,
    device: device,
    innerXml: innerXml,
    updater: _tpl.updater,
    extraElements: _elements,
    uploadedFiles: JCM.uploadedFiles,
  });

  JCM.exportZip(maml, _cfg.cardName || 'card', _elements, JCM.uploadedFiles, _tpl.id === 'custom')
    .then(function () { toast('✅ ZIP 已导出', 'success'); })
    .catch(function (e) { toast('导出失败: ' + e.message, 'error'); });
};

// ─── File Handling ────────────────────────────────────────────────
function handleFilePicked(e) {
  var input = e.target;
  var file = input.files && input.files[0];
  if (!file) return;

  var type = _pendingAdd;
  var replaceIdx = _pendingReplace;
  _pendingAdd = null;
  _pendingReplace = -1;

  var ext = file.name.split('.').pop() || (type === 'image' ? 'png' : 'mp4');
  var safeName = 'media_' + Date.now() + '.' + ext;

  var reader = new FileReader();
  reader.onload = function (ev) {
    var dataUrl = ev.target.result;
    var base64 = dataUrl.split(',')[1];
    var bin = atob(base64);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);

    JCM.uploadedFiles[safeName] = { data: arr.buffer, mimeType: file.type, dataUrl: dataUrl, originalName: file.name };

    if (replaceIdx >= 0 && replaceIdx < _elements.length) {
      _elements[replaceIdx].fileName = safeName;
      _elements[replaceIdx].src = safeName;
    } else {
      _elements.push({ type: type, fileName: safeName, src: safeName, x: 10, y: 60, w: type === 'image' ? 200 : 240, h: type === 'image' ? 200 : 135 });
      _selIdx = _elements.length - 1;
    }

    _dirty = true;
    renderConfig();
    toast(file.name + ' 已添加', 'success');
  };
  reader.readAsDataURL(file);
}

// ─── Event Delegation ─────────────────────────────────────────────
function setupEvents() {
  // Template grid clicks
  document.getElementById('tplGrid').addEventListener('click', function (e) {
    var card = e.target.closest('.tpl-card');
    if (card) JCM.selectTemplate(card.dataset.tpl);
  });

  // Config content delegation
  document.getElementById('cfgContent').addEventListener('input', function (e) {
    var t = e.target;

    // Config field
    if (t.dataset.cfg) {
      var key = t.dataset.cfg;
      if (t.type === 'range') {
        _cfg[key] = Number(t.value);
        t.previousElementSibling.querySelector('strong').textContent = t.value;
      } else if (t.type === 'color') {
        _cfg[key] = t.value;
        var cv = t.nextElementSibling;
        if (cv && cv.classList.contains('color-val')) cv.textContent = t.value;
      } else {
        _cfg[key] = t.value;
      }
      _dirty = true;
    }

    // Element prop
    if (t.dataset.prop) {
      var idx = Number(t.dataset.idx);
      var prop = t.dataset.prop;
      if (t.type === 'number') _elements[idx][prop] = Number(t.value);
      else if (t.type === 'color') {
        _elements[idx][prop] = t.value;
        var cv2 = t.nextElementSibling;
        if (cv2 && cv2.classList.contains('color-val')) cv2.textContent = t.value;
      }
      else _elements[idx][prop] = t.value;
      _dirty = true;
    }
  });

  document.getElementById('cfgContent').addEventListener('change', function (e) {
    var t = e.target;

    // Config field
    if (t.dataset.cfg && t.tagName === 'SELECT') {
      _cfg[t.dataset.cfg] = t.value;
      _dirty = true;
    }

    // Element prop
    if (t.dataset.prop && t.tagName === 'SELECT') {
      var idx = Number(t.dataset.idx);
      var val = t.value;
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      _elements[idx][t.dataset.prop] = val;
      _dirty = true;
      renderConfig();
    }
  });

  document.getElementById('cfgContent').addEventListener('click', function (e) {
    // Element select
    var item = e.target.closest('.el-item');
    if (item && !e.target.closest('.el-item-del')) {
      JCM.selectElement(Number(item.dataset.sel));
      return;
    }
    // Element delete
    var del = e.target.closest('.el-item-del');
    if (del) {
      e.stopPropagation();
      JCM.removeElement(Number(del.dataset.del));
      return;
    }
    // Add element
    var addBtn = e.target.closest('[data-add]');
    if (addBtn) {
      JCM.addElement(addBtn.dataset.add);
      return;
    }
    // Pick media
    var pickBtn = e.target.closest('[data-pick]');
    if (pickBtn) {
      JCM.pickMedia(pickBtn.dataset.pick);
    }
  });

  // File inputs
  document.getElementById('fileImagePick').addEventListener('change', handleFilePicked);
  document.getElementById('fileVideoPick').addEventListener('change', handleFilePicked);
}

// ─── Toast ────────────────────────────────────────────────────────
function toast(msg, type) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast ' + (type || 'success');
  requestAnimationFrame(function () { el.classList.add('show'); });
  setTimeout(function () { el.classList.remove('show'); }, 2500);
}

function escH(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ─── Init ─────────────────────────────────────────────────────────
JCM.initUI = function () {
  renderTplGrid();
  setupEvents();
};
