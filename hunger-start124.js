/* Independent startup watchdog: remains available even when a module fails to load. */
(function(){
 var timer;
 function report(message){
  if(window.TengagedHungerReady)return;
  var notice=document.getElementById('notice'),actions=document.getElementById('arena-error-actions'),retry=document.getElementById('retry');
  if(notice){notice.hidden=false;notice.textContent=message;}
  if(actions)actions.hidden=false;
  if(retry){retry.disabled=false;retry.onclick=function(){if(window.TengagedHungerRetry)window.TengagedHungerRetry();else location.reload();};}
 }
 timer=setTimeout(function(){report(window.TengagedHungerLoadError||'No se ha completado la conexión con Hunger. Pulsa Reintentar conexión para recuperarla.');},18000);
 import('/hunger-page.js?v=337').catch(function(){clearTimeout(timer);report('No se pudo cargar Hunger. Pulsa Reintentar conexión para volver a cargarlo.');});
})();
