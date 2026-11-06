import {withStorageGuard} from '../_shared/storage-guard141.js';
import { getSessionUser, jsonError } from "../_shared/auth.js";
import {recordIp} from '../_shared/user-ips.js';

async function handle141_onRequestGet({ request, env, waitUntil }) {
  // Existing D1 deployment already has the account columns. Avoid seven ALTER requests
  // on every page load. Migrations remain available from registration and admin flows.
  if (!env.DB) return jsonError("Base de datos no vinculada.",503);
  // Authentication must not wait for notification migrations or catalog seeding.
  // Registration, mail and gifts prepare their own automatic notification account.
  const user = await getSessionUser(request, env.DB);
  if (!user) return jsonError("Inicia sesión para continuar.", 401);
  const track=recordIp(env.DB,request,env,user.id);if(waitUntil)waitUntil(track);else await track;
  const account=await env.DB.prepare('SELECT karma,t_money FROM users WHERE id=?').bind(user.id).first();
  return Response.json({ok:true,user:{...user,karma:Number(account?.karma)||0,t_money:Number(account?.t_money)||0}}, {headers:{'Cache-Control':'no-store'}});
}

export async function onRequestGet(context){return withStorageGuard(context,handle141_onRequestGet);}
