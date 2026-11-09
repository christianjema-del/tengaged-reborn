// V320: «El Vasallaje», evento especial dentro de Hunger Games #11 (ya en marcha).
// Empieza a las 22:00 hora peninsular (21:00 UTC) del 9 de noviembre de 2026. Los días del
// evento se cuentan desde esa hora; los premios se reparten entre los 19 puestos que quedaban vivos.
export const VASALLAJE={edition:11,startAt:Date.UTC(2026,10,9,21,0,0)};
const HOUR=3600000,DAY=86400000;
export const FEAST_AT=DAY+HOUR; // Día 2 del evento, 23:00.
export const FOG_FROM=2*DAY,FOG_TO=2*DAY+3*HOUR; // Día 3 del evento, de 22:00 a 01:00.
export const FINAL_ALIVE=3;
// [karma, T$] por puesto, del 1.º al 19.º.
export const VASALLAJE_PRIZES=[[600,1200],[300,600],[200,450],[150,350],[120,300],[100,250],[90,220],[80,190],[70,160],[60,140],[50,120],[45,100],[40,90],[35,80],[30,70],[25,60],[20,50],[15,40],[10,30]];
export const DAYS=[
 {day:1,title:'Lluvia de flechas',text:'Durante 24 horas aparece una diana cada 10 minutos en lugar de cada 20.'},
 {day:2,title:'El Festín',text:'A las 23:00 todos los que estén en la Cornucopia recuperan 15 de salud y aparecen una Espada, una Maza y un Hacha durante 30 minutos.'},
 {day:3,title:'Niebla tóxica',text:'De 22:00 a 01:00 quien esté en el bosque pierde el doble de salud. La Cornucopia está a salvo.'},
 {day:0,title:'Duelo de campeones',text:'Cuando solo queden 3 tributos, los combates ponen en juego hasta 60 de salud y dan el doble de experiencia.'}
];
export const isVasallaje=s=>Number(s?.edition)===VASALLAJE.edition;
const elapsed=at=>at-VASALLAJE.startAt;
const on=(s,at)=>isVasallaje(s)&&s.phase==='active'&&at>=VASALLAJE.startAt;
const v=s=>(s.vasallaje320??={announced:{},feast:false,final:false});
export function targetInterval(s,at,base){return on(s,at)&&elapsed(at)<DAY?base/2:base;}
export function fog(s,at){if(!on(s,at))return false;const e=elapsed(at);return e>=FOG_FROM&&e<FOG_TO;}
export function finalActive(s,alive,at){return on(s,at)&&alive<=FINAL_ALIVE;}
// Se llama una vez por minuto de partida.
export function tick(s,at,{alive,log,weapons}){
 if(!on(s,at))return;
 const st=v(s),e=elapsed(at),day=Math.floor(e/DAY)+1;
 const info=DAYS.find(d=>d.day===day);
 if(info&&!st.announced[day]){st.announced[day]=at;log(`EVENTO · El Vasallaje, día ${day}: ${info.title}. ${info.text}`,at,{kind:'event320'});
  if(day===1&&Number.isFinite(s.nextBonusAt))s.nextBonusAt=Math.min(s.nextBonusAt,at+10*60000);}
 if(day===2&&!st.feastWarned&&e>=FEAST_AT-HOUR&&e<FEAST_AT){st.feastWarned=at;log('EVENTO · El Festín empieza dentro de una hora en la Cornucopia.',at,{kind:'event320'});}
 if(!st.feast&&e>=FEAST_AT){
  st.feast=at;const fed=[];
  for(const p of alive())if(p.location==='cornucopia'){p.health=Math.round(Math.min(100,p.health+15)*100)/100;delete p.arrowDeathPending;fed.push(p.username);}
  for(const type of ['sword','mace','axe'])if(weapons[type])s.drops.push({id:`${s.edition}-festin-${type}`,type,expiresAt:at+30*60000});
  log(`EVENTO · ¡Empieza el Festín! ${fed.length?fed.length+' tributos en la Cornucopia recuperan 15 de salud.':'Nadie estaba en la Cornucopia.'} Hay una Espada, una Maza y un Hacha durante 30 minutos.`,at,{kind:'event320'});
 }
 if(!st.fogEnded&&st.announced[3]&&e>=FOG_TO){st.fogEnded=at;log('EVENTO · Se disipa la niebla tóxica.',at,{kind:'event320'});}
 if(!st.final&&alive().length<=FINAL_ALIVE&&alive().length>1){st.final=at;log('EVENTO · ¡Duelo de campeones! Quedan '+alive().length+' tributos: los combates ponen en juego hasta 60 de salud y dan el doble de experiencia.',at,{kind:'event320'});}
}
// Lo que la página necesita para mostrar el cartel del evento.
export function eventView(s,now){
 if(!isVasallaje(s))return null;
 const started=now>=VASALLAJE.startAt&&s.phase!=='waiting',day=started?Math.floor(elapsed(now)/DAY)+1:0;
 const today=s.phase==='finished'||!started?null:s.vasallaje320?.final?DAYS[3]:DAYS.find(d=>d.day===day)||null;
 return {name:'El Vasallaje',startAt:VASALLAJE.startAt,started,day,today,days:DAYS,prizes:VASALLAJE_PRIZES,fog:fog(s,now),final:!!s.vasallaje320?.final};
}
