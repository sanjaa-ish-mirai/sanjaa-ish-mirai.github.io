/* Metric geometry shared by the 3D inspection tools and their numerical tests.
   All teaching frames are right-handed optical frames: +X right, +Y down, +Z forward.
   This explicit convention is not a claim about any physical LiDAR's native axes. */
const GeometryMath = (() => {
  const K = {width:640,height:480,cx:320,cy:240};
  const add=(a,b)=>a.map((v,i)=>v+b[i]);
  const sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const scale=(a,s)=>a.map(v=>v*s);
  const norm=a=>Math.hypot(...a);
  function rotateY(p,degrees){
    const a=degrees*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    return [c*p[0]+s*p[2],p[1],-s*p[0]+c*p[2]];
  }
  const toCamera=(p,camera)=>rotateY(sub(p,camera.center),-camera.yaw);
  const toWorld=(p,camera)=>add(rotateY(p,camera.yaw),camera.center);
  function project(p,f){
    if(p[2]<=.05)return null; // Defined teaching near plane; never divide by zero/negative depth.
    const u=f*p[0]/p[2]+K.cx,v=f*p[1]/p[2]+K.cy;
    return {u,v,inside:u>=0&&u<K.width&&v>=0&&v<K.height};
  }
  function projection(p){
    const camera={center:[p.cameraX,0,0],yaw:p.yaw},world=[p.x,p.y,p.z];
    const point=toCamera(world,camera);
    return {camera,world,point,pixel:project(point,p.f),range:norm(point),fov:2*Math.atan(K.width/(2*p.f))*180/Math.PI};
  }
  function stereo(p){
    const left={center:[-p.baseline/2,0,0],yaw:0},right={center:[p.baseline/2,0,0],yaw:0},world=[p.x,p.y,p.z];
    const a=project(toCamera(world,left),p.f),b=project(toCamera(world,right),p.f);
    const measured={u:b.u+p.error,v:b.v},d=a.u-measured.u,valid=d>1e-8;
    const depth=valid?p.f*p.baseline/d:null;
    const estimate=valid?[-p.baseline/2+(a.u-K.cx)*depth/p.f,(a.v-K.cy)*depth/p.f,depth]:null;
    // A ±0.5px disparity interval, not a probabilistic confidence interval.
    const interval=valid?[p.f*p.baseline/(d+.5),d>.5?p.f*p.baseline/(d-.5):Infinity]:null;
    return {left,right,world,a,b,measured,d,depth,estimate,interval,
      sensitivity:valid?p.f*p.baseline/(d*d):null,error:estimate?norm(sub(estimate,world)):null};
  }
  const calibration={yaw:8,tx:.25,ty:.05,tz:.1};
  const transform=(point,yaw,t)=>add(rotateY(point,yaw),t);
  function inverseCamera(yaw,t){return {center:rotateY(scale(t,-1),-yaw),yaw:-yaw};}
  function lidarScene(){
    const points=[];
    for(let row=-3;row<=3;row++)for(let col=-5;col<=5;col++)points.push([col*.28,row*.24,5]);
    for(let row=-2;row<=2;row++)for(let col=-2;col<=2;col++)points.push([col*.2-.7,row*.2,3]);
    return points;
  }
  function extrinsics(p){
    const truthT=[calibration.tx,calibration.ty,calibration.tz];
    // Known illustrative lateral relative point velocity +1m/s in camera coordinates.
    const t=[p.tx+p.time/1000,calibration.ty,p.tz],points=lidarScene();
    const matches=points.map(point=>{
      const reference=project(transform(point,calibration.yaw,truthT),p.f);
      const predicted=project(transform(point,p.yaw,t),p.f);
      const valid=reference?.inside&&predicted?.inside;
      return {point,reference,predicted,valid,residual:valid?Math.hypot(reference.u-predicted.u,reference.v-predicted.v):null};
    });
    const valid=matches.filter(m=>m.valid),rms=valid.length?Math.sqrt(valid.reduce((s,m)=>s+m.residual**2,0)/valid.length):null;
    return {points,matches,rms,count:valid.length,truthCamera:inverseCamera(calibration.yaw,truthT),camera:inverseCamera(p.yaw,t),translation:t};
  }
  return {K,add,sub,scale,norm,rotateY,toCamera,toWorld,project,projection,stereo,calibration,transform,inverseCamera,lidarScene,extrinsics};
})();
