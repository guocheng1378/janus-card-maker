// ─── Store: 简易响应式状态 ─────────────────────────────────────────

window.JCM = window.JCM || {};

JCM.createStore = function (init) {
  var s = JSON.parse(JSON.stringify(init));
  var subs = {};
  return {
    get: function (k) { return k ? s[k] : Object.assign({}, s); },
    set: function (k, v) {
      s[k] = v;
      (subs[k] || []).forEach(function (fn) { fn(v); });
    },
    on: function (k, fn) {
      (subs[k] = subs[k] || []).push(fn);
    }
  };
};
