export function rankedChallengeResults(state,round){
 const source=state.round===round?state.challengeResults:state.challengeHistory?.find(d=>d.round===round)?.results;
 if(!Array.isArray(source))return null;
 const active=new Set((state.players||[]).filter(p=>p.status==='active').map(p=>p.username.toLowerCase()));
 const privateScores=state.rules146===true;const rows=source.filter(p=>active.has(p.username.toLowerCase())).map(p=>({...p,points:typeof p.points==='number'&&Number.isFinite(p.points)?p.points:null})).sort((a,b)=>(a.points===null)-(b.points===null)||(b.points??0)-(a.points??0)||a.username.localeCompare(b.username,'es'));
 if(privateScores)return rows.sort((a,b)=>a.username.localeCompare(b.username,'es')).map(p=>({...p,rank:null}));let rank=0,previous=null;return rows.map((p,i)=>{if(p.points!==null&&(i===0||p.points!==previous))rank=i+1;previous=p.points;return {...p,rank:p.points===null?null:rank};});
}
export function renderChallengeLeaderboard(root,state,round,options={}){
 if(!root)return;const game=options.gameName||'Casting',dayLabel=options.roundLabel||'Día',challengePath=options.challengePath||'/casting-challenge.html';const rows=rankedChallengeResults(state,round),signature=JSON.stringify([round,state.round,rows,state.me?.username]);if(root.dataset.signature===signature)return;root.dataset.signature=signature;root.setAttribute('aria-busy','false');root.replaceChildren();
 const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
 root.append(el('h2',state.round===round?'Los resultados de hoy para la Prueba de '+game:'Los resultados de '+dayLabel.toLowerCase()+' '+round+' para la Prueba de '+game));
 if(!rows){root.append(el('p','No hay resultados guardados para esta prueba.'));return;}
 root.append(el('p',rows.filter(p=>p.completed||p.points!==null).length+' de '+rows.length+' concursantes han terminado.'));
 const list=el('ol');list.setAttribute('aria-label','Resultados de todos los concursantes activos');
 for(const p of rows){const row=el('li');if(p.username.toLowerCase()===state.me?.username?.toLowerCase())row.className='challenge-own-result';
 const name=el(p.bot?'span':'a',p.username);name.className='challenge-player-name';if(!p.bot)name.href='/profile.html?username='+encodeURIComponent(p.username);
 const text=p.points===null?(p.completed?'ha terminado la prueba. Resultado privado.':state.round!==round?'no completó la prueba.':p.started?'está realizando la prueba.':'no ha empezado la prueba todavía.'):'ha terminado la prueba con '+p.points.toLocaleString('es-ES')+' puntos.';
 row.append(name,el('span',' '+text+(p.bot?' · Bot':'')));if(p.rank!==null)row.setAttribute('data-rank',String(p.rank));list.append(row);}
 if(!rows.length)list.append(el('li','No quedan concursantes activos.'));root.append(list);
 const days=[...new Set([state.round,...(state.challengeHistory||[]).map(d=>d.round)])].sort((a,b)=>b-a);
 if(days.length>1){const nav=el('nav');nav.setAttribute('aria-label','Resultados de otros días');for(const day of days){const a=el('a',dayLabel+' '+day);a.href=challengePath+'?id='+state.id+'&round='+day;if(day===round)a.setAttribute('aria-current','page');nav.append(a);}root.append(nav);}
}
