'use strict';
const $=s=>document.querySelector(s),PV=!!window.ZV_PREVIEW;
const inr=n=>'₹'+(n/100).toLocaleString('en-IN',{maximumFractionDigits:2});
const h=(t,a={},...k)=>{const e=document.createElement(t);for(const[x,v]of Object.entries(a))x==='class'?e.className=v:x.startsWith('on')?e.addEventListener(x.slice(2),v):v!==false&&e.setAttribute(x,v);e.append(...k);return e};
const IC={mobiles:'<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',computers:'<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',audio:'<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',wearables:'<rect x="7" y="6" width="10" height="12" rx="3"/><path d="M9 6l1-3h4l1 3M9 18l1 3h4l1-3M12 10v3l2 1"/>',home:'<path d="M3 11l9-8 9 8M5 9.5V21h14V9.5M10 21v-6h4v6"/>',accessories:'<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/>',fashion:'<path d="M8 3l-5 4 3 3 2-1v12h8V9l2 1 3-3-5-4a4 4 0 0 1-8 0z"/>',footwear:'<path d="M3 16c0-3 2-4 4-5l3-6 3 4 5 1c2 .5 3 2 3 4v2H3zM3 19h18"/>',kitchen:'<path d="M5 10h14v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3zM3 10h18M9 6c0-2 2-2 2-4M14 6c0-2 2-2 2-4"/>',beauty:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',grocery:'<path d="M3 9h18l-2 11H5zM8 9l3-6M16 9l-3-6"/>',sports:'<path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/>',books:'<path d="M4 4h7a3 3 0 0 1 1 .2V20a3 3 0 0 0-1-.2H4zM20 4h-7a3 3 0 0 0-1 .2V20a3 3 0 0 1 1-.2h7z"/>',toys:'<rect x="3" y="12" width="8" height="8" rx="1"/><rect x="13" y="12" width="8" height="8" rx="1"/><rect x="8" y="4" width="8" height="8" rx="1"/>',auto:'<path d="M4 16v-4l2-5h12l2 5v4zM4 16v3h3v-3M17 16v3h3v-3M4 12h16"/>',travel:'<rect x="5" y="7" width="14" height="14" rx="2"/><path d="M9 7V4h6v3M9 11v6M15 11v6"/>'};
let D=null,cart={},wl=[],S={cat:'all',q:'',sort:'f',stock:false,saved:false};
const ld=(k,f)=>{try{return f(JSON.parse(localStorage.getItem(k)))}catch{return f(null)}},sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const find=id=>D&&D.products.find(p=>p.id===id),catOf=id=>D.cats.find(c=>c.id===id);
function clean(){const c={};if(cart&&typeof cart==='object'&&!Array.isArray(cart))for(const[id,q]of Object.entries(cart)){const p=find(id);if(p&&Number.isInteger(q)&&q>0&&p.s>0)c[id]=Math.min(q,10,p.s)}cart=c;wl=Array.isArray(wl)?[...new Set(wl.filter(id=>typeof id==='string'&&find(id)))]:[];sv('zv_cart',cart);sv('zv_wl',wl)}
const toast=m=>{const t=$('#ts');t.textContent=m;clearTimeout(toast.t);toast.t=setTimeout(()=>t.textContent='',2600)};
function lines(){return Object.entries(cart).map(([id,q])=>({p:find(id),q})).filter(l=>l.p)}
function totals(){const L=lines(),sub=L.reduce((a,l)=>a+l.p.p*100*l.q,0),ship=!sub||sub>=D.config.freeShipFrom*100?0:D.config.shipFee*100;return{L,sub,ship,total:sub+ship}}
function add(id,d=1){const p=find(id);if(!p)return;const n=(cart[id]||0)+d;if(d>0&&n>Math.min(10,p.s))return toast(p.s<10&&n>p.s?'Only '+p.s+' in stock.':'Limit is 10 per item.');if(n<=0)delete cart[id];else cart[id]=n;sv('zv_cart',cart);counts();if(d>0)toast(p.n+' added to cart.')}
function wish(id){wl=wl.includes(id)?wl.filter(x=>x!==id):[...wl,id];sv('zv_wl',wl);counts();toast(wl.includes(id)?'Saved.':'Removed from saved.');list()}
function counts(){const n=Object.values(cart).reduce((a,b)=>a+b,0);$('#cn').textContent=n||'';$('#wn').textContent=wl.length||'';$('#cb').setAttribute('aria-label','Open cart, '+n+' items')}
const art=p=>{const c=catOf(p.c),a=h('div',{class:'art',style:'--c:'+c.c});a.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+(IC[p.c]||'')+'</svg>';
 const src=PV?(window.ZV_IMG||{})[p.id]:'img/'+p.id+'.jpg';if(src){const i=h('img',{src,alt:p.n,loading:'lazy',width:480,height:480});i.onerror=()=>i.remove();a.append(i)}return a};
const stk=p=>p.s<=0?['out','Out of stock']:p.s<=5?['low','Only '+p.s+' left']:['in','In stock'];
function card(p){const c=catOf(p.c),[k,t]=stk(p),a=h('button',{class:'art',style:'--c:'+c.c,'aria-label':'View '+p.n,onclick:()=>detail(p.id)});const ar=art(p);a.replaceChildren(...ar.childNodes);
 const w=h('button',{class:'ib wl','aria-pressed':String(wl.includes(p.id)),'aria-label':'Save '+p.n,onclick:()=>wish(p.id)});w.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/></svg>';
 const b=h('button',{class:'btn',onclick:()=>add(p.id)},p.s?'Add to cart':'Out of stock');if(!p.s)b.disabled=true;
 return h('article',{class:'card'},h('div',{style:'position:relative'},a,w),h('div',{class:'cb'},h('small',{},c.n),h('h3',{},p.n),h('small',{},p.id),h('span',{class:'pr'},inr(p.p*100)),h('span',{class:'stk '+k},t),b))}
function list(){let l=D.products.filter(p=>(S.cat==='all'||p.c===S.cat)&&(!S.saved||wl.includes(p.id))&&(!S.stock||p.s>0)&&(!S.q||(p.n+' '+p.id+' '+catOf(p.c).n).toLowerCase().includes(S.q)));
 const so={lo:(a,b)=>a.p-b.p,hi:(a,b)=>b.p-a.p,az:(a,b)=>a.n.localeCompare(b.n),f:(a,b)=>(b.f||0)-(a.f||0)}[S.sort];l=[...l].sort(so);
 $('#ct').textContent=S.saved?'Saved items':S.cat==='all'?'All products':catOf(S.cat).n;$('#cnt').textContent=l.length+(l.length===1?' product':' products');
 $('#grid').replaceChildren(...(l.length?l.map(card):[h('div',{class:'empty'},S.saved&&!wl.length?'Nothing saved yet. Tap the heart on a product to save it.':'No products match your search or filters.',h('br'),h('button',{class:'btn g',onclick:reset},'Clear filters'))]));
 $('#chips').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.c===S.cat&&!S.saved)));$('#wb').setAttribute('aria-pressed',String(S.saved))}
function reset(){S={cat:'all',q:'',sort:'f',stock:false,saved:false};$('#q').value='';$('#so').value='f';$('#is').checked=false;list()}
function shelves(){const sh=(t,a)=>a.length?h('section',{class:'sec'},h('h2',{},t),h('div',{class:'grid'},...a.map(card))):'';$('#shelves').replaceChildren(sh('Featured',D.products.filter(p=>p.f&&p.s>0).slice(0,4)),sh('Value picks under ₹1,000',D.products.filter(p=>p.p<1000&&p.s>0).slice(0,4)))}
const open=(...k)=>{$('#dc').replaceChildren(...k);const d=$('#dg');d.open||d.showModal()};
function detail(id){const p=find(id),c=catOf(p.c),[k,t]=stk(p),b=h('button',{class:'btn',onclick:()=>{add(id);cartView()}},p.s?'Add to cart':'Out of stock');if(!p.s)b.disabled=true;
 open(h('h2',{id:'dt'},p.n),h('div',{style:'max-width:240px;margin:0 auto 16px;border-radius:14px;overflow:hidden'},art(p)),h('p',{class:'pr'},inr(p.p*100)),h('p',{class:'stk '+k},t),
 h('dl',{style:'display:grid;grid-template-columns:auto 1fr;gap:6px 16px;color:var(--mu)'},h('dt',{},'Category'),h('dd',{style:'margin:0;color:var(--tx)'},c.n),h('dt',{},'SKU'),h('dd',{style:'margin:0;color:var(--tx)'},p.id),h('dt',{},'Delivery'),h('dd',{style:'margin:0;color:var(--tx)'},'Free above ₹'+D.config.freeShipFrom.toLocaleString('en-IN')+', otherwise ₹'+D.config.shipFee),h('dt',{},'Seller'),h('dd',{style:'margin:0;color:var(--tx)'},'ZYVORA (demo listing)')),
 h('p',{style:'color:var(--mu);font-size:.85rem'},'Detailed specifications are added by the store owner.'),b)}
const V={name:v=>v.length>=2&&v.length<=80||'Enter your full name.',phone:v=>/^[6-9]\d{9}$/.test(v)||'Enter a valid 10-digit mobile number.',email:v=>/^\S+@\S+\.\S{2,}$/.test(v)||'Enter a valid email address.',address:v=>v.length>=10&&v.length<=300||'Enter your full delivery address (at least 10 characters).',city:v=>(v.length>=2&&v.length<=60)||'Enter your city.',state:v=>(v.length>=2&&v.length<=40)||'Enter your state.',pincode:v=>/^[1-9]\d{5}$/.test(v)||'Enter a valid 6-digit pincode.'};
const FL=[['name','Full name','name'],['phone','Mobile number','tel-national'],['email','Email','email'],['address','Delivery address','street-address'],['city','City','address-level2'],['state','State','address-level1'],['pincode','Pincode','postal-code']];
function cartView(note){const{L,sub,ship,total}=totals();const rows=L.map(({p,q})=>h('div',{class:'ln'},h('b',{},p.n),h('b',{},inr(p.p*100*q)),h('small',{},inr(p.p*100)+' each'),h('span'),h('div',{class:'qt'},h('button',{'aria-label':'One less '+p.n,onclick:()=>{add(p.id,-1);cartView()}},'−'),h('span',{'aria-live':'polite'},String(q)),h('button',{'aria-label':'One more '+p.n,onclick:()=>{add(p.id,1);cartView()}},'+'),h('button',{class:'rm',onclick:()=>{delete cart[p.id];sv('zv_cart',cart);counts();cartView()}},'Remove'))));
 if(!L.length)return open(h('h2',{id:'dt'},'Your cart'),note?h('p',{class:'ok'},note):'',h('p',{style:'color:var(--mu)'},'Your cart is empty. Add a product to get started.'),h('button',{class:'btn',onclick:()=>$('#dg').close()},'Continue shopping'));
 const f=h('form',{class:'f',novalidate:true,onsubmit:submit});FL.forEach(([k,l,ac])=>{f.append(h('label',{},l,h('input',{name:k,autocomplete:ac,id:'f_'+k,'aria-describedby':'e_'+k,...(k==='phone'||k==='pincode'?{inputmode:'numeric',maxlength:k==='phone'?10:6}:{}),...(k==='email'?{type:'email'}:{})}),h('span',{class:'fe',id:'e_'+k})))});
 f.append(methodSet(),h('p',{class:'fe er',id:'er',role:'alert'}),h('button',{class:'btn',id:'pay',type:'submit'},'Pay '+inr(total)),h('small',{style:'color:var(--mu)'},'The server confirms the final amount before payment.'));
 open(h('h2',{id:'dt'},'Your cart'),...rows,h('div',{class:'tt'},h('div',{},h('span',{},'Subtotal'),h('span',{},inr(sub))),h('div',{},h('span',{},'Delivery'),h('span',{},ship?inr(ship):'Free')),h('div',{class:'g'},h('span',{},'Total'),h('span',{},inr(total)))),f)}
const IDEM={},idemKey=m=>{const s=m+JSON.stringify(lines().map(l=>[l.p.id,l.q]));return IDEM[s]||(IDEM[s]=(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2)))};
const methodSet=()=>{const fs=h('fieldset',{style:'border:1px solid var(--bd);border-radius:12px;padding:10px 14px;display:grid;gap:8px'},h('legend',{style:'color:var(--mu);font-size:.85rem'},'Payment method'));
 [['checkout','Card, UPI app or netbanking (Razorpay)'],['qr','Pay via UPI QR (scan with any UPI app)']].forEach(([v,t],n)=>fs.append(h('label',{style:'display:flex;gap:10px;align-items:center;color:var(--tx)'},h('input',{type:'radio',name:'method',value:v,...(n?{}:{checked:true}),style:'width:20px;height:20px'}),t)));return fs};
function done(id,total){cart={};sv('zv_cart',cart);counts();cartView('Payment verified. Order '+id+' for '+inr(total)+' is confirmed.');load(true)}
async function qrView(o,btn){const er=$('#er');let j;
 try{const r=await fetch('/api/order/'+o.orderId+'/upi-qr',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({t:o.tok})});j=await r.json();if(!r.ok)throw new Error(j.error||'Could not create the QR.')}catch(x){er.textContent=x.message;btn.disabled=false;return}
 if(j.status==='paid')return done(o.orderId,j.amount);
 const st=h('p',{role:'status',class:'stk low'},'Waiting for payment. This page updates automatically.'),box=h('div',{style:'text-align:center'});let timer=null;
 const stop=()=>clearInterval(timer),exp=new Date(j.expiresAt*1000).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
 const chk=async()=>{try{const s=await(await fetch('/api/order/'+o.orderId+'/status?t='+encodeURIComponent(o.tok))).json();
  if(s.status==='paid'){stop();done(o.orderId,s.total)}
  else if(s.status==='expired'||s.status==='failed'||s.status==='cancelled'){stop();st.className='stk out';st.textContent=s.status==='failed'?'Payment failed. No order was confirmed.':'This QR has expired. No order was confirmed and you were not charged.'}
  else{st.className='stk low';st.textContent='Waiting for payment. This page updates automatically.'}}catch{st.textContent='Could not check status. Tap Check Payment Status to retry.'}};
 box.append(h('img',{src:j.imageUrl,alt:'UPI QR code for '+inr(j.amount),width:240,height:240,style:'background:#fff;padding:10px;border-radius:12px;max-width:100%;height:auto'}),
  ...(j.merchant?[h('p',{},'Pay to: ',h('b',{},j.merchant))]:[]),h('p',{class:'pr'},inr(j.amount)),
  ...(j.upiId?[h('p',{},'UPI ID: ',h('b',{},j.upiId),' ',h('button',{class:'btn g',style:'min-height:36px;padding:0 14px',onclick:async()=>{try{await navigator.clipboard.writeText(j.upiId);toast('UPI ID copied.')}catch{toast('Copy failed. Select the ID manually.')}}},'Copy'))]:[]),
  h('ol',{style:'text-align:left;color:var(--mu);font-size:.9rem'},h('li',{},'Open any UPI app (Google Pay, PhonePe, Paytm, BHIM...)'),h('li',{},'Scan this QR and pay exactly '+inr(j.amount)),h('li',{},'Wait here: payment is confirmed by our server, not by this page. QR valid until '+exp)),
  st,h('button',{class:'btn',onclick:chk},'Check Payment Status'));
 open(h('h2',{id:'dt'},'Pay via UPI QR'),box);$('#dg').addEventListener('close',stop,{once:true});timer=setInterval(chk,5000)}
async function submit(e){e.preventDefault();const f=e.target,er=$('#er'),btn=$('#pay');er.textContent='';let bad=null;const c={};
 for(const[k]of FL){const i=f.elements[k],v=i.value.trim(),r=V[k](v);c[k]=v;$('#e_'+k).textContent=r===true?'':r;i.setAttribute('aria-invalid',String(r!==true));if(r!==true&&!bad)bad=i}
 if(bad)return bad.focus();const m=f.elements.method.value;
 if(PV){er.textContent=m==='qr'?'Preview only: UPI QR needs the server with Razorpay QR Codes enabled on your account.':'Preview only: payments run on your own server with Razorpay keys. Use the downloaded project to take real payments.';return}
 btn.disabled=true;
 try{const r=await fetch('/api/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:lines().map(l=>({id:l.p.id,qty:l.q})),customer:c,method:m,idem:idemKey(m)})}),o=await r.json();
  if(!r.ok)throw new Error(o.error||'Could not start payment.');if(m==='qr')return qrView(o,btn);
  if(!window.Razorpay)throw new Error('The payment window did not load. Check your connection and try again.');
  const z=new Razorpay({key:o.keyId,order_id:o.rzOrder,amount:o.amount,currency:'INR',name:'ZYVORA',description:'Order '+o.orderId,prefill:{name:c.name,email:c.email,contact:c.phone},theme:{color:'#00A8FF'},
   modal:{ondismiss:()=>{btn.disabled=false;er.textContent='Payment cancelled. No order was confirmed.'}},
   handler:async p=>{try{const v=await fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)}),j=await v.json();if(!v.ok)throw 0;done(j.orderId,j.total)}
    catch{er.textContent='We could not verify your payment yet. If money was deducted it will be confirmed automatically. Please do not pay again.';btn.disabled=false}}});
  z.on('payment.failed',()=>{er.textContent='Payment failed. No order was confirmed. Please try again.';btn.disabled=false});z.open()}
 catch(x){er.textContent=x.message;btn.disabled=false;load(true)}}
async function load(quiet){try{if(PV)D=window.ZV_DATA;else{const r=await fetch('/api/products');if(!r.ok)throw 0;D=await r.json()}
  cart=ld('zv_cart',v=>v);wl=ld('zv_wl',v=>v);clean();$('#chips').replaceChildren(...[['all','All']].concat(D.cats.map(c=>[c.id,c.n])).map(([id,n])=>{const b=h('button',{class:'chip','data-c':id,onclick:()=>{S.cat=id;S.saved=false;list();$('#catalog').scrollIntoView()}},n);return b}));shelves();counts();list()}
 catch{if(!quiet)$('#grid').replaceChildren(h('div',{class:'empty'},'Could not load products. Start the server with npm start and open http://localhost:3000, then refresh.',h('br'),h('button',{class:'btn g',onclick:()=>location.reload()},'Retry')))}}
$('#pv').hidden=!PV;$('#cb').onclick=()=>cartView();$('#dx').onclick=()=>$('#dg').close();$('#wb').onclick=()=>{S.saved=!S.saved;list();$('#catalog').scrollIntoView()};
$('#q').oninput=e=>{S.q=e.target.value.trim().toLowerCase();list()};$('#sf').onsubmit=e=>{e.preventDefault();$('#catalog').scrollIntoView()};
$('#so').onchange=e=>{S.sort=e.target.value;list()};$('#is').onchange=e=>{S.stock=e.target.checked;list()};
$('#dg').addEventListener('click',e=>{if(e.target.id==='dg')e.target.close()});
load();
