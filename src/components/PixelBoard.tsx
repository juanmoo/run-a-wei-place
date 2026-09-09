import { useState, type CSSProperties } from 'react'
import { enabledPixelBlocks, pixelBoard, safeExternalHref } from '../pixelBoard'
import '../pixel-board.css'

type Props = {
  onInquire: () => void
  onBack: () => void
}

export default function PixelBoard({ onInquire, onBack }: Props) {
  const [actualSize, setActualSize] = useState(false)

  return (
    <main id="pixel-page" aria-labelledby="pixel-board-title">
      <header className="pixel-board__masthead">
        <div>
          <p className="pixel-board__eyebrow">run-a-wei place / experimental annex</p>
          <h1 id="pixel-board-title" tabIndex={-1}>The pixel board</h1>
          <p className="pixel-board__intro">A canvas of image links. These are demo tiles, not paid placements.</p>
        </div>
        <div className="pixel-board__actions">
          <button type="button" className="pixel-board__button pixel-board__button--quiet" onClick={onBack}>← Back to building</button>
          <button type="button" className="pixel-board__button" onClick={onInquire}>Inquire about space ↗</button>
        </div>
      </header>

      <section className="pixel-board__stage" aria-label="Interactive pixel board">
        <div className="pixel-board__stage-bar">
          <span><b>DEMO BOARD</b> · 1000 × 1000 pixels</span>
          <button type="button" className="pixel-board__size-toggle" onClick={() => setActualSize((value) => !value)} aria-pressed={actualSize}>
            {actualSize ? 'Fit overview' : 'Actual size (1000px)'}
          </button>
        </div>
        <div className={`pixel-board__viewport${actualSize ? ' pixel-board__viewport--actual' : ''}`}>
          <div className="pixel-board__canvas" style={{ '--board-width': pixelBoard.width, '--board-height': pixelBoard.height } as CSSProperties}>
            <div className="pixel-board__corner-note pixel-board__corner-note--top">EMPTY GRID<br />GOOD IDEAS WELCOME</div>
            <div className="pixel-board__corner-note pixel-board__corner-note--bottom">10 PX<br />AT A TIME</div>
            {enabledPixelBlocks.map((block) => {
              const href = safeExternalHref(block.url)
              const style = { left: `${block.x / pixelBoard.width * 100}%`, top: `${block.y / pixelBoard.height * 100}%`, width: `${block.width / pixelBoard.width * 100}%`, height: `${block.height / pixelBoard.height * 100}%` }
              const contents = <><img src={block.artwork} alt="" draggable="false" /><span className="pixel-board__block-caption">{block.id} · {block.label}<small>Demo link ↗</small></span></>
              return href ? <a key={block.id} className="pixel-board__block" style={style} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${block.label}, demo link (opens in a new tab)`}>{contents}</a> : <div key={block.id} className="pixel-board__block" style={style}>{contents}</div>
            })}
          </div>
        </div>
      </section>

      <details className="pixel-board__directory">
        <summary>Accessible demo link list</summary>
        <ul>{enabledPixelBlocks.map((block) => {
          const href = safeExternalHref(block.url)
          return <li key={block.id}>{href ? <a href={href} target="_blank" rel="noopener noreferrer">{block.id} — {block.label} (demo link; opens in a new tab)</a> : <span>{block.id} — {block.label}</span>}</li>
        })}</ul>
      </details>
    </main>
  )
}
