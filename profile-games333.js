// V333: «Mis Juegos» del perfil, réplica 1:1 del Tengaged original (perfil de 2015):
// burbujas de 58 px del sprite master.gif, cajita de estado con «Día N / Terminado», número y fecha,
// la «F» de las partidas rápidas y el paginador «1 2 3 … N» a la derecha del título.
const PER_PAGE=7;
const MONTHS=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
// Burbuja de partida en curso según el juego (posiciones del sprite master.gif).
const ACTIVE={ROOKIES:'grbutton',FROOKIES:'grbutton',SURVIVOR:'gsvbutton',CASTING:'gbutton',FASTING:'gbutton',DUEL:'gdbutton',HUNGER:'ghbutton'};
const NAMES={CASTING:'Casting',FASTING:'Fasting',ROOKIES:'Rookies',FROOKIES:'Frookies',SURVIVOR:'Survivor',DUEL:'El Duelo',HUNGER:'Hunger Games'};
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
export function gameHref333(g){
 const kind=String(g.game_type||'').toUpperCase(),id=encodeURIComponent(g.game_id),active=g.status==='active';
 return kind==='HUNGER'?'/hunger.html'+(active?'':'?edition='+id):kind==='CASTING'||kind==='FASTING'?'/casting-game.html?id='+id:kind==='FROOKIES'?'/frookies.html?id='+id:kind==='DUEL'?'/duel.html?id='+id:kind==='ROOKIES'?'/rookies.html?id='+id:kind==='SURVIVOR'?'/survivor.html?id='+id:'/games.html';
}
export function placement333(g){const raw=String(g.placement||'');if(/ganador|unificaci/i.test(raw))return 1;const m=raw.match(/(\d+)/);return m?Number(m[1]):null;}
export function shortDate333(value){
 if(value==null||value==='')return '';let raw=value;
 if(typeof raw==='string'&&/^\d{4}-\d{2}-\d{2} /.test(raw))raw=raw.replace(' ','T')+'Z';
 const d=new Date(typeof raw==='number'&&raw<1e11?raw*1000:raw);if(!Number.isFinite(d.getTime()))return '';
 return d.getDate()+' '+MONTHS[d.getMonth()]+', '+String(d.getFullYear()).slice(-2);
}
// Primera línea de la cajita: igual que en el original («Día N» mientras sigue la partida, «Terminado» al acabar).
export function statusLine333(g){
 const day=Number(g.day);
 if(g.status==='active'||g.status==='eliminated'){if(day>0)return 'Día '+day;return g.status==='active'?(g.day===0?'Inscripción':'En juego'):'Eliminado';}
 return 'Terminado';
}
// Páginas visibles: 1 2 3 … N, más la página actual y sus vecinas.
export function pageList333(page,pages){
 const keep=new Set([1,2,3,pages,page-1,page,page+1].filter(n=>n>=1&&n<=pages)),out=[];let last=0;
 for(const n of [...keep].sort((a,b)=>a-b)){if(n-last>1)out.push('…');out.push(n);last=n;}
 return out;
}
export function renderGames333(root,games,state={page:1}){
 const list=Array.isArray(games)?games:[],pages=Math.max(1,Math.ceil(list.length/PER_PAGE));
 state.page=Math.min(Math.max(1,state.page||1),pages);
 const box=el('div','inuser-games-aj'),h2=el('h2'),pager=el('div','paginator pGames');
 pager.setAttribute('role','navigation');pager.setAttribute('aria-label','Páginas de Mis Juegos');
 if(pages>1)for(const n of pageList333(state.page,pages)){
  if(n==='…'){pager.append(document.createTextNode('...'));continue;}
  const a=el('a','gpage'+(n===state.page?' showing':''),String(n));a.href='#';if(n===state.page)a.setAttribute('aria-current','page');
  a.onclick=e=>{e.preventDefault();state.page=n;renderGames333(root,list,state);};pager.append(a);
 }
 h2.append(pager,document.createTextNode('Mis Juegos '),el('span','info',list.length+' games played'));
 const grid=el('div','inuser-games');
 for(const g of list.slice((state.page-1)*PER_PAGE,state.page*PER_PAGE)){
  const kind=String(g.game_type||'').toUpperCase(),place=placement333(g),item=el('div','game');
  const bubble=el('a');bubble.href=gameHref333(g);
  // V333b: cada juego conserva su burbuja también al terminar (el Duelo con «the duel», Hunger con el sinsajo…).
  if(place&&g.status!=='active'){bubble.className=(ACTIVE[kind]||'gbutton')+' num';bubble.append(document.createTextNode(String(place)),el('span','ordinal','°'));}
  else{bubble.className=ACTIVE[kind]||'gbutton';bubble.textContent=g.status==='active'?'Entrar':'Fin';}
  bubble.title=(NAMES[kind]||kind)+' #'+g.game_id+(place&&g.status!=='active'?' · '+(place===1?'Ganador':'Puesto '+place):'');
  const status=el('div','status');
  if(kind==='FROOKIES'||kind==='FASTING')status.append(el('div','fastsign','F'));
  status.append(document.createTextNode(statusLine333(g)),el('br'),document.createTextNode('#'+g.game_id),el('br'),document.createTextNode(shortDate333(kind==='CASTING'?(g.created_at||g.joined_at):(g.joined_at||g.created_at))));
  item.append(bubble,status);grid.append(item);
 }
 if(!list.length)grid.append(el('p','inuser-games-empty','Todavía no hay partidas registradas.'));
 box.append(h2,grid);root.replaceChildren(box);return box;
}
