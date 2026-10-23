// Face-tracker: el retrato encapuchado reacciona al cursor (sección 6 de CLAUDE.md).
// Detrás del flag CONFIG.ENABLE_FACE_TRACKER. Respeta prefers-reduced-motion y
// se desactiva en móvil (no hay ratón).
//
// MODO ACTUAL (placeholder): inclina la silueta SVG y mueve los ojos hacia el
// cursor. Funciona con una sola imagen/silueta, sin necesidad de la rejilla.
//
// FASE 5 (foto real): sustituir este efecto por el swap de la rejilla de miradas
// de fofr/face_looker (MIT). Esquema: gaze_px{X}_py{Y}_{SIZE}.webp, X/Y de -15 a
// 15 en pasos de 3 (Y negativo se escribe con prefijo 'm', p. ej. pym15). Mapear
// la posición del ratón a [-1,1], escalar a P_MAX, redondear con Math.round al
// múltiplo de STEP y construir el nombre de archivo para cambiar el src.
(function () {
  const config = window.CONFIG || {};
  if (!config.ENABLE_FACE_TRACKER) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
  if (reduceMotion || isTouchDevice) return;

  const frame = document.getElementById("face-tracker");
  if (!frame) return;

  const svg = frame.querySelector(".portrait-svg");
  const eyes = frame.querySelector("#portrait-eyes");
  if (!svg) return;

  let lastX = window.innerWidth / 2;
  let lastY = window.innerHeight / 2;
  let hasMoved = false;

  window.addEventListener(
    "mousemove",
    (event) => {
      lastX = event.clientX;
      lastY = event.clientY;
      hasMoved = true;
    },
    { passive: true }
  );

  function clamp(value) {
    return Math.max(-1, Math.min(1, value));
  }

  function tick() {
    if (hasMoved) {
      const rect = frame.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clamp((lastX - centerX) / (window.innerWidth / 2));
      const dy = clamp((lastY - centerY) / (window.innerHeight / 2));

      // Inclinación 3D sutil de toda la figura.
      svg.style.transform = `perspective(600px) rotateY(${dx * 10}deg) rotateX(${-dy * 8}deg)`;
      // Los ojos se desplazan un poco dentro del rostro.
      if (eyes) eyes.setAttribute("transform", `translate(${dx * 8}, ${dy * 6})`);
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
