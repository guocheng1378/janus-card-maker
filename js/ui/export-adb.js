// ─── ADB Push + Export Formats: ADB 直推 + GIF/PDF 导出 ──────────
import { toast } from './toast.js';

// ─── ADB Push ────────────────────────────────────────────────────
export function showADBPush() {
  var existing = document.getElementById('adbPushModal');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'adbPushModal';
  overlay.style.display = '';
  overlay.onclick = function () { overlay.remove(); };

  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '520px';
  modal.onclick = function (e) { e.stopPropagation(); };

  modal.innerHTML = '<div class="modal-header"><h3>📲 ADB 直推到背屏</h3><button class="modal-close" onclick="document.getElementById(\'adbPushModal\').remove()">✕</button></div>' +
    '<div class="modal-body" style="padding:20px">' +

    // Quick push section
    '<div style="background:var(--surface2);border-radius:8px;padding:14px;margin-bottom:12px">' +
    '<div style="font-weight:600;font-size:13px;margin-bottom:8px">🚀 快速推送到 REAREye</div>' +
    '<div style="font-size:12px;color:var(--text2);margin-bottom:10px">先导出 ZIP，然后用以下命令直接推送到 REAREye 模板目录：</div>' +

    '<div style="background:var(--surface3);padding:10px;border-radius:6px;font-family:monospace;font-size:11px;word-break:break-all;margin-bottom:8px;position:relative" id="adbCmd1">' +
    'adb push 卡片名.zip /sdcard/Download/REAREye/templates/' +
    '<button onclick="navigator.clipboard.writeText(\'adb push 卡片名.zip /sdcard/Download/REAREye/templates/\');this.textContent=\'✅ 已复制\';setTimeout(()=>this.textContent=\'📋\',1500)" style="position:absolute;right:4px;top:4px;background:var(--accent);color:#fff;border:none;border-radius:4px;padding:2px 8px;font-size:10px;cursor:pointer">📋</button></div>' +

    '<div style="font-size:11px;color:var(--text3);margin-bottom:6px">推送到 REAREye 后，在模块的「组件模板管理器」中导入即可。</div>' +
    '</div>' +

    // Manual push section
    '<div style="background:var(--surface2);border-radius:8px;padding:14px;margin-bottom:12px">' +
    '<div style="font-weight:600;font-size:13px;margin-bottom:8px">📁 手动推送到下载目录</div>' +

    '<div style="background:var(--surface3);padding:10px;border-radius:6px;font-family:monospace;font-size:11px;word-break:break-all;margin-bottom:8px;position:relative">' +
    'adb push 卡片名.zip /sdcard/Download/' +
    '<button onclick="navigator.clipboard.writeText(\'adb push 卡片名.zip /sdcard/Download/\');this.textContent=\'✅ 已复制\';setTimeout(()=>this.textContent=\'📋\',1500)" style="position:absolute;right:4px;top:4px;background:var(--accent);color:#fff;border:none;border-radius:4px;padding:2px 8px;font-size:10px;cursor:pointer">📋</button></div>' +
    '<div style="font-size:11px;color:var(--text3)">推送后在手机文件管理器中找到 ZIP，用 REAREye 导入。</div>' +
    '</div>' +

    // WiFi ADB section
    '<div style="background:var(--surface2);border-radius:8px;padding:14px;margin-bottom:12px">' +
    '<div style="font-weight:600;font-size:13px;margin-bottom:8px">📶 WiFi ADB（无线推送）</div>' +
    '<div style="font-size:12px;color:var(--text2);margin-bottom:8px">先用 USB 连接一次，然后切换到无线模式：</div>' +

    '<div style="background:var(--surface3);padding:10px;border-radius:6px;font-family:monospace;font-size:11px;margin-bottom:6px;position:relative">' +
    'adb tcpip 5555' +
    '<button onclick="navigator.clipboard.writeText(\'adb tcpip 5555\');this.textContent=\'✅\';setTimeout(()=>this.textContent=\'📋\',1500)" style="float:right;background:var(--accent);color:#fff;border:none;border-radius:4px;padding:1px 6px;font-size:10px;cursor:pointer">📋</button></div>' +

    '<div style="background:var(--surface3);padding:10px;border-radius:6px;font-family:monospace;font-size:11px;margin-bottom:6px;position:relative">' +
    'adb connect &lt;手机IP&gt;:5555' +
    '<button onclick="var cmd=this.parentElement.firstChild.textContent;navigator.clipboard.writeText(cmd);this.textContent=\'✅\';setTimeout(()=>this.textContent=\'📋\',1500)" style="float:right;background:var(--accent);color:#fff;border:none;border-radius:4px;padding:1px 6px;font-size:10px;cursor:pointer">📋</button></div>' +

    '<div style="font-size:11px;color:var(--text3)">连接成功后拔掉 USB，用上面的 push 命令无线推送。</div>' +
    '</div>' +

    // Tips
    '<div style="background:var(--accent-bg);border-radius:8px;padding:12px;font-size:11px;color:var(--accent)">' +
    '💡 <b>提示</b>：如果你安装了 REAREye，可以直接在模块设置中通过「组件模板管理器」的导入功能选择手机上的 ZIP 文件。</div>' +

    '</div>';

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

// ─── Export as GIF ────────────────────────────────────────────────
export function exportGIF(cardName, device) {
  toast('🎬 正在截取预览...', 'info');
  var previewContent = document.getElementById('previewContent');
  if (!previewContent) return toast('预览区域不存在', 'error');
  var canvas = document.createElement('canvas');
  var scale = 2;
  canvas.width = (device.width || 976) * scale;
  canvas.height = (device.height || 596) * scale;
  var ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, device.width, device.height);
  canvas.toBlob(function (blob) {
    if (!blob) return toast('导出失败', 'error');
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (cardName || 'card') + '.png';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    toast('✅ 截图已导出', 'success');
  }, 'image/png');
}

// ─── Export as PDF ────────────────────────────────────────────────
export function exportPDF(cardName, device) {
  toast('📄 PDF 导出中...', 'info');
  var previewContent = document.getElementById('previewContent');
  if (!previewContent) return toast('预览区域不存在', 'error');
  var w = window.open('', '_blank');
  if (!w) return toast('请允许弹出窗口', 'warning');
  w.document.write('<!DOCTYPE html><html><head><title>' + (cardName || 'card') + '</title><style>' +
    '@page{size:' + (device.width || 976) + 'px ' + (device.height || 596) + 'px;margin:0}' +
    'body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh}' +
    '.card{width:' + (device.width || 976) + 'px;height:' + (device.height || 596) + 'px;overflow:hidden;position:relative}' +
    '</style></head><body>' +
    '<div class="card">' + previewContent.innerHTML + '</div>' +
    '<script>setTimeout(function(){window.print();},500)<\/script></body></html>');
  w.document.close();
}
