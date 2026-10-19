'use strict';
// Format only known physics tokens. Always escape text before producing markup.
window.Notation=(()=>{
 const tokens={
  'EF,M':['E','F,M'],'EF,S':['E','F,S'],'EF':['E','F'],'EC':['E','C'],'EV':['E','V'],
  'ΦBn':['Φ','Bn'],'ΦBp':['Φ','Bp'],'ΦM':['Φ','M'],'ΦS':['Φ','S'],
  'Δn':['Δ','n'],'Δp':['Δ','p'],'Eg':['E','g'],'qVbi':['qV','bi'],'Vbi':['V','bi'],'Evac':['E','vac'],
  'E꜀':['E','C'],'Eᵥ':['E','V'],'Eꜰ':['E','F'],'Δₙ':['Δ','n'],'Δₚ':['Δ','p']
 };
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const keys=Object.keys(tokens).sort((a,b)=>b.length-a.length).join('|');
 const pattern=new RegExp('(?<![A-Za-z0-9])('+keys+')(?![A-Za-z0-9])','g');
 function format(value,svg=false){return escape(value).replace(pattern,k=>{const [base,sub]=tokens[k];return svg?`${base}<tspan baseline-shift="sub" font-size="75%">${sub}</tspan>`:`${base}<sub>${sub}</sub>`;});}
 function tree(root){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
  while(walker.nextNode()){
   const n=walker.currentNode,p=n.parentElement;
   if(!p||p.closest('script,style,textarea,select,svg,sub,sup,pre,code'))continue;
   pattern.lastIndex=0;if(pattern.test(n.nodeValue))nodes.push(n);
  }
  for(const n of nodes){const span=document.createElement('span');span.innerHTML=format(n.nodeValue);n.replaceWith(...span.childNodes);}
 }
 document.addEventListener('DOMContentLoaded',()=>tree(document.body));
 return {html:v=>format(v),svg:v=>format(v,true),tree};
})();
