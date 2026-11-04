import {withStorageGuard} from '../_shared/storage-guard141.js';
async function handle141_onRequest(){return Response.json({ok:true,version:243,build:"V243-JUEGOS-CASTELLANO",timestamp:new Date().toISOString()},{headers:{"Cache-Control":"no-store"}});}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
