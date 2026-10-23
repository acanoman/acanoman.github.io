// Scanlines + ruido muy sutil encima de todo (sección 2 de CLAUDE.md).
// Detrás del flag CONFIG.ENABLE_SCANLINES. Es una textura estática, sin
// animación, así que no depende de prefers-reduced-motion.
(function () {
  const config = window.CONFIG || {};
  if (!config.ENABLE_SCANLINES) return;

  document.body.classList.add("scanlines-active");
})();
