/* Platform UI. Original course, numerical engines, storage key and v1 backups remain the source of truth. */
(() => {
  'use strict';
  const MODULES = [
    {name:'Image Mathematics',short:'Image mathematics & features',start:1,end:7,color:'#27D3C3',topics:'Signals · convolution · Fourier · features',description:'Pixel-ээс signal, edge болон feature хүртэл.',icon:'signal'},
    {name:'Projective Geometry',short:'Projective geometry & stereo',start:8,end:14,color:'#629BFF',topics:'SE(3) · cameras · epipolar geometry · depth',description:'2D хэмжилтээс 3D ертөнцийг ойлгох.',icon:'geometry'},
    {name:'Motion & Optimization',short:'Visual odometry & optimization',start:15,end:21,color:'#AD96ED',topics:'Optical flow · tracking · VO · least squares',description:'Хөдөлгөөнийг тооцож, алдааг багасгах.',icon:'motion'},
    {name:'Learning & Capstones',short:'Deep learning & capstones',start:22,end:30,color:'#EFB970',topics:'Backprop · CNN · attention · two capstones',description:'Geometry болон learned representation-ийг холбох.',icon:'network'}
  ];
  const TEX = [
    String.raw`I[m,n]=Q\!\left(g\iint A\,(h*L)\,dx\,dy+\eta\right)`,
    String.raw`(I*K)[m,n]=\sum_i\sum_j I[m-i,n-j]K[i,j]`,
    String.raw`\nabla I=\begin{bmatrix}\partial I/\partial x\\\partial I/\partial y\end{bmatrix}`,
    String.raw`f(x)=\sum_k c_k e^{i2\pi kx/T}`,
    String.raw`F[u,v]=\sum_x\sum_y I[x,y]e^{-i2\pi(ux/W+vy/H)}`,
    String.raw`L(x,y;\sigma)=G(x,y;\sigma)*I(x,y)`,
    String.raw`M=\sum w\begin{bmatrix}I_x^2&I_xI_y\\I_xI_y&I_y^2\end{bmatrix}`,
    String.raw`p_c=R_{cw}p_w+t_{cw}`,
    String.raw`u=f_x\frac{X}{Z}+c_x,\quad v=f_y\frac{Y}{Z}+c_y`,
    String.raw`\min\sum_i\|x_i-\pi(K,R,t,X_i)\|^2`,
    String.raw`x_2^\top F x_1=0`,
    String.raw`d=u_L-u_R\quad\text{(rectified stereo)}`,
    String.raw`Z=\frac{fB}{d},\quad\sigma_Z\approx\frac{Z^2\sigma_d}{fB}`,
    String.raw`\hat X=\arg\min_X\sum_i\|x_i-\pi(P_i,X)\|^2`,
    String.raw`I_xu+I_yv+I_t=0`,
    String.raw`\arg\min_u\sum_xw(x)[I_2(x+u)-I_1(x)]^2`,
    String.raw`E=[t]_\times R`,
    String.raw`\hat T=\arg\min_T\sum_i\|x_i-\pi(TX_i)\|^2`,
    String.raw`\Delta x=-(J^\top J)^{-1}J^\top r`,
    String.raw`\min_{T,X}\sum_{i,j}\rho\!\left(\|x_{ij}-\pi(T_iX_j)\|^2\right)`,
    String.raw`\operatorname{ATE}=\sqrt{\frac1N\sum_i\|\hat t_i-t_i\|^2}`,
    String.raw`\theta_{k+1}=\theta_k-\alpha\nabla_\theta L(\theta_k)`,
    String.raw`\frac{\partial L}{\partial w}=\frac{\partial L}{\partial y}\frac{\partial y}{\partial w}`,
    String.raw`Y_k=\sigma\!\left(\sum_c K_{kc}*X_c+b_k\right)`,
    String.raw`y=x+F(x;\theta)`,
    String.raw`\min_\theta\mathbb E_{(x,y)\sim D}[L(f_\theta(x),y)]`,
    String.raw`\operatorname{IoU}(A,B)=\frac{|A\cap B|}{|A\cup B|}`,
    String.raw`\operatorname{Attention}(Q,K,V)=\operatorname{softmax}\!\left(\frac{QK^\top}{\sqrt d}\right)V`,
    String.raw`Z=\frac{fB}{d}`,
    String.raw`\hat T=\arg\min_T\sum_i\rho\!\left(\|x_i-\pi(TX_i)\|^2\right)`
  ];
  const UI_KEY = KEY+'-ui-v1';
  let preferences = {sections:{},closedModules:[]};
  try { const p=JSON.parse(localStorage.getItem(UI_KEY)||'{}'); if(p&&typeof p==='object') {preferences.sections=p.sections&&typeof p.sections==='object'?p.sections:{};preferences.closedModules=Array.isArray(p.closedModules)?p.closedModules:[];} } catch {}
  LocalizationCourse.initialize();
  let studioUnit=null;
  let view='dashboard', dayOneInitialized=false, sectionObserver=null, toastTimer=null;
  const baseShowDay=showDay, baseProgress=progress, baseAdvancedProgress=advancedProgress, baseRenderAdvanced=renderAdvanced;
  const rootFor = d => $(d===1?'lesson1':d===2?'lesson2':'plannedLesson');
  const sectionKeys = d => d===1?SECTIONS:d===2?D2_SECTIONS:ADV_SECTIONS;
  const sectionsFor = d => d===1?state.sections:d===2?state.day2.sections:(state.advanced?.[d]?.sections||[]);
  const completedCount = d => sectionKeys(d).filter(key=>sectionsFor(d).includes(key)).length;
  const completed = d => completedCount(d)===sectionKeys(d).length;
  const moduleFor = d => MODULES.find(m=>d>=m.start&&d<=m.end);
  const percentage = d => Math.round(completedCount(d)/sectionKeys(d).length*100);
  const escape = advEscape;
  function savePreferences(){try{localStorage.setItem(UI_KEY,JSON.stringify(preferences));}catch{}}
  function notify(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3500);}
  function formula(element,tex,display=false){if(window.katex){try{katex.render(tex,element,{displayMode:display,throwOnError:true,trust:false,strict:'ignore'});}catch{element.textContent=tex;}}else element.textContent=tex;}
  function setView(next){view=next;document.body.classList.toggle('dashboard-view',next==='dashboard'||next==='path');$('localizationPath').hidden=next!=='path';$('localizationLesson').hidden=next!=='studio';$('localizationButton').classList.toggle('active',next==='path'||next==='studio');$('dashboard').hidden=next!=='dashboard';$('outlineToggle').hidden=next==='dashboard'||next==='path';$('dashboardButton').classList.toggle('active',next==='dashboard');}

  // Four curriculum modules; the two capstones belong to the final module.
  nav = function renderCourseNavigation(){
    const query=$('lessonSearch').value.trim().toLocaleLowerCase();
    let matches=0;
    $('courseNav').innerHTML=MODULES.map((m,index)=>{
      const lessons=COURSE.filter(l=>l.d>=m.start&&l.d<=m.end&&(!query||`${l.d} ${l.t} ${l.s} ${l.goal} ${ADVANCED[l.d]?.overview||''} ${ADVANCED[l.d]?.model||''}`.toLocaleLowerCase().includes(query)));
      matches+=lessons.length;
      if(!lessons.length)return '';
      return `<details class="module-nav" data-module="${index}" ${query||!preferences.closedModules.includes(index)?'open':''}><summary><span>${String(index+1).padStart(2,'0')}</span>${m.short}<small>${m.end-m.start+1}</small></summary>${lessons.map(l=>`<button class="day-link ${view==='lesson'&&l.d===state.lastDay?'active':''}" data-day="${l.d}" aria-current="${view==='lesson'&&l.d===state.lastDay?'page':'false'}" title="${escape(l.s)}"><span class="day-num">${String(l.d).padStart(2,'0')}</span><span class="day-label">${escape(l.t)}</span><span class="day-state ${completedCount(l.d)?'':'empty'}">${completed(l.d)?'✓':completedCount(l.d)?'◐':'○'}</span></button>`).join('')}</details>`;
    }).join('') || '<p class="empty-search">Хичээл олдсонгүй. Өөр түлхүүр үгээр хайна уу.</p>';
    $('courseNav').querySelectorAll('[data-day]').forEach(b=>b.addEventListener('click',()=>showDay(Number(b.dataset.day))));
    $('courseNav').querySelectorAll('[data-module]').forEach(el=>el.addEventListener('toggle',()=>{
      if(query)return;
      const index=Number(el.dataset.module);
      preferences.closedModules=preferences.closedModules.filter(x=>x!==index);
      if(!el.open)preferences.closedModules.push(index);
      savePreferences();
    }));
    if(query)$('courseNav').setAttribute('aria-label',matches+' search results');
    const studioMatches=renderLocalizationNavigation(query);
    if(query&&!matches&&studioMatches)$('courseNav').innerHTML='';
  };
  function icon(type){
    const paths={
      signal:'<path d="M2 25h52M8 5v40M4 25c6-26 9-26 15 0s9 26 15 0 9-26 16 0"/>',
      geometry:'<path d="M5 40 28 6l23 34ZM5 40h46M28 6v34M12 29h32M5 40l23-13 23 13"/><circle cx="28" cy="6" r="2"/>',
      motion:'<path d="M5 39c9 0 6-22 17-22s7 19 15 19 5-23 15-23M5 45h48M5 5v40"/><circle cx="22" cy="17" r="2"/><circle cx="37" cy="36" r="2"/><circle cx="52" cy="13" r="2"/>',
      network:'<path d="m9 12 19-5 19 5M9 12l19 12 19-12M9 36l19-12 19 12M9 36l19 7 19-7M9 12v24M47 12v24M28 7v36"/><circle cx="9" cy="12" r="3"/><circle cx="9" cy="36" r="3"/><circle cx="28" cy="7" r="3"/><circle cx="28" cy="24" r="3"/><circle cx="28" cy="43" r="3"/><circle cx="47" cy="12" r="3"/><circle cx="47" cy="36" r="3"/>'
    };
    return `<svg viewBox="0 0 56 50" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">${paths[type]}</svg>`;
  }
  function lessonList(lessons){return lessons.map(l=>`<button data-open-day="${l.d}"><span>${String(l.d).padStart(2,'0')}</span><span>${escape(l.t)}<small>${escape(l.s)}</small></span><span>${completed(l.d)?'✓':'↗'}</span></button>`).join('');}
  function renderDashboard(){
    const done=COURSE.filter(l=>completed(l.d));
    const total=COURSE.reduce((n,l)=>n+completedCount(l.d),0),all=COURSE.reduce((n,l)=>n+sectionKeys(l.d).length,0),pct=Math.round(total/all*100);
    const started=COURSE.filter(l=>completedCount(l.d)>0&&!completed(l.d));
    const next=COURSE.filter(l=>!completed(l.d)&&l.d>=state.lastDay).slice(0,3);
    $('dashboard').innerHTML=`
      <div class="dashboard-eyebrow"><span>YOUR LEARNING WORKSPACE</span><span class="workspace-status">Offline ready · No account needed</span></div>
      <section class="dashboard-hero"><div><div class="eyebrow">FROM SENSOR MEASUREMENTS TO LOCALIZATION</div><h1>Understand the sensors.<br/><span>Build localization intuition.</span></h1><p>RGB · Depth · LiDAR · IMU. Математик сууриас sensor fusion, localization болон FAST-LIVO2-ийн бодит код хүртэл холбоотой замаар суралцъя. Өмнөх 30 хичээл мөн нээлттэй.</p><button class="btn primary" id="continueLearning">${total?'Continue learning':'Суралцаж эхлэх'} <span aria-hidden="true">→</span></button><div class="hero-meta"><span>DAY ${String(state.lastDay).padStart(2,'0')} · ${escape(COURSE[state.lastDay-1].t)}</span></div></div>
      <div class="signal-preview"><div class="preview-label"><span>LIVE EXPERIMENT / 01</span><span>Signal → Samples</span></div><svg id="dashboardSignal" viewBox="0 0 440 205" role="img" aria-label="Continuous sinusoid and 24 discrete samples"></svg><div class="preview-footer"><label for="previewFrequency">Frequency</label><input id="previewFrequency" type="range" min="1" max="20" value="4" step="1"/><output id="previewFrequencyOut" for="previewFrequency">4 cyc</output></div><p class="preview-caption" id="previewCaption">Frequency-ийг өөрчилж sampling ambiguity-г ажиглаарай.</p></div></section>
      <div class="dashboard-stats"><div class="dashboard-stat"><small>Course completion</small><strong>${pct}<span style="font-size:13px;color:var(--muted)">%</span></strong><div class="stat-meter"><div class="mini-track"><span style="width:${pct}%"></span></div><span style="font-size:9px;color:var(--muted)">${total}/${all} sections</span></div></div><div class="dashboard-stat"><small>Lessons completed</small><strong>${String(done.length).padStart(2,'0')}<span style="font-size:13px;color:var(--muted)"> / 30</span></strong><span>${started.length} in progress</span></div><div class="dashboard-stat"><small>Learning modules</small><strong>04</strong><span>Foundations → capstones</span></div><div class="dashboard-stat"><small>Visual experiments</small><strong>22<span style="font-size:13px;color:var(--muted)"> +</span></strong><span>Explore · predict · verify</span></div></div>
      <div class="dashboard-section-heading"><div><h2>Your learning path</h2><p>Дөрвөн module. Нэг холбогдсон ойлголт.</p></div><span>01 — 30 / OPEN CURRICULUM</span></div>
      <div id="cvDashboardCatalog"></div><div id="localizationDashboardCard"></div><div class="module-grid">${MODULES.map((m,i)=>{
        const list=COURSE.filter(l=>l.d>=m.start&&l.d<=m.end),n=list.filter(l=>completed(l.d)).length,count=list.reduce((v,l)=>v+completedCount(l.d),0),max=list.reduce((v,l)=>v+sectionKeys(l.d).length,0);
        const target=list.find(l=>!completed(l.d))||list[0];
        return `<article class="module-card" style="--module-color:${m.color}"><div class="module-card-top"><span class="module-number">MODULE ${String(i+1).padStart(2,'0')}</span><span class="module-days">DAY ${String(m.start).padStart(2,'0')} — ${m.end}</span></div><div class="module-body"><div class="module-icon">${icon(m.icon)}</div><div><h3>${m.name}</h3><p>${m.topics}</p><p>${m.description}</p></div></div><div class="module-card-bottom"><span>${n} / ${list.length} lessons complete</span><button data-open-day="${target.d}">${count?'Continue module':'Explore module'} →</button></div><div class="module-progress" role="progressbar" aria-label="${m.name} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(count/max*100)}"><span style="width:${count/max*100}%"></span></div></article>`;
      }).join('')}</div>
      <section class="journey-card"><div class="dashboard-section-heading"><h2>Your 30-day journey</h2><span>${done.length} COMPLETE</span></div><div class="journey-strip">${COURSE.map(l=>`<button data-open-day="${l.d}" class="${completed(l.d)?'complete':completedCount(l.d)?'started':''} ${l.d===state.lastDay?'current':''}" title="Day ${l.d}: ${escape(l.t)} · ${percentage(l.d)}%" aria-label="Day ${l.d}, ${escape(l.t)}, ${percentage(l.d)} percent complete">${String(l.d).padStart(2,'0')}</button>`).join('')}</div><div class="journey-legend"><span class="complete">Completed</span><span class="started">In progress</span><span>Not started</span></div></section>
      <div class="dashboard-bottom"><section><div class="dashboard-section-heading"><h2>${done.length?'Previously completed':'Pick up where you left off'}</h2><span>${done.length?'COMPLETED':'CONTINUE'}</span></div><div class="lesson-list">${lessonList(done.length?done.slice(-3).reverse():started.length?started.slice(0,3):[COURSE[state.lastDay-1]])}</div></section><section><div class="dashboard-section-heading"><h2>Up next</h2><span>YOUR NEXT STEPS</span></div><div class="lesson-list">${next.length?lessonList(next):'<p class="empty-copy">Бүх хичээлийг судалжээ. Өмнөх лабораториудаа дахин туршаарай.</p>'}</div></section></div>
      <div class="concept-map" aria-label="Topic relationships"><span>Image signals</span><i>→</i><span>Features</span><i>→</i><span>Geometry & depth</span><i>→</i><span>Motion & pose</span><i>→</i><span>Learned representations</span></div><div class="dashboard-foot"><span>VISION THEORY LAB · Understand through visualization.</span><span>Progress stays on your device. Export a backup to keep it.</span></div>`;
    renderLocalizationDashboard();
    CVLabs.dashboard($('cvDashboardCatalog'),openPixelLab);
    GeometryLabs.dashboard($('cvDashboardCatalog'),openGeometryLab);
    $('continueLearning').addEventListener('click',()=>{if(state.lastLearningNode&&LocalizationCourse.find(state.lastLearningNode)){openLearningNode(state.lastLearningNode);return;}const d=state.lastDay;showDay(d);const anchor=preferences.sections[d];if(anchor)document.getElementById(anchor)?.scrollIntoView({block:'start'});});
    $('dashboard').querySelectorAll('[data-open-day]').forEach(b=>b.addEventListener('click',()=>showDay(Number(b.dataset.openDay))));
    $('previewFrequency').addEventListener('input',drawDashboardSignal);drawDashboardSignal();
    $('overallProgress').textContent=pct+'%';$('progressSubject').textContent='Нийт сургалтын ахиц';$('progressFill').style.width=pct+'%';
  }
  function drawDashboardSignal(){
    const f=Number($('previewFrequency').value),N=24,x=t=>30+t*386,y=v=>103-v*62;
    const points=Array.from({length:650},(_,i)=>{let t=i/649;return `${x(t).toFixed(2)},${y(Math.cos(2*Math.PI*f*t)).toFixed(2)}`;}).join(' ');
    let alias=Infinity;for(let k=-2;k<=2;k++)alias=Math.min(alias,Math.abs(f-k*N));
    $('dashboardSignal').innerHTML=`<defs><pattern id="previewGrid" width="48.25" height="31" patternUnits="userSpaceOnUse"><path d="M48.25 0H0V31" fill="none" stroke="var(--line)" stroke-width=".7"/></pattern></defs><rect x="30" y="38" width="386" height="128" fill="url(#previewGrid)"/><path d="M30 38v128h386" fill="none" stroke="var(--line)"/><text x="31" y="19" fill="var(--muted)" font-family="Inter" font-size="9">I(x) = cos(2πfx)</text><text x="325" y="19" fill="var(--teal)" font-family="Inter" font-size="9">24 samples</text><polyline points="${points}" fill="none" stroke="var(--blue)" stroke-width="1.7"/>${Array.from({length:N},(_,n)=>{let t=(n+.5)/N;return `<circle cx="${x(t)}" cy="${y(Math.cos(2*Math.PI*f*t))}" r="2.7" fill="var(--teal)"/>`;}).join('')}<text x="12" y="44" fill="var(--muted)" font-size="8">1</text><text x="9" y="106" fill="var(--muted)" font-size="8">0</text><text x="7" y="166" fill="var(--muted)" font-size="8">−1</text><text x="30" y="186" fill="var(--muted)" font-size="8">0</text><text x="323" y="186" fill="var(--muted)" font-size="8">position x / image width</text>`;
    $('previewFrequencyOut').textContent=f+' cyc';
    $('previewCaption').textContent=f<12?`f = ${f} cyc/image < Nyquist 12. Samples нь энэ sinusoid-ийг ялгаж чадна.`:`f = ${f} cyc/image. ${alias} cyc/image-тэй sampling ambiguity үүснэ; Nyquist boundary = 12.`;
  }
  function showDashboard(){setView('dashboard');for(const id of ['lesson1','lesson2','plannedLesson'])$(id).hidden=true;document.title='Learning Workspace · Vision Theory Lab';$('topbarDay').textContent='Learning dashboard';history.replaceState(null,'','#dashboard');sectionObserver?.disconnect();$('readingFill').style.width='0';closeDrawers();renderDashboard();nav();window.scrollTo({top:0,behavior:'instant'});}
  function initDayOne(){if(dayOneInitialized)return;dayOneInitialized=true;drawEdgePixels();renderSpatialFrequency();renderShape();renderSpaceTime();renderSampling();renderQuant();renderNoise();renderPsf();renderMoire();}
  showDay = function openLesson(d){
    if(!Number.isInteger(d)||d<1||d>30)return;
    setView('lesson');state.lastLearningNode='day'+d;baseShowDay(d);if(d===1)initDayOne();
    document.title=`Day ${d} · ${COURSE[d-1].t} · Vision Theory Lab`;
    $('topbarDay').textContent=`${moduleFor(d).name} / Day ${String(d).padStart(2,'0')}`;
    history.replaceState(null,'','#day'+d);decorateLesson(rootFor(d),d);renderOutline();closeDrawers();nav();const title=rootFor(d).querySelector('h1');if(title){title.tabIndex=-1;title.focus({preventScroll:true});}
  };
  progress = function updateProgress(){baseProgress();if(view==='lesson')updateOutlineProgress();};
  advancedProgress = function updateAdvancedProgress(){baseAdvancedProgress();if(view==='lesson')updateOutlineProgress();};
  renderAdvanced = function refreshAdvanced(d){baseRenderAdvanced(d);if(view==='lesson'){decorateLesson(rootFor(d),d);renderOutline();}};

  function decorateLesson(root,d){
    renderPrerequisites(root,'day'+d);
    const hero=root.querySelector('.hero');
    if(hero&&!root.querySelector('.objective-card')){
      const objective=document.createElement('div');objective.className='objective-card';objective.innerHTML=`<span aria-hidden="true">◎</span><div><strong>LEARNING OBJECTIVE</strong><p>${escape(COURSE[d-1].goal)}</p></div>`;hero.after(objective);
    }
    if(d<3&&!root.querySelector('.primary-equation')){
      const equation=document.createElement('div');equation.className='formula primary-equation';equation.innerHTML='<div class="section-num">GOVERNING RELATIONSHIP</div><div class="equation-typeset"></div><details class="outline-details"><summary>Variables & assumptions</summary><p></p></details>';
      formula(equation.querySelector('.equation-typeset'),TEX[d-1],true);
      equation.querySelector('details p').textContent=d===1?'I: digital intensity; Q: quantizer; g: sensor gain; A: pixel integration aperture; h: optical PSF; L: incident radiance; η: sensor noise. The model abstracts the exposure and sensor response.':'I: discrete input intensity; K: kernel coefficients; m,n: output pixel indices; i,j: kernel offsets. Convolution flips the kernel. Boundary handling and normalization are explicit in the laboratories.';
      root.querySelector('.objective-card').after(equation);
    }
    root.querySelectorAll('input[type="range"],select,input[type="number"]').forEach(input=>{
      const label=input.parentElement.querySelector('label');
      if(label&&input.id)label.htmlFor=input.id;
      if(!input.labels?.length&&!input.getAttribute('aria-label'))input.setAttribute('aria-label',input.id||'Kernel coefficient');
    });
    root.querySelectorAll('canvas').forEach(canvas=>{canvas.setAttribute('role','img');if(!canvas.getAttribute('aria-label'))canvas.setAttribute('aria-label',canvas.closest('.card')?.querySelector('h3')?.textContent||'Scientific visualization');});
    // Reusable InteractiveLab chrome wraps each existing experiment; all handlers remain attached.
    root.querySelectorAll('.card').forEach(card=>{
      if(card.dataset.enhancedLab||(!card.querySelector('canvas')&&!card.querySelector('#d2InputGrid')))return;
      card.dataset.enhancedLab='true';card.classList.add('interactive-lab');
      const defaults=Array.from(card.querySelectorAll('input:not([type="radio"]),select')).map(el=>({el,value:el.value}));
      const activeModes=Array.from(card.querySelectorAll('.seg button.active'));
      const chrome=document.createElement('div');chrome.className='lab-chrome';chrome.innerHTML='<span class="lab-badge">◈ INTERACTIVE LAB</span><button class="btn lab-reset" type="button">↺ Reset</button>';card.prepend(chrome);
      chrome.querySelector('button').addEventListener('click',()=>{
        if(card.querySelector('#d2Preset'))d2Kernel=D2_KERNELS.box.slice();
        for(const {el,value} of defaults){if(!el.isConnected)continue;el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
        activeModes.forEach(b=>b.click());notify('Лабораторийн анхны параметрүүд сэргээгдлээ.');
      });
      const help=document.createElement('p');help.className='lab-help';help.textContent='Таамагла → параметрийг өөрчил → дүрслэл, хэмжилт болон тайлбарыг харьцуул.';card.append(help);
    });
    root.querySelectorAll('.formula,.adv-eq').forEach(eq=>{
      if(eq.dataset.equationReady)return;eq.dataset.equationReady='true';
      const text=eq.textContent.trim();
      if(eq.classList.contains('adv-eq')){const typeset=document.createElement('div');typeset.className='equation-typeset';formula(typeset,TEX[d-1],true);eq.prepend(typeset);}
      const copy=document.createElement('button');copy.className='copy-equation';copy.textContent='Copy equation';copy.setAttribute('aria-label','Томьёо хуулах');copy.addEventListener('click',()=>copyText(text));eq.append(copy);
    });
    root.querySelectorAll('.adv-prooflist>li').forEach((li,i)=>{
      if(li.querySelector('details'))return;const content=li.textContent;li.textContent='';const detail=document.createElement('details');detail.className='derivation-step';detail.innerHTML=`<summary>Step ${i+1} · ${escape(content.split(':')[0].slice(0,75))}</summary><p>${escape(content)}</p>`;li.append(detail);
    });
    if(!root.querySelector('.lesson-navigation')){
      const navEl=document.createElement('nav');navEl.className='lesson-navigation';navEl.setAttribute('aria-label','Previous and next lesson');
      navEl.innerHTML=`<button data-lesson-prev><small>${d>1?'PREVIOUS LESSON':'LEARNING WORKSPACE'}</small>${d>1?'← '+escape(COURSE[d-2].t):'← Dashboard'}</button><button data-lesson-next><small>${d<30?'NEXT LESSON':'COURSE OVERVIEW'}</small>${d<30?escape(COURSE[d].t)+' →':'Dashboard →'}</button>`;
      navEl.querySelector('[data-lesson-prev]').addEventListener('click',()=>d>1?showDay(d-1):showDashboard());navEl.querySelector('[data-lesson-next]').addEventListener('click',()=>d<30?showDay(d+1):showDashboard());root.append(navEl);
    }
    CVLabs.mount(root,d);
    GeometryLabs.mount(root,{day:d});
    addNumericCheck(root,d);
    if(d>2)enhanceAdvancedLab(d);
    if(!root.querySelector('.lesson-summary')){
      const summary=document.createElement('section');summary.className='lesson-summary';summary.innerHTML=`<h3>Lesson summary · ${escape(COURSE[d-1].t)}</h3><p>${escape(COURSE[d-1].goal)}</p><p>Key relationship: <span class="summary-equation"></span></p><small>Дараагийн алхам: параметрийн өөрчлөлтийг тайлбарлаад, knowledge check-ээ шалгаж, судалсан хэсгүүдээ тэмдэглээрэй.</small>`;formula(summary.querySelector('.summary-equation'),TEX[d-1]);root.querySelector('.lesson-navigation').before(summary);
    }
  }
  async function copyText(text){try{await navigator.clipboard.writeText(text);notify('Томьёог хууллаа.');}catch{const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.top='0';t.style.left='0';document.body.append(t);t.select();try{document.execCommand('copy');notify('Томьёог хууллаа.');}catch{notify('Хуулах боломжгүй. Текстийг сонгож хуулна уу.');}t.remove();}}

  function lessonAnchors(){const root=rootFor(state.lastDay);return Array.from(root.querySelectorAll('.section[id],.adv-part[id]'));}
  function sectionLabel(section){return section.querySelector('h2')?.textContent||section.id;}
  function renderOutline(){
    if(view==='studio'){renderStudioOutline();return;}
    if(view!=='lesson')return;
    const d=state.lastDay,anchors=lessonAnchors(),m=moduleFor(d);
    $('outlineContent').innerHTML=`<div class="outline-heading">ON THIS PAGE</div><nav class="outline-links">${anchors.map((el,i)=>`<a href="#${el.id}" data-anchor="${el.id}">${String(i+1).padStart(2,'0')} &nbsp; ${escape(sectionLabel(el))}</a>`).join('')}</nav><div class="outline-box"><div class="outline-heading">LESSON PROGRESS</div><div class="outline-progress"><div id="lessonProgressRing" class="progress-ring" style="--pct:${percentage(d)}" data-pct="${percentage(d)}%"></div><div><strong id="lessonProgressText">${completedCount(d)} / ${sectionKeys(d).length} sections</strong><small>Day ${String(d).padStart(2,'0')} · ${m.name}</small></div></div><div class="quiz-stat" id="outlineQuizStat"></div></div><div class="outline-box"><div class="outline-heading">QUICK REFERENCE</div><div class="outline-formula" id="quickFormula"></div><details class="outline-details"><summary>What does this describe?</summary><p>${escape(COURSE[d-1].s)}</p><p>${escape(d>2?ADVANCED[d].failure:'Physical measurement, finite samples and finite precision constrain the model. See each derivation for its assumptions and units.')}</p></details></div><div class="outline-box"><div class="outline-heading">YOUR WORKSPACE</div><small>Тэмдэглэлээ энэ төхөөрөмжид хадгална. Backup ашиглан өөр төхөөрөмж рүү зөөнө.</small><button class="btn" id="notesShortcut">✎ Lesson notes</button><button class="btn ghost" id="outlineBackup">↓ Export progress</button></div>`;
    formula($('quickFormula'),TEX[d-1]);
    $('notesShortcut').addEventListener('click',()=>{const note=$(d===1?'lessonNotes':d===2?'d2Notes':'advNotes');closeDrawers();note.scrollIntoView({block:'center'});note.focus({preventScroll:true});});$('outlineBackup').addEventListener('click',exportBackup);
    $('outlineContent').querySelectorAll('[data-anchor]').forEach(a=>a.addEventListener('click',event=>{event.preventDefault();document.getElementById(a.dataset.anchor).scrollIntoView({block:'start'});preferences.sections[d]=a.dataset.anchor;savePreferences();closeDrawers();}));
    sectionObserver?.disconnect();
    sectionObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){setActiveSection(entry.target.id);preferences.sections[d]=entry.target.id;savePreferences();}}},{rootMargin:'-85px 0px -60% 0px',threshold:0});anchors.forEach(el=>sectionObserver.observe(el));
    if(anchors.length)setActiveSection(anchors[0].id);updateOutlineProgress();
  }
  function setActiveSection(id){$('outlineContent').querySelectorAll('[data-anchor]').forEach(a=>{const active=a.dataset.anchor===id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
  function quizStats(d){if(d===1&&state.quizChecked)return `${QUESTIONS.filter((q,i)=>state.quiz[i]===q.ok).length}/${QUESTIONS.length} correct`;if(d===2&&state.day2.quizChecked)return `${D2_QUIZ.filter((q,i)=>state.day2.quiz[i]===q.ok).length}/${D2_QUIZ.length} correct`;if(d>2&&state.advanced?.[d]?.checked)return state.advanced[d].quiz===ADVANCED[d].quiz.ok?'Concept check · 1/1 correct':'Concept check · retry recommended';return 'Knowledge check · not submitted';}
  function updateOutlineProgress(){if(view==='studio'){renderStudioOutline();return;}if(!$('lessonProgressRing'))return;const d=state.lastDay,pct=percentage(d);$('lessonProgressRing').style.setProperty('--pct',pct);$('lessonProgressRing').dataset.pct=pct+'%';$('lessonProgressText').textContent=`${completedCount(d)} / ${sectionKeys(d).length} sections`;$('outlineQuizStat').textContent=quizStats(d);}
  function addNumericCheck(root,d){
    if(root.querySelector('.numeric-check'))return;
    const data=d===1?{question:'64 pixel өргөнд 8 бүтэн cycle байна. Period хэдэн pixel/cycle вэ?',answer:8,unit:'px/cycle',solution:'Period = width / cycles = 64 / 8 = 8 px/cycle.'}:d===2?{question:'11 × 11 separable filter нэг output pixel-д хэдэн multiplication хэрэглэх вэ?',answer:22,unit:'multiplications',solution:'Horizontal ба vertical pass тус бүр 11: 2k = 22 (direct: k² = 121).'}:d===13||d===29?{question:'f = 800 px, B = 0.15 m, d = 60 px. Depth Z хэдэн метр вэ?',answer:2,unit:'m',solution:'Z = fB/d = 800 × 0.15 / 60 = 2 m.'}:d===23?{question:'L = ½(y − 10)², y = 1.7wx, x = 2, w = 1. ∂L/∂w хэд вэ?',answer:-22.44,unit:'gradient',solution:'y = 3.4; ∂L/∂w = (3.4 − 10) × 1.7 × 2 = −22.44.'}:null;
    if(!data)return;
    const card=document.createElement('div');card.className='card numeric-check';card.innerHTML=`<h3>Numerical knowledge check</h3><p class="card-intro">Эхлээд өөрөө бодоод хариугаа шалгаарай.</p><label for="numericAnswer${d}">${data.question}<br/><input id="numericAnswer${d}" type="number" step="any" inputmode="decimal"/> <span>${data.unit}</span></label><div class="tool-line"><button class="btn primary" data-numeric-submit>Check answer</button><button class="btn" data-numeric-retry>Retry</button></div><div class="numeric-result" role="status" hidden></div>`;
    const result=card.querySelector('.numeric-result'),input=card.querySelector('input');
    card.querySelector('[data-numeric-submit]').addEventListener('click',()=>{if(input.value===''||!Number.isFinite(input.valueAsNumber)){result.hidden=false;result.textContent='Тоон хариулт оруулна уу.';return;}result.hidden=false;const correct=Math.abs(input.valueAsNumber-data.answer)<=Math.max(1e-8,Math.abs(data.answer)*1e-4);result.textContent=(correct?'✓ Зөв. ':'Дахин тооцоолоод үзээрэй. ')+data.solution;});
    card.querySelector('[data-numeric-retry]').addEventListener('click',()=>{input.value='';result.hidden=true;input.focus();});root.querySelector(d<3?'#'+(d===1?'quizRoot':'d2Quiz'):'#adv-assessment .card')?.after(card);
  }

  // Typed units and live equations for every advanced experiment; values use the original slider mapping.
  function advancedMeasurements(type,A,B){
    switch(type){
      case 'signal':return {values:[['Frequency',`${1+Math.round(A/5)} cyc / 640 px`],['Amplitude',`${(15+B*1.05).toFixed(2)} intensity units`]],eq:'I(x) = A sin(2π f x / 640); ∂I/∂x ∝ A f',note:'The gradient trace is scaled for display; it is not plotted in calibrated derivative units.'};
      case 'spectrum':return {values:[['Wave-vector angle',`${(A*1.8).toFixed(1)}°`],['Wave-vector magnitude',`${2+Math.round(B/7)} cyc / 295 px`]],eq:'I(x,y) = 130 + 108 cos(2π f (x cos θ + y sin θ) / 295)',note:'Peak positions show the analytic Fourier components, not a computed image FFT.'};
      case 'gaussian':{const s=.3+A/20,f=1+Math.round(B/5),gain=Math.exp(-2*Math.PI**2*s*s*(f/70)**2);return {values:[['Gaussian σ',`${s.toFixed(2)} px`],['Frequency',`${(f/70).toFixed(4)} cyc/px`],['Amplitude gain',gain.toFixed(4)]],eq:`H(f) = exp(−2π²σ²f²) = ${gain.toFixed(4)}`,note:'The x-axis is normalized to a 70-pixel domain; vertical traces are offset for comparison.'};}
      case 'tensor':return {values:[['λ₁',`${4*A+1}`],['λ₂',`${4*B+1}`]],eq:'M = Q diag(λ₁, λ₂) Qᵀ; R = λ₁λ₂ − k(λ₁+λ₂)²',note:'The ellipse illustrates relative gradient information, not a constant-energy contour. Classification uses an illustrative threshold.'};
      case 'rotation':return {values:[['Yaw',`${((A-50)*3.6).toFixed(1)}°`],['Translation',`${((B-50)*3).toFixed(1)} display px`]],eq:'p′ = R(θ)p + t; RᵀR = I',note:'This is a planar slice of a rigid transform; it does not simulate full SO(3).'};
      case 'projection':{const Z=1+A/17,X=(B-50)/26;return {values:[['Depth Z',`${Z.toFixed(3)} m`],['Lateral X',`${X.toFixed(3)} m`],['u − cₓ',`${(500*X/Z).toFixed(2)} px`]],eq:`u = 500·(${X.toFixed(3)}/${Z.toFixed(3)}) + 360 px`,note:'Diagram is schematic; the point marker clips to the viewport. Numeric projection remains unclipped.'};}
      case 'distortion':return {values:[['k₁',((A-50)/170).toFixed(4)],['Normalized radius scale',(.6+B/270).toFixed(3)]],eq:'x_d = x(1 + k₁r²); y_d = y(1 + k₁r²)',note:'Only first-order radial distortion is modeled; tangential distortion is excluded.'};
      case 'epipolar':return {values:[['Left point height',`${(80+A*1.7).toFixed(1)} display px`],['Line slope',(((B-50)*.18)/16).toFixed(4)]],eq:'l₂ = Fx₁; x₂ᵀFx₁ = 0',note:'Schematic epipolar locus: the slope control is illustrative, not a calibrated camera baseline.'};
      case 'stereo':return {values:[['Disparity',`${5+Math.round(A/3)} px`],['Repetition period',`${9+Math.round(B/4)} px`]],eq:'d = uL − uR; periodic matches recur at d ± kT',note:'Rectified synthetic rows; occlusion and photometric changes are omitted.'};
      case 'depth':{const Z=1+A/12,s=.05+B*.01,d=84/Z,u=Z*Z*s/84;return {controlValues:[`${Z.toFixed(3)} m`,`${s.toFixed(3)} px`],values:[['Depth Z',`${Z.toFixed(3)} m`],['Disparity d',`${d.toFixed(3)} px`],['σd',`${s.toFixed(3)} px`],['σZ',`${(u*100).toFixed(3)} cm`]],eq:`d = fB/Z = 84/${Z.toFixed(3)}; σZ ≈ Z²σd/(fB) = ${u.toFixed(5)} m`,note:'f = 700 px, B = 0.12 m. First-order independent disparity noise; calibration uncertainty excluded.'};}
      case 'triangulate':return {values:[['True depth',`${(1+A/14).toFixed(3)} m`],['Ray mismatch',`${Math.abs((B-50)/6).toFixed(3)} display px`]],eq:'X̂ = argminX Σ ||xᵢ − π(PᵢX)||²',note:'Schematic mismatched rays; this diagram does not run a nonlinear triangulation solver.'};
      case 'flow':return {values:[['Horizontal flow',`${((A-50)*2.1).toFixed(2)} px/frame`],['Vertical flow',`${((B-50)*1.9).toFixed(2)} px/frame`]],eq:'Iₓu + Iᵧv + Iₜ = 0',note:'Displaced patches illustrate pixel motion. Brightness derivatives are not estimated here.'};
      case 'scale':return {values:[['Scene scale',`${(.3+A/25).toFixed(2)} ×`],['Motion parameter',((B+10)/13).toFixed(3)]],eq:'π(sX, st) = π(X, t), s > 0',note:'The ray diagram is illustrative; the unchanged projection relation requires jointly scaling scene and translation.'};
      case 'pose':{const tx=(A-50)/30,Z=2+B/21;return {values:[['Camera tₓ',`${tx.toFixed(3)} m`],['Landmark Z',`${Z.toFixed(3)} m`],['Δu',`${(-650*tx/Z).toFixed(2)} px`]],eq:`Δu = −fₓtₓ/Z = −650·(${tx.toFixed(3)})/${Z.toFixed(3)} px`,note:'Translation-only pinhole example; a full six-degree-of-freedom pose solver is outside this experiment.'};}
      case 'optimizer':{const alpha=.02+A*.005,start=(B-50)/9+2.5;let t=start;for(let n=0;n<10;n++)t-=alpha*1.6*(t-3);return {values:[['Learning rate α',alpha.toFixed(3)],['Initial θ',start.toFixed(3)],['θ after 10 steps',t.toFixed(6)],['Final loss',(.8*(t-3)**2).toFixed(6)]],eq:'L(θ) = 0.8(θ−3)²; θₖ₊₁ = θₖ − 1.6α(θₖ−3)',note:'A deterministic convex scalar objective. Curve height clips for display.'};}
      case 'trajectory':return {values:[['Bias per step',`${((A-50)*.003).toFixed(3)} illustrative units`],['Jitter scale',`${(B*.07).toFixed(2)} display units`]],eq:'eᵢ = t̂ᵢ − tᵢ; ATE = √mean(||eᵢ||²)',note:'Synthetic deterministic trajectory. No metric ATE or frame alignment is computed by this schematic.'};
      case 'backprop':{const x=.5+A/30,w=.3+B/30,y=x*w*1.7,g=(y-10)*1.7*x;return {values:[['Input x',x.toFixed(4)],['Weight w₁',w.toFixed(4)],['Prediction ŷ',y.toFixed(4)],['∂L/∂w₁',g.toFixed(4)]],eq:'L = ½(ŷ−10)²; ∂L/∂w₁ = (ŷ−10)·1.7·x (w₁x > 0)',note:'Scalar two-layer network with ReLU and fixed w₂ = 1.7. All inputs here lie in the active ReLU region.'};}
      case 'cnn':return {values:[['Kernel gain',(.15+A/70).toFixed(4)],['Edge position',`${(90+B*4.4).toFixed(1)} display px`]],eq:'Y = σ(K ⋆ X + b)',note:'The response curve is a schematic edge-like Gaussian bump, not the result of a learned convolution.'};
      case 'resnet':{const f=(A-50)/90,n=1+Math.round(B/10);return {values:[['F′',f.toFixed(4)],['Depth',String(n)],['Plain |F′|ᴺ',Math.abs(f)**n+''],['Residual |1+F′|ᴺ',(Math.abs(1+f)**n).toFixed(4)]],eq:'dy/dx = 1 + F′(x)',note:'Local scalar Jacobian chain; not a universal guarantee of stable network gradients.'};}
      case 'generalization':return {values:[['Model capacity',(.2+A/10).toFixed(2)],['Sample scale',String(15+B)]],eq:'R(θ) = Etest[ℓ(fθ(x), y)]; Ltotal = Ltrain + λ||θ||²',note:'Conceptual curves, not fitted experimental data. Capacity and sample size are illustrative scales.'};
      case 'iou':{const dx=(A-50)*2.1,dy=(B-50)*1.4,inter=Math.max(0,240-Math.abs(dx))*Math.max(0,170-Math.abs(dy)),iou=inter/(81600-inter);return {values:[['Δx',`${dx.toFixed(2)} px`],['Δy',`${dy.toFixed(2)} px`],['Intersection',`${inter.toFixed(2)} px²`],['IoU',iou.toFixed(4)]],eq:'IoU = intersection / (A + B − intersection)',note:'Equal-sized axis-aligned boxes, 240 × 170 px. Pixel overlap does not establish 3D accuracy.'};}
      case 'attention':{const z=(A-50)/12,t=.25+B/30,e=Math.exp(Math.max(-25,Math.min(25,z/t))),p=e/(1+e);return {values:[['Δlogit',z.toFixed(4)],['Temperature',t.toFixed(4)],['Key 1 weight',(1-p).toFixed(5)],['Key 2 weight',p.toFixed(5)]],eq:'p₂ = exp(Δz/T) / (1 + exp(Δz/T))',note:'Two-key softmax, with numerical exponent clamped to [−25,25]. Attention weights are not correspondence proofs.'};}
      default:return {values:[],eq:COURSE[state.lastDay-1].eq,note:'Read the original experiment explanation for assumptions.'};
    }
  }
  function enhanceAdvancedLab(d){
    const card=$('advCanvas')?.closest('.card');if(!card||card.querySelector('.lab-readout'))return;
    const readout=document.createElement('div');readout.className='lab-readout';readout.setAttribute('aria-live','polite');
    const eq=document.createElement('div');eq.className='lab-equation';const caveat=document.createElement('p');caveat.className='lab-caveat';card.querySelector('.adv-controls').after(readout,eq,caveat);
    const update=()=>{const result=advancedMeasurements(ADVANCED[d].lab,Number($('advA').value),Number($('advB').value));readout.innerHTML=result.values.map(([label,value])=>`<div><small>${escape(label)}</small><b>${escape(value)}</b></div>`).join('');eq.textContent=result.eq;caveat.textContent=result.note;const values=result.values;$('advValA').textContent=result.controlValues?.[0]||values[0]?.[1]||$('advA').value;$('advValB').textContent=result.controlValues?.[1]||values[1]?.[1]||$('advB').value;};
    $('advA').addEventListener('input',update);$('advB').addEventListener('input',update);update();
  }

  // Restore validates before replacing anything. A malformed backup never destroys current work.
  function normalizeBackup(data){
    if(!data||data.app!=='Vision Theory Lab'||data.formatVersion!==1||!data.progress||typeof data.progress!=='object'||Array.isArray(data.progress))throw Error('Vision Theory Lab v1 backup биш байна.');
    const p=data.progress;
    const validateQuiz=(quiz,questions)=>Object.fromEntries(questions.flatMap((q,i)=>Number.isInteger(quiz?.[i])&&quiz[i]>=0&&quiz[i]<q.a.length?[[i,quiz[i]]]:[]));
    const filtered=(value,keys)=>Array.isArray(value)?keys.filter(k=>value.includes(k)):[];
    const advanced={};
    for(let d=3;d<=30;d++){const a=p.advanced?.[d];if(!a||typeof a!=='object'||Array.isArray(a))continue;advanced[d]={sections:filtered(a.sections,ADV_SECTIONS),notes:typeof a.notes==='string'?a.notes:'',quiz:Number.isInteger(a.quiz)&&a.quiz>=0&&a.quiz<ADVANCED[d].quiz.options.length?a.quiz:null,checked:!!a.checked};}
    const d2=p.day2&&typeof p.day2==='object'?p.day2:{};
    return {version:1,lastDay:Number.isInteger(p.lastDay)&&p.lastDay>=1&&p.lastDay<=30?p.lastDay:1,theme:p.theme==='light'?'light':'dark',sections:filtered(p.sections,SECTIONS),notes:typeof p.notes==='string'?p.notes:'',quiz:validateQuiz(p.quiz,QUESTIONS),quizChecked:!!p.quizChecked,day2:{sections:filtered(d2.sections,D2_SECTIONS),notes:typeof d2.notes==='string'?d2.notes:'',quiz:validateQuiz(d2.quiz,D2_QUIZ),quizChecked:!!d2.quizChecked},advanced,localization:LocalizationCourse.sanitize(p.localization),lastLearningNode:LocalizationCourse.validNode(p.lastLearningNode)?p.lastLearningNode:null};
  }
  // Replace the old import listener rather than registering two restore operations.
  const oldImport=$('importFile'),newImport=oldImport.cloneNode(true);oldImport.replaceWith(newImport);
  newImport.addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{if(file.size>1024*1024)throw Error('Backup 1 MB-аас их байна.');const next=normalizeBackup(JSON.parse(await file.text()));state=next;$('lessonNotes').value=state.notes;if(d2Initialized){$('d2Notes').value=state.day2.notes;d2QuizRender();}changeTheme();renderQuiz();if(state.lastLearningNode&&LocalizationCourse.find(state.lastLearningNode))openLearningNode(state.lastLearningNode);else showDay(state.lastDay);save();notify('Backup сэргээгдлээ.');}catch(error){notify('Backup сэргээхэд алдаа: '+error.message);}event.target.value='';});
  // Sanitize only malformed persisted advanced fields; valid v1 notes and progress retain their values.
  for(let d=3;d<=30;d++){const st=state.advanced?.[d];if(!st)continue;if(!Array.isArray(st.sections))st.sections=[];else st.sections=ADV_SECTIONS.filter(key=>st.sections.includes(key));if(typeof st.notes!=='string')st.notes='';}

  function closeDrawers(){const menuHadFocus=$('sidebar').contains(document.activeElement),outlineHadFocus=$('lessonOutline').contains(document.activeElement);$('sidebar').classList.remove('open');$('lessonOutline').classList.remove('open');$('navScrim').hidden=true;$('menuButton').setAttribute('aria-expanded',String(!matchMedia('(max-width:760px)').matches&&!document.body.classList.contains('nav-collapsed')));$('outlineToggle').setAttribute('aria-expanded',String(matchMedia('(min-width:1201px)').matches&&!document.body.classList.contains('outline-collapsed')));if(matchMedia('(max-width:760px)').matches&&menuHadFocus)$('menuButton').focus();else if(matchMedia('(max-width:1200px)').matches&&outlineHadFocus)$('outlineToggle').focus();}
  const oldMenu=$('menuButton'),newMenu=oldMenu.cloneNode(true);oldMenu.replaceWith(newMenu);
  newMenu.setAttribute('aria-controls','sidebar');
  newMenu.addEventListener('click',()=>{
    if(!matchMedia('(max-width:760px)').matches){const collapsed=document.body.classList.toggle('nav-collapsed');newMenu.setAttribute('aria-expanded',String(!collapsed));return;}
    const open=$('sidebar').classList.toggle('open');$('navScrim').hidden=!open;newMenu.setAttribute('aria-expanded',String(open));if(open)$('dashboardButton').focus();
  });
  $('closeSidebar').addEventListener('click',closeDrawers);$('navScrim').addEventListener('click',closeDrawers);
  $('outlineToggle').addEventListener('click',()=>{if(view==='dashboard'||view==='path'){notify('Outline харахын тулд хичээл нээнэ үү.');return;}if(matchMedia('(min-width:1201px)').matches){const collapsed=document.body.classList.toggle('outline-collapsed');$('outlineToggle').setAttribute('aria-expanded',String(!collapsed));return;}const open=$('lessonOutline').classList.toggle('open');$('navScrim').hidden=!open;$('outlineToggle').setAttribute('aria-expanded',String(open));if(open)$('outlineContent').querySelector('a')?.focus();});
  $('dashboardButton').addEventListener('click',showDashboard);$('localizationButton').addEventListener('click',showLocalizationPath);$('lessonSearch').addEventListener('input',nav);$('restoreBackup').addEventListener('click',()=>$('importFile').click());
  document.addEventListener('keydown',event=>{
    const editable=event.target.closest('input,textarea,select,[contenteditable]');
    if(event.key==='Escape'){closeDrawers();if(document.activeElement===$('lessonSearch')){$('lessonSearch').value='';nav();}return;}
    const drawer=$('sidebar').classList.contains('open')?$('sidebar'):$('lessonOutline').classList.contains('open')?$('lessonOutline'):null;
    if(event.key==='Tab'&&drawer){const focusable=Array.from(drawer.querySelectorAll('a,button,input,summary')).filter(el=>el.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}return;}
    if(editable)return;
    if(event.key==='/'&&!event.ctrlKey&&!event.metaKey){event.preventDefault();if(matchMedia('(max-width:760px)').matches){$('sidebar').classList.add('open');$('navScrim').hidden=false;$('menuButton').setAttribute('aria-expanded','true');}$('lessonSearch').focus();}
    if(event.altKey&&event.key==='ArrowRight'&&view==='lesson'&&state.lastDay<30){event.preventDefault();showDay(state.lastDay+1);}
    if(event.altKey&&event.key==='ArrowLeft'&&view==='lesson'&&state.lastDay>1){event.preventDefault();showDay(state.lastDay-1);}
  });
  let scrollPending=false;window.addEventListener('scroll',()=>{if(scrollPending||(view!=='lesson'&&view!=='studio'))return;scrollPending=true;requestAnimationFrame(()=>{const max=document.documentElement.scrollHeight-innerHeight;$('readingFill').style.width=(max>0?Math.min(100,scrollY/max*100):100)+'%';scrollPending=false;});},{passive:true});
  document.addEventListener('click',()=>{if(view==='lesson')updateOutlineProgress();});
  window.addEventListener('hashchange',()=>{const match=/^#day(\d+)$/.exec(location.hash);if(match)showDay(Number(match[1]));else if(location.hash==='#dashboard')showDashboard();else if(location.hash.startsWith('#cv-'))openPixelLab(location.hash.slice(4));else if(location.hash.startsWith('#geo-'))openGeometryLab(location.hash.slice(5));else if(location.hash==='#localization')showLocalizationPath();else if(location.hash.startsWith('#learn-'))openLearningNode(location.hash.slice(7));});
  function openPixelLab(id){
    const spec=CVLabs.specs.find(spec=>spec.id===id);if(!spec)return;
    showDay(spec.days[0]);CVLabs.open($('plannedLesson'),id);history.replaceState(null,'','#cv-'+id);
  }
  function openGeometryLab(id){
    const spec=GeometryLabs.specs.find(spec=>spec.id===id);if(!spec)return;
    showDay(spec.days[0]);GeometryLabs.open($('plannedLesson'),id);history.replaceState(null,'','#geo-'+id);
  }
  function openLearningNode(id){
    if(/^day\d+$/.test(id)){showDay(Number(id.slice(3)));return;}
    const unit=LocalizationCourse.find(id);if(!unit)return;
    studioUnit=id;setView('studio');for(const rootId of ['lesson1','lesson2','plannedLesson'])$(rootId).hidden=true;
    state.lastLearningNode=id;save();sectionObserver?.disconnect();history.replaceState(null,'','#learn-'+id);
    $('topbarDay').textContent='Localization / '+unit.code;document.title=unit.title+' · Vision Theory Lab';
    LocalizationCourse.render($('localizationLesson'),id,{open:openLearningNode,path:showLocalizationPath,change:()=>{renderStudioOutline();nav();}});
    GeometryLabs.mount($('localizationLesson'),{unit:id});
    renderStudioOutline();closeDrawers();nav();window.scrollTo({top:0,behavior:'instant'});const title=$('localizationLesson').querySelector('h1');title.tabIndex=-1;title.focus({preventScroll:true});
  }
  function renderLocalizationNavigation(query=''){
    let matches=0;
    $('localizationNav').innerHTML=['fundamentals','localization'].map(group=>{
      const units=LOCALIZATION_UNITS.filter(unit=>unit.group===group&&(!query||`${unit.code} ${unit.title} ${unit.subtitle} ${unit.objective} ${unit.theory.join(' ')}`.toLocaleLowerCase().includes(query)));
      matches+=units.length;
      if(!units.length)return '';
      return `<details class="module-nav studio-nav" open><summary><span>${group==='fundamentals'?'F':'L'}</span>${group==='fundamentals'?'Mathematical toolkit':'Sensor localization'}<small>${units.length}</small></summary>${units.map(unit=>`<button class="day-link ${view==='studio'&&studioUnit===unit.id?'active':''}" data-learning-node="${unit.id}" aria-current="${view==='studio'&&studioUnit===unit.id?'page':'false'}"><span class="day-num">${unit.code}</span><span class="day-label">${unit.title}</span><span class="day-state">${LocalizationCourse.isComplete(unit.id)?'✓':'○'}</span></button>`).join('')}</details>`;
    }).join('');
    $('localizationNav').querySelectorAll('[data-learning-node]').forEach(button=>button.addEventListener('click',()=>openLearningNode(button.dataset.learningNode)));
    return matches;
  }
  function renderPrerequisites(root,id){
    let box=root.querySelector('.lesson-prerequisites');if(!box){box=document.createElement('div');box.className='learning-connections lesson-prerequisites';root.querySelector('.hero')?.after(box);}
    const requires=LOCALIZATION_PREREQS[id]||[],enables=Object.entries(LOCALIZATION_PREREQS).filter(([,deps])=>deps.includes(id)).map(([next])=>next);
    box.innerHTML=`<strong>Understand these first</strong><div>${requires.map(node=>`<button class="prereq-chip ${LocalizationCourse.isComplete(node)?'done':''}" data-node="${node}">${LocalizationCourse.isComplete(node)?'✓':'○'} ${escape(LocalizationCourse.title(node))}</button>`).join('')}</div>${enables.length?`<small>This concept unlocks understanding of:</small><div>${enables.slice(0,4).map(node=>`<button class="prereq-chip next" data-node="${node}">→ ${escape(LocalizationCourse.title(node))}</button>`).join('')}</div>`:''}<small>Судалсан status нь зөвлөмжид ашиглагдана. Бүх хичээл нээлттэй хэвээр.</small>`;
    box.querySelectorAll('[data-node]').forEach(button=>button.addEventListener('click',()=>openLearningNode(button.dataset.node)));
  }
  function renderStudioOutline(){
    if(view!=='studio')return;
    const unit=LocalizationCourse.find(studioUnit),st=LocalizationCourse.get(studioUnit),sections=Array.from($('localizationLesson').querySelectorAll('.section[id]'));
    $('outlineContent').innerHTML=`<div class="outline-heading">ON THIS PAGE · ${unit.code}</div><nav class="outline-links">${sections.map((el,i)=>`<a href="#${el.id}" data-studio-anchor="${el.id}">${String(i+1).padStart(2,'0')} &nbsp; ${escape(el.querySelector('h2').textContent)}</a>`).join('')}</nav><div class="outline-box"><div class="outline-heading">UNDERSTANDING CHECK</div><p class="quiz-stat">${st.completed?'✓ Understood':st.checked?'Check reviewed; mark after both correct':'Concept + numerical check pending'}</p><button class="btn" id="studioOutlineNotes">✎ Lesson notes</button><button class="btn ghost" id="studioOutlineBackup">↓ Export all progress</button><button class="btn" id="studioOutlinePath">⌘ Localization path</button></div><div class="outline-box"><div class="outline-heading">GOVERNING RELATIONSHIP</div><div class="outline-formula" id="studioQuickEquation"></div></div>`;
    formula($('studioQuickEquation'),unit.tex);
    $('studioOutlineNotes').addEventListener('click',()=>{closeDrawers();$('studioNotes').scrollIntoView({block:'center'});$('studioNotes').focus({preventScroll:true});});$('studioOutlineBackup').addEventListener('click',exportBackup);$('studioOutlinePath').addEventListener('click',showLocalizationPath);
    $('outlineContent').querySelectorAll('[data-studio-anchor]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();document.getElementById(link.dataset.studioAnchor).scrollIntoView({block:'start'});closeDrawers();}));
    $('overallProgress').textContent=st.completed?'1 / 1':'0 / 1';$('progressSubject').textContent=unit.code+' understanding';$('progressFill').style.width=st.completed?'100%':'0%';
    sectionObserver?.disconnect();sectionObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){$('outlineContent').querySelectorAll('[data-studio-anchor]').forEach(a=>a.classList.toggle('active',a.dataset.studioAnchor===entry.target.id));}},{rootMargin:'-85px 0px -60% 0px'});sections.forEach(el=>sectionObserver.observe(el));
  }
  function routeNodes(){return LOCALIZATION_STAGES.flatMap(stage=>stage.nodes);}
  function recommendedNode(){const route=routeNodes();return route.find(node=>!LocalizationCourse.isComplete(node)&&LocalizationCourse.missing(node).length===0)||route.find(node=>!LocalizationCourse.isComplete(node))||'fast-livo2';}
  function renderLocalizationDashboard(){
    const count=LOCALIZATION_UNITS.filter(unit=>LocalizationCourse.isComplete(unit.id)).length;
    $('localizationDashboardCard').innerHTML=`<section class="localization-dashboard-card"><div><span class="eyebrow">YOUR TARGET / MULTI-SENSOR LOCALIZATION</span><h3>RGB + Depth + LiDAR + IMU → FAST-LIVO2</h3><p>6 mathematical foundations + 6 sensor-fusion studios. Өмнөх хичээлүүдтэй prerequisite холбоогоор суралцана.</p><small>${count}/12 new studios understood · Next: ${escape(LocalizationCourse.title(recommendedNode()))}</small></div><div class="tool-line"><button class="btn primary" id="openLocalizationPath">Open learning path →</button><button class="btn" id="startRecommendedNode">Next best lesson</button></div></section>`;
    $('openLocalizationPath').addEventListener('click',showLocalizationPath);$('startRecommendedNode').addEventListener('click',()=>openLearningNode(recommendedNode()));
  }
  function showLocalizationPath(){
    setView('path');for(const id of ['lesson1','lesson2','plannedLesson'])$(id).hidden=true;sectionObserver?.disconnect();closeDrawers();history.replaceState(null,'','#localization');document.title='Localization → FAST-LIVO2 · Vision Theory Lab';$('topbarDay').textContent='Localization learning path';$('readingFill').style.width='0';
    const nodes=routeNodes(),done=nodes.filter(LocalizationCourse.isComplete).length,focus=LocalizationCourse.validNode(preferences.pathFocus)?preferences.pathFocus:'fast-livo2',next=recommendedNode();
    $('localizationPath').innerHTML=`<section class="hero"><div class="eyebrow">GOAL-DRIVEN LEARNING PATH</div><h1>From fundamentals<br/>to <span style="color:var(--teal)">FAST-LIVO2.</span></h1><p class="lead">Таны зорилго: Computer Vision + RGB/Depth camera + LiDAR + IMU дээр тулгуурласан localization-ийг хэмжилт, математик, source code болон failure analysis-аар ойлгох.</p><div class="path-target-summary"><span>${done}/${nodes.length} path nodes studied</span><span>12 new visual studios + selected original lessons</span></div><div class="tool-line"><button class="btn primary" id="pathRecommended">Continue recommended: ${escape(LocalizationCourse.title(next))} →</button><a class="btn" href="docs/LOCALIZATION_PATH.html" target="_blank" rel="noopener">Read the course document</a></div></section>
      <section class="sensor-workflow"><div class="dashboard-section-heading"><h2>What each sensor contributes</h2><span>CLICK TO EXPLORE</span></div><div class="sensor-grid">${[['IMU','High-rate motion prior','imu'],['LiDAR','Metric geometry & map planes','lidar-residual'],['RGB camera','Direct image-patch residual','fast-livo2'],['Depth camera','Additional metric depth / validation','sensor-models']].map(([sensor,role,id])=>`<button class="sensor-role" data-path-open="${id}"><strong>${sensor}</strong><small>${role}</small><span>Explore →</span></button>`).join('')}</div><div class="pipeline-flow"><button data-path-open="deskew">Synchronize / deskew</button><span>→</span><button data-path-open="imu">IMU prior</button><span>→</span><button data-path-open="lidar-residual">LiDAR geometry</button><span>→</span><button data-path-open="fast-livo2">Visual update</button><span>→</span><button data-path-open="fusion">Shared state & uncertainty</button></div><p class="lab-caveat">Pipeline diagram нь conceptual dependencies. Official FAST-LIVO2 үндсэн inputs: camera + LiDAR + IMU. Depth camera нь mandatory fourth input биш. LiDAR/image events өөр өөр timestamps-тай.</p></section>
      <section class="dependency-explorer"><div class="dashboard-section-heading"><h2>“Энийг ойлгосон бол…”</h2><span>PREREQUISITES → CONCEPT → NEXT</span></div><label for="dependencyFocus">Explore a concept</label><select id="dependencyFocus">${[...LOCALIZATION_UNITS.map(u=>u.id),...COURSE.map(l=>'day'+l.d)].map(id=>`<option value="${id}" ${focus===id?'selected':''}>${escape(LocalizationCourse.title(id))}</option>`).join('')}</select><div id="dependencyGraph"></div></section>
      <div class="path-stage-grid">${LOCALIZATION_STAGES.map(stage=>`<section class="path-stage"><h2>${stage.title}</h2><p>${stage.goal}</p><div class="path-node-list">${stage.nodes.map(id=>{const missing=LocalizationCourse.missing(id);return `<button data-path-open="${id}" class="${LocalizationCourse.isComplete(id)?'complete':missing.length?'needs-prereq':'ready'}"><span>${LocalizationCourse.isComplete(id)?'✓':missing.length?'○':'→'}</span><div><strong>${escape(LocalizationCourse.title(id))}</strong><small>${LocalizationCourse.isComplete(id)?'Studied':missing.length?'Review first: '+escape(missing.map(LocalizationCourse.title).join(' · ')):'Prerequisites studied · ready to explore'}</small></div></button>`;}).join('')}</div></section>`).join('')}</div>
      <section class="lesson-summary"><h3>Final practical outcome</h3><p>Sensor frame/time diagram → calibration record → bag replay → residual and uncertainty diagnosis → ATE/RPE + application XYZ/yaw error + runtime + failure report.</p><p>Deep learning нь хэрэгтэй extension байж болно. FAST-LIVO2-ийн үндсэн estimation pipeline-ийг ойлгоход бүх CNN/attention хичээл mandatory prerequisite биш; өмнөх 30 хичээл хэвээр нээлттэй.</p><a href="${FAST_LIVO2_SOURCE}README.md" target="_blank" rel="noopener">Official repository</a> · <a href="https://arxiv.org/abs/2408.14035" target="_blank" rel="noopener">FAST-LIVO2 paper</a></section>`;
    $('pathRecommended').addEventListener('click',()=>openLearningNode(next));$('localizationPath').querySelectorAll('[data-path-open]').forEach(button=>button.addEventListener('click',()=>openLearningNode(button.dataset.pathOpen)));
    function updateGraph(){const id=$('dependencyFocus').value;preferences.pathFocus=id;savePreferences();const requires=LOCALIZATION_PREREQS[id]||[],enables=Object.entries(LOCALIZATION_PREREQS).filter(([,deps])=>deps.includes(id)).map(([next])=>next);$('dependencyGraph').innerHTML=`<div class="dependency-column"><small>UNDERSTAND FIRST</small>${requires.length?requires.map(n=>`<button data-graph-node="${n}">${LocalizationCourse.isComplete(n)?'✓':'○'} ${escape(LocalizationCourse.title(n))}</button>`).join(''):'<p>No earlier prerequisites.</p>'}</div><span class="dependency-arrow">→</span><button class="dependency-current" data-graph-node="${id}">${escape(LocalizationCourse.title(id))}<small>Open this lesson →</small></button><span class="dependency-arrow">→</span><div class="dependency-column"><small>THEN UNDERSTAND</small>${enables.length?enables.map(n=>`<button data-graph-node="${n}">${escape(LocalizationCourse.title(n))}</button>`).join(''):'<p>Apply and evaluate the complete pipeline.</p>'}</div>`;$('dependencyGraph').querySelectorAll('[data-graph-node]').forEach(button=>button.addEventListener('click',()=>openLearningNode(button.dataset.graphNode)));}
    $('dependencyFocus').addEventListener('change',updateGraph);updateGraph();$('overallProgress').textContent=done+' / '+nodes.length;$('progressSubject').textContent='Localization path';$('progressFill').style.width=done/nodes.length*100+'%';nav();window.scrollTo({top:0,behavior:'instant'});
  }

  renderQuiz();
  const initialHash=location.hash;
  const initialDay=/^#day(\d+)$/.exec(initialHash);
  if(initialHash.startsWith('#geo-')&&GeometryLabs.specs.some(spec=>spec.id===initialHash.slice(5)))openGeometryLab(initialHash.slice(5));
  else if(initialHash.startsWith('#cv-')&&CVLabs.specs.some(spec=>spec.id===initialHash.slice(4)))openPixelLab(initialHash.slice(4));
  else if(initialHash==='#localization')showLocalizationPath();
  else if(initialHash.startsWith('#learn-')&&LocalizationCourse.find(initialHash.slice(7)))openLearningNode(initialHash.slice(7));
  else if(initialDay&&Number(initialDay[1])>=1&&Number(initialDay[1])<=30)showDay(Number(initialDay[1]));
  else if(initialHash&&initialHash!=='#dashboard'){showDay(initialHash.startsWith('#d2-')?2:state.lastDay);document.getElementById(initialHash.slice(1))?.scrollIntoView({block:'start'});}
  else showDashboard();
  if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
