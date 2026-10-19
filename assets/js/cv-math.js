/* Pixel-domain CV teaching algorithms. Original numerical engines remain unchanged. */
const CVMath = (() => {
  const W = 64, H = 48;
  const clampValue = (v,lo,hi)=>Math.min(hi,Math.max(lo,v));
  const mean = values=>values.reduce((s,x)=>s+x,0)/values.length;
  function scene(mode,x,y,w=W,h=H) {
    if(mode==='flat')return 120;
    if(mode==='edge')return x>=w/2?215:40;
    if(mode==='corner')return x>=w/2&&y>=h/2?215:40;
    if(mode==='stripes')return 120+65*Math.cos(2*Math.PI*x/8);
    if(mode==='checker')return ((Math.floor(x/8)+Math.floor(y/8))%2)?210:45;
    return 120+35*Math.sin(.47*x+.31*y)+30*Math.cos(.25*x-.44*y)+25*Math.sin(.81*x+.19*y);
  }
  function image(mode,noise=0,w=W,h=H) {
    const random=rng(20261019),result=new Float64Array(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)result[y*w+x]=clampValue(scene(mode,x,y,w,h)+noise*gauss(random),0,255);
    return result;
  }
  function at(a,w,h,x,y){return a[clampValue(y,0,h-1)*w+clampValue(x,0,w-1)];}
  function sobel(a,w=W,h=H) {
    const gx=new Float64Array(w*h),gy=new Float64Array(w*h),magnitude=new Float64Array(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const X=(-at(a,w,h,x-1,y-1)+at(a,w,h,x+1,y-1)-2*at(a,w,h,x-1,y)+2*at(a,w,h,x+1,y)-at(a,w,h,x-1,y+1)+at(a,w,h,x+1,y+1))/8;
      const Y=(-at(a,w,h,x-1,y-1)-2*at(a,w,h,x,y-1)-at(a,w,h,x+1,y-1)+at(a,w,h,x-1,y+1)+2*at(a,w,h,x,y+1)+at(a,w,h,x+1,y+1))/8;
      const i=y*w+x;gx[i]=X;gy[i]=Y;magnitude[i]=Math.hypot(X,Y);
    }
    return {gx,gy,magnitude};
  }
  function edges(p) {
    const clean=image(p.scene,0),input=image(p.scene,p.noise),smoothed=gaussianBlur(input,W,H,p.sigma),gradient=sobel(smoothed),mask=Float64Array.from(gradient.magnitude,m=>m>=p.threshold?255:0);
    const rmse=a=>Math.sqrt(mean(Array.from(a,(v,i)=>(v-clean[i])**2)));
    return {input,smoothed,...gradient,mask,inputRMSE:rmse(input),filteredRMSE:rmse(smoothed),edgeCount:mask.filter(v=>v>0).length};
  }
  function eigen2(a,b,d) {
    const delta=Math.hypot(a-d,2*b);
    return {max:Math.max(0,(a+d+delta)/2),min:Math.max(0,(a+d-delta)/2),angle:.5*Math.atan2(2*b,a-d)};
  }
  function tensor(g,x,y,r,w=W,h=H) {
    let a=0,b=0,d=0,count=0;
    for(let j=y-r;j<=y+r;j++)for(let i=x-r;i<=x+r;i++){
      const ix=at(g.gx,w,h,i,j),iy=at(g.gy,w,h,i,j);a+=ix*ix;b+=ix*iy;d+=iy*iy;count++;
    }
    a/=count;b/=count;d/=count;
    const eigen=eigen2(a,b,d),response=a*d-b*b-.04*(a+d)**2;
    return {a,b,d,...eigen,response,classification:eigen.max<1?'FLAT':eigen.min/eigen.max<.02?'EDGE':'CORNER'};
  }
  function harris(p) {
    const input=image(p.scene,p.noise),smoothed=gaussianBlur(input,W,H,p.sigma),gradient=sobel(smoothed),response=new Float64Array(W*H);
    let maxR=0,minR=0;
    const r=p.radius;
    for(let y=r+1;y<H-r-1;y++)for(let x=r+1;x<W-r-1;x++){
      const R=tensor(gradient,x,y,r).response;response[y*W+x]=R;maxR=Math.max(maxR,R);minR=Math.min(minR,R);
    }
    const candidates=[];
    for(let y=r+2;y<H-r-2;y++)for(let x=r+2;x<W-r-2;x++){
      const R=response[y*W+x];if(R<=0||R<maxR*.01)continue;
      let peak=true;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if(response[(y+j)*W+x+i]>R)peak=false;
      if(peak)candidates.push({x,y,response:R});
    }
    candidates.sort((a,b)=>b.response-a.response);
    const corners=[];for(const c of candidates)if(corners.every(k=>Math.hypot(k.x-c.x,k.y-c.y)>r+1)&&corners.length<30)corners.push(c);
    return {input,smoothed,response,maxR,minR,corners,selected:tensor(gradient,p.x,p.y,r)};
  }
  const tables=new Map();
  function table(n){
    if(!tables.has(n)){const cos=new Float64Array(n*n),sin=new Float64Array(n*n);for(let k=0;k<n;k++)for(let x=0;x<n;x++){cos[k*n+x]=Math.cos(2*Math.PI*k*x/n);sin[k*n+x]=Math.sin(2*Math.PI*k*x/n);}tables.set(n,{cos,sin});}
    return tables.get(n);
  }
  function dft2(real,n,imaginary=null,inverse=false) {
    const inputIm=imaginary||new Float64Array(n*n),t=table(n),rowRe=new Float64Array(n*n),rowIm=new Float64Array(n*n),re=new Float64Array(n*n),im=new Float64Array(n*n),sign=inverse?1:-1,scale=inverse?1/n:1;
    for(let y=0;y<n;y++)for(let k=0;k<n;k++){
      let a=0,b=0;for(let x=0;x<n;x++){const c=t.cos[k*n+x],s=sign*t.sin[k*n+x],i=y*n+x;a+=real[i]*c-inputIm[i]*s;b+=real[i]*s+inputIm[i]*c;}rowRe[y*n+k]=a*scale;rowIm[y*n+k]=b*scale;
    }
    for(let x=0;x<n;x++)for(let k=0;k<n;k++){
      let a=0,b=0;for(let y=0;y<n;y++){const c=t.cos[k*n+y],s=sign*t.sin[k*n+y],i=y*n+x;a+=rowRe[i]*c-rowIm[i]*s;b+=rowRe[i]*s+rowIm[i]*c;}re[k*n+x]=a*scale;im[k*n+x]=b*scale;
    }
    return {re,im};
  }
  const signedBin=(k,n)=>k<n/2?k:k-n;
  function fourier(p) {
    const n=32,input=new Float64Array(n*n);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)input[y*n+x]=128+50*Math.cos(2*Math.PI*(p.fx*x+p.fy*y)/n+p.phase);
    const spectrum=dft2(input,n),filteredRe=new Float64Array(n*n),filteredIm=new Float64Array(n*n),display=new Float64Array(n*n),peaks=[];
    let maxLog=0;
    for(let v=0;v<n;v++)for(let u=0;u<n;u++){
      const i=v*n+u,fx=signedBin(u,n),fy=signedBin(v,n),radius=Math.hypot(fx,fy),gain=p.filter==='ideal'?Number(radius<=p.cutoff):Math.exp(-.5*(radius/p.cutoff)**2),magnitude=Math.hypot(spectrum.re[i],spectrum.im[i]);
      filteredRe[i]=spectrum.re[i]*gain;filteredIm[i]=spectrum.im[i]*gain;
      const log=Math.log1p(magnitude);display[((v+n/2)%n)*n+(u+n/2)%n]=log;maxLog=Math.max(maxLog,log);
      if(u||v)peaks.push({u:fx,v:fy,magnitude});
    }
    peaks.sort((a,b)=>b.magnitude-a.magnitude);
    const output=dft2(filteredRe,n,filteredIm,true).re;
    return {n,input,output,spectrum,display:Float64Array.from(display,v=>255*v/maxLog),peaks:peaks.slice(0,2),gain:p.filter==='ideal'?Number(Math.hypot(p.fx,p.fy)<=p.cutoff):Math.exp(-.5*(p.fx*p.fx+p.fy*p.fy)/(p.cutoff*p.cutoff)),rmse:Math.sqrt(mean(Array.from(output,(v,i)=>(v-input[i])**2)))};
  }
  function stereo(p) {
    const left=image(p.scene,0),right=new Float64Array(W*H),random=rng(905),valid=new Uint8Array(W*H),r=p.radius,maxD=16;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x+p.disparity<W){right[y*W+x]=clampValue(scene(p.scene,x+p.disparity,y)+p.noise*gauss(random),0,255);valid[y*W+x]=1;}
    const x=clampValue(Math.round(p.x),maxD+r+1,W-r-2),y=clampValue(Math.round(p.y),r+1,H-r-2),costs=[],patch=[];
    for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)patch.push(left[(y+j)*W+x+i]);
    const average=mean(patch),variance=mean(patch.map(v=>(v-average)**2));
    for(let d=0;d<=maxD;d++){
      let sum=0,count=0,ok=true;
      for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){
        const ri=(y+j)*W+x+i-d;if(!valid[ri]){ok=false;continue;}const difference=left[(y+j)*W+x+i]-right[ri];sum+=p.cost==='sad'?Math.abs(difference):difference*difference;count++;
      }
      costs.push(ok?sum/count:null);
    }
    const ranked=costs.map((cost,d)=>({cost,d})).filter(q=>q.cost!==null).sort((a,b)=>a.cost-b.cost),best=ranked[0],second=ranked[1],gap=second?(second.cost-best.cost)/Math.max(second.cost,1e-9):0,accepted=variance>1&&gap>.05&&best.d>0;
    return {left,right,valid,x,y,costs,best,second,gap,variance,accepted,trueDepth:19.2/p.disparity,depth:accepted?19.2/best.d:null,depthPerPixel:accepted?19.2/(best.d*best.d):null};
  }
  function sample(a,x,y,w=W,h=H){
    x=clampValue(x,0,w-1);y=clampValue(y,0,h-1);const i=Math.floor(x),j=Math.floor(y),dx=x-i,dy=y-j;
    return at(a,w,h,i,j)*(1-dx)*(1-dy)+at(a,w,h,i+1,j)*dx*(1-dy)+at(a,w,h,i,j+1)*(1-dx)*dy+at(a,w,h,i+1,j+1)*dx*dy;
  }
  function flowScene(mode,x,y){
    if(mode==='flat')return 120;
    if(mode==='edge')return 120+70*Math.tanh((x-W/2)/2);
    return 115+35*Math.sin(.34*x)+30*Math.cos(.39*y)+25*Math.sin(.23*x+.28*y);
  }
  function flow(p,estimate={u:0,v:0}) {
    const left=new Float64Array(W*H),right=new Float64Array(W*H),random=rng(731);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){left[y*W+x]=flowScene(p.scene,x,y);right[y*W+x]=clampValue(flowScene(p.scene,x-p.dx,y-p.dy)+p.noise*gauss(random),0,255);}
    let a=0,b=0,d=0,bx=0,by=0,loss=0,count=0,ra=0,rb=0,rd=0;
    for(let y=H/2-p.radius;y<=H/2+p.radius;y++)for(let x=W/2-p.radius;x<=W/2+p.radius;x++){
      const X=x+estimate.u,Y=y+estimate.v,Ix=(sample(right,X+1,Y)-sample(right,X-1,Y))/2,Iy=(sample(right,X,Y+1)-sample(right,X,Y-1))/2,residual=sample(right,X,Y)-left[y*W+x],rx=(sample(left,x+1,y)-sample(left,x-1,y))/2,ry=(sample(left,x,y+1)-sample(left,x,y-1))/2;
      a+=Ix*Ix;b+=Ix*Iy;d+=Iy*Iy;bx+=Ix*residual;by+=Iy*residual;loss+=residual*residual;ra+=rx*rx;rb+=rx*ry;rd+=ry*ry;count++;
    }
    a/=count;b/=count;d/=count;bx/=count;by/=count;
    const eig=eigen2(ra/count,rb/count,rd/count),condition=eig.min>1e-10?eig.max/eig.min:null,observable=eig.min>.05&&condition<1000,det=a*d-b*b;
    const delta=observable&&det>1e-10?{u:-(d*bx-b*by)/det,v:-(-b*bx+a*by)/det}:null;
    return {left,right,u:estimate.u,v:estimate.v,loss:loss/count,minEigen:eig.min,maxEigen:eig.max,condition,observable,delta,error:Math.hypot(estimate.u-p.dx,estimate.v-p.dy)};
  }
  function track(p,initial={u:0,v:0},iterations=1){
    let estimate={...initial},result=flow(p,estimate);const history=[result.loss];
    for(let i=0;i<iterations;i++){
      if(!result.delta)break;
      const length=Math.hypot(result.delta.u,result.delta.v),cap=length>2?2/length:1;let improved=false;
      for(const factor of [1,.5,.25,.125]){
        const next={u:clampValue(estimate.u+factor*cap*result.delta.u,-5,5),v:clampValue(estimate.v+factor*cap*result.delta.v,-5,5)},candidate=flow(p,next);
        if(candidate.loss<result.loss-1e-10){estimate=next;result=candidate;history.push(result.loss);improved=true;break;}
      }
      if(!improved)break;
    }
    return {u:estimate.u,v:estimate.v,result,history};
  }
  function lineThrough(p,q){const a=p[1]-q[1],b=q[0]-p[0],n=Math.hypot(a,b);return n<1e-10?null:{a:a/n,b:b/n,c:-(a*p[0]+b*p[1])/n};}
  const distance=(line,point)=>Math.abs(line.a*point[0]+line.b*point[1]+line.c);
  function tls(points){
    const mx=mean(points.map(p=>p[0])),my=mean(points.map(p=>p[1]));let xx=0,xy=0,yy=0;
    for(const [x,y] of points){xx+=(x-mx)**2;xy+=(x-mx)*(y-my);yy+=(y-my)**2;}
    const theta=.5*Math.atan2(2*xy,xx-yy),a=-Math.sin(theta),b=Math.cos(theta);return {a,b,c:-a*mx-b*my};
  }
  function ransac(p){
    const n=48,random=rng(804),points=Array.from({length:n},(_,i)=>{const x=-1+2*i/(n-1);return [x,.5*x+.2+.025*gauss(random)];}),indices=Array.from({length:n},(_,i)=>i),corrupted=new Uint8Array(n),noiseRandom=rng(405);
    for(let i=n-1;i>0;i--){const j=Math.floor(noiseRandom()*(i+1));[indices[i],indices[j]]=[indices[j],indices[i]];}
    const nOut=Math.floor(n*p.outliers/100);for(let k=0;k<nOut;k++){const i=indices[k];points[i][1]=-1+2*noiseRandom();corrupted[i]=1;}
    const hypotheses=rng(117),score=line=>{const inliers=points.map((point,i)=>distance(line,point)<=p.threshold?i:-1).filter(i=>i>=0);return {line,inliers,error:inliers.length?mean(inliers.map(i=>distance(line,points[i])**2)):Infinity};};
    let best=null;
    for(let k=0;k<p.iterations;k++){
      const i=Math.floor(hypotheses()*n);let j=Math.floor(hypotheses()*(n-1));if(j>=i)j++;
      const line=lineThrough(points[i],points[j]);if(!line)continue;const candidate=score(line);
      if(!best||candidate.inliers.length>best.inliers.length||(candidate.inliers.length===best.inliers.length&&candidate.error<best.error))best=candidate;
    }
    if(best.inliers.length>=2){const refined=score(tls(best.inliers.map(i=>points[i])));if(refined.inliers.length>best.inliers.length||(refined.inliers.length===best.inliers.length&&refined.error<best.error))best=refined;}
    const all=tls(points),tp=best.inliers.filter(i=>!corrupted[i]).length,nTrue=n-nOut,pair=nTrue/n*(nTrue-1)/(n-1);
    return {points,corrupted,best,all,tp,precision:tp/best.inliers.length,recall:tp/nTrue,success:1-(1-pair)**p.iterations,slope:Math.abs(best.line.b)>1e-9?-best.line.a/best.line.b:null};
  }
  return {W,H,image,sobel,eigen2,tensor,edges,harris,dft2,fourier,stereo,sample,flow,track,lineThrough,distance,tls,ransac};
})();
