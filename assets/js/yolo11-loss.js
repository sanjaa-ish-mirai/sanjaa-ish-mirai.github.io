/* Scalar teaching equivalents of the Detect objective. This is not a replacement
   for native assignment/reduction/autograd over an actual training batch. */
const YOLO11Loss = (() => {
  const sigmoid=z=>z>=0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));
  const bce=(z,target)=>Math.max(z,0)-z*target+Math.log1p(Math.exp(-Math.abs(z)));
  function softmax(logits){const max=Math.max(...logits),p=logits.map(v=>Math.exp(v-max)),sum=p.reduce((a,b)=>a+b,0);return p.map(v=>v/sum);}
  function dfl(logits,distance){
    const target=Math.max(0,Math.min(logits.length-1-.01,distance)),left=Math.floor(target),right=left+1;
    const max=Math.max(...logits),logsum=max+Math.log(logits.reduce((s,v)=>s+Math.exp(v-max),0));
    const probabilities=softmax(logits);
    return {target,left,right,leftWeight:right-target,rightWeight:target-left,probabilities,
      expected:probabilities.reduce((s,v,i)=>s+v*i,0),loss:(right-target)*(logsum-logits[left])+(target-left)*(logsum-logits[right])};
  }
  function ciou(a,b){
    const eps=1e-7,aw=a[2]-a[0],ah=a[3]-a[1]+eps,bw=b[2]-b[0],bh=b[3]-b[1]+eps;
    const intersection=Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0]))*Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]));
    const iou=intersection/(aw*ah+bw*bh-intersection+eps);
    const cw=Math.max(a[2],b[2])-Math.min(a[0],b[0]),ch=Math.max(a[3],b[3])-Math.min(a[1],b[1]);
    const centerDistance=((b[0]+b[2]-a[0]-a[2])**2+(b[1]+b[3]-a[1]-a[3])**2)/4;
    const v=4/Math.PI**2*(Math.atan(bw/bh)-Math.atan(aw/ah))**2,alpha=v/(v-iou+1+eps);
    return {iou,centerPenalty:centerDistance/(cw*cw+ch*ch+eps),aspectPenalty:alpha*v,value:iou-centerDistance/(cw*cw+ch*ch+eps)-alpha*v};
  }
  function example(p){
    const logits=Array.from({length:16},(_,i)=>-((i-p.peak)**2)/(2*p.temperature**2));
    const distribution=dfl(logits,p.target),geometry=ciou([8-p.width/2+p.shift,4,8+p.width/2+p.shift,12],[4,4,12,12]);
    const normalizer=Math.max(p.q,1),cls=bce(p.z,p.q)/normalizer;
    const box=p.q*(1-geometry.value)/normalizer,df=p.q*distribution.loss/normalizer;
    return {distribution,geometry,score:sigmoid(p.z),gradient:(sigmoid(p.z)-p.q)/normalizer,
      raw:{box,cls,dfl:df},weighted:{box:7.5*box,cls:.5*cls,dfl:1.5*df},total:7.5*box+.5*cls+1.5*df,
      alignment:sigmoid(p.z)**.5*Math.max(0,geometry.value)**6};
  }
  return {sigmoid,bce,softmax,dfl,ciou,example};
})();
