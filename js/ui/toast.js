// ─── Toast: 消息提示（队列支持）──────────────────────────────
var _toastQueue = [];
var _toastTimer = null;
var _toastEl = null;

function getToastEl() {
  if (!_toastEl) _toastEl = document.getElementById('toast');
  return _toastEl;
}

export function toast(msg, type, duration) {
  type = type || 'info';
  duration = duration || (type === 'error' ? 4000 : 2500);
  
  var el = getToastEl();
  if (!el) return;
  
  // Create toast item
  var item = document.createElement('div');
  item.className = 'toast-item toast-' + type;
  item.textContent = msg;
  el.appendChild(item);
  
  // Auto remove
  setTimeout(function() {
    item.classList.add('fade-out');
    setTimeout(function() { 
      if (item.parentNode) item.parentNode.removeChild(item); 
    }, 300);
  }, duration);
}

export function toastProgress(msg) {
  var el = getToastEl();
  if (!el) return { close: function() {} };
  
  var item = document.createElement('div');
  item.className = 'toast-item toast-info';
  item.innerHTML = msg;
  el.appendChild(item);
  
  return {
    close: function(newMsg, newType) {
      if (newMsg) {
        item.className = 'toast-item toast-' + (newType || 'success');
        item.textContent = newMsg;
      }
      setTimeout(function() {
        item.classList.add('fade-out');
        setTimeout(function() { 
          if (item.parentNode) item.parentNode.removeChild(item); 
        }, 300);
      }, 1500);
    }
  };
}
