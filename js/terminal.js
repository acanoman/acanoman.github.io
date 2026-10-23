// Terminal simulada: capa de navegación alternativa (sección 5 de CLAUDE.md).
// Detrás del flag CONFIG.ENABLE_TERMINAL definido en main.js.
(function () {
  const config = window.CONFIG || {};

  const toggleBtn = document.getElementById("terminal-toggle");
  const closeBtn = document.getElementById("terminal-close");
  const windowEl = document.getElementById("terminal-window");
  const outputEl = document.getElementById("terminal-output");
  const inputEl = document.getElementById("terminal-input");
  const heroHint = document.getElementById("hero-terminal-hint");

  if (!toggleBtn || !windowEl || !outputEl || !inputEl) return;

  if (!config.ENABLE_TERMINAL) {
    toggleBtn.hidden = true;
    if (heroHint) heroHint.hidden = true;
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Secciones navegables: nombre corto -> id del DOM + texto que muestra "cat".
  const SECTIONS = {
    home: {
      id: "top",
      label: "Inicio",
      text: "Álvaro Cano | Cybersecurity Engineer | Red Team · Pentesting\nRomper las cosas para entender cómo funcionan.",
    },
    about: {
      id: "about",
      label: "Sobre mí",
      text:
        "Soy Álvaro Cano Mantero, Cybersecurity Engineer con ocho años de experiencia en IT Security & Cloud.\n" +
        "Me centro en seguridad ofensiva: comprender cómo fallan los sistemas para poder protegerlos mejor.\n" +
        "Trabajo con Active Directory, pivoting y seguridad cloud en AWS.",
    },
    certifications: {
      id: "certifications",
      label: "Certificaciones",
      text: "OSCP+ — Offensive Security Certified Professional\neJPTv2 — Junior Penetration Tester\nCJCA — Certificación profesional",
    },
    arsenal: {
      id: "arsenal",
      label: "Arsenal / Skills",
      text: "Active Directory, Kerberoasting, ADCS, Abuso de ACLs, NTLM relay, Pivoting, Seguridad cloud, AWS.",
    },
    projects: {
      id: "projects",
      label: "Proyectos",
      text: "En preparación. Esta sección se completará con los proyectos que comparta Álvaro.",
    },
    notes: {
      id: "notes",
      label: "Apuntes",
      text: "Notas técnicas, metodología y documentación sobre laboratorios y ciberseguridad.",
    },
    contact: {
      id: "contact",
      label: "Contacto",
      text: "Los datos de contacto se añadirán cuando Álvaro decida cuáles publicar.",
    },
  };
  // Alias para que "ls"/"cd" acepten tanto el nombre corto como alguno natural.
  const SECTION_ALIASES = { inicio: "home", skills: "arsenal" };

  function resolveSection(name) {
    if (!name) return null;
    const key = name.toLowerCase();
    return SECTIONS[key] || SECTIONS[SECTION_ALIASES[key]] || null;
  }

  // --- Historial (en memoria + localStorage, con try/catch) ---
  const HISTORY_KEY = "miweb-terminal-history";
  let history = [];
  try {
    const saved = window.localStorage.getItem(HISTORY_KEY);
    if (saved) history = JSON.parse(saved);
  } catch (err) {
    history = [];
  }
  let historyIndex = history.length;

  function saveHistory() {
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-50)));
    } catch (err) {
      // localStorage no disponible (modo privado, cuota, etc.): sin historial persistente.
    }
  }

  // --- Salida con efecto de tecleo breve ---
  function printLine(text, variant) {
    const line = document.createElement("div");
    line.className = "terminal-line" + (variant ? ` terminal-line-${variant}` : "");
    outputEl.appendChild(line);

    if (reduceMotion) {
      line.textContent = text;
      outputEl.scrollTop = outputEl.scrollHeight;
      return;
    }

    let i = 0;
    const speed = 12; // ms por carácter: rápido, que no desespere
    const timer = setInterval(() => {
      line.textContent = text.slice(0, i + 1);
      i += 1;
      outputEl.scrollTop = outputEl.scrollHeight;
      if (i >= text.length) clearInterval(timer);
    }, speed);
  }

  function printLines(lines, variant) {
    (Array.isArray(lines) ? lines : [lines]).forEach((line) => printLine(line, variant));
  }

  // --- Comandos ---
  const COMMAND_LIST = [
    "help", "whoami", "ls", "cd", "goto", "cat", "certs", "skills",
    "apuntes", "contact", "clear", "theme", "exit",
  ];

  const COMMANDS = {
    help() {
      return [
        "Comandos disponibles:",
        "  help            muestra esta ayuda",
        "  whoami          quién soy",
        "  ls              lista las secciones navegables",
        "  cd <sección>    navega por scroll a una sección (alias: goto)",
        "  cat <sección>   muestra el contenido de una sección aquí",
        "  certs           lista certificaciones",
        "  skills          lista áreas de especialidad",
        "  apuntes         abre /apuntes/",
        "  contact         datos de contacto",
        "  theme           cambia de paleta (verde / ámbar)",
        "  clear           limpia la terminal",
        "  exit            cierra la terminal (también Esc)",
      ];
    },
    whoami() {
      return [
        "Álvaro Cano Mantero",
        "Cybersecurity Engineer · Seguridad ofensiva (Red Team / Pentesting)",
        "OSCP+ · eJPTv2 · CJCA",
        "8 años como IT Security & Cloud Engineer",
        "Especialidades: Active Directory, Pivoting, Cloud (AWS)",
        "Madrid, España",
      ];
    },
    ls() {
      return [
        "Secciones disponibles:",
        ...Object.keys(SECTIONS).map((key) => `  ${key.padEnd(16)} ${SECTIONS[key].label}`),
      ];
    },
    cd(arg) {
      const section = resolveSection(arg);
      if (!section) {
        return [`sección no encontrada: "${arg || ""}". Usa 'ls' para ver las disponibles.`, "error"];
      }
      const target = document.getElementById(section.id);
      if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      return [`Navegando a "${section.label}"...`];
    },
    cat(arg) {
      const section = resolveSection(arg);
      if (!section) {
        return [`sección no encontrada: "${arg || ""}". Usa 'ls' para ver las disponibles.`, "error"];
      }
      return section.text.split("\n");
    },
    certs() {
      return COMMANDS.cat("certifications");
    },
    skills() {
      return COMMANDS.cat("arsenal");
    },
    apuntes() {
      printLine("Abriendo /apuntes/ ...");
      window.setTimeout(() => {
        window.location.href = "/apuntes/";
      }, reduceMotion ? 0 : 350);
      return [];
    },
    contact() {
      return COMMANDS.cat("contact");
    },
    clear() {
      outputEl.innerHTML = "";
      return [];
    },
    theme() {
      const isAmber = document.documentElement.classList.toggle("theme-amber");
      return [isAmber ? "Tema cambiado a ámbar." : "Tema cambiado a verde militar (por defecto)."];
    },
    exit() {
      closeTerminal();
      return [];
    },
  };
  COMMANDS.goto = COMMANDS.cd;

  function runCommand(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;

    printLine(`visitor@acano:~$ ${trimmed}`, "amber");

    // Easter egg: nunca se ejecuta nada destructivo, solo una broma con sacudida.
    if (/^sudo\s+rm\s+-rf\s+\/?\s*$/.test(trimmed)) {
      windowEl.classList.remove("terminal-shake");
      // Forzar reflow para poder relanzar la animación en pulsaciones seguidas.
      void windowEl.offsetWidth;
      windowEl.classList.add("terminal-shake");
      printLine("Permission denied. Nice try 🙂", "error");
      return;
    }

    const [command, ...args] = trimmed.split(/\s+/);
    const handler = COMMANDS[command.toLowerCase()];

    if (!handler) {
      printLine(`comando no encontrado: ${command}. Escribe 'help' para ver la lista.`, "error");
      return;
    }

    const result = handler(args.join(" "));
    if (result && result.length) {
      const variant = result[result.length - 1] === "error" ? "error" : null;
      const lines = variant ? result.slice(0, -1) : result;
      printLines(lines, variant);
    }
  }

  // --- Apertura / cierre ---
  function openTerminal() {
    windowEl.hidden = false;
    toggleBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("terminal-open");
    if (outputEl.childElementCount === 0) {
      // Primer uso: se muestra directamente la ayuda para que quien no conozca
      // una terminal sepa de inmediato qué puede escribir (no basta con decir "escribe help").
      printLines(["Terminal de acanoman.github.io. Puedes navegar la web con estos comandos:", ""]);
      printLines(COMMANDS.help());
      printLines(["", "Escribe cualquiera de ellos y pulsa Enter. Esc o 'exit' para cerrar."]);
    }
    inputEl.focus();
  }

  function closeTerminal() {
    windowEl.hidden = true;
    toggleBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("terminal-open");
    toggleBtn.focus();
  }

  function isOpen() {
    return !windowEl.hidden;
  }

  toggleBtn.addEventListener("click", () => {
    if (isOpen()) closeTerminal();
    else openTerminal();
  });
  closeBtn.addEventListener("click", closeTerminal);

  // Atajo de teclado: ` o ~ para abrir/cerrar, Esc para cerrar siempre.
  window.addEventListener("keydown", (event) => {
    const focusedIsInput = document.activeElement === inputEl;

    if (event.key === "Escape" && isOpen()) {
      event.preventDefault();
      closeTerminal();
      return;
    }

    if ((event.key === "`" || event.key === "~") && !focusedIsInput) {
      event.preventDefault();
      if (isOpen()) closeTerminal();
      else openTerminal();
    }
  });

  // --- Input: enviar, historial e autocompletado ---
  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const value = inputEl.value;
      inputEl.value = "";
      if (value.trim()) {
        history.push(value);
        saveHistory();
      }
      historyIndex = history.length;
      runCommand(value);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (historyIndex > 0) {
        historyIndex -= 1;
        inputEl.value = history[historyIndex] || "";
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex < history.length) {
        historyIndex += 1;
        inputEl.value = history[historyIndex] || "";
      }
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const value = inputEl.value;
      if (!value || value.includes(" ")) return;
      const matches = COMMAND_LIST.filter((cmd) => cmd.startsWith(value.toLowerCase()));
      if (matches.length === 1) {
        inputEl.value = matches[0] + " ";
      } else if (matches.length > 1) {
        printLine(`visitor@acano:~$ ${value}`, "amber");
        printLine(matches.join("  "));
      }
    }
  });
})();
