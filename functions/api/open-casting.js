import {withStorageGuard} from '../_shared/storage-guard141.js';
import {ensureCastingSchema,listCastingPlayers} from '../_shared/casting.js';
async function handle141_onRequestGet({env}){
 try{await ensureCastingSchema(env.DB);const [players,room]=await Promise.all([listCastingPlayers(env.DB),env.DB.prepare('SELECT status FROM casting_rooms WHERE casting_id=1').first()]);let state=null;try{state=await env.DB.prepare('SELECT status FROM game_state WHERE casting_id=1').first();}catch(e){if(!/no such table/i.test(String(e.message||e)))throw e;}return Response.json({ok:true,players,maxPlayers:16,phase:state?.status==='finished'?'finished':room?.status==='started'?'active':players.length>=16?'full':'open'},{headers:{'Cache-Control':'no-store'}});}catch(e){console.error('Open casting',e);return Response.json({ok:false,message:'No se pudo consultar el Casting.'},{status:500});}
}

export async function onRequestGet(context){return withStorageGuard(context,handle141_onRequestGet);}
