// ─── App Entry ─────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
  JCM.initUI();
});

// ─── PWA Service Worker ───────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(function () {});
}
