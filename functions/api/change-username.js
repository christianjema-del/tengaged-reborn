import {withStorageGuard} from '../_shared/storage-guard141.js';
import {getSessionUser} from '../_shared/auth.js';
import {USERNAME_PRICE,checkNewName,renameBlocked,existingTables,nameTaken,renameStatements,ensureUsernameChanges} from '../_shared/username-change296.js';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const fail=(message,status=400)=>json({ok:false,message},status);
async function handle({request,env}){try{
 const db=env.DB,me=await getSessionUser(request,db);if(!me)return fail('Inicia sesión para cambiar tu nombre.',401);
 const user=await db.prepare('SELECT id,username,COALESCE(t_money,0) AS money,COALESCE(is_system,0) AS is_system,COALESCE(is_test_bot,0) AS is_test_bot,COALESCE(is_banned,0) AS is_banned FROM users WHERE id=?').bind(me.id).first();
 const blocked=renameBlocked(user);
 if(request.method==='GET')return json({ok:true,username:user.username,money:Number(user.money)||0,price:USERNAME_PRICE,allowed:!blocked,reason:blocked});
 if(request.method!=='POST')return fail('Método no permitido.',405);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return fail('Origen no permitido.',403);
 if(blocked)return fail(blocked,403);
 const body=await request.json().catch(()=>({})),newName=checkNewName(body.username);
 if(newName===user.username)return fail('Ese ya es tu nombre de usuario.');
 if((Number(user.money)||0)<USERNAME_PRICE)return fail(`Necesitas ${USERNAME_PRICE} T$ para cambiar tu nombre.`,402);
 await ensureUsernameChanges(db);const tables=await existingTables(db);
 if(await nameTaken(db,tables,user.id,user.username,newName))return fail('Ese nombre ya está en uso. Elige otro.',409);
 const results=await db.batch(renameStatements(db,tables,{userId:user.id,oldName:user.username,newName}));
 if(!Number(results[0]?.meta?.changes))return fail('No se pudo cambiar el nombre: revisa tu saldo o prueba con otro nombre.',409);
 const after=await db.prepare('SELECT username,COALESCE(t_money,0) AS money FROM users WHERE id=?').bind(user.id).first();
 return json({ok:true,message:`Tu nombre ahora es ${after.username}. Se han descontado ${USERNAME_PRICE} T$.`,username:after.username,money:Number(after.money)||0,price:USERNAME_PRICE});
}catch(e){console.error('Change username',e);return fail(e.message||'No se pudo cambiar el nombre.');}}
export async function onRequest(context){return withStorageGuard(context,handle);}
