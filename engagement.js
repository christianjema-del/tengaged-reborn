import {api,post} from '/market-ui.js?v=170';
let user=null,unreadRevision=0,unreadTask=null,dailyBusy=false,nextRewardCheck=0;
const $=id=>document.getElementById(id);
function paintUnread(value,remember=true){const n=Math.max(0,Math.floor(Number(value)||0));for(const id of ['tg-arrow-unread','tg-unread','tg-menu-unread']){const e=$(id);if(!e)continue;e.textContent=id==='tg-menu-unread'?'('+n+')':String(n);e.hidden=n===0;}if(remember&&user?.username)try{localStorage.setItem('tengaged_unread:'+user.username.toLowerCase(),String(n));}catch{}const arrow=$('tg-menu-toggle');if(arrow)arrow.setAttribute('aria-label','Abrir menú de navegación'+(n?' · '+n+' '+(n===1?'correo sin leer':'correos sin leer'):''));}
window.TengagedSetUnread=value=>{unreadRevision++;paintUnread(value);};
window.TengagedRefreshUnread=async({force=false}={})=>{
 if(!user){paintUnread(0,false);return;}if(unreadTask&&!force)return unreadTask;const username=user.username,revision=++unreadRevision;
 const task=(async()=>{try{const data=await api('/api/mail-unread');if(revision===unreadRevision&&user?.username===username&&data.username===username)paintUnread(data.unread);return data.unread;}catch(e){if(e.status===401){user=null;paintUnread(0,false);}}})();unreadTask=task;try{return await task;}finally{if(unreadTask===task)unreadTask=null;}
};
async function daily(){if(!user||dailyBusy||document.hidden||Date.now()<nextRewardCheck)return;dailyBusy=true;const username=user.username;nextRewardCheck=Date.now()+60000;try{const result=await post('/api/daily-reward',{});if(user?.username!==username)return;nextRewardCheck=result.nextEligibleAt||Date.now()+86400000;if(result.eligible){await window.TengagedRefreshUnread({force:true});if(result.claimed||Number(result.balance)!==Number(window.TengagedUser?.t_money))await window.TengagedRefreshSession?.();}}catch{}finally{dailyBusy=false;if(user&&user.username!==username){nextRewardCheck=0;daily();}}}
function start(next){const changed=user?.username!==next?.username;user=next||null;if(changed){unreadRevision++;nextRewardCheck=0;let cached=0;if(user)try{cached=Number(localStorage.getItem('tengaged_unread:'+user.username.toLowerCase()))||0;}catch{}paintUnread(cached,false);}if(!user){paintUnread(0,false);return;}window.TengagedRefreshUnread({force:true});daily();}
window.TengagedSession?.then(start).catch(()=>{});
addEventListener('tengaged:session',event=>start(event.detail));
setInterval(()=>{if(!document.hidden&&user)window.TengagedRefreshUnread();},120000);
function returnToPage(){if(!document.hidden){window.TengagedRefreshUnread({force:true});daily();}}
document.addEventListener('visibilitychange',returnToPage);addEventListener('focus',returnToPage);addEventListener('online',returnToPage);addEventListener('pageshow',event=>{if(event.persisted)returnToPage();});
for(const event of ['pointerdown','keydown'])addEventListener(event,()=>{if(Date.now()>=nextRewardCheck)daily();},{passive:true});
addEventListener('storage',event=>{if(event.key==='tengaged_mail_changed'||event.key==='tengaged_unread:'+user?.username?.toLowerCase())window.TengagedRefreshUnread({force:true});if(event.key==='tengaged_user'&&event.newValue!==user?.username){paintUnread(0,false);window.TengagedRefreshSession?.().then(start).catch(()=>{});}});
document.addEventListener('tengaged:mail-changed',()=>{window.TengagedRefreshUnread({force:true});try{localStorage.setItem('tengaged_mail_changed',crypto.randomUUID());}catch{}});
