import {addHungerFive188} from '../_shared/hunger-add188.js';
import {recoverFive187} from '../_shared/hunger-recovery187.js';
import {enforceHunger187} from '../_shared/hunger-gate187.js';
import {recoverFour172} from '../_shared/hunger-recovery172.js';
import {schemaReady170,markSchema170} from '../_shared/schema-ready170.js';
import {withStorageGuard} from '../_shared/storage-guard141.js';
import {canFillBots} from '../_shared/game-bots.js';
import {ensureEnrollmentNotifications} from '../_shared/enrollment.js';
import {ensureProfileSchema,getSessionUser,jsonError} from '../_shared/auth.js';
import {ensureGameHistorySchema} from '../_shared/games.js';
import {fresh,advance,act,view,reopenEditionFour161,addSpecialGuest125,addSpecialGuest149,addSpecialGuest152} from '../_shared/hunger.js';
const schemas=new WeakMap();
export async function ensureHunger(db){if(schemas.has(db))return schemas.get(db);const ready=(async()=>{if(await schemaReady170(db,'hunger-schema-171'))return;
 await ensureProfileSchema(db);await ensureGameHistorySchema(db);
 for(const q of [
 'CREATE TABLE IF NOT EXISTS hunger_arena (id INTEGER PRIMARY KEY, revision INTEGER NOT NULL, state TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS hunger_history (edition INTEGER PRIMARY KEY, finished_at INTEGER NOT NULL, state TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS hunger_wallet (event_key TEXT PRIMARY KEY, user_id INTEGER NOT NULL, money INTEGER NOT NULL, karma INTEGER NOT NULL)',
 `CREATE TRIGGER IF NOT EXISTS hunger_wallet_guard BEFORE INSERT ON hunger_wallet WHEN NOT EXISTS(SELECT 1 FROM hunger_wallet WHERE event_key=NEW.event_key) BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM users WHERE id=NEW.user_id AND is_system=0 AND (NEW.money>=0 OR is_banned=0) AND t_money+NEW.money>=0) THEN RAISE(ABORT,'HUNGER_BALANCE') END; END`,
 `CREATE TRIGGER IF NOT EXISTS hunger_wallet_apply AFTER INSERT ON hunger_wallet BEGIN UPDATE users SET t_money=t_money+NEW.money,karma=karma+NEW.karma WHERE id=NEW.user_id; END`,
 `CREATE TRIGGER IF NOT EXISTS hunger_state_economy AFTER UPDATE OF state ON hunger_arena BEGIN
 INSERT OR IGNORE INTO hunger_wallet(event_key,user_id,money,karma) SELECT json_extract(value,'$.key'),json_extract(value,'$.user'),json_extract(value,'$.money'),json_extract(value,'$.karma') FROM json_each(NEW.state,'$.ops');
 INSERT OR IGNORE INTO hunger_history(edition,finished_at,state) SELECT json_extract(NEW.state,'$.edition'),json_extract(NEW.state,'$.finishedAt'),NEW.state WHERE json_extract(NEW.state,'$.phase')='finished' AND json_extract(NEW.state,'$.finishedAt') IS NOT NULL;
 END`
 ,`CREATE TRIGGER IF NOT EXISTS hunger_profile_history AFTER UPDATE OF state ON hunger_arena BEGIN
 INSERT INTO user_game_history(username,game_type,game_id,status,placement,joined_at,finished_at)
 SELECT json_extract(p.value,'$.username'),'HUNGER',CAST(json_extract(NEW.state,'$.edition') AS TEXT),
 CASE WHEN json_extract(NEW.state,'$.phase')='finished' THEN 'finished' WHEN json_extract(p.value,'$.health')<=0 THEN 'eliminated' ELSE 'active' END,
 CASE WHEN json_extract(p.value,'$.placement')=1 THEN 'Ganador' WHEN json_extract(p.value,'$.placement') IS NOT NULL THEN 'Puesto '||json_extract(p.value,'$.placement') ELSE NULL END,
 datetime(json_extract(NEW.state,'$.createdAt')/1000,'unixepoch'),datetime(json_extract(NEW.state,'$.finishedAt')/1000,'unixepoch')
 FROM json_each(NEW.state,'$.players') p WHERE json_extract(p.value,'$.id')>0
 ON CONFLICT DO UPDATE SET status=excluded.status,placement=excluded.placement,finished_at=excluded.finished_at;
 END`
 ,`CREATE TABLE IF NOT EXISTS hunger_ticket_wallet(event_key TEXT PRIMARY KEY,user_id INTEGER NOT NULL,delta INTEGER NOT NULL)`,
 `CREATE INDEX IF NOT EXISTS hunger_ticket_user ON hunger_ticket_wallet(user_id)`,
 `CREATE TRIGGER IF NOT EXISTS hunger_ticket_guard BEFORE INSERT ON hunger_ticket_wallet WHEN NOT EXISTS(SELECT 1 FROM hunger_ticket_wallet WHERE event_key=NEW.event_key) BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM users WHERE id=NEW.user_id AND is_system=0 AND (NEW.delta>=0 OR is_banned=0)) OR COALESCE((SELECT SUM(delta) FROM hunger_ticket_wallet WHERE user_id=NEW.user_id),0)+NEW.delta<0 THEN RAISE(ABORT,'HUNGER_TICKETS') END; END`,
 `CREATE TRIGGER IF NOT EXISTS hunger_ticket_state AFTER UPDATE OF state ON hunger_arena BEGIN
 INSERT OR IGNORE INTO hunger_ticket_wallet(event_key,user_id,delta) SELECT json_extract(value,'$.key'),json_extract(value,'$.user'),json_extract(value,'$.tickets') FROM json_each(NEW.state,'$.ops') WHERE json_type(value,'$.tickets')='integer' AND json_extract(value,'$.tickets')!=0;
 END`
 ])await db.prepare(q).run();
 await db.prepare('INSERT OR IGNORE INTO hunger_arena(id,revision,state) VALUES(1,0,?)').bind(JSON.stringify(fresh())).run();
await markSchema170(db,'hunger-schema-171'); })();schemas.set(db,ready);try{await ready;}catch(e){schemas.delete(db);throw e;}}
// Recover the prematurely finished edition before archive routing can return it.
export async function recoverEditionFour163(db){
 for(let retry=0;retry<6;retry++){
  const row=await db.prepare('SELECT revision,state FROM hunger_arena WHERE id=1').first();
  if(!row)return;const current=JSON.parse(row.state);
  if(current.edition===4&&current.reopening163){
   if(current.reopening163.archiveState)await db.prepare('DELETE FROM hunger_history WHERE edition=4 AND state=?').bind(current.reopening163.archiveState).run();
   return;
  }
  const archived=await db.prepare('SELECT state FROM hunger_history WHERE edition=4').first();
  let source=current.edition===4?current:archived?JSON.parse(archived.state):null;
  if(!source||source.phase!=='finished'||source.reopening161||source.manualStart160)return;
  if(current.edition!==4&&(current.edition<=4||current.phase!=='waiting'||current.players.length))return;
  source=structuredClone(source);if(!reopenEditionFour161(source))return;
  source.reopening163={at:Date.now(),previousArena:current,archiveState:archived?.state||null};
  const result=await db.prepare('UPDATE hunger_arena SET state=?,revision=revision+1 WHERE id=1 AND revision=?').bind(JSON.stringify(source),row.revision).run();
  if(!result.meta.changes)continue;
  if(archived)await db.prepare('DELETE FROM hunger_history WHERE edition=4 AND state=?').bind(archived.state).run();
  return;
 }
 throw Error('No se pudo recuperar Hunger 4 por actividad concurrente. Reintenta.');
}
async function handle141_onRequest({request,env}){
 const headers={'Cache-Control':'no-store'};
 if(!['GET','POST'].includes(request.method))return jsonError('Método no permitido.',405);
 if(request.method==='POST'&&request.headers.get('Origin')!==new URL(request.url).origin)return jsonError('Origen no permitido.',403);
 try{
 const db=env.DB;await ensureHunger(db);await recoverFour172(db);await recoverEditionFour163(db);await recoverFive187(db);await addHungerFive188(db);const user=await getSessionUser(request,db),url=new URL(request.url);let input=null;
 async function project(s){const result=view(s,user,Date.now(),url.searchParams.get('fightPage'));result.sponsorTickets=user?Number((await db.prepare('SELECT COALESCE(SUM(delta),0) AS balance FROM hunger_ticket_wallet WHERE user_id=?').bind(user.id).first()).balance):0;if(result.myPrize){const receipt=await db.prepare('SELECT money,karma FROM hunger_wallet WHERE event_key=?').bind(`hunger:${s.edition}:prize:${user.id}`).first();if(result.myPrize.tickets){const tickets=await db.prepare('SELECT delta FROM hunger_ticket_wallet WHERE event_key=?').bind(`hunger:${s.edition}:winner-tickets:${user.id}`).first();result.myPrize.ticketsRecorded=tickets?.delta===result.myPrize.tickets;}result.myPrize.paymentRecorded=!!receipt&&receipt.money===result.myPrize.money&&receipt.karma===result.myPrize.karma;}return result;}

 if(request.method==='GET'&&url.searchParams.has('edition')){const requested=Number(url.searchParams.get('edition')),current=await db.prepare('SELECT state FROM hunger_arena WHERE id=1').first();if(!current||JSON.parse(current.state).edition!==requested){const row=await db.prepare('SELECT state FROM hunger_history WHERE edition=?').bind(requested).first();if(!row)return jsonError('Edición no encontrada.',404);return Response.json({ok:true,...await project(JSON.parse(row.state)),archived:true},{headers});}}
 if(request.method==='POST'){if(!user)return jsonError('Inicia sesión para jugar.',401);try{input=await request.json();}catch{return jsonError('Petición inválida.',400);}if(!input||typeof input.action!=='string'||typeof input.nonce!=='string'||input.nonce.length<8||input.nonce.length>100)return jsonError('Acción inválida. Actualiza la página.',400);
 if(input.action==='fill_bots'&&!canFillBots(user))return jsonError('Solo admin1 puede completar partidas con bots.',403);
 if(input.action==='join'){const recent=await db.prepare("SELECT state FROM hunger_history WHERE finished_at>? AND json_extract(state,'$.winnerId')=?").bind(Date.now()-14400000,user.id).all();if(recent.results.some(r=>JSON.parse(r.state).winnerId===user.id))return jsonError('Después de ganar debes esperar cuatro horas para volver a entrar.',400);}}
 if(input?.action==='join'&&input.enrollment)await ensureEnrollmentNotifications(db,'hunger');
 for(let retry=0;retry<6;retry++){
 const row=await db.prepare('SELECT revision,state FROM hunger_arena WHERE id=1').first(),s=JSON.parse(row.state);enforceHunger187(s);advance(s);
 if(((s.edition===2&&!s.specialEntry125)||(s.edition===3&&!s.specialEntry149))&&s.phase==='active'&&s.players.length===30&&!s.players.some(p=>p.username.toLowerCase()==='mdma')){
 const guest=await db.prepare("SELECT id,username,is_system,is_banned FROM users WHERE lower(username)='mdma' LIMIT 1").first();addSpecialGuest125(s,guest);addSpecialGuest149(s,guest);
 }
 if(s.edition===3&&s.phase==='active'&&!s.specialEntry152&&s.specialEntry149&&s.players.length===31&&!s.players.some(p=>p.username.toLowerCase()==='paucubarsi')){
 const guest=await db.prepare("SELECT id,username,is_system,is_banned FROM users WHERE lower(username)='paucubarsi' LIMIT 1").first();addSpecialGuest152(s,guest);
 }
 if(input){if(input.edition!==s.edition){const archived=await db.prepare('SELECT state FROM hunger_history WHERE edition=?').bind(input.edition).first();if(archived){const previous=JSON.parse(archived.state);if(previous.receipts?.includes(`${user.id}:${input.nonce}`))return Response.json({ok:true,...await project(previous),archived:true},{headers});}return jsonError('La edición ha cambiado. Actualiza la arena.',409);}const receipt=`${user.id}:${input.nonce}`;s.receipts??=[];
 if(!s.receipts.includes(receipt)){if(input.action==='next'&&s.phase==='finished')await db.prepare('INSERT OR IGNORE INTO hunger_history(edition,finished_at,state) VALUES(?,?,?)').bind(s.edition,s.finishedAt||Date.now(),JSON.stringify(s)).run();try{act(s,user,input);}catch(e){return jsonError(e.message,400);}s.receipts.push(receipt);}}
 const serialized=JSON.stringify(s);
 if(serialized!==row.state){const result=await db.prepare('UPDATE hunger_arena SET state=?,revision=revision+1 WHERE id=1 AND revision=?').bind(serialized,row.revision).run();if(!result.meta.changes)continue;}
 const projected=await project(s);if(s.phase==='finished'){await db.prepare('INSERT OR IGNORE INTO hunger_history(edition,finished_at,state) VALUES(?,?,?)').bind(s.edition,s.finishedAt||Date.now(),JSON.stringify(s)).run();}return Response.json({ok:true,...projected},{headers});
 }return jsonError('Hay mucha actividad. Vuelve a intentarlo.',409);
 }catch(e){if(String(e.message).includes('HUNGER_TICKETS'))return jsonError('No tienes tickets de patrocinador disponibles. No se ha consumido el regalo.',400);if(String(e.message).includes('HUNGER_BALANCE'))return jsonError('Saldo insuficiente: entrar cuesta 20 T$ y cada patrocinio cuesta 100 T$. No se ha realizado el cargo.',400);console.error('Hunger API',e);return jsonError('No se pudo cargar la arena.',500);}
}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
