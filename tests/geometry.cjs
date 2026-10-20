/* Exact metric cases plus real orbit/sensor UI, responsive and offline behavior. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.VISION_TEST_URL||'http://localhost:8000';
const passed=[],errors=[],failedAssets=[];
const pass=message=>{passed.push(message);console.log('PASS',message)};
const near=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} ≈ ${b}`);
const context=vm.createContext({});vm.runInContext(fs.readFileSync('assets/js/geometry-math.js','utf8')+';globalThis.m=GeometryMath;',context);const m=context.m;
const projection={x:.8,y:-.4,z:4,f:320,cameraX:0,yaw:0};
const q=m.projection(projection);near(q.pixel.u,384);near(q.pixel.v,208);near(q.fov,90);assert.ok(q.range>q.point[2]);
const far=m.projection({...projection,z:8});near(far.pixel.u-320,(q.pixel.u-320)/2);
for(const z of [-1,0,.05])assert.equal(m.project([1,1,z],320),null);
assert.equal(m.project([10,0,1],320).inside,false);
for(const yaw of [-90,-25,0,30,90]){const pose={center:[.3,-.1,.5],yaw},point=[1,-2,4],back=m.toWorld(m.toCamera(point,pose),pose);point.forEach((v,i)=>near(v,back[i]));}
pass('Pinhole golden pixels/FOV, inverse frame transforms, inverse-depth scaling, depth vs range, behind/near/out-of-sensor cases');
const stereo={baseline:.4,z:4,x:.6,y:-.2,f:320,error:0};
const s=m.stereo(stereo);near(s.d,32);near(s.depth,4);near(s.error,0);near(s.sensitivity,.125);near(s.interval[0],128/32.5);near(s.interval[1],128/31.5);
const biased=m.stereo({...stereo,error:1});near(biased.d,31);near(biased.depth,128/31);assert.ok(biased.error>0);
const reproj=m.project(m.toCamera(biased.estimate,biased.right),320);near(reproj.u,biased.measured.u);near(reproj.v,biased.measured.v);
for(const error of [10,10.25]){const invalid=m.stereo({...stereo,baseline:.25,z:8,error});assert.equal(invalid.depth,null);assert.equal(invalid.estimate,null);}
const unbounded=m.stereo({...stereo,baseline:.25,z:8,error:9.75});assert.equal(unbounded.interval[1],Infinity);
pass('Rectified stereo reconstructs metric 3D, biased rays reproject exactly, sensitivity/exact intervals and zero/negative disparity rejection');
const calibrated={yaw:8,tx:.25,tz:.1,time:0,f:320};const truth=m.extrinsics(calibrated);near(truth.rms,0);assert.equal(truth.count,102);
for(const point of truth.points){const cameraPoint=m.toCamera(point,truth.truthCamera),direct=m.transform(point,8,[.25,.05,.1]);direct.forEach((v,i)=>near(v,cameraPoint[i]));}
const translationError=m.extrinsics({...calibrated,tx:.35}),timeError=m.extrinsics({...calibrated,time:100});near(translationError.rms,timeError.rms);assert.ok(timeError.rms>5);
near(m.extrinsics({...calibrated,tx:.15,time:100}).rms,0);
pass('LiDAR/camera inverse pose, 102-point zero-residual truth, ms→m transport and explicit tx/time ambiguity');

(async()=>{
 const browser=await chromium.launch({args:['--no-sandbox']});
 try{
 const bc=await browser.newContext({viewport:{width:1512,height:982},reducedMotion:'reduce',acceptDownloads:true});const page=await bc.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failedAssets.push(r.url());});
 await page.goto(base);assert.equal(await page.locator('[data-geo-open]').count(),3);
 await page.locator('[data-geo-open="projection"]').click();await page.locator('#geo-projection .geo-stage[data-ready]').waitFor();assert.ok(page.url().endsWith('#geo-projection'));
 await page.evaluate(()=>showDay(9));assert.equal(await page.locator('#geo-projection .geo-stage[data-ready]').count(),0);await page.locator('#geo-projection .geo-disclosure>summary').focus();await page.keyboard.press('Enter');await page.locator('#geo-projection .geo-stage[data-ready]').waitFor();
 const specs=await page.evaluate(()=>GeometryLabs.specs.map(s=>({id:s.id,days:s.days,units:s.units})));
 for(const {id} of specs){
   await page.goto(base+'/#geo-'+id);const lab=page.locator('#geo-'+id);await lab.locator('.geo-stage[data-ready]').waitFor();assert.equal(await lab.locator('.katex-error').count(),0);assert.ok(await lab.locator('.katex').count());
   const original=await lab.locator('.geo-metrics').textContent();const canvas=lab.locator('.geo-world>canvas');await canvas.scrollIntoViewIfNeeded();
   const before=await canvas.evaluate(c=>c.toDataURL());await lab.locator('[data-view-preset="top"]').click();const top=await canvas.evaluate(c=>c.toDataURL());assert.notEqual(top,before);assert.equal(await lab.locator('.geo-metrics').textContent(),original,'view must not change physics');
   await canvas.focus();const status=await lab.locator('[data-view-status]').textContent();await page.keyboard.press('ArrowRight');assert.notEqual(await lab.locator('[data-view-status]').textContent(),status);await page.keyboard.press('Home');
   const rect=await canvas.boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await page.mouse.move(rect.x+rect.width/2+45,rect.y+rect.height/2+20,{steps:5});await page.mouse.up();assert.ok(!(await lab.locator('[data-view-status]').textContent()).includes('Yaw -28°'));
   await lab.locator('[data-orbit="zoom"]').fill('1.5');assert.ok((await lab.locator('[data-view-status]').textContent()).includes('1.5×'));assert.equal(await lab.locator('.geo-metrics').textContent(),original);
   for(const input of await lab.locator('.geo-controls input').all()){
     await lab.locator('.geo-reset').click();const image=await lab.locator('.geo-sensor canvas').evaluateAll(cs=>cs.map(c=>c.toDataURL()).join(''));
     await input.evaluate(el=>{const v=Number(el.value),lo=Number(el.min),hi=Number(el.max);el.value=String(v<hi?hi:lo);el.dispatchEvent(new Event('input',{bubbles:true}));});
     assert.notEqual(await lab.locator('.geo-metrics').textContent(),original,id+' slider numeric response');
     assert.notEqual(await lab.locator('.geo-sensor canvas').evaluateAll(cs=>cs.map(c=>c.toDataURL()).join('')),image,id+' slider sensor response');
   }
   await lab.locator('.geo-reset').click();assert.equal(await lab.locator('.geo-metrics').textContent(),original);assert.ok((await lab.locator('[data-view-status]').textContent()).includes('Yaw -28°'));
   assert.equal(await lab.locator('.geo-theory details[open]').count(),0);await lab.locator('.geo-theory summary').first().click();assert.equal(await lab.locator('.geo-theory details[open]').count(),1);
 }
 pass('Three dashboard/direct links, native lazy disclosure, equations/derivations, drag+keyboard orbit, presets+zoom, every science slider and deterministic Reset');
 await page.goto(base+'/#geo-projection');await page.locator('#geo-projection-z').fill('-1');assert.ok((await page.locator('#geo-projection .geo-metrics').textContent()).includes('behind / near'));assert.ok((await page.locator('#geo-projection .geo-live-equation').textContent()).includes('no valid'));
 await page.goto(base+'/#geo-triangulation');await page.locator('#geo-triangulation-baseline').fill('0.25');await page.locator('#geo-triangulation-z').fill('8');await page.locator('#geo-triangulation-error').fill('10');assert.ok((await page.locator('#geo-triangulation .geo-metrics').textContent()).includes('undefined · d ≤ 0'));
 await page.locator('#geo-triangulation .geo-reset').click();await page.locator('#geo-triangulation-f').fill('600');await page.locator('#geo-triangulation-z').fill('2');await page.locator('#geo-triangulation-x').fill('1');await page.locator('#geo-triangulation-baseline').fill('1');assert.ok((await page.locator('#geo-triangulation .geo-metrics').textContent()).includes('unobservable'));
 await page.goto(base+'/#geo-extrinsics');await page.locator('[data-geo-truth]').click();assert.ok((await page.locator('#geo-extrinsics .geo-metrics').textContent()).includes('0 px'));await page.locator('#geo-extrinsics-time').fill('100');assert.ok(!(await page.locator('#geo-extrinsics .geo-metrics b').first().textContent()).startsWith('0 '));await page.locator('#geo-extrinsics-tx').fill('0.15');assert.equal(await page.locator('#geo-extrinsics .geo-metrics b').first().textContent(),'0 px');
 pass('Visible behind-camera, invalid disparity/out-of-sensor warnings, truth alignment and timing/calibration ambiguity');
 for(const spec of specs){
   for(const day of spec.days){await page.evaluate(d=>showDay(d),day);await page.evaluate(id=>GeometryLabs.open(document.getElementById('plannedLesson'),id),spec.id);assert.ok(await page.locator('#geo-'+spec.id+' .geo-stage[data-ready]').count());assert.equal(await page.locator('#plannedLesson #advCanvas').count(),1);}
   for(const unit of spec.units){await page.goto(base+'/#learn-'+unit);await page.evaluate(id=>GeometryLabs.open(document.getElementById('localizationLesson'),id),spec.id);assert.ok(await page.locator('#studio-geo-'+spec.id+' .geo-stage[data-ready]').count());const duplicates=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return ids.filter((id,i)=>ids.indexOf(id)!==i);});assert.deepEqual(duplicates,[],'unique native labels across lesson/studio');}
 }
 await page.evaluate(()=>showDay(10));assert.equal(await page.locator('#plannedLesson .geo-experiment').count(),2);await page.locator('#advNotes').fill('3D geometry тэмдэглэл');await page.reload();assert.equal(await page.locator('#advNotes').inputValue(),'3D geometry тэмдэглэл');
 pass('All lesson/sensor-studio placements, coexisting Day 10 tools, unique label IDs, original canvas and note refresh preserved');
 for(const width of [1512,1024,768,390,320]){
   await page.setViewportSize({width,height:982});
   for(const {id} of specs){await page.goto(base+'/#geo-'+id);await page.locator('#geo-'+id+' .geo-stage[data-ready]').waitFor();await page.locator('#geo-'+id+' .geo-world>canvas').scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,id+' at '+width);const size=await page.locator('#geo-'+id+' .geo-world>canvas').boundingBox();assert.ok(size.width>100&&size.height>=260);}
 }
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const touchPage=await mobile.newPage();await touchPage.goto(base+'/#geo-projection');const touchCanvas=touchPage.locator('#geo-projection .geo-world>canvas');await touchCanvas.scrollIntoViewIfNeeded();
 const session=await mobile.newCDPSession(touchPage),bounds=await touchCanvas.boundingBox();await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bounds.x+bounds.width/2,y:bounds.y+100}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:bounds.x+bounds.width/2+40,y:bounds.y+120}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok(!(await touchPage.locator('#geo-projection [data-view-status]').textContent()).includes('Yaw -28°'));await mobile.close();
 fs.mkdirSync('docs/screenshots',{recursive:true});await page.setViewportSize({width:1512,height:982});await page.goto(base+'/#geo-projection');await page.locator('#geo-projection .geo-stage[data-ready]').waitFor();await page.locator('#geo-projection').screenshot({path:'docs/screenshots/geometry-projection-desktop.png'});await page.goto(base+'/#geo-extrinsics');await page.locator('#geo-extrinsics .geo-stage[data-ready]').waitFor();await page.locator('#geo-extrinsics').screenshot({path:'docs/screenshots/geometry-extrinsics-desktop.png'});await page.setViewportSize({width:390,height:844});await page.goto(base+'/#geo-triangulation');await page.locator('#geo-triangulation .geo-stage[data-ready]').waitFor();await page.locator('#geo-triangulation').screenshot({path:'docs/screenshots/geometry-stereo-mobile.png'});
 pass('All open 3D tools at 1512/1024/768/390/320px without page overflow, real mobile touch orbit and desktop/mobile screenshots');
 await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);await bc.setOffline(true);
 for(const {id} of specs){await page.goto(base+'/#geo-'+id);await page.reload();await page.locator('#geo-'+id+' .geo-stage[data-ready]').waitFor();await page.locator('#geo-'+id+' [data-view-preset="side"]').click();await page.locator('#geo-'+id+' .geo-reset').click();}
 await bc.setOffline(false);assert.deepEqual(errors,[]);assert.deepEqual(failedAssets,[]);
 pass('All three deep links reload and compute offline; zero browser errors or missing assets');
 fs.writeFileSync('docs/geometry-qa-results.json',JSON.stringify({testedAt:new Date().toISOString(),browser:'Chromium',viewports:[1512,1024,768,390,320],checks:passed,browserErrors:errors,failedAssets},null,2)+'\n');await bc.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
