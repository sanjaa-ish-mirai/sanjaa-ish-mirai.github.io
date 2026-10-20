/* Deterministic output-contract lab; no neural inference is claimed or performed.
   IoU/NMS, rotation and mask membership are computed from explicit fixtures. */
const YOLO11Lab = (() => {
  const W=640,H=400,palette=['#27d3c3','#629bff','#efb970'];
  const silhouette=[[125,70],[132,54],[150,52],[162,67],[160,82],[155,90],[165,105],[165,155],[190,210],[180,218],[158,180],[158,230],[170,315],[153,320],[145,250],[136,320],[119,316],[130,230],[126,175],[106,220],[95,214],[121,152],[121,110],[135,88]];
  const joints=[[143,68],[137,64],[149,64],[130,69],[156,69],[127,106],[159,106],[111,158],[175,158],[101,214],[186,214],[134,216],[155,216],[130,266],[160,266],[126,315],[163,315]];
  const edges=[[0,1],[0,2],[1,3],[2,4],[5,6],[5,7],[7,9],[6,8],[8,10],[5,11],[6,12],[11,12],[11,13],[13,15],[12,14],[14,16]];
  function rotateRect(cx,cy,width,height,degrees){const t=degrees*Math.PI/180;return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>[cx+x*width/2*Math.cos(t)-y*height/2*Math.sin(t),cy+x*width/2*Math.sin(t)+y*height/2*Math.cos(t)]);}
  const bounds=poly=>[Math.min(...poly.map(p=>p[0])),Math.min(...poly.map(p=>p[1])),Math.max(...poly.map(p=>p[0])),Math.max(...poly.map(p=>p[1]))];
  function fixtures(angle=25){
    const car=rotateRect(460,278,148,70,angle),other=silhouette.map(([x,y])=>[x*.62+240,y*.62+62]);
    return [{id:'person-1',cls:0,name:'person',score:.93,polygon:silhouette,box:bounds(silhouette),keypoints:joints.map(([x,y],i)=>[x,y,i>12?.67:.94])},
      {id:'duplicate',cls:0,name:'person',score:.72,polygon:silhouette,box:bounds(silhouette).map(v=>v+8),keypoints:joints.map(([x,y])=>[x,y,.8])},
      {id:'car',cls:2,name:'car',score:.86,polygon:car,box:bounds(car)},
      {id:'person-2',cls:0,name:'person',score:.43,polygon:other,box:bounds(other),keypoints:joints.map(([x,y],i)=>[x*.62+240,y*.62+62,i>12?.61:.9])}];
  }
  function iou(a,b){const intersection=Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0]))*Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]));const area=p=>Math.max(0,p[2]-p[0])*Math.max(0,p[3]-p[1]);const union=area(a)+area(b)-intersection;return union?intersection/union:0;}
  function nms(candidates,confidence,threshold){
    const sorted=candidates.filter(p=>p.score>=confidence).sort((a,b)=>b.score-a.score),keep=[],rejected=[];
    for(const p of sorted){const winner=keep.find(q=>q.cls===p.cls&&iou(p.box,q.box)>threshold);if(winner)rejected.push({id:p.id,reason:'NMS',overlap:iou(p.box,winner.box)});else keep.push(p);}
    rejected.push(...candidates.filter(p=>p.score<confidence).map(p=>({id:p.id,reason:'confidence',overlap:null})));return {keep,rejected};
  }
  function inside(poly,x,y){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
  function compute(p){
    const all=fixtures(p.angle),candidates=all.filter(q=>p.task==='pose'?q.cls===0:p.task==='obb'?q.cls===2:true);
    const result=p.task==='classify'?{keep:[],rejected:[]}:p.task==='obb'?{keep:candidates.filter(q=>q.score>=p.conf),rejected:[]} :nms(candidates,p.conf,p.iou);
    return {...result,all,candidates,members:result.keep.filter(q=>inside(q.polygon,p.x+.5,p.y+.5)).map(q=>q.id)};
  }
  function path(context,poly){context.beginPath();poly.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y));context.closePath();}
  function inputScene(canvas,angle){
    const c=canvas.getContext('2d');c.fillStyle='#182b40';c.fillRect(0,0,W,H);c.fillStyle='#244256';c.fillRect(0,130,W,150);c.fillStyle='#26313e';c.fillRect(0,260,W,140);
    c.fillStyle='#3b596b';for(let i=0;i<6;i++){c.fillRect(i*110,65,80,170);c.fillStyle='#608498';c.fillRect(i*110+12,85,20,30);c.fillStyle='#3b596b';}
    c.strokeStyle='#8392a0';c.lineWidth=4;c.setLineDash([35,28]);c.beginPath();c.moveTo(0,355);c.lineTo(W,355);c.stroke();c.setLineDash([]);
    const a=fixtures(angle);for(const [i,obj] of [a[3],a[0],a[2]].entries()){c.fillStyle=['#a97855','#a4b9cc','#3d8baf'][i];path(c,obj.polygon);c.fill();}
    c.fillStyle='#163b54';path(c,rotateRect(460,278,80,43,angle));c.fill();c.fillStyle='#f0f5fc';c.font='16px Inter, sans-serif';c.fillText('SYNTHETIC STREET SCENE · 640 × 400',16,28);
  }
  function structured(p,r){
    const round=v=>Math.round(v*100)/100;
    if(p.task==='classify')return {synthetic:true,probs:{classes:['outdoor','indoor','other'],data:[.72,.20,.08],top1:0},boxes:null,masks:null,keypoints:null,obb:null};
    if(p.task==='obb')return {synthetic:true,obb:{xywhr:r.keep.map(()=>[460,278,148,70,p.angle*Math.PI/180]),xyxyxyxy:r.keep.map(q=>q.polygon.map(a=>a.map(round))),conf:r.keep.map(q=>q.score),cls:r.keep.map(()=>0)},names:{0:'illustrative vehicle'},note:'Synthetic category; official checkpoint class map must be read from result.names.'};
    const data={synthetic:true,orig_shape:[H,W],names:{0:'person',2:'car'},boxes:{xyxy:r.keep.map(q=>q.box.map(round)),conf:r.keep.map(q=>q.score),cls:r.keep.map(q=>q.cls)}};
    if(p.task==='segment')data.masks={xy:r.keep.map(q=>q.polygon.map(a=>a.map(round))),illustrative_raster_shape:[r.keep.length,H,W],note:'Real masks.data resolution can differ from original image; masks.xy is in original-image pixels.'};
    if(p.task==='pose')data.keypoints={xy:r.keep.map(q=>q.keypoints.map(a=>a.slice(0,2))),conf:r.keep.map(q=>q.keypoints.map(a=>a[2]))};
    return data;
  }
  function mount(root){
    root.innerHTML=`<div class="yolo-lab"><div class="yolo-task-switch" role="group" aria-label="YOLO11 output task">${YOLO11Data.tasks.map((t,i)=>`<button class="btn ${i?'':'primary'}" data-yolo-task="${t.id}" aria-pressed="${!i}">${t.id}</button>`).join('')}</div><div class="yolo-image-grid"><figure><figcaption>INPUT · original illustrated pixels</figcaption><canvas data-yolo-image="source" width="640" height="400" role="img" aria-label="Synthetic street scene, not model inference"></canvas></figure><figure><figcaption data-yolo-caption>OUTPUT · annotated copy</figcaption><canvas data-yolo-image="output" width="640" height="400" role="img" aria-label="Computed output overlays and mask inspector"></canvas></figure></div><p class="yolo-lab-status" aria-live="polite"></p><div class="control-grid yolo-controls"><div class="control"><label for="yoloConf">Instance confidence ≥ <output id="yoloConfOut"></output></label><input id="yoloConf" type="range" min="0" max="1" step="0.01" value="0.25"/></div><div class="control"><label for="yoloIou">Axis-aligned NMS IoU <output id="yoloIouOut"></output></label><input id="yoloIou" type="range" min="0" max="1" step="0.01" value="0.5"/></div><div class="control"><label for="yoloMaskMode">Segmentation rendering</label><select id="yoloMaskMode"><option value="overlay">Mask overlay</option><option value="foreground">Foreground cutout (transparent)</option><option value="binary">Binary union mask</option></select></div><div class="control"><label for="yoloAngle">Synthetic OBB rotation / ° <output id="yoloAngleOut"></output></label><input id="yoloAngle" type="range" min="0" max="89" step="1" value="25"/></div><div class="control"><label for="yoloJoint">Draw keypoints with conf ≥ <output id="yoloJointOut"></output></label><input id="yoloJoint" type="range" min="0" max="1" step="0.01" value="0.5"/></div><div class="control"><label for="yoloPixelX">Inspect pixel x / px <output id="yoloPixelXOut"></output></label><input id="yoloPixelX" type="range" min="0" max="639" value="145"/></div><div class="control"><label for="yoloPixelY">Inspect pixel y / px <output id="yoloPixelYOut"></output></label><input id="yoloPixelY" type="range" min="0" max="399" value="160"/></div></div><div class="tool-line"><button class="btn" data-yolo-reset>↺ Reset lab</button><button class="btn" data-yolo-json>Download illustrated output JSON</button><button class="btn" data-yolo-png>Download output PNG</button></div><div class="cv-metrics" data-yolo-metrics aria-live="polite"></div><details class="yolo-json"><summary>Inspect structured result (synthetic)</summary><pre data-yolo-result></pre></details><details><summary>Candidate rejection trace</summary><pre data-yolo-trace></pre></details></div>`;
    const defaults={task:'detect',conf:.25,iou:.5,mode:'overlay',angle:25,joint:.5,x:145,y:160};let p={...defaults},result;
    const source=root.querySelector('[data-yolo-image="source"]'),output=root.querySelector('[data-yolo-image="output"]');
    const controls={conf:'yoloConf',iou:'yoloIou',angle:'yoloAngle',joint:'yoloJoint',x:'yoloPixelX',y:'yoloPixelY'};
    function update(){
      result=compute(p);inputScene(source,p.angle);const c=output.getContext('2d');c.clearRect(0,0,W,H);
      for(const [key,id] of Object.entries(controls)){root.querySelector('#'+id).value=p[key];root.querySelector('#'+id+'Out').textContent=p[key];}
      root.querySelector('#yoloMaskMode').value=p.mode;
      root.querySelector('#yoloConf').disabled=p.task==='classify';root.querySelector('#yoloPixelX').disabled=p.task==='classify';root.querySelector('#yoloPixelY').disabled=p.task==='classify';root.querySelector('#yoloIou').disabled=['classify','obb'].includes(p.task);
      root.querySelector('#yoloAngle').disabled=p.task!=='obb';root.querySelector('#yoloJoint').disabled=p.task!=='pose';root.querySelector('#yoloMaskMode').disabled=p.task!=='segment';
      root.querySelectorAll('[data-yolo-task]').forEach(button=>{const active=button.dataset.yoloTask===p.task;button.classList.toggle('primary',active);button.setAttribute('aria-pressed',String(active));});
      const cutout=p.task==='segment'&&p.mode!=='overlay';
      if(!cutout)c.drawImage(source,0,0);
      if(p.task==='segment'&&p.mode==='foreground'){
        const mask=document.createElement('canvas');mask.width=W;mask.height=H;const alpha=mask.getContext('2d');alpha.fillStyle='#fff';for(const obj of result.keep){path(alpha,obj.polygon);alpha.fill();}c.drawImage(source,0,0);c.globalCompositeOperation='destination-in';c.drawImage(mask,0,0);c.globalCompositeOperation='source-over';
      }else if(p.task==='segment'&&p.mode==='binary'){
        c.fillStyle='#000';c.fillRect(0,0,W,H);c.fillStyle='#fff';for(const q of result.keep){path(c,q.polygon);c.fill();}
      }else if(p.task==='classify'){
        c.fillStyle='#080d18dd';c.fillRect(16,42,285,75);c.fillStyle='#27d3c3';c.font='21px Inter, sans-serif';c.fillText('outdoor 0.72',30,72);c.font='16px Inter, sans-serif';c.fillText('indoor 0.20 · other 0.08',30,101);
      }else{
        result.keep.forEach((q,i)=>{const color=palette[i%palette.length];c.strokeStyle=color;c.lineWidth=3;
          if(p.task==='segment'){c.fillStyle=color+'66';path(c,q.polygon);c.fill();c.stroke();}
          else if(p.task==='obb'){path(c,q.polygon);c.stroke();}
          else c.strokeRect(q.box[0],q.box[1],q.box[2]-q.box[0],q.box[3]-q.box[1]);
          if(p.task==='pose'){
            for(const [a,b] of edges){const x=q.keypoints[a],y=q.keypoints[b];if(x[2]>=p.joint&&y[2]>=p.joint){c.beginPath();c.moveTo(x[0],x[1]);c.lineTo(y[0],y[1]);c.stroke();}}
            c.fillStyle=color;for(const [x,y,confidence] of q.keypoints)if(confidence>=p.joint){c.beginPath();c.arc(x,y,4,0,Math.PI*2);c.fill();}
          }
          c.font='17px Inter, sans-serif';c.fillStyle='#080d18';c.fillRect(q.box[0],q.box[1]-24,132,23);c.fillStyle=color;c.fillText(`${q.name} ${q.score.toFixed(2)}`,q.box[0]+4,q.box[1]-7);
        });
      }
      // The inspector is displayed as an overlay only, never baked into downloaded cutouts.
      const visible=p.task==='classify'?'3 image-level scores':`${result.keep.length} instances`;
      root.querySelector('[data-yolo-caption]').textContent=`OUTPUT · ${cutout?p.mode:'annotated copy'} · ${visible}`;
      root.querySelector('[data-yolo-metrics]').innerHTML=[['Output',visible],['Inspected pixel',`${p.x}, ${p.y} px`],['Synthetic silhouette membership',p.task==='classify'?'not a classification output':result.members.join(', ')||'background'],['Rejected candidates',String(result.rejected.length)]].map(([a,b])=>`<div><small>${a}</small><b>${b}</b></div>`).join('');
      root.querySelector('[data-yolo-result]').textContent=JSON.stringify(structured(p,result),null,2);root.querySelector('[data-yolo-trace]').textContent=p.task==='classify'?'No boxes, confidence filtering or NMS in this classification illustration.':p.task==='obb'?'One synthetic OBB; rotated NMS is not simulated.':JSON.stringify(result.rejected,null,2);
      root.querySelector('.yolo-lab-status').textContent=`SYNTHETIC · ${YOLO11Data.tasks.find(t=>t.id===p.task).explain} ${p.task==='segment'?'Cutout transparency can be inspected/downloaded; source pixels remain unchanged.':''} Pixel membership is known fixture geometry, not a model prediction.`;
    }
    for(const [key,id] of Object.entries(controls))root.querySelector('#'+id).addEventListener('input',e=>{p[key]=Number(e.target.value);update();});
    root.querySelector('#yoloMaskMode').addEventListener('change',e=>{p.mode=e.target.value;update();});
    root.querySelectorAll('[data-yolo-task]').forEach(button=>button.addEventListener('click',()=>{p.task=button.dataset.yoloTask;update();}));
    output.addEventListener('click',event=>{const r=output.getBoundingClientRect();p.x=Math.max(0,Math.min(W-1,Math.floor((event.clientX-r.left)/r.width*W)));p.y=Math.max(0,Math.min(H-1,Math.floor((event.clientY-r.top)/r.height*H)));update();});
    root.querySelector('[data-yolo-reset]').addEventListener('click',()=>{p={...defaults};update();});
    function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    root.querySelector('[data-yolo-json]').addEventListener('click',()=>download(new Blob([JSON.stringify(structured(p,result),null,2)],{type:'application/json'}),`illustrated-${p.task}.json`));
    root.querySelector('[data-yolo-png]').addEventListener('click',()=>output.toBlob(blob=>{if(blob)download(blob,`illustrated-${p.task}.png`);}));update();
  }
  return {mount,fixtures,iou,nms,inside,rotateRect,compute,structured};
})();
