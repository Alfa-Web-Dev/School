// Admin Fees: Collect / Payments / Defaulters / Fee structure  (ui.js, portal-pages.js ke baad)
const todayF=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())};
const optF=(a,v,l)=>a.map(x=>[x[v],x[l]]);
const rcptLink=no=>el('a',{href:'../receipt.html?no='+encodeURIComponent(no),target:'_blank',rel:'noopener'},no);
let FST=[],FCL=[];
function monthOpts(){const o=[['monthly','Monthly (har mahine)']],d=new Date();d.setMonth(d.getMonth()-6);
 for(let i=0;i<24;i++){const p=n=>String(n).padStart(2,'0');o.push([d.getFullYear()+'-'+p(d.getMonth()+1),'One-time: '+d.getFullYear()+'-'+p(d.getMonth()+1)]);d.setMonth(d.getMonth()+1)}return o}

async function initFees(){
 const m=$('#main');m.innerHTML='';m.append(el('h1',{'data-i':'n_fees'}));
 const tabs=el('div',{class:'tabs'}),box=el('div');m.append(tabs,box);
 const T={collect:['Collect',tabCollect],payments:['Payments',tabPayments],due:['Defaulters',tabDue],struct:['Fee structure',tabStruct]};
 function show(k){tabs.innerHTML='';Object.keys(T).forEach(x=>tabs.append(el('button',{class:'tab'+(x===k?' on':''),onclick:()=>show(x)},T[x][0])));box.innerHTML='';T[k][1](box).catch(e=>toast(e.message,1))}
 const [sr,cr]=await Promise.all([call('listStudents'),call('listClasses')]);
 FST=sr.students.filter(s=>s.status==='active');FCL=cr.classes;show('collect');applyI18n()}

async function tabCollect(box){
 const q=el('input',{placeholder:'Student ka naam / ID dhundo'}),cs=el('select',{},el('option',{value:''},'All classes'),FCL.map(c=>el('option',{value:c.classId},c.name))),res=el('div'),panel=el('div');
 box.append(el('div',{class:'bar'},cs,q),res,panel);
 const draw=()=>{const t=q.value.toLowerCase(),rows=FST.filter(s=>(!cs.value||s.classId===cs.value)&&(!t||(s.name+' '+s.studentId).toLowerCase().includes(t))).slice(0,30);
  res.innerHTML='';res.append(el('div',{class:'chips'},rows.map(s=>el('button',{type:'button',class:'chip',onclick:()=>open(s.studentId)},s.name+' · '+s.studentId+' · '+(FCL.find(c=>c.classId===s.classId)||{}).name))))};
 q.oninput=draw;cs.onchange=draw;draw();
 async function open(id){panel.innerHTML='';const r=await call('studentFees',{studentId:id}),f=r.fees,s=r.student;
  const types=f.lines.map(l=>l.feeType),ts=el('select',{},types.map(t=>el('option',{value:t},t))),amt=el('input',{type:'number',min:'1',step:'0.01'}),md=el('select',{},['cash','upi','bank','cheque'].map(x=>el('option',{value:x},x))),dt=el('input',{type:'date',value:todayF(),max:todayF()}),msg=el('div',{class:'err'});
  const setAmt=()=>{const l=f.lines.find(x=>x.feeType===ts.value);amt.value=l&&l.balance>0?l.balance:''};ts.onchange=setAmt;setAmt();
  panel.append(el('h3',{},s.name+' ('+s.studentId+') · '+s.className),el('p',{class:'mu'},'Session '+f.year+' · Total due '+rupee(f.totalDue)+' · Paid '+rupee(f.totalPaid)+' · Balance '+rupee(f.balance)),
   tableEl([{h:'Fee',f:x=>x.feeType},{h:'Due so far',f:x=>rupee(x.due)},{h:'Paid',f:x=>rupee(x.paid)},{h:'Balance',f:x=>rupee(x.balance)}],f.lines,'Is class ki fee structure set nahi hai (Fee structure tab)'));
  if(f.lines.length){const go=el('button',{type:'button'},'Receive payment');
   go.onclick=async()=>{go.disabled=true;msg.textContent='';try{const x=await call('addPayment',{payment:{studentId:id,feeType:ts.value,amount:amt.value,mode:md.value,date:dt.value}});
     toast('Payment mili. Receipt '+x.receiptNo);window.open('../receipt.html?no='+encodeURIComponent(x.receiptNo),'_blank');await open(id)}catch(e){msg.textContent=e.message;go.disabled=false}};
   panel.append(el('div',{class:'card',style:'max-width:460px'},el('label',{},'Fee'),ts,el('label',{},'Amount (₹)'),amt,el('label',{},'Mode'),md,el('label',{},'Date'),dt,go,msg))}
  if(f.payments.length)panel.append(el('h3',{},'Is session ki payments'),tableEl([{h:'Receipt',f:x=>rcptLink(x.receiptNo)},{h:'Date',f:x=>x.date},{h:'Fee',f:x=>x.feeType},{h:'Amount',f:x=>rupee(x.amount)},{h:'Mode',f:x=>x.mode}],f.payments))}}

async function tabPayments(box){
 const fr=el('input',{type:'date'}),to=el('input',{type:'date'}),q=el('input',{placeholder:'Naam / ID / receipt'}),out=el('div');let rows=[];
 box.append(el('div',{class:'bar'},el('span',{class:'mu'},'From'),fr,el('span',{class:'mu'},'To'),to,q,btn('Load',load,false),btn('CSV',()=>downloadCSV('payments.csv',[['receipt','date','studentId','name','class','fee','amount','mode','by']].concat(view().map(p=>[p.receiptNo,p.date,p.studentId,p.name,p.className,p.feeType,p.amount,p.mode,p.receivedBy]))))),out);
 const view=()=>{const t=q.value.toLowerCase();return rows.filter(p=>!t||(p.name+' '+p.studentId+' '+p.receiptNo).toLowerCase().includes(t))};
 async function load(){const r=await call('listPayments',{from:fr.value,to:to.value});rows=r.payments;draw(r)}
 function draw(r){out.innerHTML='';const v=view();out.append(el('p',{class:'mu'},v.length+' entries'+(r&&r.count>500?' (pehli 500)':'')+' · Net total '+rupee(v.reduce((a,p)=>a+p.amount,0))),
  tableEl([{h:'Receipt',f:p=>rcptLink(p.receiptNo)},{h:'Date',f:p=>p.date},{h:'Student',f:p=>p.name+' ('+p.studentId+')'},{h:'Class',f:p=>p.className},{h:'Fee',f:p=>p.feeType},
   {h:'Amount',f:p=>el('span',{style:p.amount<0?'color:#dc2626':''},rupee(p.amount))},{h:'Mode',f:p=>p.mode},{h:'By',f:p=>p.receivedBy},
   {h:'',f:p=>p.isVoid?el('span',{class:'mu'},'reversal'):p.voided?el('span',{class:'mu'},'voided'):btn('Void',()=>formModal('Void '+p.receiptNo,[{k:'reason',l:'Karan (zaruri)',req:1}],{},async x=>{await call('voidPayment',{receiptNo:p.receiptNo,reason:x.reason});toast('Void ho gayi (ulti entry judi)');await load()}))}],v,'Koi payment nahi'))}
 q.oninput=()=>draw();await load()}

async function tabDue(box){
 const cs=el('select',{},el('option',{value:''},'All classes'),FCL.map(c=>el('option',{value:c.classId},c.name))),out=el('div');let last=null;
 box.append(el('div',{class:'bar'},cs,btn('CSV',()=>last&&downloadCSV('defaulters.csv',[['studentId','name','class','parent phone','due','paid','balance']].concat(last.students.map(s=>[s.studentId,s.name,s.className,s.phone,s.due,s.paid,s.balance]))))),out);
 async function load(){const r=await call('defaulters',{classId:cs.value});last=r;out.innerHTML='';out.append(el('p',{},el('b',{},r.students.length+' students · Total baaki '+rupee(r.total))),
  tableEl([{h:'ID',f:s=>s.studentId},{h:'Name',f:s=>s.name},{h:'Class',f:s=>s.className},{h:'Parent phone',f:s=>s.phone?el('a',{href:'tel:'+s.phone},s.phone):''},{h:'Due',f:s=>rupee(s.due)},{h:'Paid',f:s=>rupee(s.paid)},{h:'Baaki',f:s=>rupee(s.balance)}],r.students,'Kisi ka baaki nahi'))}
 cs.onchange=load;await load()}

async function tabStruct(box){
 const cs=el('select',{},el('option',{value:''},'All classes'),FCL.map(c=>el('option',{value:c.classId},c.name))),out=el('div');
 const F=()=>[{k:'classId',l:'Class',type:'select',opts:optF(FCL,'classId','name')},{k:'feeType',l:'Fee ka naam (jaise Tuition)',req:1},{k:'amount',l:'Amount (₹)',type:'number',req:1},{k:'dueMonth',l:'Kab',type:'select',opts:monthOpts()}];
 box.append(el('div',{class:'bar'},cs,btn('+ Add fee',()=>formModal('Add fee',F(),{classId:cs.value,dueMonth:'monthly'},async v=>{await call('saveFeeStructure',{fee:v});await load()}),false)),out);
 async function load(){const r=await call('getFeeStructure'),rows=r.fees.filter(f=>!cs.value||f.classId===cs.value);out.innerHTML='';
  out.append(tableEl([{h:'Class',f:f=>f.className},{h:'Fee',f:f=>f.feeType},{h:'Amount',f:f=>rupee(f.amount)},{h:'Kab',f:f=>f.dueMonth==='monthly'?'Har mahine':f.dueMonth},
   {h:'',f:f=>el('div',{class:'row'},btn('Edit',()=>formModal('Edit fee',F().map(x=>x.k==='classId'||x.k==='feeType'?Object.assign({},x,{type:'select',opts:[[f[x.k],x.k==='classId'?f.className:f.feeType]]}):x),f,async v=>{await call('saveFeeStructure',{fee:v});await load()})),
    btn('Delete',async()=>{if(confirm(f.feeType+' ('+f.className+') hatani hai? Purani payments nahi hatengi.')){await call('deleteFee',{classId:f.classId,feeType:f.feeType});await load()}}))}],rows,'Abhi fee structure nahi hai. + Add fee dabao.'))}
 cs.onchange=load;await load()}
