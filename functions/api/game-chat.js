import {ensureDuel} from '../_shared/duel-service212.js';
import {ensureRookies} from '../_shared/rookies-service.js';
import {ensureSurvivor} from '../_shared/survivor-service.js';
import {publicEvents166} from '../_shared/public-game-events166.js';
import {isOwner} from '../_shared/staff.js';
import {withStorageGuard} from '../_shared/storage-guard141.js';
import {ensure as ensureFrookies} from '../_shared/frookies-service.js';
import {isHungerAlive} from '../_shared/hunger-life.js';
import {match as castingMatch} from '../_shared/casting-service.js';
import {describeHungerEvent} from '../_shared/hunger-events.js';
import {ensureProfileSchema,getSessionUser,jsonError} from '../_shared/auth.js';
import {ensureSocial,sameOrigin} from '../_shared/social.js';
async function handle141_onRequest({request,env}){try{
 const db=env.DB;await ensureProfileSchema(db);await ensureSocial(db);const me=await getSessionUser(request,db),url=new URL(request.url),type=url.searchParams.get('type');let id=Number(url.searchParams.get('id'));const currentArena=type==='hunger'&&url.searchParams.get('id')==='current';
 if(!['casting','hunger','frookies','duel','rookies','survivor'].includes(type)||(!currentArena&&(!Number.isSafeInteger(id)||id<1)))return jsonError('Partida inválida.',400);
 if(type==='frookies')await ensureFrookies(db);if(type==='duel')await ensureDuel(db);if(type==='rookies')await ensureRookies(db);if(type==='survivor')await ensureSurvivor(db);
 const table=type==='survivor'?'survivor_matches':type==='rookies'?'rookies_matches':type==='duel'?'duel_matches':type==='frookies'?'frookies_matches':type==='casting'?'casting_matches':'hunger_arena';
 const row=await db.prepare(`SELECT state FROM ${table} WHERE id=?`).bind(type!=='hunger'?id:1).first();if(!row)return jsonError('No existe esa partida.',404);
 let state=JSON.parse(row.state),archived=false;if(currentArena)id=Number(state.edition);if(type==='hunger'&&state.edition!==id){
 const has=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='hunger_history'").first();const old=has?await db.prepare('SELECT state FROM hunger_history WHERE edition=?').bind(id).first():null;
 if(!old)return jsonError('Esta edición ya ha terminado. Actualiza la arena.',409);state=JSON.parse(old.state);archived=true;
 }
 const voteCutoff=type==='casting'?Math.max(Number(state.chatVoteCutoffAt||0),...(state.keyDrops||[]).filter(d=>d.claimedBy).map(d=>Number(d.at||0))):0;const messageAt=m=>m.at??Date.parse(String(m.created_at).replace(' ','T')+(String(m.created_at).endsWith('Z')?'':'Z'));
 const member=me&&state.players.find(p=>!p.bot&&(Number(p.id)>0&&Number(p.id)===Number(me.id)||String(p.username||'').trim().toLowerCase()===me.username.trim().toLowerCase()));
 const eliminated=!!member&&(type!=='hunger'?member.status==='eliminated':!isHungerAlive(member));
 const participantCanWrite=!!member&&!eliminated&&!archived&&!(type!=='hunger'&&state.phase==='finished'),adminCanWrite=isOwner(me),canWrite=adminCanWrite||participantCanWrite,room=type+':'+id;
 if(request.method==='POST'){
 if(!sameOrigin(request))return jsonError('Origen no permitido.',403);if(!me)return jsonError('Inicia sesión.',401);if(!canWrite)return jsonError(eliminated?'Has sido eliminado: puedes leer el chat, pero no escribir.':'Solo los participantes pueden escribir en esta partida.',403);
 const input=await request.json().catch(()=>null);if(!input||typeof input!=='object'||Array.isArray(input))return jsonError('Petición inválida.',400);
 if(input.action==='vote'){
 if(type==='duel')return jsonError('El Duelo no utiliza votos positivos ni negativos.',400);
 if(!participantCanWrite)return jsonError('Solo los participantes activos pueden votar comentarios.',403);
 const welcome=typeof input.message_id==='string'&&/^welcome:\d+:\d+$/.test(input.message_id)?input.message_id.split(':'):null;
 const messageId=welcome?type+':'+input.message_id:Number(input.message_id),value=input.value;
 if((!welcome&&(!Number.isSafeInteger(messageId)||messageId<1))||![-1,1].includes(value))return jsonError('Voto no válido.',400);
 const target=welcome?(Number(welcome[1])===id?(state.welcomes||[])[Number(welcome[2])]:null):await db.prepare('SELECT c.user_id,c.created_at,u.username,u.is_admin FROM game_chat c JOIN users u ON u.id=c.user_id WHERE c.id=? AND c.room=?').bind(messageId,room).first();
 if(!target)return jsonError('Comentario no encontrado en esta partida.',404);
 if(isOwner(target))return jsonError('Los avisos de administración no admiten votos.',403);
 if(voteCutoff&&messageAt(target)<=voteCutoff)return jsonError('Este comentario es anterior al último objeto recogido y ya no admite votos.',403);
 if(target.user_id===me.id||target.username?.toLowerCase()===me.username.toLowerCase())return jsonError('No puedes votar tu propio comentario.',400);
 const inserted=await db.prepare('INSERT OR IGNORE INTO game_chat_votes(message_id,user_id,value) VALUES(?,?,?)').bind(messageId,me.id,value).run();
 const recorded=await db.prepare('SELECT value FROM game_chat_votes WHERE message_id=? AND user_id=?').bind(messageId,me.id).first();
 if(recorded?.value!==value)return jsonError('Ya has votado este comentario. El voto no se puede cambiar ni retirar.',409);
 if(inserted.meta.changes&&type==='casting'&&state.rulesVersion>=78)await castingMatch(db,id,me);
 }else{
 if(input.action&&input.action!=='comment')return jsonError('Acción no válida.',400);
 const body=String(input.message||'').trim();if(!body||body.length>500)return jsonError('Escribe entre 1 y 500 caracteres.',400);
 const result=await db.prepare(`INSERT INTO game_chat(room,user_id,body,created_at) SELECT ?,?,?,strftime('%Y-%m-%d %H:%M:%f','now') WHERE NOT EXISTS(SELECT 1 FROM game_chat WHERE user_id=? AND created_at>=datetime('now','-3 seconds')) AND EXISTS(SELECT 1 FROM ${table} WHERE id=? AND state=?)`).bind(room,me.id,body,me.id,type!=='hunger'?id:1,row.state).run();if(!result.meta.changes){const current=await db.prepare(`SELECT state FROM ${table} WHERE id=?`).bind(type!=='hunger'?id:1).first();if(current?.state!==row.state)return jsonError('La partida ha cambiado. Vuelve a enviar el mensaje.',409);return jsonError('Espera 3 segundos entre mensajes.',429);}
 if(participantCanWrite&&type==='casting'&&state.rulesVersion>=78&&!['waiting','finished'].includes(state.phase))await castingMatch(db,id,me,{action:'activity'});
 }
 }else if(request.method!=='GET')return jsonError('Método no permitido.',405);
 const commentTotal=Number((await db.prepare(`SELECT t.total-COALESCE((SELECT COUNT(*) FROM users u JOIN game_chat c ON c.user_id=u.id AND c.room=t.room WHERE u.is_banned=1),0) AS n FROM game_chat_totals141 t WHERE room=?`).bind(room).first())?.n||0);
 // Los eventos de recompensa son efímeros: desaparecen para TODOS en cuanto
 // el servidor confirma la reclamación o vence su plazo de disponibilidad.
 const now=Date.now();
 const arenaEvents=type==='hunger'?(state.events||[]).filter(e=>{
  if(e.kind==='enter'||/ entra en (?:la arena|la Cornucopia)\.$/.test(e.text||''))return false;
  if(['fight','fight-update','weapon','bonus-result','bush','forest-reset'].includes(e.kind)||/ guarda su puntuación\.$/.test(e.text||''))return false;
  if(/^(Un tributo desconocido registra los arbustos\.|El bosque se renueva\. Puedes volver a buscar en un arbusto\.)$/.test(e.text||''))return false;
  if(!['arrow','challenge','death','collect','bonus'].includes(e.kind))return false;
  if(e.kind!=='bonus')return true;
  const bonus=(state.bonuses||[]).find(b=>b.id===e.bonusId);
  return !!bonus&&bonus.claimedBy==null&&Number(bonus.expiresAt)>now&&state.phase==='active'&&!archived;
 }).map((e,i)=>({canClaim:e.kind==='bonus'&&!!member&&(state.rulesVersion<77||!Number.isInteger(state.rulesVersion)||member.arrows<15)&&isHungerAlive(member)&&!archived&&state.phase==='active',id:'event:'+id+':'+e.at+':'+i,body:e.text,created_at:new Date(e.at).toISOString(),username:null,kind:'event',...describeHungerEvent(e,state)})):[];
 const chainHistory221=(state.history||[]).filter(h=>h.phase==='immunity'&&h.route);let chainIndex221=0;
 const froEvents=['frookies','duel','rookies'].includes(type)?(state.events||[]).map(original=>{let e=original;if(type==='duel'&&(/ inicia la cadena de salvación\./.test(e.text||'')||/ gana la inmunidad\. Nominados:/.test(e.text||''))){const h=chainHistory221[chainIndex221++];if(h){const name=id=>state.players.find(p=>p.id===id)?.username||'—';const next=(state.history||[]).find(x=>x.phase==='duel'&&x.stage===h.stage+1);const noms=h.nominees||next?.scores?.map(p=>p.id)||(h===chainHistory221.at(-1)?state.nominees:[])||[];e={...e,kind:'duel-chain',chain:h.route.map(x=>({from:name(x.from),to:name(x.to)})),nominees:noms.map(name)};}}return ({id:'fro-event:'+e.id,body:e.text,created_at:new Date(e.at).toISOString(),username:null,kind:'event',event:{...e,kind:type==='duel'?(['duel-results','duel-chain'].includes(e.kind)?e.kind:'casting-notice'):type==='rookies'?(e.kind==='rookies-results'?e.kind:'casting-notice'):e.kind||'frookies'}});}).filter(m=>type!=='duel'||m.event.kind!=='casting-notice') :[];
 const castingDrops=type==='casting'&&!['waiting','finished'].includes(state.phase)?(state.keyDrops||[]).filter(x=>!x.claimedBy&&x.expiresAt>now).map(x=>({id:'casting-key:'+x.id,body:x.kind==='apple'?'Big Brother ha dejado una manzana. Recupera 15 de salud.':'Big Brother ha dejado una llave. El primer participante activo que la recoja obtiene una llave.',created_at:new Date(x.at).toISOString(),username:'Big Brother',kind:'event',canClaim:!!member&&!eliminated,event:{kind:'casting-key',dropId:x.id,position:x.position,resource:x.kind||'key',claimedSlots:Object.keys(x.poisonClaims||{}).map(Number),expiresAt:x.expiresAt}})):[];
 const nominationNotice=type==='casting'&&state.rulesVersion>=78&&state.phase!=='finished'&&state.round>=2&&state.nominees?.length?[{id:'casting-nominations:'+id+':'+state.round,body:'Nominaciones del día '+state.round,created_at:new Date(state.dayStartedAt||state.createdAt).toISOString(),username:null,kind:'event',event:{kind:'casting-nominations',round:state.round,nominees:state.nominees}}]:[];
 const completionNotice=type==='casting'&&state.phase==='finished'?[{id:'casting-completed:'+id,created_at:new Date(state.finishedAt||state.createdAt).toISOString(),body:'Casting finalizado.',kind:'event',event:{kind:'casting-finished',placements:state.players.filter(p=>p.placement>=1&&p.placement<=5).sort((a,b)=>a.placement-b.placement).map(p=>({username:p.username,placement:p.placement,bot:!!p.bot}))}}]:[];
 const welcomeVotes=(state.welcomes||[]).length?(await db.prepare('SELECT message_id,SUM(value) AS score,MAX(CASE WHEN user_id=? THEN value ELSE NULL END) AS my_vote FROM game_chat_votes WHERE message_id LIKE ? GROUP BY message_id').bind(me?.id||-1,type+':welcome:'+id+':%').all()).results:[];
 const welcomes=(state.welcomes||[]).map((w,i)=>{const reaction=welcomeVotes.find(v=>v.message_id===type+':welcome:'+id+':'+i);return {id:'welcome:'+id+':'+i,body:w.body,username:w.username,created_at:new Date(w.at).toISOString(),score:Number(reaction?.score||0),my_vote:Number(reaction?.my_vote||0),is_owner:w.username.toLowerCase()===me?.username.toLowerCase()};});

 const castingNotices=type==='casting'?publicEvents166(state,'casting').filter(m=>!/nominad|final del/i.test(m.body)).map(m=>({...m,event:{kind:'casting-notice'}})):[];
 const total=commentTotal+castingNotices.length+froEvents.length+arenaEvents.length+welcomes.length+castingDrops.length+nominationNotice.length+completionNotice.length;
 const requestedPage=request.method==='POST'&&url.searchParams.get('page')===null?1:Math.max(1,Math.min(100000,Math.floor(Number(url.searchParams.get('page'))||1)));
 const page=Math.min(requestedPage,Math.max(1,Math.ceil(total/20)));
 let messages=(await db.prepare(`SELECT c.id,c.body,c.created_at,u.username,c.user_id,CASE WHEN lower(u.username)='admin1' AND u.is_admin=1 THEN 1 ELSE 0 END AS admin_notice,COALESCE((SELECT SUM(v.value) FROM game_chat_votes v WHERE v.message_id=c.id),0) AS score,COALESCE((SELECT v.value FROM game_chat_votes v WHERE v.message_id=c.id AND v.user_id=${me?.id||-1}),0) AS my_vote FROM game_chat c JOIN users u ON u.id=c.user_id WHERE c.room=? AND u.is_banned=0 ORDER BY c.id DESC LIMIT ? OFFSET ?`).bind(room,type==='hunger'||castingNotices.length||froEvents.length||welcomes.length||castingDrops.length||nominationNotice.length||completionNotice.length?page*20:20,type==='hunger'||castingNotices.length||froEvents.length||welcomes.length||castingDrops.length||nominationNotice.length||completionNotice.length?0:(page-1)*20).all()).results;
 if(type==='hunger'||castingNotices.length||froEvents.length||welcomes.length||castingDrops.length||nominationNotice.length||completionNotice.length)messages=[...messages,...castingNotices,...arenaEvents,...froEvents,...welcomes,...castingDrops,...nominationNotice,...completionNotice].sort((a,b)=>Date.parse(b.created_at.replace(' ','T')+(b.created_at.endsWith('Z')?'':'Z'))-Date.parse(a.created_at.replace(' ','T')+(a.created_at.endsWith('Z')?'':'Z'))||String(b.id).localeCompare(String(a.id))).slice((page-1)*20,page*20);
 messages=messages.map(m=>({...m,canVote:participantCanWrite&&!m.admin_notice&&!m.my_vote&&!(voteCutoff&&messageAt(m)<=voteCutoff)}));
 return Response.json({ok:true,roomId:id,total,page,messages,finished:state.phase==='finished',canVote:participantCanWrite&&type!=='duel',viewerId:me?.id||null,canWrite,eliminated,loggedIn:!!me},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error(e);return jsonError('No se pudo actualizar el chat.',500);}}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
