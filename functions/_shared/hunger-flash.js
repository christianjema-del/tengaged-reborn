import {enforceHunger187} from './hunger-gate187.js';
import {ensureHunger} from '../api/hunger.js';
import {act,advance,view} from './hunger.js';
import {gameData} from './flash-data.js';
export async function hungerFlash(db,user,input,game,now=Date.now()){
 await ensureHunger(db);
 for(let retry=0;retry<6;retry++){
 const row=await db.prepare('SELECT revision,state FROM hunger_arena WHERE id=1').first(),s=JSON.parse(row.state);enforceHunger187(s);advance(s,now);
 if(s.edition!==input.edition)throw Error('La edición ha cambiado.');
 act(s,user,input,now,undefined,true);
 const f=s.fights.find(f=>f.id===input.fight),run=f?.runs[user.id];if(!f||!run)throw Error('No hay un intento de combate.');
 if(!f.flashData)f.flashData=gameData(game,run.duration||100);
 const serialized=JSON.stringify(s),result=await db.prepare('UPDATE hunger_arena SET state=?,revision=revision+1 WHERE id=1 AND revision=?').bind(serialized,row.revision).run();if(!result.meta.changes)continue;
 return {run,data:f.flashData,endsAt:f.endsAt};
 }throw Error('Hay actividad simultánea. Vuelve a intentarlo.');
}
