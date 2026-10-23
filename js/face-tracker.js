// Face-tracker: controla el avatar interactivo del hero (sección 6 de CLAUDE.md).
// El componente <alvaro-avatar> (avatar-alvaro.js) ya hace todo el trabajo:
// sigue el cursor con la cabeza y los ojos (efecto 2.5D en WebGL), respeta
// prefers-reduced-motion y se pausa solo cuando no es visible.
//
// Aquí solo aplicamos el flag CONFIG.ENABLE_FACE_TRACKER: si está en false,
// se congela el avatar (queda la imagen estática) sin desmontar nada.
(function () {
  const config = window.CONFIG || {};
  const avatar = document.getElementById("avatar");
  if (!avatar) return;

  if (!config.ENABLE_FACE_TRACKER) {
    // Espera a que el componente esté definido para poder pausarlo.
    if (window.customElements && customElements.whenDefined) {
      customElements.whenDefined("alvaro-avatar").then(() => {
        if (typeof avatar.pause === "function") avatar.pause();
        else avatar.setAttribute("paused", "");
      });
    } else {
      avatar.setAttribute("paused", "");
    }
  }
})();
