export function correctHohFive194(s,now=Date.now()){
 if(s.id!==5||s.round!==10||s.hohCorrection194||s.phase!=='nominations'||s.pov||(s.nominees||[]).length)return false;
 if(String(s.hoh).toLowerCase()!=='oscar'||String(s.history?.find(h=>h.round===9)?.hoh).toLowerCase()!=='oscar')return false;
 const lamine=s.players.find(p=>p.username.toLowerCase()==='lamine'&&!p.bot&&p.status==='active');if(!lamine)return false;
 s.hohCorrection194={at:now,round:10,previous:s.hoh,winner:lamine.username,previousHoh:s.previousHoh||null};
 s.hoh=lamine.username;s.previousHoh=lamine.username;
 for(const e of s.events||[])if(e.kind==='hoh'&&e.round===10){e.originalHoh194=e.hoh;e.hoh=lamine.username;e.text='HoH de la ronda 10: '+lamine.username+'.';}
 s.events.unshift({id:crypto.randomUUID(),at:now,kind:'notice',round:10,text:'HoH corregido: '+lamine.username+' recibe el HoH de la ronda 10. El HoH de la ronda anterior no puede repetir, tampoco en la final a cuatro.'});return true;
}
