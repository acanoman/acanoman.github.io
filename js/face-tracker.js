// Face-tracker 3D (sección 6 de CLAUDE.md): busto oscuro de estética low-poly
// con iluminación fría. Solo GIRA la cabeza hacia el cursor (giro lateral +
// cabeceo); los hombros se quedan quietos. Sin parpadeo ni movimiento de ojos.
//
// Técnica: Three.js (por CDN, ver import map en _layouts/default.html). La
// imagen avatar/assets/alvaro.png se pone sobre una malla y en el vertex shader
// se le da relieve (cráneo, cejas, pómulos, nariz, cuello y torso) calibrado
// sobre esa imagen. La cabeza rota en 3D alrededor de la base del cuello con
// perspectiva relativa al reposo. En el fragment shader cada triángulo se
// sombrea plano (facetas low-poly) con luces fijas de la escena: al girar, la
// luz y las sombras se mueven sobre la cara, que es lo que vende el giro.
//
// Límite: es una sola foto frontal con relieve, no un modelo completo. Por eso
// el giro está limitado (~23° lateral, ~11° vertical): más allá se notaría que no hay perfil.
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

// Aspecto: luces de la escena (dirección hacia la luz, en espacio de la cámara:
// x derecha, y arriba, z hacia el espectador) y tratamiento del color.
const LOOK = {
  segments: 34,            // resolución de la malla: menos = facetas más grandes
  facet: 0.65,             // 0 = superficie lisa, 1 = facetas planas puras
  jitter: 0.42,            // desorden de vértices: triángulos irregulares, no cuadrícula
  ambient: [0.05, 0.06, 0.09],
  keyDir: [-0.6, 0.62, 0.48],    // luz principal fría, arriba a la izquierda
  keyColor: [0.40, 0.55, 0.92],
  rimDir: [0.95, 0.15, 0.25],    // contraluz rasante por la derecha
  rimColor: [0.06, 0.55, 0.48],
  fillColor: [0.08, 0.10, 0.18], // relleno muy suave desde abajo
  desaturate: 0.5,         // quita parte del color de la foto
  exposure: 1.05,
};

// Puntos de referencia medidos sobre alvaro.png (coordenadas 0-1, y hacia abajo).
// Si se cambia la imagen hay que recalibrar estos valores.
const VERTEX = /* glsl */ `
  uniform float uYaw;
  uniform float uPitch;
  varying vec2 vImg;
  varying vec3 vPos;
  varying vec3 vNormal;

  float smax(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0) / k;
    return max(a, b) + h * h * k * 0.25;
  }

  float bump(vec2 p, vec2 c, vec2 r) {
    vec2 d = (p - c) / r;
    return exp(-dot(d, d));
  }

  // Relieve en coordenadas de imagen.
  float depthAt(vec2 p) {
    // Cráneo con perfil suave: sin pendiente en el borde, así orejas y sienes
    // no se estiran al girar.
    vec2 d = (p - vec2(0.505, 0.33)) / vec2(0.235, 0.335);
    float r = min(length(d), 1.0);
    float head = (1.0 - r * r * (3.0 - 2.0 * r)) * 0.13;
    head *= 1.0 - smoothstep(0.56, 0.68, p.y);

    float brow = (bump(p, vec2(0.445, 0.322), vec2(0.06, 0.016))
                + bump(p, vec2(0.573, 0.324), vec2(0.06, 0.016))) * 0.012;
    float cheeks = (bump(p, vec2(0.425, 0.435), vec2(0.045, 0.04))
                  + bump(p, vec2(0.595, 0.435), vec2(0.045, 0.04))) * 0.014;
    float nose = bump(p, vec2(0.511, 0.425), vec2(0.026, 0.055)) * 0.03;
    float sockets = (bump(p, vec2(0.4445, 0.352), vec2(0.045, 0.022))
                   + bump(p, vec2(0.573, 0.354), vec2(0.045, 0.022))) * 0.010;
    float chin = bump(p, vec2(0.51, 0.55), vec2(0.07, 0.04)) * 0.012;

    float neckX = 1.0 - smoothstep(0.07, 0.13, abs(p.x - 0.51));
    float neck = neckX * smoothstep(0.46, 0.60, p.y) * (1.0 - smoothstep(0.68, 0.80, p.y)) * 0.06;

    // Torso: volumen de hombros y pecho (no gira, solo recibe luz).
    vec2 dt = (p - vec2(0.5, 1.08)) / vec2(0.56, 0.5);
    float rt = min(length(dt), 1.0);
    float torso = (1.0 - rt * rt * (3.0 - 2.0 * rt)) * 0.11;

    // Unión suave (sin arista) entre cabeza, cuello y torso.
    return smax(head + brow + cheeks + nose - sockets + chin, smax(neck, torso, 0.08), 0.08);
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
    vec3 p = vec3(img.x * 2.0 - 1.0, 1.0 - img.y * 2.0, depthAt(img) * 2.0);

    // Giro alrededor de la base del cuello.
    vec3 pivot = vec3(0.02, -0.28, 0.10);
    mat3 R = rotY(uYaw * w) * rotX(uPitch * w);
    vec3 r = R * (p - pivot) + pivot;
    vPos = r;

    // Normal suave (diferencias finitas del relieve), girada con la cabeza.
    float e = 0.004;
    float dzdu = (depthAt(img + vec2(e, 0.0)) - depthAt(img - vec2(e, 0.0))) / (2.0 * e);
    float dzdv = (depthAt(img + vec2(0.0, e)) - depthAt(img - vec2(0.0, e))) / (2.0 * e);
    vNormal = R * normalize(vec3(-dzdu, dzdv, 1.0));

    // Perspectiva relativa al reposo: sin giro, la imagen coincide con el original.
    float focal = 4.2;
    vec2 centre = vec2(0.0, 0.3);
    float k = (focal - p.z) / (focal - r.z);
    vec2 xy = centre + (r.xy - centre) * k;

    gl_Position = vec4(xy * 0.96, -r.z * 0.25, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec3 uAmbient;
  uniform vec3 uKeyDir;
  uniform vec3 uKeyColor;
  uniform vec3 uRimDir;
  uniform vec3 uRimColor;
  uniform vec3 uFillColor;
  uniform float uDesaturate;
  uniform float uExposure;
  uniform float uFacet;
  varying vec2 vImg;
  varying vec3 vPos;
  varying vec3 vNormal;

  void main() {
    vec4 tex = texture2D(uTex, vImg);
    if (tex.a < 0.03) discard;

    // Normal plana por triángulo: da el aspecto facetado (low-poly).
    vec3 faceNormal = normalize(cross(dFdx(vPos), dFdy(vPos)));
    if (faceNormal.z < 0.0) faceNormal = -faceNormal;
    vec3 n = normalize(mix(normalize(vNormal), faceNormal, uFacet));

    float grey = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    vec3 albedo = mix(tex.rgb, vec3(grey), uDesaturate);

    float key = max(dot(n, normalize(uKeyDir)), 0.0);
    float rim = pow(max(dot(n, normalize(uRimDir)), 0.0), 4.0);
    float fill = max(-n.y, 0.0);
    vec3 light = uAmbient + uKeyColor * key + uRimColor * rim + uFillColor * fill;

    gl_FragColor = vec4(albedo * light * uExposure, tex.a);
  }
`;

const MAX_YAW = 0.40;   // giro lateral máximo (~23°)
const MAX_PITCH = 0.20; // cabeceo máximo (~11°)

async function start(stage) {
  const THREE = await import("three");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const src = stage.getAttribute("data-src");

  const texture = await new THREE.TextureLoader().loadAsync(src);
  // Sin conversión de color: la imagen se usa tal cual. Coordenadas con y hacia abajo.
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
  // Si un shader no compila, no se debe ocultar la foto de respaldo.
  let shaderFailed = false;
  renderer.debug.onShaderError = (gl, program, vs, fs) => {
    shaderFailed = true;
    console.warn("Face-tracker: error de shader", gl.getShaderInfoLog(vs), gl.getShaderInfoLog(fs));
  };

  const vec3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const uniforms = {
    uTex: { value: texture },
    uYaw: { value: 0 },
    uPitch: { value: 0 },
    uAmbient: { value: vec3(LOOK.ambient) },
    uKeyDir: { value: vec3(LOOK.keyDir) },
    uKeyColor: { value: vec3(LOOK.keyColor) },
    uRimDir: { value: vec3(LOOK.rimDir) },
    uRimColor: { value: vec3(LOOK.rimColor) },
    uFillColor: { value: vec3(LOOK.fillColor) },
    uDesaturate: { value: LOOK.desaturate },
    uExposure: { value: LOOK.exposure },
    uFacet: { value: LOOK.facet },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
  });

  // La posición se calcula en el shader: la cámara no interviene.
  const geometry = new THREE.PlaneGeometry(2, 2, LOOK.segments, LOOK.segments);
  jitterGrid(geometry, LOOK.segments, LOOK.jitter);
  const mesh = new THREE.Mesh(geometry, material);
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

  // Primer frame en reposo; si todo compila, se oculta la imagen de respaldo.
  draw();
  if (shaderFailed) {
    renderer.domElement.remove();
    renderer.dispose();
    throw new Error("shader no compilado");
  }
  stage.classList.add("is-3d");
  if (reduceMotion) return; // accesibilidad: busto quieto

  let raf = 0;
  let lastTime = 0;

  function tick(now) {
    const dt = Math.min((now - (lastTime || now - 16)) / 1000, 0.05);
    lastTime = now;

    // Sin cursor durante un rato: giro lento de reposo.
    const active = now - lastInteraction < 15000;
    const tx = active ? target.x : Math.sin(now * 0.00035) * 0.25;
    const ty = active ? target.y : Math.sin(now * 0.0005) * 0.1;

    const damp = 1 - Math.exp(-dt * 5);
    head.x += (tx - head.x) * damp;
    head.y += (ty - head.y) * damp;

    uniforms.uYaw.value = head.x * MAX_YAW;
    uniforms.uPitch.value = head.y * MAX_PITCH;
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

// Desplaza un poco cada vértice interior de la cuadrícula (semilla fija) para
// que las facetas sean triángulos irregulares y no cuadrados alineados. La
// posición sale del uv en el shader, así que basta con mover el uv.
function jitterGrid(geometry, segments, amount) {
  const uv = geometry.attributes.uv;
  const cell = 1 / segments;
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296 - 0.5;
  };
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    const border = u < 1e-6 || u > 1 - 1e-6 || v < 1e-6 || v > 1 - 1e-6;
    const du = rand() * amount * cell;
    const dv = rand() * amount * cell;
    if (!border) uv.setXY(i, u + du, v + dv);
  }
  uv.needsUpdate = true;
}
