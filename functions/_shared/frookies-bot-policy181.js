const key=p=>String(p?.username||p||'').toLowerCase();
export function targetPriority181(s,p,now=Date.now()){
 if(p.bot)return 0;
 const name=key(p),recent=s.activeHumans181?.[name];
 const active=recent||s.activity?.[name]?.messages>0||s.scores?.[name]||s.attempts?.[name]||now-(s.startedAt||s.createdAt)<1800000;
 return active?2:1;
}
export function botTargets181(s,pool,now=Date.now()){
 return pool.slice().sort((a,b)=>targetPriority181(s,a,now)-targetPriority181(s,b,now)||
  (Number(s.activity?.[key(a)]?.messages)||0)-(Number(s.activity?.[key(b)]?.messages)||0)||
  (Number(a.tie)||0)-(Number(b.tie)||0)||key(a).localeCompare(key(b)));
}
export function correctNominationFour181(s,now=Date.now()){
 if(s.id!==4||s.round!==5||s.nominationCorrection181||!['nominations','veto','replacement','vote','tiebreak'].includes(s.phase)||!(s.nominees||[]).length)return false;
 const active=s.players.filter(p=>p.status==='active');
 const eligible=active.filter(p=>p.bot&&![s.hoh,s.pov,s.savedNominee,...s.nominees].includes(p.username));
 const choices=botTargets181(s,eligible,now);let changed=false;
 const previous=[...s.nominees];
 const next=s.nominees.map(name=>{const p=active.find(p=>p.username===name);if(p&&!p.bot&&choices.length){changed=true;return choices.shift().username;}return name;});
 if(!changed)return false;
 s.nominees=next;
 const at=s.pause180?.at||now;
 s.nominationCorrection181={at:now,round:s.round,previous,nominees:[...next],previousPhase:s.phase};
 if(['vote','tiebreak'].includes(s.phase)){s.phase='vote';s.phaseStartedAt=at;s.activitySince180=null;s.deadline=at+180000;s.ballots={};s.pending146=null;}
 else if(s.phase==='veto'){s.vetoDecision=null;s.savedNominee=null;s.pending146=null;s.phaseStartedAt=at;s.deadline=at+120000;}
 else if(s.pending146?.action==='veto'){s.pending146=null;s.vetoDecision=null;}
 for(const e of s.events||[])if(e.round===s.round&&e.kind==='nominations'){
  e.originalNominees181=e.nominees;e.nominees=[...next];e.text='Nominación corregida: '+next.join(' y ')+'.';
 }
 s.events.unshift({id:crypto.randomUUID(),at:now,kind:'nominations',round:s.round,nominees:[...next],text:'Nominación corregida: '+next.join(' y ')+'. Los bots priorizan a otros bots y a usuarios inactivos antes que a usuarios activos.'});
 return true;
}
