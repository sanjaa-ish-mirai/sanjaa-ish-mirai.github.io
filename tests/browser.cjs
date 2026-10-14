/* Run against the static preview server. These tests use a clean browser profile, never personal progress. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const baseURL = process.env.VISION_TEST_URL || 'http://localhost:8000';
const screenshots = path.resolve('docs/screenshots');
const errors = [];
const legacy = {version:1,lastDay:13,theme:'dark',sections:['formation','sampling','quantization','noise','bridge','frequency','derivations','exam'],notes:'Өмнөх Day 1 тэмдэглэл',quiz:{0:0},quizChecked:false,day2:{sections:['kernel','flip'],notes:'Day 2 saved note',quiz:{0:1},quizChecked:false},advanced:{3:{sections:['concept'],notes:'Advanced saved note',quiz:0,checked:false}}};
const key = 'vision-theory-lab-course-v1';
const passed = [];
function pass(message){passed.push(message);console.log('PASS',message);}
async function inputValue(page,id,value){await page.locator('#'+id).evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},value);}
async function open(page,day){await page.evaluate(d=>showDay(d),day);await page.locator(day===1?'#lesson1':day===2?'#lesson2':'#plannedLesson').waitFor({state:'visible'});}
async function noOverflow(page,label){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,label);}
(async()=>{
 fs.mkdirSync(screenshots,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 const context=await browser.newContext({viewport:{width:1512,height:982},reducedMotion:'reduce',acceptDownloads:true});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({key,legacy})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(legacy));},{key,legacy});
 await page.goto(baseURL);await page.locator('#continueLearning').waitFor();
 assert.equal(await page.locator('#courseNav [data-day]').count(),30);
 assert.equal(await page.locator('#courseNav .module-nav').count(),4);
 assert.equal(await page.evaluate(()=>state.notes),legacy.notes);
 assert.deepEqual(await page.evaluate(()=>state.sections),legacy.sections);
 assert.equal(await page.evaluate(()=>state.day2.notes),legacy.day2.notes);
 assert.equal(await page.evaluate(()=>state.advanced[3].notes),legacy.advanced[3].notes);
 await page.screenshot({path:path.join(screenshots,'desktop-dashboard.png'),fullPage:true});
 pass('Existing v1 progress and all three note formats preserved; dashboard has 4 modules and 30 lessons');
 await page.locator('#continueLearning').click();assert.equal(await page.evaluate(()=>state.lastDay),13);
 await page.locator('#menuButton').click();assert.equal(await page.locator('#sidebar').isVisible(),false);await noOverflow(page,'collapsed course navigation');
 await page.locator('#menuButton').click();assert.equal(await page.locator('#sidebar').isVisible(),true);
 await page.locator('#outlineToggle').click();assert.equal(await page.locator('#lessonOutline').isVisible(),false);
 await page.locator('#outlineToggle').click();assert.equal(await page.locator('#lessonOutline').isVisible(),true);
 pass('Continue learning resumes the saved lesson; both desktop sidebars collapse');

 const manifest=JSON.parse(fs.readFileSync('tests/preservation.json','utf8'));
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('assets/js/course-data.js')).digest('hex'),manifest.courseDataSHA256);
 const functionSources=await page.evaluate(names=>Object.fromEntries(names.map(n=>[n,window[n].toString()])),Object.keys(manifest.numericalFunctions));
 for(const [name,source] of Object.entries(functionSources))assert.equal(crypto.createHash('sha256').update(source).digest('hex'),manifest.numericalFunctions[name],name+' preserved');
 pass('All original course/quiz data and 41 numerical function bodies match the audit snapshot');

 for(let d=1;d<=30;d++){
   await open(page,d);
   assert.equal(await page.locator(d===1?'#lesson1 h1':d===2?'#lesson2 h1':'#plannedLesson h1').count(),1);
   assert.equal(await page.locator('#outlineContent [data-anchor]').count(),d<=2?8:5,'Outline day '+d);
   assert.ok(await page.locator('.katex:visible').count()>0,'Equation day '+d);
   assert.equal(await page.locator('.katex-error:visible').count(),0);
   const canvasBefore=await page.locator((d===1?'#lesson1':d===2?'#lesson2':'#plannedLesson')+' canvas').evaluateAll(els=>els.map(el=>el.toDataURL()));
   for(const id of await page.locator((d===1?'#lesson1':d===2?'#lesson2':'#plannedLesson')+' input[type="range"]').evaluateAll(els=>els.map(el=>el.id))){
     await page.locator('#'+id).evaluate(el=>{const min=Number(el.min)||0,max=Number(el.max)||100,step=Number(el.step)||1;const target=min+Math.round((max-min)*.75/step)*step;el.value=String(target);el.dispatchEvent(new Event('input',{bubbles:true}));});
   }
   const canvasAfter=await page.locator((d===1?'#lesson1':d===2?'#lesson2':'#plannedLesson')+' canvas').evaluateAll(els=>els.map(el=>el.toDataURL()));
   assert.ok(canvasAfter.some((image,i)=>image!==canvasBefore[i]),'Canvas responds to sliders on day '+d);
   await noOverflow(page,'desktop day '+d);
 }
 pass('All 30 lessons, all sliders, KaTeX equations and section outlines work without browser errors');

 await open(page,1);
 await inputValue(page,'freq',19);await inputValue(page,'samples',24);
 assert.equal(await page.locator('#aliasOut').textContent(),'5.0 cyc');
 assert.equal(await page.locator('#nyquistOut').textContent(),'12 cyc');
 await inputValue(page,'bits',8);assert.equal(await page.locator('#levelsOut').textContent(),'256');
 await inputValue(page,'vidSpatial',8);await inputValue(page,'vidSpeed',2);
 assert.equal(await page.locator('#videoSfOut').textContent(),'0.1250 cyc/px');
 assert.equal(await page.locator('#videoTfOut').textContent(),'7.50 Hz');
 const math=await page.evaluate(()=>({
   blurConstant:Array.from(gaussianBlur(new Float32Array(25).fill(.4),5,5,1)),
   reflect:d2Sample([10,20,30],3,1,-1,0,'reflect'),
   identity:d2Apply([1,2,3,4],2,2,D2_KERNELS.identity,'reflect','corr'),
   gain:d2HComplex([.25,.5,.25],0),
   flipped:d2Apply([1,2,3,4,5,6,7,8,9],3,3,D2_KERNELS.asym,'zero','conv')[4],
   correlated:d2Apply([1,2,3,4,5,6,7,8,9],3,3,D2_KERNELS.asym,'zero','corr')[4]
 }));
 math.blurConstant.forEach(v=>assert.ok(Math.abs(v-.4)<1e-6));
 assert.equal(math.reflect,20);assert.deepEqual(Object.values(math.identity),[1,2,3,4]);assert.equal(math.gain.amp,1);assert.notEqual(math.flipped,math.correlated);
 const sampling=page.locator('#freq').locator('xpath=ancestor::div[contains(@class,"card")][1]');
 await sampling.locator('.lab-reset').click();assert.equal(await page.locator('#freq').inputValue(),'15'); // Original useful default frequency is 15.
 await open(page,13);await inputValue(page,'advA',50);await inputValue(page,'advB',40);
 assert.ok((await page.locator('.lab-readout').textContent()).includes('16.258 px'));
 assert.ok((await page.locator('.lab-readout').textContent()).includes('14.301 cm'));
 assert.equal(await page.locator('#advValB').textContent(),'0.450 px');
 await open(page,23);await inputValue(page,'advA',50);await inputValue(page,'advB',40);
 const backprop=await page.evaluate(()=>{const x=.5+50/30,w=.3+40/30;return ((x*w*1.7)-10)*1.7*x;});
 assert.ok((await page.locator('.lab-readout').textContent()).includes(backprop.toFixed(4)));
 await page.locator('#plannedLesson .lab-reset').click();assert.equal(await page.locator('#advA').inputValue(),'50');assert.equal(await page.locator('#advB').inputValue(),'40');
 pass('Numerical golden checks: aliasing, quantization, temporal frequency, Gaussian DC, padding, convolution, depth uncertainty and backpropagation');

 await open(page,1);
 await page.locator('#resetQuiz').click();assert.equal(await page.locator('#feedback0').isVisible(),false);
 await page.evaluate(()=>QUESTIONS.forEach((q,i)=>{const el=document.querySelector(`input[name="q${i}"][value="${q.ok}"]`);el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));}));
 assert.equal(await page.locator('#feedback0').isVisible(),false);
 await page.locator('#checkQuiz').click();assert.ok((await page.locator('#quizScore').textContent()).startsWith('12 / 12'));
 await open(page,2);await page.locator('#d2ResetQuiz').click();
 await page.evaluate(()=>D2_QUIZ.forEach((q,i)=>{const el=document.querySelector(`#d2Quiz input[name="d2q${i}"][value="${q.ok}"]`)||document.querySelectorAll('#d2Quiz fieldset')[i].querySelector(`input[value="${q.ok}"]`);el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));}));
 await page.locator('#d2CheckQuiz').click();assert.equal(await page.locator('#d2QuizScore').textContent(),'12 / 12 зөв');
 await open(page,13);await page.locator('#advClear').click();assert.equal(await page.locator('#advFeedback').isVisible(),false);
 await page.evaluate(()=>{const q=ADVANCED[13].quiz;const el=document.querySelector(`input[name="advQuiz"][value="${q.ok}"]`);el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));});
 await page.locator('#advCheck').click();assert.ok((await page.locator('#advFeedback').textContent()).includes('Зөв!'));
 assert.equal(await page.locator('#plannedLesson .numeric-result').isVisible(),false);await page.locator('#numericAnswer13').fill('2');await page.locator('#plannedLesson [data-numeric-submit]').click();assert.ok((await page.locator('#plannedLesson .numeric-result').textContent()).includes('Зөв'));
 pass('Day 1/2 quiz scoring 12/12, advanced quiz, retry and numerical scoring; solutions hidden until submitted');

 await open(page,1);await page.locator('#lessonNotes').fill('Туршилтын шинэ note · Day 1');
 await open(page,2);await page.locator('#d2Notes').fill('Туршилтын note · Day 2');
 await open(page,13);await page.locator('#advNotes').fill('Depth notes: σZ ∝ Z²');
 await page.reload();await page.locator('#advNotes').waitFor();
 assert.equal(await page.locator('#advNotes').inputValue(),'Depth notes: σZ ∝ Z²');
 await open(page,1);assert.equal(await page.locator('#lessonNotes').inputValue(),'Туршилтын шинэ note · Day 1');
 await open(page,2);assert.equal(await page.locator('#d2Notes').inputValue(),'Туршилтын note · Day 2');
 pass('Per-lesson notes survive refresh across both legacy and advanced formats');
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#exportBtn').click()]);
 const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
 assert.equal(backup.app,'Vision Theory Lab');assert.equal(backup.formatVersion,1);assert.equal(backup.progress.advanced[13].notes,'Depth notes: σZ ∝ Z²');
 await page.locator('#importFile').setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({app:'Vision Theory Lab',formatVersion:1,progress:legacy}))});
 await page.waitForFunction(()=>state.notes==='Өмнөх Day 1 тэмдэглэл');assert.equal(await page.evaluate(()=>state.advanced[3].notes),'Advanced saved note');
 const beforeInvalid=await page.evaluate(()=>JSON.stringify(state));
 await page.locator('#importFile').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{broken')});
 await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('алдаа'));
 assert.equal(await page.evaluate(()=>JSON.stringify(state)),beforeInvalid);
 await page.locator('#importFile').setInputFiles({name:'roundtrip.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
 await page.waitForFunction(()=>state.advanced[13]?.notes==='Depth notes: σZ ∝ Z²');
 pass('Legacy v1 import, full JSON export/import round trip and invalid-backup data-loss protection');

 await page.locator('#lessonSearch').fill('epipolar');assert.ok(await page.locator('#courseNav [data-day="11"]').count());
 await page.locator('#lessonSearch').fill('not-a-real-course-term');assert.equal(await page.locator('#courseNav [data-day]').count(),0);
 await page.locator('#lessonSearch').fill('');
 await open(page,13);await page.keyboard.press('Alt+ArrowRight');assert.equal(await page.evaluate(()=>state.lastDay),14);
 await page.keyboard.press('Alt+ArrowLeft');assert.equal(await page.evaluate(()=>state.lastDay),13);
 await page.locator('#outlineContent [data-anchor="adv-lab"]').click();
 await page.waitForFunction(()=>scrollY>0);
 await page.locator('#advCanvas').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(screenshots,'desktop-laboratory.png'),fullPage:false});
 await open(page,1);await page.screenshot({path:path.join(screenshots,'desktop-lesson.png'),fullPage:false});
 pass('Lesson search, keyboard previous/next, section anchors and reading navigation');

 for(const viewport of [{width:1024,height:900},{width:768,height:1024},{width:390,height:844},{width:320,height:720}]){
   await page.setViewportSize(viewport);
   await page.evaluate(()=>document.getElementById('dashboardButton').click());await noOverflow(page,'dashboard '+viewport.width);
   for(let d=1;d<=30;d++){await open(page,d);await noOverflow(page,'day '+d+' width '+viewport.width);}
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.getElementById('dashboardButton').click());
 await page.screenshot({path:path.join(screenshots,'mobile-dashboard.png'),fullPage:true});
 await page.locator('#menuButton').click();assert.equal(await page.locator('#sidebar').isVisible(),true);
 await page.locator('#lessonSearch').fill('Pinhole');await page.locator('#courseNav [data-day="9"]').click();assert.equal(await page.locator('#sidebar').isVisible(),false);assert.equal(await page.locator('#navScrim').isVisible(),false);
 await page.locator('#outlineToggle').click();assert.equal(await page.locator('#lessonOutline').isVisible(),true);
 await page.locator('#notesShortcut').click();assert.equal(await page.locator('#lessonOutline').isVisible(),false);assert.equal(await page.locator('#advNotes').evaluate(el=>document.activeElement===el),true);
 await page.keyboard.press('Escape');await open(page,13);await page.locator('#advCanvas').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(screenshots,'mobile-laboratory.png'),fullPage:false});
 await page.locator('#themeBtn').click();await noOverflow(page,'light mobile');assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('light')),true);await page.locator('#themeBtn').click();
 pass('All lessons at desktop, tablet and 390/320px mobile widths; mobile drawers, focus handling and light theme');

 await page.waitForFunction(()=>navigator.serviceWorker.controller!==null,null,{timeout:15000});
 await context.setOffline(true);await page.reload();await page.locator('#advNotes').waitFor();await open(page,2);assert.equal(await page.locator('#d2Quiz fieldset').count(),12);
 assert.ok(await page.locator('.katex:visible').count()>0);await context.setOffline(false);
 pass('Offline reload, local fonts/KaTeX and laboratories work from cached static assets');
 assert.deepEqual(errors,[]);
 fs.writeFileSync('docs/qa-results.json',JSON.stringify({testedAt:new Date().toISOString(),browser:'Playwright Chromium',viewports:[1512,1024,768,390,320],checks:passed,browserErrors:errors},null,2)+'\n');
 console.log(`\n${passed.length} acceptance groups passed. Screenshots saved in docs/screenshots.`);
 await context.close();
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
