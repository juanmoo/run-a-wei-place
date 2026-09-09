import { test, expect, type Page } from '@playwright/test'
import { WheelGate, edgesAt, wheelPixels } from '../src/sceneNavigation'

const middle = { top: false, bottom: false }
const bottom = { top: false, bottom: true }

test('wheel gate separates arrival, fresh intent, and momentum', () => {
  const gate = new WheelGate()
  expect(gate.step(0, 5000, middle).direction).toBeUndefined()
  expect(gate.step(100, 5000, bottom).direction).toBeUndefined()
  expect(gate.step(400, 20, bottom).direction).toBeUndefined()
  expect(gate.step(420, 25, bottom).direction).toBe(1)
  expect(gate.step(500, 3000, middle)).toEqual({ consume: true })
  expect(gate.step(700, -2000, { top: true, bottom: false })).toEqual({ consume: true })
  expect(gate.step(1000, -60, { top: true, bottom: false }).direction).toBe(-1)
  expect(wheelPixels(3, 1, 800)).toBe(48)
  expect(wheelPixels(1, 2, 800)).toBe(800)
  expect(edgesAt(0, 400, 600)).toEqual({ top: true, bottom: true })
})

async function atBottom(page: Page) {
  await page.locator('#residents').evaluate((el) => { el.scrollTop = el.scrollHeight })
}

async function swipe(page: Page, from: number, to: number, start = true, end = true) {
  await page.locator('#residents').evaluate((el, options) => {
    const touch = (y: number) => new Touch({ identifier: 1, target: el, clientX: 180, clientY: y })
    if (options.start) el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch(options.from)], bubbles: true }))
    el.dispatchEvent(new TouchEvent('touchmove', { touches: [touch(options.to)], bubbles: true, cancelable: true }))
    if (options.end) el.dispatchEvent(new TouchEvent('touchend', { touches: [], bubbles: true }))
  }, { from, to, start, end })
}

test.beforeEach(async ({ page }) => { await page.goto('/') })

test('native wheel arrival stops; fresh intent advances once and reverses to bottom', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Native wheel exercised on desktop; mobile has separate touch tests.')
  const area = page.locator('#residents')
  await page.waitForTimeout(300)
  await area.hover()
  await page.mouse.wheel(0, 10000)
  await expect.poll(() => area.evaluate((el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 2)).toBeTruthy()
  await expect(page.locator('[data-scene="building"]')).toBeVisible()
  await page.waitForTimeout(300)
  await page.mouse.wheel(0, 120)
  await expect(page.locator('[data-scene="tree"]')).toBeVisible()
  await page.mouse.wheel(0, 10000)
  expect(await area.evaluate((el) => el.scrollTop)).toBe(0)
  await page.waitForTimeout(300)
  await page.mouse.wheel(0, -120)
  await expect(page.locator('[data-scene="building"]')).toBeVisible()
  await expect.poll(() => area.evaluate((el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 2)).toBeTruthy()
})

test('touch requires a fresh edge swipe, ignores multitouch, and stays finite', async ({ page }) => {
  await swipe(page, 500, 450, true, false)
  await atBottom(page)
  await swipe(page, 500, 350, false)
  await expect(page.locator('[data-scene="building"]')).toBeVisible()
  await swipe(page, 500, 400)
  await expect(page.locator('[data-scene="tree"]')).toBeVisible()
  await page.waitForTimeout(200)
  await atBottom(page)
  await swipe(page, 500, 400)
  await expect(page.locator('[data-scene="tree"]')).toBeVisible()
  await page.locator('#residents').evaluate((el) => {
    el.scrollTop = 0
    const touches = [1, 2].map((identifier) => new Touch({ identifier, target: el, clientX: 100, clientY: 200 }))
    el.dispatchEvent(new TouchEvent('touchstart', { touches }))
    el.dispatchEvent(new TouchEvent('touchmove', { touches, cancelable: true }))
    el.dispatchEvent(new TouchEvent('touchcancel'))
  })
  await expect(page.locator('[data-scene="tree"]')).toBeVisible()
  await swipe(page, 300, 400)
  await expect(page.locator('[data-scene="building"]')).toBeVisible()
})

test('keyboard repeats do not cross boundaries and reduced motion disables animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await atBottom(page)
  const area = page.locator('#residents')
  await area.focus()
  await area.dispatchEvent('keydown', { key: 'ArrowDown', repeat: true })
  await expect(page.locator('[data-scene="building"]')).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('[data-scene="tree"]')).toBeVisible()
  expect(await page.locator('.scene-entry').evaluate((el) => getComputedStyle(el).animationName)).toBe('none')
  await area.dispatchEvent('keydown', { key: 'ArrowUp', repeat: true })
  await expect(page.locator('[data-scene="tree"]')).toBeVisible()
})

test('directory can open inactive tree location without navigation or focus loss', async ({ page }) => {
  const directory = page.getByRole('button', { name: 'Directory', exact: true })
  await directory.click()
  await page.getByRole('button', { name: 'Inquire about TREE-B: Open perch' }).click()
  await expect(page.locator('input[name="location_id"]')).toHaveValue('TREE-B')
  await expect(page.locator('#residents')).toHaveAttribute('inert', '')
  await atBottom(page)
  await page.locator('#residents').dispatchEvent('wheel', { deltaY: 1000 })
  await expect(page.locator('[data-scene="building"]')).toBeAttached()
  await page.getByRole('dialog').evaluate((el) => { el.scrollTop = el.scrollHeight })
  expect(await page.getByRole('dialog').evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  await page.keyboard.press('Escape')
  await expect(directory).toBeFocused()
  await expect(page.locator('#residents')).not.toHaveAttribute('inert')
})

test('short scenes and narrow layouts retain navigation without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 1200 })
  await expect.poll(() => page.locator('#residents').evaluate((el) => el.scrollHeight <= el.clientHeight)).toBeTruthy()
  await page.getByRole('button', { name: 'Next →', exact: true }).click()
  await expect(page.locator('[data-scene="tree"]')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  await page.setViewportSize({ width: 640, height: 360 })
  expect(await page.locator('#residents').evaluate((el) => el.scrollHeight > el.clientHeight)).toBeTruthy()
  await expect(page.getByRole('button', { name: 'Previous' })).toBeInViewport()
})
