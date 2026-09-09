import type { CSSProperties, ReactNode } from 'react'
import { externalHref, type BuildingAsset, type BuildingScene as Scene } from '../building'

const statusLabels = { occupied: 'Open project', vacant: 'For rent', reserved: 'Reserved', decorative: '' }

type Props = {
  scene: Scene
  onSelect: (asset: BuildingAsset) => void
}

export function AssetAction({ asset, className, style, onSelect, children }: {
  asset: BuildingAsset
  className?: string
  style?: CSSProperties
  onSelect: (asset: BuildingAsset) => void
  children: ReactNode
}) {
  if (asset.status === 'occupied' && asset.destination?.type === 'page') {
    return <a href="#/pixels" className={className} style={style} aria-label={asset.label}>{children}</a>
  }
  if (asset.status === 'occupied' && asset.destination?.type === 'external') {
    const href = externalHref(asset.destination.url)
    if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style} aria-label={`${asset.label} (opens in a new tab)`}>{children}</a>
  }
  if (asset.status === 'vacant' || (asset.status === 'occupied' && asset.destination?.type === 'project')) {
    return <button type="button" className={className} style={style} onClick={() => onSelect(asset)} aria-label={asset.status === 'vacant' ? `Inquire about ${asset.id}: ${asset.label}` : `Open ${asset.label}`}>{children}</button>
  }
  return <div className={className} style={style}>{children}</div>
}

export default function BuildingScene({ scene, onSelect }: Props) {
  return (
    <section className="building-scene" aria-label={scene.label} data-scene={scene.id} style={{ aspectRatio: `${scene.width} / ${scene.height}` }}>
      <img className="scene-background" src={scene.background} alt="" width={scene.width} height={scene.height} draggable="false" />
      {scene.assets.filter((asset) => asset.enabled !== false).map((asset) => {
        const style: CSSProperties = {
          left: `${asset.x / scene.width * 100}%`,
          top: `${asset.y / scene.height * 100}%`,
          width: `${asset.width / scene.width * 100}%`,
          height: `${asset.height / scene.height * 100}%`,
          zIndex: asset.layer ?? 1,
        }
        if (asset.presentation === 'hotspot') return (
          <AssetAction key={asset.id} asset={asset} onSelect={onSelect} className="entrance-link" style={style}>
            <span>Enter ↗</span>
          </AssetAction>
        )
        if (asset.status === 'decorative') return <img key={asset.id} src={asset.artwork} alt="" className="decoration" style={style} draggable="false" />
        if (asset.presentation === 'object') return (
          <AssetAction key={asset.id} asset={asset} onSelect={onSelect} className={`scene-object scene-object--${asset.status}`} style={style}>
            <img src={asset.artwork} alt="" draggable="false" />
            <span className="object-caption">{asset.label}<span>{asset.status === 'vacant' ? 'For rent ↗' : asset.status === 'reserved' ? 'Reserved' : 'Open ↗'}</span></span>
          </AssetAction>
        )
        return (
          <AssetAction key={asset.id} asset={asset} onSelect={onSelect} className={`window window--${asset.status}${asset.animation === 'lift' ? ' window--lift' : ''}`} style={style}>
            <span className="window-lintel" aria-hidden="true" />
            <span className="window-frame">
              <span className="window-glass" aria-hidden="true">
                <span className="window-curtain window-curtain--left" /><span className="window-curtain window-curtain--right" />
                {asset.status === 'occupied' && <img className="window-prop" src={asset.artwork} alt="" draggable="false" />}
                <span className="window-mullion" /><span className="window-sash" />
              </span>
              <span className="window-placard"><span className="window-label">{asset.label}</span><span className="window-action">{asset.status === 'occupied' && asset.destination?.type === 'external' ? 'Visit website ↗' : statusLabels[asset.status]}</span></span>
            </span>
            <span className="window-sill" aria-hidden="true" />
          </AssetAction>
        )
      })}
    </section>
  )
}
