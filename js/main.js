// Flags de activación de efectos (sección 7 de CLAUDE.md).
// Cada efecto respeta su flag Y prefers-reduced-motion, pase lo que pase aquí.
const CONFIG = {
  ENABLE_BOOT_SCREEN: true,
  ENABLE_CROSSHAIR: true, // mira + coordenadas X/Y
  ENABLE_TERMINAL: true,
  ENABLE_SCANLINES: true,
  ENABLE_GLITCH: true,
  ENABLE_MASK_BACKGROUND: true,
  ENABLE_PARTICLES: false,
};
window.CONFIG = CONFIG;

const maskBackground = document.querySelector(".page-mask");
if (maskBackground) {
  maskBackground.hidden = !CONFIG.ENABLE_MASK_BACKGROUND;
  const hero = document.querySelector(".hero");
  if (CONFIG.ENABLE_MASK_BACKGROUND && hero && "IntersectionObserver" in window) {
    const contrastObserver = new IntersectionObserver(([entry]) => {
      document.body.classList.toggle("mask-intro", entry.isIntersecting);
    }, { threshold: 0, rootMargin: "-15% 0px -15% 0px" });
    contrastObserver.observe(hero);
  }
}

// Revelado discreto de secciones al entrar en pantalla.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll(".reveal");

if (!reduceMotion && "IntersectionObserver" in window) {
  document.documentElement.classList.add("js-enabled");

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => revealObserver.observe(item));
}
