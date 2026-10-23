// Micro-glitch ocasional en títulos (sección 2 de CLAUDE.md).
// Detrás del flag CONFIG.ENABLE_GLITCH. Respeta prefers-reduced-motion.
// Busca elementos con class="glitch-text" y un data-text con el MISMO
// contenido (lo necesitan los pseudo-elementos ::before/::after del CSS).
(function () {
  const config = window.CONFIG || {};
  if (!config.ENABLE_GLITCH) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const targets = Array.from(document.querySelectorAll(".glitch-text"));
  if (!targets.length) return;

  function triggerGlitch(el) {
    el.classList.remove("is-glitching");
    // Forzar reflow para poder relanzar la animación si se solapara.
    void el.offsetWidth;
    el.classList.add("is-glitching");
    window.setTimeout(() => el.classList.remove("is-glitching"), 280);
  }

  function scheduleNext() {
    const delay = 4000 + Math.random() * 6000; // cada 4-10s, ocasional
    window.setTimeout(() => {
      const el = targets[Math.floor(Math.random() * targets.length)];
      triggerGlitch(el);
      scheduleNext();
    }, delay);
  }

  scheduleNext();
})();
