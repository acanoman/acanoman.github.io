// Avatar 3D real: una cabeza que GIRA hacia el cursor (yaw + pitch), con los
// hombros quietos. Usa Three.js (ESM por CDN, import dinámico: solo se descarga
// si existe el contenedor #avatar-3d en la página).
//
// FASE ACTUAL: cabeza de PRUEBA construida con geometría (placeholder) para
// validar el mecanismo de giro. Cuando Álvaro aporte su modelo real (.glb),
// se carga con GLTFLoader y se rota su nodo de cabeza en vez del placeholder.
//
// Respeta CONFIG.ENABLE_FACE_TRACKER, prefers-reduced-motion y se pausa cuando
// no es visible o la pestaña está oculta.
(function () {
  const config = window.CONFIG || {};
  const host = document.getElementById("avatar-3d");
  if (!host) return;
  if (config.ENABLE_FACE_TRACKER === false) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;

  // Ruta opcional a un modelo real; si no hay, se usa el placeholder geométrico.
  const MODEL_SRC = host.getAttribute("data-model") || "";

  init().catch((err) => {
    console.warn("Avatar 3D no disponible:", err);
    host.classList.add("avatar3d-failed"); // deja ver la imagen de respaldo
  });

  async function init() {
    const THREE = await import("three");

    const width = host.clientWidth || 400;
    const height = host.clientHeight || 400;

    const scene = new THREE.Scene();

    // Cámara frontal, ligeramente elevada.
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    camera.position.set(0, 0.1, 6.2);
    camera.lookAt(0, 0.1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    // Iluminación con tinte cyber: luz principal cálida, relleno y contra verde.
    const key = new THREE.DirectionalLight(0xfff0dd, 2.1);
    key.position.set(2.5, 3, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8fbd73, 0.9);
    fill.position.set(-3, 0, 2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0x4ade80, 1.4);
    rim.position.set(-1.5, 2, -4);
    scene.add(rim);
    scene.add(new THREE.AmbientLight(0x20301f, 1.1));

    // --- Modelo: real (GLB) o placeholder geométrico ---
    const headPivot = new THREE.Group(); // lo que rota hacia el cursor
    scene.add(headPivot);
    let headReady = false;

    if (MODEL_SRC) {
      const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
      const gltf = await new GLTFLoader().loadAsync(MODEL_SRC);
      const model = gltf.scene;
      // Busca un nodo de cabeza para rotar solo ella; si no, rota el modelo.
      const headNode = model.getObjectByName("Head") || model.getObjectByName("head") || model;
      scene.add(model);
      headPivot.userData.headNode = headNode;
      headReady = true;
    } else {
      buildPlaceholder(THREE, scene, headPivot);
      headReady = true;
    }

    // --- Seguimiento del cursor ---
    const target = { x: 0, y: 0 };
    let current = { x: 0, y: 0 };
    let hasPointer = false;

    function onPointer(clientX, clientY) {
      const r = host.getBoundingClientRect();
      if (r.width < 1) return;
      // Posición del cursor relativa al centro del avatar, normalizada a [-1, 1].
      target.x = Math.max(-1, Math.min(1, (clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
      target.y = Math.max(-1, Math.min(1, (clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
      hasPointer = true;
    }
    if (!isTouch) {
      window.addEventListener("mousemove", (e) => onPointer(e.clientX, e.clientY), { passive: true });
      window.addEventListener("mouseout", (e) => { if (!e.relatedTarget) { target.x = target.y = 0; } });
    }

    const MAX_YAW = 0.62;   // giro lateral máximo (rad) ~35°
    const MAX_PITCH = 0.34; // cabeceo máximo (rad) ~19°

    // Pausa cuando no es visible o la pestaña está oculta.
    let visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(host);
    }

    let raf = 0;
    let last = performance.now();
    function render(now) {
      raf = requestAnimationFrame(render);
      if (!visible || document.hidden) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (reduceMotion) { target.x = 0; target.y = 0; }

      // Movimiento de reposo suave cuando no hay cursor.
      let tx = target.x, ty = target.y;
      if (!hasPointer && !reduceMotion) {
        tx = Math.sin(now * 0.0004) * 0.25;
        ty = Math.sin(now * 0.0006) * 0.12;
      }

      const damp = 1 - Math.exp(-dt * 7);
      current.x += (tx - current.x) * damp;
      current.y += (ty - current.y) * damp;

      if (headReady) {
        const node = headPivot.userData.headNode || headPivot;
        node.rotation.y = current.x * MAX_YAW;
        node.rotation.x = current.y * MAX_PITCH;
      }
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(render);
    host.classList.add("avatar3d-ready");

    // Reajuste al cambiar de tamaño.
    if ("ResizeObserver" in window) {
      new ResizeObserver(() => {
        const w = host.clientWidth, h = host.clientHeight;
        if (w < 1 || h < 1) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }).observe(host);
    }
  }

  // Cabeza de prueba low-poly: cabeza (rota) sobre cuello y hombros (fijos).
  function buildPlaceholder(THREE, scene, headPivot) {
    const skin = new THREE.MeshStandardMaterial({ color: 0xc8a888, roughness: 0.7, metalness: 0 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.8 });
    const cloth = new THREE.MeshStandardMaterial({ color: 0x1b2a3f, roughness: 0.9 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.3 });

    // Hombros y cuello: fijos (fuera de headPivot).
    const body = new THREE.Group();
    const shoulders = new THREE.Mesh(new THREE.CapsuleGeometry(1.15, 1.1, 6, 16), cloth);
    shoulders.scale.set(1.25, 0.7, 0.8);
    shoulders.position.y = -1.95;
    body.add(shoulders);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.42, 0.7, 20), skin);
    neck.position.y = -0.95;
    body.add(neck);
    scene.add(body);

    // Cabeza (rota con headPivot). Pivota sobre la base del cuello.
    headPivot.position.y = -0.95;
    const head = new THREE.Group();
    head.position.y = 0.95;
    headPivot.add(head);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.82, 32, 32), skin);
    skull.scale.set(0.92, 1.08, 1.0);
    head.add(skull);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.86, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.55), dark);
    hair.scale.set(0.95, 1.1, 1.02);
    hair.position.y = 0.12;
    head.add(hair);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 12), skin);
    nose.rotation.x = Math.PI * 0.5;
    nose.position.set(0, -0.05, 0.82);
    head.add(nose);

    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), eyeMat);
      eye.position.set(0.28 * sx, 0.12, 0.7);
      head.add(eye);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.08), dark);
      brow.position.set(0.28 * sx, 0.3, 0.74);
      head.add(brow);
    }

    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 20, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45), dark);
    beard.scale.set(0.95, 1.0, 1.0);
    beard.position.y = -0.1;
    beard.position.z = 0.05;
    head.add(beard);
  }
})();
