import {withStorageGuard} from '../_shared/storage-guard141.js';
async function handle141_onRequest(){return Response.json({ok:true,version:239,build:"V239-GUITAR-TEMA-PROPIO",timestamp:new Date().toISOString()},{headers:{"Cache-Control":"no-store"}});}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
