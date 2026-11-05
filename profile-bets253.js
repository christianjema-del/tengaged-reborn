const $=id=>document.getElementById(id),el=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
const username=(new URLSearchParams(location.search).get('username')||'').trim();let request=0;
const link=(text,href,cls='')=>{const a=el('a',text,cls);a.href=href;return a;};
const money=n=>n.toFixed(Number.isInteger(n*10)?1:2);
function pageNumbers(current,pages){if(pages<=6)return Array.from({length:pages},(_,i)=>i+1);const out=[...new Set([1,2,3,current,pages])].sort((a,b)=>a-b);return out.flatMap((n,i)=>i&&n-out[i-1]>1?['…',n]:[n]);}
function pager(page,pages){const root=$('profileBetsPager');root.replaceChildren();if(pages<2)return;for(const n of pageNumbers(page,pages)){if(n==='…'){root.append(el('span','…','gap'));continue;}if(n===page){root.append(el('b',String(n)));continue;}const b=el('button',String(n));b.type='button';b.onclick=()=>load(n);root.append(b);}}
function row(x){const li=el('li'),who=el('span','','who'),game=el('span','en ','game'),state=el('span','','state');
 who.append(el('b',String(x.amount),'amount'),document.createTextNode(' a '),x.bot?el('span',x.target):link(x.target,'/profile.html?username='+encodeURIComponent(x.target)));
 game.append(link('#'+x.matchId,'/rookies.html?id='+x.matchId));
 if(x.status==='won')state.append('ganó: ',el('b',money(x.payout),'amount'));else state.textContent=x.status==='lost'?'perdió':'jugando ahora';
 li.append(who,game,state);return li;}
function render(d){
 $('profileBetsTitle').textContent=d.self?'Mis apuestas':'Sus apuestas';pager(d.page,d.pages);
 const open=$('profileBetsOpen');open.hidden=!d.open.length;open.replaceChildren();if(d.open.length){const games=el('span','','games');games.append(...d.open.map(id=>link('#'+id,'/rookies-bets.html?id='+id)));open.append(el('span','Apostar ahora:'),games);}
 const list=$('profileBetsList');list.replaceChildren(...d.items.map(row));$('profileBetsEmpty').hidden=!!d.items.length;
}
async function load(page=1){const mine=++request;try{const q=new URLSearchParams({page});if(username)q.set('username',username);const r=await fetch('/api/profile-bets?'+q,{cache:'no-store',credentials:'include'}),d=await r.json();if(mine!==request)return;if(!r.ok||!d.ok)throw Error(d.message);render(d);$('profileBetsCard').hidden=false;}catch{if(mine===request)$('profileBetsCard').hidden=true;}}
load();
