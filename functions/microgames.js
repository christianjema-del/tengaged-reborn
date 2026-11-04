import {duelMatch} from './_shared/duel-service212.js';
import {match as frookiesMatch} from './_shared/frookies-service.js';
import {recordMinigameResult} from './_shared/minigame-scores.js';
import {BASE_CHALLENGE_SECONDS} from './_shared/challenge-time.js';
import {hungerFlash} from './_shared/hunger-flash.js';
import {encode,decode} from './_shared/flash-protocol.js';
import {gameData} from './_shared/flash-data.js';
import {ensureProfileSchema,getSessionUser} from './_shared/auth.js';
import {match} from './_shared/casting-service.js';
import {ensureMinigameTables} from './_shared/minigame-scores.js';
const TYPES={GUITAR:'guitar',WOF:'wheel',NUMBERS:'numbers',DEAL:'deal',MATCH3:'match',MATCHTHREE:'match',ENDURANCE:'endurance',MAZE:'maze',STARFLAKES:'snow',WORDS:'words',LINEBALLS:'line'};
function reply(value,game,status=200){return new Response(encode(value),{status,headers:{'Content-Type':'text/plain;charset=utf-8','Cache-Control':'no-store','X-Tengaged-Bridge':'hunger-numeric-v53','X-Tengaged-Game':game}});}
export async function onRequestGet({request,env}){
 const url=new URL(request.url);let payload;
 try{payload=decode(url.searchParams.get('data'));}catch{return new Response('Invalid request',{status:400});}
 const type=String(payload?.type||'').toUpperCase(),kind=TYPES[type],game=type==='MATCH3'?'MATCHTHREE':type;
 if(!kind)return new Response('Unknown game',{status:400});
 const header=payload.header||{},frookies=header.subcontext==='frookies',active=header.subcontext==='casting'||frookies;
 try{
  if(!['requestGameData','requestSaveGameData'].includes(payload.function))throw Error('Unknown function');
  let code=crypto.randomUUID(),timeleft=BASE_CHALLENGE_SECONDS;
  if(header.subcontext==='duel'){
   if(request.headers.get('Sec-Fetch-Site')==='cross-site'||(request.headers.has('Origin')&&request.headers.get('Origin')!==url.origin))throw Error('Origen no permitido.');
   await ensureProfileSchema(env.DB);const user=await getSessionUser(request,env.DB);if(!user)throw Error('Inicia sesión para jugar.');
   const id=Number(header.contextId),stage=Number(header.subcontextId),saving=payload.function==='requestSaveGameData';
   if(header.context!=='game'||!Number.isSafeInteger(id)||id<1||!Number.isSafeInteger(stage)||stage<1)throw Error('Partida no válida.');
   const result=await duelMatch(env.DB,id,user,{action:saving?'flash_finish':'flash_start',stage,kind,token:header.code,points:payload.data?.points},true,game),run=result.attempt;
   const left=Math.max(0,Math.min(Math.ceil((result.match.deadline-Date.now())/1000),Math.ceil((run.startedAt+run.duration*1000-Date.now())/1000)));
   return reply({error:0,recorded:saving,header:{code:run.token},data:saving?{points:run.score,timeleft:0}:{...result.data,timeleft:left,...(Object.hasOwn(result.data,'gameTotalTimeLeft')?{gameTotalTimeLeft:left}:{})}},game);
  }
  if(header.subcontext==='hunger'){
   if(request.headers.get('Sec-Fetch-Site')==='cross-site'||(request.headers.has('Origin')&&request.headers.get('Origin')!==url.origin))throw Error('Origen no permitido.');
   await ensureProfileSchema(env.DB);const user=await getSessionUser(request,env.DB);if(!user)throw Error('Inicia sesión para jugar.');
   const edition=Number(header.contextId),rawFight=header.subcontextId;
   // SWFs coerce subcontextId to Number. Keep the old composite form for compatibility.
   const fight=Number.isSafeInteger(Number(rawFight))&&Number(rawFight)>0?edition+'-'+Number(rawFight):String(rawFight||'');if(header.context!=='game'||!Number.isSafeInteger(edition)||edition<1||!/^\d+-\d+$/.test(fight))throw Error('Combate no válido.');
   const saving=payload.function==='requestSaveGameData',result=await hungerFlash(env.DB,user,{action:saving?'flash_finish':'flash_start',edition,fight,kind,token:header.code,points:payload.data?.points},game);
   if(saving)await recordMinigameResult(env.DB,user.id,kind,result.run.score,'hunger:'+edition+':'+fight+':'+user.id);
   code=result.run.token;timeleft=Math.max(0,Math.min(Math.ceil((result.endsAt-Date.now())/1000),Math.ceil((result.run.startedAt+result.run.duration*1000-Date.now())/1000)));
   return reply({error:0,recorded:saving,header:{code},data:saving?{points:result.run.score,timeleft:0}:{...result.data,timeleft,...(Object.hasOwn(result.data,'gameTotalTimeLeft')?{gameTotalTimeLeft:timeleft}:{})}},game);
  }
  if(active){
   if(request.headers.get('Sec-Fetch-Site')==='cross-site'||(request.headers.has('Origin')&&request.headers.get('Origin')!==url.origin))throw Error('Origen no permitido.');
   await ensureProfileSchema(env.DB);const user=await getSessionUser(request,env.DB);
   if(!user)throw Error('Inicia sesión para jugar.');
   const id=Number(header.contextId),round=Number(header.subcontextId);
   if(header.context!=='game'||!Number.isSafeInteger(id)||id<1||!Number.isSafeInteger(round)||round<1)throw Error('Partida no válida.');
   const saving=payload.function==='requestSaveGameData';
   const input=saving?{action:'flash_finish',kind,round,phase:frookies?'nominations':undefined,token:header.code,points:payload.data?.points}:{action:'flash_start',kind,round,phase:frookies?'nominations':undefined};
   const result=await (frookies?frookiesMatch:match)(env.DB,id,user,input,true),attempt=result.attempt;
   code=attempt.token;
   timeleft=Math.max(0,Math.min(Math.ceil(((frookies?result.match.challengeDeadline:result.match.deadline)-Date.now())/1000),Math.ceil((attempt.startedAt+attempt.duration*1000-Date.now())/1000)));
   if(saving){if(!frookies)await recordMinigameResult(env.DB,user.id,kind,(frookies?result.match.me.score:result.match.me.challengePoints),(frookies?'frookies:':'casting:')+id+(frookies&&result.match.runId!=='initial'?':run:'+result.match.runId:'')+':'+round+':'+user.id+':'+kind+(result.match.challengeResetAt?':reset:'+result.match.challengeResetAt:''));return reply({error:0,recorded:true,header:{code},data:{points:(frookies?result.match.me.score:result.match.me.challengePoints),timeleft:0}},game);}
  }else if(header.subcontext==='minigame'){
   if(request.headers.get('Sec-Fetch-Site')==='cross-site'||(request.headers.has('Origin')&&request.headers.get('Origin')!==url.origin))throw Error('Origen no permitido.');
   if(header.context!=='game'||Number(header.contextId)!==0||String(header.subcontextId)!=='0')throw Error('Contexto inválido.');
   await ensureProfileSchema(env.DB);const user=await getSessionUser(request,env.DB);
   if(!user)throw Error('Inicia sesión para competir.');
   await ensureMinigameTables(env.DB);
   if(payload.function==='requestGameData'){
    code=crypto.randomUUID();
    await env.DB.prepare('INSERT INTO minigame_attempts(token,user_id,kind) VALUES(?,?,?)').bind(code,user.id,kind).run();
   }else{
    const score=payload.data?.points,token=String(header.code||'');
    if(typeof score!=='number'||!Number.isSafeInteger(score)||score<0||score>1000000||!/^[0-9a-f-]{36}$/i.test(token))throw Error('Resultado inválido.');
    // Each attempt can be saved once, and only by the signed-in user who started it.
    const attempt=await env.DB.prepare(`UPDATE minigame_attempts SET completed_at=CURRENT_TIMESTAMP WHERE token=? AND user_id=? AND kind=? AND completed_at IS NULL AND started_at>=datetime('now','-30 minutes') RETURNING token`).bind(token,user.id,kind).first();
    if(!attempt)throw Error('Intento ya registrado o vencido.');
    await env.DB.prepare(`INSERT INTO minigame_scores(user_id,kind,best_score,plays) VALUES(?,?,?,1) ON CONFLICT(user_id,kind) DO UPDATE SET best_score=MAX(best_score,excluded.best_score),plays=plays+1,updated_at=CASE WHEN excluded.best_score>best_score THEN CURRENT_TIMESTAMP ELSE updated_at END`).bind(user.id,kind,score).run();
    return reply({error:0,recorded:true,header:{code:token},data:{points:score,timeleft:0}},game);
   }
  }else if(payload.function==='requestSaveGameData'){
   // Finished-casting demos remain isolated from live scores and rewards.
   return reply({error:0,recorded:false,header:{code},data:{points:0,timeleft:0}},game);
  }
  return reply({error:0,header:{code},data:gameData(game,timeleft)},game);
 }catch(error){return reply({error:1,message:error.message||'No se pudo guardar la prueba.'},game,400);}
}
