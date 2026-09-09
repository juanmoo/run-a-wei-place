import { test, expect } from '@playwright/test'
import { pixelBoard, enabledPixelBlocks, validatePixelBoard } from '../src/pixelBoard'

test('board configuration validates geometry, IDs, links, and overlaps', () => {
  expect(() => validatePixelBoard(pixelBoard)).not.toThrow()
  const first = pixelBoard.blocks[0]
  const config = (blocks: typeof pixelBoard.blocks) => ({ ...pixelBoard, blocks })
  expect(() => validatePixelBoard(config([first, first]))).toThrow(/unique/)
  expect(() => validatePixelBoard(config([{ ...first, x: 3 }]))).toThrow(/grid/)
  expect(() => validatePixelBoard(config([{ ...first, width: 0 }]))).toThrow(/positive/)
  expect(() => validatePixelBoard(config([{ ...first, x: 990 }]))).toThrow(/within/)
  expect(() => validatePixelBoard(config([{ ...first, url: 'javascript:alert(1)' }]))).toThrow(/unsafe/)
  expect(() => validatePixelBoard(config([first, { ...first, id: 'overlap' }]))).toThrow(/overlap/)
  expect(() => validatePixelBoard(config([first, { ...first, id: 'disabled', enabled: false }]))).not.toThrow()
})

test.beforeEach(async ({ page }) => {
  await page.route('https://formspree.io/**', route => route.fulfill({ status: 200, json: { ok: true } }))
})

test('door matches artwork and supports entry, history, scroll and focus return', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('run-a-wei place')
  const door = page.locator('.entrance-link')
  await door.scrollIntoViewIfNeeded()
  const sceneBox = (await page.locator('[data-scene="building"]').boundingBox())!
  const doorBox = (await door.boundingBox())!
  expect(Math.abs((doorBox.x - sceneBox.x) / sceneBox.width - 404 / 700)).toBeLessThan(.002)
  expect(Math.abs((doorBox.y - sceneBox.y) / sceneBox.height - 1204 / 1500)).toBeLessThan(.002)
  const scroll = await page.locator('#residents').evaluate(el => el.scrollTop)
  await door.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/pixels$/)
  await expect(page.locator('#pixel-board-title')).toBeFocused()
  await expect(page.locator('#building')).toBeHidden()
  await expect(page.locator('#building')).toHaveAttribute('inert', '')
  await page.locator('#residents').dispatchEvent('wheel', { deltaY: 1000 })
  await page.getByRole('button', { name: 'Back to building' }).click()
  await expect(door).toBeFocused()
  await expect.poll(() => page.locator('#residents').evaluate(el => el.scrollTop)).toBeCloseTo(scroll, 0)
  await page.goForward()
  await expect(page.locator('#pixel-page')).toBeVisible()
  await page.goBack()
  await expect(door).toBeFocused()
})

test('direct loads, refresh, actual size, links, and fallback return work', async ({ page }) => {
  await page.goto('/#/pixels')
  await page.reload()
  await expect(page.locator('#pixel-page')).toBeVisible()
  await expect(page.locator('.pixel-board__block')).toHaveCount(enabledPixelBlocks.length)
  await expect.poll(() => page.locator('.pixel-board__block img').evaluateAll(images => images.every(img => (img as HTMLImageElement).naturalWidth > 0))).toBeTruthy()
  for (const block of enabledPixelBlocks) {
    await expect(page.locator('.pixel-board__block').filter({ hasText: block.id })).toHaveAttribute('href', block.url!)
  }
  await page.getByRole('button', { name: 'Actual size' }).click()
  expect((await page.locator('.pixel-board__canvas').boundingBox())!.width).toBe(1000)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await page.getByRole('button', { name: 'Fit overview' }).click()
  await page.getByText('Accessible demo link list', { exact: true }).click()
  await expect(page.locator('.pixel-board__directory a')).toHaveCount(enabledPixelBlocks.length)
  await page.getByRole('button', { name: 'Back to building' }).click()
  await expect(page.locator('.entrance-link')).toBeFocused()
  await expect(page.locator('.entrance-link')).toBeInViewport()
})

test('directory preserves the tree and board inquiry submits a general identifier', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Next →', exact: true }).click()
  const directory = page.getByRole('button', { name: 'Directory', exact: true })
  await directory.click()
  await page.getByRole('link', { name: 'Enter the pixel board', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const inquire = page.getByRole('button', { name: 'Inquire about space' })
  await inquire.click()
  await expect(page.getByRole('dialog')).toContainText('Pixels cannot be purchased directly')
  await expect(page.locator('input[name="location_id"]')).toHaveValue('PIXEL-BOARD')
  await page.getByLabel('Name', { exact: true }).fill('Test visitor')
  await page.getByLabel('Email', { exact: true }).fill('visitor@example.com')
  await page.getByLabel('Project or business name').fill('Test project')
  await page.getByLabel('Destination URL').fill('https://example.com')
  await page.getByLabel('Short description').fill('Demo inquiry')
  let body = ''
  await page.route('https://formspree.io/**', route => {
    body = route.request().postData() ?? ''
    return route.fulfill({ status: 200, json: { ok: true } })
  })
  await page.getByRole('button', { name: 'Send inquiry' }).click()
  await expect(page.getByRole('heading', { name: 'Inquiry received.' })).toBeVisible()
  expect(body).toContain('PIXEL-BOARD')
  await page.keyboard.press('Escape')
  await expect(inquire).toBeFocused()
  await page.getByRole('button', { name: 'Back to building' }).click()
  await expect(page.locator('[data-scene="tree"]')).toBeVisible()
  await expect(directory).toBeFocused()
})

test('changing pages closes an open inquiry', async ({ page }) => {
  await page.goto('/')
  await page.locator('.entrance-link').click()
  await page.getByRole('button', { name: 'Inquire about space' }).click()
  await page.goBack()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.entrance-link')).toBeFocused()
})
