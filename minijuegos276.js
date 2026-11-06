// Minijuegos en una sola página: lista, juego y Top 10, sin marcos internos.
import {launchCastingMinigame,CASTING_MINIGAMES} from '/casting-minigame-launcher.js?v=159';
import {setAvatar} from '/avatar-display.js?v=159';
import {api,el,$} from '/market-ui.js?v=170';
const DEFAULT_KIND='guitar',links=[...document.querySelectorAll('.competition')],NOTICE='Estás jugando al minijuego original. Cuando termine y envíe su resultado, aparecerá en el ranking.';
const kindOf=url=>{const kind=new URL(url,location.href).searchParams.get('juego');return Object.hasOwn(CASTING_MINIGAMES,kind)?kind:DEFAULT_KIND;};
let kind=kindOf(location.href),dispose=null,lastSignature='',loadId=0;
function person(p,place){
 const box=el('article',undefined,'mini-person'),rank=el('b',undefined,'mini-place'),link=el('a'),img=el('img');
 rank.append(document.createTextNode(String(place)),el('sup','º'));
 link.href='/profile.html?username='+encodeURIComponent(p.username);link.title=p.username;img.alt=p.username;img.loading='lazy';setAvatar(img,p.username);link.append(img,el('span',p.username));
 box.append(rank,link,el('strong',p.score.toLocaleString('es-ES')+' pts'));return box;
}
async function ranking(){
 const wanted=kind;
 try{
  const d=await api('/api/minigame-ranking?kind='+encodeURIComponent(wanted));if(wanted!==kind)return;
  const leaders=d.leaders.slice(0,10),signature=wanted+JSON.stringify(leaders);if(signature===lastSignature)return;lastSignature=signature;
  $('ranking').replaceChildren(...leaders.map((p,i)=>person(p,i+1)));
  $('rankingMessage').textContent=leaders.length?'':'Todavía no hay puntuaciones. ¡Sé el primero!';
 }catch(e){if(wanted===kind)$('rankingMessage').textContent=e.message;}
}
function stop(){try{dispose?.();}finally{dispose=null;}$('board').replaceChildren();}
function select(next){
 loadId++;stop();kind=next;lastSignature='';
 for(const a of links)if(kindOf(a.href)===kind)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');
 $('title').textContent=CASTING_MINIGAMES[kind];document.title=CASTING_MINIGAMES[kind]+' · Tengaged Reborn';
 $('notice').textContent='';$('start').textContent='Jugar';$('start').disabled=false;$('ranking').replaceChildren();$('rankingMessage').textContent='';ranking();
}
for(const a of links)a.addEventListener('click',event=>{
 if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 event.preventDefault();const next=kindOf(a.href);if(next===kind)return;
 const url=new URL(location.href);url.searchParams.set('juego',next);history.pushState(null,'',url);select(next);
 $('rankings').scrollIntoView({block:'start',behavior:'smooth'});
});
addEventListener('popstate',()=>{const next=kindOf(location.href);if(next!==kind)select(next);});
$('start').onclick=async()=>{
 const button=$('start'),id=++loadId;button.disabled=true;$('notice').textContent='Cargando el minijuego original de Casting…';
 try{stop();const game=await launchCastingMinigame($('board'),kind,{standalone:true});if(id!==loadId){game?.();return;}dispose=game;$('notice').textContent=NOTICE;button.textContent='Reiniciar esta misma prueba';}
 catch(e){if(id===loadId)$('notice').textContent='No se pudo cargar: '+(e?.message||e);}
 finally{if(id===loadId)button.disabled=false;}
};
select(kind);setInterval(()=>{if(!document.hidden)ranking();},5000);addEventListener('beforeunload',()=>dispose?.());
