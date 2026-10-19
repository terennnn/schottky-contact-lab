'use strict';
(()=>{
 const get=id=>document.getElementById(id);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let step=0,phase=1,playing=false,paused=reduced,phi=4.8,last=0,elapsed=0,drawn=0;
 const copy=[
  {title:'An energy barrier, not a physical wall.',body:'A Schottky barrier is the energy offset between the metal Fermi level and a semiconductor band edge at the interface. For electrons, measure upward from EF to the interface conduction-band edge EC(0).',formula:'ΦBn = EC(0) − EF = ΦM − χ',takeaway:'Here, the electron barrier is 0.80 eV. The hole barrier is Eg − ΦBn = 0.60 eV. These are different distances in the same band diagram.'},
  {title:'Contact lets electrons redistribute.',body:'In this n-type example, ΦM > ΦS. Electrons initially flow net from the semiconductor to the metal. The resulting charge separation creates an electric field and bends the semiconductor bands upward.',formula:'At equilibrium: EF,M = EF,S',takeaway:'Equilibrium means zero net current, not that every electron stops moving. This animation is a teaching sequence, not a time-resolved simulation.'},
  {title:'Three arrows. Three different starting points.',body:'The interface barrier starts at EF. Band bending starts at the remote channel conduction band. The remaining distance is Δn, set here to 0.20 eV. Add the two smaller distances to recover the full barrier.',formula:'ΦBn = Δn + B',takeaway:'Try a larger metal work function. With χ and Δn fixed, both the electron barrier and upward band bending increase by 0.20 eV.'}
 ];
 const label=(x,y,t,c='#93a7b1',size=12,anchor='start')=>`<text x="${x}" y="${y}" fill="${c}" font-size="${size}" text-anchor="${anchor}">${t}</text>`;
 function arrow(x,a,b,color,t,side=1){const lo=Math.min(a,b),hi=Math.max(a,b);return `<path d="M${x} ${lo}V${hi} M${x-4} ${lo+6}L${x} ${lo}L${x+4} ${lo+6} M${x-4} ${hi-6}L${x} ${hi}L${x+4} ${hi-6}" stroke="${color}" stroke-width="2" fill="none"/>`+label(x+side*10,(lo+hi)/2+4,t,color,12,side===1?'start':'end');}
 function render(){
  const p=step===1?phase:1,bn=phi-4,bend=bn-.2,efS=(1-p)*bend;
  const sx=230+48*(1-p),end=670,w=end-sx,Y=e=>76+(1.3-e)/2.9*250;
  const ec=z=>.2+(1-p)*bend+p*bend*Math.max(1-z/.65,0)**2;
  const path=shift=>Array.from({length:90},(_,i)=>`${i?'L':'M'}${sx+w*i/89},${Y(ec(i/89)+shift)}`).join(' ');
  let s=`<title>Schottky barrier: an n-type example</title><desc>Electron barrier ${(bn).toFixed(2)} eV; channel offset 0.20 eV; final upward band bending ${(bend).toFixed(2)} eV. All spatial dimensions are schematic.</desc><rect x="55" y="62" width="175" height="272" rx="4" fill="#26343c"/><rect x="${sx}" y="62" width="${end-sx}" height="272" rx="4" fill="#17262b"/>`;
  if(p>.01)s+=`<rect x="${sx}" y="62" width="${w*.65}" height="272" fill="#e4b777" opacity="${.07*p}"/>`;
  s+=label(140,38,'METAL','#e4b777',12,'middle')+label(468,38,'n-TYPE SEMICONDUCTOR','#69c9e0',12,'middle');
  s+=`<path d="${path(0)}" stroke="#69c9e0" stroke-width="3" fill="none"/><path d="${path(-1.4)}" stroke="#e4b777" stroke-width="3" fill="none"/>`;
  s+=`<path d="M55 ${Y(0)}H230 M${sx} ${Y(efS)}H${end}" stroke="#c5d1d8" stroke-width="1.6" stroke-dasharray="6 5"/>`;
  s+=label(72,Y(0)-10,'EF,M = 0','#c5d1d8',12)+label(682,Y(ec(1))+4,'EC','#69c9e0',13)+label(682,Y(ec(1)-1.4)+4,'EV','#e4b777',13)+label(682,Y(efS)+4,p>.999?'EF':'EF,S','#c5d1d8',12);
  s+=label(57,365,'Electron energy ↑', '#93a7b1',11)+label(670,365,'In-plane position →', '#93a7b1',11,'end');
  if(step!==1){
   s+=arrow(sx+24,Y(0),Y(bn),'#69c9e0',`ΦBn = ${bn.toFixed(2)} eV`);
   if(step===2){
    s+=`<path d="M${sx+80} ${Y(.2)}H${sx+w*.62}" stroke="#97cbb6" stroke-dasharray="3 4"/>`;
    s+=arrow(sx+w*.53,Y(.2),Y(bn),'#97cbb6',`B = ${bend.toFixed(2)}`);
    s+=arrow(640,Y(0),Y(.2),'#e4b777','Δn = 0.20',-1);
   }else{s+=label(460,108,'Barrier ≠ band bending','#c5d1d8',12);}
  }else{
   if(p>.01){for(let i=0;i<5;i++){const yy=110+i*39;s+=label(217,yy,'−','#e4b777',16,'middle')+label(sx+15,yy,'+','#97cbb6',16,'middle');}}
   s+=label(465,109,p<.001?'Different Fermi levels':p>.999?'One common Fermi level':'Charge transfer → electric field', '#c5d1d8',12,'middle');
   if(p>.001&&p<.999){for(let i=0;i<6;i++){const t=((elapsed*.22+i/6)%1),x=540-t*380,y=151+Math.sin(t*Math.PI)*(-15);s+=`<circle cx="${x}" cy="${y}" r="3" fill="#a1e5f5" opacity=".8"/>`;}}
   if(p>.999)s+=label(465,132,'Bidirectional exchange · zero net current','#93a7b1',10,'middle');
  }
  get('concept-diagram').innerHTML=s;
  if(step===1){get('concept-phase-label').textContent=phase<.001?'Before contact':phase>.999?'Equilibrium':'Charge redistributes';get('concept-replay').textContent=playing?'Pause sequence':phase>.999?'Replay sequence':'Play sequence';get('concept-progress').value=phase;}
 }
 function select(n){step=n;playing=false;phi=4.8;phase=n===1?0:1;get('concept-title').textContent=copy[n].title;get('concept-body').textContent=copy[n].body;get('concept-formula').textContent=copy[n].formula;get('concept-takeaway').textContent=copy[n].takeaway;
  document.querySelectorAll('[data-concept]').forEach(b=>{const active=Number(b.dataset.concept)===n;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});
  get('concept-sequence').hidden=n!==1;get('concept-comparison').hidden=n!==2;
  document.querySelectorAll('[data-concept-phi]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.conceptPhi)===phi)));
  render();
 }
 document.querySelectorAll('[data-concept]').forEach(b=>b.addEventListener('click',()=>select(Number(b.dataset.concept))));
 get('concept-next').addEventListener('click',()=>select((step+1)%3));
 get('concept-replay').addEventListener('click',()=>{if(phase>=1)phase=0;playing=!playing;paused=false;render();});
 get('concept-progress').addEventListener('input',()=>{phase=Number(get('concept-progress').value);playing=false;render();});
 document.querySelectorAll('[data-concept-phi]').forEach(b=>b.addEventListener('click',()=>{phi=Number(b.dataset.conceptPhi);document.querySelectorAll('[data-concept-phi]').forEach(v=>v.setAttribute('aria-pressed',String(v===b)));render();}));
 // Keep the guide's controls independent from the full experiment.
 function animate(t){const dt=last?Math.min((t-last)/1000,.06):0;last=t;if(playing&&!paused&&!document.hidden){phase=Math.min(1,phase+dt/6);elapsed+=dt;if(phase===1)playing=false;if(t-drawn>33){drawn=t;render();}}requestAnimationFrame(animate);}
 select(0);requestAnimationFrame(animate);
})();
