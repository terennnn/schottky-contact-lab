'use strict';
const $=id=>document.getElementById(id);
const fmt=v=>(Math.abs(v)<.0005?0:v).toFixed(2);
const chemicalName=name=>/^(?:[A-Z][a-z]?\d*)+$/.test(name)?name.replace(/\d/g,d=>'₀₁₂₃₄₅₆₇₈₉'[Number(d)]):name;
const signed=v=>(v>=-.0005?'+':'')+fmt(v);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=u=>{try{const x=new URL(u);return x.protocol==='https:'?x.href:'';}catch{return '';}};
const state={phi:5.1,chi:4.03,eg:2.39,offset:.2,type:'n',length:1,p:1,playing:false,paused:matchMedia('(prefers-reduced-motion: reduce)').matches,custom:false,classroom:false,metal:metals[0],semi:semiconductors[0],layers:1};
let model,clock=0,lastFrame=0,renderTime=0,pointer=null,importCount=0;
const materialPickers={};
const materialLabel=(kind,m)=>kind==='metal'?`${m.name} · ${m.zh||'Imported'} — ${fmt(m.phi)} eV`:`${chemicalName(m.name)} · ${m.zh||'Imported material'}`;
function fillMenus(){
 for(const [kind,items] of [['metal',metals],['semi',semiconductors]]){
  const selected=$(kind).value;
  $(kind).replaceChildren(...items.map(m=>new Option(materialLabel(kind,m),m.id)));
  if(items.some(m=>m.id===selected))$(kind).value=selected;
 }
}
function setupMaterialPicker(kind){
 const input=$(kind+'-input'),list=$(kind+'-options'),toggle=$(kind+'-toggle'),status=$(kind==='metal'?'metal-count':'catalog-count');
 const items=()=>kind==='metal'?metals:semiconductors;
 let matches=[],active=-1,open=false;
 function restore(){const chosen=items().find(m=>m.id===$(kind).value);input.value=chosen?materialLabel(kind,chosen):'';}
 function close(){open=false;list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');restore();status.textContent=kind==='metal'?'Choose or type a metal name / symbol':'Choose or type a formula / ID · C2DB snapshot';}
 function highlight(index){active=index;[...list.querySelectorAll('[role=option]')].forEach((el,i)=>el.classList.toggle('active',i===active));const el=list.querySelectorAll('[role=option]')[active];if(el){input.setAttribute('aria-activedescendant',el.id);el.scrollIntoView({block:'nearest'});}}
 function show(query=''){
  const q=query.trim().toLowerCase().replace(/[₀-₉]/g,d=>String('₀₁₂₃₄₅₆₇₈₉'.indexOf(d)));
  matches=items().filter(m=>`${m.name} ${m.zh||''} ${m.note||''}`.toLowerCase().includes(q));
  if(q)matches.sort((a,b)=>Number(b.name.toLowerCase()===q)-Number(a.name.toLowerCase()===q)||Number(b.name.toLowerCase().startsWith(q))-Number(a.name.toLowerCase().startsWith(q)));
  const total=matches.length;matches=matches.slice(0,100);active=-1;
  list.replaceChildren(...matches.map((m,i)=>{const el=document.createElement('div');el.id=`${kind}-option-${i}`;el.setAttribute('role','option');el.setAttribute('aria-selected',String(m.id===$(kind).value));el.dataset.index=i;const title=document.createElement('span');title.textContent=kind==='metal'?materialLabel(kind,m):chemicalName(m.name);el.append(title);if(kind==='semi'){const detail=document.createElement('small');detail.textContent=m.record?`Structure ID: ${m.record.uid} · Layer group: ${m.record.layergroup}`:m.zh||'Imported material';el.append(detail);}return el;}));
  if(!total){const el=document.createElement('div');el.className='combo-empty';el.textContent='No matching materials. Try another name or formula.';list.append(el);}
  status.textContent=`${total.toLocaleString()} matching ${kind==='metal'?'metals':'structure records'}${total>100?' · First 100 shown; type to narrow':''}`;
  open=true;list.hidden=false;input.setAttribute('aria-expanded','true');input.removeAttribute('aria-activedescendant');
 }
 function choose(index){const m=matches[index];if(!m)return;$(kind).value=m.id;close();applyMaterial();}
 input.addEventListener('focus',()=>{input.select();show();});
 input.addEventListener('click',()=>{if(!open)show();});
 input.addEventListener('input',()=>show(input.value));
 input.addEventListener('blur',close);
 input.addEventListener('keydown',e=>{
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!open)show();if(matches.length)highlight(e.key==='ArrowDown'?Math.min(active+1,matches.length-1):active<0?matches.length-1:Math.max(active-1,0));}
  else if(e.key==='Enter'&&open){e.preventDefault();if(matches.length)choose(active<0?0:active);}
  else if(e.key==='Escape'){e.preventDefault();close();}
 });
 list.addEventListener('mousedown',e=>e.preventDefault());
 list.addEventListener('click',e=>{const el=e.target.closest('[role=option]');if(el)choose(Number(el.dataset.index));});
 toggle.addEventListener('mousedown',e=>e.preventDefault());
 toggle.addEventListener('click',()=>{if(open)close();else{input.focus();show();}});
 materialPickers[kind]={restore,close};restore();
 status.textContent=kind==='metal'?'Choose or type a metal name / symbol':'Choose or type a formula / ID · C2DB snapshot';
}
function sourceLink(id,url){const a=$(id),u=safeUrl(url);if(u){a.href=u;a.removeAttribute('aria-disabled');a.hidden=false;}else{a.removeAttribute('href');a.hidden=true;}}
function applyMaterial(){
 state.metal=metals.find(m=>m.id===$('metal').value)||metals[0];
 state.semi=semiconductors.find(m=>m.id===$('semi').value)||semiconductors[0];
 Object.values(materialPickers).forEach(picker=>picker.restore());
 const rows=state.semi.rows;
 const previousLayer=Number($('layers').value);
 $('layers').replaceChildren(...rows.map(r=>new Option(`${r.layers}L · ${r.layers===1?'Monolayer':state.semi.record?.origin==='Americo23'?'Self-intercalated bilayer':r.layers+' layers'}`,String(r.layers))));
 if(rows.some(r=>r.layers===previousLayer))$('layers').value=String(previousLayer);
 state.layers=Number($('layers').value);
 const row=rows.find(r=>r.layers===state.layers)||rows[0];
 state.phi=state.metal.phi;state.chi=row.chi;state.eg=row.eg;state.custom=false;state.classroom=false;
 clampOffset();syncControls();update();
}
function clampOffset(){state.offset=Math.min(state.offset,Math.floor(state.eg/2*100)/100);state.offset=Math.max(.03,state.offset);}
function syncControls(){for(const k of ['phi','chi','eg','offset','length']){
 if(k==='offset')$('offset').max=String(Math.floor(state.eg/2*100)/100);
 if(k==='chi'||k==='eg'){ $(k).min=String(Math.min(k==='chi'?2:.06,state[k]));$(k).max=String(Math.max(k==='chi'?5.5:3.5,state[k]));$(k).step='.001';}
 $(k).value=state[k];$(k+'-value').textContent=k==='length'?state[k].toFixed(1):fmt(state[k]);
}for(const t of ['n','p']){const b=$('type-'+t);b.classList.toggle('selected',state.type===t);b.setAttribute('aria-pressed',String(state.type===t));}
 $('offset-desc').textContent=state.type==='n'?'Δₙ = E꜀(channel) − Eꜰ':'Δₚ = Eꜰ − Eᵥ(channel)';
 Notation.tree($('offset-desc'));
 $('progress').value=state.p;
 $('pause-motion').textContent=state.paused?'Resume motion':'Pause motion';$('pause-motion').setAttribute('aria-pressed',String(state.paused));
 document.body.classList.toggle('still',state.paused);
}
function update(){
 model=ContactPhysics.contact(state);
 const regimeName=model.regime==='flat'?'Flat band':model.regime==='accumulation'?(state.type==='n'?'Electron accumulation':'Hole accumulation'):(state.type==='n'?'Electron depletion':'Hole depletion');
 $('regime').textContent=regimeName+(model.inverted?' · Possible inversion':'');
 $('zone-key').textContent=model.regime==='flat'?'Flat band · No bending':model.regime==='accumulation'?'Accumulation region (schematic)':'Space-charge region (schematic)';
 $('pair-label').textContent=state.classroom?'Teaching metal / semiconductor · Illustrative':`${state.custom?'Custom ':''}${state.metal.name} / ${chemicalName(state.semi.name)} · ${state.layers}L`;
 $('metal-name').textContent=`Work function ΦM = ${fmt(state.phi)} eV${state.custom?' · Custom':''}`;Notation.tree($('metal-name'));
 sourceLink('metal-source',state.metal.source);sourceLink('semi-source',state.semi.source);
 $('semi-note').textContent=state.semi.note.includes('GW')?'2H phase · Free-standing GW':state.semi.note;
 document.querySelector('.method').textContent=state.semi.method||'Custom data';
 $('data-mode').textContent=state.custom?'Custom parameters · Literature values modified':state.metal.id.startsWith('import')||state.semi.id.startsWith('import')?'Imported data':'Literature values · Editable';
 for(const [id,value] of [['bn',model.bn],['bp',model.bp],['eq-bn',model.bn],['eq-delta',model.delta]])$(id).textContent=fmt(value)+(id.startsWith('eq')?' eV':'');
 $('bend').textContent=signed(model.bend);$('eq-bend').textContent=signed(model.bend)+' eV';
 $('current-source').textContent=`Current: ${state.metal.name} ΦM = ${fmt(state.phi)} eV; ${chemicalName(state.semi.name)} ${state.layers}L, χ = ${fmt(state.chi)} eV, Eg = ${fmt(state.eg)} eV. Semiconductor ΦS = χ + Δn = ${fmt(model.phiS)} eV.${state.custom?' Manually edited: custom values are shown.':''}`;
 Notation.tree($('current-source'));
 updateStage();renderPlot();renderAtoms();
}
function updateStage(){
 const p=state.p,eq=p>=.999,early=p<.001;
 $('progress').value=p;$('stage-percent').textContent=Math.round(p*100)+'%';
 $('stage-name').textContent=early?'01 / BEFORE CONTACT':eq?'03 / EQUILIBRIUM':'02 / CHARGE REDISTRIBUTION';
 $('play').textContent=state.playing?'Ⅱ':eq?'↻':'▶';$('play').setAttribute('aria-label',state.playing?'Pause contact formation':eq?'Replay contact formation':'Play contact formation');
 let text;
 if(Math.abs(model.bend)<.015){text='Nearly equal work functions: little net charge transfer is needed, so the bands stay nearly flat. Flat bands do not imply a zero barrier measured from the Fermi level.';}
 else if(early){text=`Before contact, the vacuum reference is shared but the Fermi levels differ: ΦM = ${fmt(state.phi)} eV and ΦS = ${fmt(model.phiS)} eV. Press play to watch the approach to equilibrium.`;}
 else if(!eq){text=`Electrons initially move net toward the ${model.bend>0?'metal':'semiconductor'}. The redistributed charge creates an electric field, and the semiconductor bands bend ${model.bend>0?'upward':'downward'}. This is an illustrative sequence, not a self-consistent time evolution.`;}
 else{text=`At equilibrium, EF,M = EF,S and net current is zero. ${model.regime==='flat'?'The bands are nearly flat.':model.regime==='accumulation'?`${state.type==='n'?'Electrons':'Holes'} accumulate near the interface. `:`${state.type==='n'?'Electrons':'Holes'} are depleted near the contact. `}${model.inverted?'Strong bending crosses a simplified midgap marker: inversion may occur and needs a fuller carrier calculation. ':''}${model.majority<0?'The ideal majority-carrier barrier is negative: there is no positive injection barrier, but contact resistance is not necessarily zero.':''}`;}
 $('stage-text').innerHTML=Notation.html(text);
 $('charge-direction').textContent=Math.abs(model.bend)<.015?'Similar work functions · Little initial net transfer':eq?'Equilibrium: bidirectional exchange, zero net current':`Initial net transfer: ${model.bend>0?'semiconductor → metal':'metal → semiconductor'}`;
}
const C={cyan:'#69c9e0',amber:'#e4b777',mint:'#97cbb6',muted:'#83959f',text:'#dce7ec'};
function text(x,y,label,color=C.muted,size=12,anchor='start',extra=''){return `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}" ${extra}>${Notation.svg(label)}</text>`;}
function line(x1,y1,x2,y2,color,width=1,dash=''){return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;}
function arrow(x,y1,y2,color,label,side=1){
 const a=Math.min(y1,y2),b=Math.max(y1,y2);if(b-a<5)return '';
 return line(x,a,x,b,color,1.6)+`<path d="M${x-4} ${a+6} L${x} ${a} L${x+4} ${a+6} M${x-4} ${b-6} L${x} ${b} L${x+4} ${b-6}" fill="none" stroke="${color}" stroke-width="1.6"/>`+text(x+side*9,(a+b)/2+4,label,color,11,side>0?'start':'end',`paint-order="stroke" stroke="#131a20" stroke-width="5" stroke-linejoin="round"`);
}
function renderPlot(){
 const p=state.p,m=model,eq=p>=.999,showVac=$('vacuum').checked;
 const sx=308+70*(1-p),end=860,width=end-sx,scaleLength=.61*state.length;
 const cb0=m.bn,cbBulk=m.delta+(1-p)*m.bend,efS=(1-p)*m.bend;
 const emin=Math.min(cb0-state.eg,cbBulk-state.eg,0)-.32;
 const emax=showVac?Math.max(state.phi,cbBulk+state.chi)+.55:Math.max(cb0,cbBulk,0)+.62;
 const Y=e=>72+(emax-e)/(emax-emin)*280;
 const E=z=>ContactPhysics.bandAt(z,p,m,scaleLength);
 const curve=(shift=0)=>Array.from({length:121},(_,i)=>`${i?'L':'M'}${(sx+width*i/120).toFixed(2)},${Y(E(i/120)+shift).toFixed(2)}`).join(' ');
 const zoneEnd=sx+width*Math.min(scaleLength,1);
 let s=`<title>Ideal metal–2D semiconductor band diagram</title><desc>Contact progress ${Math.round(p*100)}%. Electron barrier ${fmt(m.bn)} eV, hole barrier ${fmt(m.bp)} eV, band bending ${fmt(m.bend)} eV. Horizontal axis: schematic position.</desc><defs><linearGradient id="zone"><stop stop-color="${m.regime==='accumulation'?C.cyan:C.amber}" stop-opacity=".12"/><stop offset="1" stop-color="${C.amber}" stop-opacity=".015"/></linearGradient><linearGradient id="metalGrad" x2="1" y2="0"><stop stop-color="#30404a" stop-opacity=".3"/><stop offset="1" stop-color="#30404a" stop-opacity=".65"/></linearGradient></defs>`;
 s+=`<rect x="80" y="62" width="228" height="300" fill="url(#metalGrad)"/><rect x="${sx}" y="62" width="${end-sx}" height="300" fill="#19242a" fill-opacity=".2"/>`;
 if(p>.01&&m.regime!=='flat')s+=`<rect x="${sx}" y="62" width="${zoneEnd-sx}" height="300" fill="url(#zone)" opacity="${p}"/>`;
 for(let e=Math.ceil(emin*2)/2;e<=emax;e+=.5){const y=Y(e);s+=line(70,y,890,y,'#2a3740',.7,'2 6')+text(61,y+4,fmt(e),'#657985',10,'end');}
 s+=line(70,355,70,65,'#657985')+text(36,48,'E (eV)',C.muted,11)+text(80,31,`${state.classroom?'Teaching metal':state.metal.name} · METAL`,C.amber,11)+text(sx+15,31,`${state.classroom?'Teaching semiconductor':chemicalName(state.semi.name)} · ${state.layers}L · ${state.type}-TYPE`,C.cyan,11);
 s+=line(308,62,308,362,'#556570',1)+line(sx,62,sx,362,'#556570',1);
 const cb=curve(),vb=curve(-state.eg);
 s+=`<path class="band-line" d="${cb}" fill="none" stroke="${C.cyan}" stroke-width="2.8"/><path d="${vb}" fill="none" stroke="${C.amber}" stroke-width="2.8"/>`;
 s+=line(80,Y(0),308,Y(0),'#b4c4cd',1.5,'6 5')+line(sx,Y(efS),end,Y(efS),'#b4c4cd',1.5,'6 5');
 if(eq)s+=line(308,Y(0),sx,Y(0),'#b4c4cd',1.5,'6 5');
 s+=text(95,Y(0)-9,'EF,M = 0',C.text,11)+text(871,Y(cbBulk)+4,'EC',C.cyan,12)+text(871,Y(cbBulk-state.eg)+4,'EV',C.amber,12)+text(871,Y(efS)+4,eq?'EF':'EF,S',C.text,12);
 if(showVac){s+=line(80,Y(state.phi),308,Y(state.phi),'#a6a7c8',1,'3 4')+`<path d="${curve(state.chi)}" fill="none" stroke="#a6a7c8" stroke-dasharray="3 4"/>`+text(871,Y(cbBulk+state.chi)+4,'Evac','#a6a7c8',11);}
 if(eq){
  const ymaj=state.type==='n'?Y(cb0):Y(cb0-state.eg);
  s+=arrow(sx+24,Y(0),ymaj,state.type==='n'?C.cyan:C.amber,`${state.type==='n'?'ΦBn':'ΦBp'} ${fmt(m.majority)}`);
  s+=arrow(765,Y(0),state.type==='n'?Y(cbBulk):Y(cbBulk-state.eg),C.amber,`${state.type==='n'?'Δn':'Δp'} ${fmt(state.offset)}`,-1);
  s+=line(sx+width*.3,Y(cbBulk),sx+width*.56,Y(cbBulk),'#75877c',1,'3 4');
  s+=arrow(sx+width*.46,Y(cb0),Y(cbBulk),C.mint,`B ${signed(m.bend)}`);
 }else if(p<.01){
  if(showVac){s+=arrow(180,Y(state.phi),Y(0),C.amber,`ΦM ${fmt(state.phi)}`)+arrow(sx+42,Y(state.phi),Y(cb0),C.cyan,`χ ${fmt(state.chi)}`);}
  s+=arrow(760,Y(efS),Y(cbBulk),C.amber,`Δn ${fmt(m.delta)}`,-1);
  s+=text(344,390,'No charge exchange yet',C.muted,10,'middle');
 }
 if(p>.01&&m.regime!=='flat'){
  s+=line(sx,380,zoneEnd,380,'#677c76',1)+line(sx,376,sx,384,'#677c76')+line(zoneEnd,376,zoneEnd,384,'#677c76');
  s+=text((sx+zoneEnd)/2,400,m.regime==='accumulation'?'Accumulation · Schematic scale':m.inverted?'Space charge / possible inversion · Schematic':'Depletion · Schematic scale',C.muted,10,'middle');
 }
 s+=text(830,421,'Channel direction x →',C.muted,10,'end')+text(190,400,'Metal reservoir approximation',C.muted,10,'middle');
 if($('carriers').checked){
  const shift=state.type==='p'?-state.eg:0;
  for(let i=0;i<15;i++){
   const z=((i/15+clock*.035*(i%2?1:-1))%1+1)%1,px=sx+z*width,py=Y(E(z)+shift)+(state.type==='p'?9:-9);
   s+=`<circle cx="${px}" cy="${py}" r="${i%3?2:3}" fill="${state.type==='p'?'none':C.cyan}" stroke="${state.type==='p'?C.amber:C.cyan}" stroke-width="1" opacity="${.35+.4*(i%3)/2}"/>`;
  }
 }
 if(pointer&&pointer.x>=sx&&pointer.x<=end&&pointer.y>=60&&pointer.y<365){
  const z=(pointer.x-sx)/width,ec=E(z),px=pointer.x;
  s+=line(px,65,px,355,'#a7bbc4',1,'3 4')+`<circle cx="${px}" cy="${Y(ec)}" r="4" fill="${C.cyan}"/>`;
  const tx=Math.min(px+10,680);s+=`<rect x="${tx}" y="42" width="180" height="27" rx="4" fill="#25343e" stroke="#49616e"/>`+text(tx+9,60,`EC(x) = ${fmt(ec)} eV`,C.text,11);
 }
 $('bands').innerHTML=s;
}
function renderAtoms(){
 const c=$('atoms'),rect=c.getBoundingClientRect();if(!rect.width)return;
 const dpr=Math.min(devicePixelRatio||1,2),w=rect.width,h=190;
 if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
 const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const p=state.p,b=w*.36,gap=32*(1-p),right=b+gap;
 ctx.fillStyle='#141c21';ctx.fillRect(0,0,w,h);
 const glow=ctx.createRadialGradient(right,95,0,right,95,w*.4);glow.addColorStop(0,'#e4b7770c');glow.addColorStop(1,'#e4b77700');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
 // Metal electrode: a compact lattice with subtle thermal motion.
 const cols=Math.max(4,Math.floor(w*.3/26)),cw=(b-45)/cols;
 const metalAtoms=[];
 for(let row=0;row<4;row++)for(let col=0;col<cols;col++)metalAtoms.push([30+col*cw+(row%2)*8,50+row*25]);
 ctx.strokeStyle='#e4b77720';ctx.lineWidth=1;
 for(const [x,y]of metalAtoms){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(Math.min(x+cw,b-10),y);ctx.stroke();}
 for(let i=0;i<metalAtoms.length;i++){const [x,y]=metalAtoms[i];const dy=Math.sin(clock*1.4+i)*.65;
  const grad=ctx.createRadialGradient(x-2,y+dy-2,0,x,y+dy,6);grad.addColorStop(0,'#ead7a8');grad.addColorStop(1,state.metal.color||'#c0a46d');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(x,y+dy,5.4,0,Math.PI*2);ctx.fill();}
 // Two-dimensional in-plane lattice. Bonds and chalcogen / transition-metal sites.
 const pts=[],step=Math.max(25,(w-right-30)/13);
 for(let row=0;row<4;row++)for(let col=0;col<14;col++){const x=right+18+col*step+(row%2)*step/2;if(x>w-18)continue;pts.push({x,y:52+row*23,row,col});}
 ctx.strokeStyle='#72bdc836';
 for(const a of pts)for(const b2 of pts){const dx=a.x-b2.x,dy=a.y-b2.y;if(dx*dx+dy*dy<step*step*1.15&&dx*dx+dy*dy>10){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b2.x,b2.y);ctx.stroke();}}
 for(const a of pts){const y=a.y+Math.sin(clock*1.7+a.col*.5+a.row)*.6;ctx.fillStyle=(a.row+a.col)%3===0?'#d7e3df':state.semi.color||'#72bdc8';ctx.globalAlpha=(a.row+a.col)%3===0?.9:.65;ctx.beginPath();ctx.arc(a.x,y,(a.row+a.col)%3===0?4.5:3,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
 // Excess interface charge and countercharge: signs follow electron transfer.
 if(p>.02&&Math.abs(model.bend)>.015){ctx.font='12px Times New Roman, Times, serif';const count=7;
  for(let i=0;i<count;i++){const yy=43+i*16;ctx.globalAlpha=p*.8;ctx.fillStyle=C.amber;ctx.fillText(model.bend>0?'−':'+',b-9,yy);ctx.fillStyle=C.mint;ctx.fillText(model.bend>0?'+':'−',right+12,yy);}
  ctx.globalAlpha=1;
  if(p<.999){ctx.strokeStyle='#97cbb650';ctx.setLineDash([4,5]);for(let j=0;j<3;j++){const yy=57+j*32;ctx.beginPath();ctx.moveTo(b-12,yy);ctx.lineTo(right+65,yy);ctx.stroke();}ctx.setLineDash([]);}
 }
 if($('carriers').checked){
  // Equal opposite motion at equilibrium; one-way excess transfer only in the illustrative transient.
  for(let i=0;i<14;i++){
   const eq=p>.999,free=p<.001,dir=eq?(i%2?1:-1):(model.bend>0?-1:1);
   let x,y;
   if(free){const a=((clock*.06+i*.173)%1);x=i%2?30+a*(b-50):right+25+a*(w-right-50);y=65+(i%3)*22;}
   else{const v=((clock*.10+i*.131)%1);x=dir>0?w*.16+v*w*.67:w*.83-v*w*.67;y=70+(i%3)*22+Math.sin(v*Math.PI)*10;}
   ctx.shadowColor=C.cyan;ctx.shadowBlur=8;ctx.fillStyle='#b9ebf5';ctx.globalAlpha=.65;ctx.beginPath();ctx.arc(x,y,2.2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
 }
 ctx.fillStyle=C.muted;ctx.font='9px Times New Roman, Times, serif';ctx.textAlign='center';if(p>.02&&Math.abs(model.bend)>.015)ctx.fillText('Net interface charge (schematic)',right+10,25);ctx.font='10px Times New Roman, Times, serif';ctx.textAlign='center';ctx.fillText((state.classroom?'Teaching metal':state.metal.name)+' / electrode',w*.17,167);ctx.fillText((state.classroom?'Teaching semiconductor':chemicalName(state.semi.name))+' / 2D channel',w*.69,167);ctx.textAlign='left';
}
function animate(time){
 const dt=lastFrame?Math.min((time-lastFrame)/1000,.06):0;lastFrame=time;
 if(!state.paused){clock+=dt;if(state.playing){state.p=Math.min(1,state.p+dt/7);if(state.p===1)state.playing=false;updateStage();}}
 if(time-renderTime>33&&(!state.paused||state.playing)){renderTime=time;renderPlot();renderAtoms();}
 requestAnimationFrame(animate);
}
fillMenus();$('metal').value='m0';$('semi').value='s0';applyMaterial();syncControls();
setupMaterialPicker('metal');setupMaterialPicker('semi');
for(const id of ['metal','semi','layers'])$(id).addEventListener('change',applyMaterial);
for(const t of ['n','p'])$('type-'+t).addEventListener('click',()=>{state.type=t;syncControls();update();});
for(const k of ['phi','chi','eg','offset','length'])$(k).addEventListener('input',()=>{state[k]=Number($(k).value);if(['phi','chi','eg'].includes(k))state.custom=true;clampOffset();syncControls();update();});
$('progress').addEventListener('input',()=>{state.p=Number($('progress').value);state.playing=false;updateStage();renderPlot();renderAtoms();});
document.querySelectorAll('[data-progress]').forEach(b=>b.addEventListener('click',()=>{state.p=Number(b.dataset.progress);state.playing=false;syncControls();update();}));
$('play').addEventListener('click',()=>{if(state.p>=1)state.p=0;state.playing=!state.playing;if(state.playing)state.paused=false;syncControls();updateStage();renderPlot();});
$('pause-motion').addEventListener('click',()=>{state.paused=!state.paused;syncControls();renderPlot();renderAtoms();});
$('vacuum').addEventListener('change',renderPlot);$('carriers').addEventListener('change',()=>{renderPlot();renderAtoms();});
$('reset').addEventListener('click',()=>{state.type='n';state.offset=.2;state.length=1;state.p=1;state.playing=false;Object.values(materialPickers).forEach(picker=>picker.close());$('metal').value='m0';$('semi').value='s0';$('layers').value='1';$('vacuum').checked=false;$('carriers').checked=true;applyMaterial();});
$('classroom').addEventListener('click',()=>{state.phi=4.8;state.chi=4;state.eg=1.4;state.offset=.2;state.type='n';state.p=1;state.playing=false;state.custom=true;state.classroom=true;state.length=1;syncControls();update();});
$('bands').addEventListener('pointermove',e=>{const r=$('bands').getBoundingClientRect(),scale=Math.min(r.width/960,r.height/440),offX=(r.width-960*scale)/2,offY=(r.height-440*scale)/2;pointer={x:(e.clientX-r.left-offX)/scale,y:(e.clientY-r.top-offY)/scale};renderPlot();});
$('bands').addEventListener('pointerleave',()=>{pointer=null;renderPlot();});
new ResizeObserver(()=>{renderAtoms();}).observe($('atoms'));
requestAnimationFrame(animate);
// Data stays untrusted: validate the complete payload before changing menus; render names with textContent.
function validatePayload(obj){
 if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('The top-level JSON value must be an object.');
 const ms=obj.metals||[],ss=obj.semiconductors||[];
 if(!Array.isArray(ms)||!Array.isArray(ss)||!ms.length&&!ss.length)throw Error('Provide a non-empty metals or semiconductors array.');
 if(ms.length+ss.length>80)throw Error('Import up to 80 materials at a time.');
 const common=r=>{if(!r||typeof r.name!=='string'||!r.name.trim()||r.name.length>70)throw Error('Each material name must contain 1–70 characters.');if(!safeUrl(r.source))throw Error('Each material must include a valid HTTPS source URL.');return {name:r.name.trim(),source:safeUrl(r.source),note:typeof r.note==='string'?r.note.slice(0,160):'Imported · Verify the source'};};
 const number=(v,lo,hi,label)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)throw Error(`${label} must be a number between ${lo} and ${hi} eV.`);return v;};
 const a=ms.map((r,i)=>({...common(r),id:`importM${importCount}-${i}`,phi:number(r.phi,2.5,6.5,'phi'),color:'#b6bdc5'}));
 const b=ss.map((r,i)=>{const chi=number(r.chi,-10,15,'chi'),eg=number(r.eg,.061,15,'eg'),layers=r.layers??1;if(!Number.isInteger(layers)||layers<1||layers>4)throw Error('layers must be 1, 2, 3, or 4.');return {...common(r),id:`importS${importCount}-${i}`,color:'#8ebdc6',rows:[{chi,eg,layers}]};});
 return {a,b};
}
function importData(obj){const {a,b}=validatePayload(obj);if([...metals,...semiconductors].filter(m=>m.id.startsWith('import')).length+a.length+b.length>180)throw Error('The total limit is 180 materials. Reload to clear imported data.');metals.push(...a);semiconductors.push(...b);importCount++;fillMenus();if(a[0])$('metal').value=a[0].id;if(b[0])$('semi').value=b[0].id;applyMaterial();importStatus(`Imported ${a.length} metal(s) and ${b.length} semiconductor(s). The new materials are now selected.`,false);}
function importStatus(msg,error){$('import-status').textContent=msg;$('import-status').className='import-status '+(error?'error':'success');}
$('fetch-data').addEventListener('click',async()=>{
 const url=safeUrl($('import-url').value);if(!url){importStatus('Enter a valid HTTPS JSON URL.',true);return;}
 const button=$('fetch-data');button.disabled=true;button.textContent='Loading…';const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{const response=await fetch(url,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw Error(`Server returned HTTP ${response.status}`);
  if(Number(response.headers.get('content-length'))>500000)throw Error('Data exceeds the 500 KB limit.');
  const reader=response.body?.getReader();let str='';
  if(reader){const decoder=new TextDecoder();let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>500000){await reader.cancel();throw Error('Data exceeds the 500 KB limit.');}str+=decoder.decode(value,{stream:true});}str+=decoder.decode();}else{str=await response.text();if(str.length>500000)throw Error('Data is too large.');}
  importData(JSON.parse(str));
 }catch(err){importStatus('Import failed: '+(err.name==='AbortError'?'Connection timed out.':err instanceof SyntaxError?'The content is not valid JSON.':err.message==='Failed to fetch'?'The URL is unreachable or does not allow CORS. Download the JSON and upload it instead.':err.message),true);}finally{clearTimeout(timer);button.disabled=false;button.textContent='Load';}
});
$('import-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>500000)throw Error('Data exceeds the 500 KB limit.');importData(JSON.parse(await file.text()));}catch(err){importStatus('Import failed: '+(err instanceof SyntaxError?'The content is not valid JSON.':err.message),true);}e.target.value='';});
$('export').addEventListener('click',()=>{const payload={metals:[{name:state.metal.name+(state.custom?' (custom)':''),phi:state.phi,source:state.metal.source,note:state.custom?'Manually edited; verify these custom values':state.metal.note}],semiconductors:[{name:state.semi.name+(state.custom?' (custom)':''),chi:state.chi,eg:state.eg,layers:state.layers,source:state.semi.source,note:state.custom?'Manually edited; verify these custom values':state.semi.note}],experiment:{type:state.type,offset:state.offset,model:'ideal Schottky-Mott; zero bias',units:'eV'}};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='schottky-materials.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);});
