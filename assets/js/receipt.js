// Printable receipt: receipt.html?no=R0001  (admin ya us student ka login chahiye)
const ONES=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'],TENS=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
const two=n=>n<20?ONES[n]:TENS[Math.floor(n/10)]+(n%10?' '+ONES[n%10]:'');
const three=n=>(n>=100?ONES[Math.floor(n/100)]+' Hundred'+(n%100?' ':''):'')+(n%100?two(n%100):'');
function inrWords(x){x=Math.abs(x);let r=Math.floor(x),p=Math.round((x-r)*100);if(p===100){r++;p=0}
 const cr=Math.floor(r/1e7);r%=1e7;const lk=Math.floor(r/1e5);r%=1e5;const th=Math.floor(r/1e3);r%=1e3;const parts=[];
 if(cr)parts.push(three(cr)+' Crore');if(lk)parts.push(two(lk)+' Lakh');if(th)parts.push(two(th)+' Thousand');if(r)parts.push(three(r));
 return (parts.join(' ')||'Zero')+' Rupees'+(p?' and '+two(p)+' Paise':'')+' Only'}
const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
(async()=>{
 const box=document.getElementById('rc'),no=new URLSearchParams(location.search).get('no')||'';
 try{const r=await api('getReceipt',{receiptNo:no});
  if(!r.ok){if(r.error==='expired'||r.error==='Not allowed'){location.href='login.html';return}throw new Error(r.error)}
  const p=r.receipt,s=r.student,neg=p.amount<0,row=(a,b)=>'<tr><td class="mu">'+a+'</td><td><b>'+E(b)+'</b></td></tr>';
  box.innerHTML='<div class="rcpt'+(p.voided?' void':'')+'"><div class="rh"><h2>'+E(CFG.name)+'</h2><div class="mu">'+E(CFG.address)+' · '+E(CFG.phone)+'</div><h3>'+(neg?'REVERSAL ENTRY':'FEE RECEIPT')+'</h3></div>'
   +(p.voided?'<div class="stamp">CANCELLED</div>':'')
   +'<table class="rt">'+row('Receipt no',p.receiptNo)+row('Date',p.date)+row('Student',s.name+' ('+s.studentId+')')+row('Class',s.className+(s.roll?' · Roll '+s.roll:''))+row('Parent',s.parentName)
   +row('Fee',p.feeType)+row('Mode',p.mode.replace('void:','Reversal of '))+row('Received by',p.receivedBy)+'</table>'
   +'<div class="amt">'+(neg?'-':'')+'₹'+(Number.isInteger(p.amount)?Math.abs(p.amount).toLocaleString('en-IN'):Math.abs(p.amount).toLocaleString('en-IN',{minimumFractionDigits:2}))+'</div><div class="mu" style="text-align:center">'+E(inrWords(p.amount))+'</div>'
   +'<div class="sig"><span>Parent/Student sign</span><span>Authorised sign</span></div></div><button class="no-print" onclick="window.print()">Print / Save as PDF</button>'}
 catch(e){box.textContent=e.message||'Error'}})();
