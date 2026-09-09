import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { scenes, type BuildingAsset } from '../building'
import { edgesAt, type Direction } from '../sceneNavigation'
import useSceneNavigation from '../hooks/useSceneNavigation'
import BuildingScene from './BuildingScene'

export default function SceneExplorer({ hidden = false, suspended, onSelect }: { hidden?: boolean; suspended: boolean; onSelect: (asset: BuildingAsset) => void }) {
  const [index, setIndex] = useState(0)
  const [edges, setEdges] = useState({ top: true, bottom: false })
  const scroller = useRef<HTMLDivElement>(null)
  const current = useRef(0)
  const savedScroll = useRef(0)
  const isHidden = useRef(hidden)
  isHidden.current = hidden

  useLayoutEffect(() => {
    if (!hidden && scroller.current) scroller.current.scrollTop = savedScroll.current
  }, [hidden])
  const entry = useRef<{ direction: Direction; focus: boolean }>({ direction: 1, focus: false })
  const lockedUntil = useRef(0)
  const navigate = useCallback((direction: Direction, focus: boolean) => {
    const next = current.current + direction
    if (isHidden.current || document.querySelector('dialog[open]') || performance.now() < lockedUntil.current || next < 0 || next >= scenes.length) return
    lockedUntil.current = performance.now() + 180
    entry.current = { direction, focus }
    current.current = next
    setIndex(next)
  }, [])
  useSceneNavigation(scroller, suspended, navigate)

  useLayoutEffect(() => {
    const element = scroller.current!
    element.scrollTop = entry.current.direction > 0 ? 0 : element.scrollHeight
    if (entry.current.focus || (document.activeElement === document.body && index > 0)) element.focus({ preventScroll: true })
    const update = () => {
      if (isHidden.current) return
      savedScroll.current = element.scrollTop
      setEdges(edgesAt(element.scrollTop, element.scrollHeight, element.clientHeight))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    observer.observe(element.firstElementChild!)
    element.addEventListener('scroll', update, { passive: true })
    return () => { observer.disconnect(); element.removeEventListener('scroll', update) }
  }, [index])

  const scene = scenes[index]
  const hint = edges.bottom ? index < scenes.length - 1 ? 'Scroll again to visit the tree ↓' : 'End of the garden. Explore a little.'
    : edges.top && index > 0 ? 'Scroll up again to return to the building ↑' : 'Explore below ↓'

  return (
    <main id="building" className="scene-explorer" hidden={hidden} inert={hidden}>
      <div className="scene-toolbar"><h1>{scene.label}</h1><span className="scene-count" aria-live="polite">{index + 1} / {scenes.length}</span></div>
      <div id="residents" className="scene-scroll" ref={scroller} tabIndex={0} role="region" aria-label={`${scene.label} exploration area`} aria-describedby="scene-hint" inert={suspended}>
        <div key={scene.id} className={`building scene-entry scene-entry--${entry.current.direction > 0 ? 'next' : 'previous'}`}>
          <BuildingScene scene={scene} onSelect={onSelect} />
        </div>
      </div>
      <nav className="scene-navigation" aria-label="Scene navigation">
        <button type="button" className="scene-button" disabled={index === 0 || suspended} onClick={() => navigate(-1, true)}>← Previous</button>
        <p id="scene-hint">{hint}</p>
        <button type="button" className="scene-button" disabled={index === scenes.length - 1 || suspended} onClick={() => navigate(1, true)}>Next →</button>
      </nav>
    </main>
  )
}
