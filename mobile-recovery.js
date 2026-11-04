/* V72: non-blocking mobile recovery for unexpected startup errors. */
(function(){
  var shown=false, failures=0;
  function notify(){
    if(shown || !document.body) return;
    shown=true;
    var panel=document.createElement('div'); panel.id='tg-mobile-recovery';
    panel.setAttribute('role','alert');
    panel.style.cssText='position:relative;z-index:5;margin:10px auto;padding:12px;max-width:600px;background:#fff9e1;border:1px solid #e1c87a;color:#383838;font:14px/1.5 Arial';
    panel.innerHTML='Ha fallado una parte de la carga. Puedes seguir navegando: <a href="/games.html">Juegos</a> · <a href="/hunger.html">Hunger Games</a> · <a href="/profile.html">Mi perfil</a> <button type="button" style="float:right">Cerrar</button>';
    panel.querySelector('button').onclick=function(){panel.remove()};
    document.body.insertBefore(panel,document.body.firstChild);
  }
  window.addEventListener('error',function(e){
    if(e && (e.target===window || e.target===document)) { failures++; if(failures>=2)notify(); }
  },true);
  window.addEventListener('unhandledrejection',function(){failures++;if(failures>=2)notify();});
  // Safeguard against unexpectedly hidden whole-page content, not loading states.
  window.addEventListener('load',function(){setTimeout(function(){
    var main=document.querySelector('main');
    if(main && (main.getBoundingClientRect().height<10 || getComputedStyle(main).display==='none'))notify();
  },800);});
})();
