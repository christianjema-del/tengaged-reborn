// Owner-authorized restoration; not represented as a recovered server receipt.
export function restorePeach184(s,now=Date.now()){
 if(s.id!==4||s.round!==10||s.peachCorrection184||s.phase==='finished'||s.previousChallenge146?.round!==9||s.pov!=='PauCubarsi')return false;
 const peach=s.players.find(p=>p.username.toLowerCase()==='peach'&&!p.bot);
 const four=s.players.filter(p=>!p.bot&&(p.status==='active'||[3,4].includes(p.placement)));
 if(!peach||four.length!==4||!four.includes(peach)||(s.ops||[]).some(op=>String(op.key).includes(':prize:')))return false;
 const previous={pov:s.pov,phase:s.phase,finalists:s.finalists,juryVotes:s.juryVotes,peachPlacement:peach.placement};
 const score={points:1500,savedAt:now,restored184:true,restorationSource:'owner-instruction',reason:'Puntuación indicada por admin1; posible guardado afectado por pausa.'};
 s.previousChallenge146.scores??={};s.previousChallenge146.scores.peach=score;
 for(const row of [...(s.challengeArchive146||[]),...(s.history||[])])if(row.round===9){row.scores??={};row.scores.peach={...score};}
 for(const p of four){p.status='active';p.placement=null;delete p.eliminatedAt;}
 for(const event of s.events||[])if(event.round===10&&['pov','final-places','finalists'].includes(event.kind)){event.originalKind184=event.kind;event.kind='notice';event.text='Aviso anterior de la final anulado por restitución del PoV de Peach.';}
 s.pov='Peach';s.povSourceRound146=9;s.phase='final_places';s.phaseStartedAt=s.pause180?.at||now;s.deadline=s.phaseStartedAt+120000;
 s.pending146=null;s.finalists=[...new Set([s.hoh,'Peach'])];s.juryVotes={};s.botJurySchedule={};delete s.winner;delete s.finishedAt;
 s.peachCorrection184={at:now,points:1500,sourceRound:9,source:'owner-instruction',previous};
 s.events.unshift({id:crypto.randomUUID(),at:now,kind:'pov',pov:'Peach',round:10,text:'PoV corregido: Peach. La administración restituye 1500 puntos de la prueba de la ronda 9. Se repite la elección de tercero y cuarto respetando su inmunidad.'});
 return true;
}
