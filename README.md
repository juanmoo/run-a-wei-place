# run-a-wei place

run-a-wei place is an illustrated portfolio with two separate scenes: a four-storey cartoon brick brownstone and a neighbourhood tree with birdhouses and feeders. The building uses warm masonry, sandstone trim, sash windows, and an iron-railed stoop; the surrounding interface retains its simple Y2K styling. Built with React, TypeScript, Vite, CSS, and SVG. No database, accounts, payments, or 3D rendering.

The included tenants are clearly labeled demo projects. Replace them before launch. Inquiries remain disabled until form delivery is configured.

## Run locally

Use Node.js 22.12+ (tested with Node.js 24) and npm.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). To keep the development server accessible only on this machine, use `npm run dev -- --host 127.0.0.1`.

```sh
npm run build   # Type check and build into dist/
npm run preview
```

Deploy `dist/` to any static host. Environment variables are compiled into the build, so rebuild after changing the form endpoint.

## Edit scenes and locations

`src/building.ts` holds scene, asset, and demo-project configuration. `src/components/BuildingScene.tsx` renders each scene; there is no graphical editor.

The current configuration contains:

- `building`: a `700 × 1500` four-storey building. Window assets are limited to two per floor and may use varied dimensions.
- `tree`: a `700 × 1200` neighbourhood tree with birdhouses and feeders.

Each scene has a unique ID, label, design width/height, background path, and asset list. Each asset has:

- A globally unique `id` and visitor-facing `label`.
- An `artwork` path plus `x`, `y`, `width`, and `height` in the scene's design coordinates.
- `status`: `occupied`, `vacant`, `reserved`, or `decorative`.
- An optional `destination`: `{ type: 'project', id: 'pixel-garden' }` or `{ type: 'external', url: 'https://example.com' }`.
- `presentation`: `window` or `object`. Use `window` for building windows and `object` for free-positioned elements such as the hanging sign, birdhouses, and feeders.
- An optional `floor` for window assets, plus optional `layer` (defaults to 1), `enabled` (defaults to true), and `animation` (`none` or `lift`; off by default and reduced-motion-aware).

Occupied project locations open a detail dialog. External destinations open a new tab and accept only HTTP/HTTPS URLs. Vacant locations open the shared inquiry dialog. Reserved locations are visible but noninteractive. Decorative assets render only their artwork. Setting `enabled: false` removes an asset from both the scene and directory.

### Occupy a vacancy

Keep the location ID and coordinates. Change its status, label, artwork, and destination:

```ts
{
  id: '02-B',
  label: 'Your project',
  artwork: '/art/your-project.svg',
  x: 390, y: 330, width: 190, height: 145,
  status: 'occupied',
  destination: { type: 'external', url: 'https://example.com' },
  presentation: 'window',
  floor: 2,
}
```

For an internal project dialog, add a matching entry to `projects` and use a `project` destination. No renderer edits are needed.

## Scene exploration and navigation

`src/components/SceneExplorer.tsx` presents one finite, native-scroll scene at a time with Previous and Next controls. Reaching a scene edge and making a fresh gesture moves to the adjacent scene; moving back restores the appropriate edge of the previous scene.

`src/hooks/useSceneNavigation.ts` handles wheel, touch, and keyboard input, while `src/sceneNavigation.ts` contains the edge and wheel-gesture logic:

- Wheel input uses a 250 ms idle gap to identify a fresh gesture, normalizes line and page deltas, and requires 40 px of eligible edgeward movement.
- Vertical swipes require 48 px at the relevant edge.
- Arrow keys, Page Up/Down, and Space navigate only from a scene edge; a fresh keypress navigates, while key repeats do not trigger additional transitions.
- Navigation is suspended while a modal dialog is open, and regular interactive controls keep their normal keyboard behavior.

Physical wheel behavior at browser scroll boundaries can vary, so this edge-detection approach cannot override every browser-level boundary behavior. Real Safari, touch-device, and trackpad behavior still need launch verification.

## Replace artwork with Figma exports

1. Create frames matching the scene coordinate spaces: building `700 × 1500`; tree `700 × 1200`.
2. Export each scene background separately from interactive artwork. Do not bake clickable windows, birdhouses, or feeders into a background.
3. Export icons/illustrations as SVG with a correct `viewBox`, or use raster images. Put trusted exports in `public/art/` and reference them with `/art/filename.svg`.
4. Transfer each interactive element's position and dimensions to its asset configuration. Coordinates describe the complete rendered asset.
5. Inspect desktop and phone layouts. Scene backgrounds and hit areas scale together; scenes are not forced to fill the viewport on phones.

For custom window treatment, update the shared window markup/styles in `src/components/BuildingScene.tsx` and `src/styles.css`. Window coordinates include the lintel, frame, and sill; trim moves and scales with each window rather than being baked into the background. Occupied windows show their configured artwork as an interior prop. Vacant windows use a physical “For rent” placard; reserved windows show blinds and a notice instead of their configured illustration. Object artwork still renders directly for all statuses. Architectural color tokens are scoped to `[data-scene="building"]`. The tree uses matching warm wood, muted green foliage, and cream/wood captions, while the main interface keeps its existing styling.

Both scene backgrounds have transparent sky areas. The full-width `.scene-scroll` background combines `public/art/sky-clouds.svg` with soft blue-to-warm gradients, so there is no rectangular sky boundary around the centered artwork. Keep exported scene skies transparent and clouds separate from interactive assets. This sky is static: no weather service, motion, or extra scroll space.

## Enable inquiry delivery

1. Create a form at Formspree and verify the recipient email address.
2. Copy `.env.example` to `.env`.
3. Set `VITE_FORMSPREE_ENDPOINT=https://formspree.io/f/YOUR_FORM_ID` using the actual public form endpoint.
4. Restart the development server, or rebuild and redeploy the site.
5. Submit a real test inquiry for each vacancy and verify receipt in the owner's inbox or Formspree dashboard. Confirm the location ID is correct.

Do not put private API keys or credentials into `VITE_` variables: they are visible in the browser. `.env` is ignored by Git. Configure any provider spam protection/domain restrictions in Formspree, and verify they work with the AJAX form before launch.

The form sends name, email, project/business name, proposed URL, description, optional notes, and the automatic `location_id`/`location_label`. Visitors see success only after the service returns a successful JSON response with `ok: true`. Failures retain entered values while the dialog remains open; a request times out after 15 seconds. Closing the dialog discards the draft and aborts any in-flight request, though an already received request may still be processed by the service.

Requests are manually reviewed and fulfilled. Submitting does not reserve a location or establish ownership. Review your privacy notice and any sponsorship terms before collecting real inquiries.

**Live delivery has not been verified:** no recipient or live endpoint was supplied. Automated test submissions do not establish real provider delivery.

## Pixel board

Click the brownstone entrance or select “Enter the pixel board” in the directory to open `#/pixels`. This is a separate page, not a third outdoor scene. Browser Back and the return button preserve the outdoor scene and scroll position during the session. Direct loads and refresh work on static hosting.

Edit `src/pixelBoard.ts` to manage the board. The initial canvas is 1000 × 1000 logical pixels with a 10-pixel placement grid. Each block has a unique `id`, a readable `label`, an `artwork` path, `x`, `y`, `width`, `height`, an HTTP/HTTPS `url`, and optional `enabled: false`. Put image files in `public/art/pixels/`. Enabled blocks must not overlap or extend beyond the board; configuration validation reports invalid positions, sizes, duplicate IDs, and unsafe URLs.

The included tiles are original demo artwork with example.com destinations, not real sponsors. Replace them before launch. Visitors can switch between a fit overview and a full-size, internally scrollable canvas, or use the text link list. There is no pixel selection, checkout, upload, or automatic reservation.

“Inquire about space” uses the existing form delivery service and sends `PIXEL-BOARD` as a general inquiry identifier. The owner reviews proposals and edits the configuration manually. Inquiries remain disabled until delivery is configured.

## Fly.io deployment

- App: `run-a-wei-place`
- Organization: **Casehopper** (`casehopper`), not personal
- Standard domain: `https://run-a-wei-place.fly.dev`
- Region: `iad`

The multi-stage `Dockerfile` builds the site and serves only `dist/` through unprivileged Nginx on port 8080. `.dockerignore` allowlists build inputs so local environment files and Git metadata are not uploaded. `fly.toml` enables HTTPS, a `/healthz` check, and a single small shared-CPU machine that can stop when idle and start on requests. Cold starts are possible; hosting and build usage remain subject to Fly.io billing.

Deploy updates from this directory:

```sh
flyctl deploy --remote-only --ha=false
flyctl status -a run-a-wei-place
```

To enable inquiry delivery on Fly, pass the verified public endpoint at build time and redeploy:

```sh
flyctl deploy --remote-only --ha=false --build-arg VITE_FORMSPREE_ENDPOINT=https://formspree.io/f/YOUR_FORM_ID
```

The default build has no form endpoint. Runtime environment variables alone do not update a compiled Vite frontend. Do not pass private credentials as frontend build arguments, and verify a real delivery separately.

## Tests

```sh
npx playwright install chromium
npm test
npm run build
```

On a Linux installation missing browser system libraries, install Playwright's required dependencies with `npx playwright install --with-deps chromium` (may require administrator access).

Browser tests exercise the app with a dedicated Vite server on port 4173. Provider requests are intercepted; real browser and email-delivery checks remain separate launch work.

## Project layout

- `src/App.tsx`: landing page, directory, and dialog selection.
- `src/building.ts`: scene/asset configuration and demo project content.
- `src/components/SceneExplorer.tsx`: finite scene explorer, controls, and transitions.
- `src/components/BuildingScene.tsx`: positioned artwork and semantic asset actions.
- `src/sceneNavigation.ts`: scene-edge and wheel-gesture utilities.
- `src/hooks/useSceneNavigation.ts`: wheel, touch, and keyboard scene navigation.
- `src/components/Dialog.tsx`: native modal dialog, scroll locking, and focus restoration.
- `src/components/InquiryDialog.tsx`: vacancy-specific form and delivery states.
- `src/styles.css`: palette, layout, window treatment, and responsive rules.
- `public/art/`: replaceable SVG backgrounds and illustrations.
- `tests/building.spec.ts`: browser and configuration checks.
