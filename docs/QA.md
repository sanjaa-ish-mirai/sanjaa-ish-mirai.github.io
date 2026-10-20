# Redesign QA and preservation boundary

The original course data, questions, answers and 41 numerical function bodies
are recorded in `tests/preservation.json`. Browser checks compare their hashes
against this snapshot. The visual redesign changes the shell and presentation,
not the scientific operators or existing assessment answers.

## Acceptance coverage

`tests/browser.cjs` checks:

- All 30 lessons, four module groups, Continue Learning and section outlines.
- Legacy v1 progress, Day 1 notes, Day 2 notes and advanced notes.
- Every lesson slider executes its existing handlers; no JavaScript page errors.
- KaTeX equations on every lesson, with no rendering-error elements.
- Numerical reference cases: aliasing, quantization, spatial/temporal frequency,
  Gaussian constant preservation, reflection padding, correlation/convolution,
  stereo depth uncertainty and backpropagation gradients.
- Reset controls and original quiz scoring, including 12/12 for Days 1 and 2.
- Feedback hidden before submission, retries and numerical practice scoring.
- Notes after refresh, old JSON import, export/import round trip and invalid
  JSON protection.
- Search, keyboard previous/next, section anchors, mobile navigation and notes focus.
- No horizontal document overflow for all 30 lessons at 1512, 1024, 768, 390 and
  320 pixels; dark and light interfaces.
- Offline reload, cached KaTeX and Day 2 laboratories.

The latest completed run is recorded in `qa-results.json`. Screenshots cover
desktop workspace, lesson, laboratory and mobile workspace/laboratory views.
Browser QA uses Chromium. Firefox and Safari have not been separately tested.

## Scientific boundaries

Existing advanced diagrams intentionally vary in fidelity. Projection, depth,
softmax, optimization, overlap and backpropagation readouts use the existing
parameter mappings and explicit formulas. Some diagrams are schematic teaching
aids, not general-purpose solvers. The interface labels these boundaries rather
than implying that it computes a full image FFT, learned CNN response, calibrated
fundamental matrix, nonlinear triangulation solver, metric VO or full 6DoF pose.

Day 1 and Day 2 keep their detailed numerical laboratories. No working laboratory
has been replaced with a static image. Step-by-step theory retains the original
text. Numerical practice adds checked examples without changing existing quizzes.

## Deployment and storage boundaries

Production is a static directory containing `index.html`, `.nojekyll`, `sw.js`
and `assets/`, plus the legacy course URL redirect. There is no backend, authentication, analytics or production npm
installation. The Pages workflow targets the existing `course` branch.

The service worker needs a successful online visit before offline use and runs
only on HTTPS or localhost. Supplementary reading links require internet access.
Progress remains browser-local; use the v1 JSON backup to transfer it. New UI
bookmarks and module expansion preferences are separate from the original backup.

## FAST-LIVO2 pathway extension

`tests/localization.cjs` checks all 12 new studios and the complete 42-node
prerequisite graph. The recommended 31-node route must be acyclic and respect
prerequisite order. It verifies numerical reference cases, actual SVG response
to sliders, deterministic Reset, hidden solutions, assessment/completion rules,
notes refresh, optional v1 backup fields, optimization/tangent actions, all five
responsive widths, mobile focus and offline document/lesson reload. Results are
recorded in `localization-qa-results.json`.

New models explicitly distinguish simplified scalar/2D/1D teaching experiments
from the full 3D FAST-LIVO2 implementation. The source-reading document cites
upstream revision `0d2c0346107b75b59934975adec9a6eeeb913c64`. RGB/depth/LiDAR/IMU
roles, unit/frame/time conventions, optional depth input and ROS1 upstream versus
ROS2 integration are explained. No original numerical function or course/quiz
data was rewritten.

## Computer vision pixel-lab extension

`tests/cv.cjs` verifies constant/ramp Sobel derivatives, Gaussian DC preservation,
Harris flat/edge/corner responses, complex DFT/inverse normalization and phase,
known SAD/SSD disparity/depth, ambiguity rejection, subpixel LK convergence and
aperture failure, and deterministic robust line estimation. Browser checks cover
all six direct links, every mapped lesson, native disclosure/lazy initialization,
slider-driven images, deterministic Reset, pixel and keyboard inspectors, mobile
widths down to 320px, original note persistence and offline DFT operation. Results
are in `cv-qa-results.json`; screenshots use the `cv-` prefix.

The original 41 numerical functions, course questions and backup format are
unchanged. Existing conceptual laboratories remain available. Models explicitly
identify synthetic truth, heuristic thresholds and excluded real-sensor effects.
RANSAC is a 2D line-verification example, not a full F-matrix/PnP estimator. The
DFT is computed directly on a periodic 32×32 input, not a production image FFT.

When validating a working tree with uncommitted QA artifacts, run the original
report-generating suites in an isolated copy to preserve those local files.

## Interactive 3D geometry extension

`tests/geometry.cjs` adds exact pinhole pixels and field of view, world/camera
round trips, depth-versus-range, near/behind-camera rejection, rectified metric
XYZ recovery, biased-ray reprojection, disparity derivative and exact interval
bounds, nonpositive disparity, and inverse LiDAR/camera pose checks. The known
102-point calibration has zero reprojection RMS. A +100ms timing offset at +1m/s
has the same effect as +0.10m camera-X translation; the suite explicitly checks
that this ambiguity can yield zero residual with incorrect individual values.

Browser checks exercise dashboard and direct links, lazy native disclosures,
KaTeX and progressive theory, every scientific slider, deterministic Reset,
orbit presets, drag, arrow-key/Home navigation, zoom, real touch gestures,
all mapped lessons and sensor studios, unique native control label IDs across
hidden lesson roots, retained original canvases and notes after refresh. All three
labs run at 1512, 1024, 768, 390 and 320px with no horizontal page overflow and
reload offline. `geometry-qa-results.json` records results. Screenshots:

- `screenshots/geometry-projection-desktop.png`
- `screenshots/geometry-extrinsics-desktop.png`
- `screenshots/geometry-stereo-mobile.png`

The world viewer is orthographic wireframe; sensor projections are perspective.
There is no z-buffer or occlusion handling. Stereo assumes rectified known
correspondences and horizontal measurement error. LiDAR alignment uses synthetic
truth and simplified constant-velocity transport; it is not a calibration
optimizer or complete FAST-LIVO2 implementation. Chromium is tested; Safari and
Firefox are not independently verified.

## YOLO11 and commercial-model course extension

`tests/yolo11.cjs` verifies exact IoU/NMS and rotation cases, five synthetic output
schemas, mask membership, source-image preservation, genuine transparent/empty
cutouts, binary masks, keypoint filtering, task-specific enabled controls and
JSON/PNG downloads. It checks the 10-section dashboard/search/hash navigation,
math rendering, all five complete recipes, a full 17-keypoint annotation,
config/code/template downloads, clipboard action, hidden quiz explanations,
scoring/retry, notes/completion refresh, safe optional-state sanitation and v1
JSON backup round trip. Layouts are checked at 1512/1024/768/390/320px; mobile
navigation, offline course/controls/downloads and browser errors are covered.
Results: `yolo11-qa-results.json`. Screenshots:

- `screenshots/yolo11-output-desktop.png`
- `screenshots/yolo11-commercial-desktop.png`
- `screenshots/yolo11-segmentation-mobile.png`

The downloadable runner is separately exercised in a temporary CPU environment
with actual official YOLO11n checkpoints for all five tasks, using the package's
bus sample. Empty OBB output on a non-aerial scene is valid. Detection receives a
one-epoch COCO8 training/validation smoke check, random-initialization training,
and ONNX export/inference parity. With matching square-letterbox preprocessing,
maximum PyTorch/ONNX box-coordinate difference is below 0.001px on that sample.
These are functionality checks, not model-quality or deployment benchmarks.
Other task training/export combinations, CUDA/TensorRT/mobile accelerators and
real deployment accuracy are not comprehensively validated. ML weights,
training outputs and the third-party sample image are not shipped in the site.

Ultralytics documentation and pinned source were checked on 2026-10-20. The
course distinguishes the original YOLO research paper from YOLO11's software
release; it links official task/data/API/source/licensing references. Commercial
provenance lessons explain vendor terms and independent development choices;
they do not grant a license or certify a model as proprietary. Browser labs are
explicitly synthetic and run no neural network.
