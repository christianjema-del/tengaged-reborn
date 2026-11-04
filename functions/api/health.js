import {withStorageGuard} from '../_shared/storage-guard141.js';
async function handle141_onRequest(){return Response.json({ok:true,version:240,build:"V240-LUCHA-EXPERIENCIA",timestamp:new Date().toISOString()},{headers:{"Cache-Control":"no-store"}});}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
