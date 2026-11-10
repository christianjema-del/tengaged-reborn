// V311: Consejo Tribal en su propia página: avatar, nombre y botón Nominar de cada compañero de tribu.
import {setAvatar} from '/avatar-display.js?v=337';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),id=Number(params.get('id'));
let state=null,busy=false,loading=false;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const profile=name=>'/profile.html?username='+encodeURIComponent(name);
const tribeName=t=>'Tribu '+(t==='A'?'A':'B');
if(id)$('ccBack').href='/survivor.html?id='+id;
async function api(body){
 const r=await fetch('/api/survivor?id='+id,{method:body?'POST':'GET',credentials:'include',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
 const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.message||d.error||'No se pudo conectar con Survivor.');return d;
}
function notice(text,ok){const n=$('ccNotice');n.textContent=text||'';n.hidden=!text;n.className=ok?'survivorNotice':'survivorWarning';}
// A quién se puede nominar: compañeros activos de tu tribu, sin contarte a ti.
export function nomineesFor(players,me){return me?players.filter(p=>p.status==='active'&&p.tribe===me.tribe&&String(p.id)!==String(me.id)):[];}
async function nominate(p){
 if(busy)return;busy=true;render();
 try{const d=await api({action:'vote',target:p.id});state=d.match;notice('Has nominado a '+p.username+'. Puedes cambiar tu voto hasta el cambio de día.',true);}
 catch(e){notice(e.message);}finally{busy=false;render();}
}
function card(p,me){
 const box=el('div',null,'survivorCouncilCard'),a=el('a',null,'survivorAvatar'),frame=el('span',null,'avatarFrame'),img=document.createElement('img');
 a.href=profile(p.username);img.alt='Avatar de '+p.username;img.loading='lazy';
 if(p.bot)img.src='/assets/hunger/tributes/'+(Math.abs(Number(p.id))%12)+'.svg';else setAvatar(img,p.username);
 frame.append(img);a.append(frame);
 const name=el('a',p.username,'survivorName');name.href=profile(p.username);name.title=p.username;
 const chosen=String(me?.vote)===String(p.id);
 const b=el('button',chosen?'Nominado':'Nominar','survivorNominate');b.type='button';b.setAttribute('aria-pressed',String(chosen));b.disabled=busy;b.onclick=()=>nominate(p);
 box.append(a,name,b);if(chosen)box.classList.add('survivorChosen');return box;
}
function render(){
 const s=state,me=s.me,mine=me?.status==='active'?me:null,grid=$('ccGrid');grid.replaceChildren();
 const open=s.phase==='day'&&!!s.nominated;
 $('ccTitle').textContent=open?'Consejo Tribal · '+tribeName(s.nominated):'Consejo Tribal';
 if(!open)$('ccIntro').textContent=s.phase==='waiting'?'El Consejo Tribal se abre cuando empieza la partida.':'La votación está cerrada. Vota la tribu que pierda la prueba de hoy.';
 else if(mine&&mine.atCouncil){
  $('ccIntro').textContent=(mine.vote?'Tu voto está guardado. ':'Todavía no has nominado a nadie. ')+'Pulsa Nominar debajo del compañero que quieres que salga. Sale quien tenga más votos al cambiar de día; el ganador de la inmunidad no puede salir. Los votos son secretos.';
  for(const p of nomineesFor(s.players,mine))grid.append(card(p,mine));
 }else $('ccIntro').textContent='La '+tribeName(s.nominated)+' está hoy en el Consejo Tribal. '+(mine?'Hoy tu tribu no vota.':'Solo vota la tribu que está en el Consejo Tribal.');
 const last=s.history.find(h=>h.council);$('ccLast').hidden=!last;
 if(last){
  $('ccLastTitle').textContent='Votos del día '+last.day+' · '+tribeName(last.council.tribe);
  $('ccLastVotes').replaceChildren(...(last.council.votes||[]).map(v=>el('li',v.username+': '+v.votes+(v.votes===1?' voto':' votos')+(v.immune?' (inmune)':''))));
  $('ccLastOut').textContent=last.council.out?'Expulsado: '+last.council.out+'.':'';
 }
}
async function load(){if(loading)return;loading=true;try{if(!id)throw Error('Abre el Consejo desde tu partida de Survivor.');state=(await api()).match;render();}catch(e){notice(e.message);}finally{loading=false;}}
load();setInterval(()=>{if(!document.hidden&&!busy)load();},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
