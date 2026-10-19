'use strict';
const METAL_SOURCE='https://doi.org/10.1063/1.323539';
const TMD_SOURCE='https://arxiv.org/html/2103.07858#S3.T5';
const metals=[
 ['Au','Gold',5.10,'#d7b46d'],['Ti','Titanium',4.33,'#a7b1ba'],['Al','Aluminum',4.28,'#bbc8d2'],['Ag','Silver',4.26,'#d0d8df'],['Cu','Copper',4.65,'#c58865'],['Ni','Nickel',5.15,'#b2b6a5'],['Pd','Palladium',5.12,'#a8bcc6'],['Pt','Platinum',5.65,'#d6d6ca'],['Cr','Chromium',4.50,'#91a6b4'],['Sc','Scandium',3.50,'#b2a7ce']
].map(([name,zh,phi,color],i)=>({id:'m'+i,name,zh,phi,color,source:METAL_SOURCE,note:'Michaelson (1977) · polycrystalline reference'}));
// Table 5, GW+SOC. Each pair is [electron affinity, ionization potential], eV.
// Eg is derived from IP-EA to preserve exact identities despite table rounding.
const semiconductors=[
 ['MoS₂','Molybdenum disulfide',[[4.03,6.42],[4.14,6.03],[4.21,5.88],[4.28,5.83]],'#72bdc8'],
 ['MoSe₂','Molybdenum diselenide',[[3.61,5.69],[3.84,5.57],[3.96,5.44],[4.03,5.41]],'#ae93d2'],
 ['WS₂','Tungsten disulfide',[[3.62,6.09],[3.81,5.76],[3.93,5.59],[4.00,5.54]],'#87c2a3'],
 ['WSe₂','Tungsten diselenide',[[3.37,5.38],[3.57,5.29],[3.69,5.14],[3.76,5.10]],'#d69686']
].map(([name,zh,rows,color],i)=>({id:'s'+i,name,zh,color,source:TMD_SOURCE,note:'Kim & Choi (2021) · GW + SOC · 2H phase',rows:rows.map(([chi,ip],k)=>({layers:k+1,chi,eg:Math.round((ip-chi)*100)/100}))}));
