import {reopenFour172} from './hunger.js';
// Explicit, one-time repair requested by the administrator. Preserve the complete
// original arena/archive before replacing state; never overwrite a later lobby
// with actual entrants or a later running game.
export async function recoverFour172(db,now=Date.now()){
 try{if((await db.prepare('SELECT applied FROM hunger_recovery172 WHERE edition=4').first())?.applied)return;}catch(error){if(!/no such table[^\n]*hunger_recovery172/i.test(String(error.message||error)))throw error;}
 await db.prepare('CREATE TABLE IF NOT EXISTS hunger_recovery172(edition INTEGER PRIMARY KEY,previous_arena TEXT NOT NULL,previous_archive TEXT,reopened_state TEXT NOT NULL,applied INTEGER NOT NULL DEFAULT 0)').run();
 for(let retry=0;retry<6;retry++){
  if((await db.prepare('SELECT applied FROM hunger_recovery172 WHERE edition=4').first())?.applied)return;
  const row=await db.prepare('SELECT revision,state FROM hunger_arena WHERE id=1').first();if(!row)return;
  const current=JSON.parse(row.state),archive=await db.prepare('SELECT state FROM hunger_history WHERE edition=4').first();
  if(current.edition!==4&&(current.edition<4||current.phase!=='waiting'||current.players?.length))return;
  const source=current.edition===4?current:archive?JSON.parse(archive.state):null;if(!source||source.phase!=='finished'||source.manualStart172||source.reopening172)return;
  const state=JSON.stringify(reopenFour172(source,now));
  const results=await db.batch([
   db.prepare('INSERT OR IGNORE INTO hunger_recovery172(edition,previous_arena,previous_archive,reopened_state) VALUES(4,?,?,?)').bind(row.state,archive?.state||null,state),
   db.prepare('UPDATE hunger_arena SET state=?,revision=revision+1 WHERE id=1 AND revision=? AND state=? AND EXISTS(SELECT 1 FROM hunger_recovery172 WHERE edition=4 AND applied=0)').bind(state,row.revision,row.state),
   db.prepare('DELETE FROM hunger_history WHERE edition=4 AND state=? AND EXISTS(SELECT 1 FROM hunger_arena WHERE id=1 AND state=?)').bind(archive?.state||'',state),
   db.prepare('UPDATE hunger_recovery172 SET applied=1,reopened_state=? WHERE edition=4 AND EXISTS(SELECT 1 FROM hunger_arena WHERE id=1 AND state=?)').bind(state,state)
  ]);
  if(results[1].meta?.changes)return;
 }
 throw Error('No se pudo reabrir Hunger 4 por actividad simultánea. Vuelve a intentarlo.');
}
