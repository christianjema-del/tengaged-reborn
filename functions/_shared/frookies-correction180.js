export function correctFrookiesFour180(s,now=Date.now()){
 if(s.id!==4||s.correction180||['waiting','finished'].includes(s.phase))return false;
 const pau=s.players.find(p=>p.username.toLowerCase()==='paucubarsi'&&!p.bot);
 if(pau?.status!=='eliminated'||pau.placement!==12)return false;
 const eviction=s.history?.find(h=>h.evicted==='PauCubarsi'&&h.nominees?.includes('Tributo F4 · 8'));
 const bot=s.players.find(p=>p.bot&&p.username==='Tributo F4 · 8');
 if(!eviction||bot?.status!=='active')return false;
 pau.status='active';pau.placement=null;delete pau.eliminatedAt;
 bot.status='eliminated';bot.placement=12;bot.eliminatedAt=eviction.at;
 eviction.originalEvicted180=eviction.evicted;eviction.evicted=bot.username;eviction.administrativeCorrection180=true;
 for(const event of s.events||[])if(event.kind==='eviction'&&event.evicted===pau.username&&event.round===eviction.round){event.originalEvicted180=event.evicted;event.evicted=bot.username;event.text=bot.username+' sale de la casa (puesto 12, corrección administrativa).';event.administrativeCorrection180=true;}
 delete s.ballots?.[bot.username.toLowerCase()];delete s.juryVotes?.[bot.username.toLowerCase()];
 for(const key of ['hoh','pov','savedNominee'])if(s[key]===bot.username)s[key]=pau.username;
 s.nominees=(s.nominees||[]).map(name=>name===bot.username?pau.username:name);
 for(const key of Object.keys(s.ballots||{}))if(s.ballots[key]===bot.username)s.ballots[key]=pau.username;
 if(s.pending146?.target===bot.username)s.pending146.target=pau.username;
 s.correction180={at:now,restored:pau.username,eliminated:bot.username,placement:12,round:eviction.round};
 s.events.unshift({id:crypto.randomUUID(),at:now,kind:'notice',text:'Corrección de Frookies #4: PauCubarsi vuelve a la casa. Tributo F4 · 8 ocupa el puesto 12. Se conservan las inscripciones y la ronda actual.'});
 return true;
}
