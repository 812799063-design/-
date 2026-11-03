(() => {
'use strict';
const speeds={normal:{label:'普通',short:'1×',rate:1},fast:{label:'快速',short:'3×',rate:3},instant:{label:'即时',short:'即时',rate:Infinity}};
function buildFrames(result){
 const frames=(result.trace||[]).map((entry,index)=>{
  const previous=index?result.trace[index-1]:{chips:0,mult:0};
  const chips=Number.isFinite(entry.chips)?entry.chips:0,mult=Number.isFinite(entry.mult)?entry.mult:0;
  const addChips=entry.addChips??chips-previous.chips,addMult=entry.addMult??(entry.times&&entry.times!==1?0:mult-previous.mult),times=entry.times||1;
  const stage=entry.stage||(index===0?'base':'effect');
  const weight=({base:270,card:190,held:240,joker:290,consumable:260,balance:330,boss:300,effect:200}[stage]||200)+(times>1?70:0);
  return {...entry,index,stage,chips,mult,addChips,addMult,times,weight};
 });
 const scale=Math.min(1,6500/Math.max(1,frames.reduce((n,f)=>n+f.weight,0)));
 return frames.map(f=>({...f,duration:f.weight*scale}));
}
function delay(frame,speed='normal'){return speed==='instant'?0:frame.duration/(speeds[speed]?.rate||1);}
function tokens(frame){const values=[];if(frame.addChips)values.push({kind:'chips',text:(frame.addChips>0?'+':'')+format(frame.addChips)+' 筹码'});if(frame.addMult)values.push({kind:'mult',text:(frame.addMult>0?'+':'')+format(frame.addMult)+' 倍率'});if(frame.times!==1)values.push({kind:'multiply',text:'×'+format(frame.times)});if(frame.addMoney)values.push({kind:'money',text:'+$'+format(frame.addMoney)});return values;}
function format(n){return n.toLocaleString('en-US',{maximumFractionDigits:2});}
function easing(progress){return 1-(1-Math.max(0,Math.min(1,progress)))**3;}
globalThis.ScorePresentation={speeds,buildFrames,delay,tokens,easing};
})();
