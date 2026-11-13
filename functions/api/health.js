import {withStorageGuard} from '../_shared/storage-guard141.js';
async function handle141_onRequest(){return Response.json({ok:true,version:360,build:"V360-RACE-BURBUJA-CACHE-Y-PREMIOS",timestamp:new Date().toISOString()},{headers:{"Cache-Control":"no-store"}});}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
