import {ensureCommunitySchema} from '../_shared/community.js';
import {withStorageGuard} from '../_shared/storage-guard141.js';
import {recordReferral} from '../_shared/referrals.js';
import {ensureSystemAccount,SYSTEM_NAME} from '../_shared/system-account.js';
async function handle141_onRequestPost({request,env}){try{
 const b=await request.json().catch(()=>({})),u=String(b.username||'').trim(),e=String(b.email||'').trim().toLowerCase(),p=String(b.password||'');
 const error=(message,status)=>Response.json({ok:false,error:message,message},{status});
 if(request.headers.get('Origin')!==new URL(request.url).origin)return error('Origen no permitido.',403);
 if(!/^[A-Za-z0-9_]{3,24}$/.test(u)||!e.includes('@')||p.length<8)return error('Usuario, email o contraseña inválidos.',400);
 if(u.toLowerCase()===SYSTEM_NAME.toLowerCase())return error('Tengaged es el nombre reservado de la cuenta oficial de avisos.',409);
 await ensureSystemAccount(env.DB);
 const existing=await env.DB.prepare('SELECT id FROM users WHERE username=? COLLATE NOCASE OR email=? COLLATE NOCASE').bind(u,e).first();
 if(existing)return error('Usuario o email ya existe.',409);
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(p)),hex=[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
 await ensureCommunitySchema(env.DB);
 const created=await env.DB.batch([env.DB.prepare('INSERT INTO users(username,email,password_hash) VALUES(?,?,?)').bind(u,e,hex),env.DB.prepare("INSERT INTO user_inventory(user_id,item_code,is_equipped) SELECT id,'color-card-white',1 FROM users WHERE username=? COLLATE NOCASE").bind(u)]);
 const result=created[0];
 if(b.referral)try{await recordReferral(env.DB,Number(result.meta.last_row_id),b.referral);}catch(error){console.error('Registration referral',error);}
 return Response.json({ok:true,id:result.meta.last_row_id,username:u});
 }catch(e){console.error('Register',e);return Response.json({ok:false,error:'No se pudo crear la cuenta.',message:'No se pudo crear la cuenta.'},{status:500});}}

export async function onRequestPost(context){return withStorageGuard(context,handle141_onRequestPost);}
