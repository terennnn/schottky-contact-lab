'use strict';
const METAL_SOURCE='https://doi.org/10.1063/1.323539';
const TMD_SOURCE='https://arxiv.org/html/2103.07858#S3.T5';
const metals=[
 ['Au','Gold',5.10,'#d7b46d'],['Ti','Titanium',4.33,'#a7b1ba'],['Al','Aluminum',4.28,'#bbc8d2'],['Ag','Silver',4.26,'#d0d8df'],['Cu','Copper',4.65,'#c58865'],['Ni','Nickel',5.15,'#b2b6a5'],['Pd','Palladium',5.12,'#a8bcc6'],['Pt','Platinum',5.65,'#d6d6ca'],['Cr','Chromium',4.50,'#91a6b4'],['Sc','Scandium',3.50,'#b2a7ce']
].map(([name,zh,phi,color],i)=>({id:'m'+i,name,zh,phi,color,source:METAL_SOURCE,note:'Michaelson (1977) · polycrystalline reference'}));
const MULTILAYER_VALUES={"MoS2":[[4.03,6.42],[4.14,6.03],[4.21,5.88],[4.28,5.83]],"MoSe2":[[3.61,5.69],[3.84,5.57],[3.96,5.44],[4.03,5.41]],"MoTe2":[[3.77,5.31],[4.03,5.26],[4.15,5.24],[4.23,5.21]],"WS2":[[3.62,6.09],[3.81,5.76],[3.93,5.59],[4.0,5.54]],"WSe2":[[3.37,5.38],[3.57,5.29],[3.69,5.14],[3.76,5.1]],"WTe2":[[3.62,5.05],[3.81,5.0],[3.92,4.96],[3.99,4.95]]};
const semiconductors=Object.entries(MULTILAYER_VALUES).map(([name,values],i)=>({id:'s'+i,name,zh:'',color:'#72bdc8',source:TMD_SOURCE,method:'G₀W₀ + SOC',dataset:'multilayer',note:'Kim & Choi (2021), Table 5 · 2H phase · GW + SOC',phaseNote:'2H phase · 1–4L',sourceNote:'Kim & Choi (2021), Table 5; 2H phase; Eg = IP − EA.',rows:values.map(([chi,ip],i)=>({layers:i+1,chi,ip,eg:Math.round((ip-chi)*100)/100,source:TMD_SOURCE}))}));
