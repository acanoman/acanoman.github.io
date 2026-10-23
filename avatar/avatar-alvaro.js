/*
 * Avatar de Álvaro — Web Component sin dependencias.
 * Versión 2: cabeza rígida, sin relieve artificial ni estiramiento facial.
 * Efecto 2.5D: pequeña inclinación y desplazamiento sobre la ilustración.
 * No es un modelo GLB, un escaneo facial ni un personaje con vistas traseras.
 * Uso: <alvaro-avatar src="./assets/alvaro.png"></alvaro-avatar>
 */
(() => {
  'use strict';
  if (customElements.get('alvaro-avatar')) return;

  const SCRIPT_URL = document.currentScript?.src || document.baseURI;
  const DEFAULT_SRC = new URL('assets/alvaro.png', SCRIPT_URL).href;
  const clamp = (x, a = -1, b = 1) => Math.min(b, Math.max(a, x));

  // Coordenadas normalizadas medidas sobre assets/alvaro.png.
  // Cambiar la imagen requiere volver a calibrar ojos y límite del cuello.
  const VERTEX = `
    precision highp float;
    attribute vec2 aUV;
    varying vec2 vUV;
    uniform vec2 uHead;
    uniform float uBreath;
    void main() {
      vUV = aUV;
      vec2 p = vec2(aUV.x * 2.0 - 1.0, 1.0 - aUV.y * 2.0);
      vec2 follow = clamp(uHead, vec2(-1.3), vec2(1.3));
      float angle = -follow.x * 0.034;
      mat2 rotation = mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
      // Pivote en la base del cuello: la cabeza gira desde ahí, no se desliza.
      vec2 pivot = vec2(0.0, -0.40);
      vec2 rigid = rotation * (p - pivot) + pivot;
      // Traslación lateral mínima: el movimiento lo da el giro sobre el cuello.
      rigid += vec2(follow.x * 0.009, -follow.y * 0.012);
      // La cara entera (hasta el cuello) gira; el pecho y los hombros, desde
      // 0.74 de altura, quedan completamente fijos. La transición va en el cuello.
      float neckBlend = 1.0 - smoothstep(0.62, 0.74, aUV.y);
      vec2 q = mix(p, rigid, neckBlend);
      q.y += uBreath * neckBlend;
      gl_Position = vec4(q * 0.955, 0.0, 1.0);
    }
  `;
  const FRAGMENT = `
    precision mediump float;
    uniform sampler2D uImage;
    uniform vec2 uEyes;
    uniform float uBlink;
    varying vec2 vUV;

    vec2 gaze(vec2 uv, vec2 center, vec2 radius) {
      vec2 d = abs((uv - center) / radius);
      // Meseta central: la pupila se desplaza entera, sin magnificarla.
      // La transición se limita al borde de la abertura del ojo.
      float influence = (1.0 - smoothstep(0.68, 1.0, d.x))
                      * (1.0 - smoothstep(0.75, 1.0, d.y));
      return clamp(uEyes, vec2(-1.3), vec2(1.3)) * vec2(0.0040, 0.0015) * influence;
    }

    vec4 eyelid(vec4 color, vec2 center, vec2 radius) {
      if (uBlink < 0.001) return color;
      vec2 d = (vUV - center) / radius;
      float inside = 1.0 - smoothstep(0.92, 1.03, dot(d, d));
      float arc = sqrt(max(0.0, 1.0 - d.x * d.x));
      float upper = -arc + uBlink * arc * 1.50;
      float lower = arc - uBlink * arc * 0.50;
      float lidMask = max(1.0 - smoothstep(upper - 0.06, upper + 0.06, d.y),
                         smoothstep(lower - 0.06, lower + 0.06, d.y));
      vec2 skinUV = center + vec2(d.x * radius.x * 0.85, radius.y * (2.65 + d.y * 0.45));
      vec4 skin = texture2D(uImage, skinUV);
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
      vec2 shift = gaze(vUV, leftEye, leftRadius) + gaze(vUV, rightEye, rightRadius);
      vec4 color = texture2D(uImage, vUV - shift);
      color = eyelid(color, leftEye, leftRadius);
      color = eyelid(color, rightEye, rightRadius);
      gl_FragColor = color;
    }
  `;

  class AlvaroAvatar extends HTMLElement {
    static get observedAttributes() { return ['src', 'strength', 'paused', 'label']; }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          :host { display:block; width:100%; aspect-ratio:1; position:relative; contain:layout style; }
          :host([hidden]) { display:none; }
          .frame { position:relative; width:100%; height:100%; outline:none; border-radius:24px; }
          .frame:focus-visible { outline:2px solid var(--avatar-focus,#a6eac8); outline-offset:-8px; }
          canvas,img { display:block; position:absolute; inset:0; width:100%; height:100%; object-fit:contain; }
          canvas { opacity:0; pointer-events:none; }
          .ready canvas { opacity:1; }
          .ready img { visibility:hidden; }
          img { box-sizing:border-box; padding:2.25%; }
          .error { position:absolute; bottom:10%; left:10%; right:10%; color:inherit; font:14px/1.5 system-ui; text-align:center; }
          .sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
        </style>
        <div class="frame" tabindex="0" role="img">
          <img alt="" draggable="false">
          <canvas aria-hidden="true"></canvas>
          <span class="error" hidden>No se ha podido cargar el avatar. Comprueba la ruta de la imagen.</span>
          <span class="sr">Mueve el cursor o usa las flechas para dirigir la mirada. Inicio centra el avatar.</span>
        </div>`;
      this.frame = this.shadowRoot.querySelector('.frame');
      this.canvas = this.shadowRoot.querySelector('canvas');
      this.fallback = this.shadowRoot.querySelector('img');
      this.errorLabel = this.shadowRoot.querySelector('.error');
      this.target = { x: 0, y: 0 };
      this.head = { x: 0, y: 0 };
      this.eyes = { x: 0, y: 0 };
      this.active = false;
      this.visible = true;
      this.ready = false;
      this.raf = 0;
      this.loadId = 0;
      this.lastTime = 0;
      this.lastEvent = 0;
      this.lastInteraction = 0;
      this.blinkStart = 0;
      this.nextBlink = 0;
      this._tick = this._tick.bind(this);
    }

    connectedCallback() {
      this.events = new AbortController();
      const signal = this.events.signal;
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.motion.addEventListener('change', () => this._sync(), { signal });
      this._setLabel();
      this.resize = new ResizeObserver(() => { this._resize(); this._draw(); });
      this.resize.observe(this);
      if ('IntersectionObserver' in window) {
        this.intersection = new IntersectionObserver(entries => {
          this.visible = entries[0].isIntersecting;
          this._sync();
        });
        this.intersection.observe(this);
      }
      window.addEventListener('pointermove', e => {
        if (e.pointerType !== 'touch' || this.contains(e.target)) this._pointer(e);
      }, { passive: true, signal });
      this.addEventListener('pointerdown', e => this._pointer(e), { passive: true, signal });
      window.addEventListener('pointerout', e => { if (!e.relatedTarget) this.reset(); }, { signal });
      window.addEventListener('pointercancel', () => this.reset(), { signal });
      window.addEventListener('blur', () => this.reset(), { signal });
      document.addEventListener('visibilitychange', () => this._sync(), { signal });
      this.frame.addEventListener('keydown', e => {
        const directions = { ArrowLeft: [-0.23, 0], ArrowRight: [0.23, 0], ArrowUp: [0, -0.23], ArrowDown: [0, 0.23] };
        if (e.key === 'Home') { e.preventDefault(); this.reset(); }
        if (directions[e.key]) {
          e.preventDefault();
          this.lookAt(this.target.x + directions[e.key][0], this.target.y + directions[e.key][1]);
        }
      }, { signal });
      this.canvas.addEventListener('webglcontextlost', e => {
        e.preventDefault(); this.ready = false; this._stop(); this.frame.classList.remove('ready');
      }, { signal });
      this.canvas.addEventListener('webglcontextrestored', () => {
        this.gl = null; this._load();
      }, { signal });
      this._load();
    }

    disconnectedCallback() {
      this.loadId++;
      this.events?.abort();
      this.resize?.disconnect();
      this.intersection?.disconnect();
      this._stop();
      this._dispose();
      this.frame.classList.remove('ready');
    }

    attributeChangedCallback(name) {
      if (!this.isConnected || !this.events) return;
      if (name === 'src') this._load();
      else if (name === 'label') this._setLabel();
      else this._sync();
    }

    _setLabel() {
      this.frame.setAttribute('aria-label', this.getAttribute('label') || 'Avatar animado de Álvaro. Sigue el cursor. Usa las flechas para mover la mirada e Inicio para centrar.');
    }

    get strength() {
      const value = Number(this.getAttribute('strength') ?? 1);
      return Number.isFinite(value) ? clamp(value, 0, 1.3) : 1;
    }

    get reducedMotion() { return !!this.motion?.matches; }
    pause() { this.setAttribute('paused', ''); }
    play() { this.removeAttribute('paused'); }
    reset() {
      this.active = false;
      this.target.x = this.target.y = 0;
      if (this.hasAttribute('paused') || this.reducedMotion) {
        this.head.x = this.head.y = this.eyes.x = this.eyes.y = 0;
        this._draw();
      }
    }
    lookAt(x, y) {
      if (this.reducedMotion || this.hasAttribute('paused')) return;
      this.active = true;
      this.lastInteraction = performance.now();
      this.target.x = Number.isFinite(x) ? clamp(x) : 0;
      this.target.y = Number.isFinite(y) ? clamp(y) : 0;
    }

    _pointer(e) {
      const rect = this.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1 || !this.visible) return;
      this.lookAt((e.clientX - rect.left - rect.width * 0.5) / Math.max(180, rect.width * 0.72),
                  (e.clientY - rect.top - rect.height * 0.355) / Math.max(160, rect.height * 0.62));
    }

    async _load() {
      const id = ++this.loadId;
      this._stop();
      this.ready = false;
      this.frame.classList.remove('ready');
      this.errorLabel.hidden = true;
      const src = this.getAttribute('src') || DEFAULT_SRC;
      this.fallback.src = src;
      const image = new Image();
      image.crossOrigin = 'anonymous';
      try {
        await new Promise((resolve, reject) => {
          image.onload = resolve; image.onerror = reject; image.src = src;
        });
        if (id !== this.loadId || !this.isConnected) return;
        if (!this.gl) this._initGL();
        if (!this.gl) { this._status('static'); return; }
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        this.ready = true;
        this.frame.classList.add('ready');
        this._resize(); this._draw(); this._status('ready'); this._sync();
      } catch (error) {
        if (id !== this.loadId || !this.isConnected) return;
        this.ready = false;
        this.frame.classList.remove('ready');
        // Si WebGL/CORS falla pero <img> funciona, conservamos la imagen estática.
        this.errorLabel.hidden = this.fallback.complete && this.fallback.naturalWidth > 0;
        this._status('static');
        this.dispatchEvent(new CustomEvent('avatarerror', { detail: { message: 'No se ha podido activar el avatar. Revisa la ruta, CORS o WebGL.' } }));
      }
    }

    _initGL() {
      const gl = this.canvas.getContext('webgl', {
        alpha: true, antialias: true, depth: false, stencil: false,
        premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'low-power'
      });
      if (!gl) return;
      const shaders = [];
      const compile = (type, source) => {
        const shader = gl.createShader(type);
        shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
        return shader;
      };
      const program = gl.createProgram();
      try {
        gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      } catch (error) { gl.deleteProgram(program); throw error; }
      finally { shaders.forEach(shader => gl.deleteShader(shader)); }
      this.gl = gl; this.program = program;
      gl.useProgram(program);
      // La malla suaviza la unión bajo el mentón. La cara se mueve rígidamente.
      const n = 100, vertices = [], indices = [];
      for (let y = 0; y <= n; y++) for (let x = 0; x <= n; x++) vertices.push(x / n, y / n);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const a = y * (n + 1) + x, b = a + n + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      const attr = gl.getAttribLocation(program, 'aUV');
      gl.enableVertexAttribArray(attr); gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);
      this.indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
      this.indexCount = indices.length;
      this.texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.uniforms = Object.fromEntries(['uImage','uHead','uEyes','uBlink','uBreath'].map(key => [key, gl.getUniformLocation(program, key)]));
      gl.uniform1i(this.uniforms.uImage, 0);
      gl.clearColor(0, 0, 0, 0);
    }

    _resize() {
      const rect = this.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = Math.max(1, Math.round(Math.min(rect.width, rect.height) * dpr));
      if (this.canvas.width !== size || this.canvas.height !== size) this.canvas.width = this.canvas.height = size;
      this.gl?.viewport(0, 0, size, size);
    }

    _draw(blink = 0, breath = 0) {
      if (!this.ready || !this.gl) return;
      const gl = this.gl, u = this.uniforms, s = this.strength;
      gl.useProgram(this.program);
      gl.uniform2f(u.uHead, this.head.x * s, this.head.y * s);
      gl.uniform2f(u.uEyes, this.eyes.x * s, this.eyes.y * s);
      gl.uniform1f(u.uBlink, blink);
      gl.uniform1f(u.uBreath, breath);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    }

    _sync() {
      this._stop();
      if (!this.ready || !this.isConnected) return;
      if (this.reducedMotion) {
        this.head.x = this.head.y = this.eyes.x = this.eyes.y = 0;
        this._draw(); this._status('reduced-motion'); return;
      }
      if (this.hasAttribute('paused')) { this._draw(); this._status('paused'); return; }
      if (!this.visible || document.hidden) return;
      this.lastTime = 0;
      this.blinkStart = 0;
      this.nextBlink = performance.now() + 2200 + Math.random() * 2200;
      this.raf = requestAnimationFrame(this._tick);
    }

    _stop() { cancelAnimationFrame(this.raf); this.raf = 0; }

    _tick(now) {
      const dt = Math.min((now - (this.lastTime || now - 16)) / 1000, 0.05);
      this.lastTime = now;
      if (this.active && now - this.lastInteraction > 15000) this.reset();
      const idle = !this.active && this.getAttribute('idle') !== 'false';
      const tx = this.active ? this.target.x : idle ? Math.sin(now * 0.00036) * 0.09 : 0;
      const ty = this.active ? this.target.y : idle ? Math.sin(now * 0.00051) * 0.045 : 0;
      const headDamping = 1 - Math.exp(-dt * 6.5), eyeDamping = 1 - Math.exp(-dt * 15);
      this.head.x += (tx - this.head.x) * headDamping;
      this.head.y += (ty - this.head.y) * headDamping;
      this.eyes.x += (tx - this.eyes.x) * eyeDamping;
      this.eyes.y += (ty - this.eyes.y) * eyeDamping;
      let blink = 0;
      if (now > this.nextBlink && !this.blinkStart) this.blinkStart = now;
      if (this.blinkStart) {
        const p = (now - this.blinkStart) / 190;
        if (p >= 1) { this.blinkStart = 0; this.nextBlink = now + 3000 + Math.random() * 3500; }
        else blink = Math.pow(Math.sin(p * Math.PI), 0.80);
      }
      const breath = this.getAttribute('idle') !== 'false' ? Math.sin(now * 0.00145) * 0.0035 : 0;
      this._draw(blink, breath);
      if (now - this.lastEvent > 120) {
        this.lastEvent = now;
        this.dispatchEvent(new CustomEvent('avatarmove', { detail: { x: this.head.x, y: this.head.y } }));
      }
      this.raf = requestAnimationFrame(this._tick);
    }

    _status(state) { this.dispatchEvent(new CustomEvent('avatarstate', { detail: { state } })); }
    _dispose() {
      if (this.gl) {
        this.gl.deleteTexture(this.texture);
        this.gl.deleteBuffer(this.vertexBuffer);
        this.gl.deleteBuffer(this.indexBuffer);
        this.gl.deleteProgram(this.program);
      }
      this.gl = null; this.ready = false;
    }
  }

  customElements.define('alvaro-avatar', AlvaroAvatar);
})();
