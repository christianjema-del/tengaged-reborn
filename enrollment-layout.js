import {request as fetch} from '/http.js?v=170';
import {ENROLLMENT_FORMATS} from '/enrollment-formats.js?v=332';
const root=document.getElementById('formatSelection');
for(const [type,format] of Object.entries(ENROLLMENT_FORMATS)){const a=document.createElement('a'),img=document.createElement('img'),state=document.createElement('span');a.dataset.gameType=type;a.className='enrollment-format format-'+type+(format.implemented?'':' unavailable');a.href='/enroll-game.html?type='+type;img.src='/assets/formats/'+format.image;img.alt=format.name;state.textContent=format.implemented?'Consultar e inscribirme':'Próximamente';a.setAttribute('aria-label',format.name+' · '+state.textContent);a.append(img,state);root.append(a);}
document.getElementById('refreshEnrollment').onclick=()=>location.reload();

async function availability(){for(const [type,path] of [['survivor','/api/survivor'],['rookies','/api/rookies'],['duel','/api/duel'],['casting','/api/castings'],['frookies','/api/frookies'],['hunger','/api/hunger']])try{const response=await fetch(path,{cache:'no-store'}),data=await response.json();if(!response.ok||!data.ok)continue;const open=['casting','frookies','duel','rookies','survivor'].includes(type)?data.matches.some(g=>g.phase==='waiting'&&g.players<g.capacity):data.phase==='waiting'&&data.players.length<(data.capacity||30),a=root.querySelector('.format-'+type);a.classList.toggle('entry-open',open);a.classList.toggle('entry-closed',!open);a.querySelector('span').textContent=open?'Inscripción abierta':'Consultar partida';}catch{}}
// V348: si ya estás en una partida de ese juego que sigue en curso, la tarjeta sale en gris con la cruz roja
// y te lleva a tu partida: no puedes inscribirte en dos a la vez.
const KIND348={CASTING:'casting',FASTING:'fasting',ROOKIES:'rookies',FROOKIES:'frookies',DUEL:'duel',SURVIVOR:'survivor',HUNGER:'hunger'};
const PAGE348={casting:'/casting-game.html?id=',fasting:'/casting-game.html?id=',rookies:'/rookies.html?id=',frookies:'/frookies.html?id=',duel:'/duel.html?id=',survivor:'/survivor.html?id=',hunger:'/hunger.html'};
async function mine348(){try{const me=await window.TengagedSession;if(!me?.username)return {};const response=await fetch('/api/profile?username='+encodeURIComponent(me.username),{cache:'no-store'}),data=await response.json();if(!response.ok||!data.ok)return {};const out={};for(const g of data.profile.games||[]){const kind=KIND348[String(g.game_type||'').toUpperCase()];if(kind&&g.status==='active'&&!out[kind])out[kind]=g;}return out;}catch{return {};}}
export function markEnrolled348(card,kind,game){
 card.classList.remove('entry-open','entry-closed','unavailable');card.classList.add('already-in348');
 const label='Ya estás inscrito · #'+game.game_id;card.querySelector('span').textContent=label;
 card.href=kind==='hunger'?PAGE348.hunger:PAGE348[kind]+encodeURIComponent(game.game_id);
 card.setAttribute('aria-label',(ENROLLMENT_FORMATS[kind]?.name||kind)+' · '+label+'. No puedes inscribirte en otra partida hasta salir de esta.');
 card.title='Ya estás en esta partida. Para inscribirte en otra tiene que terminar, que te eliminen o que te expulsen.';
}
Promise.all([availability(),mine348()]).then(([,mine])=>{for(const [kind,game] of Object.entries(mine)){const card=root.querySelector('.format-'+kind);if(card)markEnrolled348(card,kind,game);}});
