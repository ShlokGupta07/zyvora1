'use strict';
const crypto=require('crypto');
const HOLD=30*60e3;
const eq=(a,b)=>{a=Buffer.from(String(a));b=Buffer.from(String(b));return a.length===b.length&&crypto.timingSafeEqual(a,b)};
const hmac=(k,d)=>crypto.createHmac('sha256',k).update(d).digest('hex');
// Units unavailable = paid orders + unexpired pending reservations.
const taken=(O,id,now=Date.now())=>Object.values(O).reduce((n,o)=>n+((o.status==='paid'||(['pending','processing'].includes(o.status)&&now-o.at<HOLD))?(o.items.find(i=>i.id===id)?.q||0):0),0);
function validCustomer(c){c=c||{};const t=k=>typeof c[k]==='string'?c[k].trim():'';
 if(t('name').length<2||t('name').length>80)return'Enter your full name.';
 if(!/^[6-9]\d{9}$/.test(t('phone')))return'Enter a valid 10-digit mobile number.';
 if(!/^\S+@\S+\.\S{2,}$/.test(t('email'))||t('email').length>120)return'Enter a valid email address.';
 if(t('address').length<10||t('address').length>300)return'Enter your full delivery address.';
 if(t('city').length<2||t('city').length>60)return'Enter your city.';
 if(t('state').length<2||t('state').length>40)return'Enter your state.';
 if(!/^[1-9]\d{5}$/.test(t('pincode')))return'Enter a valid 6-digit pincode.';return null}
// Prices come only from the catalogue (rupees) and are converted to integer paise here.
function priceOrder(cat,O,items,now=Date.now()){
 if(!Array.isArray(items)||!items.length||items.length>40)return{error:'Your cart is empty.'};
 const want=new Map();
 for(const i of items){if(!i||!Number.isInteger(i.qty)||i.qty<1||i.qty>10)return{error:'Invalid quantity.'};want.set(String(i.id),(want.get(String(i.id))||0)+i.qty)}
 let sub=0;const out=[];
 for(const[id,q]of want){const p=cat.products.find(x=>x.id===id);
  if(!p||!Number.isInteger(p.p)||p.p<1||q>10)return{error:'An item in your cart is no longer available.'};
  if(q>p.s-taken(O,id,now))return{error:p.n+' does not have enough stock.'};
  sub+=p.p*100*q;out.push({id,n:p.n,p:p.p*100,q})}
 const ship=sub>=cat.config.freeShipFrom*100?0:cat.config.shipFee*100;return{items:out,sub,ship,total:sub+ship}}
const verifyPaymentSig=(secret,oid,pid,sig)=>!!secret&&typeof sig==='string'&&eq(sig,hmac(secret,oid+'|'+pid));
const verifyWebhookSig=(secret,raw,sig)=>!!secret&&Buffer.isBuffer(raw)&&typeof sig==='string'&&eq(sig,hmac(secret,raw));
// Returns true only on the first transition to paid. Extra payments on an already-paid order are recorded for refund review.
function markPaid(o,pid,now=Date.now()){if(o.status==='paid'){if(o.paymentId!==pid&&!(o.extra||[]).includes(pid))(o.extra=o.extra||[]).push(pid);return false}o.status='paid';o.paymentId=pid;o.paidAt=now;return true}
// Applies a verified webhook event. Returns the order only if it changed.
function applyEvent(O,ev,now=Date.now()){const pay=ev?.payload?.payment?.entity,qr=ev?.payload?.qr_code?.entity,all=Object.values(O);if(!pay)return null;
 if(ev.event==='payment.failed'){const o=all.find(x=>x.rz&&x.rz===pay.order_id);if(o&&o.status!=='paid'){o.status='failed';return o}return null}
 let o=null;
 if(ev.event==='payment.captured'||ev.event==='order.paid')o=all.find(x=>x.rz&&x.rz===pay.order_id);
 else if(ev.event==='qr_code.credited'&&qr)o=all.find(x=>x.qr&&x.qr===qr.id);
 if(!o||pay.amount!==o.total||pay.currency!=='INR'||(pay.status&&pay.status!=='captured'))return null;
 return markPaid(o,pay.id,now)?o:null}
module.exports={HOLD,eq,hmac,taken,validCustomer,priceOrder,verifyPaymentSig,verifyWebhookSig,markPaid,applyEvent};
