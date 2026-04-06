// ─── Toast: 通知队列系统 ──────────────────────────────────────────

var _toastQueue = [];
var _toastId = 0;

function toast(msg, type, undoFn) {
  var id = 'toast-' + (++_toastId);
  var el = document.createElement('div');
  el.id = id;
  el.className = 'toast ' + (type || 'success');
  if (undoFn) {
    el.innerHTML = '<span>' + escH(msg) + '</span> <button class="toast-undo" onclick="this.parentElement._undo()">↩ 撤销</button>';
    el._undo = function () {
      undoFn();
      el.classList.remove('show');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
      _toastQueue = _toastQueue.filter(function (t) { return t !== id; });
      repositionToasts();
    };
  } else {
    el.textContent = msg;
  }
  document.body.appendChild(el);

  var offset = _toastQueue.length * 52;
  _toastQueue.push(id);
  el.style.bottom = (80 + offset) + 'px';

  requestAnimationFrame(function () { el.classList.add('show'); });
  setTimeout(function () {
    el.classList.remove('show');
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      _toastQueue = _toastQueue.filter(function (t) { return t !== id; });
      repositionToasts();
    }, 300);
  }, undoFn ? 5000 : 2500);
}

// 带进度的 toast
function toastProgress(msg) {
  var id = 'toast-' + (++_toastId);
  var el = document.createElement('div');
  el.id = id;
  el.className = 'toast info';
  el.innerHTML = '<span class="toast-msg">' + escH(msg) + '</span> <span class="toast-spinner"></span>';
  document.body.appendChild(el);
  var offset = _toastQueue.length * 52;
  _toastQueue.push(id);
  el.style.bottom = (80 + offset) + 'px';
  requestAnimationFrame(function () { el.classList.add('show'); });

  return {
    update: function (newMsg) {
      var msgEl = el.querySelector('.toast-msg');
      if (msgEl) msgEl.textContent = newMsg;
    },
    close: function (finalMsg, type) {
      el.classList.remove('show');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        _toastQueue = _toastQueue.filter(function (t) { return t !== id; });
        repositionToasts();
      }, 300);
      if (finalMsg) toast(finalMsg, type || 'success');
    }
  };
}

function repositionToasts() {
  _toastQueue.forEach(function (tid, i) {
    var t = document.getElementById(tid);
    if (t) t.style.bottom = (80 + i * 52) + 'px';
  });
}

function escH(s) { return JCM.escHtml(s); }
