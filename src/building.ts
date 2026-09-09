export type AssetStatus = 'occupied' | 'vacant' | 'reserved' | 'decorative'

export type Destination =
  | { type: 'project'; id: string }
  | { type: 'external'; url: string }
  | { type: 'page'; page: 'pixels' }

export interface BuildingAsset {
  id: string
  label: string
  artwork: string
  x: number
  y: number
  width: number
  height: number
  status: AssetStatus
  destination?: Destination
  layer?: number
  enabled?: boolean
  animation?: 'none' | 'lift'
  /** Windows are counted by floor; objects are intentionally free-positioned. */
  presentation?: 'window' | 'object' | 'hotspot'
  floor?: number
}

export interface BuildingScene {
  id: string
  label: string
  width: number
  height: number
  background: string
  assets: BuildingAsset[]
}

export interface Project {
  id: string
  title: string
  category: string
  description: string
  artwork: string
}

// Demo tenants: replace these with your own work before launch.
export const projects: Project[] = [
  {
    id: 'pixel-garden',
    title: 'Pixel garden',
    category: 'Demo project · Creative coding',
    description: 'A small corner for experiments that grow into something else. This is a placeholder project—replace its title, illustration, and description with your own work in src/building.ts.',
    artwork: '/art/flower.svg',
  },
  {
    id: 'mixtape',
    title: 'Mixtape club',
    category: 'Demo project · Music & the web',
    description: 'A home for songs, shared links, and things worth keeping. This demo window shows how a project can live inside the building. Add your own project here, or point the window to an external website.',
    artwork: '/art/disc.svg',
  },
  {
    id: 'small-hours',
    title: 'Small hours',
    category: 'Demo project · Design experiments',
    description: 'A little studio for ideas made after hours. This is sample content, not a real tenant. Swap it for a project you want people to discover.',
    artwork: '/art/star.svg',
  },
]

export const scenes: BuildingScene[] = [
  {
    id: 'building',
    label: 'Four storey little building',
    width: 700,
    height: 1500,
    background: '/art/building.svg',
    assets: [
      { id: '02-A', label: 'Pixel garden', artwork: '/art/flower.svg', x: 106, y: 296, width: 170, height: 185, status: 'occupied', destination: { type: 'project', id: 'pixel-garden' }, presentation: 'window', floor: 2 },
      { id: '02-B', label: 'Your next idea', artwork: '/art/vacant.svg', x: 390, y: 330, width: 190, height: 145, status: 'vacant', presentation: 'window', floor: 2 },
      { id: '01-A', label: 'Mixtape club', artwork: '/art/disc.svg', x: 130, y: 610, width: 195, height: 150, status: 'occupied', destination: { type: 'project', id: 'mixtape' }, presentation: 'window', floor: 1 },
      { id: '01-B', label: 'Something good', artwork: '/art/reserved.svg', x: 402, y: 565, width: 165, height: 190, status: 'reserved', presentation: 'window', floor: 1 },
      { id: '00-A', label: 'Small hours', artwork: '/art/star.svg', x: 94, y: 886, width: 200, height: 190, status: 'occupied', destination: { type: 'project', id: 'small-hours' }, presentation: 'window', floor: 0 },
      { id: '00-B', label: 'Room for you', artwork: '/art/vacant.svg', x: 382, y: 918, width: 180, height: 145, status: 'vacant', presentation: 'window', floor: 0 },
      { id: 'G-B', label: 'Street studio', artwork: '/art/plant.svg', x: 106, y: 1210, width: 190, height: 150, status: 'reserved', presentation: 'window', floor: -1 },
      { id: 'G-A', label: 'Made for the web', artwork: '/art/hanging-sign.svg', x: 565, y: 780, width: 130, height: 175, status: 'occupied', destination: { type: 'external', url: 'https://developer.mozilla.org/en-US/docs/Web' }, presentation: 'object', layer: 3 },
      { id: 'ENTRANCE', label: 'Enter the pixel board', artwork: '', x: 404, y: 1204, width: 140, height: 154, status: 'occupied', destination: { type: 'page', page: 'pixels' }, presentation: 'hotspot', layer: 3 },
      { id: 'plant', label: 'Hanging planter', artwork: '/art/hanging-planter.svg', x: 8, y: 525, width: 100, height: 155, status: 'decorative', presentation: 'object', layer: 2 },
    ],
  },
  {
    id: 'tree',
    label: 'Neighbourhood tree',
    width: 700,
    height: 1200,
    background: '/art/tree.svg',
    assets: [
      { id: 'TREE-A', label: 'Finch radio', artwork: '/art/birdhouse-occupied.svg', x: 99, y: 260, width: 170, height: 190, status: 'occupied', destination: { type: 'project', id: 'mixtape' }, presentation: 'object' },
      { id: 'TREE-B', label: 'Open perch', artwork: '/art/birdhouse-vacant.svg', x: 397, y: 385, width: 175, height: 185, status: 'vacant', presentation: 'object' },
      { id: 'TREE-C', label: 'Seed counter', artwork: '/art/feeder.svg', x: 153, y: 705, width: 185, height: 200, status: 'reserved', presentation: 'object' },
      { id: 'TREE-D', label: 'Quiet nook', artwork: '/art/birdhouse-reserved.svg', x: 390, y: 770, width: 165, height: 185, status: 'reserved', presentation: 'object' },
    ],
  },
]

export const locations = scenes.flatMap((scene) => scene.assets).filter((asset) => asset.enabled !== false && asset.status !== 'decorative')

export function externalHref(url: string): string | undefined {
  try {
    const parsed = new URL(url)
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : undefined
  } catch {
    return undefined
  }
}
