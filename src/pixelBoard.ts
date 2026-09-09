import { externalHref } from './building'

export interface PixelBlock {
  id: string
  label: string
  artwork: string
  x: number
  y: number
  width: number
  height: number
  url?: string
  enabled?: boolean
}

export interface PixelBoardConfig {
  width: number
  height: number
  grid: number
  blocks: PixelBlock[]
}

export const pixelBoard: PixelBoardConfig = {
  width: 1000,
  height: 1000,
  grid: 10,
  blocks: [
    { id: 'P-01', label: 'Sunset type lab', artwork: '/art/pixels/sunset-type.svg', x: 70, y: 70, width: 270, height: 180, url: 'https://example.com/pixel-board/sunset-type' },
    { id: 'P-02', label: 'Night radio demo', artwork: '/art/pixels/night-radio.svg', x: 610, y: 90, width: 250, height: 240, url: 'https://example.com/pixel-board/night-radio' },
    { id: 'P-03', label: 'Soft signal demo', artwork: '/art/pixels/soft-signal.svg', x: 410, y: 390, width: 180, height: 300, url: 'https://example.com/pixel-board/soft-signal' },
    { id: 'P-04', label: 'Cloud club demo', artwork: '/art/pixels/cloud-club.svg', x: 700, y: 510, width: 220, height: 170, url: 'https://example.com/pixel-board/cloud-club' },
    { id: 'P-05', label: 'Tiny arcade demo', artwork: '/art/pixels/tiny-arcade.svg', x: 90, y: 660, width: 250, height: 190, url: 'https://example.com/pixel-board/tiny-arcade' },
    { id: 'P-06', label: 'Hidden sample', artwork: '/art/pixels/soft-signal.svg', x: 30, y: 300, width: 120, height: 120, url: 'https://example.com/pixel-board/hidden', enabled: false },
  ],
}

export const enabledPixelBlocks = pixelBoard.blocks.filter((block) => block.enabled !== false)

export const boardInquiryTarget = { id: 'PIXEL-BOARD', label: 'Pixel board' }

/** Returns only safe, absolute web URLs for links that open outside the site. */
export function safeExternalHref(url: string | undefined): string | undefined {
  return url ? externalHref(url) : undefined
}

export function validatePixelBoard(config: PixelBoardConfig): void {
  const { width, height, grid, blocks } = config
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) throw new Error('Pixel board width and height must be positive integers.')
  if (!Number.isInteger(grid) || grid <= 0) throw new Error('Pixel board grid must be a positive integer.')
  const ids = new Set<string>()
  const enabled: PixelBlock[] = []

  for (const block of blocks) {
    if (!block.id || ids.has(block.id)) throw new Error(`Pixel board block IDs must be unique; invalid ID: "${block.id}".`)
    ids.add(block.id)
    for (const [name, value] of Object.entries({ x: block.x, y: block.y, width: block.width, height: block.height })) {
      if (!Number.isInteger(value)) throw new Error(`Block ${block.id} ${name} must be an integer.`)
      if (value % grid !== 0) throw new Error(`Block ${block.id} ${name} must align to the ${grid}px grid.`)
    }
    if (block.width <= 0 || block.height <= 0) throw new Error(`Block ${block.id} must have positive width and height.`)
    if (block.x < 0 || block.y < 0 || block.x + block.width > width || block.y + block.height > height) throw new Error(`Block ${block.id} must stay within the ${width}×${height} board.`)
    if (block.url && !safeExternalHref(block.url)) throw new Error(`Block ${block.id} has an unsafe external URL.`)
    if (block.enabled !== false) enabled.push(block)
  }

  for (let i = 0; i < enabled.length; i += 1) {
    for (let j = i + 1; j < enabled.length; j += 1) {
      const a = enabled[i]
      const b = enabled[j]
      if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) {
        throw new Error(`Enabled blocks ${a.id} and ${b.id} overlap.`)
      }
    }
  }
}

validatePixelBoard(pixelBoard)
