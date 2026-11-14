// Fees (Phase 5): structure, payments ledger (sirf nayi rows; galti = void entry), receipt, defaulters
const PAY_MODES=['cash','upi','bank','cheque'];
const round2=n=>Math.round(n*100)/100;

function getFeeStructure(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 const cn=nameMap('Classes','classId');
 return{ok:true,fees:table('FeeStructure').rows.map(f=>({classId:String(f.classId),className:cn[String(f.classId)]||String(f.classId),feeType:String(f.feeType),amount:Number(f.amount)||0,dueMonth:String(f.dueMonth)}))}}

function saveFeeStructure(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.fee||{},cid=resolveClass(d.classId),type=clean(d.feeType,40),amt=round2(Number(d.amount)),dm=clean(d.dueMonth,10);
  if(!cid)throw new Error('Class chuno');if(!type)throw new Error('Fee ka naam zaruri hai');
  if(!isFinite(amt)||amt<=0||amt>1e7)throw new Error('Amount sahi daalo');
  if(dm!=='monthly'&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(dm))throw new Error('Due month "monthly" ya YYYY-MM hona chahiye');
  const ex=find('FeeStructure',f=>String(f.classId)===cid&&String(f.feeType).toLowerCase()===type.toLowerCase());
  if(ex){setRow('FeeStructure',ex._row,{amount:amt,dueMonth:dm});log(s.userId,'fee_edit',cid+' '+type);return{ok:true}}
  addRow('FeeStructure',{classId:cid,feeType:type,amount:amt,dueMonth:dm});log(s.userId,'fee_add',cid+' '+type);return{ok:true}}))}

function deleteFee(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const cid=resolveClass(b.classId),ex=find('FeeStructure',f=>String(f.classId)===cid&&String(f.feeType)===String(b.feeType));
  if(!ex)throw new Error('Fee nahi mili');tab('FeeStructure').deleteRow(ex._row);log(s.userId,'fee_delete',cid+' '+b.feeType);return{ok:true}}))}

function studentFees(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>{const r=find('Students',x=>String(x.studentId)===String(b.studentId));if(!r)throw new Error('Student nahi mila');
  return{ok:true,student:profileOf(r),fees:feesOf(r)}})}

function nextReceipt(){
 const pre=clean((find('Settings',x=>String(x.key)==='receipt_prefix')||{}).value,5)||'R';let m=0;
 table('Payments').rows.forEach(p=>{const x=String(p.receiptNo);if(x.indexOf(pre)===0){const v=parseInt(x.slice(pre.length),10);if(v>m)m=v}});
 return pre+String(m+1).padStart(4,'0')}

function addPayment(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.payment||{},r=find('Students',x=>String(x.studentId)===String(d.studentId));if(!r)throw new Error('Student nahi mila');
  const type=clean(d.feeType,40),amt=round2(Number(d.amount)),mode=clean(d.mode,10).toLowerCase(),date=dstr(d.date)||todayStr();
  if(!find('FeeStructure',f=>String(f.classId)===String(r.classId)&&String(f.feeType)===type))throw new Error('Is class ki fee structure mein "'+type+'" nahi hai');
  if(!isFinite(amt)||amt<=0||amt>1e7)throw new Error('Amount sahi daalo');
  if(PAY_MODES.indexOf(mode)<0)throw new Error('Mode cash/upi/bank/cheque mein se ho');
  if(!validDate(date)||date>todayStr())throw new Error('Date galat hai (aane wali date nahi chalegi)');
  const no=nextReceipt();addRow('Payments',{receiptNo:no,studentId:String(r.studentId),feeType:type,amount:amt,mode,date,receivedBy:s.userId});
  log(s.userId,'payment',no+' '+r.studentId+' '+type+' '+amt);
  return{ok:true,receiptNo:no,fees:feesOf(r)}}))}

// Galti sudharne ke liye purani row delete nahi hoti: ulta (negative) entry judti hai.
function voidPayment(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const rows=table('Payments').rows,o=rows.find(p=>String(p.receiptNo)===String(b.receiptNo));
  if(!o)throw new Error('Receipt nahi mili');
  if(Number(o.amount)<=0||String(o.mode).indexOf('void:')===0)throw new Error('Yeh entry void nahi ho sakti');
  if(rows.some(p=>String(p.mode)==='void:'+o.receiptNo))throw new Error('Yeh receipt pehle hi void ho chuki hai');
  const reason=clean(b.reason,100);if(!reason)throw new Error('Void ka karan likho');
  const no=nextReceipt();addRow('Payments',{receiptNo:no,studentId:String(o.studentId),feeType:String(o.feeType),amount:-Number(o.amount),mode:'void:'+o.receiptNo,date:todayStr(),receivedBy:s.userId});
  log(s.userId,'void',o.receiptNo+' -> '+no+' ('+reason+')');return{ok:true,receiptNo:no}}))}

function listPayments(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 const st={},cn=nameMap('Classes','classId'),un=nameMap('Users','userId');table('Students').rows.forEach(r=>st[String(r.studentId)]=r);
 const all=table('Payments').rows,voided={};all.forEach(p=>{const m=/^void:(.+)$/.exec(String(p.mode));if(m)voided[m[1]]=1});
 const from=dstr(b.from),to=dstr(b.to),sid=clean(b.studentId,20);
 const rows=all.filter(p=>(!sid||String(p.studentId)===sid)&&(!from||dstr(p.date)>=from)&&(!to||dstr(p.date)<=to)).map(p=>{const r=st[String(p.studentId)]||{};
  return{receiptNo:String(p.receiptNo),studentId:String(p.studentId),name:r.name||'',className:cn[String(r.classId)]||String(r.classId||''),feeType:String(p.feeType),amount:Number(p.amount)||0,mode:String(p.mode),date:dstr(p.date),
   receivedBy:un[String(p.receivedBy)]||String(p.receivedBy),isVoid:String(p.mode).indexOf('void:')===0,voided:!!voided[String(p.receiptNo)]}});
 rows.sort((a,c)=>a.date<c.date?1:a.date>c.date?-1:(a.receiptNo<c.receiptNo?1:-1));
 const total=round2(rows.reduce((a,p)=>a+p.amount,0));
 return{ok:true,payments:rows.slice(0,500),total,count:rows.length}}

function getReceipt(b){
 const s=guard(b,['admin','student']);if(!s)return DENIED;
 return safe(()=>{const p=find('Payments',x=>String(x.receiptNo)===String(b.receiptNo));if(!p)throw new Error('Receipt nahi mili');
  if(s.role==='student'&&String(p.studentId)!==s.userId)return DENIED;
  const r=find('Students',x=>String(x.studentId)===String(p.studentId))||{},un=nameMap('Users','userId');
  return{ok:true,receipt:{receiptNo:String(p.receiptNo),date:dstr(p.date),feeType:String(p.feeType),amount:Number(p.amount)||0,mode:String(p.mode),receivedBy:un[String(p.receivedBy)]||String(p.receivedBy),
   isVoid:String(p.mode).indexOf('void:')===0,voided:table('Payments').rows.some(x=>String(x.mode)==='void:'+p.receiptNo)},student:r.studentId?profileOf(r):{}}})}

function defaulters(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>{const cid=b.classId?resolveClass(b.classId):'',c=feeCtx(),cn=nameMap('Classes','classId');
  const rows=table('Students').rows.filter(r=>String(r.status).toLowerCase()==='active'&&(!cid||String(r.classId)===cid)).map(r=>{const f=feesOfCtx(r,c);
   return{studentId:String(r.studentId),name:r.name,className:cn[String(r.classId)]||String(r.classId),roll:String(r.roll),phone:String(r.parentPhone||''),due:f.totalDue,paid:f.totalPaid,balance:f.balance}})
   .filter(x=>x.balance>0).sort((a,d)=>d.balance-a.balance);
  return{ok:true,students:rows,total:round2(rows.reduce((a,x)=>a+x.balance,0))}})}
