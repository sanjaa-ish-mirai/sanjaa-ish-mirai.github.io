
'use strict';
// Learning state, assessments, lesson rendering, and original event bindings.
// Keep the v1 storage key and backup interface compatible.


const SECTIONS = ['formation','sampling','quantization','noise','bridge','frequency','derivations','exam'];
const KEY = 'vision-theory-lab-course-v1';
const $ = id => document.getElementById(id);
const $$ = sel => Array.from(document.querySelectorAll(sel));
let persistOK = true;
let state = {version:1,lastDay:1,sections:[],notes:'',quiz:{},quizChecked:false,theme:'dark',day2:{sections:[],notes:'',quiz:{},quizChecked:false}};
try{const stored=localStorage.getItem(KEY);if(stored){const data=JSON.parse(stored);if(data && typeof data==='object'){state.sections=Array.isArray(data.sections)?data.sections.filter(x=>SECTIONS.includes(x)):[];state.notes=typeof data.notes==='string'?data.notes:'';state.quiz=typeof data.quiz==='object'&&data.quiz?data.quiz:{};state.quizChecked=!!data.quizChecked;state.lastDay=Number.isInteger(data.lastDay)&&data.lastDay>=1&&data.lastDay<=30?data.lastDay:1;state.theme=data.theme==='light'?'light':'dark';if(data.day2&&typeof data.day2==='object'){state.day2.sections=Array.isArray(data.day2.sections)?data.day2.sections.filter(x=>['kernel','flip','lsi','border','fourier','gaussian','derive','exam'].includes(x)):[];state.day2.notes=typeof data.day2.notes==='string'?data.day2.notes:'';state.day2.quiz=data.day2.quiz&&typeof data.day2.quiz==='object'?data.day2.quiz:{};state.day2.quizChecked=!!data.day2.quizChecked;}}}}catch(e){persistOK=false;}
try{const p=JSON.parse(localStorage.getItem(KEY)||'{}');state.advanced=p.advanced&&typeof p.advanced==='object'?p.advanced:{};}catch(e){state.advanced={};}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));persistOK=true;}catch(e){persistOK=false;}$('autosaveState').textContent=persistOK?'Энэ browser-д локалаар хадгалж байна':'Автомат хадгалалт хаалттай · Backup хийнэ үү';}
function week(d){return d<=28?Math.floor((d-1)/7):4;}
function nav(){let html='';for(let w=0;w<5;w++){html+=`<div class="week-label">${w===4?'FINAL':'WEEK '+(w+1)} · ${WEEK_NAMES[w]}</div>`;for(const l of COURSE.filter(x=>week(x.d)===w)){html+=`<button class="day-link ${l.d===state.lastDay?'active':''}" type="button" data-day="${l.d}" aria-current="${l.d===state.lastDay?'page':'false'}"><span class="day-num">${String(l.d).padStart(2,'0')}</span><span class="day-label">${l.t}</span><span class="day-state">${l.d===1?(state.sections.length===SECTIONS.length?'✓':'●'):l.d===2?(state.day2.sections.length===8?'✓':'●'):(state.advanced&&state.advanced[l.d]&&Array.isArray(state.advanced[l.d].sections)&&state.advanced[l.d].sections.length===5?'✓':'●')}</span></button>`;}}$('courseNav').innerHTML=html;$$('[data-day]').forEach(el=>el.addEventListener('click',()=>showDay(Number(el.dataset.day))));}
function progress(){if(state.lastDay>2){advancedProgress();return;}const day2=state.lastDay===2,sections=day2?state.day2.sections:state.sections,items=day2?D2_SECTIONS:SECTIONS,n=sections.length;
 $('overallProgress').textContent=n+' / '+items.length;$('progressSubject').textContent='Day '+(day2?2:1)+'-ийн уншсан хэсэг';$('progressFill').style.width=(n/items.length*100)+'%';
 $$('[data-complete],[data-d2-complete]').forEach(b=>{const isD2=!!b.dataset.d2Complete,key=isD2?b.dataset.d2Complete:b.dataset.complete,on=(isD2?state.day2.sections:state.sections).includes(key);b.setAttribute('aria-pressed',String(on));b.textContent=on?'✓ Судалсан':'○ Судалсан гэж тэмдэглэх';});nav();}
function showDay(d){state.lastDay=d;save();$('topbarDay').textContent='/ DAY '+String(d).padStart(2,'0');$('lesson1').hidden=d!==1;$('lesson2').hidden=d!==2;$('plannedLesson').hidden=d===1||d===2;
 if(d===2)d2Init();else if(d!==1)renderPlanned(d);
 progress();$('sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'instant'});}
function renderPlanned(d){renderAdvanced(d);}
$$('[data-complete],[data-d2-complete]').forEach(b=>b.addEventListener('click',()=>{const isD2=!!b.dataset.d2Complete,key=isD2?b.dataset.d2Complete:b.dataset.complete,arr=isD2?state.day2.sections:state.sections,next=arr.includes(key)?arr.filter(x=>x!==key):[...arr,key];if(isD2)state.day2.sections=next;else state.sections=next;progress();save();}));
$('menuButton').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
function changeTheme(){document.body.classList.toggle('light',state.theme==='light');}
$('themeBtn').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';changeTheme();save();});changeTheme();
function download(filename,text,type='application/json'){const blob=new Blob([text],{type});const href=URL.createObjectURL(blob);const a=document.createElement('a');a.href=href;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);}
function exportBackup(){const backup={app:'Vision Theory Lab',formatVersion:1,exportedAt:new Date().toISOString(),progress:state};download('vision-theory-lab-progress.json',JSON.stringify(backup,null,2));}
$('exportBtn').addEventListener('click',exportBackup);$('exportNotes').addEventListener('click',exportBackup);$('printBtn').addEventListener('click',()=>window.print());$('importBtn').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',async ev=>{const f=ev.target.files?.[0];if(!f)return;try{if(f.size>1024*1024)throw Error('1 MB-аас их backup файл байна');const data=JSON.parse(await f.text());if(data.app!=='Vision Theory Lab'||data.formatVersion!==1||!data.progress)throw Error('Vision Theory Lab v1 формат биш байна');const p=data.progress;state.advanced=p.advanced&&typeof p.advanced==='object'?p.advanced:{};state.sections=Array.isArray(p.sections)?p.sections.filter(x=>SECTIONS.includes(x)):[];state.notes=typeof p.notes==='string'?p.notes:'';state.quiz=p.quiz&&typeof p.quiz==='object'?p.quiz:{};state.quizChecked=!!p.quizChecked;state.theme=p.theme==='light'?'light':'dark';state.lastDay=Number.isInteger(p.lastDay)&&p.lastDay>0&&p.lastDay<=30?p.lastDay:1;if(p.day2&&typeof p.day2==='object'){state.day2.sections=Array.isArray(p.day2.sections)?p.day2.sections.filter(x=>D2_SECTIONS.includes(x)):[];state.day2.notes=typeof p.day2.notes==='string'?p.day2.notes:'';state.day2.quiz=p.day2.quiz&&typeof p.day2.quiz==='object'?p.day2.quiz:{};state.day2.quizChecked=!!p.day2.quizChecked;if(d2Initialized){$('d2Notes').value=state.day2.notes;d2QuizRender();}}$('lessonNotes').value=state.notes;changeTheme();renderQuiz();progress();showDay(state.lastDay);save();alert('Backup сэргээгдлээ.');}catch(e){alert('Backup сэргээхэд алдаа гарлаа: '+e.message);}ev.target.value='';});
$('lessonNotes').value=state.notes;$('lessonNotes').addEventListener('input',e=>{state.notes=e.target.value;save();$('noteSaved').textContent=persistOK?'● Browser-д хадгалагдсан':'⚠ Backup файл авч хадгална уу';});
$$('.show-solution').forEach(btn=>btn.addEventListener('click',()=>{const el=$(btn.dataset.sol);const showing=el.classList.toggle('visible');btn.textContent=showing?'Тайлбарыг нуух':'Тайлбарыг харах';}));
// Canvas utilities. Canvas dimensions are fixed in HTML so file:// rendering is stable.




$$('#pointMode,#areaMode').forEach(b=>b.addEventListener('click',()=>{$$('#pointMode,#areaMode').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false');});b.classList.add('active');b.setAttribute('aria-pressed','true');renderSampling();}));$$('#freq,#samples,#phase').forEach(el=>el.addEventListener('input',renderSampling));

$$('#bits,#qContrast').forEach(el=>el.addEventListener('input',renderQuant));
// Deterministic stochastic demo; shot noise uses a Gaussian approximation to Poisson counting.




$$('#exposure,#readNoise').forEach(el=>el.addEventListener('input',renderNoise));

// LAB 00: optical PSF / Gaussian image blur.




$$('#psfSigma,#psfFrequency').forEach(el=>el.addEventListener('input',renderPsf));

// LAB 02: exact analytic 2D plane wave with optional ideal square-pixel integration.
const sinc=x=>Math.abs(x)<1e-9?1:Math.sin(x)/x;


$$('#moireFrequency,#moireAngle,#moirePixels').forEach(el=>el.addEventListener('input',renderMoire));
$$('#moirePoint,#moireAverage').forEach(el=>el.addEventListener('click',()=>{$$('#moirePoint,#moireAverage').forEach(btn=>{btn.classList.remove('active');btn.setAttribute('aria-pressed','false');});el.classList.add('active');el.setAttribute('aria-pressed','true');renderMoire();}));


function renderQuiz(){let html='';QUESTIONS.forEach((q,i)=>{html+=`<fieldset class="quiz-question" style="border:0;margin:0;padding-left:0;padding-right:0"><legend>${String(i+1).padStart(2,"0")} · ${q.q}</legend><div class="answers">${q.a.map((a,j)=>`<label class="answer"><input type="radio" name="q${i}" value="${j}" ${Number(state.quiz[i])===j&&state.quiz[i]!==undefined?'checked':''}/><span>${a}</span></label>`).join('')}</div><div class="feedback" id="feedback${i}" hidden></div></fieldset>`;});$('quizRoot').innerHTML=html;$$('#quizRoot input').forEach(inp=>inp.addEventListener('change',()=>{state.quiz[Number(inp.name.slice(1))]=Number(inp.value);state.quizChecked=false;$('quizScore').textContent='';$$('.feedback').forEach(e=>e.hidden=true);save();}));if(state.quizChecked)gradeQuiz();}
function gradeQuiz(){let score=0;QUESTIONS.forEach((q,i)=>{const selected=state.quiz[i],correct=selected===q.ok;score+=correct?1:0;const fb=$('feedback'+i);fb.hidden=false;fb.className='feedback'+(correct?'':' bad');fb.innerHTML=`<strong>${selected===undefined?'Хариулаагүй':correct?'✓ Зөв':'✕ Буруу'} · Зөв хариу: ${q.a[q.ok]}</strong><p style="margin:5px 0 0">Яагаад: ${q.why}</p>`;});$('quizScore').textContent=`${score} / ${QUESTIONS.length} · ${score>=Math.ceil(QUESTIONS.length*.75)?'Сайн! Дараагийн сэдэвт шилжиж болно.':'Тайлбаруудыг судлаад дахин оролдоорой.'}`;state.quizChecked=true;save();}
$('checkQuiz').addEventListener('click',gradeQuiz);$('resetQuiz').addEventListener('click',()=>{state.quiz={};state.quizChecked=false;renderQuiz();$('quizScore').textContent='';save();});
/* startup moved below Day 2 engine so state is initialized */


// DAY 1 FREQUENCY EXTENSION — static pixel profile, spatial spectrum, contour and video.




$$('#sfFreq,#sfAmp,#sfPhase').forEach(el=>el.addEventListener('input',renderSpatialFrequency));

$$('#shapeWiggles,#shapeDepth').forEach(el=>el.addEventListener('input',renderShape));

$$('#vidSpatial,#vidSpeed,#vidFrame').forEach(el=>el.addEventListener('input',renderSpaceTime));



// Day 2 — all simulation arithmetic is vanilla JavaScript and works offline.
const D2_SECTIONS=['kernel','flip','lsi','border','fourier','gaussian','derive','exam'];




let d2Kernel=D2_KERNELS.box.slice(),d2Initialized=false;














const d2SceneBase=d2Scene2D();





function d2QuizRender(){const root=$('d2Quiz');root.innerHTML=D2_QUIZ.map((q,i)=>`<fieldset class="quiz-question" style="border:0;padding-left:0;padding-right:0"><legend>${String(i+1).padStart(2,'0')} · ${q.q}</legend><div class="answers">${q.a.map((a,j)=>`<label class="answer"><input type="radio" name="d2q${i}" value="${j}" ${String(state.day2.quiz[i])===String(j)?'checked':''}><span>${a}</span></label>`).join('')}</div><div class="feedback" id="d2Feedback${i}" hidden></div></fieldset>`).join('');
 $$('#d2Quiz input').forEach(inp=>inp.addEventListener('change',()=>{const index=Number(inp.name.slice(3));state.day2.quiz[index]=Number(inp.value);state.day2.quizChecked=false;$$('#d2Quiz .feedback').forEach(e=>e.hidden=true);$('d2QuizScore').textContent='';save();}));
 if(state.day2.quizChecked)d2QuizGrade(false);
}
function d2QuizGrade(shouldSave=true){let score=0;D2_QUIZ.forEach((q,i)=>{const answer=state.day2.quiz[i],correct=answer===q.ok;score+=correct?1:0;const feedback=$('d2Feedback'+i);feedback.hidden=false;feedback.innerHTML=`<b style="color:${correct?'var(--teal)':'var(--orange)'}">${correct?'Зөв':'Зөв хариулт: '+q.a[q.ok]}</b> — ${q.why}`;});$('d2QuizScore').textContent=score+' / '+D2_QUIZ.length+' зөв';state.day2.quizChecked=true;if(shouldSave)save();}
function d2Init(){if(d2Initialized)return;d2Initialized=true;
 $$('#d2Preset,#d2Operation,#d2Padding,#d2PosX,#d2PosY').forEach(el=>el.addEventListener('input',el.id==='d2Preset'?d2ChangePreset:d2Matrix));
 $('d2EditKernel').addEventListener('click',()=>{$('d2Preset').value='custom';const i=document.querySelector('#d2KernelGrid input');i?.focus();});
 $$('#d2H,#d2Delta,#d2Weight').forEach(el=>el.addEventListener('input',d2Impulse));
 $$('#d2ImgFilter,#d2ImgBoundary,#d2ImgNoise').forEach(el=>el.addEventListener('input',d2Image));
 $$('#d2FreqType,#d2Freq,#d2FreqAmp').forEach(el=>el.addEventListener('input',d2Frequency));
 $$('#d2GSize,#d2GSigma').forEach(el=>el.addEventListener('input',d2Gaussian));
 $('d2CheckQuiz').addEventListener('click',()=>d2QuizGrade());
 $('d2ResetQuiz').addEventListener('click',()=>{state.day2.quiz={};state.day2.quizChecked=false;$('d2QuizScore').textContent='';d2QuizRender();save()});
 $('d2Notes').value=state.day2.notes;$('d2Notes').addEventListener('input',ev=>{state.day2.notes=ev.target.value;save();$('d2NoteSaved').textContent=persistOK?'● Browser-д хадгалсан':'⚠ Backup аваарай';});
 $('d2DownloadBackup').addEventListener('click',exportBackup);
 d2Matrix();d2Impulse();d2Image();d2Frequency();d2Gaussian();d2QuizRender();
}


/* Day 03–30 educational engine. LESSONS injected during packaging. */
const ADV_SECTIONS = ['concept','derivation','lab','problem','assessment'];
function advancedDayState(d){
 if(!state.advanced || typeof state.advanced!=='object') state.advanced={};
 if(!state.advanced[d] || typeof state.advanced[d]!=='object')state.advanced[d]={sections:[],notes:'',quiz:null,checked:false};
 return state.advanced[d];
}
function advEscape(x){return String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

function advMark(d,key){let st=advancedDayState(d);st.sections=Array.isArray(st.sections)?st.sections:[];st.sections=st.sections.includes(key)?st.sections.filter(v=>v!==key):[...st.sections,key];save();advancedProgress();document.querySelectorAll(`[data-adv-mark="${key}"]`).forEach(b=>{b.textContent=st.sections.includes(key)?'✓ Судалсан':'○ Судалсан';b.setAttribute('aria-pressed',String(st.sections.includes(key)));});}
function advancedProgress(){const d=state.lastDay,st=advancedDayState(d),n=st.sections.length;$('overallProgress').textContent=n+' / '+ADV_SECTIONS.length;$('progressSubject').textContent='Day '+d+'-ийн уншсан хэсэг';$('progressFill').style.width=(n/ADV_SECTIONS.length*100)+'%';nav();}
function renderAdvanced(d){
 const l=COURSE[d-1],m=ADVANCED[d],st=advancedDayState(d), w=week(d), prev=COURSE[d-2], next=COURSE[d];
 if(!m){$('plannedLesson').innerHTML='<p>Энэ хичээлийн материал олдсонгүй.</p>';return;}
 const header=(id,txt)=>`<div class="adv-parthead"><div><div class="section-num">${ADV_SECTIONS.indexOf(id)+1} / 05 · DAY ${String(d).padStart(2,'0')}</div><h2>${txt}</h2></div><button class="adv-mark" data-adv-mark="${id}" aria-pressed="${st.sections.includes(id)}">${st.sections.includes(id)?'✓ Судалсан':'○ Судалсан'}</button></div>`;
 $('plannedLesson').innerHTML=`
 <section class="hero"><div class="eyebrow">${w===4?'Final capstone':'Week '+String(w+1).padStart(2,'0')} / DAY ${String(d).padStart(2,'0')} · Guided Theory Lesson</div><h1>${advEscape(l.t).replace(/ & /g,' <span class="adv-headline">&</span> ')}</h1><p class="lead">${advEscape(l.goal)} Энэ хичээлд томьёоны assumptions, derivation, numerical example, failure analysis болон өөрчлөгдөх параметртэй visualization багтсан.</p><div class="pills"><span class="pill em">● Хичээлийн материал бэлэн</span><span class="pill">⏱ 2–3 цаг</span><span class="pill">∑ Fundamental mathematics</span><span class="pill">◎ Interactive lab · Offline</span></div><nav class="adv-toc">${['concept','derivation','lab','problem','assessment'].map((key,i)=>`<a href="#adv-${key}">${i+1}. ${['Theory','Derivation','Visual lab','Worked exercise','Self-check'][i]}</a>`).join('')}</nav></section>
 <section class="adv-part" id="adv-concept">${header('concept','Энэ algorithm ЯАГААД ажилладаг вэ?')}<p>${advEscape(m.overview)}</p><div class="adv-split"><div class="card"><h3>Математик загвар</h3><p class="adv-small">${advEscape(m.model)}</p></div><div class="card"><h3>Robotics-д хаана хэрэглэх вэ?</h3><p class="adv-small">${advEscape(m.application)}</p></div></div><div class="adv-eq">${advEscape(l.eq)}</div><div class="callout warm"><strong>Assumption ба model-ийн хязгаар</strong><p>${advEscape(m.failure)}</p></div></section>
 <section class="adv-part" id="adv-derivation">${header('derivation','Математик derivation — алхам бүрээр')}<p class="adv-small">Эцсийн томьёог цээжлэхийн оронд ямар математик property-оос гарсныг шалга.</p><ol class="adv-prooflist">${m.derive.map(x=>`<li>${advEscape(x)}</li>`).join('')}</ol><div class="adv-challenge"><strong>Өөрөөсөө асуух:</strong> Дээрх derivation-д ямар таамаглал ашиглагдсан бэ? Тэр таамаглал зөрчигдвөл ямар residual/bias үүсэх вэ?</div></section>
 <section class="adv-part" id="adv-lab">${header('lab','Interactive Visual Laboratory')}<p class="adv-small">Slider хөдөлгөхөөс өмнө өөрчлөлтийн чиглэлийг таамагла. Дараа нь график болон тооцооллын үр дүнг харьцуул.</p><div class="card"><h3>${advEscape(l.t)} — параметрийн туршилт</h3><p class="card-intro">${advEscape(l.s)}</p><canvas class="adv-lab-canvas" id="advCanvas" width="720" height="340" aria-label="Interactive ${advEscape(l.t)} diagram"></canvas><div class="adv-controls"><div><label>${advEscape(ADV_LAB_NAMES[m.lab][0])}<output id="advValA">50</output></label><input id="advA" type="range" min="0" max="100" value="50" step="1"/></div><div><label>${advEscape(ADV_LAB_NAMES[m.lab][1])}<output id="advValB">40</output></label><input id="advB" type="range" min="0" max="100" value="40" step="1"/></div></div><div class="adv-lab-caption" id="advCaption" aria-live="polite"></div></div></section>
 <section class="adv-part" id="adv-problem">${header('problem','Worked numerical exercise')}<div class="adv-question">${advEscape(m.worked)}</div><details class="adv-problem"><summary>Бодолт ба тайлбар харах</summary><p>${advEscape(m.solution)}</p></details><div class="adv-challenge"><strong>Туршилтын даалгавар:</strong> Дээрх тоонуудын нэгийг хоёр дахин өөрчлөөд output ямар болохыг эхлээд гараар бод. Интерактив лаборатори дээр тохирох slider-ийг өөрчилж чиглэлийг шалга.</div></section>
 <section class="adv-part" id="adv-assessment">${header('assessment','Concept check ба тэмдэглэл')}<div class="card"><h3>Шалгах асуулт</h3><p class="adv-question">${advEscape(m.quiz.q)}</p><div class="adv-options">${m.quiz.options.map((v,i)=>`<label><input type="radio" name="advQuiz" value="${i}" ${st.quiz===i?'checked':''}/><span>${advEscape(v)}</span></label>`).join('')}</div><div class="tool-line"><button class="btn primary" id="advCheck">Хариугаа шалгах</button><button class="btn" id="advClear">Арилгах</button></div><div class="adv-feedback" id="advFeedback" ${st.checked?'':'hidden'}></div></div><h3>Миний тэмдэглэл — Day ${d}</h3><p class="adv-note">Өмнөх Day 1–2 тэмдэглэлтэй тусдаа хадгалагдана. Backup авахад хамт экспортлогдоно.</p><textarea id="advNotes" class="adv-notes" placeholder="Ямар assumption чухал байсан? Юу ойлгомжгүй байна? Ямар AGV туршилтад ашиглах вэ?"></textarea><p class="adv-note" id="advSaved">● Browser-д автоматаар хадгална</p><div class="adv-links"><button class="btn" id="advBackup">↓ Backup</button>${prev?`<button class="btn" id="advPrev">← Day ${d-1}</button>`:''}${next?`<button class="btn primary" id="advNext">Day ${d+1} →</button>`:''}</div></section>
 <footer class="footer">Vision Theory Lab · Day ${String(d).padStart(2,'0')} / 30 · Fundamental Theory • Derivation • Visualization • Evaluation</footer>`;
 document.querySelectorAll('[data-adv-mark]').forEach(el=>el.addEventListener('click',()=>advMark(d,el.dataset.advMark)));
 $('advNotes').value=typeof st.notes==='string'?st.notes:'';$('advNotes').addEventListener('input',e=>{st.notes=e.target.value;save();$('advSaved').textContent=persistOK?'✓ Тэмдэглэл хадгалагдсан':'⚠ Backup файлаар хадгал';});
 document.querySelectorAll('input[name="advQuiz"]').forEach(el=>el.addEventListener('change',e=>{st.quiz=Number(e.target.value);st.checked=false;$('advFeedback').hidden=true;save();}));
 $('advCheck').addEventListener('click',()=>{st.checked=true;save();advRenderFeedback(d)});
 $('advClear').addEventListener('click',()=>{st.quiz=null;st.checked=false;save();renderAdvanced(d)});
 $('advBackup').addEventListener('click',exportBackup);
 if(prev)$('advPrev').addEventListener('click',()=>showDay(d-1));if(next)$('advNext').addEventListener('click',()=>showDay(d+1));
 if(st.checked)advRenderFeedback(d);
 $('advA').addEventListener('input',()=>advDraw(d));$('advB').addEventListener('input',()=>advDraw(d));advDraw(d);
}
function advRenderFeedback(d){const st=advancedDayState(d),q=ADVANCED[d].quiz,el=$('advFeedback');if(!el)return;el.hidden=false;el.innerHTML=`<strong style="color:${st.quiz===q.ok?'var(--teal)':'var(--orange)'}">${st.quiz===q.ok?'✓ Зөв!':'Зөв хариулт: '+advEscape(q.options[q.ok])}</strong><p>${advEscape(q.why)}</p>`;}



