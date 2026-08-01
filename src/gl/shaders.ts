// GLSL sống trong template string — Vite không cần plugin gì thêm.

export const vertex = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;

void main() {
  vUv = uv;
  // Tam giác của OGL đã phủ sẵn toàn màn hình trong clip space,
  // nên không cần camera hay matrix nào cả.
  gl_Position = vec4(position, 0.0, 1.0);
}
`

export const fragment = /* glsl */ `
precision highp float;

uniform float uTime;       // giây, đã nhân timeScale
uniform float uScroll;     // tiến trình scroll 0..1
uniform float uVelocity;   // vận tốc scroll đã làm mượt, khoảng -1..1
uniform vec2  uMouse;      // vị trí chuột 0..1, đã lerp
uniform vec2  uResolution; // px của drawing buffer

varying vec2 vUv;

// ---- Value noise + fbm -------------------------------------------------
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f); // smoothstep — nội suy mượt giữa 4 góc
  return mix(
    mix(hash(i),                 hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// Fractal Brownian Motion: cộng dồn 5 lớp noise, mỗi lớp nhỏ và chi tiết hơn.
// Ma trận xoay giữa các octave phá vỡ hoa văn thẳng hàng theo trục.
float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    value += amp * noise(p);
    p = rot * p * 2.0;
    amp *= 0.5;
  }
  return value;
}

// ---- Cosine palette (Inigo Quilez) -------------------------------------
// color(t) = a + b * cos(2*PI * (c*t + d))
//   a = màu nền trung tâm   b = biên độ dao động
//   c = tần số mỗi kênh     d = pha (dịch màu)
// >>> ĐÂY LÀ CHỖ ĐỂ BẠN NGHỊCH — 4 vector này quyết định toàn bộ mood. <<<
vec3 palette(float t) {
  // Bảng "băng giá": mọi thứ dồn về kênh blue — red gần như phẳng (amp 0.10)
  // chỉ đủ làm ấm nhẹ vùng sáng, green bám pha theo blue để highlight ngả cyan.
  // Lưu ý: green cần amp > mức nền (0.12 > 0.08) để ở đáy sóng nó bị clamp
  // về 0 CÙNG LÚC với blue — nếu không vùng tối sẽ dư green -> ám darkgreen.
  vec3 a = vec3(0.06, 0.08, 0.28);
  vec3 b = vec3(0.10, 0.12, 0.46);
  vec3 c = vec3(1.00, 1.00, 1.00);
  vec3 d = vec3(0.62, 0.65, 0.65);
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  // Toạ độ tâm màn hình, đã sửa méo theo tỉ lệ khung hình
  float aspect = uResolution.x / uResolution.y;
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);

  float t = uTime * 0.06; // trôi rất chậm — instrument, không phải pháo hoa

  // Scroll = du hành xuyên qua trường noise (không phải zoom hình ảnh)
  p *= 1.6 + uScroll * 0.9;
  p.y += uScroll * 2.6;

  // Chuột đẩy nhẹ cả trường — như nghiêng khay nước
  p += (uMouse - 0.5) * vec2(aspect, 1.0) * 0.25;

  // Domain warping 2 tầng: q làm cong không gian của r, r làm cong của f
  float warp = 1.0 + abs(uVelocity) * 1.6; // scroll nhanh -> khuấy mạnh
  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.0) + t),
    fbm(p + vec2(5.2, 1.3) - t * 0.8)
  );
  vec2 r = vec2(
    fbm(p + warp * 1.6 * q + vec2(1.7, 9.2) + t * 0.35),
    fbm(p + warp * 1.6 * q + vec2(8.3, 2.8) - t * 0.26)
  );
  float f = fbm(p + warp * 1.8 * r);

  // Map giá trị noise -> màu; scroll dịch pha để mỗi "chương" một sắc
  // 0.45 ~ gần nửa chu kỳ palette: cuộn hết trang là đi qua trọn một vòng màu
  // (băng sáng -> vực tối -> chàm trồi lên), không đậu lại ở vùng đen.
  vec3 col = palette(f + uScroll * 0.45 + q.x * 0.18);

  // Vùng noise cao thì phát sáng, vùng thấp chìm vào nền gallery
  col *= 0.35 + 1.35 * smoothstep(0.15, 1.05, f);

  // Vignette — mép màn hình tan vào #050505 để chữ luôn đọc được
  float vig = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(aspect, 1.0) * 1.35));
  col = mix(vec3(0.0196), col, vig);

  // Grain nhẹ chống banding trên dải gradient tối
  float grain = hash(gl_FragCoord.xy + fract(uTime) * 61.0);
  col += (grain - 0.5) * 0.035;

  gl_FragColor = vec4(col, 1.0);
}
`
