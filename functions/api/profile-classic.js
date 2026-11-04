import {profileActivity231} from '../_shared/profile-activity231.js';
import {withStorageGuard} from '../_shared/storage-guard141.js';
import {context,ok,fail,userByName,mutation} from '../_shared/community-plus.js';
import {ensureProfileClassic166} from '../_shared/profile-classic166.js';
import {ensureGameHistorySchema} from '../_shared/games.js';
async function handle({request,env}){try{
 const {db,me,url}=await context(request,env.DB),target=await db.prepare('SELECT id,username,is_system,is_test_bot,is_banned FROM users WHERE username=? COLLATE NOCASE AND is_banned=0').bind(url.searchParams.get('username')||me?.username||'').first();if(!target)return fail('Usuario no encontrado.',404);
 await ensureProfileClassic166(db);await ensureGameHistorySchema(db);const day=(await db.prepare("SELECT strftime('%Y-%m-%d','now') AS day").first()).day;
 if(request.method==='POST'){
  const denied=mutation(request,me);if(denied)return denied;const body=await request.json();if(body.action!=='donate')return fail('Acción inválida.',400);
  if(me.id===target.id||me.is_system||me.is_test_bot||me.is_banned||target.is_system||target.is_test_bot||target.is_banned)return fail('No se puede donar a este perfil.',403);
  const prior=await db.prepare('SELECT 1 FROM profile_donations166 WHERE donor_id=? AND recipient_id=? AND day=?').bind(me.id,target.id,day).first();
  if(!prior)await db.prepare('INSERT OR IGNORE INTO profile_donations166(donor_id,recipient_id,day) VALUES(?,?,?)').bind(me.id,target.id,day).run();
 }else if(request.method!=='GET')return fail('Método no permitido.',405);
 const donations=await db.prepare('SELECT COUNT(*) AS total,COALESCE(SUM(day=?),0) AS today FROM profile_donations166 WHERE recipient_id=?').bind(day,target.id).first();
 const donated=!!(me&&await db.prepare('SELECT 1 FROM profile_donations166 WHERE donor_id=? AND recipient_id=? AND day=?').bind(me.id,target.id,day).first());
 const page=Math.max(1,Math.min(1000,Math.floor(Number(url.searchParams.get('page'))||1))),size=15;
 let activity=[],total=0,activity_error=null;try{({activity,total,activity_error}=await profileActivity231(db,target,page,size));}catch(e){console.error('Profile activity',e);activity_error='No se pudieron cargar las últimas acciones. Pulsa Reintentar.';}

 return ok({username:target.username,page,page_size:size,total,activity,activity_error,donations:{total:Number(donations.total),money:Number(donations.total)/10,today:Number(donations.today),limit:30,donated,can_donate:!!me&&me.id!==target.id&&!me.is_system&&!me.is_test_bot&&!me.is_banned&&!target.is_system&&!target.is_test_bot&&!target.is_banned&&!donated&&donations.today<30}});
 }catch(e){if(String(e.message).includes('DONATION_LIMIT166'))return fail('Este perfil ya ha recibido 30 donaciones hoy.',409);if(String(e.message).includes('DONATION_NOT_ALLOWED166'))return fail('No se puede realizar esta donación.',403);console.error('Profile classic',e);return fail('No se pudo actualizar el perfil.',500);}}
export async function onRequest(context){return withStorageGuard(context,handle);}
