export type Direction = -1 | 1
export type Edges = { top: boolean; bottom: boolean }
export const GESTURE_IDLE_MS = 250
const WHEEL_THRESHOLD = 40

export function edgesAt(scrollTop: number, scrollHeight: number, clientHeight: number): Edges {
  return { top: scrollTop <= 2, bottom: scrollTop >= scrollHeight - clientHeight - 2 }
}

export function wheelPixels(delta: number, mode: number, pageHeight: number): number {
  return delta * (mode === 1 ? 16 : mode === 2 ? pageHeight : 1)
}

// Wheel events have no gesture identifier. An idle gap approximates a fresh intent.
export class WheelGate {
  private last = -Infinity
  private start: Edges = { top: false, bottom: false }
  private direction = 0
  private distance = 0
  private consumed = false

  suppress(now: number) {
    this.last = now
    this.consumed = true
  }

  step(now: number, delta: number, edges: Edges): { consume: boolean; direction?: Direction } {
    if (now - this.last > GESTURE_IDLE_MS) {
      this.start = edges
      this.direction = 0
      this.distance = 0
      this.consumed = false
    }
    this.last = now
    if (this.consumed) return { consume: true }
    const direction = Math.sign(delta) as Direction
    if (!direction) return { consume: false }
    if (direction !== this.direction) this.distance = 0
    this.direction = direction
    const eligible = direction > 0 ? this.start.bottom && edges.bottom : this.start.top && edges.top
    if (!eligible) return { consume: false }
    this.distance += Math.abs(delta)
    if (this.distance < WHEEL_THRESHOLD) return { consume: true }
    this.consumed = true
    return { consume: true, direction }
  }
}
