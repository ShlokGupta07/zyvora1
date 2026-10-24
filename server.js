'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),express=require('express'),L=require('./lib');
const {RAZORPAY_KEY_ID:KID,RAZORPAY_KEY_SECRET:KSEC,RAZORPAY_WEBHOOK_SECRET:WSEC,MERCHANT_NAME,MERCHANT_UPI_ID,PORT=3000}=process.env;
const OF=path.join(__dirname,'data','orders.json'),PF=path.join(__dirname,'products.json'),QR_TTL=10*60;
fs.mkdirSync(path.dirname(OF),{recursive:true});
const rj=(f,d)=>{try{return JSON.parse(fs.readFileSync(f,'utf8'))}catch{return d}};
const catalog=()=>rj(PF,{config:{freeShipFrom:2999,shipFee:99},cats:[],products:[]});
const orders=()=>rj(OF,{}),save=o=>fs.writeFileSync(OF,JSON.stringify(o,null,1));
const AUTH='Basic '+Buffer.from(KID+':'+KSEC).toString('base64');
const rz=(m,p,b)=>fetch('https://api.razorpay.com/v1'+p,{method:m,headers:{Authorization:AUTH,'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined}).then(async r=>({ok:r.ok,j:await r.json().catch(()=>({}))}));
const hits=new Map();
const lim=(max,ms)=>(q,r,n)=>{const k=q.ip+q.path.replace(/ZV[0-9A-F]+/,''),t=Date.now(),h=hits.get(k);if(!h||h[1]<t){hits.set(k,[1,t+ms]);return n()}
 if(++h[0]>max)return r.status(429).json({error:'Too many requests. Try again in a minute.'});n()};
setInterval(()=>{const t=Date.now();for(const[k,v]of hits)if(v[1]<t)hits.delete(k)},6e4).unref();
const app=express();app.disable('x-powered-by');app.set('trust proxy',1);
app.use((q,r,n)=>{r.set({'Content-Security-Policy':"default-src 'self'; script-src 'self' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com; frame-src https://api.razorpay.com https://checkout.razorpay.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Strict-Transport-Security':'max-age=31536000; includeSubDomains'});
 if(process.env.NODE_ENV==='production'&&q.headers['x-forwarded-proto']==='http')return r.redirect(301,'https://'+q.headers.host+q.url);n()});
// Webhook needs the raw body for signature verification, so it is registered before express.json().
app.post('/api/webhook',express.raw({type:'application/json',limit:'100kb'}),(q,r)=>{
 if(!L.verifyWebhookSig(WSEC,q.body,q.get('x-razorpay-signature')))return r.sendStatus(WSEC?400:503);
 try{const O=orders();if(L.applyEvent(O,JSON.parse(q.body)))save(O)}catch{}r.sendStatus(200)});
app.use(express.json({limit:'20kb'}));
app.get('/api/products',lim(120,6e4),(q,r)=>{const c=catalog(),O=orders();
 r.json({config:c.config,cats:c.cats,products:c.products.map(p=>({id:p.id,c:p.c,n:p.n,p:p.p,e:p.e,f:p.f,s:Math.max(0,p.s-L.taken(O,p.id))}))})});
const bad=(r,m,c=400)=>r.status(c).json({error:m});
const mine=(O,q)=>{const o=O[q.params.id];return o&&typeof q.query.t==='string'&&L.eq(q.query.t,o.tok)?o:null};
app.post('/api/order',lim(10,6e4),async(q,r)=>{try{
 if(!KID||!KSEC)return bad(r,'Payments are not set up yet. The store owner must add Razorpay keys.',503);
 const b=q.body||{},e=L.validCustomer(b.customer);if(e)return bad(r,e);
 const method=b.method==='qr'?'qr':'checkout',idem=typeof b.idem==='string'&&/^[\w-]{8,64}$/.test(b.idem)?b.idem:null,O=orders();
 if(idem){const d=Object.values(O).find(x=>x.idem===idem&&x.method===method&&['pending','processing'].includes(x.status));
  if(d)return r.json({orderId:d.id,tok:d.tok,rzOrder:d.rz,amount:d.total,keyId:KID,method,status:d.status})}
 const P=L.priceOrder(catalog(),O,b.items);if(P.error)return bad(r,P.error);
 const id='ZV'+crypto.randomBytes(6).toString('hex').toUpperCase(),c=b.customer;let rzId=null;
 if(method==='checkout'){const x=await rz('POST','/orders',{amount:P.total,currency:'INR',receipt:id});if(!x.ok||!x.j.id)return bad(r,'Could not start payment. Please try again.',502);rzId=x.j.id}
 const o=O[id]={id,tok:crypto.randomBytes(16).toString('hex'),idem,method,rz:rzId,status:'pending',at:Date.now(),items:P.items,sub:P.sub,ship:P.ship,total:P.total,
  customer:Object.fromEntries(['name','phone','email','address','city','state','pincode'].map(k=>[k,c[k].trim()]))};save(O);
 r.json({orderId:id,tok:o.tok,rzOrder:rzId,amount:P.total,keyId:KID,method,status:'pending'})}catch(x){console.error('order error',x.message);bad(r,'Something went wrong. Please try again.',500)}});
// Dynamic single-use UPI QR created by Razorpay for this exact order amount. Needs QR Codes enabled on the merchant account.
app.post('/api/order/:id/upi-qr',lim(10,6e4),async(q,r)=>{try{
 const O=orders(),o=mine(O,{params:q.params,query:{t:(q.body||{}).t}});if(!o||o.method!=='qr')return bad(r,'Order not found.',404);
 if(o.status==='paid')return r.json({status:'paid'});
 if(!o.qr||o.qrExp<Date.now()/1e3){const x=await rz('POST','/payments/qr_codes',{type:'upi_qr',name:'ZYVORA '+o.id,usage:'single_use',fixed_amount:true,payment_amount:o.total,description:'Order '+o.id,close_by:Math.floor(Date.now()/1e3)+QR_TTL,notes:{order:o.id}});
  if(!x.ok||!x.j.id||!x.j.image_url)return bad(r,'UPI QR is not available for this merchant account yet. Ask Razorpay to enable QR Codes, or pay with card/UPI/netbanking.',503);
  o.qr=x.j.id;o.qrUrl=x.j.image_url;o.qrExp=x.j.close_by||Math.floor(Date.now()/1e3)+QR_TTL;o.at=Date.now();o.status='processing';save(O)}
 r.json({status:o.status,imageUrl:o.qrUrl,expiresAt:o.qrExp,amount:o.total,merchant:MERCHANT_NAME||null,upiId:MERCHANT_UPI_ID||null})}catch(x){console.error('qr error',x.message);bad(r,'Could not create the QR. Please try again.',500)}});
// Status is read from our own record and, for QR orders, confirmed against Razorpay's payment list (trusted gateway data).
app.get('/api/order/:id/status',lim(60,6e4),async(q,r)=>{try{
 const O=orders(),o=mine(O,q);if(!o)return bad(r,'Order not found.',404);
 if(o.status!=='paid'&&o.qr){const x=await rz('GET','/payments/qr_codes/'+o.qr+'/payments');
  const p=x.ok&&(x.j.items||[]).find(i=>i.status==='captured'&&i.amount===o.total&&i.currency==='INR');if(p&&L.markPaid(o,p.id))save(O)}
 let s=o.status;if(s!=='paid'&&Date.now()-o.at>L.HOLD)s='expired';
 r.json({status:s,orderId:o.id,total:o.total})}catch{bad(r,'Could not check status. Try again.',500)}});
app.post('/api/verify',lim(20,6e4),(q,r)=>{const{razorpay_order_id:a,razorpay_payment_id:p,razorpay_signature:s}=q.body||{};
 if([a,p,s].some(x=>typeof x!=='string'))return bad(r,'Invalid request.');
 const O=orders(),o=Object.values(O).find(x=>x.rz&&x.rz===a);
 if(!o||!L.verifyPaymentSig(KSEC,a,p,s))return bad(r,'Payment could not be verified.');
 if(L.markPaid(o,p))save(O);r.json({ok:true,orderId:o.id,total:o.total,tok:o.tok})});
app.use(express.static(path.join(__dirname,'public'),{index:'index.html',dotfiles:'ignore'}));
app.use((q,r)=>r.status(404).json({error:'Not found'}));
app.use((e,q,r,n)=>{console.error(e.message);r.status(e.status===413?413:400).json({error:'Invalid request.'})});
app.listen(PORT,()=>console.log('ZYVORA on :'+PORT+(KID&&KSEC?'':'  (Razorpay keys missing: checkout disabled)')));
