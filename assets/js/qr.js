// Minimal QR Code generator (byte mode, error correction M, versions 1-9, up to ~170 bytes). No dependencies.
const QR=(function(){
 const EXP=new Array(512),LOG=new Array(256);(function(){let x=1;for(let i=0;i<255;i++){EXP[i]=x;LOG[x]=i;x<<=1;if(x&256)x^=0x11D}for(let i=255;i<512;i++)EXP[i]=EXP[i-255]})();
 const mul=(a,b)=>a&&b?EXP[LOG[a]+LOG[b]]:0;
 const gen=n=>{let g=[1];for(let i=0;i<n;i++){const ng=new Array(g.length+1).fill(0);g.forEach((c,j)=>{ng[j]^=c;ng[j+1]^=mul(c,EXP[i])});g=ng}return g};
 const rs=(data,n)=>{const g=gen(n),r=new Array(n).fill(0);data.forEach(d=>{const f=d^r.shift();r.push(0);if(f)g.slice(1).forEach((c,i)=>r[i]^=mul(c,f))});return r};
 // [total codewords, ecc per block, g1 blocks, g1 data cw, g2 blocks, g2 data cw]  (level M)
 const VT=[null,[26,10,1,16,0,0],[44,16,1,28,0,0],[70,26,1,44,0,0],[100,18,2,32,0,0],[134,24,2,43,0,0],[172,16,4,27,0,0],[196,18,4,31,0,0],[242,22,2,38,2,39],[292,22,3,36,2,37],[346,26,4,43,1,44]];
 const AL=[null,[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50]];
 const bch=(v,g,len)=>{let d=v<<len;const gl=g.toString(2).length;for(let i=d.toString(2).length;i>=gl;i--)if(d>>(i-1)&1)d^=g<<(i-gl);return(v<<len)|d};
 function encode(text){
  const bytes=[...unescape(encodeURIComponent(String(text)))].map(c=>c.charCodeAt(0));
  let ver=0;for(let v=1;v<=9;v++){const cap=VT[v][2]*VT[v][3]+VT[v][4]*VT[v][5];if(bytes.length+2<=cap&&bytes.length*8+12<=cap*8){ver=v;break}}
  if(!ver)throw new Error('Text too long for QR');
  const V=VT[ver],dataCw=V[2]*V[3]+V[4]*V[5],bits=[],put=(v,n)=>{for(let i=n-1;i>=0;i--)bits.push((v>>i)&1)};
  put(4,4);put(bytes.length,8);bytes.forEach(b=>put(b,8));put(0,Math.min(4,dataCw*8-bits.length));while(bits.length%8)bits.push(0);
  const cw=[];for(let i=0;i<bits.length;i+=8){let b=0;for(let j=0;j<8;j++)b=(b<<1)|bits[i+j];cw.push(b)}
  for(let p=0;cw.length<dataCw;p++)cw.push(p%2?17:236);
  // blocks
  const blocks=[];let pos=0;for(let i=0;i<V[2];i++){blocks.push(cw.slice(pos,pos+V[3]));pos+=V[3]}for(let i=0;i<V[4];i++){blocks.push(cw.slice(pos,pos+V[5]));pos+=V[5]}
  const ecc=blocks.map(b=>rs(b,V[1])),out=[],maxd=Math.max(V[3],V[5]);
  for(let i=0;i<maxd;i++)blocks.forEach(b=>{if(i<b.length)out.push(b[i])});for(let i=0;i<V[1];i++)ecc.forEach(e=>out.push(e[i]));
  const n=17+4*ver,M=[...Array(n)].map(()=>new Array(n).fill(null)),F=[...Array(n)].map(()=>new Array(n).fill(false));
  const set=(r,c,v,f)=>{if(r<0||c<0||r>=n||c>=n)return;M[r][c]=v?1:0;if(f)F[r][c]=true};
  const finder=(r,c)=>{for(let i=-1;i<=7;i++)for(let j=-1;j<=7;j++){const on=i>=0&&i<=6&&j>=0&&j<=6&&(i===0||i===6||j===0||j===6||(i>=2&&i<=4&&j>=2&&j<=4));set(r+i,c+j,on,true)}};
  finder(0,0);finder(0,n-7);finder(n-7,0);
  for(let i=8;i<n-8;i++){set(6,i,i%2===0,true);set(i,6,i%2===0,true)}
  const al=AL[ver],last=al.length-1;al.forEach((r,ri)=>al.forEach((c,ci)=>{if((ri===0&&ci===0)||(ri===0&&ci===last)||(ri===last&&ci===0))return;for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++)set(r+i,c+j,Math.max(Math.abs(i),Math.abs(j))!==1,true)}));
  set(n-8,8,1,true);
  const reserve=[];for(let i=0;i<9;i++){reserve.push([8,i],[i,8])}for(let i=0;i<8;i++){reserve.push([8,n-1-i],[n-1-i,8])}reserve.forEach(([r,c])=>{if(!F[r][c]){M[r][c]=0;F[r][c]=true}});
  if(ver>=7)for(let i=0;i<6;i++)for(let j=0;j<3;j++){F[i][n-11+j]=true;F[n-11+j][i]=true;M[i][n-11+j]=0;M[n-11+j][i]=0}
  // place data
  const dbits=[];out.forEach(b=>{for(let i=7;i>=0;i--)dbits.push((b>>i)&1)});let k=0,up=true;
  for(let c=n-1;c>0;c-=2){if(c===6)c--;for(let i=0;i<n;i++){const r=up?n-1-i:i;for(let j=0;j<2;j++){const cc=c-j;if(!F[r][cc]){M[r][cc]=k<dbits.length?dbits[k++]:0}}}up=!up}
  const masks=[(r,c)=>(r+c)%2===0,(r,c)=>r%2===0,(r,c)=>c%3===0,(r,c)=>(r+c)%3===0,(r,c)=>(Math.floor(r/2)+Math.floor(c/3))%2===0,(r,c)=>(r*c)%2+(r*c)%3===0,(r,c)=>((r*c)%2+(r*c)%3)%2===0,(r,c)=>((r+c)%2+(r*c)%3)%2===0];
  const build=m=>{const G=M.map(r=>r.slice());for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(!F[r][c]&&masks[m](r,c))G[r][c]^=1;
   const fi=bch(0*8+m,0x537,10)^0x5412,fb=i=>(fi>>i)&1; // level M = 00
   for(let i=0;i<=5;i++)G[i][8]=fb(i);G[7][8]=fb(6);G[8][8]=fb(7);G[8][7]=fb(8);for(let i=9;i<15;i++)G[8][14-i]=fb(i);
   for(let i=0;i<8;i++)G[8][n-1-i]=fb(i);for(let i=8;i<15;i++)G[n-15+i][8]=fb(i);G[n-8][8]=1;
   if(ver>=7){const vi=bch(ver,0x1F25,12);for(let i=0;i<18;i++){const b=(vi>>i)&1,r=Math.floor(i/3),c=i%3+n-11;G[r][c]=b;G[c][r]=b}}return G};
  const pen=G=>{let p=0;for(let pass=0;pass<2;pass++){for(let a=0;a<n;a++){let run=1;for(let b=1;b<n;b++){const x=pass?G[b][a]:G[a][b],y=pass?G[b-1][a]:G[a][b-1];if(x===y){run++}else{if(run>=5)p+=run-2;run=1}}if(run>=5)p+=run-2}}
   for(let r=0;r<n-1;r++)for(let c=0;c<n-1;c++){const v=G[r][c];if(v===G[r][c+1]&&v===G[r+1][c]&&v===G[r+1][c+1])p+=3}
   let dark=0;G.forEach(r=>r.forEach(v=>dark+=v));p+=Math.floor(Math.abs(dark*20-n*n*10)/(n*n))*10;return p};
  let best=null,bp=1e9;for(let m=0;m<8;m++){const G=build(m),p=pen(G);if(p<bp){bp=p;best=G}}return best}
 // draws into a <canvas>; returns the canvas
 function draw(text,size){const G=encode(text),n=G.length,q=4,cell=Math.max(2,Math.floor((size||240)/(n+2*q))),px=cell*(n+2*q),cv=document.createElement('canvas');cv.width=cv.height=px;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,px,px);x.fillStyle='#000';
  G.forEach((row,r)=>row.forEach((v,c)=>{if(v)x.fillRect((c+q)*cell,(r+q)*cell,cell,cell)}));return cv}
 return{encode,draw}})();
if(typeof module!=='undefined')module.exports=QR;
