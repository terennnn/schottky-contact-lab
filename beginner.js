'use strict';
(()=>{
 const el=id=>document.getElementById(id);
 let focus='chi',tour=-1;
 const meanings={chi:['χ · Electron affinity','From the conduction-band edge to vacuum, at the same position. χ = Evac − EC.'],metal:['ΦM · Metal work function','From the metal Fermi level to its vacuum level. ΦM = Evac − EF,M.'],semi:['ΦS · Material work function','From the remote material Fermi level to its vacuum level. It depends on the carrier state.'],barrier:['ΦBn · Electron barrier','From the common Fermi level to the conduction band at the interface. ΦBn = EC(0) − EF.'],bend:['B · Band bending','Compare the interface and remote conduction-band edges. B = EC(0) − EC(channel). Positive means bend up.']};
 const txt=(x,y,t,color='#575248',size=14)=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}">${Notation.svg(t)}</text>`;
 function diagram(before){
  const Y=e=>300-e*40,sx=before?200:180,end=590;
  const E=x=>before?.8:.2+.6*Math.max(1-(x-sx)/280,0)**2;
  const path=d=>Array.from({length:61},(_,i)=>`${i?'L':'M'}${sx+(end-sx)*i/60},${Y(E(sx+(end-sx)*i/60)+d)}`).join(' ');
  const edge=(x,a,b,key,label,color)=>{const active=focus===key;return `<g opacity="${active?1:.18}"><path d="M${x} ${Y(a)}V${Y(b)} M${x-4} ${Y(a)+6}L${x} ${Y(a)}L${x+4} ${Y(a)+6} M${x-4} ${Y(b)-6}L${x} ${Y(b)}L${x+4} ${Y(b)-6}" fill="none" stroke="${color}" stroke-width="${active?3:1.5}"/>${txt(x+9,Y((a+b)/2),label,color,active?16:13)}</g>`;};
  let s=`<title>${before?'Before contact':'At equilibrium'}: illustrated n-type contact</title><rect x="20" y="70" width="160" height="310" fill="#e5ded2"/><rect x="${sx}" y="70" width="${end-sx}" height="310" fill="#edf2ed"/>`;
  s+=txt(50,45,'METAL','#9a5a18')+txt(330,45,'n-TYPE MATERIAL','#116777');
  s+=`<path d="M20 ${Y(4.8)}H180" stroke="#78529b" stroke-dasharray="5 4"/><path d="${path(4)}" fill="none" stroke="#78529b" stroke-width="2" stroke-dasharray="5 4"/><path d="${path(0)}" fill="none" stroke="#116777" stroke-width="3"/><path d="${path(-1.4)}" fill="none" stroke="#9a5a18" stroke-width="3"/><path d="M20 ${Y(0)}H180 M${sx} ${Y(before?.6:0)}H590" stroke="#575248" stroke-dasharray="6 5"/>`;
  s+=txt(595,Y(E(end)+4)+4,'Evac','#78529b',13)+txt(595,Y(E(end))+4,'EC','#116777')+txt(595,Y(E(end)-1.4)+4,'EV','#9a5a18')+txt(25,Y(0)+19,'EF,M',undefined,12)+txt(595,Y(before?.6:0)+18,before?'EF,S':'EF',undefined,12);
  s+=edge(65,4.8,0,'metal','ΦM','#9a5a18')+edge(480,E(480)+4,E(480),'chi','χ','#78529b')+edge(555,E(end)+4,before?.6:0,'semi','ΦS','#316c50');
  if(!before){s+=edge(180,.8,0,'barrier','ΦBn','#116777')+edge(335,.8,.2,'bend','B','#316c50');s+=`<path d="M270 ${Y(.2)}H420" stroke="#316c50" stroke-dasharray="3 4" opacity=".5"/>`;}
  s+=txt(20,415,'Energy ↑ · position → · schematic scale',undefined,12);
  return s;
 }
 function draw(){el('beginner-before').innerHTML=diagram(true);el('beginner-after').innerHTML=diagram(false);el('symbol-explanation').innerHTML=Notation.html(meanings[focus][1]);el('symbol-heading').innerHTML=Notation.html(meanings[focus][0]);document.querySelectorAll('[data-energy-focus]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.energyFocus===focus)));}
 document.querySelectorAll('[data-energy-focus]').forEach(b=>b.addEventListener('click',()=>{focus=b.dataset.energyFocus;draw();}));
 const steps=[
  ['Start with electrons','Au + 1L MoS₂, n-type, offset 0.20 eV. Before reading the result, predict: is ΦM larger or smaller than ΦS?','ΦS = 4.03 + 0.20 = 4.23 eV. Au has ΦM = 5.10 eV, so the bands bend up by +0.87 eV.'],
  ['Switch to holes','The same material and metal, now p-type. The 0.20 eV offset is measured from the valence band. Predict the bending direction again.','ΦS = 4.03 + 2.39 − 0.20 = 6.22 eV. Now ΦM < ΦS, so the bands bend down by −1.12 eV. The electron barrier remains 1.07 eV.'],
  ['Move the Fermi level','Keep p-type and increase the offset to 0.60 eV. Will the downward bending become stronger or weaker?','ΦS falls to 5.82 eV. B changes from −1.12 to −0.72 eV: the downward bending becomes weaker. The ideal electron barrier is still 1.07 eV.'],
  ['Change the metal','Keep the same p-type channel and replace Au with Pt. Predict what happens to the electron and hole barriers.','ΦM rises from 5.10 to 5.65 eV. The electron barrier rises to 1.62 eV; the hole barrier falls to 0.77 eV. B becomes −0.17 eV.']
 ];
 function applyStep(){
  $('metal').value=tour===3?'m7':'m0';$('semi').value='s0';$('layers').value='1';state.type=tour===0?'n':'p';state.offset=tour>=2?.6:.2;state.p=1;state.playing=false;applyMaterial();
  el('tour-title').textContent=`${tour+1} / 4 · ${steps[tour][0]}`;el('tour-question').innerHTML=Notation.html(steps[tour][1]);el('tour-answer').hidden=true;el('tour-answer').innerHTML=Notation.html(steps[tour][2]);el('tour-body').hidden=false;el('tour-start').hidden=true;el('tour-next').textContent=tour===3?'Finish guide':'Next step →';el('tour-back').disabled=tour===0;el('tour-mismatch').hidden=true;
 }
 el('tour-start').addEventListener('click',()=>{tour=0;applyStep();});
 el('tour-reveal').addEventListener('click',()=>{el('tour-answer').hidden=!el('tour-answer').hidden;});
 el('tour-next').addEventListener('click',()=>{if(tour===3){tour=-1;el('tour-body').hidden=true;el('tour-start').hidden=false;el('tour-start').textContent='Restart guided experiment';}else{tour++;applyStep();}});
 el('tour-back').addEventListener('click',()=>{if(tour>0){tour--;applyStep();}});
 function refresh(){
  const m=model,dir=Math.abs(m.bend)<.015?'stay nearly flat':m.bend>0?'bend up':'bend down',rel=Math.abs(m.bend)<.015?'≈':m.bend>0?'>':'<';
  el('result-reason').innerHTML=Notation.html(`ΦM = ${fmt(state.phi)} eV ${rel} ΦS = ${fmt(m.phiS)} eV. The interface bands ${dir}; B = ${signed(m.bend)} eV.`);
  el('result-carriers').innerHTML=Notation.html(`Your ${state.type}-type setting places EF ${fmt(state.offset)} eV ${state.type==='n'?'below the remote conduction band':'above the remote valence band'}. ${m.regime==='flat'?'There is little band bending.':`${state.type==='n'?'Electrons':'Holes'} ${m.regime==='accumulation'?'accumulate':'are depleted'} near the contact.`}${m.inverted?' Strong bending may produce inversion; this schematic does not solve carrier densities.':''}`);
  el('result-barriers').innerHTML=Notation.html(`Electron barrier ΦBn = ${fmt(m.bn)} eV; hole barrier ΦBp = ${fmt(m.bp)} eV. Barrier height and band bending measure different energy differences.`);
  if(tour>=0)el('tour-mismatch').hidden=state.semi.id==='s0'&&state.layers===1&&state.metal.id===(tour===3?'m7':'m0')&&state.type===(tour===0?'n':'p')&&Math.abs(state.offset-(tour>=2?.6:.2))<.001&&!state.custom;
 }
 window.BeginnerLab={refresh};draw();refresh();
})();
