'use strict';
(function(root){
 function contact({phi,chi,eg,type,offset}){
  if(![phi,chi,eg,offset].every(Number.isFinite)||eg<=0||offset<0||offset>eg/2) throw Error('Invalid material parameters');
  const delta=type==='p'?eg-offset:offset;
  const phiS=chi+delta,bn=phi-chi,bp=eg-bn,bend=phi-phiS;
  const majorityBend=type==='p'?-bend:bend;
  const flat=Math.abs(bend)<.015;
  const regime=flat?'flat':majorityBend>0?'depletion':'accumulation';
  const inverted=regime==='depletion'&&(type==='n'?bn>eg/2:bn<eg/2);
  return {delta,phiS,bn,bp,bend,regime,inverted,majority: type==='p'?bp:bn};
 }
 function bandAt(x,p,m,length=1){const f=Math.max(1-x/length,0)**2;return m.delta+(1-p)*m.bend+p*m.bend*f;}
 root.ContactPhysics={contact,bandAt};
 if(typeof module!=='undefined')module.exports=root.ContactPhysics;
})(typeof window!=='undefined'?window:globalThis);
