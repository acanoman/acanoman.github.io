// Cursor de mira (crosshair) a pantalla completa con coordenadas X/Y en vivo.
// Detrás del flag CONFIG.ENABLE_CROSSHAIR definido en main.js.
(function () {
  const config = window.CONFIG || {};
  if (!config.ENABLE_CROSSHAIR) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
  if (reduceMotion || isTouchDevice) return;

  // Construcción de la capa: dos líneas + caja de coordenadas.
  const layer = document.createElement("div");
  layer.className = "crosshair-layer";
  layer.setAttribute("aria-hidden", "true");

  const lineV = document.createElement("div");
  lineV.className = "crosshair-line crosshair-line-v";

  const lineH = document.createElement("div");
  lineH.className = "crosshair-line crosshair-line-h";

  const coords = document.createElement("div");
  coords.className = "crosshair-coords";
  coords.textContent = "X: 0 Y: 0";

  layer.appendChild(lineV);
  layer.appendChild(lineH);
  layer.appendChild(coords);
  document.body.appendChild(layer);
  document.body.classList.add("crosshair-active");

  // El listener solo guarda la última posición; el pintado va en requestAnimationFrame
  // para no repintar más veces de las que el navegador puede pintar.
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

  function tick() {
    if (hasMoved) {
      lineV.style.transform = `translateX(${lastX}px)`;
      lineH.style.transform = `translateY(${lastY}px)`;
      coords.textContent = `X: ${Math.round(lastX)} Y: ${Math.round(lastY)}`;
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  // Si el ratón sale de la ventana (p. ej. al minimizar), no hace falta limpiar nada más:
  // la capa es pointer-events: none y no interfiere con el resto de la página.
})();
