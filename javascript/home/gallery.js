(() => {
  const gallery = document.querySelector(".gallery");
  if (!gallery || window.location.protocol === "file:") return;

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl");
  if (!gl) return;

  function makeShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  const vertex = makeShader(gl.VERTEX_SHADER, `
    attribute vec2 point;
    varying vec2 uv;

    void main() {
      gl_Position = vec4(point, 0.0, 1.0);
      uv = vec2(point.x, -point.y) * 0.5 + 0.5;
    }
  `);

  const fragment = makeShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    varying vec2 uv;
    uniform sampler2D photo;
    uniform vec2 size;
    uniform vec2 crop;
    uniform float radius;
    uniform float position;

    vec2 warp(float curve) {
      vec2 point = uv + vec2(0.0, position) - 0.5;
      float y = max(point.y, 0.0);
      return uv + point * (y * y * (curve + 0.02 * y));
    }

    vec4 samplePhoto(vec2 point) {
      vec2 imagePoint = (point - 0.5) * 2.0;
      vec2 edge = abs(imagePoint * size) - size * 0.5 + radius;
      float distance = length(max(edge, 0.0)) - radius;
      float alpha = 1.0 - smoothstep(0.0, 1.0, distance);
      vec3 color = texture2D(photo, imagePoint * crop + 0.5).rgb;
      return vec4(color * alpha, alpha);
    }

    void main() {
      vec4 red = samplePhoto(warp(-0.28));
      vec4 green = samplePhoto(warp(-0.30));
      vec4 blue = samplePhoto(warp(-0.32));
      float alpha = (red.a + green.a + blue.a) / 3.0;
      gl_FragColor = vec4(red.r, green.g, blue.b, alpha);
    }
  `);

  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const point = gl.getAttribLocation(program, "point");
  gl.enableVertexAttribArray(point);
  gl.vertexAttribPointer(point, 2, gl.FLOAT, false, 0, 0);
  const size = gl.getUniformLocation(program, "size");
  const crop = gl.getUniformLocation(program, "crop");
  const radius = gl.getUniformLocation(program, "radius");
  const position = gl.getUniformLocation(program, "position");

  canvas.className = "gallery-canvas";
  gallery.classList.add("has-webgl");
  gallery.append(canvas);
  const cards = [...gallery.querySelectorAll(".gallery-card")].map((card) => ({
    card,
    image: card.querySelector("img"),
    texture: undefined,
  }));

  function loadTexture(image) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    } catch {
      gl.deleteTexture(texture);
      return null;
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }

  let frame = 0;

  function renderGallery() {
    frame = 0;
    if (gl.isContextLost()) return;

    const viewportHeight = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio, 2);
    const canvasWidth = Math.round(canvas.clientWidth * ratio);
    const canvasHeight = Math.round(viewportHeight * ratio);
    if (canvas.width !== canvasWidth) canvas.width = canvasWidth;
    if (canvas.height !== canvasHeight) canvas.height = canvasHeight;
    gl.clear(gl.COLOR_BUFFER_BIT);

    const boxes = cards.map(({ card }) => card.getBoundingClientRect());
    const corner = parseFloat(getComputedStyle(cards[0].image).borderTopLeftRadius);
    cards.forEach((entry, index) => {
      const { card, image } = entry;
      const { left, top, width, height } = boxes[index];
      const centerY = top + height / 2;
      const offset = (2 * centerY) / viewportHeight - 1;
      const visible = centerY - height < viewportHeight && offset > -0.25;

      if (visible && image.complete && image.naturalWidth && entry.texture === undefined) {
        entry.texture = loadTexture(image);
      }
      const active = visible && Boolean(entry.texture);
      card.classList.toggle("is-rendering", active);
      if (!active) return;

      const aspect = (image.naturalWidth * height) / (image.naturalHeight * width);
      gl.viewport(
        Math.round((left - width / 2) * ratio),
        Math.round((viewportHeight - centerY - height) * ratio),
        Math.round(width * 2 * ratio),
        Math.round(height * 2 * ratio)
      );
      gl.bindTexture(gl.TEXTURE_2D, entry.texture);
      gl.uniform2f(size, width, height);
      gl.uniform2f(crop, Math.min(1, 1 / aspect), Math.min(1, aspect));
      gl.uniform1f(radius, corner);
      gl.uniform1f(position, offset);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });
  }

  function requestGalleryFrame() {
    if (!frame) frame = requestAnimationFrame(renderGallery);
  }

  canvas.addEventListener("webglcontextlost", () => {
    gallery.classList.remove("has-webgl");
    cards.forEach(({ card }) => card.classList.remove("is-rendering"));
  });
  gallery.addEventListener("load", requestGalleryFrame, true);
  window.addEventListener("scroll", requestGalleryFrame, { passive: true });
  window.addEventListener("resize", requestGalleryFrame);
  requestGalleryFrame();
})();
