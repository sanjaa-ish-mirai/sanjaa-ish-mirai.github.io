// Original numerical engines. Function bodies preserved byte for byte.
function clear(ctx,w,h){ctx.clearRect(0,0,w,h);ctx.fillStyle='#101725';ctx.fillRect(0,0,w,h);}

function clamp(v,lo=0,hi=1){return Math.max(lo,Math.min(hi,v));}

function gray(v){const k=Math.round(clamp(v)*255);return `rgb(${k},${k},${k})`;}

function renderSampling(){const f=+$('freq').value,N=+$('samples').value,p=+$('phase').value;
 $('freqVal').textContent=f+' cyc';$('samplesVal').textContent=N+' px';$('phaseVal').textContent=p.toFixed(1);
 const mode=document.querySelector('.seg button.active')?.id==='areaMode'?'area':'point';
 const orig=x=>.5+.45*Math.cos(2*Math.PI*f*x+p);
 const amp=mode==='area'?(Math.abs(Math.PI*f/N)<1e-10?1:Math.sin(Math.PI*f/N)/(Math.PI*f/N)):1;
 const val=n=>clamp(.5+.45*amp*Math.cos(2*Math.PI*f*(n+.5)/N+p));
 for(const [id,sampler] of [['sceneCanvas',x=>orig(x)],['sampleCanvas',x=>val(Math.min(N-1,Math.floor(x*N)))]]){const c=$(id),ctx=c.getContext('2d'),w=c.width,h=c.height;for(let x=0;x<w;x++){ctx.fillStyle=gray(sampler((x+.5)/w));ctx.fillRect(x,0,1,h);}}
 const c=$('signalCanvas'),ctx=c.getContext('2d'),w=c.width,h=c.height;clear(ctx,w,h);const L=35,R=w-13,T=17,B=h-28;ctx.strokeStyle='#263750';ctx.lineWidth=1;for(let j=0;j<=4;j++){const y=T+(B-T)*j/4;ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(R,y);ctx.stroke();}for(let i=0;i<=8;i++){const x=L+(R-L)*i/8;ctx.beginPath();ctx.moveTo(x,T);ctx.lineTo(x,B);ctx.stroke();}const yV=v=>B-clamp(v)*(B-T),xV=x=>L+x*(R-L);ctx.strokeStyle='#8ea5e9';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<=1800;i++){const x=i/1800;const y=yV(orig(x));i?ctx.lineTo(xV(x),y):ctx.moveTo(xV(x),y);}ctx.stroke();ctx.fillStyle='#60e5d1';for(let n=0;n<N;n++){const x=(n+.5)/N,y=val(n);ctx.beginPath();ctx.arc(xV(x),yV(y),Math.max(2.2,Math.min(4.6,70/N)),0,2*Math.PI);ctx.fill();}ctx.font='12px system-ui';ctx.fillStyle='#c2d0e6';ctx.fillText('I(x)',3,16);ctx.fillText('0',19,B+4);ctx.fillText('1.0',0,T+5);ctx.fillText('position x (normalized)',w-170,h-5);
 let alias=Infinity;for(let k=-10;k<=10;k++)alias=Math.min(alias,Math.abs(f-k*N));const good=f<N/2;$('nyquistOut').textContent=(N/2)+' cyc';$('aliasOut').textContent=alias.toFixed(1)+' cyc';const st=$('aliasStatus');st.textContent=good?'Sampled (under Nyquist)':f===N/2?'At Nyquist boundary':'Aliasing risk';st.className='status'+(good?' good':'');$('samplingWhyTitle').textContent=good?'Sampling theory: Хангалттай sample байна':'Яагаад '+f+' cycles → '+alias.toFixed(1)+' cycles болж харагдаж байна вэ?';$('samplingWhy').textContent=good?'Одоогийн frequency нь N/2-оос бага. Энэ нэг sinusoid-ийг ideal нөхцөлд sampling ambiguity-гүй төлөөлж чадна. Гэхдээ sensor noise болон optical blur тусдаа асуудал хэвээр.':`N=${N} sample дээр f=${f} cycles-ийн discrete утгууд ${alias.toFixed(1)} cycles-тэй бага давтамжийн component-той ялгагдахгүй байж болно. f_alias = min|f−kN|. ${mode==='area'?'Pixel integration өндөр frequency-ийн amplitude-ийг sinc response-оор сулруулж байна.':'Point sampling өндөр frequency-г хүчтэй хуурамч pattern хэлбэрээр үлдээж болно.'}`;}

function renderQuant(){const b=+$('bits').value,ct=+$('qContrast').value/100,L=2**b;$('bitsVal').textContent=b+'-bit';$('qContrastVal').textContent=Math.round(ct*100)+'%';$('levelsOut').textContent=L.toString();$('stepOut').textContent=(1/(L-1)).toFixed(5);$('qerrOut').textContent=(.5/(L-1)).toFixed(5);
 const inp=t=>clamp(.5+(t-.5)*ct),quant=x=>Math.round(x*(L-1))/(L-1);
 for(const [id,func] of [['idealGradient',x=>inp(x)],['quantGradient',x=>quant(inp(x))]]){const c=$(id),ctx=c.getContext('2d'),w=c.width;for(let x=0;x<w;x++){ctx.fillStyle=gray(func((x+.5)/w));ctx.fillRect(x,0,1,c.height);}}
 const c=$('quantPlot'),ctx=c.getContext('2d'),w=c.width,h=c.height;clear(ctx,w,h);const X=42,Y=13,R=w-15,B=h-29;ctx.strokeStyle='#2c3d59';ctx.lineWidth=1;for(let t=0;t<=1.0001;t+=.25){let xx=X+t*(R-X),yy=B-t*(B-Y);ctx.beginPath();ctx.moveTo(xx,Y);ctx.lineTo(xx,B);ctx.stroke();ctx.beginPath();ctx.moveTo(X,yy);ctx.lineTo(R,yy);ctx.stroke();}ctx.setLineDash([5,5]);ctx.strokeStyle='#8ea5e9';ctx.beginPath();ctx.moveTo(X,B);ctx.lineTo(R,Y);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='#58d7c7';ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<=900;i++){let x=i/900,yi=quant(x),xx=X+x*(R-X),yy=B-yi*(B-Y);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();ctx.fillStyle='#c2d0e6';ctx.font='12px system-ui';ctx.fillText('output',5,16);ctx.fillText('input intensity →',w-142,h-6);ctx.fillText('0',X-12,B+15);ctx.fillText('1',R-3,B+15);}

function rng(seed){let a=seed>>>0;return ()=>{a=(a*1664525+1013904223)>>>0;return a/4294967296;};}

function gauss(rand){return Math.sqrt(-2*Math.log(Math.max(1e-12,rand())))*Math.cos(2*Math.PI*rand());}

function scene(x,y){let g=.10+.42*x+.11*Math.sin(7*y+2*x);const cx=x-.57,cy=y-.54;if(cx*cx+cy*cy<.022)g=.82;if(x>.12&&x<.35&&y>.28&&y<.80)g=.65+0.1*Math.cos(x*80);if(y>.12&&y<.17)g=.92;if(x>.71&&y>.63)g=.29+0.12*Math.sin(x*37);return clamp(g);}

function renderNoise(){const exp=+$('exposure').value,sigma=+$('readNoise').value;$('exposureVal').textContent=exp.toFixed(2)+'×';$('readNoiseVal').textContent=sigma+' e⁻';let mu=180*exp,snr=mu/Math.sqrt(mu+sigma*sigma);$('muOut').textContent=Math.round(mu)+' e⁻';$('snrOut').textContent=snr.toFixed(2);$('snrDbOut').textContent=(20*Math.log10(snr)).toFixed(1)+' dB';const rand=rng(20261012),W=105,H=70;for(const [name,isNoisy] of [['cleanImage',false],['noisyImage',true]]){const c=$(name),ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;const cellW=c.width/W,cellH=c.height/H;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const I=scene(x/W,y/H);let out=I;if(isNoisy){const expected=360*exp*I;const electrons=expected+Math.sqrt(Math.max(0,expected))*gauss(rand)+sigma*gauss(rand);out=clamp(electrons/360);}ctx.fillStyle=gray(out);ctx.fillRect(x*cellW,y*cellH,cellW+0.12,cellH+0.12);}}}

function psfScene(W,H,f){const a=new Float32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  let v;const xx=(x+.5)/W, yy=(y+.5)/H;
  if(y<H*0.49){v=.48+.40*Math.cos(2*Math.PI*f*xx);}
  else {const dist=Math.hypot(x-W*.5,y-H*.75);v=.075+.75*Math.exp(-dist*dist/(2*.75*.75));
    // isolated bright impulses so broadening of point sources is visible
    for(const [dx,dy] of [[.17,.64],[.25,.84],[.75,.73],[.87,.89]]){
      const dr=Math.hypot(x-W*dx,y-H*dy);if(dr<1.15)v=.98;
    }
  }
  a[y*W+x]=clamp(v);
}return a;}

function gaussianBlur(a,W,H,sigma){if(sigma<.01)return a;
 const r=Math.max(1,Math.ceil(sigma*3.5)),kernel=[];let total=0;
 for(let k=-r;k<=r;k++){const v=Math.exp(-.5*(k/sigma)**2);kernel.push(v);total+=v;}
 const mid=new Float32Array(a.length),out=new Float32Array(a.length);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){let sum=0;for(let k=-r;k<=r;k++){const sx=Math.max(0,Math.min(W-1,x+k));sum+=a[y*W+sx]*kernel[k+r];}mid[y*W+x]=sum/total;}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){let sum=0;for(let k=-r;k<=r;k++){const sy=Math.max(0,Math.min(H-1,y+k));sum+=mid[sy*W+x]*kernel[k+r];}out[y*W+x]=sum/total;}
 return out;
}

function paintFloatImage(canvas,arr,W,H){const ctx=canvas.getContext('2d');const image=ctx.createImageData(W,H);
 for(let i=0;i<arr.length;i++){const g=Math.round(clamp(arr[i])*255),k=4*i;image.data[k]=g;image.data[k+1]=g;image.data[k+2]=g;image.data[k+3]=255;}
 const temp=document.createElement('canvas');temp.width=W;temp.height=H;temp.getContext('2d').putImageData(image,0,0);
 ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(temp,0,0,canvas.width,canvas.height);
}

function renderPsf(){const sigma=+$('psfSigma').value,f=+$('psfFrequency').value,W=160,H=96;
 $('psfSigmaVal').textContent=sigma.toFixed(1)+' px';$('psfFreqVal').textContent=f+' cyc';
 const base=psfScene(W,H,f);paintFloatImage($('psfOriginal'),base,W,H);
 paintFloatImage($('psfBlurred'),gaussianBlur(base,W,H,sigma),W,H);
 $('psfFwhm').textContent=(2.35482*sigma).toFixed(2)+' px';
 const mtf=Math.exp(-2*Math.PI**2*sigma*sigma*(f/W)**2);$('psfMtf').textContent=(100*mtf).toFixed(1)+'%';
 const c=$('psfGraph'),ctx=c.getContext('2d'),ww=c.width,hh=c.height;clear(ctx,ww,hh);
 const l=38,rt=ww-18,t=12,b=hh-27;
 ctx.strokeStyle='#364761';ctx.lineWidth=1;for(let k=0;k<5;k++){const x=l+(rt-l)*k/4;ctx.beginPath();ctx.moveTo(x,t);ctx.lineTo(x,b);ctx.stroke();}
 ctx.beginPath();ctx.strokeStyle='#5ce3ce';ctx.lineWidth=2.5;
 for(let i=0;i<700;i++){const u=i/699,xx=(u-.5)*18;
  const yy=sigma<.01?(Math.abs(xx)<.12?1:0):Math.exp(-.5*(xx/sigma)**2);
  const x=l+u*(rt-l),y=b-yy*(b-t)*.94;i?ctx.lineTo(x,y):ctx.moveTo(x,y);
 }ctx.stroke();ctx.fillStyle='#bdcce0';ctx.font='12px system-ui';ctx.fillText('relative energy',5,15);ctx.fillText('pixel displacement: −9    0    +9',ww-268,hh-5);
}

function foldAlias(v,N){let x=((v+N/2)%N+N)%N-N/2;return x;}

function renderMoire(){const f=+$('moireFrequency').value, theta=+$('moireAngle').value*Math.PI/180,N=+$('moirePixels').value;
 const fx=f*Math.cos(theta),fy=f*Math.sin(theta),area=$('moireAverage').classList.contains('active');
 $('moireFrequencyVal').textContent=f+' cyc';$('moireAngleVal').textContent=Math.round(theta*180/Math.PI)+'°';$('moirePixelsVal').textContent=N;
 const amp=area?sinc(Math.PI*fx/N)*sinc(Math.PI*fy/N):1;
 const field=(x,y)=>clamp(.5+.46*Math.cos(2*Math.PI*(fx*x+fy*y)));
 const pixel=(i,j)=>clamp(.5+.46*amp*Math.cos(2*Math.PI*(fx*(i+.5)/N+fy*(j+.5)/N)));
 const co=$('moireOriginal'),oo=co.getContext('2d'),w=co.width;
 const img=oo.createImageData(w,w);for(let yy=0;yy<w;yy++)for(let xx=0;xx<w;xx++){
  const z=Math.round(field((xx+.5)/w,(yy+.5)/w)*255),o=4*(yy*w+xx);img.data[o]=z;img.data[o+1]=z;img.data[o+2]=z;img.data[o+3]=255;
 }oo.putImageData(img,0,0);
 const sc=$('moireSample'),ctx=sc.getContext('2d'),s=sc.width;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,s,s);
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){ctx.fillStyle=gray(pixel(i,j));const x0=Math.floor(i*s/N),y0=Math.floor(j*s/N),x1=Math.ceil((i+1)*s/N),y1=Math.ceil((j+1)*s/N);ctx.fillRect(x0,y0,x1-x0,y1-y0);}
 const ax=foldAlias(fx,N),ay=foldAlias(fy,N),good=Math.abs(fx)<N/2 && Math.abs(fy)<N/2;
 $('moireVector').textContent=`(${fx.toFixed(1)}, ${fy.toFixed(1)})`;
 $('moireFolded').textContent=`(${ax.toFixed(1)}, ${ay.toFixed(1)})`;
 const stat=$('moireStatus');stat.textContent=good?'Both axes below Nyquist':'Aliasing / boundary risk';stat.className='status'+(good?' good':'');
}

function plotPolyline(ctx,pts,color,lineWidth=2){ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.stroke();}

function labAxes(ctx,w,h,left=43,right=15,top=17,bottom=31){clear(ctx,w,h);const L=left,R=w-right,T=top,B=h-bottom;ctx.strokeStyle='#293e59';ctx.lineWidth=1;for(let k=0;k<=4;k++){let x=L+(R-L)*k/4,y=T+(B-T)*k/4;ctx.beginPath();ctx.moveTo(x,T);ctx.lineTo(x,B);ctx.moveTo(L,y);ctx.lineTo(R,y);ctx.stroke();}return {L,R,T,B};}

function drawEdgePixels(){const values=[30,35,40,45,200,205,210,215],cells=$('pixelCells');cells.innerHTML=values.map((v,i)=>`<div class="pixel-cell"><div style="background:rgb(${v},${v},${v})"></div><small>x=${i}</small><b>${v}</b></div>`).join('');const cv=$('edgePixelPlot'),ctx=cv.getContext('2d'),{L,R,T,B}=labAxes(ctx,cv.width,cv.height);const coord=i=>L+(i+.5)/8*(R-L),yp=v=>B-v/255*(B-T);plotPolyline(ctx,values.map((v,i)=>[coord(i),yp(v)]),'#61dccc',2.8);ctx.fillStyle='#61dccc';values.forEach((v,i)=>{ctx.beginPath();ctx.arc(coord(i),yp(v),4,0,Math.PI*2);ctx.fill();});ctx.fillStyle='#b9cbe2';ctx.font='12px system-ui';ctx.fillText('I(x)',8,19);ctx.fillText('x →',R-28,cv.height-8);ctx.fillStyle='#ffb46b';ctx.fillText('Δ = +155',coord(3)+9,yp(200)-12);ctx.beginPath();ctx.strokeStyle='#ffb46b';ctx.lineWidth=2;ctx.moveTo(coord(3)+10,yp(45)-8);ctx.lineTo(coord(4)-8,yp(200)+8);ctx.stroke();}

function renderSpatialFrequency(){let k=+$('sfFreq').value,A=+$('sfAmp').value,phi=+$('sfPhase').value;const N=64;
 $('sfFreqVal').textContent=k+' cycles';$('sfAmpVal').textContent=A.toFixed(0);$('sfPhaseVal').textContent=phi.toFixed(2)+' rad';$('sfCypx').textContent=(k/N).toFixed(4)+' cyc/px';$('sfPeriod').textContent=(N/k).toFixed(2)+' px/cycle';$('sfRange').textContent=`${128-A}–${128+A}`;
 const cv=$('sfStripe'),ctx=cv.getContext('2d'),w=cv.width,h=cv.height;clear(ctx,w,h);const L=18,R=w-16,dx=(R-L)/N;for(let x=0;x<N;x++){const v=128+A*Math.cos(2*Math.PI*k*x/N+phi);ctx.fillStyle=`rgb(${Math.round(v)},${Math.round(v)},${Math.round(v)})`;ctx.fillRect(L+x*dx,14,dx+.1,76);}ctx.strokeStyle='#66738b';ctx.strokeRect(L,14,R-L,76);
 let c=$('sfCurve'),p=c.getContext('2d'),s=labAxes(p,c.width,c.height),X=x=>s.L+x/(N-1)*(s.R-s.L),Y=v=>s.B-v/255*(s.B-s.T);let wave=[];for(let x=0;x<N;x++)wave.push([X(x),Y(128+A*Math.cos(2*Math.PI*k*x/N+phi))]);plotPolyline(p,wave,'#64ddce',2.5);p.fillStyle='#a2b9d4';p.font='12px system-ui';p.fillText('255',8,s.T+8);p.fillText('0',26,s.B);p.fillText('x: 0',s.L,s.B+19);p.fillText('63 px',s.R-38,s.B+19);
 c=$('sfSpectrum');p=c.getContext('2d');s=labAxes(p,c.width,c.height);const specX=idx=>s.L+(idx+32)/64*(s.R-s.L),baseline=s.B;for(const pos of [-k,k]){p.strokeStyle='#64ddce';p.lineWidth=5;p.beginPath();p.moveTo(specX(pos),baseline);p.lineTo(specX(pos),s.T+13);p.stroke();p.fillStyle='#64ddce';p.font='12px system-ui';p.textAlign='center';p.fillText(pos===-k?'−k':' +k',specX(pos),s.T+11);}p.textAlign='left';p.fillStyle='#aabfd7';p.font='12px system-ui';p.fillText('−32',s.L,s.B+20);p.fillText('0',specX(0)-3,s.B+20);p.fillText('+31',s.R-29,s.B+20);p.fillText('DC / 0-frequency omitted',s.L+5,s.T+15);
}

function renderShape(){let n=+$('shapeWiggles').value,a=+$('shapeDepth').value;$('shapeWigglesVal').textContent=n;$('shapeDepthVal').textContent=a+' px';
 const cv=$('shapeCanvas'),ctx=cv.getContext('2d');clear(ctx,cv.width,cv.height);const R=88,cy=146;for(const [cx,wig,label] of [[158,false,'Smooth circle'],[456,true,'Wavy boundary']]){ctx.fillStyle='#24314c';ctx.beginPath();for(let i=0;i<=480;i++){let t=2*Math.PI*i/480,rad=R+(wig?a*Math.cos(n*t):0),x=cx+rad*Math.cos(t),y=cy+rad*Math.sin(t);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=wig?'#ffb46b':'#62d7c9';ctx.stroke();ctx.fillStyle='#b9cbe2';ctx.font='13px system-ui';ctx.textAlign='center';ctx.fillText(label,cx,27);}ctx.textAlign='left';
 const sp=$('shapeProfile'),p=sp.getContext('2d'),s=labAxes(p,sp.width,sp.height,45,15,18,31),xp=t=>s.L+t/(2*Math.PI)*(s.R-s.L),yp=r=>s.B-((r-R+25)/50)*(s.B-s.T);plotPolyline(p,Array.from({length:601},(_,i)=>{let t=i/600*2*Math.PI;return [xp(t),yp(R+a*Math.cos(n*t))];}),'#ffb46b',2.3);p.fillStyle='#b9cbe2';p.font='12px system-ui';p.fillText('R+a',5,20);p.fillText('0',s.L,s.B+19);p.fillText('2π rad',s.R-44,s.B+19);
}

function renderSpaceTime(){const k=+$('vidSpatial').value,v=+$('vidSpeed').value,t=+$('vidFrame').value;const N=64,A=105,fps=30,x0=32;
 $('vidSpatialVal').textContent=k;$('vidSpeedVal').textContent=v.toFixed(1);$('vidFrameVal').textContent=t;
 const sFreq=k/N,tFreq=k*Math.abs(v)/N*fps;$('videoSfOut').textContent=sFreq.toFixed(4)+' cyc/px';$('videoTfOut').textContent=tFreq.toFixed(2)+' Hz';
 const intensity=(x,frame)=>128+A*Math.cos(2*Math.PI*k*(x-v*frame)/N);
 const cv=$('videoRow'),ctx=cv.getContext('2d'),w=cv.width;clear(ctx,cv.width,cv.height);const L=18,dx=(w-34)/64;for(let i=0;i<N;i++){const I=Math.round(intensity(i,t));ctx.fillStyle=`rgb(${I},${I},${I})`;ctx.fillRect(L+i*dx,14,dx+.1,77);}const xMarker=L+(x0+.5)*dx;ctx.strokeStyle='#ffb46b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(xMarker,8);ctx.lineTo(xMarker,99);ctx.stroke();ctx.fillStyle='#ffb46b';ctx.font='12px system-ui';ctx.fillText('fixed x=32',Math.min(w-105,xMarker+5),112);
 let c=$('videoSpatialGraph'),p=c.getContext('2d'),g=labAxes(p,c.width,c.height),X=x=>g.L+x/(N-1)*(g.R-g.L),Y=i=>g.B-i/255*(g.B-g.T);
 plotPolyline(p,Array.from({length:64},(_,i)=>[X(i),Y(intensity(i,t))]),'#61dccc',2.5);p.strokeStyle='#ffb46b';p.setLineDash([5,4]);p.beginPath();p.moveTo(X(x0),g.T);p.lineTo(X(x0),g.B);p.stroke();p.setLineDash([]);p.fillStyle='#b9cbe2';p.font='12px system-ui';p.fillText('x →',g.R-25,g.B+21);
 c=$('videoTemporalGraph');p=c.getContext('2d');g=labAxes(p,c.width,c.height);const tx=frame=>g.L+frame/29*(g.R-g.L),wave=[];for(let i=0;i<=600;i++){const f=i/600*29;wave.push([tx(f),g.B-intensity(x0,f)/255*(g.B-g.T)]);}plotPolyline(p,wave,'#67abfb',2.5);for(let frame=0;frame<30;frame++){p.beginPath();p.arc(tx(frame),g.B-intensity(x0,frame)/255*(g.B-g.T),2.2,0,Math.PI*2);p.fillStyle='#8bbcff';p.fill();}p.strokeStyle='#ffb46b';p.setLineDash([4,4]);p.beginPath();p.moveTo(tx(t),g.T);p.lineTo(tx(t),g.B);p.stroke();p.setLineDash([]);p.fillStyle='#b9cbe2';p.font='12px system-ui';p.fillText('t: 0',g.L,g.B+21);p.fillText('29 frames ≈ 0.967 s',g.R-154,g.B+21);
}

function d2Safe(v){return Number.isFinite(v)?v:0;}

function d2Fmt(v){return Math.abs(v)<1e-9?'0':Math.abs(v)>=1000?String(Math.round(v)):Number(v.toFixed(3)).toString();}

function d2Sample(a,W,H,x,y,pad){
 if(x>=0&&x<W&&y>=0&&y<H)return a[y*W+x];
 if(pad==='zero')return 0;
 if(pad==='wrap'){x=((x%W)+W)%W;y=((y%H)+H)%H;}
 else if(pad==='replicate'){x=Math.max(0,Math.min(W-1,x));y=Math.max(0,Math.min(H-1,y));}
 else if(pad==='reflect'){const mirror=(v,N)=>{if(N===1)return 0;let p=2*(N-1);let t=((v%p)+p)%p;return t<N?t:p-t;};x=mirror(x,W);y=mirror(y,H);}
 return a[y*W+x];
}

function d2Apply(a,W,H,k,pad='reflect',op='corr'){
 const out=new Float64Array(W*H);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  let sum=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
   const coeff=k[(j+1)*3+(i+1)];const dx=op==='corr'?i:-i,dy=op==='corr'?j:-j;
   sum+=coeff*d2Sample(a,W,H,x+dx,y+dy,pad);
  }out[y*W+x]=sum;
 }return out;
}

function d2CellColor(val,signed=false){const g=Math.max(0,Math.min(255,Math.round((signed?128+val*.16:val))));return `rgb(${g},${g},${g})`;}

function d2CellText(val,signed=false){const g=Math.max(0,Math.min(255,Math.round((signed?128+val*.16:val))));return g>145?'#12213a':'#fff';}

function d2Matrix(){const preset=$('d2Preset').value,op=$('d2Operation').value,pad=$('d2Padding').value,x=+$('d2PosX').value,y=+$('d2PosY').value;
 $('d2PosXVal').textContent=x;$('d2PosYVal').textContent=y;
 const inp=$('d2InputGrid');inp.innerHTML='';for(let j=0;j<7;j++)for(let i=0;i<7;i++){
  const v=D2_INPUT[j*7+i],cell=document.createElement('button');cell.type='button';cell.className='d2-cell'+(Math.abs(i-x)<=1&&Math.abs(j-y)<=1?' patched':'')+(i===x&&j===y?' selected':'');cell.textContent=v;cell.style.background=d2CellColor(v);cell.style.color=d2CellText(v);cell.title=`Click to select output center ${i},${j}`;cell.addEventListener('click',()=>{$('d2PosX').value=i;$('d2PosY').value=j;d2Matrix()});inp.appendChild(cell);
 }
 const ker=$('d2KernelGrid');ker.innerHTML='';for(let j=0;j<3;j++)for(let i=0;i<3;i++){
  const n=j*3+i;const input=document.createElement('input');input.type='number';input.step='any';input.value=d2Fmt(d2Kernel[n]);input.setAttribute('aria-label',`Kernel row ${j+1} col ${i+1}`);input.style.borderColor=d2Kernel[n]<0?'#ffbd7769':'#55d7c769';input.addEventListener('change',()=>{const v=Number(input.value);if(!Number.isFinite(v)){input.value=d2Fmt(d2Kernel[n]);return;}d2Kernel[n]=Math.max(-50,Math.min(50,v));$('d2Preset').value='custom';d2Matrix()});ker.appendChild(input);
 }
 const o=d2Apply(D2_INPUT,7,7,d2Kernel,pad,op),signed=d2Kernel.some(v=>v<0),out=$('d2OutputGrid');out.innerHTML='';for(let j=0;j<7;j++)for(let i=0;i<7;i++){
  const val=o[j*7+i],cell=document.createElement('div');cell.className='d2-cell'+(i===x&&j===y?' selected':'');cell.style.background=d2CellColor(val,signed);cell.style.color=d2CellText(val,signed);cell.textContent=Math.round(val).toString();cell.title='Exact output: '+val.toFixed(6)+' (full precision in selected-pixel calculation)';out.appendChild(cell);
 }
 $('d2SelectedCell').textContent=`Selected (x=${x}, y=${y}) — ${op==='corr'?'correlation':'true convolution'}`;
 const sums=[],terms=[];for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
  const v=d2Sample(D2_INPUT,7,7,x+(op==='corr'?i:-i),y+(op==='corr'?j:-j),pad);const weight=d2Kernel[(j+1)*3+i+1];sums.push(v*weight);terms.push(`<div class="d2-term"><small>${d2Fmt(v)} × ${d2Fmt(weight)}</small><b>${d2Fmt(v*weight)}</b></div>`);
 }$('d2Products').innerHTML=terms.join('');$('d2Sum').innerHTML=`Y[${y},${x}] = ${sums.map(v=>d2Fmt(v)).join(' + ')} = <b style="color:var(--teal)">${d2Fmt(o[y*7+x])}</b>`;
 const msg={box:'9 хөршийн average: sum(K)=1. Constant region өөрчлөгдөхгүй (border зөв өргөтгөсөн үед).',gauss:'Center pixel-д илүү их weight өгдөг local smoothing. Symmetry тул convolution/correlation ижил.',sharp:'Center-ийг 5× өсгөж 4 шууд хөршөөс хасна. Edge тодрох ч noise өсөх эрсдэлтэй.',sobel:'Sobel X нь x чиглэлийн өөрчлөлтийг signed response болгон илэрхийлнэ. Negative output нь negative gradient гэсэн үг.',asym:'Asymmetric kernel нь convolution/correlation-ийн indexing ялгааг сайн харуулна.',custom:'Энэ бол таны custom 3×3 kernel; coefficient-ийн нийлбэр, sign-аас response-ийн шинж хамаарна.'};$('d2KernelWhy').textContent=msg[preset]||msg.custom;
}

function d2ChangePreset(){const key=$('d2Preset').value;if(key!=='custom')d2Kernel=D2_KERNELS[key].slice();d2Matrix();}

function d2Line(ctx,pts,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}

function d2SceneAxes(ctx,W,H){clear(ctx,W,H);ctx.strokeStyle='#263b56';ctx.lineWidth=1;for(let n=0;n<5;n++){const x=35+n/4*(W-53);ctx.beginPath();ctx.moveTo(x,12);ctx.lineTo(x,H-17);ctx.stroke();}}

function d2Conv1D(a,k){const N=a.length;return a.map((_,i)=>k.reduce((s,kk,j)=>s+kk*(a[i-(j-1)]??0),0));}

function d2Impulse(){const h=D2_1D[$('d2H').value],second=+$('d2Delta').value,b=+$('d2Weight').value;const N=65;
 $('d2DeltaVal').textContent=second;$('d2WeightVal').textContent=b.toFixed(1);$('d2HName').textContent='['+h.map(d2Fmt).join(', ')+']';
 const I=new Array(N).fill(0),J=new Array(N).fill(0);I[15]=1;J[second]=1;
 const combo=I.map((x,i)=>x+b*J[i]),lhs=d2Conv1D(combo,h),rI=d2Conv1D(I,h),rJ=d2Conv1D(J,h),rhs=rI.map((x,i)=>x+b*rJ[i]);let maxerr=Math.max(...lhs.map((v,i)=>Math.abs(v-rhs[i])));
 $('d2SuperError').textContent=maxerr.toExponential(2);
 const c=$('d2ImpulseCanvas'),p=c.getContext('2d'),W=c.width,H=c.height;d2SceneAxes(p,W,H);const X=n=>35+n/64*(W-53),Y1=v=>100-v*34,Y2=v=>270-v*45;
 p.strokeStyle='#456179';p.beginPath();p.moveTo(35,100);p.lineTo(W-18,100);p.moveTo(35,270);p.lineTo(W-18,270);p.stroke();
 d2Line(p,combo.map((v,n)=>[X(n),Y1(v)]),'#ffb46b',2.6);
 d2Line(p,lhs.map((v,n)=>[X(n),Y2(v)]),'#55dccc',4.5);
 d2Line(p,rhs.map((v,n)=>[X(n),Y2(v)]),'#8dafff',1.5);
 p.font='14px system-ui';p.fillStyle='#b8c9de';p.fillText('I + bJ',40,20);p.fillText('T(I+bJ) = T(I) + bT(J)',40,192);p.fillStyle='#55dccc';p.fillText('lhs',W-132,192);p.fillStyle='#8dafff';p.fillText('rhs',W-72,192);
}

function d2SeedNoise(x,y){const v=Math.sin(x*127.1+y*311.7+8.45)*43758.5453;return 2*(v-Math.floor(v)) -1;}

function d2Scene2D(){const N=96,a=new Float64Array(N*N);for(let y=0;y<N;y++)for(let x=0;x<N;x++){
 const xx=(x+.5)/N,yy=(y+.5)/N;let v=44+72*xx;
 if(xx>.13&&xx<.83&&yy>.16&&yy<.82)v=185;
 if(Math.abs(xx-.5)<.035&&yy>.27&&yy<.75)v=40;
 if((xx-.73)**2+(yy-.59)**2<.095**2)v=244;
 if(xx<.10||yy<.07)v=220;
 a[y*N+x]=v;
 }return a;}

function d2PixelPaint(id,data,mode='normal'){const c=$(id),p=c.getContext('2d'),W=96,H=96,buf=p.createImageData(W,H);for(let i=0;i<W*H;i++){
 const value=Math.round(Math.max(0,Math.min(255,mode==='signed'?128+data[i]*.2:data[i])));buf.data[4*i]=value;buf.data[4*i+1]=value;buf.data[4*i+2]=value;buf.data[4*i+3]=255;
 }const tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;tmp.getContext('2d').putImageData(buf,0,0);p.imageSmoothingEnabled=false;p.clearRect(0,0,c.width,c.height);p.drawImage(tmp,0,0,c.width,c.height);}

function d2Image(){const type=$('d2ImgFilter').value,pad=$('d2ImgBoundary').value,noise=+$('d2ImgNoise').value;$('d2ImgNoiseVal').textContent=noise;
 const input=Float64Array.from(d2SceneBase,(v,i)=>v+noise*d2SeedNoise(i%96,Math.floor(i/96)));
 const filtered=d2Apply(input,96,96,D2_KERNELS[type],pad);d2PixelPaint('d2ImgOriginal',input);d2PixelPaint('d2ImgFiltered',filtered,type==='sobel'?'signed':'normal');
 let mean=0,edge=0,interior=0,ec=0,ic=0;for(let y=0;y<96;y++)for(let x=0;x<96;x++){const i=y*96+x,v=Math.abs(filtered[i]-input[i]);mean+=v;if(x<=1||y<=1||x>=94||y>=94){edge+=v;ec++;}else{interior+=v;ic++;}}
 $('d2ImgChange').textContent=(mean/(96*96)).toFixed(1);$('d2WeightSum').textContent=d2Fmt(D2_KERNELS[type].reduce((a,b)=>a+b,0));$('d2EdgeDiff').textContent=(edge/ec).toFixed(1)+' / '+(interior/ic).toFixed(1);
}

function d2HComplex(h,omega){let re=0,im=0;for(let i=0;i<h.length;i++){const t=omega*(i-1);re+=h[i]*Math.cos(t);im-=h[i]*Math.sin(t);}return {re,im,amp:Math.hypot(re,im),phase:Math.atan2(im,re)};}

function d2Frequency(){const h=D2_1D[$('d2FreqType').value],k=+$('d2Freq').value,ampl=+$('d2FreqAmp').value,N=128;const omega=2*Math.PI*k/N,H=d2HComplex(h,omega);
 $('d2FreqVal').textContent=k;$('d2FreqAmpVal').textContent=ampl.toFixed(1);$('d2Cpx').textContent=(k/N).toFixed(5)+' cyc/px';$('d2Gain').textContent=H.amp.toFixed(4)+'×';$('d2PhaseShift').textContent=(H.phase*180/Math.PI).toFixed(1)+'°';
 const src=Array.from({length:N},(_,n)=>ampl*Math.cos(omega*n));
 const filtered=src.map((_,n)=>h.reduce((s,weight,j)=>s+weight*src[((n-(j-1))%N+N)%N],0));
 const c=$('d2FreqSignals'),p=c.getContext('2d');d2SceneAxes(p,c.width,c.height);const X=n=>35+n/(N-1)*(c.width-53),Y1=v=>99-v*66,Y2=v=>272-v*55;
 p.strokeStyle='#405b74';p.beginPath();p.moveTo(35,99);p.lineTo(c.width-18,99);p.moveTo(35,272);p.lineTo(c.width-18,272);p.stroke();
 d2Line(p,src.map((v,i)=>[X(i),Y1(v)]),'#62ddcc',2.5);d2Line(p,filtered.map((v,i)=>[X(i),Y2(v)]),'#ffb46b',2.5);
 p.font='14px system-ui';p.fillStyle='#c7d8ea';p.fillText('Input sine: '+k+' cycles / 128 px',43,19);p.fillText('Output after convolution',43,193);
 const cp=$('d2FreqResponse'),r=cp.getContext('2d');d2SceneAxes(r,cp.width,cp.height);const Xr=f=>35+f/.5*(cp.width-53),maxGain=Math.max(1,...Array.from({length:501},(_,i)=>d2HComplex(h,Math.PI*i/500).amp)),Yr=g=>cp.height-29-g/maxGain*(cp.height-52);
 d2Line(r,Array.from({length:501},(_,i)=>{const freq=i/1000;return [Xr(freq),Yr(d2HComplex(h,2*Math.PI*freq).amp)];}),'#62ddcc',2.8);
 r.setLineDash([7,6]);r.strokeStyle='#ffb46b';r.lineWidth=2;r.beginPath();r.moveTo(Xr(k/N),13);r.lineTo(Xr(k/N),cp.height-29);r.stroke();r.setLineDash([]);r.fillStyle='#ffb46b';r.font='12px system-ui';r.fillText('selected',Math.min(cp.width-95,Xr(k/N)+9),23);r.fillStyle='#c7d8ea';r.fillText('0',35,cp.height-9);r.fillText('Nyquist · 0.5 cyc/px',cp.width-188,cp.height-9);
}

function d2Gaussian(){const k=+$('d2GSize').value,sigma=+$('d2GSigma').value,m=Math.floor(k/2);$('d2GSizeVal').textContent=k+' × '+k;$('d2GSigmaVal').textContent=sigma.toFixed(1)+' px';
 let g=Array.from({length:k},(_,i)=>Math.exp(-((i-m)**2)/(2*sigma*sigma)));const sum=g.reduce((a,b)=>a+b,0);g=g.map(v=>v/sum);const out=g.flatMap(u=>g.map(v=>u*v));
 $('d2Gauss1D').innerHTML=g.map(v=>`<span>${v.toFixed(4)}</span>`).join('');
 const mat=$('d2Gauss2D');mat.style.gridTemplateColumns=`repeat(${k},minmax(0,1fr))`;mat.innerHTML=out.map(v=>{const c=Math.round(35+v/Math.max(...out)*150);return `<span style="background:rgb(0,${c},${c});color:#fff" title="${v.toPrecision(6)}">${v.toFixed(k<=7?3:2)}</span>`;}).join('');
 $('d2DirectOps').textContent=k*k;$('d2SepOps').textContent=2*k;$('d2OpReduction').textContent=(k/2).toFixed(2)+'×';
 // Verify on a 16×16 deterministic scene: separable circular filtering vs direct 2D circular filtering.
 const W=16,src=Array.from({length:W*W},(_,i)=>Math.sin(i*.23)+.02*(i%W)),horizontal=Array(W*W).fill(0),sep=Array(W*W).fill(0),direct=Array(W*W).fill(0),wrap=v=>(v+W)%W;
 for(let y=0;y<W;y++)for(let x=0;x<W;x++)for(let i=0;i<k;i++)horizontal[y*W+x]+=g[i]*src[y*W+wrap(x+i-m)];
 for(let y=0;y<W;y++)for(let x=0;x<W;x++)for(let j=0;j<k;j++)sep[y*W+x]+=g[j]*horizontal[wrap(y+j-m)*W+x];
 for(let y=0;y<W;y++)for(let x=0;x<W;x++)for(let j=0;j<k;j++)for(let i=0;i<k;i++)direct[y*W+x]+=g[j]*g[i]*src[wrap(y+j-m)*W+wrap(x+i-m)];
 const err=Math.max(...sep.map((v,i)=>Math.abs(v-direct[i])));$('d2SepError').textContent='max |direct − separable| = '+err.toExponential(2)+'; Σ K ≈ '+out.reduce((a,b)=>a+b,0).toFixed(6);
}

function advDraw(d){
 const type=ADVANCED[d].lab,A=+$('advA').value,B=+$('advB').value;
 $('advValA').textContent=A;$('advValB').textContent=B;
 const c=$('advCanvas'),ctx=c.getContext('2d'),W=c.width,H=c.height;
 ctx.fillStyle='#0c1627';ctx.fillRect(0,0,W,H);
 const ink='#dfe9fa', muted='#96acc7', teal='#55d7c7',blue='#77a8ff',orange='#ffbd77',purple='#bb9bff';
 function text(x,y,str,color=muted,size=13){ctx.font=`${size}px system-ui`;ctx.fillStyle=color;ctx.fillText(str,x,y);}
 function line(x,y,xx,yy,color=muted,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke();}
 function circle(x,y,r,color=teal){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);ctx.fill();}
 function rect(x,y,w,h,color=teal){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
 function poly(points,color=teal,width=3){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
 function grid(){for(let x=45;x<W;x+=50)line(x,22,x,300,'#233147',1);for(let y=35;y<300;y+=50)line(32,y,692,y,'#233147',1);}
 function title(s){text(24,24,s,ink,15)}
 let note='';
 switch(type){
 case 'signal':{
  grid();const f=1+Math.round(A/5),amp=15+B*1.05;title('Signal intensity I(x) ба local gradient / Fourier waves');
  const p=[],q=[];for(let x=0;x<=640;x+=2){const th=2*Math.PI*f*x/640;p.push([45+x,169-amp*Math.sin(th)]);q.push([45+x,270-(amp*f/24)*Math.cos(th)]);}poly(p,teal);poly(q,orange,1.7);line(45,169,690,169,'#64728d',1);
  note=`Frequency: ${f} cycles / 640px. Amplitude: ${amp.toFixed(0)}. Derived gradient magnitude нь frequency × amplitude-тай пропорционал — гэхдээ нэг edge ганц frequency биш.`;break;}
 case 'spectrum':{
  const ang=(A/100)*Math.PI,fr=2+Math.round(B/7);title('2D sinusoidal stripes ↔ symmetric Fourier peaks');
  ctx.save();ctx.beginPath();ctx.rect(35,43,295,240);ctx.clip();for(let y=43;y<283;y+=3)for(let x=35;x<330;x+=3){const ph=2*Math.PI*fr*((x-35)*Math.cos(ang)+(y-43)*Math.sin(ang))/295, g=Math.round(130+108*Math.cos(ph));rect(x,y,3.5,3.5,`rgb(${g},${g},${g})`);}ctx.restore();
  line(500,46,500,284,'#435772');line(375,165,630,165,'#435772');circle(500,165,4,orange);const dx=fr*9*Math.cos(ang),dy=fr*9*Math.sin(ang);circle(500+dx,165-dy,7,teal);circle(500-dx,165+dy,7,teal);text(390,305,'Image pattern');text(490,305,'FFT magnitude');
  note=`Frequency vector angle ${(ang*180/Math.PI).toFixed(0)}°, norm ~${fr}. Spectrum peaks нь ±(fx,fy) дээр симметр, pattern-ийн судлын чиглэлд перпендикуляр.`;break;}
 case 'gaussian':{
  grid();const sigma=.3+A/20, freq=1+Math.round(B/5),atten=Math.exp(-2*Math.PI*Math.PI*sigma*sigma*Math.pow(freq/70,2));title('Gaussian low-pass: input signal → output signal');
  const p=[],q=[];for(let x=0;x<=640;x+=2){const y=Math.sin(2*Math.PI*freq*x/640);p.push([45+x,150-72*y]);q.push([45+x,225-72*atten*y]);}poly(p,blue,2);poly(q,teal,3);
  text(48,80,'Input / before blur',blue);text(48,310,'Output / after blur',teal);note=`σ=${sigma.toFixed(2)} px, spatial frequency=${freq}/70 cycles/pixel. |H(f)|≈${atten.toFixed(3)}; өндөр frequency-д suppression их.`;break;}
 case 'tensor':{
  title('Structure tensor eigenvalues: flat / edge / corner');const l1=4*A+1,l2=4*B+1;
  line(360,46,360,295,'#40516e');line(90,175,630,175,'#40516e');ctx.save();ctx.translate(360,175);ctx.scale(Math.sqrt(l1)*5,Math.sqrt(l2)*5);ctx.beginPath();ctx.arc(0,0,1,0,2*Math.PI);ctx.restore();
  ctx.beginPath();ctx.ellipse(360,175,Math.sqrt(l1)*5,Math.sqrt(l2)*5,0,0,2*Math.PI);ctx.strokeStyle=teal;ctx.lineWidth=3;ctx.stroke();circle(360,175,4,orange);
  const tag=Math.max(l1,l2)<35?'FLAT':Math.min(l1,l2)<35?'EDGE':'CORNER';text(28,50,`λ₁=${l1.toFixed(0)}, λ₂=${l2.toFixed(0)}`,blue);text(28,315,`Classification: ${tag}`,orange,15);note=`Gradient information хоёр orthogonal direction-д хэр их байгааг eigenvalues харуулна. Classification нь зөвхөн illustrative threshold.`;break;}
 case 'rotation':{
  title('Rigid transform: rotation R ба translation t');grid();let a=(A-50)/50*Math.PI,tx=(B-50)*3;
  const square=[[-45,-45],[45,-45],[45,45],[-45,45],[-45,-45]];poly(square.map(([x,y])=>[235+x,175+y]),blue,2);
  poly(square.map(([x,y])=>[400+tx+Math.cos(a)*x-Math.sin(a)*y,175+Math.sin(a)*x+Math.cos(a)*y]),teal,3);
  line(235,175,400+tx,175,orange,2);text(65,310,'Blue: world square');text(350,310,'Green: transformed square');note=`Yaw ${(a*180/Math.PI).toFixed(0)}°, tx=${tx.toFixed(0)}px. p′=Rp+t; rotation preserves distances, translation changes origin.`;break;}
 case 'projection':{
  title('Pinhole: 3D depth ба lateral offset → pixel position');const Z=1+A/17,X=(B-50)/26,fx=500,cx=360,u=cx+fx*X/Z;
  line(85,290,630,290,'#384c67');rect(75,80,13,210,blue);circle(85,175,7,orange);circle(Math.max(100,Math.min(650,u)),175,7,teal);
  const wx=470+X*36,wy=285-Z*28;circle(wx,wy,7,orange);line(85,175,wx,wy,'#687e9d',2);text(95,95,'image plane',blue);text(390,90,'3D point ray',orange);
  note=`Z=${Z.toFixed(2)}m, X=${X.toFixed(2)}m, fx=500px ⇒ u−cx=${(fx*X/Z).toFixed(1)}px. Z өсөхөд normalized x=X/Z багасна.`;break;}
 case 'distortion':{
  title('Radial lens distortion: ideal grid → observed warped grid');let k=(A-50)/170,rscale=.6+B/270;
  for(let j=-4;j<=4;j++){let pts=[];for(let i=-4;i<=4;i+=.2){let x=i/5*rscale,y=j/5*rscale,r2=x*x+y*y,s=1+k*r2;pts.push([360+210*x*s,175+155*y*s]);}poly(pts,teal,1.5);}
  for(let i=-4;i<=4;i++){let pts=[];for(let j=-4;j<=4;j+=.2){let x=i/5*rscale,y=j/5*rscale,r2=x*x+y*y,s=1+k*r2;pts.push([360+210*x*s,175+155*y*s]);}poly(pts,blue,1.5);}
  circle(360,175,4,orange);note=`Radial coefficient k₁=${k.toFixed(3)}. Radius r өсөхөд factor (1+k₁r²) илүү өөрчилнө; image border coverage calibration-д хэрэгтэй.`;break;}
 case 'epipolar':{
  title('Corresponding point must lie on epipolar line');rect(32,55,305,231,'#16223a');rect(383,55,305,231,'#16223a');const y=80+(A/100)*170;circle(80+A*2.1,y,7,orange);const tilt=(B-50)*.18;
  line(395,y-110*tilt/16,677,y+110*tilt/16,teal,3);circle(460+A*1.5,y+(A-50)*tilt/160,7,blue);text(45,313,'Camera 1: point x₁',blue);text(405,313,'Camera 2: line l₂=Fx₁',teal);
  note=`Left feature-ээс Fundamental matrix-аар epipolar line тодорхойлно. Right match нь line дээр/ойролцоо байх ёстой; arbitrary 2D хаана ч байж болохгүй.`;break;}
 case 'stereo':{
  title('Stereo rows: periodic texture matching ambiguity');const disp=5+Math.round(A/3),period=9+Math.round(B/4);
  function stripes(y,off){for(let x=35;x<684;x++){const g=118+103*Math.cos(2*Math.PI*(x+off)/period);rect(x,y,1,68,`rgb(${g.toFixed(0)},${g.toFixed(0)},${g.toFixed(0)})`);} }
  stripes(57,0);stripes(168,disp);rect(220,57,2,68,orange);rect(220-disp,168,2,68,teal);text(36,48,'Left');text(36,160,'Right');line(221,260,221-disp,260,orange,3);
  note=`Disparity ${disp}px, repetition period ${period}px. Ойролцоо pattern нь олон candidate matching minima үүсгэж болно (±period shift).`;break;}
 case 'depth':{
  title('Stereo depth triangle & propagated uncertainty');const Z=1+A/12,f=700,Baseline=.12,sigmaD=.05+B*.01,d=f*Baseline/Z,unc=Z*Z*sigmaD/(f*Baseline);
  circle(150,275,8,blue);circle(280,275,8,blue);circle(220,70,9,orange);line(150,275,220,70,teal,3);line(280,275,220,70,teal,3);line(150,275,280,275,blue,3);text(140,312,'L');text(270,312,'R');text(235,74,'Point');text(390,95,`Z = ${Z.toFixed(2)} m`,ink,21);text(390,135,`Disparity = ${d.toFixed(2)} px`,teal,16);text(390,175,`σd = ${sigmaD.toFixed(2)} px`,orange,16);text(390,216,`σZ ≈ ${(unc*100).toFixed(1)} cm`,orange,21);
  note=`f=700px, B=0.12m. Z өсөх тусам disparity багасч uncertainty нь Z²-тай ойролцоогоор өснө (first-order model).`;break;}
 case 'triangulate':{
  title('Triangulation: noisy rays may not intersect');const Z=1+A/14,err=(B-50)/6;
  circle(160,286,7,blue);circle(560,286,7,blue);circle(360,250-Z*19,8,orange);
  line(160,286,360+err,250-Z*19,teal,3);line(560,286,360-err,250-Z*19,purple,3);text(135,315,'Cam L');text(540,315,'Cam R');text(360,65,'True point',orange);
  note=`Ray intersection geometry: measurement mismatch ${Math.abs(err).toFixed(1)} illustrative pixels. Reprojection residual-г minimize хийж best-fit 3D point авна.`;break;}
 case 'flow':{
  title('Optical flow: displaced patch & aperture ambiguity');grid();const dx=(A-50)*2.1,dy=(B-50)*1.9;
  rect(245,133,68,52,'#77a8ff55');rect(245+dx,133+dy,68,52,'#55d7c760');
  line(279,159,279+dx,159+dy,orange,3);circle(279+dx,159+dy,5,orange);text(45,310,'Blue: frame t | Green: frame t+Δt');
  note=`Flow displacement (u,v)=(${dx.toFixed(1)},${dy.toFixed(1)}) px. Optical flow describes frame-to-frame pixel motion, not necessarily camera translation in meters.`;break;}
 case 'scale':{
  title('Monocular scale ambiguity: similar image projections');const s=.3+A/25,cam=(B+10)/13;circle(100,260,7,teal);circle(100+cam*13,260,7,blue);
  let P=[520,90];line(100,260,...P,'#88a0c0',2);line(100+cam*13,260,...P,orange,2);
  const pScaled=[100+(P[0]-100)*s/2,260+(P[1]-260)*s/2];circle(...pScaled,6,purple);text(335,306,`Scene scale ≈ ${s.toFixed(2)}x`);text(35,45,'Relative projection unchanged if all metric distances scale together');
  note=`Camera baseline болон scene distances нэг factor-аар scale хийхэд normalized projection unchanged. Monocular хоёр view alone metric length determine хийхгүй.`;break;}
 case 'pose':{
  title('3D landmark → 2D reprojection under camera translation');const tx=(A-50)/30,Z=2+B/21,fx=650,X=1,u0=350+fx*X/Z,u1=350+fx*(X-tx)/Z;
  line(30,260,685,260,'#3a4c66');circle(350,260,7,blue);circle(350+tx*40,260,7,teal);circle(450,75,9,orange);
  line(350,260,450,75,blue,2);line(350+tx*40,260,450,75,teal,2);text(365,42,`u before=${u0.toFixed(0)} px; after=${u1.toFixed(0)} px`,ink,18);
  note=`Camera translation tx=${tx.toFixed(2)}m, Z=${Z.toFixed(2)}m. Residual Δu≈${(u1-u0).toFixed(1)}px. Correct pose minimizes many landmark reprojection residuals.`;break;}
 case 'optimizer':{
  title('Loss landscape & gradient descent iterations');grid();const alpha=.02+A*.005,start=(B-50)/9+2.5;
  const f=x=>.8*(x-3)*(x-3);poly(Array.from({length:601},(_,i)=>{const x=-3+i*12/600;return [45+i*640/600,282-Math.min(240,f(x)*8)];}),blue,2);
  let x=start,history=[];for(let j=0;j<10;j++){history.push([45+(x+3)*640/12,282-Math.min(240,f(x)*8)]);x=x-alpha*1.6*(x-3);}poly(history,orange,3);history.forEach(([a,b])=>circle(a,b,4,teal));
  note=`Learning rate α=${alpha.toFixed(3)}, initial θ=${start.toFixed(2)}, after 10 iterations θ=${x.toFixed(3)}, minimum θ*=3. Overshoot эсвэл convergence-г slider-аар шалга.`;break;}
 case 'trajectory':{
  title('Ground-truth path vs odometry drift');grid();const bias=(A-50)*.003,jitter=B*.07;
  const gt=[],est=[];for(let i=0;i<=80;i++){let x=70+i*7,y=255-70*Math.sin(i/14);gt.push([x,y]);est.push([x, y-2*i*bias-8*Math.sin(i/7)*jitter/7]);}poly(gt,blue,3);poly(est,orange,3);
  text(43,45,'Reference trajectory',blue);text(390,45,'Estimated trajectory',orange);
  note=`Per-step systematic bias ${(bias).toFixed(3)} illustrative units, jitter ${(jitter).toFixed(2)}. ATE/RPE errors require aligned frames and explicit units.`;break;}
 case 'backprop':{
  title('Two-layer network: forward & backward sensitivity');const x=.5+A/30,w=0.3+B/30,w2=1.7,target=10,h=Math.max(0,x*w),y=h*w2,err=y-target,grad=err*w2*x;
  const nodes=[[105,164,'x'],[295,164,'h'],[485,164,'ŷ'],[640,164,'L']];nodes.forEach(([nx,ny,label],i)=>{circle(nx,ny,31,i===3?orange:teal);text(nx-9,ny+5,label,'#071426',18);if(i>0)line(nodes[i-1][0]+35,ny,nx-35,ny,blue,2);});
  text(65,78,`x=${x.toFixed(2)}; w1=${w.toFixed(2)}; w2=1.7`,ink,16);text(65,285,`y_hat=${y.toFixed(2)}; error=${err.toFixed(2)}; ∂L/∂w1≈${grad.toFixed(2)} (L=0.5err²)`,orange,17);
  note='Chain rule: ∂L/∂w₁=(ŷ−target)·w₂·ReLU′(w₁x)·x. Forward computation graph-ийн intermediate-ууд backward gradient-д хэрэгтэй.';break;}
 case 'cnn':{
  title('Learned convolution / correlation kernel response');const k=.15+A/70,pos=90+B*4.4;
  for(let i=0;i<34;i++){let x=45+i*19,g=i*19>pos?210:40;rect(x,62,18,70,`rgb(${g},${g},${g})`);}
  const pts=[];for(let x=0;x<=640;x+=3){const cur=x>pos?210:40;const edge=Math.exp(-Math.pow((x-pos)/31,2));pts.push([45+x,285-140*edge*k/2]);}poly(pts,teal,3);text(45,46,'Input pixel row');text(45,174,'Edge-like response map');
  note=`Kernel gain ${k.toFixed(2)}, edge x≈${pos.toFixed(0)}px. Shared local kernel pattern олон location дээр respond хийнэ; learned weight-үүд loss minimization-оос үүсдэг.`;break;}
 case 'resnet':{
  title('Residual shortcut vs plain Jacobian chain');let fprime=(A-50)/90,depth=1+Math.round(B/10),plain=Math.pow(Math.abs(fprime),depth),res=Math.pow(Math.abs(1+fprime),depth);
  rect(125,250,120,-Math.min(190,Math.abs(plain)*160),blue);rect(435,250,120,-Math.min(190,Math.abs(res)*160),teal);text(132,276,'Plain chain');text(435,276,'Residual chain');text(45,43,`Local F′=${fprime.toFixed(3)}, depth=${depth}`,ink,18);text(140,310,`|F′|^N=${plain.toFixed(3)}`,blue);text(440,310,`|1+F′|^N=${res.toFixed(3)}`,teal);
  note='Illustrative scalar local Jacobian product — residual identity path gradient disappearance багасгаж болох боловч бүх neural network-д numerical guarantee биш.';break;}
 case 'generalization':{
  title('Train vs test error — underfit / fit / overfit');grid();let capacity=0.2+A/10,sample=15+B;
  function tr(x){return 75/(x+.65)+6}function te(x){return 75/(x+.65)+Math.pow(x,2)*80/sample+7}
  const p=[],q=[];for(let j=0;j<=600;j+=3){const x=.2+j/70;p.push([45+j,285-Math.min(245,tr(x)*2.2)]);q.push([45+j,285-Math.min(245,te(x)*2.2)]);}poly(p,blue,2.5);poly(q,orange,2.5);const xp=45+capacity*70;line(xp,60,xp,286,teal,2);text(45,43,'Train loss',blue);text(405,43,'Test loss',orange);
  note=`Capacity=${capacity.toFixed(2)}, sample scale=${sample}. Training loss ↓ байлаа гээд test loss заавал ↓ болохгүй. Curves are conceptual, not fitted experimental data.`;break;}
 case 'iou':{
  title('Bounding-box Intersection / Union');const dx=(A-50)*2.1,dy=(B-50)*1.4,a=[190,90,240,170],b=[190+dx,90+dy,240,170];
  ctx.fillStyle='#77a8ff55';ctx.fillRect(...a);ctx.fillStyle='#55d7c760';ctx.fillRect(...b);ctx.strokeStyle=blue;ctx.strokeRect(...a);ctx.strokeStyle=teal;ctx.strokeRect(...b);
  const iw=Math.max(0,Math.min(a[0]+a[2],b[0]+b[2])-Math.max(a[0],b[0])),ih=Math.max(0,Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1]));let inter=iw*ih,uni=2*a[2]*a[3]-inter,iou=inter/uni;
  text(50,40,`IoU=${iou.toFixed(3)}; intersection=${inter.toFixed(0)}px²`,ink,18);text(50,315,'Blue = GT; Green = prediction');note=`Box shift dx=${dx.toFixed(1)}px, dy=${dy.toFixed(1)}px. IoU=Area(intersection)/Area(union), range 0…1.`;break;}
 case 'attention':{
  title('Scaled dot-product attention: logits → softmax');const z=(A-50)/12,temp=.25+B/30,v1=1,v2=Math.exp(Math.max(-25,Math.min(25,z/temp))),p2=v2/(v1+v2);
  rect(150,278,100,-185*(1-p2),blue);rect(435,278,100,-185*p2,teal);text(155,302,`Key 1 ${(100*(1-p2)).toFixed(1)}%`,blue);text(441,302,`Key 2 ${(100*p2).toFixed(1)}%`,teal);text(85,63,`Δlogit=${z.toFixed(2)}, temperature=${temp.toFixed(2)}`,ink,18);
  note=`Softmax score weights sum1: [${(1-p2).toFixed(3)}, ${p2.toFixed(3)}]. Attention нь content-based weighting; physical correspondence proof биш.`;break;}
 }
 $('advCaption').textContent=note;
}
