import {withStorageGuard} from '../_shared/storage-guard141.js';
import {jsonError} from '../_shared/auth.js';
import {ensureHunger} from './hunger.js';
import {hungerSponsorWinners233} from '../_shared/hunger-sponsors233.js';
async function handle({env}){try{await ensureHunger(env.DB);return Response.json({ok:true,winners:await hungerSponsorWinners233(env.DB)},{headers:{'Cache-Control':'no-store'}});}catch(e){console.error('Hunger sponsors',e);return jsonError('No se pudieron cargar los últimos ganadores.',500);}}
export async function onRequestGet(context){return withStorageGuard(context,handle);}
