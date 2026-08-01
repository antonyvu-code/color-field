import '@fontsource-variable/bricolage-grotesque'
import '@fontsource/space-mono'
import './style.css'

import gsap from 'gsap'
import Lenis from 'lenis'
import { ColorField } from './gl/ColorField.ts'

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const canvas = document.querySelector<HTMLCanvasElement>('#gl')!
const field = new ColorField(canvas)

// ---- Smooth scroll ------------------------------------------------------
const lenis = new Lenis({ autoRaf: false, smoothWheel: !reduced })
if (import.meta.env.DEV) (window as unknown as { lenis: Lenis }).lenis = lenis

// ---- Chuột --------------------------------------------------------------
window.addEventListener('pointermove', (e) => {
  field.setMouse(e.clientX / window.innerWidth, e.clientY / window.innerHeight)
})

// ---- Telemetry / readout elements ----------------------------------------
const $ = (id: string) => document.getElementById(id)!
const telFps = $('tel-fps')
const telVel = $('tel-vel')
const telScr = $('tel-scr')
const telDpr = $('tel-dpr')
const roScroll = $('ro-scroll')
const roVel = $('ro-vel')
const progressBar = $('progress')

telDpr.textContent = Math.min(window.devicePixelRatio, 2).toFixed(1)

// ---- Render loop ----------------------------------------------------------
let last = performance.now()
let velocity = 0
let frames = 0
let fpsClock = 0

function raf(now: number) {
  const dt = Math.min((now - last) / 1000, 0.1)
  last = now

  lenis.raf(now)

  const max = document.documentElement.scrollHeight - window.innerHeight
  const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0

  // Làm mượt vận tốc scroll rồi chuẩn hoá về ~[-1, 1]
  velocity += (lenis.velocity / 60 - velocity) * (1 - Math.exp(-8 * dt))
  const vel = gsap.utils.clamp(-1, 1, velocity)

  field.setScroll(progress, vel)
  // Reduced motion: đóng băng thời gian ambient, nhưng scroll (do user chủ động)
  // vẫn điều khiển được trường màu
  field.update(reduced ? 0 : dt)

  progressBar.style.transform = `scaleX(${progress})`

  // Telemetry: FPS đo thật mỗi 0.5s, các số còn lại cập nhật mỗi frame
  frames++
  fpsClock += dt
  if (fpsClock >= 0.5) {
    telFps.textContent = String(Math.round(frames / fpsClock))
    frames = 0
    fpsClock = 0
  }
  telVel.textContent = vel.toFixed(2)
  telScr.textContent = `${String(Math.round(progress * 100)).padStart(3, '0')}%`
  roScroll.textContent = progress.toFixed(3)
  roVel.textContent = vel.toFixed(3)

  requestAnimationFrame(raf)
}
requestAnimationFrame(raf)

// ---- Intro + section reveals ----------------------------------------------
if (!reduced) {
  gsap.from('.panel--hero > *', {
    opacity: 0,
    y: 24,
    duration: 0.9,
    stagger: 0.12,
    ease: 'power2.out',
    delay: 0.15,
  })

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      }
    },
    { threshold: 0.3 },
  )
  document
    .querySelectorAll('.panel:not(.panel--hero)')
    .forEach((el) => observer.observe(el))
} else {
  document
    .querySelectorAll('.panel')
    .forEach((el) => el.classList.add('is-visible'))
}
