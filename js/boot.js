// Pantalla de arranque inicial (sección 2 y 5 de CLAUDE.md).
// Detrás del flag CONFIG.ENABLE_BOOT_SCREEN. Respeta prefers-reduced-motion
// (si está activo, no se muestra nada). Dura 2s como máximo y se puede
// saltar con cualquier tecla o click. Construye todo su DOM en JS, igual
// que crosshair.js, para no dejar marcado extra cuando está desactivada.
(function () {
  const config = window.CONFIG || {};
  if (!config.ENABLE_BOOT_SCREEN) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const LINES = [
    "INITIALIZING SECURE CHANNEL...",
    "LOADING PROFILE: ACANO...",
    "ACCESS GRANTED.",
  ];
  const DECIPHER_CHARS = "!<>-_\\/[]{}—=+*^?#";
  const MAX_DURATION_MS = 2000; // tope duro pedido en CLAUDE.md (no más de 2s)

  const overlay = document.createElement("div");
  overlay.className = "boot-screen";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-label", "Pantalla de arranque");

  const pre = document.createElement("pre");
  pre.className = "boot-text";
  pre.setAttribute("aria-hidden", "true"); // el texto cambia a cada frame: no se lee en voz alta
  overlay.appendChild(pre);

  const skipHint = document.createElement("p");
  skipHint.className = "boot-skip";
  skipHint.textContent = "Pulsa una tecla o haz click para saltar";
  overlay.appendChild(skipHint);

  document.body.appendChild(overlay);
  document.body.classList.add("boot-active");

  let finished = false;
  let hardTimeout;

  function finish() {
    if (finished) return;
    finished = true;
    window.clearTimeout(hardTimeout);
    window.removeEventListener("keydown", finish);
    window.removeEventListener("click", finish);
    overlay.classList.add("is-leaving");
    window.setTimeout(() => {
      overlay.remove();
      document.body.classList.remove("boot-active");
    }, 200);
  }

  window.addEventListener("keydown", finish);
  window.addEventListener("click", finish);
  hardTimeout = window.setTimeout(finish, MAX_DURATION_MS);

  // Cada línea "converge" desde caracteres aleatorios hasta el texto real.
  function decipherLine(text, container, onDone) {
    const line = document.createElement("div");
    container.appendChild(line);

    let frame = 0;
    const totalFrames = 10;
    const timer = window.setInterval(() => {
      if (finished) {
        window.clearInterval(timer);
        return;
      }
      frame += 1;
      let out = "";
      for (let i = 0; i < text.length; i += 1) {
        const revealAt = (i / text.length) * totalFrames + totalFrames * 0.3;
        if (text[i] === " " || frame >= revealAt) {
          out += text[i];
        } else {
          out += DECIPHER_CHARS[Math.floor(Math.random() * DECIPHER_CHARS.length)];
        }
      }
      line.textContent = out;
      if (frame >= totalFrames * 1.3) {
        window.clearInterval(timer);
        line.textContent = text;
        onDone();
      }
    }, 35);
  }

  function runLines(index) {
    if (finished || index >= LINES.length) return;
    decipherLine(LINES[index], pre, () => runLines(index + 1));
  }

  runLines(0);
})();
