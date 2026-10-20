# Vision Theory Lab

An interactive computer vision textbook in Mongolian and English: 30 lessons
from image formation to stereo geometry, visual odometry and deep learning.
The primary goal is **RGB/depth camera + LiDAR + IMU localization and understanding FAST-LIVO2**. The workspace includes a learning dashboard, searchable curriculum,
section outline, interactive scientific laboratories, assessments and local notes.

Open **Localization → FAST-LIVO2** for a dependency-driven pathway with 6
mathematical foundations, 6 sensor-fusion studios and 19 selected original lessons.
All 30 original lessons remain available. The pathway has 31 study nodes; the
complete site has 42 lessons/studios.

Read the [printable learning-path document](docs/LOCALIZATION_PATH.html), including
sensor roles, prerequisites, source-reading order and hardware/bag evaluation tasks.

## Run locally

No application installation or production build is required. With Python 3:

```sh
python3 -m http.server 8000
```

Open **http://localhost:8000/**. `npm run dev` runs the same command if Node.js
is available. Stop the server with **Ctrl+C**.

The site uses vanilla JavaScript and CSS. KaTeX, Inter (including Cyrillic), and
JetBrains Mono are included in `assets/`; no CDN or backend is needed.

## Publish on GitHub Pages

1. Open this repository on GitHub: **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Review, commit and push the changes on `course`:

   ```sh
   git status
   git add -A
   git commit -m "feat: redesign interactive vision learning workspace"
   git push origin course
   ```

4. Wait for **Actions → Deploy GitHub Pages** to complete successfully.
5. Open **https://sanjaa-ish-mirai.github.io/**.

Every subsequent push to `course` redeploys the site. The workflow publishes
`index.html`, the legacy URL redirect, `.nojekyll`, `sw.js`, and the entire `assets/` directory. The printable
`docs/LOCALIZATION_PATH.html` is also published and cached offline. QA reports,
screenshots and test tooling are excluded from the published artifact.

There is no build step. Publishing only `index.html` would omit the styles,
course data, laboratories and fonts; use the supplied workflow. Asset URLs are
relative, so the same static files also work under a GitHub Pages project path.
If you switch the deployment branch, update `on.push.branches` in
[the workflow](.github/workflows/deploy-pages.yml).

If the root URL returns **404**, confirm that `index.html` and the workflow have
been committed and pushed, that Pages uses **GitHub Actions**, and that the latest
run succeeded. The old HTML filename redirects to the root entry point and preserves lesson anchors.

## Learning workspace

- **Localization pathway:** explore prerequisite relationships, follow a recommended
  next lesson, and connect mathematical foundations to IMU, timing/deskew, sensor
  measurement models, filtering, LiDAR planes and direct visual residuals. Sensor
  roles distinguish optional depth camera input from the official RGB/LiDAR/IMU
  FAST-LIVO2 pipeline. The original upstream source revision is linked per lesson.
- **Dashboard:** continue the last lesson, inspect module progress, open any of
  the 30 lessons, and experiment with a live sampling preview.
- **Course explorer:** four collapsible modules; search English or Mongolian
  lesson titles, topics, objectives and advanced theory.
- **Lesson outline:** section anchors, current section, section completion,
  governing equation, quiz statistics and a notes shortcut.
- **Laboratories:** original Canvas experiments, parameter controls, Reset,
  live numerical readouts and explicit units/limitations. Advanced derivations
  reveal one step at a time.
- **Assessments:** original questions and scoring, feedback after submission,
  retry, and additional numerical practice on Days 1, 2, 13, 23 and 29.
- **Navigation:** previous/next lesson on every lesson; sidebars collapse on
  desktop and become keyboard-accessible drawers on mobile.

Keyboard shortcuts: **/** focuses course search; **Alt+← / Alt+→** changes lessons;
**Escape** closes a drawer. Standard Tab, Enter, Space and arrow-key slider controls
work throughout. Reduced-motion preferences are honored.

## Progress, notes and backup compatibility

The original `vision-theory-lab-course-v1` localStorage key and version-1 JSON
backup format are preserved. Day 1 notes, `day2` notes, advanced per-lesson notes,
section progress and original quiz responses retain their existing fields.

Use **Backup** to export all progress and notes. Use **Restore** to import a
Vision Theory Lab v1 JSON file (up to 1 MB). Import validates the file before
replacing current progress; an invalid file does not erase existing work.
Restoring a valid backup replaces the current progress, so export your current
work first if you want to keep both copies.

Section bookmarks and collapsed module preferences use a separate UI storage key.
Numerical practice responses are temporary; original quiz scores persist.
New studio notes, concept/numerical answers and understood status use an optional
`localization` field in the existing state. `lastLearningNode` resumes a new studio
without changing original day IDs. Both fields round-trip through the v1 JSON
backup; importing an old backup remains supported. A studio can be marked
understood after both checks are correct.

Nothing is uploaded to a server or synchronized between devices.

Browser storage is tied to the site origin. Notes saved in a locally opened HTML
file or localhost do not appear automatically on GitHub Pages; export/import a
backup to move them. Keep a backup before clearing browser data.

## Offline use

After the first successful visit through localhost or HTTPS, the service worker
caches the application, course content, fonts and mathematics renderer. Reloads
and lessons can then work offline. Refresh while online to retrieve new deployments.
External supplementary reading links still require internet access. Direct
`file://` use loads the local assets, but cannot register a service worker.

## Source organization

| File | Responsibility |
| --- | --- |
| `index.html` | Accessible shell and original detailed Day 1–2 content |
| `assets/js/course-data.js` | Original 30-day syllabus, advanced content, questions and kernel definitions |
| `assets/js/laboratories.js` | Original 41 scientific/numerical functions |
| `assets/js/learning.js` | Original persistent state, lesson rendering and assessments |
| `assets/js/platform.js` | Dashboard, navigation, reusable lesson/lab enhancements and validated restore |
| `assets/js/localization-data.js` | New fundamentals/sensor content, prerequisites and recommended stage order |
| `assets/js/localization-labs.js` | Twelve deterministic numerical/SVG teaching experiments |
| `assets/js/localization-course.js` | Studio lesson rendering, assessments and validated optional state |
| `assets/css/localization.css` | Learning-path graph, sensor roles and responsive studio/document styles |
| `docs/LOCALIZATION_PATH.html` | Printable goal-oriented course and source-reading document |
| `assets/css/platform.css` | Design tokens, reusable components, typography and responsive layouts |
| `assets/css/lessons.css` | Existing lesson-specific diagrams and laboratory styles |
| `assets/vendor/katex/`, `assets/fonts/` | Vendored offline assets and their licenses |
| `sw.js` | Static offline cache; no background tracking or server storage |
| `tests/browser.cjs`, `tests/localization.cjs` | Original-course and new-path functional, numerical, persistence, responsive and offline checks |

The reusable UI patterns are `objective-card` (learning objectives), `formula`
(EquationBlock), `derivation-step` (MathematicalDerivation), `interactive-lab`,
`quiz-question` (KnowledgeCheck), `numeric-check`, `callout` (misconceptions and
applications), and `lesson-summary`. They enhance the existing content rather
than replacing it. Initial simulations are lazy at the lesson boundary: the
workspace does not initialize Day 1 or Day 2 canvases until their lesson opens.

## Run browser tests

Node.js is needed only for development tests. In one terminal, start the static
server as above. In another:

```sh
npm ci
npx playwright install chromium
npm test
```

Tests use an isolated Chromium profile with seeded legacy progress. They never
read or modify your personal browser profile. `VISION_TEST_URL` can point at a
staged copy of the same site. Screenshots and the latest machine-readable report
are written to `docs/screenshots/` and `docs/qa-results.json`.

See [QA notes](docs/QA.md) for coverage and scientific boundaries.

## Screenshots

- [Desktop dashboard](docs/screenshots/desktop-dashboard.png)
- [Desktop lesson](docs/screenshots/desktop-lesson.png)
- [Desktop laboratory](docs/screenshots/desktop-laboratory.png)
- [Mobile dashboard](docs/screenshots/mobile-dashboard.png)
- [Mobile laboratory](docs/screenshots/mobile-laboratory.png)

## Automatic agent publishing

[AGENT.md](AGENT.md), referenced by [AGENTS.md](AGENTS.md), records the owner’s
authorization to commit and push completed, tested website work automatically.
Agents stage task-related changes only, preserve user data/science, and never
force-push or rewrite published history. The current branch is `course`.

## New pathway screenshots

- [Desktop localization path](docs/screenshots/localization-path-desktop.png)
- [Mobile localization path](docs/screenshots/localization-path-mobile.png)
- [Direct visual residual laboratory](docs/screenshots/localization-photometric-desktop.png)
- [Mobile deskew laboratory](docs/screenshots/localization-lab-mobile.png)

## Computer vision pixel laboratories

The existing lessons now include six additional, lazily initialized experiments.
Open them from the dashboard collection or use a direct link:

| Experiment | Lessons | Computation |
| --- | --- | --- |
| [Gaussian → Sobel](https://sanjaa-ish-mirai.github.io/#cv-edges) | Days 3, 6, 24 | Seeded noisy image, Gaussian smoothing, normalized Sobel, threshold mask and pixel inspector |
| [2D DFT filtering](https://sanjaa-ish-mirai.github.io/#cv-fourier) | Days 4, 5 | Complex separable 32×32 direct DFT, frequency gain, inverse transform and bin phase/magnitude inspection |
| [Harris features](https://sanjaa-ish-mirai.github.io/#cv-harris) | Day 7 | Actual gradient structure tensors, eigenvalues, response map and nonmaximum-suppressed corners |
| [Stereo matching](https://sanjaa-ish-mirai.github.io/#cv-stereo) | Days 12, 13, 14, 29 | SAD/SSD block costs, disparity search, ambiguity rejection and metric depth |
| [Lucas–Kanade flow](https://sanjaa-ish-mirai.github.io/#cv-flow) | Days 15, 16 | Bilinear image sampling, finite-difference Jacobians, normal-equation updates and backtracking |
| [RANSAC geometry](https://sanjaa-ish-mirai.github.io/#cv-ransac) | Days 16, 18, 19, 30 | Seeded two-point line hypotheses, orthogonal residuals, consensus and TLS refinement |

These supplement the original conceptual diagrams; they do not replace existing
lessons or laboratories. The site still has 42 lessons/studios. Open an
experiment to initialize it. Controls and pixel/patch selection update real
computed images and measurements. Sliders also provide keyboard alternatives
for pixel/patch and spectrum-bin inspection. Every experiment has Reset and
model/unit/limitation notes.

Flat/repeating stereo patches reject ambiguous depth. Edge/flat optical-flow
patches disable an unobservable two-dimensional solve. This exposes limitations
rather than returning a plausible-looking estimate. Synthetic ground truth is
labelled separately from estimated results. The models are small controlled
experiments, not full real-camera stereo, dense optical flow or a PnP solver.

`assets/js/cv-math.js` owns the numerical algorithms; `assets/js/cv-labs.js` owns
lab presentation and lesson links; `assets/css/cv-labs.css` provides the shared
responsive design. No production dependencies or build step were added.
Experiment parameters reset when the lesson is reconstructed. Use the original
lesson notes to record observations; existing notes/progress/JSON formats are
unchanged. The new assets are cached by the service worker.

`tests/cv.cjs` checks numerical reference cases, direct links, lazy initialization,
image/plot response, Reset, keyboard/pixel controls, ambiguous cases, mapped
lessons, mobile layouts, note persistence and offline operation. Its report is
`docs/cv-qa-results.json`. Screenshots:
[edge pipeline](docs/screenshots/cv-edges-desktop.png),
[stereo cost curve](docs/screenshots/cv-stereo-desktop.png),
[mobile Harris](docs/screenshots/cv-harris-mobile.png).

## Interactive 3D geometry laboratories

The dashboard's **3D Geometry** collection connects the 3D scene, perspective
sensor image, equations and live metric outputs. The original 42 lessons/studios,
progress IDs, notes and v1 backup format are preserved.

| Laboratory | Lesson placements | Experiment |
| --- | --- | --- |
| [Camera projection](https://sanjaa-ish-mirai.github.io/#geo-projection) | Days 9, 10; Sensor models studio | Move a 3D point/camera, vary focal length, inspect camera coordinates, pixel coordinates, field of view and depth versus range |
| [Stereo triangulation](https://sanjaa-ish-mirai.github.io/#geo-triangulation) | Days 11, 13, 14 | Inspect two rays, change baseline and pixel error, reconstruct XYZ, compare exact depth intervals and local sensitivity |
| [LiDAR–RGB extrinsics](https://sanjaa-ish-mirai.github.io/#geo-extrinsics) | Days 8, 10; Sensor models, Deskew, FAST-LIVO2 studios | Align 102 synthetic points against reference pixels; compare inverse camera pose, reprojection RMS and timestamp/translation ambiguity |

Drag/touch the world canvas or use arrow keys to orbit; **Home** restores the
view. Orbit/Front/Top/Side presets and explicit view yaw/pitch/zoom sliders offer
keyboard alternatives. View controls leave the scientific parameters unchanged.
**Reset experiment & view** restores both. Each studio has three progressive
theory disclosures, a prediction/explanation exercise, units and model limits.

All teaching frames use right-handed optical coordinates: **+X right, +Y down,
+Z forward**. Real LiDAR native axes must be converted explicitly. World units
are meters; image coordinates and focal length are pixels on a 640×480 sensor.
The world viewer is an orthographic wireframe with a 1m grid, not an RGB rendering
or occlusion engine. Sensor panels compute actual perspective projection.
Behind-camera/near-plane points, out-of-sensor correspondences and nonpositive
stereo disparity produce explicit warnings instead of trusted depth.

LiDAR alignment uses known synthetic calibration and an illustrative constant
relative point velocity of +1m/s along camera X. The truth button copies known
parameters; it is not an optimizer. Translation and timing can compensate each
other in this scene, so zero reprojection RMS does not prove correct calibration.
The ±0.5px stereo interval is a bounded disparity example, not a statistical
confidence interval. No full 6DoF estimator, IMU integration or dense depth solver
is implied.

Implementation ownership:

- `assets/js/geometry-math.js`: metric transforms, projection, triangulation and reprojection measurements.
- `assets/js/geometry-view.js`: shared responsive, event-driven Canvas 3D orbit renderer; no animation loop or extra dependency.
- `assets/js/geometry-labs.js`: lesson content, controls, linked sensor views and lazy integration.
- `assets/css/geometry-labs.css`: responsive laboratory layout.
- `tests/geometry.cjs`: numerical reference cases, controls, pointer/touch/keyboard interaction, responsive sizes and offline reloads.

Run `node tests/geometry.cjs` against the local server for the focused suite, or
`npm test` for all suites. Its report is `docs/geometry-qa-results.json`; desktop
and mobile screenshots use the `geometry-` prefix. These assets are cached by the
service worker and are published by the existing GitHub Pages workflow without
a build step or production package installation.
