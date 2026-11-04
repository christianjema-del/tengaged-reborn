import {launchCastingMinigame,CASTING_MINIGAMES} from '/casting-minigame-launcher.js?v=159';
import {api,el,$} from '/market-ui.js?v=170';
const LABELS=CASTING_MINIGAMES;
const kind=new URLSearchParams(location.search).get('juego');
let dispose=null,lastSignature='';
if(!Object.hasOwn(LABELS,kind)){$('title').textContent='Prueba desconocida';$('start').disabled=true;}else{$('title').textContent=LABELS[kind];document.title=LABELS[kind]+' · Tengaged Reborn';}
async function ranking(){if(!Object.hasOwn(LABELS,kind))return;try{const d=await api('/api/minigame-ranking?kind='+encodeURIComponent(kind));const signature=JSON.stringify(d.leaders);if(signature!==lastSignature){lastSignature=signature;$('ranking').replaceChildren();d.leaders.forEach((p,i)=>{const tr=el('tr'),a=el('a',p.username);a.href='/profile.html?username='+encodeURIComponent(p.username);const td=el('td');td.append(a);tr.append(el('td',String(i+1)),td,el('td',String(p.score)));$('ranking').append(tr);});$('rankingMessage').textContent=d.leaders.length?'Mejores resultados registrados':'Todavía no hay puntuaciones. ¡Sé el primero!';}}catch(e){$('rankingMessage').textContent=e.message;}}
$('start').onclick=async()=>{const b=$('start');b.disabled=true;$('notice').textContent='Cargando el minijuego original de Casting…';try{dispose?.();const flash=await launchCastingMinigame($('board'),kind,{standalone:true});dispose=flash;$('notice').textContent='Estás jugando al minijuego original. Cuando termine y envíe su resultado, aparecerá en el ranking.';b.textContent='Reiniciar esta misma prueba';}catch(e){$('notice').textContent='No se pudo cargar: '+(e?.message||e);}finally{b.disabled=false;}};
ranking();setInterval(()=>{if(!document.hidden)ranking();},5000);addEventListener('beforeunload',()=>dispose?.());
