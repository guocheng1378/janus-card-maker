// ─── Export: ZIP 打包 / 导入 / PNG / SVG 导出 (ES Module) ────────
import * as S from './state.js';

export function exportZip(maml, cardName, elements, files, isCustom, bgImage) {
  if (typeof JSZip === 'undefined') throw new Error('JSZip 未加载');

  var zip = new JSZip();
  zip.file('manifest.xml', maml);

  if (!isCustom) {
    var varConfig = '<?xml version="1.0" encoding="UTF-8"?>\n<WidgetConfig version="1">\n' +
      '  <OnOff name="isDisplayDefaultBg" displayTitle="显示默认背景" default="0"/>\n';

    if (maml.indexOf('ContentProviderBinder') >= 0) {
      varConfig += '  <!-- ContentProvider 变量由系统自动绑定 -->\n';
      var varMatches = maml.match(/name="(\w+)"\s+type="(\w+)"\s+column="(\w+)"/g);
      if (varMatches) {
        varMatches.forEach(function (vm) {
          var nameM = vm.match(/name="(\w+)"/);
          if (nameM) varConfig += '  <!-- Variable: ' + nameM[1] + ' -->\n';
        });
      }
    }

    if (maml.indexOf('MusicControl') >= 0) {
      varConfig += '  <!-- MusicControl: 由系统音乐播放器自动提供数据 -->\n';
    }

    varConfig += '</WidgetConfig>';
    zip.file('var_config.xml', varConfig);
  }

  var usedFiles = {};
  collectUsedFiles(elements, files, usedFiles);

  // 背景图
  if (bgImage && bgImage.indexOf('data:') === 0) {
    try {
      var b64data = bgImage.split(',')[1];
      var mimeMatch = bgImage.match(/^data:([^;]+);/);
      var mime = mimeMatch ? mimeMatch[1] : 'image/png';
      var ext = mime.split('/')[1] || 'png';
      if (ext === 'jpeg') ext = 'jpg';
      var bgFileName = 'bg.' + ext;
      var binStr = atob(b64data);
      var bgArr = new Uint8Array(binStr.length);
      for (var bi = 0; bi < binStr.length; bi++) bgArr[bi] = binStr.charCodeAt(bi);
      usedFiles[bgFileName] = { data: bgArr.buffer, mimeType: mime };
    } catch (e) { /* skip */ }
  }

  var keys = Object.keys(usedFiles);

  function buildZipWithData() {
    if (keys.length > 0) {
      var imgFolder = zip.folder('images');
      var vidFolder = zip.folder('videos');
      keys.forEach(function (fname) {
        var info = usedFiles[fname];
        var data = info.data;
        if (info.mimeType.indexOf('video/') === 0) {
          vidFolder.file(fname, data);
        } else {
          imgFolder.file(fname, data);
        }
      });
    }

    var fileName = (cardName || 'card') + '.zip';

    return zip.generateAsync({ type: 'blob' }).then(function (blob) {
      if (typeof AndroidBridge !== 'undefined' && typeof AndroidBridge.saveZip === 'function') {
        var reader = new FileReader();
        reader.onload = function () {
          AndroidBridge.saveZip(reader.result.split(',')[1], fileName);
        };
        reader.readAsDataURL(blob);
        return;
      }
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.style.display = 'none';
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 10000);
    });
  }

  return buildZipWithData();
}

// ─── Import ZIP ────────────────────────────────────────────────────
var MAX_ZIP_SIZE = 200 * 1024 * 1024;
var MAX_FILE_SIZE = 50 * 1024 * 1024;

export function importZip(file) {
  if (typeof JSZip === 'undefined') throw new Error('JSZip 未加载');

  if (file.size > MAX_ZIP_SIZE) {
    return Promise.reject(new Error('ZIP 文件过大（最大 200MB），当前 ' + (file.size / 1048576).toFixed(1) + 'MB'));
  }

  return JSZip.loadAsync(file).then(function (zip) {
    var result = { cardName: '导入的卡片', bgColor: '#000000', elements: [], files: {} };

    // 解压总大小检查（使用公开 API）
    var totalSize = 0;
    var sizePromises = [];
    zip.forEach(function (path, entry) {
      if (!entry.dir) {
        sizePromises.push(entry.async('uint8array').then(function (data) {
          totalSize += data.length;
        }));
      }
    });

    return Promise.all(sizePromises).then(function () {
      if (totalSize > MAX_ZIP_SIZE * 3) {
        return Promise.reject(new Error('ZIP 解压后内容过大，可能存在 zip bomb 攻击'));
      }

      // Read manifest
      var manifestFile = zip.file('manifest.xml');
      if (!manifestFile) throw new Error('ZIP 中没有 manifest.xml');

      return manifestFile.async('string').then(function (xml) {
        // Extract card name
        var nameMatch = xml.match(/name="([^"]*)"/);
        if (nameMatch) result.cardName = nameMatch[1];

        // Extract background color
        var bgMatch = xml.match(/fillColor="(#[0-9a-fA-F]{6})"/);
        if (bgMatch) result.bgColor = bgMatch[1];

        // Parse elements from XML using DOMParser
        try {
          var parser = new DOMParser();
          var doc = parser.parseFromString(xml, 'application/xml');
          var parseError = doc.querySelector('parsererror');
          if (!parseError) {
            // DOM parsing succeeded - recursively parse node list
            function parseMamlNode(node) {
              var tag = node.tagName.toLowerCase();
              var a = function (name) { return node.getAttribute(name) || ''; };
              if (tag === 'text') {
                return {
                  type: 'text', text: a('text'), x: Number(a('x')) || 0, y: Number(a('y')) || 0,
                  size: Number(a('size')) || 24, color: a('color') || '#ffffff',
                  textAlign: a('textAlign') || 'left', bold: a('bold') === 'true',
                  multiLine: a('multiLine') === 'true', w: Number(a('w')) || 200,
                  opacity: a('alpha') ? Math.round(parseFloat(a('alpha')) * 100) : 100,
                  rotation: Number(a('rotation')) || 0,
                  fontFamily: a('fontFamily') || 'default',
                };
              } else if (tag === 'rectangle') {
                return {
                  type: 'rectangle', x: Number(a('x')) || 0, y: Number(a('y')) || 0,
                  w: Number(a('w')) || 100, h: Number(a('h')) || 40,
                  color: a('fillColor') || '#333333', radius: Number(a('cornerRadius')) || 0,
                  opacity: a('alpha') ? Math.round(parseFloat(a('alpha')) * 100) : 100,
                  rotation: Number(a('rotation')) || 0,
                  fillColor2: a('fillColor2') || '',
                  blur: Number(a('blur')) || 0,
                };
              } else if (tag === 'circle') {
                return {
                  type: 'circle', x: Number(a('x')) || 0, y: Number(a('y')) || 0,
                  r: Number(a('r')) || 30, color: a('fillColor') || '#6c5ce7',
                  opacity: a('alpha') ? Math.round(parseFloat(a('alpha')) * 100) : 100,
                  strokeWidth: Number(a('stroke')) || 0,
                  strokeColor: a('strokeColor') || '#ffffff',
                };
              } else if (tag === 'image') {
                var imgSrc = (a('src') || '').replace(/^images\//, '');
                return {
                  type: 'image', x: Number(a('x')) || 0, y: Number(a('y')) || 0,
                  w: Number(a('w')) || 100, h: Number(a('h')) || 100,
                  fileName: imgSrc, src: imgSrc,
                  fit: a('fitMode') || 'cover',
                };
              } else if (tag === 'video') {
                var vidSrc = (a('src') || '').replace(/^videos\//, '');
                return {
                  type: 'video', x: Number(a('x')) || 0, y: Number(a('y')) || 0,
                  w: Number(a('w')) || 240, h: Number(a('h')) || 135,
                  fileName: vidSrc, src: vidSrc,
                };
              } else if (tag === 'lottie') {
                return {
                  type: 'lottie', x: Number(a('x')) || 50, y: Number(a('y')) || 50,
                  w: Number(a('w')) || 120, h: Number(a('h')) || 120,
                  src: a('src') || '', name: a('name') || '',
                  align: a('align') || 'center',
                  loop: Number(a('loop')) || 0,
                  autoplay: a('autoplay') !== 'false',
                };
              } else if (tag === 'group') {
                var children = [];
                for (var ci = 0; ci < node.childNodes.length; ci++) {
                  var child = node.childNodes[ci];
                  if (child.nodeType === 1 && child.tagName) {
                    var parsed = parseMamlNode(child);
                    if (parsed) children.push(parsed);
                  }
                }
                return {
                  type: 'group', x: Number(a('x')) || 0, y: Number(a('y')) || 0,
                  w: Number(a('w')) || 200, h: Number(a('h')) || 200,
                  name: a('name') || '',
                  alpha: a('alpha') ? Number(a('alpha')) : 1,
                  visibility: a('visibility') || '',
                  folmeMode: a('folmeMode') === 'true',
                  align: a('align') || '',
                  alignV: a('alignV') || '',
                  children: children,
                };
              } else if (tag === 'layer') {
                var layerChildren = [];
                for (var li = 0; li < node.childNodes.length; li++) {
                  var lchild = node.childNodes[li];
                  if (lchild.nodeType === 1 && lchild.tagName) {
                    var lparsed = parseMamlNode(lchild);
                    if (lparsed) layerChildren.push(lparsed);
                  }
                }
                return {
                  type: 'layer', name: a('name') || '',
                  alpha: a('alpha') ? Number(a('alpha')) : 1,
                  visibility: a('visibility') || '',
                  layerType: a('layerType') || 'bottom',
                  blurRadius: Number(a('blurRadius')) || 0,
                  blurColors: a('blurColors') || '',
                  colorModes: Number(a('colorModes')) || 0,
                  frameRate: Number(a('frameRate')) || -1,
                  children: layerChildren,
                };
              } else if (tag === 'musiccontrol') {
                var mcChildren = [];
                for (var mi = 0; mi < node.childNodes.length; mi++) {
                  var mchild = node.childNodes[mi];
                  if (mchild.nodeType === 1 && mchild.tagName) {
                    var mparsed = parseMamlNode(mchild);
                    if (mparsed) mcChildren.push(mparsed);
                  }
                }
                return {
                  type: 'musiccontrol', name: a('name') || 'music_control',
                  w: Number(a('w')) || 0, h: Number(a('h')) || 0,
                  x: Number(a('x')) || 0, y: Number(a('y')) || 0,
                  autoShow: a('autoShow') !== 'false',
                  autoRefresh: a('autoRefresh') !== 'false',
                  enableLyric: a('enableLyric') === 'true',
                  updateLyricInterval: Number(a('updateLyricInterval')) || 100,
                  children: mcChildren,
                };
              }
              return null; // Unknown tag (framework tags, etc.)
            }

            var allNodes = doc.querySelectorAll('Text, Rectangle, Circle, Image, Video, Lottie, Group, Layer, MusicControl');
            allNodes.forEach(function (node) {
              // Skip nested nodes (children of Group/Layer are handled recursively)
              if (node.parentElement && ['Group', 'Layer', 'MusicControl'].indexOf(node.parentElement.tagName) >= 0) return;
              // Skip nodes inside Widget > Group (the marginL wrapper)
              if (node.parentElement && node.parentElement.tagName === 'Group' && node.parentElement.parentElement && node.parentElement.parentElement.tagName === 'Widget') {
                // This is inside a top-level Group, which is fine - parse it
              }
              var parsed = parseMamlNode(node);
              if (parsed) result.elements.push(parsed);
            });
          } else {
            // Fallback to regex parsing
            parseXmlFallback(xml, result);
          }
        } catch (e) {
          // DOMParser failed, fallback to regex
          parseXmlFallback(xml, result);
        }

        // 背景图检测
        var bgImgMatch = xml.match(/<Image\s+src="([^"]*)"[^>]*x="0"[^>]*y="0"[^>]*w="#view_width"[^>]*h="#view_height"[^>]*\/?>/i) ||
                          xml.match(/<Image\s+[^>]*x="0"[^>]*y="0"[^>]*w="#view_width"[^>]*h="#view_height"[^>]*src="([^"]*)"[^>]*\/?>/i);
        if (bgImgMatch) {
          result.bgImageSrc = bgImgMatch[1];
        }

        // Load media files
        var promises = [];
        zip.forEach(function (path, entry) {
          if (path === 'manifest.xml' || path === 'var_config.xml') return;
          if (path.match(/^(images|videos)\//) && !entry.dir) {
            promises.push(entry.async('arraybuffer').then(function (buf) {
              if (buf.byteLength > MAX_FILE_SIZE) {
                console.warn('跳过过大文件: ' + path);
                return;
              }
              var fname = path.replace(/^(images|videos)\//, '');
              var ext = fname.split('.').pop().toLowerCase();
              var isVideo = ['mp4', 'webm', '3gp', 'mkv', 'mov', 'avi', 'ts', 'flv'].indexOf(ext) >= 0;
              var mime = isVideo ? 'video/' + ext : 'image/' + (ext === 'jpg' ? 'jpeg' : ext);
              var bytes = new Uint8Array(buf);
              var binary = '';
              for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
              result.files[fname] = {
                data: buf, mimeType: mime,
                dataUrl: 'data:' + mime + ';base64,' + btoa(binary),
                originalName: fname
              };
            }));
          }
        });

        return Promise.all(promises).then(function () {
          if (result.bgImageSrc) {
            var bgSrc = result.bgImageSrc;
            var bgFile = bgSrc.replace(/^(images|videos)\//, '');
            if (result.files[bgFile]) {
              result.bgImage = result.files[bgFile].dataUrl;
            } else if (bgSrc.indexOf('http') === 0 || bgSrc.indexOf('data:') === 0) {
              result.bgImage = bgSrc;
            }
          }
          return result;
        });
      });
    });
  });
}

// Fallback regex XML parsing (for malformed XML)
function parseXmlFallback(xml, result) {
  var elRegex = /<(Text|Rectangle|Circle|Image|Video)\s+([^/]*)\/?>(?:<\/\1>)?/g;
  var match;
  while ((match = elRegex.exec(xml)) !== null) {
    var tag = match[1].toLowerCase();
    var attrs = parseXmlAttrs(match[2]);
    if (tag === 'text') {
      result.elements.push({
        type: 'text', text: attrs.text || '', x: Number(attrs.x) || 0, y: Number(attrs.y) || 0,
        size: Number(attrs.size) || 24, color: attrs.color || '#ffffff',
        textAlign: attrs.textAlign || 'left', bold: attrs.bold === 'true',
        multiLine: attrs.multiLine === 'true', w: Number(attrs.w) || 200
      });
    } else if (tag === 'rectangle') {
      result.elements.push({
        type: 'rectangle', x: Number(attrs.x) || 0, y: Number(attrs.y) || 0,
        w: Number(attrs.w) || 100, h: Number(attrs.h) || 40,
        color: attrs.fillColor || '#333333', radius: Number(attrs.cornerRadius) || 0
      });
    } else if (tag === 'circle') {
      result.elements.push({
        type: 'circle', x: Number(attrs.x) || 0, y: Number(attrs.y) || 0,
        r: Number(attrs.r) || 30, color: attrs.fillColor || '#6c5ce7'
      });
    } else if (tag === 'image') {
      var imgSrc = (attrs.src || '').replace(/^images\//, '');
      result.elements.push({
        type: 'image', x: Number(attrs.x) || 0, y: Number(attrs.y) || 0,
        w: Number(attrs.w) || 100, h: Number(attrs.h) || 100,
        fileName: imgSrc, src: imgSrc
      });
    } else if (tag === 'video') {
      var vidSrc = (attrs.src || '').replace(/^videos\//, '');
      result.elements.push({
        type: 'video', x: Number(attrs.x) || 0, y: Number(attrs.y) || 0,
        w: Number(attrs.w) || 240, h: Number(attrs.h) || 135,
        fileName: vidSrc, src: vidSrc
      });
    }
  }
}

function parseXmlAttrs(str) {
  var attrs = {};
  var re = /(\w+)="([^"]*)"/g;
  var m;
  while ((m = re.exec(str)) !== null) attrs[m[1]] = m[2];
  return attrs;
}

// ─── Export PNG ────────────────────────────────────────────────────
export function exportPNG(cardName, cfg, elements, tpl, uploadedFiles, getDeviceFn) {
  var el = document.querySelector('.preview-screen');
  if (!el) return Promise.reject(new Error('预览区域不存在'));

  var device = getDeviceFn ? getDeviceFn() : { width: 420, height: 252 };
  var scale = 2;
  var canvas = document.createElement('canvas');
  canvas.width = device.width * scale;
  canvas.height = device.height * scale;
  var ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  var bgColor = cfg.bgColor || '#000000';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, device.width, device.height);

  var bgImgPromise = Promise.resolve();
  if (cfg.bgImage) {
    bgImgPromise = new Promise(function (resolve) {
      var bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.onload = function () {
        ctx.drawImage(bgImg, 0, 0, device.width, device.height);
        resolve();
      };
      bgImg.onerror = function () { resolve(); };
      bgImg.src = cfg.bgImage;
    });
  }

  return bgImgPromise.then(function () {
    if (tpl && tpl.id === 'custom') {
      var pat = cfg.bgPattern || 'solid';
      if (pat === 'dots') {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        for (var dx = 10; dx < device.width; dx += 20) {
          for (var dy = 10; dy < device.height; dy += 20) {
            ctx.beginPath(); ctx.arc(dx, dy, 1, 0, Math.PI * 2); ctx.fill();
          }
        }
      } else if (pat === 'grid') {
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 0.5;
        for (var gx = 0; gx < device.width; gx += 20) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, device.height); ctx.stroke(); }
        for (var gy = 0; gy < device.height; gy += 20) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(device.width, gy); ctx.stroke(); }
      } else if (pat === 'gradient') {
        var grd = ctx.createLinearGradient(0, 0, device.width, device.height);
        grd.addColorStop(0, bgColor);
        grd.addColorStop(1, cfg.bgColor2 || '#1a1a2e');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, device.width, device.height);
      }
    }

    if (tpl && tpl.id === 'gradient') {
      ctx.fillStyle = cfg.bgColor1 || '#667eea';
      ctx.fillRect(0, 0, device.width / 2, device.height);
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = cfg.bgColor2 || '#764ba2';
      ctx.fillRect(device.width / 2, 0, device.width / 2, device.height);
      ctx.globalAlpha = 1;
    }

    var imageLoaders = [];
    // 展平嵌套元素（Group/Layer/MusicControl 子元素）
    var flatElements = flattenElements(elements);
    if (flatElements.length > 0) {
      flatElements.forEach(function (el) {
        if (el.type !== 'image') return;
        var fi = el.fileName ? uploadedFiles[el.fileName] : null;
        if (!fi || !fi.dataUrl) return;
        imageLoaders.push(new Promise(function (resolve) {
          var img = new Image();
          img.onload = function () { resolve({ el: el, img: img }); };
          img.onerror = function () { resolve(null); };
          img.src = fi.dataUrl;
        }));
      });
    }

    return Promise.all(imageLoaders).then(function (loadedImages) {
      var imgMap = {};
      loadedImages.forEach(function (item) {
        if (item) imgMap[item.el.fileName] = item.img;
      });

      if (flatElements.length > 0) {
        flatElements.forEach(function (el) {
          ctx.save();
          var opacity = (el.opacity !== undefined ? el.opacity : 100) / 100;
          ctx.globalAlpha = opacity;

          switch (el.type) {
            case 'text':
              var weight = el.bold ? '700' : '400';
              ctx.font = weight + ' ' + el.size + 'px -apple-system, sans-serif';
              ctx.fillStyle = el.color || '#ffffff';
              if (el.shadow === 'light') { ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1; }
              else if (el.shadow === 'dark') { ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2; }
              else if (el.shadow === 'glow') { ctx.shadowColor = el.color; ctx.shadowBlur = 16; }
              if (el.multiLine) {
                var textLines = String(el.text || '').split('\n');
                textLines.forEach(function (line, li) { ctx.fillText(line, el.x, el.y + el.size + li * el.size * 1.4, el.w || 9999); });
              } else {
                var align = el.textAlign || 'left';
                if (align === 'center') { ctx.textAlign = 'center'; ctx.fillText(el.text || '', el.x + (el.w || 200) / 2, el.y + el.size); }
                else if (align === 'right') { ctx.textAlign = 'right'; ctx.fillText(el.text || '', el.x + (el.w || 200), el.y + el.size); }
                else { ctx.fillText(el.text || '', el.x, el.y + el.size); }
              }
              ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
              break;
            case 'rectangle':
              var rr = el.radius || 0;
              if (el.fillColor2) {
                var grd2 = ctx.createLinearGradient(el.x, el.y, el.x + el.w, el.y + el.h);
                grd2.addColorStop(0, el.color || '#333333');
                grd2.addColorStop(1, el.fillColor2);
                ctx.fillStyle = grd2;
              } else {
                ctx.fillStyle = el.color || '#333333';
              }
              drawRoundRect(ctx, el.x, el.y, el.w, el.h, rr);
              ctx.fill();
              break;
            case 'circle':
              ctx.fillStyle = el.color || '#6c5ce7';
              ctx.beginPath(); ctx.arc(el.x, el.y, el.r || 30, 0, Math.PI * 2); ctx.fill();
              if (el.strokeWidth > 0) {
                ctx.strokeStyle = el.strokeColor || '#ffffff';
                ctx.lineWidth = el.strokeWidth;
                ctx.stroke();
              }
              break;
            case 'image':
              var loadedImg = imgMap[el.fileName];
              if (loadedImg) ctx.drawImage(loadedImg, el.x, el.y, el.w || 100, el.h || 100);
              break;
            case 'progress':
              var pw = (el.w || 200), ph = (el.h || 8), pv = (el.value || 60) / 100;
              var pr2 = el.radius || 4;
              ctx.fillStyle = el.bgColor || '#333333';
              drawRoundRect(ctx, el.x, el.y, pw, ph, pr2); ctx.fill();
              ctx.fillStyle = el.color || '#6c5ce7';
              drawRoundRect(ctx, el.x, el.y, pw * pv, ph, pr2); ctx.fill();
              break;
            case 'arc':
              // Render arc as SVG-style arc on canvas
              var cx = el.x, cy = el.y, r = el.r || 40;
              var startRad = (el.startAngle || 0) * Math.PI / 180;
              var endRad = (el.endAngle || 270) * Math.PI / 180;
              ctx.strokeStyle = el.color || '#6c5ce7';
              ctx.lineWidth = el.strokeWidth || 6;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.arc(cx, cy, r, startRad, endRad);
              ctx.stroke();
              break;
            case 'video':
              ctx.fillStyle = '#1a1a2e';
              drawRoundRect(ctx, el.x, el.y, el.w || 240, el.h || 135, 4); ctx.fill();
              ctx.globalAlpha = 0.3;
              ctx.font = '24px sans-serif';
              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'center';
              ctx.fillText('🎬', el.x + (el.w || 240) / 2, el.y + (el.h || 135) / 2 + 8);
              ctx.textAlign = 'left';
              break;
          }
          ctx.restore();
        });
      }

      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (pngBlob) {
          if (!pngBlob) return reject(new Error('PNG 导出失败'));
          var url = URL.createObjectURL(pngBlob);
          var a = document.createElement('a');
          a.href = url;
          a.download = (cardName || 'card') + '.png';
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 10000);
          resolve();
        }, 'image/png');
      });
    });
  });
}

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Export SVG ────────────────────────────────────────────────────
export function exportSVG(cardName, cfg, elements, uploadedFiles, getDeviceFn) {
  if (!elements || elements.length === 0) {
    return Promise.reject(new Error('没有可导出的元素'));
  }
  var device = getDeviceFn ? getDeviceFn() : { width: 976, height: 596, cameraZoneRatio: 0.25 };
  var svgParts = [];
  var gradId = 0;
  var defs = [];

  svgParts.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + device.width + '" height="' + device.height + '" viewBox="0 0 ' + device.width + ' ' + device.height + '">');
  svgParts.push('<rect width="100%" height="100%" fill="' + (cfg.bgColor || '#000000') + '"/>');

  var flatElements = flattenElements(elements);
  flatElements.forEach(function (el) {
    var opacity = (el.opacity !== undefined ? el.opacity : 100) / 100;
    var opAttr = opacity < 1 ? ' opacity="' + opacity + '"' : '';

    switch (el.type) {
      case 'text': {
        var anchor = el.textAlign === 'center' ? 'middle' : el.textAlign === 'right' ? 'end' : 'start';
        var tx = el.textAlign === 'center' ? el.x + (el.w || 200) / 2 : el.textAlign === 'right' ? el.x + (el.w || 200) : el.x;
        var fill = el.color;
        var strokeAttr = '';
        if (el.textGradient && el.textGradient !== 'none') {
          var gradColors = { sunset: '#ff6b6b,#feca57', ocean: '#0984e3,#00cec9', neon: '#ff00ff,#00ffff', gold: '#f39c12,#fdcb6e', aurora: '#6c5ce7,#00b894' };
          var gc = el.textGradient === 'custom' ? (el.color || '#ffffff') + ',' + (el.gradientColor2 || '#ff6b6b') : gradColors[el.textGradient] || gradColors.sunset;
          var colors = gc.split(',');
          var gid = 'grad' + (++gradId);
          defs.push('<linearGradient id="' + gid + '" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="' + colors[0].trim() + '"/><stop offset="100%" stop-color="' + (colors[1] || colors[0]).trim() + '"/></linearGradient>');
          fill = 'url(#' + gid + ')';
        }
        if (el.textStroke && el.textStroke > 0) {
          strokeAttr = ' stroke="' + (el.textStrokeColor || '#000000') + '" stroke-width="' + el.textStroke + '"';
        }
        var lines = String(el.text || '').split('\n');
        lines.forEach(function (line, li) {
          svgParts.push('<text x="' + tx + '" y="' + (el.y + el.size + li * el.size * (el.lineHeight || 1.4)) + '" font-size="' + el.size + '" fill="' + fill + '" text-anchor="' + anchor + '"' + (el.bold ? ' font-weight="bold"' : '') + opAttr + strokeAttr + '>' + escXmlSafe(line) + '</text>');
        });
        break;
      }
      case 'rectangle': {
        var rotAttr = el.rotation ? ' transform="rotate(' + el.rotation + ' ' + (el.x + el.w / 2) + ' ' + (el.y + el.h / 2) + ')"' : '';
        if (el.fillColor2) {
          var gid2 = 'grad' + (++gradId);
          defs.push('<linearGradient id="' + gid2 + '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="' + el.color + '"/><stop offset="100%" stop-color="' + el.fillColor2 + '"/></linearGradient>');
          svgParts.push('<rect x="' + el.x + '" y="' + el.y + '" width="' + el.w + '" height="' + el.h + '" fill="url(#' + gid2 + ')"' + (el.radius ? ' rx="' + el.radius + '"' : '') + opAttr + rotAttr + '/>');
        } else {
          svgParts.push('<rect x="' + el.x + '" y="' + el.y + '" width="' + el.w + '" height="' + el.h + '" fill="' + el.color + '"' + (el.radius ? ' rx="' + el.radius + '"' : '') + opAttr + rotAttr + '/>');
        }
        break;
      }
      case 'circle': {
        var circStroke = el.strokeWidth > 0 ? ' stroke="' + (el.strokeColor || '#ffffff') + '" stroke-width="' + el.strokeWidth + '"' : '';
        svgParts.push('<circle cx="' + el.x + '" cy="' + el.y + '" r="' + el.r + '" fill="' + el.color + '"' + opAttr + circStroke + '/>');
        break;
      }
      case 'image': {
        var fi = el.fileName ? uploadedFiles[el.fileName] : null;
        if (fi && fi.dataUrl) {
          svgParts.push('<image x="' + el.x + '" y="' + el.y + '" width="' + (el.w || 100) + '" height="' + (el.h || 100) + '" href="' + fi.dataUrl + '"' + opAttr + '/>');
        }
        break;
      }
      case 'progress': {
        var pw = el.w || 200, ph = el.h || 8, pv = (el.value || 60) / 100;
        svgParts.push('<rect x="' + el.x + '" y="' + el.y + '" width="' + pw + '" height="' + ph + '" fill="' + (el.bgColor || '#333') + '"' + (el.radius ? ' rx="' + el.radius + '"' : '') + '/>');
        svgParts.push('<rect x="' + el.x + '" y="' + el.y + '" width="' + (pw * pv) + '" height="' + ph + '" fill="' + el.color + '"' + (el.radius ? ' rx="' + el.radius + '"' : '') + '/>');
        break;
      }
      case 'arc': {
        var r = el.r || 40;
        var startRad = ((el.startAngle || 0) - 90) * Math.PI / 180;
        var endRad = ((el.endAngle || 270) - 90) * Math.PI / 180;
        var x1 = el.x + r * Math.cos(startRad);
        var y1 = el.y + r * Math.sin(startRad);
        var x2 = el.x + r * Math.cos(endRad);
        var y2 = el.y + r * Math.sin(endRad);
        var largeArc = ((el.endAngle || 270) - (el.startAngle || 0)) > 180 ? 1 : 0;
        svgParts.push('<path d="M ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + '" fill="none" stroke="' + el.color + '" stroke-width="' + (el.strokeWidth || 6) + '" stroke-linecap="round"' + opAttr + '/>');
        break;
      }
    }
  });

  if (defs.length > 0) {
    svgParts.splice(1, 0, '<defs>' + defs.join('') + '</defs>');
  }

  svgParts.push('</svg>');
  var svgStr = svgParts.join('\n');
  var blob = new Blob([svgStr], { type: 'image/svg+xml' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = (cardName || 'card') + '.svg';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 10000);
  return Promise.resolve();
}

function escXmlSafe(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Export/Import Template Config JSON ────────────────────────────
export function exportTemplateJSON(tplId, cfg, elements) {
  var data = JSON.stringify({ templateId: tplId, config: cfg, elements: elements || [] }, null, 2);
  var blob = new Blob([data], { type: 'application/json' });
  var a = document.createElement('a');
  a.style.display = 'none';
  a.href = URL.createObjectURL(blob);
  a.download = (cfg.cardName || 'template') + '.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 10000);
}

export function importTemplateJSON(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function () {
      try { resolve(JSON.parse(reader.result)); }
      catch (e) { reject(new Error('JSON 格式错误')); }
    };
    reader.readAsText(file);
  });
}

// ─── .rear-eye 自定义格式 ─────────────────────────────────────
export function exportRearEyeFormat(tplId, cfg, elements, uploadedFiles) {
  var data = {
    format: 'rear-eye',
    version: 1,
    templateId: tplId,
    config: cfg,
    elements: elements,
    files: {},
    exportedAt: new Date().toISOString(),
  };
  // Include file metadata (not binary data for this lightweight format)
  Object.keys(uploadedFiles || {}).forEach(function (k) {
    var f = uploadedFiles[k];
    data.files[k] = {
      mimeType: f.mimeType,
      originalName: f.originalName,
      hasData: !!f.data,
      dataUrl: f.dataUrl && f.dataUrl.indexOf('blob:') !== 0 ? f.dataUrl : '',
    };
  });
  var json = JSON.stringify(data, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = (cfg.cardName || 'card') + '.rear-eye';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 10000);
}

export function importRearEyeFormat(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (data.format !== 'rear-eye') throw new Error('不是 .rear-eye 格式');
        resolve({
          templateId: data.templateId,
          config: data.config || {},
          elements: data.elements || [],
          files: {},
        });
      } catch (e) {
        reject(new Error('导入失败: ' + e.message));
      }
    };
    reader.readAsText(file);
  });
}

// ─── MAML XML 导入 ──────────────────────────────────────────
// ─── 全面的 MAML XML 解析器 ─────────────────────────────────
// 支持所有已知 MAML 标签，未知标签保留为 _rawXml

var KNOWN_MAML_TAGS = {
  'Text': 'text', 'Rectangle': 'rectangle', 'Circle': 'circle',
  'Image': 'image', 'Video': 'video', 'Lottie': 'lottie',
  'Group': 'group', 'Layer': 'layer', 'MusicControl': 'musiccontrol',
  'Slider': 'slider', 'Button': 'button', 'Number': 'numberimage',
  'Mask': 'mask', 'Wallpaper': 'wallpaper',
  'Var': 'variable', 'VariableArray': 'variablearray',
  'Trigger': 'trigger', 'VariableCommand': 'variablecommand',
  'BinderCommand': 'bindercommand', 'MusicCommand': 'musiccommand',
  'FrameRateCommand': 'frameratecommand', 'MultiCommand': 'multicommand',
  'IfCommand': 'ifcommand', 'VariableBinders': 'variablebinders',
  'ContentProviderBinder': 'contentprovider', 'Content': 'contentbinding',
  'Permanence': 'permanence', 'FolmeState': 'folmestate',
  'FolmeConfig': 'folmeconfig', 'MiPaletteBinder': 'mipalettebinder',
  'Function': 'framework', 'FunctionCommand': 'framework',
  'ExternalCommand': 'framework', 'ExternalCommands': 'framework',
  'Triggers': 'framework', 'Item': 'framework',
};

function parseNodeGeneric(node) {
  var tag = node.tagName;
  if (!tag) return null;
  var a = function (name) { return node.getAttribute(name) || ''; };

  // Helper: parse children recursively
  function parseChildren() {
    var ch = [];
    for (var i = 0; i < node.childNodes.length; i++) {
      var c = node.childNodes[i];
      if (c.nodeType === 1 && c.tagName) {
        var p = parseNodeGeneric(c);
        if (p) ch.push(p);
      }
    }
    return ch;
  }

  // Helper: parse Consequent/Alternate children
  function parseConditionalChildren(tagName) {
    var sub = node.querySelector(':scope > ' + tagName);
    if (!sub) return [];
    var ch = [];
    for (var i = 0; i < sub.childNodes.length; i++) {
      var c = sub.childNodes[i];
      if (c.nodeType === 1 && c.tagName) {
        var p = parseNodeGeneric(c);
        if (p) ch.push(p);
      }
    }
    return ch;
  }

  // Known mapped types
  var mappedType = KNOWN_MAML_TAGS[tag];
  if (!mappedType) return null;

  switch (tag) {
    case 'Text': {
      var hasAnim = false;
      var anims = {};
      for (var ai = 0; ai < node.childNodes.length; ai++) {
        var an = node.childNodes[ai];
        if (an.nodeType === 1 && an.tagName && an.tagName.indexOf('Animation') > 0) {
          hasAnim = true;
          break;
        }
      }
      return {
        type: 'text', text: a('text') || a('textExp') || '', x: Number(a('x')) || 0, y: Number(a('y')) || 0,
        size: Number(a('size')) || 24, color: a('color') || '#ffffff',
        textAlign: a('textAlign') || 'left', bold: a('bold') === 'true',
        multiLine: a('multiLine') === 'true', w: Number(a('w')) || 200,
        opacity: a('alpha') ? Math.round(parseFloat(a('alpha')) * 100) : 100,
        rotation: Number(a('rotation')) || 0,
        fontFamily: a('fontFamily') || 'default',
        expression: a('textExp') || '',
        textGradient: a('gradientColors') ? 'custom' : 'none',
        gradientColor2: a('gradientColors') ? a('gradientColors').split(',')[1] || '#ff6b6b' : '#ff6b6b',
        textStroke: Number(a('stroke')) || 0,
        textStrokeColor: a('strokeColor') || '#000000',
        shadow: a('shadow') === '1' ? 'light' : a('shadow') === '3' ? 'dark' : a('shadow') === '4' ? 'glow' : 'none',
        marqueeSpeed: Number(a('marqueeSpeed')) || 0,
        marqueeGap: Number(a('marqueeGap')) || 0,
        format: a('format') || '',
        paras: a('paras') || '',
        lineHeight: Number(a('lineHeight')) || 1.4,
      };
    }
    case 'Rectangle': {
      return {
        type: 'rectangle', x: Number(a('x')) || 0, y: Number(a('y')) || 0,
        w: Number(a('w')) || 100, h: Number(a('h')) || 40,
        color: a('fillColor') || '#333333', radius: Number(a('cornerRadius')) || 0,
        opacity: a('alpha') ? Math.round(parseFloat(a('alpha')) * 100) : 100,
        rotation: Number(a('rotation')) || 0,
        fillColor2: a('fillColor2') || '',
        gradientColors: a('gradientColors') || '',
        gradientOrientation: a('gradientOrientation') || 'top_bottom',
        blur: Number(a('blur')) || 0,
        strokeWidth: Number(a('stroke')) || 0,
        strokeColor: a('strokeColor') || '#ffffff',
      };
    }
    case 'Circle': {
      return {
        type: 'circle', x: Number(a('x')) || 0, y: Number(a('y')) || 0,
        r: Number(a('r')) || 30, color: a('fillColor') || '#6c5ce7',
        opacity: a('alpha') ? Math.round(parseFloat(a('alpha')) * 100) : 100,
        rotation: Number(a('rotation')) || 0,
        strokeWidth: Number(a('stroke')) || 0,
        strokeColor: a('strokeColor') || '#ffffff',
      };
    }
    case 'Image': {
      var imgSrc = (a('src') || '').replace(/^(images|videos)\//, '');
      return {
        type: 'image', x: Number(a('x')) || 0, y: Number(a('y')) || 0,
        w: Number(a('w')) || 100, h: Number(a('h')) || 100,
        fileName: imgSrc, src: imgSrc,
        fit: a('fitMode') || 'cover',
        radius: Number(a('cornerRadius')) || 0,
        opacity: a('alpha') ? Math.round(parseFloat(a('alpha')) * 100) : 100,
        rotation: Number(a('rotation')) || 0,
        align: a('align') || '', alignV: a('alignV') || '',
        antiAlias: a('antiAlias') === 'true',
      };
    }
    case 'Video': {
      var vidSrc = (a('src') || '').replace(/^videos\//, '');
      return {
        type: 'video', x: Number(a('x')) || 0, y: Number(a('y')) || 0,
        w: Number(a('w')) || 240, h: Number(a('h')) || 135,
        fileName: vidSrc, src: vidSrc,
      };
    }
    case 'Lottie': {
      return {
        type: 'lottie', x: Number(a('x')) || 50, y: Number(a('y')) || 50,
        w: Number(a('w')) || 120, h: Number(a('h')) || 120,
        src: a('src') || '', name: a('name') || '',
        align: a('align') || 'center',
        loop: Number(a('loop')) || 0,
        autoplay: a('autoplay') !== 'false',
      };
    }
    case 'Group': {
      return {
        type: 'group', x: Number(a('x')) || 0, y: Number(a('y')) || 0,
        w: Number(a('w')) || 200, h: Number(a('h')) || 200,
        name: a('name') || '',
        alpha: a('alpha') ? Number(a('alpha')) : 1,
        visibility: a('visibility') || '',
        folmeMode: a('folmeMode') === 'true',
        align: a('align') || '', alignV: a('alignV') || '',
        contentDescription: a('contentDescriptionExp') || '',
        interceptTouch: a('interceptTouch') === 'true',
        touchable: a('touchable') === 'true',
        frameRate: a('frameRate') ? Number(a('frameRate')) : undefined,
        children: parseChildren(),
      };
    }
    case 'Layer': {
      return {
        type: 'layer', name: a('name') || '',
        alpha: a('alpha') ? Number(a('alpha')) : 1,
        visibility: a('visibility') || '',
        layerType: a('layerType') || 'bottom',
        blurRadius: Number(a('blurRadius')) || 0,
        blurColors: a('blurColors') || '',
        colorModes: Number(a('colorModes')) || 0,
        frameRate: a('frameRate') ? Number(a('frameRate')) : -1,
        updatePosition: a('updatePosition') !== 'false',
        updateSize: a('updateSize') !== 'false',
        updateTranslation: a('updateTranslation') !== 'false',
        children: parseChildren(),
      };
    }
    case 'MusicControl': {
      return {
        type: 'musiccontrol', name: a('name') || 'music_control',
        w: Number(a('w')) || 0, h: Number(a('h')) || 0,
        x: Number(a('x')) || 0, y: Number(a('y')) || 0,
        autoShow: a('autoShow') !== 'false',
        autoRefresh: a('autoRefresh') !== 'false',
        enableLyric: a('enableLyric') === 'true',
        updateLyricInterval: Number(a('updateLyricInterval')) || 100,
        children: parseChildren(),
      };
    }
    case 'Slider': {
      var slChildren = parseChildren();
      var startPoint = [], endPoint = null, triggers = [];
      slChildren.forEach(function (ch) {
        // Slider children are parsed as-is; startPoint/endPoint are structural
        // We'll store them as generic children for round-trip
      });
      return {
        type: 'slider', name: a('name') || '',
        x: 0, y: 0, w: 280, h: 60,
        bounceInitSpeed: Number(a('bounceInitSpeed')) || 0,
        bounceAccelation: Number(a('bounceAccelation')) || 0,
        alwaysShow: a('alwaysShow') === 'true',
        children: slChildren,
      };
    }
    case 'Button': {
      // Detect onclick trigger
      var btChildren = parseChildren();
      var onClickAction = 'none', onClickTarget = '', onClickValue = '', onClickCommands = [];
      btChildren.forEach(function (ch) {
        if (ch.type === 'trigger' && ch.action === 'click' && ch.children) {
          ch.children.forEach(function (cmd) {
            if (cmd.type === 'variablecommand') {
              if (cmd.expression && cmd.expression.indexOf('!#') === 0) {
                onClickAction = 'toggle_visibility';
                onClickTarget = cmd.target;
              } else {
                onClickAction = 'set_variable';
                onClickTarget = cmd.target;
                onClickValue = cmd.value || cmd.expression || '';
              }
            } else if (cmd.type === 'musiccommand') {
              var actMap = { play: 'music_play', pause: 'music_pause', toggle: 'music_toggle', next: 'music_next', prev: 'music_prev' };
              onClickAction = actMap[cmd.action] || 'music_toggle';
            }
          });
        }
      });
      // Filter out trigger children for display
      var btDisplayChildren = btChildren.filter(function (ch) { return ch.type !== 'trigger'; });
      return {
        type: 'button', name: a('name') || '',
        x: Number(a('x')) || 0, y: Number(a('y')) || 0,
        w: Number(a('w')) || 120, h: Number(a('h')) || 48,
        alpha: a('alpha') ? Number(a('alpha')) : 1,
        visibility: a('visibility') || '',
        align: a('align') || '', alignV: a('alignV') || '',
        interceptTouch: a('interceptTouch') === 'true',
        touchable: a('touchable') !== 'false',
        onClickAction: onClickAction,
        onClickTarget: onClickTarget,
        onClickValue: onClickValue,
        onClickCommands: onClickCommands,
        children: btDisplayChildren,
      };
    }
    case 'Number': {
      return {
        type: 'numberimage',
        x: Number(a('x')) || 0, y: Number(a('y')) || 0,
        w: Number(a('w')) || 30, h: Number(a('h')) || 50,
        number: a('number') || '0',
        expression: a('numberExp') || '',
        src: a('src') || 'number',
        space: a('space') ? Number(a('space')) : undefined,
        align: a('align') || '', alignV: a('alignV') || '',
        opacity: a('alpha') ? Math.round(parseFloat(a('alpha')) * 100) : 100,
      };
    }
    case 'Mask': {
      return {
        type: 'mask',
        src: a('src') || '',
        x: Number(a('x')) || 0, y: Number(a('y')) || 0,
        align: a('align') || '',
      };
    }
    case 'Wallpaper': {
      return {
        type: 'wallpaper',
        x: 0, y: 0, w: 0, h: 0,
        opacity: a('alpha') ? Math.round(parseFloat(a('alpha')) * 100) : 100,
      };
    }
    case 'Var': {
      return {
        type: 'variable',
        name: a('name') || '',
        expression: a('expression') || '',
        varType: a('type') || '',
        const: a('const') === 'true',
        threshold: a('threshold') ? Number(a('threshold')) : undefined,
        persist: a('persist') === 'true',
        x: 0, y: 0,
      };
    }
    case 'VariableArray': {
      var vaItems = [];
      for (var vi = 0; vi < node.childNodes.length; vi++) {
        var vn = node.childNodes[vi];
        if (vn.nodeType === 1 && vn.tagName === 'Item') {
          vaItems.push({ expression: vn.getAttribute('expression') || '', value: vn.getAttribute('value') || '' });
        }
      }
      return {
        type: 'variablearray',
        name: a('name') || '',
        items: vaItems,
        x: 0, y: 0,
      };
    }
    case 'Trigger': {
      return {
        type: 'trigger',
        action: a('action') || 'click',
        children: parseChildren(),
        x: 0, y: 0,
      };
    }
    case 'VariableCommand': {
      return {
        type: 'variablecommand',
        target: a('target') || '',
        value: a('value') || '',
        expression: a('expression') || '',
        x: 0, y: 0,
      };
    }
    case 'BinderCommand': {
      return {
        type: 'bindercommand',
        target: a('target') || '',
        value: a('value') || '',
        x: 0, y: 0,
      };
    }
    case 'MusicCommand': {
      return {
        type: 'musiccommand',
        action: a('action') || 'toggle',
        x: 0, y: 0,
      };
    }
    case 'FrameRateCommand': {
      return {
        type: 'frameratecommand',
        target: a('target') || '',
        frameRate: a('frameRate') ? Number(a('frameRate')) : 30,
        x: 0, y: 0,
      };
    }
    case 'MultiCommand': {
      return {
        type: 'multicommand',
        children: parseChildren(),
        x: 0, y: 0,
      };
    }
    case 'IfCommand': {
      return {
        type: 'ifcommand',
        condition: a('condition') || '',
        consequent: parseConditionalChildren('Consequent'),
        alternate: parseConditionalChildren('Alternate'),
        x: 0, y: 0,
      };
    }
    case 'VariableBinders': {
      return {
        type: 'variablebinders',
        children: parseChildren(),
        x: 0, y: 0,
      };
    }
    case 'ContentProviderBinder': {
      // Convert to contentprovider type
      var cpChildren = [];
      for (var cpi = 0; cpi < node.childNodes.length; cpi++) {
        var cpn = node.childNodes[cpi];
        if (cpn.nodeType === 1 && cpn.tagName) {
          if (cpn.tagName === 'Content') {
            cpChildren.push({
              type: 'contentbinding',
              name: cpn.getAttribute('name') || '',
              column: cpn.getAttribute('column') || '',
            });
          } else {
            var cpp = parseNodeGeneric(cpn);
            if (cpp) cpChildren.push(cpp);
          }
        }
      }
      return {
        type: 'contentprovider',
        uri: a('uri') || '',
        projection: a('projection') || '',
        selection: a('selection') || '',
        sortOrder: a('sortOrder') || '',
        name: a('name') || '',
        children: cpChildren,
        x: 0, y: 0,
      };
    }
    case 'Content': {
      return {
        type: 'contentbinding',
        name: a('name') || '',
        column: a('column') || '',
        x: 0, y: 0,
      };
    }
    case 'Permanence': {
      return {
        type: 'permanence',
        name: a('name') || '',
        expression: a('expression') || '',
        default: a('default') || '',
        x: 0, y: 0,
      };
    }
    case 'FolmeState': {
      return {
        type: 'folmestate',
        name: a('name') || '',
        children: parseChildren(),
        x: 0, y: 0,
      };
    }
    case 'FolmeConfig': {
      return {
        type: 'folmeconfig',
        children: parseChildren(),
        x: 0, y: 0,
      };
    }
    case 'MiPaletteBinder': {
      return {
        type: 'mipalettebinder',
        children: parseChildren(),
        x: 0, y: 0,
      };
    }
    default: {
      // Framework tags or unknown — store as _rawXml for round-trip
      var serializer = new XMLSerializer();
      return { type: 'framework', tag: tag, _rawXml: serializer.serializeToString(node).replace(/ xmlns="[^"]*"/g, ''), x: 0, y: 0 };
    }
  }
}

export function importMAML(xmlString) {
  var result = { cardName: '导入的 MAML', bgColor: '#000000', elements: [], updater: '', variables: [], variableBinders: [] };

  // Extract attributes from Widget tag
  var widgetMatch = xmlString.match(/<Widget\s+([^>]+)>/);
  if (widgetMatch) {
    var attrs = {};
    var re = /(\w+)="([^"]*)"/g;
    var m;
    while ((m = re.exec(widgetMatch[1])) !== null) attrs[m[1]] = m[2];
    result.cardName = attrs.name || '导入的 MAML';
    if (attrs.useVariableUpdater) result.updater = attrs.useVariableUpdater;
  }

  // Extract bg color
  var bgMatch = xmlString.match(/<Rectangle\s[^>]*w="#view_width"[^>]*h="#view_height"[^>]*fillColor="(#[0-9a-fA-F]{6})"/);
  if (bgMatch) result.bgColor = bgMatch[1];

  // Parse with DOMParser
  try {
    var parser = new DOMParser();
    var doc = parser.parseFromString(xmlString, 'application/xml');
    var parseError = doc.querySelector('parsererror');
    if (parseError) {
      // Fallback to regex for malformed XML
      parseXmlFallback(xmlString, result);
      return result;
    }

    var widget = doc.querySelector('Widget');
    if (!widget) {
      parseXmlFallback(xmlString, result);
      return result;
    }

    // Parse all top-level children of Widget
    for (var ci = 0; ci < widget.childNodes.length; ci++) {
      var child = widget.childNodes[ci];
      if (child.nodeType !== 1 || !child.tagName) continue;

      // Skip background Rectangle (w="#view_width" h="#view_height")
      if (child.tagName === 'Rectangle' &&
          child.getAttribute('w') === '#view_width' &&
          child.getAttribute('h') === '#view_height') {
        continue;
      }

      // Extract Variables to separate list
      if (child.tagName === 'Var') {
        result.variables.push({
          name: child.getAttribute('name') || '',
          expression: child.getAttribute('expression') || '',
          varType: child.getAttribute('type') || '',
          const: child.getAttribute('const') === 'true',
          threshold: child.getAttribute('threshold') ? Number(child.getAttribute('threshold')) : undefined,
          persist: child.getAttribute('persist') === 'true',
        });
        continue;
      }

      // VariableBinders
      if (child.tagName === 'VariableBinders') {
        var vbParsed = parseNodeGeneric(child);
        if (vbParsed) result.variableBinders.push(vbParsed);
        continue;
      }

      // Skip auto-detect vars (marginL, scaleX, etc.)
      if (child.tagName === 'Var') {
        var vn = child.getAttribute('name') || '';
        if (['marginL', 'scaleX', 'scaleY', 'safeW'].indexOf(vn) >= 0) continue;
      }

      var parsed = parseNodeGeneric(child);
      if (parsed) result.elements.push(parsed);
    }

    // Flatten top-level Group wrappers that just contain marginL offset
    // If first element is a Group with x="#marginL" y="0", unwrap its children
    if (result.elements.length === 1 && result.elements[0].type === 'group' &&
        result.elements[0].children && result.elements[0].children.length > 0) {
      var topGroup = result.elements[0];
      // Only unwrap if it looks like a position wrapper
      if ((String(topGroup.x).indexOf('marginL') >= 0 || topGroup.x === 0) && topGroup.y === 0) {
        result.elements = topGroup.children;
      }
    }

  } catch (e) {
    parseXmlFallback(xmlString, result);
  }

  // Background image detection
  var bgImgMatch = xmlString.match(/<Image\s+src="([^"]*)"[^>]*x="0"[^>]*y="0"[^>]*w="#view_width"[^>]*h="#view_height"/i) ||
                    xmlString.match(/<Image\s+[^>]*x="0"[^>]*y="0"[^>]*w="#view_width"[^>]*h="#view_height"[^>]*src="([^"]*)"/i);
  if (bgImgMatch) {
    result.bgImageSrc = bgImgMatch[1];
  }

  return result;
}

// ─── 递归工具：收集文件 / 展平元素 ──────────────────────────
function collectUsedFiles(elements, files, usedFiles) {
  if (!elements) return;
  elements.forEach(function (el) {
    var fname = el.fileName || el.src;
    if ((el.type === 'image' || el.type === 'video') && fname && files[fname]) {
      usedFiles[fname] = files[fname];
    }
    if (el.children && el.children.length > 0) {
      collectUsedFiles(el.children, files, usedFiles);
    }
  });
}

// 展平嵌套元素列表（Group/Layer/MusicControl → 递归展开子元素）
function flattenElements(elements, offsetX, offsetY) {
  var result = [];
  if (!elements) return result;
  var ox = offsetX || 0;
  var oy = offsetY || 0;
  elements.forEach(function (el) {
    if (el.type === 'group' || el.type === 'layer' || el.type === 'musiccontrol') {
      var childOx = ox + (el.x || 0);
      var childOy = oy + (el.y || 0);
      if (el.children && el.children.length > 0) {
        result = result.concat(flattenElements(el.children, childOx, childOy));
      }
    } else {
      var flat = Object.assign({}, el);
      flat.x = (flat.x || 0) + ox;
      flat.y = (flat.y || 0) + oy;
      result.push(flat);
    }
  });
  return result;
}
