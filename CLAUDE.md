# CLAUDE.md — Proyecto web personal de Álvaro Cano

> Este archivo es el contexto y las instrucciones para la IA (Claude Code) en VS Code.
> Se lee automáticamente al abrir el proyecto. Trabaja SIEMPRE siguiendo lo que pone aquí.
> Si algo no está claro, pregúntame antes de inventar.

---

## 0. Qué estamos construyendo (resumen de una frase)

Mi web personal (portfolio de ciberseguridad ofensiva) en **acanoman.github.io**, rediseñada de cero con estética **cyber / militar / terminal hacker**, que se pueda recorrer **de dos formas**: navegando por secciones con scroll clásico, **y** tecleando comandos en una **terminal simulada** incrustada en la propia web.

- Repo GitHub: `https://github.com/acanoman/acanoman.github.io`
- Web publicada: `https://acanoman.github.io/`
- Se publica sola por **GitHub Pages** al hacer push a la rama `master` (ver sección 9).

---

## 1. Sobre mí (contenido real para la web)

- **Nombre:** Álvaro Cano Mantero
- **Rol:** Cybersecurity Engineer, orientado a **seguridad ofensiva** (pentester / red team / hacker ético).
- **Certificaciones:** OSCP+ (OSCP), eJPTv2, CJCA.
- **Experiencia:** 8 años como IT Security & Cloud Engineer.
- **Especialidades:** ataques a Active Directory (Kerberoasting, ADCS, abuso de ACLs, NTLM relay), pivoting, seguridad cloud (AWS).
- **Idea que me define:** "romper las cosas para entender cómo funcionan".
- **Ubicación:** Madrid, España.

> ⚠️ El contenido se irá añadiendo **poco a poco**. No rellenes con datos inventados (ni emails, ni teléfonos, ni enlaces falsos). Si falta un dato, deja un placeholder claro tipo `<!-- TODO: email -->` y pregúntame.

---

## 2. Estética y dirección de arte (lo más importante)

Objetivo: que quede **moderna, oscura, "cyberdefensa", con movimiento**, pero **legible y rápida**. Nada de recargar hasta que no se lea.

### Paleta
- Fondo base: negro / casi negro (`#0a0e0a` o similar, verde muy desaturado).
- Acento principal: **verde militar / verde fósforo** (`#39ff14` o `#4ade80`, a definir).
- Acento secundario: ámbar (`#ffb000`) para alertas/detalles tipo HUD.
- Texto: gris claro (`#c8d6c8`), nunca blanco puro.
- Estados: OK en verde, warning en ámbar, error en rojo (`#ff3b3b`).

### Tipografía
- Monoespaciada para todo lo "terminal/código": **JetBrains Mono** o **IBM Plex Mono** (Google Fonts).
- Una sans para texto largo si hace falta: **Inter** o **Space Grotesk**.

### Elementos de estilo que SÍ quiero (todos opcionales de activar, ver sección 7)

- **Cursor de mira (crosshair)** a pantalla completa que sigue al ratón, con dos líneas (horizontal + vertical) y **coordenadas X/Y en vivo** en una esquina. Toque militar.
- **Terminal simulada** incrustada para navegar la web por comandos.
- **Boot screen** inicial al cargar: texto tipo `INITIALIZING SECURE CHANNEL...` con efecto de descifrado/tecleo, breve (no más de 2 s, con opción de saltar).
- **Marcos HUD** con esquinas cortadas (clip-path) para las tarjetas de secciones.
- **Scanlines** sutiles y ruido/grano muy ligero encima de todo (baja opacidad).
- **Efecto "cara que sigue al ratón"**: un retrato mío estilo hacker con capucha que mira hacia donde está el cursor (ver sección 6, es un apartado especial).
- Animaciones al hacer scroll (reveal suave de cada sección).
- Micro-glitch ocasional en títulos (muy sutil).

### Reglas de buen gusto (obligatorias)

- **Accesibilidad:** respeta `prefers-reduced-motion` → si el usuario lo tiene activado, desactiva mira animada, glitch, boot screen y partículas.
- **Rendimiento:** nada de 10 librerías pesadas. Prioriza CSS puro y JS vanilla. Librerías solo por CDN y solo si aportan mucho.
- **Responsive:** en móvil, el cursor de mira se desactiva (no hay ratón) y la terminal pasa a un modo más simple. Todo legible a 360 px de ancho.
- No tapar el contenido con los efectos: los efectos van en capas `pointer-events: none` por encima.

### Referencias visuales (de dónde sacamos ideas — inspiración, NO copiar tal cual)
- Terminal navegable: `https://www.framer.com/marketplace/templates/prompt-os/` y tutorial `https://www.freecodecamp.org/news/how-to-create-an-interactive-terminal-portfolio-website/`
- Cursor de mira con distorsión: `https://tympanus.net/codrops/2021/05/26/how-to-code-a-crosshair-mouse-cursor-with-distortion-hover-effect/` y `https://yuzuyyy.framer.website/crosshair` (de aquí: líneas finas + coordenadas X/Y + estilos de línea).
- HUD / sci-fi / efectos de descifrado de texto y marcos: estética tipo **Arwes** (`https://arwes.dev/`) y **eDEX-UI** (`https://github.com/GitSquared/edex-ui`, inspiración visual únicamente; es software de escritorio con licencia GPLv3, NO copiar su código).
- Portfolio de dev con cara/objeto que sigue al ratón y animaciones de scroll: `https://www.stephanewillems.be/`.

> ⚠️ **Propiedad intelectual:** cogemos ideas, layout y tipos de efecto, pero el código lo escribes tú desde cero. No copies logos, textos, imágenes ni bloques de código de esos sitios. Si reutilizas un snippet de un repo con licencia (p. ej. el face-looker MIT), respeta la licencia e inclúyela.

---

## 3. Arquitectura del proyecto (stack y estructura)

**Stack:** HTML + CSS + JavaScript **vanilla**. Sin framework, sin build step, sin Node necesario para que funcione. Debe poder abrirse con Live Server y publicarse en GitHub Pages sin compilar.

> Motivo: GitHub Pages sirve estáticos directamente y así cualquier cambio es instantáneo. Si en el futuro quiero algo más, ya lo valoramos; de momento **no** metas React/Vite/bundlers.

**⚠️ Realidad del repo (corregido el 23/10/2026):** el sitio usa **Jekyll**, que GitHub Pages compila solo al hacer push (no hace falta compilar nada en local). La cabecera, nav, footer, CSS y scripts viven en `_layouts/default.html`; `index.html` y los posts solo aportan su contenido con front matter (`--- layout: default ---`). Consecuencias:

- **NO crear `.nojekyll`**: desactivaría Jekyll y la web saldría sin plantilla ni estilos.
- Abrir `index.html` con Live Server **no** muestra la web real (no aplica la plantilla). Para verla: publicar en `master`, o instalar Ruby + Jekyll y usar `bundle exec jekyll serve`.
- Los posts están en `_posts/` y usan `_layouts/post.html`.

Estructura de carpetas objetivo:

```
acanoman.github.io/
├── index.html              # Home (todas las secciones, scroll)
├── css/
│   ├── reset.css           # Normalize/reset mínimo
│   ├── variables.css       # Tokens: colores, fuentes, espaciados (:root)
│   ├── style.css           # Estilos globales y secciones
│   └── effects.css         # Mira, scanlines, HUD, glitch, boot screen
├── js/
│   ├── main.js             # Arranque, navegación, reveal on scroll
│   ├── crosshair.js        # Cursor de mira + coordenadas X/Y
│   ├── terminal.js         # Terminal simulada y sus comandos
│   ├── boot.js             # Pantalla de arranque inicial
│   └── face-tracker.js     # Cara que sigue al ratón (ver sección 6)
├── apuntes/
│   └── index.html          # Mis apuntes, con los MISMOS estilos de la web
├── assets/
│   ├── img/                # Imágenes (incluida la cara generada)
│   └── faces/              # Rejilla de imágenes del face-tracker
├── _layouts/               # Plantillas Jekyll (default, post, page)
├── _posts/                 # Artículos del blog
└── README.md
```

Reglas de código:
- Indentación 2 espacios. Nombres de clases en `kebab-case`. Nada de `!important` salvo imprescindible.
- CSS: define TODOS los colores/fuentes/espaciados como variables en `css/variables.css` (`:root`). No pongas colores a pelo repartidos por el código.
- JS: cada efecto en su archivo, bien separado. Comentarios en español, breves.
- Cada efecto "caro" (mira, boot, glitch, partículas, face-tracker) debe poder **activarse/desactivarse** con una constante al principio de su archivo o un flag en `main.js` (ver sección 7).
- HTML semántico (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`).

---

## 4. Secciones de la web (contenido)

La home es una sola página con scroll. Secciones, en orden:

1. **Hero / Inicio** — Nombre, rol, una línea de impacto. Efecto de tecleo tipo `whoami` → `Álvaro Cano | OSCP+ | Red Team`. Botón o pista para abrir la terminal.
2. **Sobre mí** — Breve bio (datos de la sección 1).
3. **Certificaciones** — Tarjetas HUD: OSCP+, eJPTv2, CJCA. (Más adelante añadiré logos/enlaces verificables.)
4. **Skills / Arsenal** — Áreas: Active Directory, Pivoting, Cloud (AWS), etc. Estilo "módulos de misión".
5. **Proyectos** — Empezaremos con los que yo te vaya pasando. (Deja la sección montada y un placeholder.)
6. **Apuntes** — Enlace a `/apuntes/` + resumen. Los apuntes usan los mismos estilos.
7. **Contacto** — Placeholder hasta que yo decida qué datos poner (LinkedIn, GitHub, email). NO inventes.

> Monta la estructura de las 7 secciones aunque algunas queden con placeholder. Vamos rellenando poco a poco.

---

## 5. Terminal simulada (requisito estrella)

Una ventana de terminal dentro de la web desde la que se pueda **navegar e interactuar**.

Requisitos:
- Se abre/cierra con un botón visible y con una tecla (p. ej. `` ` `` o `~`). Debe poder cerrarse con `Esc` o comando `exit`.
- Prompt estilo: `visitor@acano:~$`.
- Historial de comandos con flechas ↑ / ↓.
- Autocompletado con `TAB` (al menos de los comandos existentes).
- Salida con pequeño efecto de tecleo (rápido, que no desespere).
- Si se puede, que recuerde el historial de la sesión (sin librerías; en memoria vale, o `localStorage` envuelto en try/catch).

Comandos mínimos a implementar:
- `help` — lista de comandos.
- `whoami` — resumen de quién soy.
- `ls` — lista las secciones navegables.
- `cd <seccion>` / `goto <seccion>` — hace scroll a esa sección de la web.
- `cat <seccion>` — muestra en la terminal el texto de esa sección.
- `certs` — lista certificaciones.
- `skills` — lista áreas de especialidad.
- `apuntes` — abre `/apuntes/`.
- `contact` — muestra datos de contacto (placeholder por ahora).
- `clear` — limpia la terminal.
- `theme` — (opcional) cambia entre un par de paletas.
- Easter egg: `sudo rm -rf /` → responde con un glitch de broma y un "nice try 🙂", sin hacer nada.

Comportamiento: la terminal es una **capa de navegación alternativa**, no sustituye al scroll. Las dos formas (scroll y terminal) deben funcionar.

---

## 6. Face-tracker (la cara que sigue al ratón) — apartado especial

Quiero un **retrato mío estilo hacker con capucha** que **mire hacia donde está el cursor**, como el efecto de `stephanewillems.be` / los "face looker".

Cómo funciona la técnica (vanilla, sin framework):
- Se usa una **rejilla de imágenes** del mismo rostro mirando en distintas direcciones (arriba, abajo, izquierda, derecha y diagonales).
- Un script mapea la posición del ratón a coordenadas normalizadas y **cambia la imagen** a la que corresponde a esa dirección.
- Referencia técnica (MIT, se puede reutilizar respetando licencia): `https://github.com/fofr/face_looker`. Convención de nombres de archivo del tipo `gaze_px{X}_py{Y}_{SIZE}.webp`, con `X,Y` de -15 a 15 en pasos de 3, tamaño 256. Las imágenes van en `assets/faces/`.

Plan de implementación (hazlo en este orden y pregúntame en el paso de la foto):
1. **Primero** monta el `face-tracker.js` y el HTML/CSS con una **rejilla de imágenes placeholder** (puede ser una cara neutra de relleno o incluso cuadrados numerados por dirección) para que el mecanismo funcione.
2. Déjalo **detrás de un flag** `ENABLE_FACE_TRACKER` (ver sección 7), desactivable.
3. Cuando el mecanismo funcione, **pregúntame por la foto real**. Yo te daré una foto; la convertiremos al estilo hacker-con-capucha y generaremos la rejilla. **No subas ni publiques ninguna foto mía sin que yo lo confirme.**
4. Estilo: el retrato va integrado en el Hero o en "Sobre mí", con marco HUD, encajando en la paleta (puede ir con un tratamiento verde/monocromo para que combine).

> Importante: no generes ni inventes una cara que pretenda ser yo. Usa placeholder hasta que te pase mi imagen y te dé el OK.

---

## 7. Flags de activación (para ir probando efectos sin romper nada)

Al principio de `js/main.js` define un objeto de configuración para encender/apagar efectos fácilmente. Cada efecto respeta su flag Y `prefers-reduced-motion`.

```js
const CONFIG = {
  ENABLE_BOOT_SCREEN: true,
  ENABLE_CROSSHAIR: true,     // mira + coordenadas X/Y
  ENABLE_TERMINAL: true,
  ENABLE_SCANLINES: true,
  ENABLE_GLITCH: true,
  ENABLE_FACE_TRACKER: false, // se activa cuando haya foto real
  ENABLE_PARTICLES: false,    // opcional, de inicio apagado
};
```

Si `prefers-reduced-motion: reduce` está activo, fuerza a `false` los efectos de movimiento, pase lo que pase el CONFIG.

---

## 8. Cómo quiero trabajar contigo (flujo de trabajo)

Trabajamos por **fases pequeñas**. No lo hagas todo de una vez. Orden sugerido:

- **Fase 0 — Base:** estructura de carpetas, `variables.css`, reset, `index.html` con las 7 secciones (contenido real de la sección 1 + placeholders), navegación y reveal on scroll. Sin efectos todavía. Que se vea limpio y oscuro.
- **Fase 1 — Crosshair:** cursor de mira + coordenadas X/Y, con su flag.
- **Fase 2 — Terminal:** terminal simulada con los comandos de la sección 5.
- **Fase 3 — HUD + boot + scanlines + glitch:** la capa estética.
- **Fase 4 — Apuntes:** adaptar mi HTML de apuntes a los estilos de la web (ver sección 10).
- **Fase 5 — Face-tracker:** primero placeholder, luego mi foto.
- **Fase 6 — Pulido:** responsive, accesibilidad, rendimiento, revisión final.

Reglas del flujo:
- Al empezar una fase, dime en 2 líneas qué vas a hacer. Al terminarla, dime qué archivos tocaste y cómo lo pruebo.
- Después de cada fase, **haz commit** (y push si te lo pido) con un mensaje claro. Mensajes de commit en español, cortos y descriptivos (p. ej. `feat: terminal simulada con comandos básicos`).
- Trabaja en una rama aparte (ver sección 9) hasta que yo diga de publicar.
- Si vas a instalar/añadir una librería por CDN, dímelo antes y por qué.
- No borres contenido mío sin avisar.
- Pruebas: como el sitio usa Jekyll (ver sección 3), cada fase se ve publicándola en `master` (previa confirmación) o con `bundle exec jekyll serve` si hay Jekyll instalado en local.

---

## 9. Git y publicación (GitHub Pages)

La web se publica sola al hacer push a `master`. Flujo:

1. Rediseñamos en la rama `rediseno` (o la que acordemos), no directamente en `master`.
2. (Opcional) copia de seguridad de lo viejo: `git branch web-antigua` antes de borrar.
3. Cuando el rediseño esté listo y yo dé el OK, lo pasamos a `master`:
   ```bash
   git checkout master
   git merge rediseno
   git push
   ```
4. En 1–2 minutos se actualiza `https://acanoman.github.io/`.

Requisitos para que Pages funcione:
- El archivo principal debe llamarse `index.html` y estar en la raíz del repo.
- **No** debe existir `.nojekyll`: el sitio necesita que GitHub lo procese con Jekyll (ver sección 3).
- Settings → Pages del repo debe apuntar a la rama publicada (`master`) y carpeta `/ (root)`.

Comandos de commit/push que puedes usar:
```bash
git add -A
git commit -m "mensaje claro en español"
git push
```

> Antes de hacer `push` a `master` o un `merge` a `master`, confírmamelo. En ramas de trabajo puedes commitear con libertad.

---

## 10. Apuntes (integrarlos con los estilos de la web)

Tengo mis apuntes en un archivo HTML. Objetivo: que vivan en `/apuntes/` y usen **los mismos estilos** que la web.

Cuando te pase el HTML de los apuntes:
- Quítale cualquier `<style>` propio y enlázalo a `../css/style.css` (+ `variables.css`, `effects.css` si aplica).
- Envuélvelo en la misma cabecera/nav/footer que la home para que sea coherente.
- Añade: índice lateral fijo (tabla de contenidos navegable), buscador simple dentro de la página, y botón de "copiar" en los bloques de código.
- Respeta el contenido tal cual: no reescribas mis apuntes, solo adáptales el formato y el estilo.

---

## 11. Cosas que NO debes hacer (recordatorio)

- ❌ No inventes datos personales míos (emails, teléfonos, enlaces, logros). Usa `<!-- TODO -->` y pregunta.
- ❌ No publiques ni subas ninguna foto mía sin mi OK explícito.
- ❌ No copies código/diseño/logos de las webs de referencia. Inspiración sí, copia no.
- ❌ No metas frameworks ni build step sin acordarlo.
- ❌ No hagas push/merge a `master` sin confirmarlo conmigo.
- ❌ No sacrifiques legibilidad ni rendimiento por un efecto bonito.

---

## 12. Cómo arrancar (para la IA, primer mensaje)

Cuando yo te diga de empezar, arranca por la **Fase 0** de la sección 8: crea la estructura de carpetas, los CSS base con las variables de la paleta (sección 2), y el `index.html` con las 7 secciones (sección 4) usando mi contenido real de la sección 1 y placeholders donde falte. Déjalo oscuro, limpio y responsive, sin efectos todavía. Luego me dices cómo verlo con Live Server y pasamos a la Fase 1.

---

## 13. Recetas de efectos (ingeniería inversa)

> Chuleta de **técnica**, no de código. Método y concepto, para implementar todo en vanilla JS/CSS desde cero. Las fuentes con licencia permisiva se citan explícitamente; el resto es "mirar y entender el efecto", nunca copiar.

### Crosshair (mira con coordenadas X/Y)

- **Técnica:** dos elementos `position: fixed` a pantalla completa (uno `width:100%; height:1px`, otro `width:1px; height:100%`), movidos con `transform: translate()` en un listener de `mousemove`. Las coordenadas se pintan en un `<span>` en una esquina, actualizado con el mismo evento. Para que no haya tirón, se guarda la última posición en el handler y se aplica el `transform` dentro de un bucle `requestAnimationFrame`, para no repintar más veces de las que el navegador puede pintar.
- **Cómo replicarlo:** capa `position: fixed; inset:0; pointer-events:none; z-index: alto`. Dentro, las dos líneas con `background: var(--accent)`. En JS, un listener de `mousemove` solo guarda `lastX`/`lastY`; un bucle `requestAnimationFrame` separado lee esas variables en cada frame, aplica `style.transform` a cada línea (`translateX(lastX + 'px')` / `translateY(lastY + 'px')`) y escribe el texto `X: lastX Y: lastY` en el span de coordenadas. Ocultar cursor real con `body.crosshair-active { cursor: none }` solo mientras el flag está activo y no es `prefers-reduced-motion` ni móvil (`matchMedia('(pointer: coarse)')`).
- **Fuente:** concepto general de crosshair cursors tipo "precision cursor" (Framer Crosshair Cursor Pro, yuzuyyy.framer.website) — líneas finas + coordenadas en vivo en una esquina; técnica estándar de la categoría (CSS transforms + mousemove), no hay código público reutilizable, solo el patrón visual.

### Terminal simulada

- **Técnica:** un `<input>` (o `contenteditable`) que captura el texto, un `<div>` de salida donde se van añadiendo líneas, y un array en memoria (+ `localStorage` opcional) como historial. Al pulsar `Enter` se parsea la primera palabra como comando y el resto como argumentos, se busca en un objeto `{comando: función}` y se imprime el resultado. Las flechas ↑/↓ recorren el array de historial sustituyendo el valor del input. `Tab` compara el texto actual con las claves del objeto de comandos y autocompleta si hay un único match.
- **Cómo replicarlo:** sin librerías (el artículo de freeCodeCamp usa jQuery Terminal, que ya trae historial/autocompletado integrados, pero el CLAUDE.md pide vanilla). Objeto `COMMANDS = { help: () => '...', whoami: () => '...', cd: (arg) => scrollToSection(arg) }`. Efecto de tecleo en la salida: pintar el string carácter a carácter con `setInterval`/`setTimeout` corto (30-50ms) en vez de insertarlo entero.
- **Fuente:** patrón general de "terminal portfolio" (freeCodeCamp, PromptOS de Framer) — estructura input+output+historial+commands map. No se reutiliza código, es el patrón de cualquier REPL simple en el navegador.

### Boot screen

- **Técnica:** overlay `position: fixed` a pantalla completa, fondo negro, con un bloque de texto que se revela progresivamente (efecto "typewriter" o "decrypt": letras aleatorias que van convergiendo al texto final). Se desactiva solo o con cualquier tecla/click, y tiene un timeout máximo.
- **Cómo replicarlo:** JS que, para cada línea, va sustituyendo caracteres por aleatorios durante unos frames y luego fija el carácter correcto (efecto "descifrado" tipo Arwes `Animator`/`Text` con `decipher`). Con `setInterval` a ~40ms recorriendo el string e intercalando símbolos random (`!<>-_\/[]{}—=+*^?#`) antes de fijar la letra real. Al terminar (o al pulsar una tecla / pasar 2s), `overlay.remove()` o `display:none`.
- **Fuente:** estética general de Arwes (arwes.dev) — texto con efecto "cipher/decipher" y paneles con entrada animada. Técnica documentada en su concepto (no en código consultado, por bloqueo de red); es un patrón conocido de "decryption text effect" que se puede montar con `setInterval` + sustitución de caracteres, sin dependencia.

### Glitch (micro-glitch en títulos)

- **Técnica:** combinación de `clip-path` o `text-shadow` duplicado en dos capas (`::before`/`::after`) con un desplazamiento de 1-2px en direcciones opuestas y colores desfasados (rojo/cian tipo aberración cromática), activado en una animación `@keyframes` muy corta y poco frecuente (se dispara cada X segundos, no en bucle constante) para que sea "ocasional" y no moleste.
- **Cómo replicarlo:** en CSS, el título tiene `position: relative`, y los pseudo-elementos `::before`/`::after` repiten el mismo texto (`content: attr(data-text)`) con `position:absolute`, `clip-path: polygon(...)` recortando franjas horizontales, y una animación que cambia `clip-path` y `transform: translate()` en pasos bruscos (`steps()`) durante 150-300ms. Disparar la clase `.glitching` con `setInterval` aleatorio (cada 4-10s) desde JS, y quitarla al terminar la animación.
- **Fuente:** técnica CSS estándar de "glitch text effect" (muy documentada en CSS-Tricks/Codrops en términos generales), no ligada a una web concreta del listado.

### Scanlines + ruido

- **Técnica:** capa `position: fixed; inset:0; pointer-events:none` encima de todo, con un fondo repetido de líneas horizontales semitransparentes (`repeating-linear-gradient`) para las scanlines, y opcionalmente una textura de ruido (PNG/SVG con `<feTurbulence>` o un `background-image` base64 muy ligero) con `opacity` baja (`0.03-0.06`) y `mix-blend-mode: overlay` para que no tape el contenido.
- **Cómo replicarlo:** todo en CSS puro, sin JS. `background: repeating-linear-gradient(0deg, rgba(0,0,0,.15) 0px, rgba(0,0,0,.15) 1px, transparent 1px, transparent 2px)`. El ruido se puede generar con un `<svg>` inline con filtro `feTurbulence type="fractalNoise"` puesto como `background-image: url("data:image/svg+xml,...")`.
- **Fuente:** estética CRT/HUD genérica (eDEX-UI, Arwes) — técnica estándar de `repeating-linear-gradient` para scanlines, ampliamente documentada, no específica de ningún repo.

### HUD (marcos con esquinas cortadas)

- **Técnica:** tarjetas con `clip-path: polygon(...)` que recortan las esquinas en diagonal, más un borde dibujado con `background` en capas o pseudo-elementos para simular el marco "cortado" con línea, en vez de un `border` normal (que no sigue el `clip-path`).
- **Cómo replicarlo:** `.hud-card { clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px); }`. Para el borde visible, o bien un segundo elemento detrás con el mismo `clip-path` y 1-2px más grande (efecto "doble capa"), o `border-image`/`box-shadow` combinados. Esquinas con pequeñas líneas decorativas: `::before`/`::after` con `border-top`/`border-left` cortos posicionados en las esquinas.
- **Fuente:** estética general de paneles sci-fi/HUD (Arwes `FrameCorners`, eDEX-UI) — patrón de "cut corner panel" con `clip-path`, muy estándar, sin código reutilizado.

### Face-tracker (cara que sigue al ratón)

- **Técnica (MIT, fofr/face_looker):** una rejilla de imágenes pre-renderizadas del mismo rostro mirando en distintas direcciones, nombradas `gaze_px{X}_py{Y}_{SIZE}.webp` con X e Y de -15 a 15 en pasos de 3 (tamaño 256px; `gaze_px0_py0_256.webp` es el centro). El script normaliza la posición del ratón respecto al elemento a un rango [-1, 1], la escala al rango de la rejilla, redondea al múltiplo de `STEP` más cercano, y construye el nombre de archivo correspondiente para cambiar el `src`/`background-image`.
- **Cómo replicarlo:** constantes `P_MIN=-15, P_MAX=15, STEP=3, SIZE=256` (igual que el original, licencia MIT permite reutilizar el esquema). En `mousemove`, calcular `dx = (e.clientX - centroEl.x) / (window.innerWidth/2)` clamped a [-1,1], multiplicar por `P_MAX`, redondear al múltiplo de `STEP` más cercano (`Math.round(v / STEP) * STEP`, no truncar), y montar `gaze_px${x}_py${y}_${SIZE}.webp` (ojo: para Y negativo el repo usa el prefijo `m`, p. ej. `py-15` se escribe `pym15`, no `py-15`). Empezar con una rejilla placeholder (cuadrados numerados por dirección) antes de tener la foto real.
- **Fuente:** `github.com/fofr/face_looker`, licencia MIT — se reutiliza el esquema de nombres y la lógica de mapeo citando la licencia; no se reutilizan assets ni imágenes.
- **Decisión frente a la alternativa 3D:** la ficha de [Awwwards de stephanewillems.be](https://www.awwwards.com/sites/stephane-willems-developer) lo etiqueta como "3D", lo que indica que su personaje es muy probablemente un modelo 3D con Three.js/WebGL cuya cabeza gira de forma continua hacia el cursor (técnica documentada en tutoriales públicos como el de [Codrops](https://tympanus.net/codrops/2019/10/14/how-to-create-an-interactive-3d-character-with-three-js/) o [Wael Yasmina](https://waelyasmina.net/articles/how-to-make-a-models-head-follow-the-cursor-in-three-js/)), no una rejilla de imágenes 2D.

- **✅ SOLUCIÓN ACTUAL (29/10/2026): Three.js con relieve sobre la imagen.** Álvaro pidió que la cabeza **gire** como una persona (no que se incline de lado) y aprobó usar Three.js. `js/face-tracker.js` (módulo ES) carga Three.js `0.169.0` por CDN mediante un import map en `_layouts/default.html`. Pone `avatar/assets/alvaro.png` sobre una malla muy subdividida y, en el vertex shader, le da relieve procedural calibrado a esa imagen (cráneo con perfil suave (smoothstep, sin pendiente en el borde para no estirar orejas ni sienes), nariz, cuencas de los ojos, cuello). La zona de la cabeza rota en 3D alrededor de la base del cuello (~23° lateral, ~11° vertical) con perspectiva relativa al reposo, de modo que sin giro la imagen es idéntica al original; hombros y pecho tienen peso 0 y no se mueven. Los ojos se adelantan al giro y se conservan parpadeo y respiración (adaptados del componente original). Respeta `ENABLE_FACE_TRACKER`, `prefers-reduced-motion` (pinta el retrato quieto) y si WebGL falla queda la `<img>` de respaldo. Verificado en Chrome headless en las cinco poses y a tamaño grande en la unión del cuello.
  - **Límite:** sigue siendo una sola foto frontal con relieve inventado, no un escaneo ni un modelo completo: no hay perfil real, por eso el giro está limitado. Si algún día hay un modelo `.glb` real de su cabeza, se puede cargar con `GLTFLoader` en el mismo archivo.
  - Si se cambia la imagen, hay que recalibrar las coordenadas del relieve y de los ojos en los shaders.

- **Solución anterior (23/10/2026), ya sustituida:** ni rejilla 2D ni Three.js. Álvaro aportó un mini proyecto con un avatar ya generado (su rostro en estilo CGI, generado con IA a partir de su foto) y un **Web Component propio sin dependencias**: `avatar/avatar-alvaro.js` + `avatar/assets/alvaro.png`. Es un efecto **2.5D en WebGL 1 puro** (vanilla, sin librerías, sin CDN): una sola ilustración sobre una malla de triángulos a la que se aplica una rotación/traslación rígida leve (±~1.5°) para inclinar la cabeza, más un desplazamiento independiente de las pupilas, hacia la posición del cursor. Incluye parpadeo, respiración, reposo, soporte táctil y teclado, y respeta `prefers-reduced-motion`. Encaja con las reglas del proyecto (vanilla, ligero) y da un movimiento fluido sin modelo 3D.
  - **Integración:** el componente se carga en `_layouts/default.html` y se coloca `<alvaro-avatar>` dentro del marco HUD del hero en `index.html`, con un `<img>` interno de respaldo. `js/face-tracker.js` solo aplica el flag `ENABLE_FACE_TRACKER` (si es `false`, pausa el avatar). El material original del mini proyecto está en `_entrada/` (ignorado por git, no se publica).
  - **Límite:** es 2.5D, no gira a perfil completo; el movimiento es deliberadamente sutil para conservar el aspecto de la ilustración. La imagen es una interpretación CGI, no una foto real (la foto original no se distribuye).
  - Las recetas de la rejilla `face_looker` de arriba se conservan solo como referencia histórica de la técnica alternativa.

### Reveal on scroll / parallax sutil

- **Técnica:** `IntersectionObserver` sobre cada `<section>`/tarjeta, que añade una clase (`.is-visible`) cuando el elemento entra en el viewport; la animación en sí (fade + translateY) va en CSS mediante `transition`, no en JS.
- **Cómo replicarlo:** `const obs = new IntersectionObserver(entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('is-visible')), { threshold: 0.15 })`, aplicado a `document.querySelectorAll('.reveal')`. En CSS, `.reveal { opacity:0; transform: translateY(16px); transition: opacity .5s, transform .5s } .reveal.is-visible { opacity:1; transform:none }`.
- **Fuente:** patrón estándar de "scroll reveal" (inspirado en el tipo de animación de stephanewillems.be, que no pudo inspeccionarse en detalle por bloqueo de red), técnica genérica y muy documentada con `IntersectionObserver`.

> **Nota sobre el acceso a las webs de referencia:** codrops (crosshair con distorsión) y arwes.dev devolvieron error de red/403 al intentar inspeccionarlas en esta sesión. `stephanewillems.be` sí respondió, pero es una SPA que pinta todo por JavaScript del lado del cliente; la herramienta de fetch solo trae el HTML inicial (pantalla de "Loading...") sin ejecutar el script, así que no pude ver el efecto real del personaje que sigue al ratón. Para estas tres, la receta se basa en el patrón general y conocido de ese tipo de efecto, no en una lectura directa de su código o comportamiento real. Si me pasas capturas de pantalla o grabas cómo se mueve el personaje al mover el ratón, puedo afinar la receta con eso.
