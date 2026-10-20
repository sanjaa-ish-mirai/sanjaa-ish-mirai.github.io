/* Small CPU wireframe renderer: genuine orbitable 3D, orthographic inspection.
   Sensor images use GeometryMath's perspective projection independently.
   No animation loop, WebGL, network dependency or hidden pose/state mutation. */
const GeometryView = (() => {
  const colors={x:'#ff8c91',y:'#27d3c3',z:'#629bff',truth:'#27d3c3',estimate:'#efb970',right:'#b9a1ff'};
  const initial={yaw:-28,pitch:-20,zoom:1};
  const viewers=new WeakMap();
  const observer=new ResizeObserver(entries=>{
    for(const {target} of entries){if(!target.isConnected)observer.unobserve(target);else viewers.get(target)?.render();}
  });
  function create(host){
    const canvas=host.querySelector('canvas'),context=canvas.getContext('2d');
    const view={...initial};let scene={lines:[],points:[]},drag=null;
    function project(point,w,h){
      const p=GeometryMath.sub(point,[0,0,3.3]),a=view.yaw*Math.PI/180,b=view.pitch*Math.PI/180;
      const x=Math.cos(a)*p[0]-Math.sin(a)*p[2],z=Math.sin(a)*p[0]+Math.cos(a)*p[2];
      const y=Math.cos(b)*p[1]-Math.sin(b)*z,depth=Math.sin(b)*p[1]+Math.cos(b)*z;
      const s=Math.min(w/9.8,h/8)*view.zoom;
      return {x:w/2+x*s,y:h/2+y*s,depth};
    }
    function render(){
      const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
      const w=rect.width,h=rect.height,dpr=Math.min(devicePixelRatio||1,2);
      canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);context.setTransform(dpr,0,0,dpr,0,0);
      context.fillStyle='#080d18';context.fillRect(0,0,w,h);
      const grid=[];
      for(let i=-4;i<=4;i++)grid.push({a:[i,1.5,0],b:[i,1.5,9]});
      for(let i=0;i<=9;i++)grid.push({a:[-4,1.5,i],b:[4,1.5,i]});
      for(const line of [...grid,...scene.lines]){
        const a=project(line.a,w,h),b=project(line.b,w,h);context.beginPath();context.moveTo(a.x,a.y);context.lineTo(b.x,b.y);
        context.strokeStyle=line.color||'#1b2b40';context.lineWidth=line.width||1;context.setLineDash(line.dash?[5,4]:[]);context.stroke();
      }
      context.setLineDash([]);context.font='11px Inter, sans-serif';
      const points=scene.points.map(point=>({...point,screen:project(point.p,w,h)})).sort((a,b)=>b.screen.depth-a.screen.depth);
      const labels=[];
      for(const point of points){
        const q=point.screen;context.fillStyle=point.color||colors.truth;context.beginPath();context.arc(q.x,q.y,point.radius||3,0,2*Math.PI);context.fill();
        if(point.label&&q.x>0&&q.x<w&&q.y>25&&q.y<h){
          const width=context.measureText(point.label).width;
          // Keep nearby frame/camera labels readable, including coincident stereo rays.
          const candidates=[];
          for(const offset of [0,16,32,48])for(const side of [1,-1])for(const up of [-1,1]){
            const x=Math.max(6,Math.min(w-width-6,q.x+(side===1?8+offset:-width-8-offset)));
            const y=Math.max(34,Math.min(h-10,q.y+up*(8+offset))),box={x,y:y-12,w:width,h:15};
            const overlap=labels.reduce((sum,b)=>sum+Math.max(0,Math.min(box.x+box.w,b.x+b.w)-Math.max(box.x,b.x))*Math.max(0,Math.min(box.y+box.h,b.y+b.h)-Math.max(box.y,b.y)),0);
            candidates.push({x,y,box,score:overlap*100+offset});
          }
          const label=candidates.sort((a,b)=>a.score-b.score)[0];labels.push(label.box);
          context.strokeStyle='#405573';context.lineWidth=.7;context.beginPath();context.moveTo(q.x,q.y);context.lineTo(Math.max(label.x,Math.min(label.x+width,q.x)),label.y-4);context.stroke();
          context.fillStyle='#080d18';context.fillRect(label.x-2,label.y-12,width+4,15);context.fillStyle='#f0f5fc';context.fillText(point.label,label.x,label.y);
        }
      }
      context.fillStyle='#98a9c2';context.font='10px Inter, sans-serif';context.fillText('3D · orthographic · grid 1 m',10,18);
      host.querySelector('[data-view-status]').textContent=`Yaw ${Math.round(view.yaw)}° · pitch ${Math.round(view.pitch)}° · ${view.zoom.toFixed(1)}×`;
      for(const key of ['yaw','pitch','zoom'])host.querySelector(`[data-orbit="${key}"]`).value=view[key];
    }
    function set(preset){Object.assign(view,preset);render();}
    host.querySelectorAll('[data-view-preset]').forEach(button=>button.addEventListener('click',()=>{
      const presets={orbit:initial,front:{yaw:0,pitch:0,zoom:1},top:{yaw:0,pitch:-90,zoom:1},side:{yaw:90,pitch:0,zoom:1}};
      set(presets[button.dataset.viewPreset]);
    }));
    host.querySelectorAll('[data-orbit]').forEach(input=>input.addEventListener('input',()=>{view[input.dataset.orbit]=Number(input.value);render();}));
    canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;canvas.focus({preventScroll:true});drag={x:event.clientX,y:event.clientY,yaw:view.yaw,pitch:view.pitch};canvas.setPointerCapture(event.pointerId);});
    canvas.addEventListener('pointermove',event=>{
      if(!drag)return;
      const yaw=drag.yaw+(event.clientX-drag.x)*.45;view.yaw=((yaw+180)%360+360)%360-180;
      view.pitch=Math.max(-90,Math.min(90,drag.pitch+(event.clientY-drag.y)*.45));render();
    });
    canvas.addEventListener('pointerup',()=>{drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;});canvas.addEventListener('lostpointercapture',()=>{drag=null;});
    canvas.addEventListener('keydown',event=>{
      const arrows={ArrowLeft:['yaw',-5],ArrowRight:['yaw',5],ArrowUp:['pitch',-5],ArrowDown:['pitch',5]};
      if(event.key==='Home'){event.preventDefault();set(initial);return;}
      if(!arrows[event.key])return;event.preventDefault();const [key,delta]=arrows[event.key];view[key]=Math.max(key==='yaw'?-180:-90,Math.min(key==='yaw'?180:90,view[key]+delta));render();
    });
    const api={render,draw:value=>{scene=value;render();},reset:()=>set(initial)};
    viewers.set(canvas,api);observer.observe(canvas);return api;
  }
  function axes(scene,camera,length=.8){
    const origin=camera.center;
    [[length,0,0],[0,length,0],[0,0,length]].forEach((p,i)=>{
      const end=GeometryMath.toWorld(p,camera),key=['x','y','z'][i];scene.lines.push({a:origin,b:end,color:colors[key],width:2});scene.points.push({p:end,color:colors[key],radius:2,label:key.toUpperCase()});
    });
  }
  function camera(scene,pose,f,label,color=colors.z){
    const k=GeometryMath.K,depth=.8;
    const corners=[[0,0],[k.width,0],[k.width,k.height],[0,k.height]].map(([u,v])=>GeometryMath.toWorld([(u-k.cx)*depth/f,(v-k.cy)*depth/f,depth],pose));
    for(let i=0;i<4;i++){scene.lines.push({a:pose.center,b:corners[i],color},{a:corners[i],b:corners[(i+1)%4],color});}
    scene.points.push({p:pose.center,color,radius:4,label});
  }
  function cube(scene,center,size=1,color='#405573'){
    const vertices=Array.from({length:8},(_,i)=>center.map((v,j)=>v+((i>>j)&1?1:-1)*size/2));
    for(let i=0;i<8;i++)for(let j=0;j<3;j++){const n=i^(1<<j);if(n>i)scene.lines.push({a:vertices[i],b:vertices[n],color});}
    scene.points.push(...vertices.map(p=>({p,color,radius:2})));return vertices;
  }
  return {create,axes,camera,cube,colors};
})();
