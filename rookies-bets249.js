import {setAvatar} from '/avatar-display.js?v=337';
const $=id=>document.getElementById(id),el=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
const id=Number(new URLSearchParams(location.search).get('id'))||0,avatars=new Map();let busy=false;
const profile=(name,cls='')=>{const a=el('a',name,cls);a.href='/profile.html?username='+encodeURIComponent(name);return a;};
function avatar(p,i){if(!avatars.has(p.id)){const img=el('img');img.alt='Avatar de '+p.username;if(p.bot)img.src='/assets/hunger/tributes/'+i%12+'.svg';else setAvatar(img,p.username);avatars.set(p.id,img);}return avatars.get(p.id);}
function status(p){if(p.placement)return el('b',p.placement+'º','bets-place');if(p.hoh)return el('b','HoH','hoh');if(p.nominated)return el('b','?','nom');return el('b','','casting-safe225');}
function column(p,i,canBet){
 const out=p.status==='eliminated',col=el('article','','fro-player bets-col'+(out?' eliminated':'')),box=el('div','','bets-box');
 col.append(avatar(p,i),p.bot?el('span',p.username,'fro-name'):profile(p.username));const state=el('div','','bets-status');state.append(status(p));col.append(state);
 box.append(el('div',String(p.total),'betTotal'));
 if(canBet&&p.status==='active'){const b=el('button','Añadir 1','bet-add');b.type='button';b.onclick=()=>add(p.id,b);box.append(b);}
 const list=el('ul','','bets');for(const x of p.bets){const li=el('li');li.append(profile(x.username),el('b',String(x.amount)));list.append(li);}
 box.append(list);col.append(box);return col;
}
function render(d){
 $('bets-title').textContent='Apuestas de la partida #'+d.id;$('bets-game').href='/rookies.html?id='+d.id;
 $('bets-notice').textContent=d.reason||'Tu tarjeta te permite apostar '+d.limit+' T$ en esta partida. Llevas '+d.spent+' T$.';
 $('bets-board').replaceChildren(...d.players.map((p,i)=>column(p,i,d.canBet)));
}
async function add(target,button){if(busy)return;busy=true;button.disabled=true;try{const r=await fetch('/api/rookies?id='+id,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'bet',target})}),d=await r.json();if(!r.ok||!d.ok)throw Error(d.message||'No se pudo apostar.');render(d);window.TengagedRefreshSession?.();}catch(e){$('bets-notice').textContent=e.message;}finally{busy=false;button.disabled=false;}}
async function load(){try{if(!id)throw Error('Partida no válida.');const r=await fetch('/api/rookies?id='+id+'&bets=1',{cache:'no-store',credentials:'include'}),d=await r.json();if(!r.ok||!d.ok)throw Error(d.message||'No disponible.');render(d);}catch(e){$('bets-notice').textContent=e.message;}}
load();
