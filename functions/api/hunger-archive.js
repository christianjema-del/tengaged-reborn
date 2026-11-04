import {addHungerFive188} from '../_shared/hunger-add188.js';
import {recoverFive187} from '../_shared/hunger-recovery187.js';
import {recoverFour172} from '../_shared/hunger-recovery172.js';
import {withStorageGuard} from '../_shared/storage-guard141.js';
import {ensureHunger,recoverEditionFour163} from './hunger.js';
import {jsonError} from '../_shared/auth.js';
async function handle141_onRequestGet({env}){try{await ensureHunger(env.DB);await recoverFour172(env.DB);await recoverEditionFour163(env.DB);await recoverFive187(env.DB);await addHungerFive188(env.DB);const rows=(await env.DB.prepare('SELECT edition,finished_at,state FROM hunger_history ORDER BY finished_at DESC LIMIT 60').all()).results;const editions=rows.map(row=>{const s=JSON.parse(row.state);return {edition:row.edition,phase:'finished',archived:true,createdAt:s.createdAt,finishedAt:row.finished_at,players:s.players.length,capacity:30};});return Response.json({ok:true,editions},{headers:{'Cache-Control':'no-store'}});}catch{return jsonError('No se pudo consultar el historial de Hunger.',500);}}

export async function onRequestGet(context){return withStorageGuard(context,handle141_onRequestGet);}
