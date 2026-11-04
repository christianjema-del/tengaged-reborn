// Public game notices only. Whispers, attempts and private player resources never leave here.
export function publicEvents166(state,type,now=Date.now()){
 const id=type==='hunger'?state.edition:state.id;if(!Number.isSafeInteger(id)||id<1)return [];
 const out=[];for(const [i,e] of (state.events||[]).entries()){
  const at=Number(e.at);if(!Number.isFinite(at)||at<Date.UTC(2000,0,1)||at>now+60000)continue;
  if(typeof e.text!=='string'||!/nominad|eliminad|ganador|final del|día \d|comienza|iniciad|gana hunger|termina|clasificación corregida/i.test(e.text))continue;
  const body=type==='casting'&&state.phase==='finished'&&/Final del Casting/i.test(e.text)?'Final del Casting. Ganador/a: '+(state.winner||'sin ganador')+'.':e.text;
  let event={kind:'notice'};if(type==='casting'&&/Final del Casting/i.test(e.text)&&state.phase==='finished')event={kind:'finished',placements:(state.players||[]).filter(p=>p.placement>0).sort((a,b)=>a.placement-b.placement).slice(0,5).map(p=>({username:p.username,placement:p.placement,bot:!!p.bot}))};else if(/nominad/i.test(e.text)&&at>=Number(state.dayStartedAt||Infinity))event={kind:'nominations',nominees:[...(state.nominees||[])]};else if(/eliminad/i.test(e.text))event={kind:'elimination'};
  out.push({event,id:'notice:'+type+':'+id+':'+at+':'+i,room:type+':'+id,kind:'event',username:null,body:body.slice(0,1000),created_at:new Date(at).toISOString()});
 }
 return out.slice(0,8);
}
export async function recentPublicEvents166(db){
 const tables=new Set((await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('casting_matches','frookies_matches','hunger_arena')").all()).results.map(r=>r.name));
 const out=[];for(const [table,type] of [['casting_matches','casting'],['frookies_matches','frookies'],['hunger_arena','hunger']]){
  if(!tables.has(table))continue;
  const rows=(await db.prepare('SELECT state FROM '+table+' ORDER BY id DESC LIMIT 30').all()).results;
  for(const row of rows){try{out.push(...publicEvents166(JSON.parse(row.state),type));}catch(e){if(!(e instanceof SyntaxError))throw e;}}
 }
 return out;
}
