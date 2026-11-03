(() => {
'use strict';
const D=globalThis.GAME_DATA;
const copy=x=>JSON.parse(JSON.stringify(x));
const sum=(a,fn=x=>x)=>a.reduce((n,x)=>n+fn(x),0);
const notCopyable=new Set(['fingers','shortcut','smeared','splash','pareidolia','oops','showman','juggler','drunk','merry','troub','stunt','credit','astronomer','chaos','golden','egg','cloud','rocket','moon','delayed','trading','bones','luchador','chicot']);
const eternalExempt=new Set(['gros','cavendish','ice','popcorn','ramen','seltzer','bones','luchador']);
const perishableExempt=new Set(['runner','green','spare','square','constellation','redcard','hologram','rocket']);
class Game {
 constructor(saved){if(saved){this.s=copy(saved);const cards=new Map(this.s.deck.map(c=>[c.uid,c]));for(const key of ['hand','draw','played','discarded'])this.s[key]=this.s[key].map(c=>cards.get(c.uid)||c);if(this.s.pack?.hand)this.s.pack.hand=this.s.pack.hand.map(c=>cards.get(c.uid)||c);return;}this.s=null;}
 rand(){let t=this.s.rng+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);this.s.rng>>>=0;return((t^t>>>14)>>>0)/4294967296;}
 pick(a){return a[Math.floor(this.rand()*a.length)];}
 shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(this.rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 uid(){return 'c'+(++this.s.serial);}
 createCard(rank,suit,extra={}){return {uid:this.uid(),rank,suit,enh:null,edition:null,seal:null,bonus:0,...extra};}
 active(j){return j&&!(j.perishable&&j.life<=0)&&this.s.disabledJoker!==j.uid;}
 has(id){return this.s.jokers.some(j=>j.id===id&&this.active(j));}
 num(id){return this.s.jokers.filter(j=>j.id===id&&this.active(j)).length;}
 face(c){return c.enh!=='stone'&&(c.rank>=11&&c.rank<=13||this.has('pareidolia'));}
 v(id){return this.s.vouchers.includes(id);}
 boss(id){return ['playing','cashout'].includes(this.s.phase)&&this.s.blindIndex===2&&this.s.boss.id===id&&!this.s.bossDisabled&&!this.has('chicot');}
 baseTarget(){const rows=[[300,800,2000,5000,11000,20000,35000,50000],[300,900,2600,8000,20000,36000,60000,100000],[300,1000,3200,9000,25000,60000,110000,200000]];const row=rows[this.s.stake>=5?2:this.s.stake>=2?1:0];if(this.s.ante<1)return 100;if(this.s.ante<=8)return row[this.s.ante-1];const c=this.s.ante-8,n=Math.floor(row[7]*(1.6+(0.75*c)**(1+0.2*c))**c);const p=10**Math.max(0,Math.floor(Math.log10(n))-1);return Math.floor(n/p)*p;}
 target(){let f=[1,1.5,this.s.boss.factor][this.s.blindIndex];if(this.s.blindIndex===2&&(this.s.bossDisabled||this.has('chicot'))&&['wall','vessel'].includes(this.s.boss.id))f=2;return this.baseTarget()*f*(this.s.deckId==='plasma'?2:1);}
 handSize(){return Math.max(1,8+(this.s.deckId==='painted'?2:0)+this.num('juggler')-this.num('merry')+this.num('troub')*2-this.num('stunt')*2+Number(this.v('brush'))+Number(this.v('palette'))-this.s.sizePenalty+(this.s.roundHandBonus||0)-(this.boss('manacle')?1:0));}
 handsPerRound(){return Math.max(1,4+(this.s.deckId==='blue'?1:0)-(this.s.deckId==='black'?1:0)-this.num('troub')+Number(this.v('grabber'))+Number(this.v('grabber2'))-Number(this.v('hieroglyph')));}
 discardsPerRound(){return Math.max(0,3+(this.s.deckId==='red'?1:0)-(this.s.stake>=4?1:0)+this.num('drunk')+3*this.num('merry')+Number(this.v('waste'))+Number(this.v('waste2'))-Number(this.v('petroglyph')));}
 jokerSlots(){return 5+(this.s.deckId==='black'?1:0)-(this.s.deckId==='painted'?1:0)+Number(this.v('antimatter'))+this.s.jokers.filter(j=>j.edition==='negative').length;}
 consumableSlots(){return 2-(this.s.deckId==='nebula'?1:0)+Number(this.v('crystal'))+this.s.consumables.filter(c=>c.edition==='negative').length;}
 effective(){return this.s.jokers.filter(j=>this.active(j)).map(source=>{let j=source,seen=new Set();while(['blueprint','brainstorm'].includes(j.id)){if(seen.has(j.uid))return null;seen.add(j.uid);j=j.id==='blueprint'?this.s.jokers[this.s.jokers.indexOf(j)+1]:this.s.jokers[0];if(!j||!this.active(j))return null;}if(source!==j&&notCopyable.has(j.id))return null;return {source,j};}).filter(Boolean);}
 effects(id){return this.effective().filter(e=>e.j.id===id);}
 log(message){this.s.events.unshift(message);this.s.events=this.s.events.slice(0,60);}
 start(deckId='red',stake=0,seed=''){
  let n=2166136261;const seedText=seed||Math.random().toString(36).slice(2,10).toUpperCase();for(const c of seedText)n=Math.imul(n^c.charCodeAt(0),16777619);
  this.s={version:1,seed:seedText,rng:n>>>0,serial:0,deckId,stake,ante:1,blindIndex:0,round:0,phase:'blinds',money:deckId==='yellow'?14:4,jokers:[],consumables:[],vouchers:[],levels:Object.fromEntries(D.hands.map(h=>[h.id,1])),counts:Object.fromEntries(D.hands.map(h=>[h.id,0])),discovered:[],deck:[],hand:[],draw:[],played:[],discarded:[],selected:[],score:0,hands:4,discards:3,boss:null,bossUses:{},bossDisabled:false,disabledJoker:null,roundCounts:{},antePlayed:[],tags:[],skipTags:[],skips:0,totalHands:0,totalUnusedDiscards:0,totalTarots:0,ectoUses:0,sizePenalty:0,nextHandBonus:0,roundHandBonus:0,usedDiscards:0,bonusSell:0,grosExtinct:false,lastConsumable:null,pack:null,shop:null,result:null,lastScore:null,events:[],won:false,endless:false,stats:{bestHand:0,totalScore:0}};
  if(deckId==='magic'){this.s.vouchers.push('crystal');this.addConsumable('tarot','fool');this.addConsumable('tarot','fool');}
  if(deckId==='nebula')this.s.vouchers.push('telescope');
  if(deckId==='ghost')this.addConsumable('spectral','hex');
  if(deckId==='zodiac')this.s.vouchers.push('tarot','planet','overstock');
  for(const suit of D.suits)for(let rank=2;rank<=14;rank++){if(deckId==='abandoned'&&rank>=11&&rank<=13)continue;this.s.deck.push(this.createCard(deckId==='erratic'?2+Math.floor(this.rand()*13):rank,deckId==='erratic'?this.pick(D.suits):deckId==='checkered'?({C:'S',D:'H'}[suit]||suit):suit));}
  this.chooseBoss();this.makeSkipTags();this.s.currentVouchers=[this.randomVoucher()];this.log('新的一局开始了。先选择小盲注。');return this;
 }
 chooseBoss(){const pool=D.bosses.filter(b=>this.s.ante%8===0?b.final:!b.final&&b.min<=Math.max(1,this.s.ante));const min=Math.min(...pool.map(b=>this.s.bossUses[b.id]||0));this.s.boss=copy(this.pick(pool.filter(b=>(this.s.bossUses[b.id]||0)===min)));this.s.bossUses[this.s.boss.id]=(this.s.bossUses[this.s.boss.id]||0)+1;this.s.oxHand=this.mostPlayed();this.s.bossRerolls=0;}
 mostPlayed(){return D.hands.reduce((best,h)=>this.s.counts[h.id]>this.s.counts[best]?h.id:best,'high');}
 randomTag(){const excluded=this.s.ante===1?['negative','standard','meteor','buffoon','handy','garbage','ethereal','topup','orbital']:[];const t=copy(this.pick(D.tags.filter(t=>!excluded.includes(t.id))));if(t.id==='orbital')t.hand=this.pick(D.hands.filter((h,i)=>i<9||this.s.discovered.includes(h.id))).id;return t;}
 makeSkipTags(){this.s.skipTags=[this.randomTag(),this.randomTag()];}
 randomVoucher(){const eligible=D.vouchers.filter(v=>!this.v(v.id)&&(!v.requires||this.v(v.requires)));return this.pick(eligible)||D.vouchers.find(v=>v.id==='blank');}
 rankValue(c){return c.enh==='stone'?50:c.rank===14?11:Math.min(c.rank,10);}
 cardSuit(c,suit){if(c.enh==='stone')return false;if(c.enh==='wild'&&!this.debuff(c))return true;if(this.has('smeared'))return ['H','D'].includes(c.suit)===['H','D'].includes(suit);return c.suit===suit;}
 debuff(c){if(!['playing','cashout'].includes(this.s.phase)||this.s.blindIndex!==2||this.s.bossDisabled||this.has('chicot'))return false;if(this.boss('leaf'))return true;if(this.boss('pillar')&&this.s.antePlayed.includes(c.uid))return true;if(this.boss('plant')&&this.face(c))return true;const suit={club:'C',goad:'S',window:'D',head:'H'}[this.s.boss.id];return !!suit&&c.enh!=='stone'&&(c.enh==='wild'||(this.has('smeared')?['H','D'].includes(c.suit)===['H','D'].includes(suit):c.suit===suit));}
 classify(cards){
  const plain=cards.filter(c=>c.enh!=='stone'),groups=new Map();for(const c of plain){if(!groups.has(c.rank))groups.set(c.rank,[]);groups.get(c.rank).push(c);}const gs=[...groups.values()].sort((a,b)=>b.length-a.length||b[0].rank-a[0].rank),need=this.has('fingers')?4:5;
  const flush=D.suits.map(s=>plain.filter(c=>this.cardSuit(c,s))).find(a=>a.length>=need)||[];
  let ranks=[...groups.keys()].sort((a,b)=>a-b);if(ranks.includes(14))ranks=[1,...ranks];let straight=[];
  for(let start=0;start<ranks.length;start++){let line=[ranks[start]];for(let i=start+1;i<ranks.length;i++){const delta=ranks[i]-line.at(-1);if(delta>(this.has('shortcut')?2:1))break;line.push(ranks[i]);}if(line.length>=need){const valid=new Set(line.slice(-need).map(r=>r===1?14:r));straight=plain.filter(c=>valid.has(c.rank));}}
  const five=gs.find(a=>a.length===5)||[],four=gs.find(a=>a.length===4)||[],three=gs.find(a=>a.length===3)||[],pairs=gs.filter(a=>a.length===2),house=three.length&&pairs.length;
  const contains={pair:gs.some(a=>a.length>=2),three:gs.some(a=>a.length>=3),four:gs.some(a=>a.length>=4),two:pairs.length>=2||!!house,straight:!!straight.length,flush:!!flush.length};
  let id,scoring;if(five.length&&flush.length){id='ff';scoring=plain;}else if(house&&flush.length){id='fh';scoring=plain;}else if(five.length){id='five';scoring=five;}else if(straight.length&&flush.length){id='sf';scoring=[...new Set([...straight,...flush])];}else if(four.length){id='four';scoring=four;}else if(house){id='house';scoring=[...three,...pairs[0]];}else if(flush.length){id='flush';scoring=flush;}else if(straight.length){id='straight';scoring=straight;}else if(three.length){id='three';scoring=three;}else if(pairs.length>=2){id='two';scoring=pairs.slice(0,2).flat();}else if(pairs.length){id='pair';scoring=pairs[0];}else{id='high';scoring=plain.length?[plain.reduce((a,b)=>a.rank>=b.rank?a:b)]:[];}
  const ids=new Set(scoring.map(c=>c.uid));scoring=cards.filter(c=>this.has('splash')||c.enh==='stone'||ids.has(c.uid));return {id,scoring,contains,royal:id==='sf'&&scoring.filter(c=>c.enh!=='stone').every(c=>c.rank>=10)};
 }
 handInfo(id){const h=D.hands.find(h=>h.id===id),l=this.s.levels[id];return {...h,level:l,chips:h.chips+(l-1)*h.dc,mult:h.mult+(l-1)*h.dm};}
 levelUp(id,n=1){this.s.levels[id]=Math.max(1,this.s.levels[id]+n);}
 activeHand(){return this.s.pack?.hand||this.s.hand;}
 select(uid){const hand=this.activeHand();if(!hand.some(c=>c.uid===uid))return;if(this.s.forced===uid&&this.s.phase==='playing')return;if(this.s.selected.includes(uid))this.s.selected=this.s.selected.filter(x=>x!==uid);else if(this.s.selected.length<5)this.s.selected.push(uid);}
 selectedCards(){return this.activeHand().filter(c=>this.s.selected.includes(c.uid));}
 sortHand(mode){this.activeHand().sort((a,b)=>mode==='suit'?D.suits.indexOf(a.suit)-D.suits.indexOf(b.suit)||b.rank-a.rank:b.rank-a.rank||D.suits.indexOf(a.suit)-D.suits.indexOf(b.suit));}
 moveCard(uid,delta){const a=this.activeHand(),i=a.findIndex(c=>c.uid===uid),j=i+delta;if(i>=0&&j>=0&&j<a.length)[a[i],a[j]]=[a[j],a[i]];}
 moveJoker(uid,delta){const a=this.s.jokers,i=a.findIndex(c=>c.uid===uid),j=i+delta;if(i>=0&&j>=0&&j<a.length)[a[i],a[j]]=[a[j],a[i]];}
 drawCards(initial=false,afterPlay=false){let count=this.boss('serpent')&&!initial?3:Math.max(0,this.handSize()-this.s.hand.length);while(count-->0&&this.s.draw.length){const c=this.s.draw.pop();c.faceDown=this.boss('house')&&initial||this.boss('wheel')&&this.chance(7)||this.boss('fish')&&afterPlay||this.boss('mark')&&this.face(c);this.s.hand.push(c);}this.sortHand('rank');this.setForced();}
 chance(denom){return this.rand()<Math.min(1,2**this.num('oops')/denom);}
 setForced(){this.s.forced=this.boss('bell')&&this.s.hand.length?this.pick(this.s.hand).uid:null;this.s.selected=this.s.forced?[this.s.forced]:[];}
 startBlind(){if(this.s.phase!=='blinds')throw Error('请先完成当前场次。');this.s.phase='playing';this.s.round++;this.s.score=0;this.s.lastScore=null;this.s.bossDisabled=false;this.s.disabledJoker=null;this.s.roundCounts={};this.s.roundHandBonus=this.s.nextHandBonus;this.s.nextHandBonus=0;this.s.hands=this.boss('needle')?1:this.handsPerRound();this.s.discards=this.boss('water')?0:this.discardsPerRound();this.s.usedDiscards=0;this.s.hand=[];this.s.draw=this.shuffle([...this.s.deck]);this.s.played=[];this.s.discarded=[];for(const c of this.s.deck)c.faceDown=false;
  if(this.boss('acorn')){this.shuffle(this.s.jokers);this.s.jokers.forEach(j=>j.faceDown=true);}if(this.boss('heart'))this.disableRandomJoker();
  for(const {j} of this.effective()){if(j.id==='carto')this.addRandomConsumable('tarot');if(j.id==='riff')for(let i=0;i<2;i++)if(this.s.jokers.length<this.jokerSlots())this.s.jokers.push(this.makeJoker(this.randomJoker(1)));}
  this.drawCards(true);this.log('进入'+this.blindName()+'，目标 '+this.target().toLocaleString()+'。');
 }
 blindName(){return ['小盲注','大盲注',this.s.boss.name][this.s.blindIndex];}
 disableRandomJoker(){const a=this.s.jokers.filter(j=>!(j.perishable&&j.life<=0));const previous=this.s.disabledJoker;const choices=a.filter(j=>j.uid!==previous);this.s.disabledJoker=(this.pick(choices.length?choices:a)||{}).uid||null;}
 addToDeck(c,drawToHand=false){this.s.deck.push(c);for(const j of this.s.jokers)if(j.id==='hologram'&&this.active(j))j.value+=0.25;if(drawToHand)this.s.hand.push(c);}
 destroyCards(cards){const ids=new Set(cards.map(c=>c.uid));for(const c of cards)if(this.face(c))for(const j of this.s.jokers)if(j.id==='canio'&&this.active(j))j.value+=1;this.s.deck=this.s.deck.filter(c=>!ids.has(c.uid));this.s.hand=this.s.hand.filter(c=>!ids.has(c.uid));this.s.draw=this.s.draw.filter(c=>!ids.has(c.uid));if(this.s.pack?.hand)this.s.pack.hand=this.s.pack.hand.filter(c=>!ids.has(c.uid));this.s.selected=this.s.selected.filter(id=>!ids.has(id));}
 cloneCard(c){return {...copy(c),uid:this.uid(),faceDown:false};}
 discardCards(cards,isHook=false){if(!isHook){for(const {j} of this.effective())if(j.id==='burnt'&&this.s.usedDiscards===0)this.levelUp(this.classify(cards).id);}
  for(const j of [...this.s.jokers].filter(j=>this.active(j))){if(j.id==='green')j.value=Math.max(0,j.value-1);if(j.id==='ramen'){j.value=Math.max(1,j.value-cards.length*0.01);if(j.value<=1)this.removeJoker(j);}if(j.id==='yorick'){j.progress=(j.progress||0)+cards.length;while(j.progress>=23){j.progress-=23;j.value+=1;}}}for(const _ of this.effects('faceless'))if(cards.filter(c=>this.face(c)).length>=3)this.s.money+=5;
  for(const c of cards)if(c.seal==='purple'&&!this.debuff(c))this.addRandomConsumable('tarot');
  if(!isHook&&this.s.usedDiscards===0&&cards.length===1&&this.has('trading')){this.destroyCards(cards);this.s.money+=3*this.num('trading');}else{this.s.hand=this.s.hand.filter(c=>!cards.includes(c));this.s.discarded.push(...cards);}this.s.selected=[];
 }
 discard(){if(this.s.phase!=='playing'||!this.s.discards)throw Error('没有剩余弃牌次数。');const cards=this.selectedCards();if(!cards.length)throw Error('先选择要弃掉的牌。');this.discardCards(cards);this.s.usedDiscards++;this.s.discards--;this.drawCards();this.checkEmpty();}
 checkEmpty(){if(!this.s.hand.length&&this.s.phase==='playing')this.finishRound(false);}
 play(){
  if(this.s.phase!=='playing'||!this.s.hands)throw Error('当前不能出牌。');const cards=this.selectedCards();if(!cards.length)throw Error('先选择 1—5 张牌。');const info=this.classify(cards),previous=this.s.roundCounts[info.id]||0;
  this.s.hand=this.s.hand.filter(c=>!cards.includes(c));this.s.played.push(...cards);cards.forEach(c=>c.faceDown=false);this.s.hands--;this.s.totalHands++;this.s.counts[info.id]++;this.s.roundCounts[info.id]=previous+1;const first=this.s.firstHandType;this.s.firstHandType=first||info.id;
  if(['five','fh','ff'].includes(info.id)&&!this.s.discovered.includes(info.id))this.s.discovered.push(info.id);
  const refused=this.boss('psychic')&&cards.length!==5||this.boss('eye')&&previous>0||this.boss('mouth')&&first&&first!==info.id;
  if(this.boss('hook'))this.discardCards(this.shuffle([...this.s.hand]).slice(0,2),true);
  if(this.boss('tooth'))this.s.money-=cards.length;if(this.boss('ox')&&info.id===this.s.oxHand)this.s.money=0;
  if(this.boss('arm')&&!refused)this.levelUp(info.id,-1);
  if(!refused){for(const j of this.s.jokers.filter(j=>this.active(j))){if(j.id==='runner'&&info.contains.straight)j.value+=15;if(j.id==='green')j.value++;if(j.id==='spare'&&info.contains.two)j.value+=2;if(j.id==='square'&&cards.length===4)j.value+=4;}
   if(sum(Object.values(this.s.roundCounts))===1&&cards.length===1)for(const _ of this.effects('dna'))this.addToDeck(this.cloneCard(cards[0]),true);
  }
  let h=this.handInfo(info.id),chips=h.chips,mult=h.mult,trace=[],traceContext={stage:'base'};const step=(label,c=0,m=0,x=1,extra={})=>{chips+=c;mult=(mult+m)*x;trace.push({...traceContext,...extra,label,chips,mult,addChips:c,addMult:m,times:x});};
  if(refused){chips=0;mult=0;trace.push({stage:'boss',label:'Boss 拒绝该手牌：消耗一次出牌，得分为 0',chips:0,mult:0});}
  else{
   trace.push({stage:'base',label:h.name+' Lv.'+h.level+' 基础分',chips,mult});if(this.boss('flint')){chips=Math.round(chips/2);mult=Math.max(1,Math.round(mult/2));trace.push({stage:'boss',label:'燧石：基础筹码、倍率减半',chips,mult});}
   let firstFace=info.scoring.find(c=>this.face(c));const glass=[];
   for(let index=0;index<info.scoring.length;index++){
    const c=info.scoring[index];if(this.debuff(c)){trace.push({stage:'card',cardUid:c.uid,debuffed:true,label:this.cardName(c)+' 已失效',chips,mult});continue;}
    const effects=this.effective();let repeats=1+(c.seal==='red'?1:0)+sum(effects,e=>e.j.id==='chad'&&index===0?2:e.j.id==='hack'&&[2,3,4,5].includes(c.rank)&&c.enh!=='stone'?1:e.j.id==='sock'&&this.face(c)?1:e.j.id==='dusk'&&this.s.hands===0?1:e.j.id==='seltzer'?1:0);
    const repeatSources=[];if(c.seal==='red')repeatSources.push(null);for(const {source,j} of effects){const count=j.id==='chad'&&index===0?2:j.id==='hack'&&[2,3,4,5].includes(c.rank)&&c.enh!=='stone'?1:j.id==='sock'&&this.face(c)?1:j.id==='dusk'&&this.s.hands===0?1:j.id==='seltzer'?1:0;for(let k=0;k<count;k++)repeatSources.push(source.uid);}
    for(let r=0;r<repeats;r++){
     traceContext={stage:'card',cardUid:c.uid,pass:r,retrigger:r>0,retriggerJokerUid:repeatSources[r-1]||null};
     const label=this.cardName(c)+(r?' · 重触发':'');step(label,this.rankValue(c)+(c.bonus||0)+(c.enh==='bonus'?30:0));
     if(c.enh==='mult')step('倍率牌',0,4);if(c.enh==='lucky'){if(this.chance(5))step('幸运牌',0,20);if(this.chance(15)){this.s.money+=20;trace.push({...traceContext,addMoney:20,label:'幸运牌 +$20',chips,mult});}}if(c.enh==='glass')step('玻璃牌',0,0,2);if(c.seal==='gold'){this.s.money+=3;step('金封 +$3',0,0,1,{addMoney:3});}
     if(c.edition==='foil')step('闪箔',50);if(c.edition==='holo')step('全息',0,10);if(c.edition==='poly')step('多彩',0,0,1.5);
     for(const {source,j} of effects){const id=j.id,name=this.jokerName(j);const jokerStep=(label,c=0,m=0,x=1)=>step(label,c,m,x,{jokerUid:source.uid,abilityUid:j.uid});if(id==='scholar'&&c.rank===14&&c.enh!=='stone')jokerStep(name,20,4);if(id==='even'&&[2,4,6,8,10].includes(c.rank)&&c.enh!=='stone')jokerStep(name,0,4);if(id==='odd'&&[3,5,7,9,14].includes(c.rank)&&c.enh!=='stone')jokerStep(name,31);if(id==='fib'&&[2,3,5,8,14].includes(c.rank)&&c.enh!=='stone')jokerStep(name,0,8);if(id==='smiley'&&this.face(c))jokerStep(name,0,5);if(id==='scary'&&this.face(c))jokerStep(name,30);if(id==='photograph'&&c===firstFace)jokerStep(name,0,0,2);if(id==='triboulet'&&[12,13].includes(c.rank)&&c.enh!=='stone')jokerStep(name,0,0,2);if(id==='hiker'){c.bonus+=5;jokerStep(name+' · 永久 +5 筹码');}}
    }if(c.enh==='glass')glass.push(c);
   }
   for(const c of this.s.hand){if(this.debuff(c))continue;const mimes=this.effects('mime'),repeats=1+(c.seal==='red'?1:0)+mimes.length;const sources=[...(c.seal==='red'?[null]:[]),...mimes.map(e=>e.source.uid)];for(let i=0;i<repeats;i++){traceContext={stage:'held',cardUid:c.uid,pass:i,retrigger:i>0,retriggerJokerUid:sources[i-1]||null};if(c.enh==='steel')step(this.cardName(c)+' 留手钢铁',0,0,1.5);for(const {source,j} of this.effective()){if(j.id==='baron'&&c.rank===13&&c.enh!=='stone')step('男爵 · 留手 K',0,0,1.5,{jokerUid:source.uid,abilityUid:j.uid});if(j.id==='shoot'&&c.rank===12&&c.enh!=='stone')step('射月 · 留手 Q',0,13,1,{jokerUid:source.uid,abilityUid:j.uid});}}}
   for(const source of this.s.jokers){if(!this.active(source))continue;traceContext={stage:'joker',jokerUid:source.uid};if(source.edition==='foil')step('闪箔小丑',50);if(source.edition==='holo')step('全息小丑',0,10);const found=this.effective().find(e=>e.source===source);if(found){const j=found.j,id=j.id,name=this.jokerName(j),contains=info.contains;let ac=0,am=0,x=1;
     const addHands={jolly:['pair',8],zany:['three',12],mad:['two',10],crazy:['straight',12],droll:['flush',10]},chipHands={sly:['pair',50],wily:['three',100],clever:['two',80],devious:['straight',100],crafty:['flush',80]},timesHands={duo:['pair',2],trio:['three',3],family:['four',4],order:['straight',3],tribe:['flush',2]};
     if(addHands[id]&&contains[addHands[id][0]])am=addHands[id][1];if(chipHands[id]&&contains[chipHands[id][0]])ac=chipHands[id][1];if(timesHands[id]&&contains[timesHands[id][0]])x=timesHands[id][1];
     if(id==='joker')am=4;if(id==='half'&&cards.length<=3)am=20;if(id==='abstract')am=this.s.jokers.length*3;if(id==='banner')ac=this.s.discards*30;if(id==='mystic'&&this.s.discards===0)am=15;if(id==='misprint')am=Math.floor(this.rand()*24);
     if(id==='blackboard'&&this.s.hand.every(c=>this.cardSuit(c,'S')||this.cardSuit(c,'C')))x=3;if(id==='cardsharp'&&previous)x=3;if(id==='acrobat'&&this.s.hands===0)x=3;
     if(['runner','square','ice'].includes(id))ac=j.value;if(['green','spare','popcorn','redcard'].includes(id))am=j.value;if(['constellation','ramen','hologram','canio','yorick'].includes(id))x=j.value;
     if(id==='fortune')am=this.s.totalTarots;if(id==='supernova')am=this.s.counts[info.id];if(id==='blue')ac=this.s.draw.length*2;if(id==='gros')am=15;if(id==='cavendish')x=3;if(id==='bull')ac=Math.max(0,this.s.money)*2;if(id==='boots')am=Math.max(0,Math.floor(this.s.money/5))*2;if(id==='steel')x=1+this.s.deck.filter(c=>c.enh==='steel').length*0.2;if(id==='stone')ac=this.s.deck.filter(c=>c.enh==='stone').length*25;if(id==='license'&&this.s.deck.filter(c=>c.enh).length>=16)x=3;if(id==='stunt')ac=250;if(id==='throwback')x=1+this.s.skips*0.25;
     if(ac||am||x!==1)step((source!==j?this.jokerName(source)+' → ':'')+name,ac,am,x);
    }if(source.edition==='poly')step('多彩小丑',0,0,1.5);
   }
   if(this.v('observatory'))for(const c of this.s.consumables)if(c.type==='planet'&&c.id===info.id){traceContext={stage:'consumable',consumableUid:c.uid};step('天文台 · '+h.planet,0,0,1.5);}
   if(this.s.deckId==='plasma'){chips=mult=Math.floor((chips+mult)/2);trace.push({stage:'balance',label:'等离子平衡',chips,mult});}
   for(const c of glass)if(this.chance(4)){this.destroyCards([c]);this.log(this.cardName(c)+' 碎裂了。');}
  }
  const score=Math.floor(chips*mult);this.s.score+=score;this.s.stats.bestHand=Math.max(this.s.stats.bestHand,score);this.s.stats.totalScore+=score;this.s.lastScore={id:info.id,name:info.royal?'皇家同花顺':h.name,score,chips,mult,trace,cards:copy(cards),scoringIds:info.scoring.map(c=>c.uid),refused};this.log((info.royal?'皇家同花顺':h.name)+'：'+score.toLocaleString()+' 分。');
  for(const j of [...this.s.jokers])if(this.active(j)){if(j.id==='ice'){j.value-=5;if(j.value<=0)this.removeJoker(j);}if(j.id==='seltzer'){j.duration--;if(j.duration<=0)this.removeJoker(j);}}
  this.s.antePlayed.push(...cards.map(c=>c.uid));this.s.selected=[];
  if(this.s.score>=this.target())this.finishRound(true);else if(this.s.hands<=0)this.finishRound(false);else{if(this.boss('heart'))this.disableRandomJoker();this.drawCards(false,true);this.checkEmpty();}
  return this.s.lastScore;
 }
 finishRound(won){
  if(!won){const bones=this.s.jokers.find(j=>j.id==='bones'&&this.active(j));if(bones&&this.s.score>=this.target()*0.25){won=true;this.removeJoker(bones);this.log('骷髅先生救回了本场。');this.s.savedByBones=true;}}
  if(!won){this.s.phase='gameover';this.log('本场未达到目标。');return;}
  const details=[];const add=(label,amount)=>{if(amount)details.push({label,amount});};
  for(const c of this.s.hand)if(!this.debuff(c)){const times=1+(c.seal==='red'?1:0)+this.effects('mime').length;if(c.enh==='gold'){this.s.money+=3*times;this.log('黄金留手牌 +$'+3*times);}if(c.seal==='blue')for(let i=0;i<times;i++)this.addConsumable('planet',this.s.lastScore.id);}
  for(const j of [...this.s.jokers]){if(j.rental)this.s.money-=3;if(!this.active(j))continue;if(j.id==='golden')add('黄金小丑',4);if(j.id==='egg')j.extraSell+=3;if(j.id==='cloud')add('九霄云外',this.s.deck.filter(c=>c.rank===9&&c.enh!=='stone').length);if(j.id==='rocket'){if(this.s.blindIndex===2)j.value+=2;add('火箭',j.value);}if(j.id==='delayed'&&this.s.usedDiscards===0)add('延迟满足',this.s.discards*2);if(j.id==='popcorn'){j.value-=4;if(j.value<=0)this.removeJoker(j);}if(j.id==='gros'&&this.chance(6)){this.removeJoker(j);this.s.grosExtinct=true;this.log('大麦克香蕉消失，卡文迪许已进入本局生成池。');}if(j.id==='cavendish'&&this.chance(1000))this.removeJoker(j);}
  const cap=this.v('tree')?20:this.v('seed')?10:5;const interest=this.s.deckId==='green'?0:Math.max(0,Math.min(Math.floor(this.s.money/5),cap))*(1+this.num('moon'));
  const reward=this.s.savedByBones?0:this.s.blindIndex===0?(this.s.stake>=1?0:3):this.s.blindIndex===1?4:this.s.boss.final?8:5;this.s.savedByBones=false;
  add('盲注奖金',reward);add('剩余出牌 × '+(this.s.deckId==='green'?'$2':'$1'),this.s.hands*(this.s.deckId==='green'?2:1));if(this.s.deckId==='green')add('剩余弃牌 × $1',this.s.discards);add('存款利息',interest);
  if(this.s.blindIndex===2){for(const t of this.s.tags.filter(t=>t.id==='investment'))add('投资标签',25);this.s.tags=this.s.tags.filter(t=>t.id!=='investment');if(this.s.deckId==='anaglyph')this.s.tags.push({id:'double'});}
  for(const j of this.s.jokers)if(j.perishable&&j.life>0)j.life--;
  this.s.totalUnusedDiscards+=this.s.discards;this.s.result={details,total:sum(details,d=>d.amount),wonRun:this.s.ante>=8&&this.s.blindIndex===2&&!this.s.won};if(this.s.result.wonRun)this.s.won=true;this.s.phase='cashout';
 }
 cashout(){if(this.s.phase!=='cashout')return;this.s.money+=this.s.result.total;if(this.s.result.wonRun)this.s.endless=true;this.s.firstHandType=null;this.s.disabledJoker=null;this.s.jokers.forEach(j=>j.faceDown=false);this.s.hand=[];this.s.selected=[];this.makeShop();this.s.phase='shop';}
 leaveShop(){if(this.s.phase!=='shop')return;for(const _ of this.effects('perkeo')){if(this.s.consumables.length){const c=copy(this.pick(this.s.consumables));c.uid=this.uid();c.edition='negative';this.s.consumables.push(c);}}
  this.s.shop=null;this.s.blindIndex++;if(this.s.blindIndex>2){this.s.blindIndex=0;this.s.ante++;this.s.antePlayed=[];this.chooseBoss();this.makeSkipTags();this.s.currentVouchers=[this.randomVoucher()];}this.s.phase='blinds';
 }
 skip(){if(this.s.phase!=='blinds'||this.s.blindIndex===2)throw Error('Boss 不能跳过。');const tag=copy(this.s.skipTags[this.s.blindIndex]);this.s.skips++;this.s.blindIndex++;this.takeTag(tag);this.log('跳过盲注，获得'+(D.tags.find(t=>t.id===tag.id)?.name||'')+'标签。');}
 takeTag(tag){let count=1;if(tag.id!=='double'){count+=this.s.tags.filter(t=>t.id==='double').length;this.s.tags=this.s.tags.filter(t=>t.id!=='double');}for(let i=0;i<count;i++)this.applyTag(copy(tag));}
 applyTag(t){const id=t.id;if(['charm','meteor','standard','buffoon','ethereal'].includes(id)){this.s.packQueue=this.s.packQueue||[];this.s.packQueue.push({type:({charm:'arcana',meteor:'celestial',standard:'standard',buffoon:'buffoon',ethereal:'spectral'})[id],size:id==='ethereal'?0:2,free:true});if(!this.s.pack)this.openPack(this.s.packQueue.shift(),true);return;}
  if(id==='boss'){this.chooseBoss();return;}if(id==='handy'){this.s.money+=this.s.totalHands;return;}if(id==='garbage'){this.s.money+=this.s.totalUnusedDiscards;return;}if(id==='speed'){this.s.money+=this.s.skips*5;return;}if(id==='economy'){this.s.money+=Math.min(40,Math.max(0,this.s.money));return;}if(id==='juggle'){this.s.nextHandBonus+=3;return;}if(id==='orbital'){this.levelUp(t.hand,3);return;}if(id==='topup'){for(let i=0;i<2;i++)if(this.s.jokers.length<this.jokerSlots())this.s.jokers.push(this.makeJoker(this.randomJoker(1)));return;}this.s.tags.push(t);
 }
 makeJoker(def,fromShop=false){if(typeof def==='string')def=D.jokers.find(j=>j.id===def);const values={ice:100,popcorn:20,ramen:2,constellation:1,hologram:1,canio:1,yorick:1,rocket:1};const j={...copy(def),uid:this.uid(),value:values[def.id]??0,extraSell:0,edition:null,life:5,duration:10,progress:0};if(fromShop){j.edition=this.rollEdition();const roll=this.rand();if(this.s.stake>=3&&roll>0.7&&!eternalExempt.has(j.id))j.eternal=true;else if(this.s.stake>=6&&roll>0.4&&roll<=0.7&&!perishableExempt.has(j.id))j.perishable=true;if(this.s.stake>=7&&this.rand()<0.3)j.rental=true;}return j;}
 randomJoker(rarity,used=[]){if(!rarity){const r=this.rand();rarity=r<0.7?1:r<0.95?2:3;}let pool=D.jokers.filter(j=>j.rarity===rarity&&(!this.s.jokers.some(x=>x.id===j.id)&&!used.includes(j.id)||this.has('showman'))&&(j.id!=='cavendish'||this.s.grosExtinct)&&(j.id!=='gros'||!this.s.grosExtinct)&&(j.id!=='steel'||this.s.deck.some(c=>c.enh==='steel'))&&(j.id!=='stone'||this.s.deck.some(c=>c.enh==='stone')));return this.pick(pool)||D.jokers[0];}
 rollEdition(includeNegative=true){const r=this.rand(),factor=this.v('hone2')?4:this.v('hone')?2:1;if(includeNegative&&r<0.003)return 'negative';if(r<0.003+0.003*(factor===4?7:factor===2?3:1))return 'poly';if(r<0.003+0.017*factor)return 'holo';if(r<0.003+0.037*factor)return 'foil';return null;}
 randomConsumable(type,used=[]){let pool=type==='planet'?D.hands.filter((h,i)=>i<9||this.s.discovered.includes(h.id)).map(h=>({...h,type:'planet',name:h.planet,desc:h.name+'升一级：+'+h.dc+' 筹码，+'+h.dm+' 倍率',cost:3})):type==='tarot'?D.tarots:D.spectrals.filter(c=>!['soul','blackhole'].includes(c.id));if(!this.has('showman'))pool=pool.filter(c=>!this.s.consumables.some(x=>x.type===type&&x.id===c.id)&&!used.includes(c.id));return copy(this.pick(pool)||(type==='tarot'?D.tarots.find(c=>c.id==='strength'):type==='planet'?{...D.hands[0],type:'planet',name:'冥王星',cost:3}:D.spectrals.find(c=>c.id==='incantation')));}
 addConsumable(type,id){if(this.s.consumables.length>=this.consumableSlots())return false;const def=type==='planet'?{...D.hands.find(c=>c.id===id),type:'planet',name:D.hands.find(c=>c.id===id).planet,cost:3}:copy((type==='tarot'?D.tarots:D.spectrals).find(c=>c.id===id));if(!def)return false;this.s.consumables.push({...def,uid:this.uid()});return true;}
 addRandomConsumable(type){if(this.s.consumables.length>=this.consumableSlots())return false;const c=this.randomConsumable(type);this.s.consumables.push({...c,uid:this.uid()});return true;}
 price(item){if(item.free)return 0;if(item.rental)return 1;if(this.has('astronomer')&&(item.type==='planet'||item.type==='celestial'))return 0;const extra={foil:2,holo:3,poly:5,negative:5}[item.edition]||0;return Math.max(1,Math.floor(((item.cost||0)+extra+0.5)*(this.v('sale2')?0.5:this.v('sale')?0.75:1)));}
 sellValue(item){return Math.max(1,Math.floor(this.price({...item,free:false})/2))+(item.extraSell||0);}
 canAfford(cost){return this.s.money-cost>=(this.has('credit')?-20:0);}
 pay(cost){if(!this.canAfford(cost))throw Error('资金不足。');this.s.money-=cost;}
 makeShop(){this.s.shop={cards:[],packs:[],vouchers:[],rerolls:0,freeRerolls:this.num('chaos'),d6:false};for(const t of [...this.s.tags])if(t.id==='d6'){this.s.shop.d6=true;this.s.tags.splice(this.s.tags.indexOf(t),1);}this.refillShop();
  const weights=[['arcana',4],['celestial',4],['standard',4],['buffoon',1.2],['spectral',0.6]];
  for(let i=0;i<2;i++){let type=this.s.round===1&&i===0?'buffoon':this.weighted(weights);const r=this.rand(),size=r<0.615?0:r<0.923?1:2;this.s.shop.packs.push({uid:this.uid(),type,size,cost:[4,6,8][size]});}
  this.s.shop.vouchers=this.s.currentVouchers.filter(Boolean).map(v=>({...copy(v),uid:this.uid()}));for(const _ of this.s.tags.filter(t=>t.id==='voucher')){const v=this.randomVoucher();if(!this.s.shop.vouchers.some(x=>x.id===v.id))this.s.shop.vouchers.push({...copy(v),uid:this.uid()});}this.s.tags=this.s.tags.filter(t=>t.id!=='voucher');
  if(this.s.tags.some(t=>t.id==='coupon')){this.s.shop.cards.forEach(c=>c.free=true);this.s.shop.packs.forEach(c=>c.free=true);this.s.tags=this.s.tags.filter(t=>t.id!=='coupon');}
 }
 weighted(entries){let r=this.rand()*sum(entries,a=>a[1]);for(const [id,w] of entries){r-=w;if(r<0)return id;}return entries.at(-1)[0];}
 refillShop(){const count=2+Number(this.v('overstock'))+Number(this.v('overstock2')),used=[];this.s.shop.cards=[];for(let i=0;i<count;i++){
   let type=this.weighted([['joker',20],['tarot',this.v('tarot2')?32:this.v('tarot')?9.6:4],['planet',this.v('planet2')?32:this.v('planet')?9.6:4],['playing',this.v('magic')?4:0],['spectral',this.s.deckId==='ghost'?2:0]]),item;
   const rarityTag=this.s.tags.find(t=>['rare','uncommon'].includes(t.id));if(rarityTag){type='joker';item=this.makeJoker(this.randomJoker(rarityTag.id==='rare'?3:2,used),false);item.free=true;this.s.tags.splice(this.s.tags.indexOf(rarityTag),1);}
   if(!item){if(type==='joker')item=this.makeJoker(this.randomJoker(null,used),true);else if(type==='playing'){item={...this.createCard(2+Math.floor(this.rand()*13),this.pick(D.suits)),type:'playing',cost:1};if(this.v('illusion')){if(this.rand()<0.4)item.enh=this.pick(Object.keys(D.enhancements));if(this.rand()<0.2)item.edition=this.pick(['foil','foil','holo','poly']);}}else item={...this.randomConsumable(type,used),uid:this.uid()};}
   item.type=type;if(type==='joker'&&!item.edition){const t=this.s.tags.find(t=>['negative','foil','holo','poly'].includes(t.id));if(t){item.edition=t.id;item.free=true;item.eternal=false;item.perishable=false;item.rental=false;this.s.tags.splice(this.s.tags.indexOf(t),1);}}
   used.push(item.id);this.s.shop.cards.push(item);
  }}
 rerollCost(){return this.s.shop.freeRerolls>0?0:(this.s.shop.d6?0:5-2*Number(this.v('reroll'))-2*Number(this.v('reroll2')))+this.s.shop.rerolls;}
 reroll(){if(this.s.phase!=='shop')return;this.pay(this.rerollCost());if(this.s.shop.freeRerolls>0)this.s.shop.freeRerolls--;else this.s.shop.rerolls++;this.refillShop();}
 buy(uid){if(this.s.phase!=='shop')return;const sh=this.s.shop,item=[...sh.cards,...sh.packs,...sh.vouchers].find(c=>c.uid===uid);if(!item)return;const cost=this.price(item);
  if(sh.packs.includes(item)){this.pay(cost);sh.packs=sh.packs.filter(c=>c!==item);this.openPack(item);return;}
  if(item.type==='joker'&&this.s.jokers.length>=this.jokerSlots()+(item.edition==='negative'?1:0))throw Error('小丑槽已满，可以先出售一张。');if(['tarot','planet','spectral'].includes(item.type)&&this.s.consumables.length>=this.consumableSlots())throw Error('消耗牌槽已满。');
  this.pay(cost);if(item.type==='voucher'){this.s.vouchers.push(item.id);this.s.currentVouchers=this.s.currentVouchers.filter(v=>v.id!==item.id);sh.vouchers=sh.vouchers.filter(c=>c!==item);if(['hieroglyph','petroglyph'].includes(item.id))this.s.ante--;if(['overstock','overstock2'].includes(item.id)){const other=this.makeJoker(this.randomJoker(),true);other.type='joker';sh.cards.push(other);}}else{sh.cards=sh.cards.filter(c=>c!==item);if(item.type==='joker')this.s.jokers.push(item);else if(item.type==='playing')this.addToDeck(item);else this.s.consumables.push(item);}this.log('购买了'+(item.name||this.cardName(item))+'。');
 }
 removeJoker(j){this.s.jokers=this.s.jokers.filter(x=>x!==j);}
 sell(uid){if(!['playing','shop','blinds','pack'].includes(this.s.phase))throw Error('当前无法出售。');const j=this.s.jokers.find(j=>j.uid===uid),c=this.s.consumables.find(c=>c.uid===uid),item=j||c;if(!item)return;if(j?.eternal)throw Error('永恒小丑不能出售。');this.s.money+=this.sellValue(item);if(j){this.removeJoker(j);if(this.boss('leaf')||j.id==='luchador'&&this.s.blindIndex===2&&this.s.phase==='playing'){this.s.bossDisabled=true;this.s.disabledJoker=null;this.log('当前 Boss 效果已禁用。');}}else this.s.consumables=this.s.consumables.filter(x=>x!==c);}
 rerollBoss(){if(this.s.phase!=='blinds'&&this.s.phase!=='shop')throw Error('请在进入 Boss 前更换。');if(!this.v('director')&&!this.v('retcon'))throw Error('需要导演剪辑版或重剪优惠券。');if(this.s.bossRerolls&&!this.v('retcon'))throw Error('本底注更换次数已用完。');this.pay(10);const n=this.s.bossRerolls+1;this.chooseBoss();this.s.bossRerolls=n;}
 openPack(def,tag=false){const back=this.s.phase;const small=['buffoon','spectral'].includes(def.type),count=def.size===0?(small?2:3):(small?4:5),used=[],options=[];
  for(let i=0;i<count;i++){let item;if(def.type==='standard'){item=this.createCard(2+Math.floor(this.rand()*13),this.pick(D.suits));if(this.rand()<0.4)item.enh=this.pick(Object.keys(D.enhancements));if(this.rand()<0.2)item.seal=this.pick(['red','gold','blue','purple']);if(this.rand()<0.08)item.edition=this.pick(['foil','foil','foil','foil','holo','holo','holo','poly']);item.type='playing';}else if(def.type==='buffoon')item={...this.makeJoker(this.randomJoker(null,used),true),type:'joker'};else{let type=({arcana:'tarot',celestial:'planet',spectral:'spectral'})[def.type];if(def.type==='arcana'&&this.v('omen')&&this.rand()<0.2)type='spectral';item={...this.randomConsumable(type,used),uid:this.uid()};if(['arcana','spectral'].includes(def.type)&&this.rand()<0.003)item={...copy(D.spectrals.find(c=>c.id==='soul')),uid:this.uid()};else if(['celestial','spectral'].includes(def.type)&&this.rand()<0.003)item={...copy(D.spectrals.find(c=>c.id==='blackhole')),uid:this.uid()};}used.push(item.id);options.push(item);}
  if(def.type==='celestial'&&this.v('telescope')){const id=this.mostPlayed(),h=D.hands.find(h=>h.id===id);options[0]={...h,name:h.planet,type:'planet',uid:this.uid(),cost:3};}
  this.s.pack={...def,options,remaining:def.size===2?2:1,hand:['arcana','spectral'].includes(def.type)?this.shuffle([...this.s.deck]).slice(0,this.handSize()):null,back,tag};this.s.phase='pack';this.s.selected=[];
 }
 choosePack(uid){const p=this.s.pack;if(!p)return;const item=p.options.find(x=>x.uid===uid);if(!item)return;if(item.type==='joker'){if(this.s.jokers.length>=this.jokerSlots()+(item.edition==='negative'?1:0))throw Error('小丑槽已满。');this.s.jokers.push(item);}else if(item.type==='playing')this.addToDeck(item);else this.useConsumable(item,true);p.options=p.options.filter(c=>c!==item);p.remaining--;this.s.selected=[];if(p.remaining<=0)this.closePack(false);}
 closePack(skipped=true){if(!this.s.pack)return;if(skipped)for(const j of this.s.jokers)if(j.id==='redcard'&&this.active(j))j.value+=3;const back=this.s.pack.back;this.s.pack=null;this.s.phase=back;this.s.selected=[];if(this.s.packQueue?.length)this.openPack(this.s.packQueue.shift(),true);}
 consumableSpaceAfterUse(item){const owned=this.s.consumables.includes(item);return Math.max(0,this.consumableSlots()-(owned&&item.edition==='negative'?1:0)-this.s.consumables.length+(owned?1:0));}
 canUse(item){const selected=this.selectedCards(),hand=this.activeHand();if(!item)return '未选择消耗牌';if(!['playing','shop','blinds','pack'].includes(this.s.phase))return '请先完成当前结算，再使用消耗牌';if(item.type==='planet')return '';if(item.min>0&&!hand.length)return '当前没有可选手牌，请进入打牌回合或打开秘术／幻灵包';if((item.min||0)>selected.length||(item.max&&selected.length>item.max))return (item.min===item.max?'请选择 '+item.min+' 张手牌':'请选择 '+item.min+'—'+item.max+' 张手牌')+'（已选 '+selected.length+' 张）';const id=item.id;
  if(['familiar','grim','incantation','sigil','ouija','immolate'].includes(id)&&hand.length<=1)return '需要至少两张可用手牌';if(id==='aura'&&selected[0]?.edition)return '目标已有版本';if(id==='fool'&&!this.s.lastConsumable)return '尚未使用过可复制的牌';if(['priestess','emperor','fool'].includes(id)&&this.consumableSpaceAfterUse(item)<1)return '消耗牌槽已满；负片牌用掉后也会失去它提供的槽位';if(['judgement','wraith','soul'].includes(id)&&this.s.jokers.length>=this.jokerSlots())return '小丑槽已满';if(['hex','wheel'].includes(id)&&!this.s.jokers.some(j=>!j.edition))return '需要一张没有版本的小丑';if(id==='ecto'&&!this.s.jokers.some(j=>!j.edition))return '没有可添加负片的小丑';if(id==='ankh'&&!this.s.jokers.length)return '需要至少一张小丑';if(id==='ankh'&&this.s.jokers.every(j=>j.eternal)&&this.s.jokers.length>=this.jokerSlots())return '永恒小丑占满槽位，无法创建复制品';return '';}
 useConsumable(itemOrUid,fromPack=false){const snapshot=copy(this.s);try{return this.applyConsumable(itemOrUid,fromPack);}catch(error){this.s=new Game(snapshot).s;throw error;}}
 applyConsumable(itemOrUid,fromPack=false){const item=typeof itemOrUid==='string'?this.s.consumables.find(c=>c.uid===itemOrUid):itemOrUid;const error=this.canUse(item);if(error)throw Error(error);const selected=this.selectedCards(),hand=this.activeHand(),id=item.id;
  if(!fromPack)this.s.consumables=this.s.consumables.filter(c=>c!==item);
  if(item.type==='planet'){this.levelUp(id);for(const j of this.s.jokers)if(j.id==='constellation'&&this.active(j))j.value+=0.1;}
  if(item.type==='tarot'){
   this.s.totalTarots++;const enh={magician:'lucky',empress:'mult',hierophant:'bonus',lovers:'wild',chariot:'steel',justice:'glass',devil:'gold',tower:'stone'}[id];if(enh)selected.forEach(c=>{c.enh=enh;this.s.antePlayed=this.s.antePlayed.filter(uid=>uid!==c.uid);});
   if(id==='fool'){const last=this.s.lastConsumable;this.addConsumable(last.type,last.id);}if(id==='priestess')for(let i=0;i<2;i++)this.addRandomConsumable('planet');if(id==='emperor')for(let i=0;i<2;i++)this.addRandomConsumable('tarot');if(id==='hermit')this.s.money+=Math.min(20,Math.max(0,this.s.money));if(id==='temperance')this.s.money+=Math.min(50,sum(this.s.jokers,j=>this.sellValue(j)));if(id==='strength')selected.forEach(c=>c.rank=c.rank===14?2:c.rank+1);if(id==='hanged')this.destroyCards(selected);if(id==='death'){const [left,right]=selected;const uid=left.uid;Object.assign(left,copy(right),{uid});}const suit={star:'D',tarotmoon:'C',sun:'H',world:'S'}[id];if(suit)selected.forEach(c=>c.suit=suit);if(id==='judgement')this.s.jokers.push(this.makeJoker(this.randomJoker()));if(id==='wheel'){if(this.chance(4))this.pick(this.s.jokers.filter(j=>!j.edition)).edition=this.weighted([['foil',50],['holo',35],['poly',15]]);else this.log('命运之轮：没有生效。');}
  }
  if(item.type==='spectral'){
   const seal={talisman:'gold',deja:'red',trance:'blue',medium:'purple'}[id];if(seal)selected[0].seal=seal;if(id==='aura')selected[0].edition=this.weighted([['foil',50],['holo',35],['poly',15]]);
   if(['familiar','grim','incantation'].includes(id)){this.destroyCards([this.pick(hand)]);const count={familiar:3,grim:2,incantation:4}[id];for(let i=0;i<count;i++){const rank=id==='grim'?14:id==='familiar'?this.pick([11,12,13]):2+Math.floor(this.rand()*9),c=this.createCard(rank,this.pick(D.suits),{enh:this.pick(Object.keys(D.enhancements).filter(x=>x!=='stone'))});this.addToDeck(c,this.s.phase==='playing');if(this.s.pack?.hand)this.s.pack.hand.push(c);}}
   if(id==='wraith'){this.s.jokers.push(this.makeJoker(this.randomJoker(3)));this.s.money=0;}if(id==='sigil'){const suit=this.pick(D.suits);hand.forEach(c=>c.suit=suit);}if(id==='ouija'){const rank=2+Math.floor(this.rand()*13);hand.forEach(c=>c.rank=rank);this.s.sizePenalty++;}if(id==='ecto'){this.pick(this.s.jokers.filter(j=>!j.edition)).edition='negative';this.s.ectoUses++;this.s.sizePenalty+=this.s.ectoUses;}if(id==='immolate'){this.destroyCards(this.shuffle([...hand]).slice(0,5));this.s.money+=20;}
   if(id==='ankh'){const j=this.pick(this.s.jokers);this.s.jokers=this.s.jokers.filter(x=>x===j||x.eternal);if(this.s.jokers.length>=this.jokerSlots())throw Error('保留的永恒小丑占满槽位');const twin=copy(j);twin.uid=this.uid();if(twin.edition==='negative')twin.edition=null;this.s.jokers.push(twin);}if(id==='hex'){const j=this.pick(this.s.jokers.filter(j=>!j.edition));j.edition='poly';this.s.jokers=this.s.jokers.filter(x=>x===j||x.eternal);}if(id==='cryptid')for(let i=0;i<2;i++){const c=this.cloneCard(selected[0]);this.addToDeck(c,this.s.phase==='playing');if(this.s.pack?.hand)this.s.pack.hand.push(c);}if(id==='soul')this.s.jokers.push(this.makeJoker(this.randomJoker(4)));if(id==='blackhole')D.hands.forEach(h=>this.levelUp(h.id));
  }
  if(item.type!=='spectral'&&id!=='fool')this.s.lastConsumable={type:item.type,id};if(this.s.forced&&!this.s.hand.some(c=>c.uid===this.s.forced))this.setForced();this.s.selected=this.s.forced?[this.s.forced]:[];this.log('使用了'+item.name+'。');return true;
 }
 cardName(c){return D.suitSymbols[c.suit]+(D.rankNames[c.rank]||c.rank);}
 jokerName(j){return D.jokers.find(x=>x.id===j.id)?.name||j.name;}
}
globalThis.BalatroEngine={Game,copy};
})();
