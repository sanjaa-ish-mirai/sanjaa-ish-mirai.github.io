/* Isolated regression proof for the FAST-LIVO2-directed pathway and deterministic laboratories. */
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright');
const URL=process.env.VISION_TEST_URL||'http://localhost:8000';
const checks=[],errors=[];
const pass=message=>{checks.push(message);console.log('PASS',message)};
const near=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<tolerance,`${a} ≈ ${b}`);
(async()=>{
 const browser=await chromium.launch({args:['--no-sandbox']});
 try{
 const context=await browser.newContext({viewport:{width:1512,height:982},reducedMotion:'reduce',acceptDownloads:true}),page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 await page.goto(URL);await page.locator('#localizationButton').click();
 assert.equal(await page.locator('#localizationNav [data-learning-node]').count(),12);
 const graph=await page.evaluate(()=>({ids:[...LOCALIZATION_UNITS.map(u=>u.id),...COURSE.map(l=>'day'+l.d)],prereqs:LOCALIZATION_PREREQS,route:LOCALIZATION_STAGES.flatMap(s=>s.nodes)}));
 const visiting=new Set(),visited=new Set();
 function visit(id){assert.ok(graph.ids.includes(id),'known node '+id);if(visited.has(id))return;assert.ok(!visiting.has(id),'dependency cycle '+id);visiting.add(id);for(const dep of graph.prereqs[id]||[])visit(dep);visiting.delete(id);visited.add(id);}
 graph.ids.forEach(visit);
 for(const id of graph.route)for(const dep of graph.prereqs[id]||[])assert.ok(graph.route.indexOf(dep)>=0&&graph.route.indexOf(dep)<graph.route.indexOf(id),'ordered prerequisite '+id+' ← '+dep);
 await page.locator('#dependencyFocus').selectOption('fast-livo2');assert.ok((await page.locator('#dependencyGraph').textContent()).includes('LiDAR point-to-plane'));
 await page.screenshot({path:'docs/screenshots/localization-path-desktop.png',fullPage:true});
 pass('12 studios, complete acyclic 42-node prerequisite graph, topologically valid localization path and clickable dependency explorer');
 const result=await page.evaluate(()=>{
   const calc=LocalizationLabs.compute;
   return {
     vector:calc('vectors',{ax:2,ay:1,bx:-1,by:2}),zero:calc('vectors',{ax:2,ay:1,bx:0,by:0}),matrix:calc('matrices',{a:1,b:2,c:2,d:4}),derivative:calc('derivatives',{x:2,h:.5}),
     noiseA:calc('uncertainty',{mean:0,sigma:2,N:100}),noiseB:calc('uncertainty',{mean:0,sigma:2,N:400}),line:calc('least-squares',{m:0,b:0,noise:0,rate:.1}),
     imu:calc('imu',{time:10,acceleration:.1,bias:.02,gyroBias:.1,tilt:0}),camera:calc('sensor-models',{X:.4,Z:2,yaw:0,tx:0,f:500}),
     deskew:calc('deskew',{omega:60,velocity:1,offset:0,duration:100}),offset:calc('deskew',{omega:60,velocity:1,offset:10,duration:100}),
     kalman:calc('fusion',{prior:0,priorSigma:1,lidar:2,lidarSigma:1,visual:0,visualSigma:1,useVisual:0}),two:calc('fusion',{prior:0,priorSigma:1,lidar:2,lidarSigma:1,visual:2,visualSigma:1,useVisual:1}),
     plane:calc('lidar-residual',{pointX:.8,pointZ:1.8,yaw:0,tx:0,tz:0,normal:0}),tangent:calc('lidar-residual',{pointX:.8,pointZ:1.8,yaw:0,tx:.2,tz:0,normal:0}),
     photo:calc('fast-livo2',{tx:.04,depth:2,exposure:1/1.2,frequency:3}),wrongPhoto:calc('fast-livo2',{tx:0,depth:2,exposure:1/1.2,frequency:3}),sameRatio:calc('fast-livo2',{tx:.08,depth:4,exposure:1/1.2,frequency:3})
   };
 });
 near(result.vector.dot,0);near(result.vector.angle,90);assert.equal(result.zero.angle,null);assert.equal(result.zero.projection,null);near(result.matrix.det,0);near(result.derivative.trueSlope,2);near(result.derivative.finite,2.25);near(result.noiseA.sem,.2);near(result.noiseB.sem,.1);near(result.line.optimalM,1.5);near(result.line.optimalB,.4);near(result.imu.positionError,1);near(result.imu.yawError,1);near(result.camera.u,420);near(result.camera.v,255);near(result.camera.range,Math.sqrt(4.25));assert.ok(result.deskew.correctedRMS<1e-12);assert.ok(result.offset.correctedRMS>.01);near(result.kalman.xf,1);near(result.kalman.Pf,.5);near(result.two.xf,4/3);near(result.two.Pf,1/3);near(result.plane.residual,.3);near(result.tangent.residual,result.plane.residual);assert.ok(result.photo.rms<1e-10);assert.ok(result.wrongPhoto.rms>1);near(result.photo.shift,result.sameRatio.shift);assert.ok(result.sameRatio.rms<1e-10);
 pass('Numerical reference cases: zero vectors, singular matrices, finite differences, variance scaling, least squares, IMU drift, range/depth, exact deskew, Kalman fusion, plane degeneracy and photometric loss');
 const ids=await page.evaluate(()=>LOCALIZATION_UNITS.map(u=>u.id));
 for(const id of ids){
   await page.evaluate(id=>document.querySelector(`[data-learning-node="${id}"]`).click(),id);
   assert.equal(await page.locator('#localizationLesson').isVisible(),true);assert.ok(await page.locator('#localizationLab svg').count());assert.equal(await page.locator('#localizationLesson .katex-error').count(),0);
   const before=await page.locator('.studio-chart').innerHTML();
   for(const controlId of await page.locator('#localizationLab input[type="range"]').evaluateAll(els=>els.map(el=>el.id)))await page.locator('#'+controlId).evaluate(el=>{const value=Number(el.min)+(Number(el.max)-Number(el.min))*.65;el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));});
   assert.notEqual(await page.locator('.studio-chart').innerHTML(),before,'visual responds '+id);
   await page.locator('[data-studio-reset]').click();assert.equal(await page.locator('.studio-chart').innerHTML(),before,'deterministic reset '+id);
   assert.equal(await page.locator('#studioFeedback').isVisible(),false);
   await page.locator('#studioSubmit').click();assert.ok((await page.locator('#studioFeedback').textContent()).includes('Тайлбар хараахан нээхгүй'));
   await page.evaluate(id=>{const unit=LOCALIZATION_UNITS.find(u=>u.id===id),input=document.querySelector(`input[name="studioQuiz"][value="${unit.quiz.ok}"]`);input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));const numeric=document.getElementById('studioNumeric');numeric.value=unit.numeric.answer;numeric.dispatchEvent(new Event('input',{bubbles:true}));},id);
   assert.equal(await page.locator('#studioFeedback').isVisible(),false);
   await page.locator('#studioSubmit').click();assert.equal(await page.locator('#studioComplete').isEnabled(),true);await page.locator('#studioComplete').click();assert.equal(await page.locator('#studioComplete').getAttribute('aria-pressed'),'true');await page.locator('#studioNotes').fill('Saved localization note: '+id);
 }
 pass('All 12 lessons: sliders alter actual SVG calculations, Reset deterministic, answers hidden before valid submission, numerical/concept scoring, understood status and notes');
 await page.reload();await page.locator('#studioNotes').waitFor();assert.equal(await page.locator('#studioNotes').inputValue(),'Saved localization note: fast-livo2');
 assert.equal(await page.evaluate(()=>Object.values(state.localization).filter(s=>s.completed).length),12);
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#exportBtn').click()]);const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(backup.formatVersion,1);assert.equal(backup.progress.localization.vectors.notes,'Saved localization note: vectors');
 const legacy={app:'Vision Theory Lab',formatVersion:1,progress:{version:1,lastDay:1,sections:['formation'],notes:'Existing note',quiz:{},day2:{sections:[],notes:'Existing day2',quiz:{}},advanced:{}}};
 await page.locator('#importFile').setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))});await page.waitForFunction(()=>state.notes==='Existing note');assert.deepEqual(await page.evaluate(()=>state.sections),['formation']);assert.deepEqual(await page.evaluate(()=>state.localization),{});
 await page.locator('#importFile').setInputFiles({name:'current.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await page.waitForFunction(()=>state.localization.vectors?.completed===true);assert.equal(await page.locator('#studioNotes').inputValue(),'Saved localization note: fast-livo2');
 pass('New notes/completion/resume survive refresh; optional localization state round-trips in v1 JSON; old v1 backups still restore original fields');
 await page.evaluate(()=>document.querySelector('[data-learning-node="least-squares"]').click());
 const originalLoss=await page.evaluate(()=>LocalizationLabs.compute('least-squares',{m:0,b:0,noise:.25,rate:.1}).loss);
 await page.locator('[data-studio-step]').click();const gradientLoss=Number(await page.locator('.studio-readout>div').first().locator('b').textContent());assert.ok(gradientLoss<originalLoss);
 await page.locator('[data-studio-fit]').click();const fitLoss=Number(await page.locator('.studio-readout>div').first().locator('b').textContent());assert.ok(fitLoss<=gradientLoss+.001);
 await page.evaluate(()=>document.querySelector('[data-learning-node="lidar-residual"]').click());const beforePlane=await page.locator('.studio-readout>div').first().locator('b').textContent();await page.locator('[data-studio-tangent]').click();assert.equal(await page.locator('.studio-readout>div').first().locator('b').textContent(),beforePlane);
 pass('Gradient step and closed-form fit reduce the same loss; tangential plane motion leaves residual unchanged');
 for(const width of [1512,1024,768,390,320]){
   await page.setViewportSize({width,height:900});await page.evaluate(()=>document.getElementById('localizationButton').click());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'path width '+width);
   for(const id of ids){await page.evaluate(id=>document.querySelector(`[data-learning-node="${id}"]`).click(),id);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'studio '+id+' '+width);}
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.getElementById('localizationButton').click());await page.screenshot({path:'docs/screenshots/localization-path-mobile.png',fullPage:true});
 await page.locator('#menuButton').click();await page.locator('#lessonSearch').fill('deskew');await page.locator('#localizationNav [data-learning-node="deskew"]').click();assert.equal(await page.locator('#sidebar').isVisible(),false);await page.locator('#outlineToggle').click();await page.locator('#studioOutlineNotes').click();assert.equal(await page.locator('#studioNotes').evaluate(el=>document.activeElement===el),true);
 await page.locator('#menuButton').click();await page.locator('#lessonSearch').fill('');await page.keyboard.press('Escape');
 await page.evaluate(()=>document.querySelector('[data-learning-node="deskew"]').click());await page.locator('#studio-lab').scrollIntoViewIfNeeded();await page.screenshot({path:'docs/screenshots/localization-lab-mobile.png'});
 await page.setViewportSize({width:1512,height:982});await page.evaluate(()=>document.querySelector('[data-learning-node="fast-livo2"]').click());await page.locator('#studio-lab').scrollIntoViewIfNeeded();await page.locator('#toast').waitFor({state:'hidden'});await page.screenshot({path:'docs/screenshots/localization-photometric-desktop.png'});
 pass('All new lessons/path at desktop, tablet and mobile widths; mobile search, navigation, notes focus and screenshots');
 await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
 await context.setOffline(true);await page.reload();await page.locator('#localizationLab svg').waitFor();assert.ok(await page.locator('#localizationLesson .katex').count());const response=await page.goto(URL+'/docs/LOCALIZATION_PATH.html');assert.equal(response.status(),200);assert.ok((await page.locator('main').textContent()).includes('ROS1/catkin'));await context.setOffline(false);assert.deepEqual(errors,[]);
 pass('New course, diagrams, KaTeX and printable learning-path document reload offline; zero browser errors');
 fs.writeFileSync('docs/localization-qa-results.json',JSON.stringify({testedAt:new Date().toISOString(),browser:'Chromium',viewports:[1512,1024,768,390,320],checks,browserErrors:errors},null,2)+'\n');await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
