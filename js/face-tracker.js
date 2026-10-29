// Face-tracker 3D (sección 6 de CLAUDE.md): la cabeza del retrato GIRA hacia el
// cursor como una persona (giro lateral + cabeceo), los ojos se adelantan al
// giro y los hombros se quedan quietos.
//
// Técnica: Three.js (por CDN, ver import map en _layouts/default.html). La
// imagen avatar/assets/alvaro.png se pone sobre una malla muy subdividida y en
// el shader se le da relieve (cráneo, nariz, cuencas de los ojos y cuello)
// calibrado sobre esa imagen. La parte de la cabeza rota en 3D alrededor de la
// base del cuello y se proyecta con perspectiva, así un lado de la cara se
// acerca y el otro se aleja. En reposo la imagen queda idéntica al original.
//
// Límite: es una sola foto frontal con relieve, no un modelo completo. Por eso
// el giro está limitado (~30° lateral, ~15° vertical): más allá se notaría que no hay perfil.
//
// Es un módulo: se ejecuta después de main.js, así que CONFIG ya existe.
// Respeta ENABLE_FACE_TRACKER, prefers-reduced-motion y se detiene cuando no
// es visible o la pestaña está oculta. Si WebGL falla, queda la <img>.

const config = window.CONFIG || {};
const stage = document.querySelector("[data-avatar-3d]");

if (stage && config.ENABLE_FACE_TRACKER) {
  start(stage).catch((error) => {
    console.warn("Face-tracker 3D no disponible, se mantiene la imagen fija.", error);
  });
}

// Puntos de referencia medidos sobre alvaro.png (coordenadas 0-1, y hacia abajo).
// Si se cambia la imagen hay que recalibrar estos valores.
const VERTEX = /* glsl */ `
  uniform float uYaw;
  uniform float uPitch;
  uniform float uBreath;
  varying vec2 vImg;
  varying float vShade;

  // Relieve de la cara en coordenadas de imagen.
  float headDepth(vec2 p) {
    vec2 d = (p - vec2(0.505, 0.33)) / vec2(0.235, 0.335);
    float head = sqrt(max(0.0, 1.0 - dot(d, d))) * 0.15;
    head *= 1.0 - smoothstep(0.56, 0.68, p.y);
    vec2 dn = (p - vec2(0.511, 0.425)) / vec2(0.026, 0.055);
    float nose = exp(-dot(dn, dn)) * 0.035;
    vec2 e1 = (p - vec2(0.4445, 0.352)) / vec2(0.045, 0.022);
    vec2 e2 = (p - vec2(0.573, 0.354)) / vec2(0.045, 0.022);
    float sockets = (exp(-dot(e1, e1)) + exp(-dot(e2, e2))) * 0.010;
    float neckX = 1.0 - smoothstep(0.075, 0.115, abs(p.x - 0.51));
    float neck = neckX * smoothstep(0.50, 0.58, p.y) * (1.0 - smoothstep(0.66, 0.74, p.y)) * 0.07;
    return head + nose - sockets + neck;
  }

  // Cuánto sigue cada punto al giro: 1 en la cabeza, 0 en hombros y pecho.
  float headWeight(vec2 p) {
    float lower = smoothstep(0.47, 0.56, p.y);
    float centre = 1.0 - smoothstep(0.12, 0.19, abs(p.x - 0.51));
    float w = mix(1.0, centre, lower);
    return w * (1.0 - smoothstep(0.58, 0.72, p.y));
  }

  mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
  mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }

  void main() {
    vec2 img = vec2(uv.x, 1.0 - uv.y);
    vImg = img;

    float w = headWeight(img);
    vec3 p = vec3(img.x * 2.0 - 1.0, 1.0 - img.y * 2.0, headDepth(img) * 2.0);

    // Giro alrededor de la base del cuello.
    vec3 pivot = vec3(0.02, -0.28, 0.10);
    mat3 R = rotY(uYaw * w) * rotX(uPitch * w);
    vec3 r = R * (p - pivot) + pivot;
    r.y += uBreath * w;

    // Perspectiva relativa al reposo: sin giro, la imagen es idéntica al original.
    float focal = 3.2;
    vec2 centre = vec2(0.0, 0.3);
    float k = (focal - p.z) / (focal - r.z);
    vec2 xy = centre + (r.xy - centre) * k;

    // Sombreado leve: la mejilla que se aleja se oscurece un poco al girar.
    float e = 0.004;
    float dzdu = (headDepth(img + vec2(e, 0.0)) - headDepth(img - vec2(e, 0.0))) / (2.0 * e);
    float dzdv = (headDepth(img + vec2(0.0, e)) - headDepth(img - vec2(0.0, e))) / (2.0 * e);
    vec3 n = normalize(vec3(-dzdu, dzdv, 1.0));
    vShade = 1.0 + 0.6 * ((R * n).z - n.z);

    gl_Position = vec4(xy * 0.96, -r.z * 0.25, 1.0);
  }
`;

// Mirada y parpadeo: adaptados del componente de avatar original de Álvaro.
const FRAGMENT = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec2 uEyes;
  uniform float uBlink;
  varying vec2 vImg;
  varying float vShade;

  vec2 gaze(vec2 uv, vec2 center, vec2 radius) {
    vec2 d = abs((uv - center) / radius);
    float influence = (1.0 - smoothstep(0.68, 1.0, d.x)) * (1.0 - smoothstep(0.75, 1.0, d.y));
    return clamp(uEyes, vec2(-1.3), vec2(1.3)) * vec2(0.0040, 0.0015) * influence;
  }

  vec4 eyelid(vec4 color, vec2 center, vec2 radius) {
    if (uBlink < 0.001) return color;
    vec2 d = (vImg - center) / radius;
    float inside = 1.0 - smoothstep(0.92, 1.03, dot(d, d));
    float arc = sqrt(max(0.0, 1.0 - d.x * d.x));
    float upper = -arc + uBlink * arc * 1.50;
    float lower = arc - uBlink * arc * 0.50;
    float lidMask = max(1.0 - smoothstep(upper - 0.06, upper + 0.06, d.y),
                        smoothstep(lower - 0.06, lower + 0.06, d.y));
    vec2 skinUV = center + vec2(d.x * radius.x * 0.85, radius.y * (2.65 + d.y * 0.45));
    vec4 skin = texture2D(uTex, skinUV);
    skin.rgb *= 0.80 + 0.10 * (1.0 - d.x * d.x) - 0.08 * d.y;
    float crease = (1.0 - smoothstep(0.02, 0.11, abs(d.y - upper))) * 0.30;
    skin.rgb *= 1.0 - crease;
    return mix(color, vec4(skin.rgb, color.a), inside * lidMask * smoothstep(0.0, 0.12, uBlink));
  }

  void main() {
    vec2 leftEye = vec2(0.4445, 0.3520);
    vec2 rightEye = vec2(0.5730, 0.3540);
    vec2 leftRadius = vec2(0.0330, 0.0124);
    vec2 rightRadius = vec2(0.0320, 0.0120);
    vec2 shift = gaze(vImg, leftEye, leftRadius) + gaze(vImg, rightEye, rightRadius);
    vec4 color = texture2D(uTex, vImg - shift);
    color = eyelid(color, leftEye, leftRadius);
    color = eyelid(color, rightEye, rightRadius);
    if (color.a < 0.03) discard;
    color.rgb *= clamp(vShade, 0.7, 1.15);
    gl_FragColor = color;
  }
`;

const MAX_YAW = 0.55;   // giro lateral máximo (~30°)
const MAX_PITCH = 0.26; // cabeceo máximo (~15°)

async function start(stage) {
  const THREE = await import("three");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const src = stage.getAttribute("data-src");

  const texture = await new THREE.TextureLoader().loadAsync(src);
  // Sin conversión de color: la imagen se pinta tal cual. Coordenadas con y hacia abajo.
  texture.colorSpace = THREE.NoColorSpace;
  texture.flipY = false;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = "avatar-canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");

  const uniforms = {
    uTex: { value: texture },
    uYaw: { value: 0 },
    uPitch: { value: 0 },
    uBreath: { value: 0 },
    uEyes: { value: new THREE.Vector2() },
    uBlink: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
  });

  // La posición se calcula en el shader: la cámara no interviene.
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 180, 180), material);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  function resize() {
    const size = Math.max(1, Math.round(Math.min(stage.clientWidth, stage.clientHeight)));
    renderer.setSize(size, size, false);
  }
  resize();
  stage.appendChild(renderer.domElement);

  const draw = () => renderer.render(scene, camera);

  // --- Seguimiento del cursor ---
  const target = { x: 0, y: 0 };
  const head = { x: 0, y: 0 };
  const eyes = { x: 0, y: 0 };
  let lastInteraction = -Infinity;

  if (!isTouch) {
    window.addEventListener("mousemove", (event) => {
      const rect = stage.getBoundingClientRect();
      // Centro de referencia a la altura de los ojos, no del marco.
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.36;
      target.x = Math.max(-1, Math.min(1, (event.clientX - cx) / (window.innerWidth * 0.45)));
      target.y = Math.max(-1, Math.min(1, (event.clientY - cy) / (window.innerHeight * 0.45)));
      lastInteraction = performance.now();
    }, { passive: true });
    document.addEventListener("mouseleave", () => { lastInteraction = -Infinity; });
  }

  // Primer frame en reposo; ya se puede ocultar la imagen de respaldo.
  draw();
  stage.classList.add("is-3d");
  if (reduceMotion) return; // accesibilidad: retrato quieto

  let raf = 0;
  let lastTime = 0;
  let nextBlink = performance.now() + 2500 + Math.random() * 2500;
  let blinkStart = 0;

  function tick(now) {
    const dt = Math.min((now - (lastTime || now - 16)) / 1000, 0.05);
    lastTime = now;

    // Sin cursor durante un rato: pequeño movimiento de reposo.
    const active = now - lastInteraction < 15000;
    const tx = active ? target.x : Math.sin(now * 0.00035) * 0.18;
    const ty = active ? target.y : Math.sin(now * 0.0005) * 0.08;

    // La cabeza va algo más lenta que los ojos, como una persona.
    const headDamp = 1 - Math.exp(-dt * 5);
    const eyeDamp = 1 - Math.exp(-dt * 14);
    head.x += (tx - head.x) * headDamp;
    head.y += (ty - head.y) * headDamp;
    eyes.x += (tx - eyes.x) * eyeDamp;
    eyes.y += (ty - eyes.y) * eyeDamp;

    let blink = 0;
    if (!blinkStart && now > nextBlink) blinkStart = now;
    if (blinkStart) {
      const p = (now - blinkStart) / 180;
      if (p >= 1) { blinkStart = 0; nextBlink = now + 3000 + Math.random() * 3500; }
      else blink = Math.pow(Math.sin(p * Math.PI), 0.8);
    }

    uniforms.uYaw.value = head.x * MAX_YAW;
    uniforms.uPitch.value = head.y * MAX_PITCH;
    uniforms.uEyes.value.set(eyes.x, eyes.y);
    uniforms.uBlink.value = blink;
    uniforms.uBreath.value = Math.sin(now * 0.0014) * 0.004;
    draw();
    raf = requestAnimationFrame(tick);
  }

  // Solo anima cuando se ve y la pestaña está activa.
  let visible = true;
  const sync = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    lastTime = 0;
    if (visible && !document.hidden) raf = requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; sync(); }).observe(stage);
  }
  document.addEventListener("visibilitychange", sync);
  if ("ResizeObserver" in window) new ResizeObserver(() => { resize(); draw(); }).observe(stage);
  sync();
}
