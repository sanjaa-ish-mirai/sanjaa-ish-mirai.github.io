/* Supplementary 3D geometry lessons. Stable original lesson IDs/state stay untouched. */
const GeometryLabs = (() => {
  const range=(key,label,min,max,value,step=1)=>({key,label,min,max,value,step});
  const specs=[
    {id:'projection',days:[9,10],units:['sensor-models'],short:'3D → camera → pixels',title:'Pinhole camera: ертөнцөөс pixel хүртэл',
      intro:'3D цэг, камерын байрлал, focal length-ийг өөрчил. World view дээр ray ба camera frustum-ийг эргүүлж хараад, sensor view дээр яг тэр цэгийн pixel-ийг шалга.',
      tex:String.raw`P_C=R_{CW}(P_W-C_W),\quad u=fX_C/Z_C+c_x,\quad v=fY_C/Z_C+c_y`,
      controls:[range('x','Point X / m',-2,2,.8,.1),range('y','Point Y / m',-1.5,1.5,-.4,.1),range('z','Point Z / m',-1,9,4,.1),range('f','Focal length f / px',160,600,320,10),range('cameraX','Camera center X / m',-1,1,0,.1),range('yaw','Camera yaw about +Y / °',-45,45,0)],
      steps:[['1 · World frame → camera frame','Камерын төв C-г world point-оос хасаад R_CW-ээр эргүүлнэ. Энд camera yaw нь +Y тэнхлэгийг тойрсон right-handed rotation; камерын +Z нь харах чиглэл. Камер баруун тийш шилжихэд хөдөлгөөнгүй цэг camera frame-д зүүн тийш шилжинэ.'],['2 · Similar triangles → perspective','Image plane-ийн coordinate X/Z харьцаанаас үүснэ. f нь pixel нэгжтэй, X,Y,Z нь метр: харьцааны метрүүд хасагдаж u,v нь pixel болно. Optical axis дээр u=cx, v=cy; Z хоёр дахин их болоход principal point-оосх зай хоёр дахин багасна.'],['3 · Visibility ба depth ≠ range','640×480 sensor, square pixels, cx=320, cy=240, distortion=0. Z≤0.05m near plane дээр projection-ийг тодорхойлохгүй; sensor-оос гадуурх point ч харагдахгүй. Z нь optical-axis depth, √(X²+Y²+Z²) нь radial range: off-axis цэг дээр эдгээр ижил биш.']],
      challenge:'Z=4 → 8m болгоод principal point-оосх pixel offset-ийг харьцуул. Дараа camera yaw-ийг өөрчлөөд world Z ба camera Z яагаад ялгаатай болсныг тайлбарла.',
      limitation:'Ideal pinhole model. No lens distortion, rolling shutter, occlusion, exposure or real RGB image. 3D view is an orthographic wireframe inspection tool; the sensor panel alone uses perspective projection.'},
    {id:'triangulation',days:[11,13,14],units:[],short:'Stereo rays & depth uncertainty',title:'Stereo triangulation: хоёр ray → 3D depth',
      intro:'Rectified stereo камерын хоёр ray яаж огтлолцож байгааг 3D дээр хар. Baseline, зай, right-pixel error өөрчлөхөд сэргээсэн цэг болон depth error хэрхэн өөрчлөгдөхийг шалга.',
      tex:String.raw`d=u_L-u_R,\quad \hat Z=fB/d,\quad \left|\partial Z/\partial d\right|=fB/d^2`,
      controls:[range('baseline','Baseline B / m',.1,1,.4,.05),range('z','True depth Z / m',2,12,4,.1),range('x','True point X / m',-1,1,.6,.1),range('y','True point Y / m',-.8,.8,-.2,.1),range('f','Focal length f / px',160,600,320,10),range('error','Added right-pixel error / px',-10,10,0,.25)],
      steps:[['1 · Two camera centers, one 3D point','Left center=(-B/2,0,0), right center=(B/2,0,0); orientation ба intrinsics ижил. Тэгвэл uL=f(X+B/2)/Z+cx, uR=f(X−B/2)/Z+cx. Хоёр зураг дээрх v ижил: энэ нь rectified horizontal epipolar line.'],['2 · Subtract to remove X','uL−uR=fB/Z тул Z=fB/d. Нэг camera-ийн ганц pixel depth-ийг тодорхойлохгүй; хоёр дахь ray scale өгдөг. Reconstruction: X=−B/2+(uL−cx)Z/f, Y=(v−cy)Z/f. Нэмсэн right-pixel error нь disparity-д эсрэг тэмдэгтэй орно.'],['3 · Sensitivity ба exact interval','Derivative |∂Z/∂d|=fB/d² нь local first-order sensitivity, m/px нэгжтэй. ±0.5px disparity interval-ийн exact depth bounds нь fB/(d+0.5), fB/(d−0.5). d≤0.5 бол upper depth bound хязгааргүй; энэ interval нь statistical confidence interval биш. d≤0 үед forward finite triangulation гаргахгүй.']],
      challenge:'Right-pixel error=1px байлгаад Z=4 → 8m болго. Дараа baseline-ийг хоёр дахин ихэсгэ. Аль нь depth uncertainty-г өсгөж, аль нь бууруулж байна вэ?',
      limitation:'Known synthetic correspondence; matching/occlusion is not solved here. Both pixels must be in the sensors for an observable measurement. Only horizontal right-pixel error is modeled, so valid rays intersect exactly; general noisy 3D rays may be skew.'},
    {id:'extrinsics',days:[8,10],units:['sensor-models','deskew','fast-livo2'],short:'LiDAR → RGB frame alignment',title:'LiDAR–camera: extrinsics ба timestamp alignment',
      intro:'Ижил 3D cloud-ийг RGB camera руу хувирга. Reference pixels ба таны calibration-аар тооцсон pixels-ийн зөрүүг 3D camera pose, 2D overlay, reprojection RMS-аар хамт хар.',
      tex:String.raw`P_C=R_{CL}P_L+t_{CL}+v\Delta t,\quad r_i=\pi(KP_{C,i})-u_i^{ref}`,
      controls:[range('yaw','LiDAR → camera yaw / °',-15,30,0),range('tx','Extrinsic tx / m',-.4,.8,0,.01),range('tz','Extrinsic tz / m',-.3,.5,0,.01),range('time','Timestamp error Δt / ms',-100,100,0,5),range('f','Focal length f / px',160,600,320,10)],
      steps:[['1 · Extrinsics map coordinates','R_CL ба t_CL нь LiDAR coordinate-ийг camera coordinate руу хувиргана. Энэ нь camera-ийн world pose-той ижил тоонууд биш: inverse camera center C_L=−R_CLᵀt_CL. Lab хоёр frame-ийг хоёул optical convention (+X right,+Y down,+Z forward) гэж тодорхойлсон; бодит LiDAR native axes-ийг эхлээд зөв хөрвүүлнэ.'],['2 · Project and compare real coordinates','Reference projection нь known synthetic truth (yaw=8°, tx=0.25m, ty=0.05m, tz=0.10m)-аас гарна. Orange projection нь таны parameters-оос гарна. RMS=√mean(Δu²+Δv²), pixel нэгжтэй; зөвхөн хоёр projection нь sensor доторх pairs-ийг тооцно.'],['3 · Time error can resemble translation','Энд relative point velocity +1m/s camera X чиглэлд гэж тогтоосон. Тиймээс +100ms зөрүү нь +0.10m coordinate error нэмнэ. Энэ бол constant-velocity timing example: бүрэн IMU integration/deskew биш. Ийм нэг хөдөлгөөн дээр tx ба Δt-ийн нөлөө ялгагдахгүй; varied motion ба timestamps хэрэгтэй.']],
      challenge:'Apply synthetic truth дарж RMS≈0 болго. Δt=100ms нэмээд overlay-г ажигла. tx=0.15m болгоход яагаад RMS дахин тэг болж болох вэ? Зөвхөн бага residual нь зөв calibration гэсэн баталгаа мөн үү?',
      limitation:'102 deterministic synthetic points, no occlusion/z-buffer or calibration optimizer. ty fixed at 0.05m. Known truth button copies ground truth; it does not estimate calibration. This studio explains frame/timing prerequisites for FAST-LIVO2, not its complete estimator.'}
  ];
  const fmt=(x,d=3)=>Number.isFinite(x)?Number(x.toFixed(d)).toString():'undefined';
  const colors=GeometryView.colors;
  function worldHTML(id){return `<div class="geo-world"><div class="geo-panel-title">WORLD VIEW <span>Drag / touch to orbit</span></div><canvas tabindex="0" role="img" aria-label="Interactive 3D scene: arrow keys orbit, Home resets view"></canvas><div class="geo-view-toolbar">${[['orbit','Orbit'],['front','Front'],['top','Top'],['side','Side']].map(([key,label])=>`<button class="btn" type="button" data-view-preset="${key}">${label}</button>`).join('')}</div><div class="geo-orbit-controls">${[['yaw','View yaw / °',-180,180,-28,1],['pitch','View pitch / °',-90,90,-20,1],['zoom','View zoom',.5,2,1,.1]].map(([key,label,min,max,value,step])=>`<label for="${id}-view-${key}">${label}<input id="${id}-view-${key}" data-orbit="${key}" type="range" min="${min}" max="${max}" value="${value}" step="${step}"/></label>`).join('')}</div><p data-view-status></p><p class="geo-hint">Arrow keys: orbit · Home: reset view · Grid: 1m. Viewer controls only change your viewpoint.</p></div>`;}
  function sensorHTML(key,label){return `<figure class="geo-sensor"><figcaption>${label}</figcaption><canvas data-sensor="${key}" width="640" height="480" role="img" aria-label="${label}"></canvas><p>u → 0…639px · v ↓ 0…479px · 640×480 sensor</p></figure>`;}
  function sensor(stage,key,marks,lines=[]){
    const canvas=stage.querySelector(`[data-sensor="${key}"]`),c=canvas.getContext('2d');
    c.fillStyle='#080d18';c.fillRect(0,0,640,480);c.strokeStyle='#1b2b40';c.lineWidth=1;
    for(let x=0;x<=640;x+=80){c.beginPath();c.moveTo(x,0);c.lineTo(x,480);c.stroke();}
    for(let y=0;y<=480;y+=80){c.beginPath();c.moveTo(0,y);c.lineTo(640,y);c.stroke();}
    c.setLineDash([8,6]);c.strokeStyle='#405573';c.beginPath();c.moveTo(320,0);c.lineTo(320,480);c.moveTo(0,240);c.lineTo(640,240);c.stroke();c.setLineDash([]);
    for(const line of lines){if(!line.a||!line.b)continue;c.strokeStyle=line.color||'#efb970';c.lineWidth=1.5;c.beginPath();c.moveTo(line.a.u,line.a.v);c.lineTo(line.b.u,line.b.v);c.stroke();}
    for(const mark of marks){if(!mark.pixel?.inside)continue;c.fillStyle=mark.color;c.beginPath();c.arc(mark.pixel.u,mark.pixel.v,mark.radius||5,0,2*Math.PI);c.fill();}
    c.fillStyle='#98a9c2';c.font='20px Inter, sans-serif';c.fillText('cx=320, cy=240',12,27);
  }
  function initialize(stage,spec){
    if(stage.dataset.ready)return;stage.dataset.ready='true';
    const p=Object.fromEntries(spec.controls.map(c=>[c.key,c.value])),domId=stage.closest('article').id;
    const images=spec.id==='triangulation'?sensorHTML('left','LEFT CAMERA · measured pixel')+sensorHTML('right','RIGHT CAMERA · truth + measured'):sensorHTML('main',spec.id==='projection'?'CAMERA IMAGE · perspective projection':'RGB OVERLAY · reference + prediction');
    stage.innerHTML=`<div class="geo-views">${worldHTML(domId)}<div class="geo-sensors">${images}</div></div><div class="geo-legend"><span style="--key:${colors.truth}">Known synthetic truth</span><span style="--key:${colors.estimate}">${spec.id==='projection'?'Image-plane intersection':'Your estimate / measurement'}</span><span style="--key:${colors.z}">Camera / X,Y,Z axes labeled</span></div><p class="geo-convention">Right-handed optical frames: +X right · +Y down · +Z forward. Positions / grid: m. Sensor coordinates: px.</p><div class="control-grid geo-controls">${spec.controls.map(c=>`<div class="control"><label for="${domId}-${c.key}">${c.label}<output id="${domId}-${c.key}-out"></output></label><input id="${domId}-${c.key}" type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}"/></div>`).join('')}</div><div class="tool-line"><button class="btn geo-reset" type="button">↺ Reset experiment & view</button>${spec.id==='extrinsics'?'<button class="btn primary" data-geo-truth type="button">Apply synthetic truth</button>':''}</div><div class="cv-metrics geo-metrics" aria-live="polite"></div><div class="geo-live-equation"></div><p class="geo-explanation" aria-live="polite"></p>`;
    const viewer=GeometryView.create(stage.querySelector('.geo-world'));
    const metrics=items=>stage.querySelector('.geo-metrics').innerHTML=items.map(([key,value])=>`<div><small>${key}</small><b>${value}</b></div>`).join('');
    function update(){
      for(const c of spec.controls){stage.querySelector(`#${domId}-${c.key}`).value=p[c.key];stage.querySelector(`#${domId}-${c.key}-out`).textContent=fmt(p[c.key]);}
      const scene={lines:[],points:[]};const origin={center:[0,0,0],yaw:0};
      const explanation=stage.querySelector('.geo-explanation'),equation=stage.querySelector('.geo-live-equation');
      if(spec.id==='projection'){
        const r=GeometryMath.projection(p);GeometryView.camera(scene,r.camera,p.f,'Camera');GeometryView.axes(scene,r.camera);
        const vertices=GeometryView.cube(scene,[0,0,4],1.5);
        scene.points.push({p:r.world,color:colors.truth,radius:6,label:'P world'});
        if(r.point[2]>.05){
          const plane=GeometryMath.toWorld(GeometryMath.scale(r.point,.8/r.point[2]),r.camera);
          scene.lines.push({a:r.camera.center,b:r.world,color:colors.truth,width:2},{a:r.camera.center,b:plane,color:colors.estimate,dash:true});
          scene.points.push({p:plane,color:colors.estimate,radius:4,label:'Image plane'});
        }
        sensor(stage,'main',[...vertices.map(v=>({pixel:GeometryMath.project(GeometryMath.toCamera(v,r.camera),p.f),color:'#629bff',radius:4})),{pixel:r.pixel,color:colors.truth,radius:8}]);
        const visibility=!r.pixel?'behind / near camera':r.pixel.inside?'inside sensor':'outside sensor';
        metrics([['Camera point (X,Y,Z) / m',r.point.map(v=>fmt(v)).join(', ')],['Pixel (u,v)',r.pixel?`${fmt(r.pixel.u)}, ${fmt(r.pixel.v)} px`:'undefined'],['Visibility',visibility],['Optical depth Z',fmt(r.point[2])+' m'],['Radial range ‖P_C‖',fmt(r.range)+' m'],['Horizontal field of view',fmt(r.fov,1)+'°']]);
        equation.textContent=r.pixel?`u = ${p.f} × ${fmt(r.point[0])} / ${fmt(r.point[2])} + 320 = ${fmt(r.pixel.u)} px; v = ${fmt(r.pixel.v)} px`:'Z_C ≤ 0.05m: no valid perspective division.';
        explanation.textContent=`${visibility==='inside sensor'?'Green point sensor дотор байна.':visibility==='outside sensor'?'Point нь camera-ийн урд боловч sensor-ийн гадна байна; image panel дээр зурахгүй.':'Point camera-ийн ард эсвэл near plane дотор байна: pixel тодорхойлохгүй.'} Blue vertices бол fixed 3D cube-ийн projections. Frustum нь sensor-ийн boundary rays; image plane-ийг 0.8m дээр зөвхөн үзүүлэнгийн зорилгоор зурсан, f нь pixel нэгжтэй.`;
      }else if(spec.id==='triangulation'){
        const r=GeometryMath.stereo(p),observed=r.a.inside&&r.measured.u>=0&&r.measured.u<640&&r.measured.v>=0&&r.measured.v<480;
        GeometryView.camera(scene,r.left,p.f,'Left',colors.z);GeometryView.camera(scene,r.right,p.f,'Right',colors.right);
        GeometryView.axes(scene,origin,.6);
        scene.lines.push({a:r.left.center,b:r.right.center,color:'#f0f5fc',width:3});
        scene.points.push({p:r.world,color:colors.truth,radius:6,label:'True point'});
        for(const camera of [r.left,r.right])scene.lines.push({a:camera.center,b:r.world,color:colors.truth,dash:true});
        if(r.estimate){
          // Very distant estimates can lie outside the inspection viewport, but are never clamped numerically.
          for(const camera of [r.left,r.right])scene.lines.push({a:camera.center,b:r.estimate,color:colors.estimate,width:2});
          scene.points.push({p:r.estimate,color:colors.estimate,radius:5,label:'Triangulated'});scene.lines.push({a:r.world,b:r.estimate,color:'#ff8c91',dash:true});
        }else{
          for(const [camera,pixel] of [[r.left,r.a],[r.right,r.measured]])scene.lines.push({a:camera.center,b:GeometryMath.toWorld([(pixel.u-320)*9/p.f,(pixel.v-240)*9/p.f,9],camera),color:colors.estimate,width:2});
        }
        const measured={...r.measured,inside:observed};
        sensor(stage,'left',[{pixel:r.a,color:colors.z,radius:8}],[{a:{u:0,v:r.a.v},b:{u:640,v:r.a.v},color:'#629bff'}]);
        sensor(stage,'right',[{pixel:r.b,color:colors.truth,radius:8},{pixel:measured,color:colors.estimate,radius:5}],[{a:{u:0,v:r.b.v},b:{u:640,v:r.b.v},color:'#b9a1ff'}]);
        const valid=observed&&r.estimate;
        metrics([['Disparity uL − uR',fmt(r.d)+' px'],['Triangulated Z',valid?fmt(r.depth)+' m':observed?'undefined · d ≤ 0':'unobservable · outside sensor'],['Known true Z',p.z+' m'],['Triangulated (X,Y,Z) / m',valid?r.estimate.map(v=>fmt(v)).join(', '):'undefined'],['3D error',valid?fmt(r.error)+' m':'undefined'],['Local depth sensitivity',valid?fmt(r.sensitivity)+' m/px':'undefined'],['±0.5px disparity depth interval',valid?`${fmt(r.interval[0])} … ${Number.isFinite(r.interval[1])?fmt(r.interval[1]):'∞'} m`:'undefined']]);
        equation.textContent=`d = ${fmt(r.a.u)} − ${fmt(r.measured.u)} = ${fmt(r.d)} px; `+(valid?`Z = ${p.f} × ${p.baseline} / ${fmt(r.d)} = ${fmt(r.depth)} m`:'no observable positive finite depth');
        explanation.textContent=!observed?'Correspondence sensor-оос гарсан: үргэлжилсэн geometric rays-ийг харуулж байгаа ч depth measurement-ийг итгэлтэй мэт харуулахгүй.':!r.estimate?'Disparity ≤ 0: parallel/diverging forward rays. Finite positive depth тодорхойлохгүй.':`Orange rays нь biased measurement-аас гарсан; green dashed rays нь known truth. ${r.depth>14?'Estimate нь одоогийн view-ийн гадна байж болно; zoom/view angle-аа өөрчил. ':''}Нэг pixel-ийн алдаа хол зайд илүү том метрийн алдаа болно. Blue/purple horizontal lines нь rectified epipolar rows.`;
      }else{
        const r=GeometryMath.extrinsics(p);GeometryView.axes(scene,origin);scene.points.push({p:[0,0,0],label:'LiDAR frame',color:'#f0f5fc',radius:4});
        scene.points.push(...r.points.map(point=>({p:point,color:colors.truth,radius:2})));
        GeometryView.camera(scene,r.truthCamera,p.f,'True RGB',colors.truth);GeometryView.camera(scene,r.camera,p.f,'Assumed RGB',colors.estimate);
        sensor(stage,'main',r.matches.flatMap(m=>[{pixel:m.reference,color:colors.truth,radius:5},{pixel:m.predicted,color:colors.estimate,radius:3}]),r.matches.filter(m=>m.valid).map(m=>({a:m.reference,b:m.predicted,color:'#735e40'})));
        metrics([['Reprojection RMS',r.rms===null?'undefined':fmt(r.rms)+' px'],['Visible reference/prediction pairs',`${r.count} / ${r.points.length}`],['Assumed camera center / m',r.camera.center.map(v=>fmt(v)).join(', ')],['Known calibration yaw',GeometryMath.calibration.yaw+'°'],['Timing displacement (+X)',fmt(p.time/1000)+' m'],['Effective tx + vΔt',fmt(r.translation[0])+' m']]);
        equation.textContent=`P_C = R_y(${p.yaw}°) P_L + [${fmt(r.translation[0])}, 0.05, ${p.tz}] m; Δt=${p.time}ms; v=+1m/s (camera X)`;
        explanation.textContent=r.rms===null?'No common visible pairs: RMS тодорхойлохгүй.':r.rms<1e-7?'Reference ба predicted pixels давхцаж байна. Энэ synthetic scene дээр бага residual гарлаа; constant velocity үед tx/Δt-ийн ambiguity байж болох тул бүх calibration зөв гэсэн баталгаа биш.':'Orange pixels нь таны calibration/timing-аар тооцсон projections; green нь known synthetic reference. Frame transform өөрчлөхөд assumed camera pose нь inverse transform-аар хөдөлнө. Apply synthetic truth нь known values-ийг хуулна; calibration solve хийхгүй.';
      }
      viewer.draw(scene);
    }
    stage.querySelectorAll('.geo-controls input').forEach(input=>input.addEventListener('input',()=>{const key=spec.controls.find(c=>input.id===`${domId}-${c.key}`).key;p[key]=Number(input.value);update();}));
    stage.querySelector('.geo-reset').addEventListener('click',()=>{spec.controls.forEach(c=>p[c.key]=c.value);viewer.reset();update();});
    stage.querySelector('[data-geo-truth]')?.addEventListener('click',()=>{Object.assign(p,{yaw:8,tx:.25,tz:.1,time:0});update();});
    update();
  }
  function mount(root,{day,unit}={}){
    const applicable=specs.filter(s=>s.days.includes(day)||s.units.includes(unit));
    const host=root.querySelector(day?'#adv-lab':'#studio-lab');if(!host||!applicable.length||host.querySelector('.geo-extension'))return;
    const section=document.createElement('div');section.className='geo-extension';section.innerHTML='<div class="cv-collection-heading"><span class="section-num">SPATIAL UNDERSTANDING · 3D GEOMETRY TOOLS</span><h3>3D-ээр хар. Pixel-ээр шалга.</h3><p>View angle, sensor geometry, numerical measurement гурвыг холбож ойлго.</p></div>';
    for(const spec of applicable){
      const article=document.createElement('article');article.id=(unit?'studio-':'')+'geo-'+spec.id;article.dataset.geoLab=spec.id;article.className='cv-experiment geo-experiment';
      article.innerHTML=`<h3>${spec.title}</h3><p>${spec.intro}</p><details class="cv-lab-disclosure geo-disclosure"><summary>Open interactive 3D laboratory <span>→</span></summary><div class="geo-stage"></div></details><div class="cv-equation geo-equation"></div><div class="geo-theory">${spec.steps.map(([title,text])=>`<details><summary>${title}</summary><p>${text}</p></details>`).join('')}</div><div class="callout"><strong>Predict → experiment → explain</strong><p>${spec.challenge}</p></div><details class="cv-model-notes"><summary>Model, units & limitations</summary><p>${spec.limitation}</p></details>`;
      katex.render(spec.tex,article.querySelector('.geo-equation'),{displayMode:true,throwOnError:false,trust:false});
      const disclosure=article.querySelector('.geo-disclosure');disclosure.addEventListener('toggle',()=>{if(disclosure.open)initialize(article.querySelector('.geo-stage'),spec);});section.append(article);
    }
    host.append(section);
  }
  function open(root,id){
    const article=root.querySelector(`[data-geo-lab="${id}"]`),spec=specs.find(s=>s.id===id);if(!article||!spec)return;
    article.querySelector('.geo-disclosure').open=true;initialize(article.querySelector('.geo-stage'),spec);article.scrollIntoView({block:'start'});
    const title=article.querySelector('h3');title.tabIndex=-1;title.focus({preventScroll:true});
  }
  function dashboard(root,openLab){
    const section=document.createElement('section');section.className='cv-catalog geo-catalog';
    section.innerHTML=`<span class="eyebrow">3D GEOMETRY · FROM RAYS TO SENSOR FUSION</span><h3>See the geometry behind the image.</h3><p>3D scene-ийг эргүүлж харьцуул. Camera projection → stereo depth → LiDAR/RGB alignment. Хичээл бүрд онол, live тооцоо ба failure cases бий.</p><div class="cv-catalog-grid">${specs.map(s=>`<button type="button" data-geo-open="${s.id}"><small>DAY ${String(s.days[0]).padStart(2,'0')} · ORBITABLE 3D</small><strong>${s.short}</strong><span>Open 3D lab →</span></button>`).join('')}</div>`;
    root.append(section);section.querySelectorAll('[data-geo-open]').forEach(button=>button.addEventListener('click',()=>openLab(button.dataset.geoOpen)));
  }
  return {specs,mount,open,dashboard};
})();
