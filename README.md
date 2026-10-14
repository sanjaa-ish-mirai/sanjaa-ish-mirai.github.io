# Vision Theory Lab

An interactive computer vision textbook in Mongolian and English: 30 lessons
from image formation to stereo geometry, visual odometry and deep learning.
The redesigned workspace includes a learning dashboard, searchable curriculum,
section outline, interactive scientific laboratories, assessments and local notes.

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
`index.html`, the legacy URL redirect, `.nojekyll`, `sw.js`, and the entire `assets/` directory. Documentation,
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
| `assets/css/platform.css` | Design tokens, reusable components, typography and responsive layouts |
| `assets/css/lessons.css` | Existing lesson-specific diagrams and laboratory styles |
| `assets/vendor/katex/`, `assets/fonts/` | Vendored offline assets and their licenses |
| `sw.js` | Static offline cache; no background tracking or server storage |
| `tests/browser.cjs` | Functional, numerical, persistence, responsive and offline browser checks |

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
npm install
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
