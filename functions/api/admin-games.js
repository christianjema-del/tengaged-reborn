// V317: lista de partidas en curso para el panel de administración (solo lectura).
import {withStorageGuard} from '../_shared/storage-guard141.js';
import {getSessionUser,jsonError} from '../_shared/auth.js';
import {isStaff} from '../_shared/staff.js';
const GAMES=[
 {type:'casting',name:'Casting',table:'casting_matches',href:id=>'/casting-game.html?id='+id},
 {type:'survivor',name:'Survivor',table:'survivor_matches',href:id=>'/survivor.html?id='+id},
 {type:'frookies',name:'Frookies',table:'frookies_matches',href:id=>'/frookies.html?id='+id},
 {type:'rookies',name:'Rookies',table:'rookies_matches',href:id=>'/rookies.html?id='+id},
 {type:'duel',name:'El Duelo',table:'duel_matches',href:id=>'/duel.html?id='+id}
];
const PHASES={waiting:'Inscripción',day:'En juego',active:'En juego',immunity:'Inmunidad',elimination:'Eliminación',nominations:'Nominaciones',veto:'Veto',replacement:'Reemplazo',vote:'Votación',tiebreak:'Desempate',final_places:'Final',jury:'Jurado',warmup:'Preparación',finished:'Terminada'};
export function summarize(game,id,s){
 const players=Array.isArray(s.players)?s.players:[];
 const alive=game.type==='hunger'?players.filter(p=>Number(p.health)>0&&!p.placement):players.filter(p=>!p.status||p.status==='active');
 const day=s.round??s.day??s.stage??null;
 return {type:game.type,game:game.name,id,phase:s.phase||'—',phaseName:PHASES[s.phase]||s.phase||'—',day:Number.isFinite(Number(day))&&Number(day)>0?Number(day):null,players:players.filter(p=>!p.bot).length,bots:players.filter(p=>p.bot).length,alive:alive.length,paused:!!(s.paused||s.manualPause160||s.pause180),href:game.href(id)};
}
async function handle({request,env}){try{
 if(request.method!=='GET')return jsonError('Método no permitido.',405);
 const db=env.DB,actor=await getSessionUser(request,db);if(!isStaff(actor))return jsonError('No tienes permisos para ver las partidas.',403);
 const tables=new Set((await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(r=>r.name)),games=[];
 for(const g of GAMES){if(!tables.has(g.table))continue;const rows=(await db.prepare(`SELECT id,state FROM ${g.table} WHERE json_extract(state,'$.phase')<>'finished' ORDER BY id DESC LIMIT 25`).all()).results;for(const r of rows){try{games.push(summarize(g,r.id,JSON.parse(r.state)));}catch{}}}
 if(tables.has('hunger_arena')){const r=await db.prepare('SELECT state FROM hunger_arena WHERE id=1').first();if(r){try{const s=JSON.parse(r.state);if(s.phase!=='finished')games.push(summarize({type:'hunger',name:'Hunger Games',href:()=>'/hunger.html'},s.edition,s));}catch{}}}
 return Response.json({ok:true,games},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('Admin games',e);return jsonError('No se pudieron cargar las partidas.',500);}}
export async function onRequest(context){return withStorageGuard(context,handle);}
