import {withStorageGuard} from '../_shared/storage-guard141.js';
import {claimDailyReward} from '../_shared/daily-rewards.js';
import {expireModeration} from '../_shared/moderation.js';
import { ensureProfileSchema, ADMIN_USERNAME } from "../_shared/auth.js";
import {ensurePasswordReset} from '../_shared/password-reset.js';

async function handle141_onRequestPost({ request, env, waitUntil }) {
  const body = await request.json().catch(() => ({}));
  const username = String(body.username || '').trim(); const password = String(body.password || '');
  await ensureProfileSchema(env.DB);await ensurePasswordReset(env.DB);await expireModeration(env.DB);
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  const hex = [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
  const u = await env.DB.prepare('SELECT id,username,karma,is_admin,is_moderator,is_banned,is_system,t_money FROM users WHERE username=? AND password_hash=?').bind(username,hex).first();
  if(u?.is_system)return Response.json({error:'La cuenta Tengaged es automática y no permite iniciar sesión.'},{status:403});
  if (!u) return Response.json({error:'Usuario o contraseña incorrectos'}, {status:401});
  if (u.is_banned) return Response.json({error:'Esta cuenta está suspendida. Contacta con administración.'}, {status:403});
  const reset=await env.DB.prepare('SELECT must_change_password,temporary_password_until FROM users WHERE id=?').bind(u.id).first();
  if(reset?.must_change_password&&!(Date.parse(reset.temporary_password_until)>Date.now()))return Response.json({error:'Tu contraseña temporal ha caducado. Pide a administración una nueva.'},{status:403});
  u.must_change_password=!!reset?.must_change_password;
  // Bootstrap the named owner account only after its existing password has
  // been verified. The browser can never grant itself administrator access.
  if (u.username.toLowerCase() === ADMIN_USERNAME) {
    await env.DB.prepare('UPDATE users SET is_admin=1 WHERE id=?').bind(u.id).run();
    u.is_admin = 1;
  }
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = [...tokenBytes].map(b=>b.toString(16).padStart(2,'0')).join('');
  const th = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const thx=[...new Uint8Array(th)].map(b=>b.toString(16).padStart(2,'0')).join('');
  const exp = '9999-12-31T23:59:59.999Z';
  await env.DB.prepare('INSERT INTO sessions(user_id,token_hash,expires_at) VALUES(?,?,?)').bind(u.id,thx,exp).run();
  if(waitUntil)waitUntil(claimDailyReward(env.DB,u).catch(error=>console.error('Login daily reward',error)));
  return new Response(JSON.stringify({ok:true,user:u}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':`session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=34560000`}});
}

export async function onRequestPost(context){return withStorageGuard(context,handle141_onRequestPost);}
