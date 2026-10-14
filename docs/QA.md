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
