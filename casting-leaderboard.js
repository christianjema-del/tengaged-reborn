export function rankedChallengeResults(state,round){
 const source=state.round===round?state.challengeResults:state.challengeHistory?.find(d=>d.round===round)?.results;
 if(!Array.isArray(source))return null;
 const active=new Set((state.players||[]).filter(p=>p.status==='active').map(p=>p.username.toLowerCase()));
 const privateScores=state.rules146===true;const rows=source.filter(p=>active.has(p.username.toLowerCase())).map(p=>({...p,points:typeof p.points==='number'&&Number.isFinite(p.points)?p.points:null})).sort((a,b)=>(a.points===null)-(b.points===null)||(b.points??0)-(a.points??0)||a.username.localeCompare(b.username,'es'));
 if(privateScores)return rows.sort((a,b)=>a.username.localeCompare(b.username,'es')).map(p=>({...p,rank:null}));let rank=0,previous=null;return rows.map((p,i)=>{if(p.points!==null&&(i===0||p.points!==previous))rank=i+1;previous=p.points;return {...p,rank:p.points===null?null:rank};});
}
// V316: resultados de hoy como en Survivor (tengaged.es 2014): "X terminada la prueba con N puntos" y hace cuánto.
const ago=at=>{const n=Math.max(0,Math.floor((Date.now()-Number(at))/60000));if(n<60)return n+' min';if(n<1440){const h=Math.floor(n/60);return h+(h===1?' hora':' horas');}const d=Math.floor(n/1440);return d+(d===1?' día':' días');};
export function renderChallengeLeaderboard(root,state,round,options={}){
 if(!root)return;const game=options.gameName||'Casting',dayLabel=options.roundLabel||'Día',challengePath=options.challengePath||'/casting-challenge.html';const rows=rankedChallengeResults(state,round),signature=JSON.stringify([round,state.round,rows,state.me?.username,Math.floor(Date.now()/60000)]);if(root.dataset.signature===signature)return;root.dataset.signature=signature;root.setAttribute('aria-busy','false');root.replaceChildren();if(!/\btg-today\b/.test(root.className||''))root.className=((root.className||'')+' tg-today').trim();
 const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined&&text!==null)node.textContent=text;if(cls)node.className=cls;return node;};
 root.append(el('h2',state.round===round?'Los resultados de hoy para la Prueba de '+game:'Los resultados de '+dayLabel.toLowerCase()+' '+round+' para la Prueba de '+game));
 if(!rows){root.append(el('p','No hay resultados guardados para esta prueba.'));return;}
 const isToday=state.round===round,finished=p=>p.completed||p.points!==null;
 const ordered=rows.slice().sort((a,b)=>finished(b)-finished(a)||(Number(b.at)||0)-(Number(a.at)||0)||(b.points??-1)-(a.points??-1)||a.username.localeCompare(b.username,'es'));
 const list=el('ul');list.setAttribute('aria-label','Resultados de todos los concursantes activos');
 for(const p of ordered){const row=el('li');if(p.username.toLowerCase()===state.me?.username?.toLowerCase())row.className='challenge-own-result';
  const name=el(p.bot?'span':'a',p.username,'challenge-player-name');if(!p.bot)name.href='/profile.html?username='+encodeURIComponent(p.username);row.append(name);
  if(finished(p)){row.append(el('span',p.points===null?' terminada la prueba':' terminada la prueba con '+p.points.toLocaleString('es-ES')+' puntos'));if(Number(p.at))row.append(el('small',ago(p.at)));}
  else row.append(el('span',isToday?(p.started?' está realizando la prueba':' no ha empezado la prueba todavía'):' no hizo la prueba','tg-today-out'));
  list.append(row);}
 if(!rows.length)list.append(el('li','No quedan concursantes activos.'));root.append(list);
 const days=[...new Set([state.round,...(state.challengeHistory||[]).map(d=>d.round)])].sort((a,b)=>b-a);
 if(days.length>1){const nav=el('nav');nav.setAttribute('aria-label','Resultados de otros días');for(const day of days){const a=el('a',dayLabel+' '+day);a.href=challengePath+'?id='+state.id+'&round='+day;if(day===round)a.setAttribute('aria-current','page');nav.append(a);}root.append(nav);}
}
