/* Genuine image-domain algorithms plus responsive, accessible and offline UI checks. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright');
const base=process.env.VISION_TEST_URL||'http://localhost:8000';
const passed=[],errors=[];
const pass=message=>{passed.push(message);console.log('PASS',message)};
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} ≈ ${b}`);
const context=vm.createContext({});
vm.runInContext(fs.readFileSync('assets/js/laboratories.js','utf8')+'\n'+fs.readFileSync('assets/js/cv-math.js','utf8')+'\nglobalThis.cv=CVMath;',context);
const m=context.cv;
const flat=new Float64Array(64*48).fill(120),flatGrad=m.sobel(flat);assert.ok(flatGrad.magnitude.every(v=>v===0));
const ramp=Float64Array.from({length:64*48},(_,i)=>i%64),rampGrad=m.sobel(ramp);near(rampGrad.gx[24*64+32],1);near(rampGrad.gy[24*64+32],0);
const flatFiltered=m.edges({scene:'flat',noise:0,sigma:2,threshold:1});assert.equal(flatFiltered.edgeCount,0);near(flatFiltered.filteredRMSE,0,1e-5);
pass('Normalized Sobel derivative: constant image zero, unit ramp Ix=1/Iy=0, Gaussian preserves DC');
for(const [scene,expected] of [['flat','FLAT'],['edge','EDGE'],['corner','CORNER']]){const r=m.harris({scene,noise:0,sigma:1,radius:3,x:32,y:24});assert.equal(r.selected.classification,expected);if(scene==='corner'){assert.ok(r.corners.length>=1);assert.ok(r.selected.response>0);assert.ok(r.selected.min>0);}else assert.equal(r.corners.length,0);}
pass('Harris structure tensor distinguishes true flat/edge/corner image patches and detects the actual corner');
const n=8,signal=Float64Array.from({length:n*n},(_,i)=>20+Math.sin(i*.3)*7),spectrum=m.dft2(signal,n),reconstructed=m.dft2(spectrum.re,n,spectrum.im,true);
for(let i=0;i<signal.length;i++){near(reconstructed.re[i],signal[i],1e-10);near(reconstructed.im[i],0,1e-10);}
const f=m.fourier({fx:4,fy:2,phase:0,filter:'ideal',cutoff:6});assert.deepEqual(JSON.parse(JSON.stringify(f.peaks.map(q=>[q.u,q.v]).sort())),[[-4,-2],[4,2]].sort());near(f.peaks[0].magnitude,25600,1e-7);assert.ok(f.rmse<1e-8);
const shifted=m.fourier({fx:4,fy:2,phase:1,filter:'ideal',cutoff:6});near(shifted.peaks[0].magnitude,25600,1e-7);near(Math.atan2(shifted.spectrum.im[2*32+4],shifted.spectrum.re[2*32+4]),1);
const cut=m.fourier({fx:4,fy:2,phase:0,filter:'ideal',cutoff:2});near(cut.gain,0);near(cut.rmse,50/Math.sqrt(2),1e-7);
const gaussian=m.fourier({fx:4,fy:2,phase:0,filter:'gaussian',cutoff:2});near(gaussian.gain,Math.exp(-20/8));
pass('Complex 2D DFT/inverse round-trip, conjugate peaks, exact phase, ideal rejection and Gaussian transfer gain');
for(const cost of ['ssd','sad']){const r=m.stereo({scene:'texture',disparity:6,noise:0,radius:3,x:42,y:24,cost});assert.equal(r.best.d,6);assert.ok(r.accepted);near(r.depth,3.2);near(r.depthPerPixel,19.2/36);}
for(const scene of ['flat','stripes']){const r=m.stereo({scene,disparity:6,noise:0,radius:3,x:42,y:24,cost:'ssd'});assert.equal(r.accepted,false);assert.equal(r.depth,null);}
pass('SAD/SSD recover true stereo disparity/depth; flat and repeated patterns reject ambiguous depth');
const fp={scene:'texture',dx:.8,dy:-.6,noise:0,radius:7},tracked=m.track(fp,{u:0,v:0},10);assert.ok(tracked.result.error<.03);assert.ok(tracked.result.loss<tracked.history[0]*.01);for(let i=1;i<tracked.history.length;i++)assert.ok(tracked.history[i]<tracked.history[i-1]);
for(const scene of ['flat','edge']){const r=m.flow({...fp,scene,noise:5});assert.equal(r.observable,false);assert.equal(r.delta,null);}
pass('Lucas–Kanade solves subpixel translation with decreasing image loss and detects aperture/flat degeneracy even with noise');
const rp={outliers:35,threshold:.07,iterations:64},robust=m.ransac(rp),repeat=m.ransac(rp);assert.ok(Math.abs(robust.slope-.5)<.05);assert.ok(robust.precision>.9);assert.ok(robust.recall>.9);near(robust.slope,repeat.slope,1e-14);near(Math.hypot(robust.best.line.a,robust.best.line.b),1);const trueCount=48-robust.corrupted.reduce((s,v)=>s+v,0),pair=trueCount/48*(trueCount-1)/47;near(robust.success,1-(1-pair)**64);
pass('Seeded RANSAC normalized geometry, robust consensus, slope accuracy, precision/recall and finite-sample pair probability');
(async()=>{
 const browser=await chromium.launch({args:['--no-sandbox']});
 try{
 const bc=await browser.newContext({viewport:{width:1512,height:982},reducedMotion:'reduce'}),page=await bc.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);assert.equal(await page.locator('[data-cv-open]').count(),6);
 await page.evaluate(()=>showDay(3));assert.equal(await page.locator('#cv-edges .cv-stage[data-ready]').count(),0,'lazy before open');await page.locator('#cv-edges .cv-lab-disclosure>summary').focus();await page.keyboard.press('Enter');await page.locator('#cv-edges .cv-stage[data-ready]').waitFor();
 const specifications=await page.evaluate(()=>CVLabs.specs.map(s=>({id:s.id,days:s.days})));
 for(const {id} of specifications){
   await page.goto(base+'/#cv-'+id);const article=page.locator('#cv-'+id);await article.locator('.cv-stage[data-ready]').waitFor();assert.ok(await article.locator('.cv-metrics b').count());assert.equal(await article.locator('.katex-error').count(),0);
   const metrics=await article.locator('.cv-metrics').textContent(),visual=await article.evaluate(el=>[...el.querySelectorAll('canvas')].map(c=>c.toDataURL()).join('')+el.querySelector('.cv-graph').innerHTML);
   for(const input of await article.locator('input[type="range"]').all())await input.evaluate(el=>{const low=Number(el.min),high=Number(el.max),step=Number(el.step)||1;el.value=String(low+Math.round((high-low)*.7/step)*step);el.dispatchEvent(new Event('input',{bubbles:true}));});
   const changed=await article.evaluate(el=>[...el.querySelectorAll('canvas')].map(c=>c.toDataURL()).join('')+el.querySelector('.cv-graph').innerHTML);assert.notEqual(changed,visual,id+' actual image/plot responds');
   await article.locator('.cv-reset').click();assert.equal(await article.locator('.cv-metrics').textContent(),metrics,id+' deterministic reset');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'desktop '+id);
   if(id==='flow'){await article.locator('[data-cv-step="10"]').click();assert.ok((await article.locator('.cv-metrics').textContent()).includes('0.003 px'));await article.locator('#cv-flow-scene').selectOption('edge');await article.locator('#cv-flow-scene').dispatchEvent('input');assert.equal(await article.locator('[data-cv-step="1"]').isDisabled(),true);}
 }
 pass('Six direct lab URLs, lazy initialization, actual slider/visual response, KaTeX, deterministic Reset and disabled unobservable LK updates');
 await page.goto(base+'/#cv-harris');const h=page.locator('#cv-harris');const image=h.locator('[data-cv-image="input"]');await image.click({position:{x:60,y:60}});assert.notEqual(await h.locator('#cv-harris-x').inputValue(),'32');await h.locator('#cv-harris-x').focus();const x=await h.locator('#cv-harris-x').inputValue();await page.keyboard.press('ArrowRight');assert.notEqual(await h.locator('#cv-harris-x').inputValue(),x);
 await page.goto(base+'/#cv-fourier');const fft=page.locator('#cv-fourier');await fft.locator('#cv-fourier-binU').fill('4');await fft.locator('#cv-fourier-binV').fill('2');await fft.locator('#cv-fourier-phase').fill('1');assert.ok((await fft.locator('.cv-metrics').textContent()).includes('1 rad'));
 await page.goto(base+'/#cv-stereo');await page.locator('#cv-stereo-scene').selectOption('flat');await page.locator('#cv-stereo-scene').dispatchEvent('input');assert.ok((await page.locator('#cv-stereo .cv-metrics').textContent()).includes('match rejected'));
 pass('Pixel/patch click inspector, keyboard slider alternatives, complex spectrum-bin inspection and visible ambiguity warnings');
 for(const width of [1024,768,390,320]){await page.setViewportSize({width,height:900});for(const {id} of specifications){await page.goto(base+'/#cv-'+id);await page.locator('#cv-'+id+' .cv-stage[data-ready]').waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' width '+width);const clipped=await page.locator('#cv-'+id+' .cv-graph svg').evaluateAll(plots=>plots.flatMap(svg=>{const box=svg.getBoundingClientRect();return [...svg.querySelectorAll('text')].filter(el=>{const r=el.getBoundingClientRect();return r.left<box.left-1||r.right>box.right+1;}).map(el=>el.textContent);}));assert.deepEqual(clipped,[],'axis labels visible '+id+' width '+width);}}
 fs.mkdirSync('docs/screenshots',{recursive:true});await page.setViewportSize({width:1512,height:982});await page.goto(base+'/#cv-edges');await page.locator('#cv-edges .cv-stage[data-ready]').waitFor();await page.locator('#cv-edges').screenshot({path:'docs/screenshots/cv-edges-desktop.png'});await page.goto(base+'/#cv-stereo');await page.locator('#cv-stereo .cv-stage[data-ready]').waitFor();await page.locator('#cv-stereo').screenshot({path:'docs/screenshots/cv-stereo-desktop.png'});await page.setViewportSize({width:390,height:844});await page.goto(base+'/#cv-harris');await page.locator('#cv-harris .cv-stage[data-ready]').waitFor();await page.locator('#cv-harris').screenshot({path:'docs/screenshots/cv-harris-mobile.png'});
 pass('All six open labs at desktop, tablet and 390/320px mobile sizes without horizontal overflow; screenshots captured');
 for(const {id,days} of specifications)for(const day of days){await page.evaluate(d=>showDay(d),day);await page.evaluate(id=>CVLabs.open(document.getElementById('plannedLesson'),id),id);assert.ok(await page.locator('#cv-'+id+' .cv-stage[data-ready]').count());}
 await page.evaluate(()=>showDay(16));await page.evaluate(()=>{CVLabs.open(document.getElementById('plannedLesson'),'flow');CVLabs.open(document.getElementById('plannedLesson'),'ransac');});assert.equal(await page.locator('#plannedLesson .cv-stage[data-ready]').count(),2);assert.equal(await page.locator('#plannedLesson #advCanvas').count(),1);
 await page.evaluate(()=>showDay(15));await page.locator('#advNotes').fill('CV optical-flow study note');await page.reload();await page.locator('#advNotes').waitFor();assert.equal(await page.locator('#advNotes').inputValue(),'CV optical-flow study note');
 pass('All mapped lesson integrations, two coexisting Day 16 labs, original canvas retained, unchanged note persistence');
 await page.goto(base+'/#cv-fourier');await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);await bc.setOffline(true);await page.reload();await page.locator('#cv-fourier .cv-stage[data-ready]').waitFor();await page.locator('#cv-fourier-fx').fill('6');assert.ok((await page.locator('#cv-fourier .cv-metrics').textContent()).includes('(6, 2)'));await bc.setOffline(false);assert.deepEqual(errors,[]);
 pass('Offline deep-link reload and DFT controls work with zero browser errors');
 fs.writeFileSync('docs/cv-qa-results.json',JSON.stringify({testedAt:new Date().toISOString(),browser:'Chromium',viewports:[1512,1024,768,390,320],checks:passed,browserErrors:errors},null,2)+'\n');await bc.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
