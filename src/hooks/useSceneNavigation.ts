import { useEffect, useRef, type RefObject } from 'react'
import { edgesAt, WheelGate, wheelPixels, type Direction, type Edges } from '../sceneNavigation'

export default function useSceneNavigation(
  ref: RefObject<HTMLDivElement | null>,
  suspended: boolean,
  navigate: (direction: Direction, focus: boolean) => void,
) {
  const wheel = useRef(new WheelGate())

  useEffect(() => {
    const element = ref.current!
    wheel.current.suppress(performance.now())
    if (suspended) return
    let touch: { x: number; y: number; edges: Edges; consumed: boolean } | null = null
    const edges = () => edgesAt(element.scrollTop, element.scrollHeight, element.clientHeight)
    const blocked = () => Boolean(document.querySelector('dialog[open]'))
    const onWheel = (event: WheelEvent) => {
      if (blocked() || event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      const result = wheel.current.step(performance.now(), wheelPixels(event.deltaY, event.deltaMode, element.clientHeight), edges())
      if (result.consume) event.preventDefault()
      if (result.direction) navigate(result.direction, false)
    }
    const onTouchStart = (event: TouchEvent) => {
      if (blocked() || event.touches.length !== 1) { touch = null; return }
      touch = { x: event.touches[0].clientX, y: event.touches[0].clientY, edges: edges(), consumed: false }
    }
    const onTouchMove = (event: TouchEvent) => {
      if (blocked() || !touch || event.touches.length !== 1) { touch = null; return }
      if (touch.consumed) { if (event.cancelable) event.preventDefault(); return }
      const dy = touch.y - event.touches[0].clientY
      const dx = touch.x - event.touches[0].clientX
      if (Math.abs(dy) <= Math.abs(dx)) return
      const direction: Direction = dy > 0 ? 1 : -1
      const current = edges()
      const eligible = direction > 0 ? touch.edges.bottom && current.bottom : touch.edges.top && current.top
      if (!eligible) return
      if (event.cancelable) event.preventDefault()
      if (Math.abs(dy) < 48) return
      touch.consumed = true
      wheel.current.suppress(performance.now())
      navigate(direction, false)
    }
    const onTouchEnd = () => { touch = null }
    const onKey = (event: KeyboardEvent) => {
      if (blocked() || event.ctrlKey || event.altKey || event.metaKey) return
      if ((event.target as HTMLElement).closest('button, a, input, textarea, select, [contenteditable="true"]')) return
      const direction = ['ArrowDown', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey) ? 1
        : ['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey) ? -1 : 0
      if (!direction) return
      const current = edges()
      if (direction > 0 ? current.bottom : current.top) {
        event.preventDefault()
        if (!event.repeat) { wheel.current.suppress(performance.now()); navigate(direction, true) }
      }
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchmove', onTouchMove, { passive: false })
    element.addEventListener('touchend', onTouchEnd)
    element.addEventListener('touchcancel', onTouchEnd)
    element.addEventListener('keydown', onKey)
    return () => {
      element.removeEventListener('wheel', onWheel)
      element.removeEventListener('touchstart', onTouchStart)
      element.removeEventListener('touchmove', onTouchMove)
      element.removeEventListener('touchend', onTouchEnd)
      element.removeEventListener('touchcancel', onTouchEnd)
      element.removeEventListener('keydown', onKey)
    }
  }, [ref, suspended, navigate])
}
