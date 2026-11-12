import {startAdmin172} from './manual-start172.js';
// La disputa es social. Nunca crea una partida Stars ni modifica saldos.
const pick=a=>{const v=new Uint32Array(1);crypto.getRandomValues(v);return a[Math.floor(v[0]/4294967296*a.length)];};
export const mafiaWeek231=now=>Math.floor((now+3*86400000)/(7*86400000));
export async function mafiaSeat231(db,me,action={},now=Date.now()){
 await db.prepare('CREATE TABLE IF NOT EXISTS mafia_seat231(week INTEGER PRIMARY KEY,revision INTEGER NOT NULL DEFAULT 0,state TEXT NOT NULL)').run();
 const players=(await db.prepare("SELECT mm.user_id,u.username,mm.mafia_id,m.name AS mafia_name FROM mafia_members mm JOIN users u ON u.id=mm.user_id JOIN mafias m ON m.id=mm.mafia_id WHERE mm.role<>'aspirant' AND COALESCE(u.is_banned,0)=0 AND COALESCE(u.is_system,0)=0 AND COALESCE(u.is_test_bot,0)=0").all()).results;
 const week=mafiaWeek231(now);
 if(action.action==='start_seat'){
 if(!startAdmin172(me))throw Error('Solo admin1 puede iniciar el juego de mafias.');
 if(new Set(players.map(p=>p.mafia_id)).size<2)throw Error('Se necesitan al menos dos mafias con miembros.');
 const holder=pick(players),s={week,status:'active',endsAt:(week+1)*7*86400000-3*86400000,holderId:holder.user_id,mafiaId:holder.mafia_id,guesses:{},events:[]};
 await db.prepare('INSERT OR IGNORE INTO mafia_seat231(week,state) VALUES(?,?)').bind(week,JSON.stringify(s)).run();
 }
 for(let attempt=0;attempt<4;attempt++){
 const row=await db.prepare('SELECT * FROM mafia_seat231 ORDER BY week DESC LIMIT 1').first();if(!row)return {status:'waiting',events:[],canStart:startAdmin172(me)};
 const s=JSON.parse(row.state);let changed=false;
 if(s.status==='active'&&now>=s.endsAt){
 const pool=(await db.prepare("SELECT e.user_id,u.username FROM mafia_raffle231 e JOIN mafia_members mm ON mm.user_id=e.user_id AND mm.mafia_id=e.mafia_id JOIN users u ON u.id=e.user_id WHERE e.week=? AND e.mafia_id=? AND mm.role<>'aspirant' AND COALESCE(u.is_banned,0)=0 AND COALESCE(u.is_system,0)=0 AND COALESCE(u.is_test_bot,0)=0 ORDER BY e.user_id").bind(s.week,s.mafiaId).all()).results;
 s.status='finished';s.winner=pool.length?pick(pool):null;changed=true;
 }
 if(action.action==='guess_seat'){
 if(s.status!=='active')throw Error('No hay una disputa de mafias en curso.');
 const actor=players.find(p=>p.user_id===me?.id);if(!actor)throw Error('Solo los miembros de una mafia pueden jugar.');
 if(actor.mafia_id===s.mafiaId)throw Error('Tu mafia ya tiene la estrella.');
 if(now-(s.guesses[actor.user_id]||0)<3600000)throw Error('Solo puedes intentar robar la estrella una vez por hora.');
 let holder=players.find(p=>p.user_id===s.holderId&&p.mafia_id===s.mafiaId);
 if(!holder){const pool=players.filter(p=>p.mafia_id===s.mafiaId);holder=pick(pool.length?pool:players);if(!holder)throw Error('No hay miembros disponibles.');s.holderId=holder.user_id;s.mafiaId=holder.mafia_id;}
 const guessed=players.find(p=>p.user_id===Number(action.target_id)&&p.mafia_id===s.mafiaId);if(!guessed)throw Error('Elige un miembro de la mafia que guarda la estrella.');
 s.guesses[actor.user_id]=now;s.lastResult=guessed.user_id===s.holderId?'robada':'fallo';
 if(s.lastResult==='robada'){s.events.unshift({actor:actor.username,fromId:s.mafiaId,toId:actor.mafia_id,at:now});s.events=s.events.slice(0,50);s.mafiaId=actor.mafia_id;s.holderId=pick(players.filter(p=>p.mafia_id===actor.mafia_id)).user_id;}
 changed=true;
 }
 if(changed){const payload=JSON.stringify(s),statements=[db.prepare('UPDATE mafia_seat231 SET state=?,revision=revision+1 WHERE week=? AND revision=?').bind(payload,s.week,row.revision)];if(s.status==='finished'&&s.winner)statements.push(db.prepare('INSERT OR IGNORE INTO mafia_raffle_winners231(week,mafia_id,user_id) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM mafia_seat231 WHERE week=? AND state=?)').bind(s.week,s.mafiaId,s.winner.user_id,s.week,payload));const r=await db.batch(statements);if(!r[0].meta.changes)continue;}
 const holderMafia=await db.prepare('SELECT name FROM mafias WHERE id=?').bind(s.mafiaId).first();
 const actor=players.find(p=>p.user_id===me?.id);
 return {status:s.status,week:s.week,endsAt:s.endsAt,mafiaId:s.mafiaId,mafiaName:holderMafia?.name||'Mafia disuelta',events:s.events,winner:s.winner||null,canStart:startAdmin172(me)&&s.week<week,canGuess:s.status==='active'&&!!actor&&actor.mafia_id!==s.mafiaId,nextGuessAt:actor?(s.guesses[actor.user_id]||0)+3600000:0,candidates:s.status==='active'?players.filter(p=>p.mafia_id===s.mafiaId).map(p=>({id:p.user_id,username:p.username})):[],result:action.action==='guess_seat'?s.lastResult:null};
 }
 throw Error('Hay actividad simultánea. Inténtalo de nuevo.');
}
