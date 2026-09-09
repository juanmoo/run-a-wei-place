import { test, expect } from '@playwright/test'
import { scenes, projects, externalHref } from '../src/building'

test('configuration has unique IDs and valid occupied destinations', () => {
  const assets = scenes.flatMap((scene) => scene.assets)
  expect(new Set(assets.map((asset) => asset.id)).size).toBe(assets.length)
  for (const asset of assets.filter((item) => item.status === 'occupied')) {
    expect(asset.destination).toBeTruthy()
    if (asset.destination?.type === 'project') {
      const id = asset.destination.id
      expect(projects.some((project) => project.id === id)).toBeTruthy()
    }
  }
  expect(externalHref('javascript:alert(1)')).toBeUndefined()
})

test.beforeEach(async ({ page }) => {
  // Every form request is intercepted: tests never send contact data to a service.
  await page.route('https://formspree.io/**', (route) => route.fulfill({ status: 200, json: { ok: true } }))
  await page.goto('/')
})

test('complete scenes, loaded artwork, bounded navigation and working projects', async ({ page }) => {
  expect(scenes.map((scene) => scene.id)).toEqual(['building', 'tree'])
  const windows = scenes[0].assets.filter((asset) => asset.presentation === 'window')
  const floors = new Set(windows.map((asset) => asset.floor))
  expect(floors.size).toBe(4)
  for (const floor of floors) expect(windows.filter((asset) => asset.floor === floor).length).toBeLessThanOrEqual(2)
  expect(new Set(windows.map((asset) => `${asset.width}x${asset.height}`)).size).toBeGreaterThan(3)
  await expect(page.locator('[data-scene]')).toHaveCount(1)
  await expect(page.locator('[data-scene="building"]')).toBeVisible()
  await expect(page.locator('.window')).toHaveCount(7)
  await expect(page.locator('.window-frame')).toHaveCount(7)
  await expect(page.locator('.window-lintel')).toHaveCount(7)
  await expect(page.locator('.window-sill')).toHaveCount(7)
  await expect(page.locator('.window-bar, .window-status')).toHaveCount(0)
  await expect(page.locator('.window--vacant .window-action')).toHaveText(['For rent', 'For rent'])
  await expect(page.locator('.window--vacant img, .window--reserved img')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  expect(await page.locator('img').evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBeTruthy()
  const target = page.getByRole('button', { name: 'Open Pixel garden', exact: true })
  await target.click()
  await expect(page.getByRole('heading', { name: 'Pixel garden' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(target).toBeFocused()
  await expect(page.getByRole('link', { name: /Made for the web/ })).toHaveAttribute('href', 'https://developer.mozilla.org/en-US/docs/Web')
  await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled()
  await page.getByRole('button', { name: 'Next →', exact: true }).click()
  await expect(page.locator('[data-scene="tree"]')).toBeVisible()
  await expect(page.locator('[data-scene]')).toHaveCount(1)
  await expect(page.locator('.scene-object')).toHaveCount(4)
  await expect(page.getByRole('button', { name: 'Next →', exact: true })).toBeDisabled()
  await expect.poll(() => page.locator('img').evaluateAll((images) => images.every((image) => (image as HTMLImageElement).naturalWidth > 0))).toBeTruthy()
  await expect(page.locator('#residents')).toBeFocused()
})

test('shared sky loads and tree locations retain their actions', async ({ page }) => {
  const sky = await page.locator('#residents').evaluate((el) => getComputedStyle(el).backgroundImage)
  expect(sky).toContain('sky-clouds.svg')
  expect(sky).toContain('linear-gradient')
  expect(await page.evaluate(async () => {
    const image = new Image()
    image.src = '/art/sky-clouds.svg'
    await image.decode()
    return image.naturalWidth > 0
  })).toBeTruthy()
  await page.getByRole('button', { name: 'Next →', exact: true }).click()
  const vacancy = page.getByRole('button', { name: 'Inquire about TREE-B: Open perch', exact: true })
  await expect(vacancy).toContainText('For rent')
  await vacancy.click()
  await expect(page.locator('input[name="location_id"]')).toHaveValue('TREE-B')
  await page.keyboard.press('Escape')
  await expect(vacancy).toBeFocused()
  await page.getByRole('button', { name: 'Open Finch radio', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Mixtape club', exact: true })).toBeVisible()
})

test('directory and both vacancies identify their locations', async ({ page }) => {
  await page.getByRole('button', { name: 'Directory' }).click()
  await expect(page.getByRole('dialog')).toContainText('Reserved')
  await page.getByRole('button', { name: 'Inquire about 02-B: Your next idea' }).last().click()
  await expect(page.locator('input[name="location_id"]')).toHaveValue('02-B')
  await page.getByRole('button', { name: 'Close dialog' }).click()
  await page.getByRole('button', { name: 'Inquire about 00-B: Room for you' }).click()
  await expect(page.locator('input[name="location_id"]')).toHaveValue('00-B')
  await page.keyboard.press('Escape')
})

test('form validates, retains values on failure, and confirms mocked delivery', async ({ page }) => {
  await page.getByRole('button', { name: 'Inquire about 02-B: Your next idea' }).click()
  await page.getByRole('button', { name: 'Send inquiry' }).click()
  expect(await page.locator('form').evaluate((form) => (form as HTMLFormElement).checkValidity())).toBeFalsy()
  await page.getByLabel('Name', { exact: true }).fill('Test visitor')
  await page.getByLabel('Email', { exact: true }).fill('visitor@example.com')
  await page.getByLabel('Project or business name').fill('Test project')
  await page.getByLabel('Destination URL').fill('https://example.com')
  await page.getByLabel('Short description').fill('Test description')
  await page.route('https://formspree.io/**', (route) => route.fulfill({ status: 500, json: { error: 'Test failure' } }))
  await page.getByRole('button', { name: 'Send inquiry' }).click()
  await expect(page.getByRole('alert')).toContainText('couldn’t confirm delivery')
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('visitor@example.com')
  let submitted = ''
  await page.route('https://formspree.io/**', (route) => {
    submitted = route.request().postData() ?? ''
    return route.fulfill({ status: 200, json: { ok: true } })
  })
  await page.getByRole('button', { name: 'Send inquiry' }).click()
  await expect(page.getByRole('heading', { name: 'Inquiry received.' })).toBeVisible()
  expect(submitted).toContain('02-B')
  expect(submitted).toContain('Test project')
})
