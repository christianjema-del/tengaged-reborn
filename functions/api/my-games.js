import {withStorageGuard} from '../_shared/storage-guard141.js';
import {getSessionUser,jsonError} from '../_shared/auth.js';
import {isHungerAlive} from '../_shared/hunger-life.js';
async function handle141_onRequest({request,env}){
 if(request.method!=='GET')return jsonError('Método no permitido.',405);
 if(!env.DB)return jsonError('Base de datos no disponible.',503);
 try{const db=env.DB,user=await getSessionUser(request,db);if(!user)return jsonError('Inicia sesión.',401);
 const tables=(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('casting_matches','hunger_arena','frookies_matches','duel_matches','rookies_matches','survivor_matches')").all()).results.map(t=>t.name),games=[];
 if(tables.includes('casting_matches')){const rows=(await db.prepare("SELECT id,state FROM casting_matches c WHERE json_extract(c.state,'$.phase')<>'finished' AND EXISTS(SELECT 1 FROM json_each(c.state,'$.players') p WHERE lower(json_extract(p.value,'$.username'))=lower(?)) ORDER BY id DESC LIMIT 8").bind(user.username).all()).results;for(const row of rows){const s=JSON.parse(row.state),p=s.players.find(p=>p.username.toLowerCase()===user.username.toLowerCase());if(p&&p.status!=='eliminated')games.push({type:'casting',id:row.id,label:'casting #'+row.id,href:'/casting-game.html?id='+row.id});}}
 if(tables.includes('frookies_matches')){const rows=(await db.prepare("SELECT id,state FROM frookies_matches WHERE json_extract(state,'$.phase')<>'finished' ORDER BY id DESC LIMIT 30").all()).results;for(const row of rows){const s=JSON.parse(row.state),p=s.players.find(p=>p.username.toLowerCase()===user.username.toLowerCase());if(p&&(p.status==='active'||(s.phase==='jury'&&p.placement>=3&&p.placement<=9)))games.push({type:'frookies',id:row.id,label:'frookies #'+row.id,href:'/frookies.html?id='+row.id});}}
 if(tables.includes('duel_matches')){const rows=(await db.prepare("SELECT id,state FROM duel_matches WHERE json_extract(state,'$.phase')<>'finished' ORDER BY id DESC LIMIT 30").all()).results;for(const row of rows){const s=JSON.parse(row.state),p=s.players.find(p=>p.id===user.id);if(p?.status==='active')games.push({type:'duel',id:row.id,label:'El Duelo #'+row.id,href:'/duel.html?id='+row.id});}}
 if(tables.includes('rookies_matches')){const rows=(await db.prepare("SELECT id,state FROM rookies_matches WHERE json_extract(state,'$.phase')<>'finished' ORDER BY id DESC LIMIT 30").all()).results;for(const row of rows){const s=JSON.parse(row.state),p=s.players.find(p=>p.id===user.id);if(p?.status==='active')games.push({type:'rookies',id:row.id,label:'Rookies #'+row.id,href:'/rookies.html?id='+row.id});}}
 if(tables.includes('survivor_matches')){const rows=(await db.prepare("SELECT id,state FROM survivor_matches WHERE json_extract(state,'$.phase')<>'finished' ORDER BY id DESC LIMIT 30").all()).results;for(const row of rows){const s=JSON.parse(row.state),p=s.players.find(p=>Number(p.id)===Number(user.id));if(p?.status==='active')games.push({type:'survivor',id:row.id,label:'Survivor #'+row.id,href:'/survivor.html?id='+row.id});}}
 if(tables.includes('hunger_arena')){const row=await db.prepare('SELECT state FROM hunger_arena WHERE id=1').first();if(row){const s=JSON.parse(row.state),p=s.players.find(p=>p.username.toLowerCase()===user.username.toLowerCase());if(s.phase!=='finished'&&p&&isHungerAlive(p))games.push({type:'hunger',id:s.edition,label:'hunger #'+s.edition,href:'/hunger.html'});}}
 return Response.json({ok:true,games},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){console.error('My games',e);return jsonError('No se pudieron consultar tus partidas.',500);}
}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
