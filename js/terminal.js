// Terminal simulada (sección 5 de CLAUDE.md). Motor reutilizable que puede vivir:
//  - embebido en el hero de la home (siempre visible, con autoescritura de intro)
//  - en una ventana flotante en el resto de páginas (apuntes, posts)
// Detrás del flag CONFIG.ENABLE_TERMINAL definido en main.js.
(function () {
  const config = window.CONFIG || {};
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- Datos compartidos: secciones navegables ---
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
  const SECTION_ALIASES = { inicio: "home", skills: "arsenal" };

  function resolveSection(name) {
    if (!name) return null;
    const key = name.toLowerCase();
    return SECTIONS[key] || SECTIONS[SECTION_ALIASES[key]] || null;
  }

  const COMMAND_LIST = [
    "help", "whoami", "ls", "cd", "goto", "cat", "certs", "skills",
    "apuntes", "contact", "clear", "theme", "exit",
  ];

  // --- Historial compartido (localStorage con try/catch) ---
  const HISTORY_KEY = "miweb-terminal-history";
  function loadHistory() {
    try {
      const saved = window.localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      return [];
    }
  }
  function saveHistory(history) {
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-50)));
    } catch (err) {
      // localStorage no disponible: sin historial persistente.
    }
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  // --- Fábrica: crea una instancia de terminal sobre los elementos dados ---
  function createTerminal(opts) {
    const outputEl = opts.outputEl;
    const inputEl = opts.inputEl;
    const onExit = opts.onExit || function () {};

    let history = loadHistory();
    let historyIndex = history.length;

    // Imprime una línea con efecto de tecleo. Devuelve una promesa que
    // resuelve al terminar, para poder encadenar la intro del hero.
    function printLine(text, variant) {
      return new Promise((resolve) => {
        const line = document.createElement("div");
        line.className = "terminal-line" + (variant ? ` terminal-line-${variant}` : "");
        outputEl.appendChild(line);

        if (reduceMotion || !text) {
          line.textContent = text;
          outputEl.scrollTop = outputEl.scrollHeight;
          resolve();
          return;
        }

        let i = 0;
        const speed = 12; // ms por carácter: rápido, que no desespere
        const timer = window.setInterval(() => {
          line.textContent = text.slice(0, i + 1);
          i += 1;
          outputEl.scrollTop = outputEl.scrollHeight;
          if (i >= text.length) {
            window.clearInterval(timer);
            resolve();
          }
        }, speed);
      });
    }

    function printLines(lines, variant) {
      (Array.isArray(lines) ? lines : [lines]).forEach((line) => printLine(line, variant));
    }

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
          "  exit            cierra/suelta la terminal (también Esc)",
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
        onExit();
        return [];
      },
    };
    COMMANDS.goto = COMMANDS.cd;

    function runCommand(raw) {
      const trimmed = raw.trim();
      if (!trimmed) return;

      printLine(`visitor@acano:~$ ${trimmed}`, "amber");

      // Easter egg: nunca ejecuta nada destructivo, solo una broma con sacudida.
      if (/^sudo\s+rm\s+-rf\s+\/?\s*$/.test(trimmed)) {
        const shakeTarget = outputEl.closest(".terminal-window, .hero-terminal");
        if (shakeTarget) {
          shakeTarget.classList.remove("terminal-shake");
          void shakeTarget.offsetWidth;
          shakeTarget.classList.add("terminal-shake");
        }
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

    inputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const value = inputEl.value;
        inputEl.value = "";
        if (value.trim()) {
          history.push(value);
          saveHistory(history);
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

    // Mientras se escribe, se restaura el cursor del sistema (la mira lo oculta).
    inputEl.addEventListener("focus", () => document.body.classList.add("terminal-typing"));
    inputEl.addEventListener("blur", () => document.body.classList.remove("terminal-typing"));

    return {
      printLine,
      printLines,
      runCommand,
      helpLines: COMMANDS.help(),
      focus: () => inputEl.focus(),
      outputEl,
      isEmpty: () => outputEl.childElementCount === 0,
    };
  }

  // Secuencia de arranque autoescrita para la terminal del hero.
  async function playIntro(term) {
    if (!term.isEmpty()) return;
    const steps = [
      ["visitor@acano:~$ whoami", "amber"],
      ["Álvaro Cano · Cybersecurity Engineer", null],
      ["OSCP+ · eJPTv2 · CJCA · 8 años IT Security & Cloud", null],
      ['"Romper las cosas para entender cómo funcionan."', "accent"],
      ["", null],
      ["Escribe 'help' y pulsa Enter para navegar.", "muted"],
    ];
    for (const [text, variant] of steps) {
      await term.printLine(text, variant);
      await wait(reduceMotion ? 0 : 140);
    }
  }

  // --- Arranque: decide modo embebido (hero) o flotante ---
  const heroOutput = document.getElementById("hero-terminal-output");
  const heroInput = document.getElementById("hero-terminal-input");
  const floatingWindow = document.getElementById("terminal-window");
  const floatingOutput = document.getElementById("terminal-output");
  const floatingInput = document.getElementById("terminal-input");
  const toggleBtn = document.getElementById("terminal-toggle");
  const closeBtn = document.getElementById("terminal-close");
  const heroHint = document.getElementById("hero-terminal-hint");

  if (!config.ENABLE_TERMINAL) {
    if (toggleBtn) toggleBtn.hidden = true;
    if (floatingWindow) floatingWindow.hidden = true;
    if (heroHint) heroHint.hidden = true;
    return;
  }

  if (heroOutput && heroInput) {
    // Modo embebido: la terminal vive en el hero y está siempre visible.
    // La ventana flotante no se usa en esta página.
    if (toggleBtn) toggleBtn.hidden = true;
    if (floatingWindow) floatingWindow.hidden = true;

    const term = createTerminal({
      outputEl: heroOutput,
      inputEl: heroInput,
      onExit: () => heroInput.blur(),
    });

    // La tecla ` o ~ enfoca la terminal del hero desde cualquier sitio.
    window.addEventListener("keydown", (event) => {
      const focusedIsInput = document.activeElement === heroInput;
      if ((event.key === "`" || event.key === "~") && !focusedIsInput) {
        event.preventDefault();
        const top = document.getElementById("top");
        if (top) top.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
        heroInput.focus();
      }
    });

    playIntro(term);
    return;
  }

  // Modo flotante (resto de páginas): botón + ventana con apertura/cierre.
  if (!toggleBtn || !floatingWindow || !floatingOutput || !floatingInput) return;

  const term = createTerminal({
    outputEl: floatingOutput,
    inputEl: floatingInput,
    onExit: () => closeTerminal(),
  });

  function isOpen() {
    return !floatingWindow.hidden;
  }

  function openTerminal() {
    floatingWindow.hidden = false;
    toggleBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("terminal-open");
    if (term.isEmpty()) {
      term.printLines(["Terminal de acanoman.github.io. Puedes navegar la web con estos comandos:", ""]);
      term.printLines(term.helpLines);
      term.printLines(["", "Escribe cualquiera de ellos y pulsa Enter. Esc o 'exit' para cerrar."]);
    }
    term.focus();
  }

  function closeTerminal() {
    floatingWindow.hidden = true;
    toggleBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("terminal-open");
    toggleBtn.focus();
  }

  toggleBtn.addEventListener("click", () => {
    if (isOpen()) closeTerminal();
    else openTerminal();
  });
  if (closeBtn) closeBtn.addEventListener("click", closeTerminal);

  window.addEventListener("keydown", (event) => {
    const focusedIsInput = document.activeElement === floatingInput;
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
})();
