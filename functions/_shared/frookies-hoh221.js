// Explicit one-time assignment requested for Frookies #6, round 10.
export function correctPeachHoh221(s,now=Date.now()){
 if(Number(s.id)!==6||Number(s.round)!==10||s.peachHoh221||['waiting','finished','jury'].includes(s.phase))return false;
 const peach=s.players.find(p=>!p.bot&&p.status==='active'&&p.username.toLowerCase()==='peach');
 const previous=s.players.find(p=>p.username.toLowerCase()===String(s.hoh||'').toLowerCase());
 if(!peach||!previous?.bot)return false;
 s.peachHoh221={at:now,round:10,previous:s.hoh,previousHoh:s.previousHoh,events:JSON.parse(JSON.stringify(s.events.filter(e=>e.kind==='hoh'&&e.round===10)))};
 s.hoh=peach.username;s.previousHoh=peach.username;
 for(const e of s.events)if(e.kind==='hoh'&&e.round===10){e.hoh=peach.username;e.text='HoH de la ronda 10: '+peach.username+'.';}
 for(const h of s.history||[])if(h.round===10)h.hoh=peach.username;
 return true;
}
