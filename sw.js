// Static offline shell. Navigation is network-first so new deployments appear on refresh.
const CACHE = 'vision-theory-lab-static-v2';
const ASSETS = [
  "./",
  "./index.html",
  "docs/LOCALIZATION_PATH.html",
  "assets/css/localization.css",
  "assets/js/localization-data.js",
  "assets/js/localization-labs.js",
  "assets/js/localization-course.js",
  "./Vision_Theory_Lab_Days_01-30.html",
  "assets/js/learning.js",
  "assets/js/course-data.js",
  "assets/js/platform.js",
  "assets/js/laboratories.js",
  "assets/css/lessons.css",
  "assets/css/platform.css",
  "assets/fonts/inter-latin-500-normal.woff2",
  "assets/fonts/jetbrains-mono-latin-400-normal.woff2",
  "assets/fonts/inter-cyrillic-600-normal.woff2",
  "assets/fonts/inter-latin-600-normal.woff2",
  "assets/fonts/inter-latin-400-normal.woff2",
  "assets/fonts/inter-cyrillic-500-normal.woff2",
  "assets/fonts/inter-cyrillic-400-normal.woff2",
  "assets/fonts/inter-latin-700-normal.woff2",
  "assets/fonts/inter-cyrillic-700-normal.woff2",
  "assets/vendor/katex/katex.min.css",
  "assets/vendor/katex/katex.min.js",
  "assets/vendor/katex/fonts/KaTeX_Size1-Regular.woff",
  "assets/vendor/katex/fonts/KaTeX_Main-Bold.ttf",
  "assets/vendor/katex/fonts/KaTeX_Size3-Regular.woff",
  "assets/vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_SansSerif-Regular.ttf",
  "assets/vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_Main-BoldItalic.woff",
  "assets/vendor/katex/fonts/KaTeX_AMS-Regular.woff",
  "assets/vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff",
  "assets/vendor/katex/fonts/KaTeX_Script-Regular.ttf",
  "assets/vendor/katex/fonts/KaTeX_Size2-Regular.ttf",
  "assets/vendor/katex/fonts/KaTeX_Math-BoldItalic.woff",
  "assets/vendor/katex/fonts/KaTeX_SansSerif-Bold.woff",
  "assets/vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2",
  "assets/vendor/katex/fonts/KaTeX_Main-Italic.woff2",
  "assets/vendor/katex/fonts/KaTeX_Main-Bold.woff",
  "assets/vendor/katex/fonts/KaTeX_Math-Italic.woff2",
  "assets/vendor/katex/fonts/KaTeX_AMS-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_Size1-Regular.ttf",
  "assets/vendor/katex/fonts/KaTeX_Main-Regular.ttf",
  "assets/vendor/katex/fonts/KaTeX_Math-BoldItalic.ttf",
  "assets/vendor/katex/fonts/KaTeX_Fraktur-Bold.woff",
  "assets/vendor/katex/fonts/KaTeX_SansSerif-Italic.ttf",
  "assets/vendor/katex/fonts/KaTeX_Fraktur-Bold.ttf",
  "assets/vendor/katex/fonts/KaTeX_Math-Italic.woff",
  "assets/vendor/katex/fonts/KaTeX_Size2-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_Size3-Regular.ttf",
  "assets/vendor/katex/fonts/KaTeX_Main-Italic.woff",
  "assets/vendor/katex/fonts/KaTeX_Size2-Regular.woff",
  "assets/vendor/katex/fonts/KaTeX_Size4-Regular.woff",
  "assets/vendor/katex/fonts/KaTeX_Size1-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_Main-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_Fraktur-Regular.ttf",
  "assets/vendor/katex/fonts/KaTeX_Size4-Regular.ttf",
  "assets/vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff",
  "assets/vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2",
  "assets/vendor/katex/fonts/KaTeX_Main-Regular.woff",
  "assets/vendor/katex/fonts/KaTeX_Math-Italic.ttf",
  "assets/vendor/katex/fonts/KaTeX_Typewriter-Regular.woff",
  "assets/vendor/katex/fonts/KaTeX_Size4-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_Main-BoldItalic.ttf",
  "assets/vendor/katex/fonts/KaTeX_SansSerif-Regular.woff",
  "assets/vendor/katex/fonts/KaTeX_Script-Regular.woff",
  "assets/vendor/katex/fonts/KaTeX_Caligraphic-Regular.ttf",
  "assets/vendor/katex/fonts/KaTeX_AMS-Regular.ttf",
  "assets/vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2",
  "assets/vendor/katex/fonts/KaTeX_Typewriter-Regular.ttf",
  "assets/vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_Main-Bold.woff2",
  "assets/vendor/katex/fonts/KaTeX_SansSerif-Bold.ttf",
  "assets/vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2",
  "assets/vendor/katex/fonts/KaTeX_Caligraphic-Bold.ttf",
  "assets/vendor/katex/fonts/KaTeX_Size3-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2",
  "assets/vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2",
  "assets/vendor/katex/fonts/KaTeX_SansSerif-Italic.woff",
  "assets/vendor/katex/fonts/KaTeX_Main-Italic.ttf",
  "assets/vendor/katex/fonts/KaTeX_Fraktur-Regular.woff",
  "assets/vendor/katex/fonts/KaTeX_Script-Regular.woff2"
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('vision-theory-lab-static-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)));
    }
    return response;
  }).catch(async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    if (event.request.mode === 'navigate') return caches.match(new URL('./index.html', self.location).href);
    return Response.error();
  }));
});
