import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { locations, projects, type BuildingAsset } from './building'
import { boardInquiryTarget } from './pixelBoard'
import { AssetAction } from './components/BuildingScene'
import SceneExplorer from './components/SceneExplorer'
import PixelBoard from './components/PixelBoard'
import Dialog from './components/Dialog'
import InquiryDialog from './components/InquiryDialog'

type Panel = { type: 'directory' } | { type: 'asset'; asset: BuildingAsset } | { type: 'board' } | null
const isBoardRoute = () => window.location.hash === '#/pixels'

export default function App() {
  const [boardOpen, setBoardOpen] = useState(isBoardRoute)
  const [panel, setPanel] = useState<Panel>(null)
  const route = useRef(boardOpen)
  const enteredFromHome = useRef(false)
  const returnTarget = useRef<HTMLElement | null>(null)
  const opener = useRef<HTMLElement | null>(null)
  const directory = useRef<HTMLButtonElement>(null)
  const hadBoard = useRef(boardOpen)
  const open = (next: Exclude<Panel, null>) => {
    if (!panel) opener.current = document.activeElement as HTMLElement | null
    setPanel(next)
  }
  const close = () => {
    setPanel(null)
    requestAnimationFrame(() => {
      const target = opener.current
      if (target?.isConnected && target.getClientRects().length && !target.closest('[inert], [hidden]')) target.focus({ preventScroll: true })
      else directory.current?.focus({ preventScroll: true })
    })
  }

  useEffect(() => {
    const syncRoute = () => {
      const next = isBoardRoute()
      if (next === route.current) return
      if (next && enteredFromHome.current) {
        history.replaceState({ ...history.state, pixelBoardEntry: true }, '')
        enteredFromHome.current = false
      }
      route.current = next
      setPanel(null)
      setBoardOpen(next)
    }
    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  useLayoutEffect(() => {
    if (!boardOpen && !hadBoard.current) return
    hadBoard.current = true
    const frame = requestAnimationFrame(() => {
      if (boardOpen) document.getElementById('pixel-board-title')?.focus({ preventScroll: true })
      else {
        const target = returnTarget.current
        if (target?.isConnected && target.getClientRects().length && !target.closest('[hidden], [inert]')) target.focus({ preventScroll: true })
        else {
          const door = document.querySelector<HTMLAnchorElement>('.entrance-link')
          door?.scrollIntoView({ block: 'center' })
          ;(door ?? directory.current)?.focus({ preventScroll: true })
        }
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [boardOpen])

  const rememberEntrance = (event: MouseEvent<HTMLDivElement>) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href="#/pixels"]')
    if (!link || boardOpen || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    returnTarget.current = link.closest('dialog') ? opener.current : link
    enteredFromHome.current = true
  }
  const backToBuilding = () => {
    if (history.state?.pixelBoardEntry) history.back()
    else window.location.replace('#building')
  }
  const select = (asset: BuildingAsset) => open({ type: 'asset', asset })
  const selected = panel?.type === 'asset' ? panel.asset : null
  const destination = selected?.destination
  const project = destination?.type === 'project' ? projects.find((item) => item.id === destination.id) : undefined

  return (
    <div onClickCapture={rememberEntrance}>
      <div className="site-shell">
        <a className="skip-link" href={boardOpen ? '#/pixels' : '#residents'} onClick={boardOpen ? (event) => { event.preventDefault(); document.getElementById('pixel-board-title')?.focus() } : undefined}>{boardOpen ? 'Skip to pixel board' : 'Skip to scene'}</a>
        <header className="site-header">
          <a className="wordmark" href={boardOpen ? '#building' : '#residents'} onClick={boardOpen ? (event) => { event.preventDefault(); backToBuilding() } : undefined}><span aria-hidden="true">▦</span> run-a-wei place</a>
          <nav aria-label="Main navigation"><button ref={directory} type="button" className="directory-button" onClick={() => open({ type: 'directory' })}>Directory <span aria-hidden="true">↗</span></button></nav>
        </header>
        <SceneExplorer hidden={boardOpen} suspended={boardOpen || panel !== null} onSelect={select} />
        {boardOpen && <PixelBoard onBack={backToBuilding} onInquire={() => open({ type: 'board' })} />}
      </div>
      {panel?.type === 'directory' && (
        <Dialog title="Neighborhood directory" onClose={close}>
          <p className="eyebrow">The people & possibilities inside</p><h2>Find your spot.</h2><p>Windows, hanging signs, and a few feathered neighbors. Explore the demo projects or find a space for your own.</p>
          <ul className="directory-list">{locations.map((asset) => <li key={asset.id}><AssetAction asset={asset} onSelect={select} className="directory-item"><span className="directory-id">{asset.id}</span><span>{asset.label}</span><span className={`directory-status directory-status--${asset.status}`}>{asset.status === 'vacant' ? 'Available ↗' : asset.status === 'reserved' ? 'Reserved' : 'Open ↗'}</span></AssetAction></li>)}</ul>
        </Dialog>
      )}
      {panel?.type === 'board' && <InquiryDialog asset={boardInquiryTarget} scope="board" onClose={close} />}
      {selected?.status === 'vacant' && <InquiryDialog key={selected.id} asset={selected} onClose={close} />}
      {selected?.status === 'occupied' && (
        <Dialog title={project?.title ?? selected.label} onClose={close}>
          {project ? <><div className="project-art"><img src={project.artwork} alt="" /></div><p className="eyebrow">{project.category}</p><h2>{project.title}</h2><p>{project.description}</p></> : <><h2>Project not found.</h2><p>This location’s project details haven’t been configured yet.</p></>}
          <button type="button" className="button button--primary" onClick={close}>Back to exploring</button>
        </Dialog>
      )}
    </div>
  )
}
