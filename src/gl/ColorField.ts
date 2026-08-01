import { Renderer, Program, Mesh, Triangle, Vec2 } from 'ogl'
import { vertex, fragment } from './shaders.ts'

// Toàn bộ scene: 1 tam giác + 1 program. Không camera, không scene graph.
export class ColorField {
  private renderer: Renderer
  private program: Program
  private mesh: Mesh
  private time = 0
  private mouseTarget = new Vec2(0.5, 0.5)

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer({
      canvas,
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: false,
      antialias: false, // 1 tam giác phủ màn hình -> không có cạnh để khử răng cưa
    })
    const gl = this.renderer.gl

    this.program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uVelocity: { value: 0 },
        uMouse: { value: new Vec2(0.5, 0.5) },
        uResolution: { value: new Vec2(1, 1) },
      },
    })

    this.mesh = new Mesh(gl, { geometry: new Triangle(gl), program: this.program })

    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    const { drawingBufferWidth: w, drawingBufferHeight: h } = this.renderer.gl
    ;(this.program.uniforms.uResolution.value as Vec2).set(w, h)
  }

  setScroll(progress: number, velocity: number) {
    this.program.uniforms.uScroll.value = progress
    this.program.uniforms.uVelocity.value = velocity
  }

  setMouse(x: number, y: number) {
    this.mouseTarget.set(x, y)
  }

  update(dt: number) {
    this.time += dt
    this.program.uniforms.uTime.value = this.time

    // Lerp chuột theo delta time — hệ số độc lập với FPS
    const mouse = this.program.uniforms.uMouse.value as Vec2
    const k = 1 - Math.exp(-4 * dt)
    mouse.x += (this.mouseTarget.x - mouse.x) * k
    mouse.y += (this.mouseTarget.y - mouse.y) * k

    this.renderer.render({ scene: this.mesh })
  }
}
