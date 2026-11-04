// The deadline includes the body. Mutations are never replayed automatically.
export async function request(url,options={}){
 const {timeoutMs=60000,signal,...init}=options,controller=new AbortController();
 const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)controller.abort();const timer=setTimeout(abort,timeoutMs);
 try{const response=await fetch(url,{credentials:'same-origin',...init,signal:controller.signal});const body=await response.arrayBuffer();return new Response([204,205,304].includes(response.status)?null:body,{status:response.status,statusText:response.statusText,headers:response.headers});}
 catch(error){if(controller.signal.aborted)throw Error(init.method&&init.method!=='GET'?'La conexión ha tardado demasiado. Comprueba si la acción se guardó antes de repetirla.':'La conexión ha tardado demasiado. Puedes volver a intentarlo.');throw error;}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
