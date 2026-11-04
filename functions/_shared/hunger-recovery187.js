import {fresh,player187} from './hunger.js';
import {validStart172} from './manual-start172.js';
import {validHungerClock187} from './hunger-gate187.js';
const invalid=s=>!validStart172(s,'hunger')||!validHungerClock187(s);
export async function recoverFive187(db,now=Date.now()){
 try{if((await db.prepare('SELECT applied FROM hunger_recovery187 WHERE id=1').first())?.applied)return;}catch(e){if(!/no such table/i.test(e.message||''))throw e;}
 const row=await db.prepare('SELECT revision,state FROM hunger_arena WHERE id=1').first();if(!row)return;
 const current=JSON.parse(row.state);if(current.edition<5)return;
 const users=(await db.prepare("SELECT id,username FROM users WHERE lower(username) IN ('cristi','lamine','ricardito','giovanni') AND COALESCE(is_system,0)=0 AND COALESCE(is_banned,0)=0").all()).results;
 if(users.length!==4)return;
 if(current.phase==='active'&&!invalid(current))throw Error('Existe un Hunger en marcha con inicio válido; no se ha sustituido.');
 await db.prepare('CREATE TABLE IF NOT EXISTS hunger_recovery187(id INTEGER PRIMARY KEY,previous_arena TEXT NOT NULL,archives TEXT NOT NULL,profiles TEXT NOT NULL,reopened_state TEXT NOT NULL,applied INTEGER NOT NULL DEFAULT 0,at INTEGER NOT NULL)').run();
 for(let retry=0;retry<6;retry++){
  if((await db.prepare('SELECT applied FROM hunger_recovery187 WHERE id=1').first())?.applied)return;
  const latest=await db.prepare('SELECT revision,state FROM hunger_arena WHERE id=1').first();
  if(latest.revision!==row.revision||latest.state!==row.state)throw Error('La arena cambió durante la recuperación. Reintenta.');
  const archives=(await db.prepare('SELECT edition,finished_at,state FROM hunger_history WHERE edition>=5 ORDER BY edition').all()).results;
  const withdrawn=archives.filter(r=>invalid(JSON.parse(r.state)));
  if(archives.some(r=>r.edition===5&&!invalid(JSON.parse(r.state))))throw Error('Hunger 5 tiene un inicio válido y no se sobrescribe automáticamente.');
  const ids=[...new Set([5,current.edition,...withdrawn.map(r=>r.edition)])];
  const placeholders=ids.map(()=>'?').join(',');
  const profiles=(await db.prepare("SELECT * FROM user_game_history WHERE game_type='HUNGER' AND CAST(game_id AS INTEGER) IN ("+placeholders+")").bind(...ids).all()).results;
  const s=fresh(now,5);s.manualGate187=true;s.runId=crypto.randomUUID();s.receipts=[];
  const names=['cristi','lamine','ricardito','giovanni'];s.players=names.map(name=>{const u=users.find(u=>u.username.toLowerCase()===name);return player187(u.id,u.username);});
  s.recovery187={at:now,retained:s.players.map(p=>p.username),withdrawn:withdrawn.map(r=>r.edition)};
  s.events=[{at:now,kind:'lobby-system',text:'Hunger Games #5 recuperado. Cristi, Lamine, Ricardito y Giovanni conservan sus plazas. Inscripciones abiertas; solo admin1 puede iniciar.'}];
  const payload=JSON.stringify(s);const items=[
   db.prepare('INSERT OR IGNORE INTO hunger_recovery187(id,previous_arena,archives,profiles,reopened_state,at) VALUES(1,?,?,?,?,?)').bind(row.state,JSON.stringify(archives),JSON.stringify(profiles),payload,now),
   db.prepare('DELETE FROM user_game_history WHERE game_type=\'HUNGER\' AND CAST(game_id AS INTEGER) IN ('+placeholders+') AND EXISTS(SELECT 1 FROM hunger_arena WHERE id=1 AND revision=?) AND EXISTS(SELECT 1 FROM hunger_recovery187 WHERE id=1 AND applied=0)').bind(...ids,row.revision),
   db.prepare('UPDATE hunger_arena SET state=?,revision=revision+1 WHERE id=1 AND revision=? AND state=? AND EXISTS(SELECT 1 FROM hunger_recovery187 WHERE id=1 AND applied=0)').bind(payload,row.revision,row.state)
  ];
  for(const r of withdrawn)items.push(db.prepare('DELETE FROM hunger_history WHERE edition=? AND state=? AND EXISTS(SELECT 1 FROM hunger_arena WHERE id=1 AND state=?)').bind(r.edition,r.state,payload));
  items.push(db.prepare(GUARD187),db.prepare(NEXT_GUARD187));
  items.push(db.prepare('UPDATE hunger_recovery187 SET applied=1,reopened_state=? WHERE id=1 AND EXISTS(SELECT 1 FROM hunger_arena WHERE id=1 AND state=?)').bind(payload,payload));
  const results=await db.batch(items);if(results[2].meta.changes)return;
 }
 throw Error('No se pudo recuperar Hunger 5. Reintenta.');
}
const GUARD187=`CREATE TRIGGER IF NOT EXISTS hunger_start_guard187 BEFORE UPDATE OF state ON hunger_arena
 WHEN json_extract(NEW.state,'$.edition')>=5 AND json_extract(NEW.state,'$.phase') IN ('active','finished') AND (
 json_type(NEW.state,'$.startedAt') NOT IN ('integer','real') OR json_type(NEW.state,'$.tickAt') NOT IN ('integer','real') OR COALESCE(json_extract(NEW.state,'$.manualStart172.kind'),'')<>'hunger' OR COALESCE(json_extract(NEW.state,'$.manualStart172.by'),'')<>'admin1' OR
 COALESCE(json_extract(NEW.state,'$.manualStart172.game'),-1)<>json_extract(NEW.state,'$.edition') OR
 COALESCE(json_extract(NEW.state,'$.manualStart172.run'),'')<>COALESCE(json_extract(NEW.state,'$.runId'),'') OR
 COALESCE(json_extract(NEW.state,'$.manualStart172.at'),0)<json_extract(NEW.state,'$.createdAt') OR
 COALESCE(json_extract(NEW.state,'$.startedAt'),0)<json_extract(NEW.state,'$.createdAt') OR
 COALESCE(json_extract(NEW.state,'$.tickAt'),0)<COALESCE(json_extract(NEW.state,'$.startedAt'),0))
 BEGIN SELECT RAISE(ABORT,'HUNGER_MANUAL_START_REQUIRED');END`;
const NEXT_GUARD187=`CREATE TRIGGER IF NOT EXISTS hunger_next_guard187 BEFORE UPDATE OF state ON hunger_arena
 WHEN json_extract(NEW.state,'$.edition')>json_extract(OLD.state,'$.edition') AND (
 COALESCE(json_extract(NEW.state,'$.manualOpened187.by'),'')<>'admin1' OR
 COALESCE(json_extract(NEW.state,'$.manualOpened187.parentRun'),'')<>COALESCE(json_extract(OLD.state,'$.runId'),'') OR
 json_extract(OLD.state,'$.phase')<>'finished')
 BEGIN SELECT RAISE(ABORT,'HUNGER_MANUAL_NEXT_REQUIRED');END`;
export async function installGuard187(db){await db.prepare(GUARD187).run();await db.prepare(NEXT_GUARD187).run();}

