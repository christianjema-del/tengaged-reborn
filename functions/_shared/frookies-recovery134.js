import {fresh} from './frookies-engine.js';
// User-requested recovery is limited to legacy edition #1; snapshot and marker are permanent.
export async function recoverFrookiesOne(db,id){
 if(id!==1)return;
 for(let retry=0;retry<8;retry++){
  if(await db.prepare('SELECT match_id FROM frookies_recovery134 WHERE match_id=1 AND applied=1').first())return;
  const row=await db.prepare('SELECT * FROM frookies_matches WHERE id=1').first();if(!row)return;
  const old=JSON.parse(row.state);if(old.version>=134)return;
  const now=Date.now(),s=fresh(1,now),humans=old.players.filter(p=>!p.bot);
  s.runId='recovery134';s.manualStart=true;s.recovery={at:now,previousRound:old.round,previousPhase:old.phase};
  s.players=humans.map(p=>({id:p.id,username:p.username,status:'active',bot:false,tie:p.tie??crypto.getRandomValues(new Uint32Array(1))[0],placement:null,notifyOnStart:!!p.notifyOnStart}));
  // Original entry receipts remain valid. No user is charged again during recovery.
  s.ops=(old.ops||[]).filter(o=>String(o.key).includes(':entry:'));s.receipts=old.receipts||[];
  s.welcomes=(old.welcomes||[]).filter(w=>humans.some(p=>p.username.toLowerCase()===w.username.toLowerCase()));
  s.events=[{id:crypto.randomUUID(),at:now,kind:'notice',text:'Frookies #1 se ha reiniciado por un fallo de calendario. Se conservan los usuarios reales y sus inscripciones. Esperando el inicio de admin1.'}];
  const payload=JSON.stringify(s),items=[
   db.prepare('INSERT OR IGNORE INTO frookies_recovery134(match_id,state,revision,created_at,applied) SELECT id,state,revision,?,0 FROM frookies_matches WHERE id=1').bind(new Date(now).toISOString()),
   db.prepare('UPDATE frookies_matches SET state=?,revision=revision+1 WHERE id=1 AND revision=? AND NOT EXISTS(SELECT 1 FROM frookies_recovery134 WHERE match_id=1 AND applied=1)').bind(payload,row.revision)
  ];
  for(const p of s.players)items.push(db.prepare(`INSERT INTO user_game_history(username,game_type,game_id,status,placement,joined_at,finished_at) SELECT ?,'FROOKIES','1','active',NULL,?,NULL WHERE EXISTS(SELECT 1 FROM frookies_matches WHERE id=1 AND state=?) ON CONFLICT DO UPDATE SET status='active',placement=NULL,finished_at=NULL`).bind(p.username,new Date(now).toISOString(),payload));
  items.push(db.prepare('UPDATE frookies_recovery134 SET applied=1 WHERE match_id=1 AND EXISTS(SELECT 1 FROM frookies_matches WHERE id=1 AND state=?)').bind(payload));
  const out=await db.batch(items);if(out[1].meta.changes)return;
 }
 throw Error('No se ha podido recuperar la partida por actividad simultánea. Reintenta la conexión.');
}
