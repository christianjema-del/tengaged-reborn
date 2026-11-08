import {withStorageGuard} from '../_shared/storage-guard141.js';
// V299: lista las partidas en curso para que el Worker programado (tick-worker/) las visite cada minuto.
// Cada visita es la misma petición anónima que hace la página del juego, así que el juego avanza
// con sus propias reglas aunque ningún usuario tenga la página abierta.
const GAMES=[['casting_matches','/api/castings?id='],['frookies_matches','/api/frookies?id='],['duel_matches','/api/duel?id='],['rookies_matches','/api/rookies?id=']];
export async function tickTargets(db){
 const names=new Set((await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('casting_matches','frookies_matches','duel_matches','rookies_matches','hunger_arena','design_auctions')").all()).results.map(r=>r.name));
 const targets=[];
 for(const [table,path] of GAMES){if(!names.has(table))continue;
  const rows=(await db.prepare(`SELECT id FROM ${table} WHERE json_extract(state,'$.phase')<>'finished' ORDER BY id LIMIT 40`).all()).results;
  for(const row of rows)targets.push(path+row.id);}
 if(names.has('hunger_arena')&&await db.prepare('SELECT 1 AS x FROM hunger_arena WHERE id=1').first())targets.push('/api/hunger');
 if(names.has('design_auctions')&&await db.prepare("SELECT 1 AS x FROM design_auctions WHERE status='open' LIMIT 1").first())targets.push('/api/auctions');
 return targets;
}
async function handle({env}){try{return Response.json({ok:true,targets:await tickTargets(env.DB)},{headers:{'Cache-Control':'no-store'}});}catch(e){console.error('Tick',e);return Response.json({ok:false,targets:[]},{status:500,headers:{'Cache-Control':'no-store'}});}}
export async function onRequestGet(context){return withStorageGuard(context,handle);}
