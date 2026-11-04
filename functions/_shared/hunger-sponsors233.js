// Solo lectura: historial real y saldo de tickets, sin conceder nuevos premios.
export async function hungerSponsorWinners233(db){
 const fields="json_extract(state,'$.edition') AS edition,json_extract(state,'$.phase') AS phase,json_extract(state,'$.winnerId') AS winner_id,json_extract(state,'$.winner') AS winner_name,json_extract(state,'$.finishedAt') AS finished_at";
 const archived=fields.replace("json_extract(state,'$.edition') AS edition",'edition').replace("json_extract(state,'$.finishedAt') AS finished_at","COALESCE(json_extract(state,'$.finishedAt'),finished_at) AS finished_at");
 const history=(await db.prepare('SELECT '+archived+' FROM hunger_history').all()).results,arena=await db.prepare('SELECT '+fields+' FROM hunger_arena WHERE id=1').first();
 const editions=new Map(history.map(r=>[Number(r.edition),r]));if(arena)editions.set(Number(arena.edition),arena);
 const winners=[],seen=new Set();
 for(const r of [...editions.values()].filter(r=>r.phase==='finished').sort((a,b)=>Number(b.finished_at||0)-Number(a.finished_at||0)||b.edition-a.edition)){
 if(Number(r.winner_id)<0||(!Number(r.winner_id)&&!r.winner_name))continue;
 const q="SELECT u.id,u.username,COALESCE((SELECT SUM(delta) FROM hunger_ticket_wallet WHERE user_id=u.id),0) AS tickets FROM users u WHERE COALESCE(u.is_system,0)=0 AND COALESCE(u.is_test_bot,0)=0 AND COALESCE(u.is_banned,0)=0 AND ";
 const p=Number(r.winner_id)>0?await db.prepare(q+'u.id=?').bind(Number(r.winner_id)).first():await db.prepare(q+'LOWER(u.username)=LOWER(?)').bind(r.winner_name).first();
 if(!p||seen.has(p.id))continue;seen.add(p.id);winners.push({id:p.id,username:p.username,tickets:Math.max(0,Number(p.tickets)||0),edition:Number(r.edition)});if(winners.length>=20)break;
 }return winners;
}
