// Flags de activación de efectos (sección 7 de CLAUDE.md).
// Cada efecto respeta su flag Y prefers-reduced-motion, pase lo que pase aquí.
const CONFIG = {
  ENABLE_BOOT_SCREEN: false,
  ENABLE_CROSSHAIR: true, // mira + coordenadas X/Y
  ENABLE_TERMINAL: true,
  ENABLE_SCANLINES: false,
  ENABLE_GLITCH: false,
  ENABLE_FACE_TRACKER: false, // se activa cuando haya foto real
  ENABLE_PARTICLES: false,
};
window.CONFIG = CONFIG;

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