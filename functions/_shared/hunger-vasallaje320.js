// V320/V322: «El Vasallaje», evento especial dentro de Hunger Games #11 (ya en marcha).
// El día 1 empieza a las 22:00 hora peninsular (21:00 UTC) del 9 de noviembre de 2026.
// V322: admin1 decide cuándo empieza cada día siguiente, así el evento cabe en menos de 24 horas.
export const VASALLAJE={edition:11,startAt:Date.UTC(2026,10,9,21,0,0)};
const MIN=60000,HOUR=3600000;
export const FEAST_DELAY=15*MIN,FOG_LENGTH=HOUR,LAST_DAY=3,FINAL_ALIVE=3;
// [karma, T$] por puesto, del 1.º al 19.º.
export const VASALLAJE_PRIZES=[[600,1200],[300,600],[200,450],[150,350],[120,300],[100,250],[90,220],[80,190],[70,160],[60,140],[50,120],[45,100],[40,90],[35,80],[30,70],[25,60],[20,50],[15,40],[10,30]];
export const DAYS=[
 {day:1,title:'Lluvia de flechas',text:'Aparece una diana cada 10 minutos en lugar de cada 20.'},
 {day:2,title:'El Festín',text:'15 minutos después de empezar el día, quienes estén en la Cornucopia recuperan 15 de salud y aparecen una Espada, una Maza y un Hacha durante 30 minutos.'},
 {day:3,title:'Niebla tóxica',text:'Durante la primera hora del día, quien esté en el bosque pierde el doble de salud. La Cornucopia está a salvo.'},
 {day:0,title:'Duelo de campeones',text:'Cuando solo queden 3 tributos, los combates ponen en juego hasta 60 de salud y dan el doble de experiencia.'}
];
export const isVasallaje=s=>Number(s?.edition)===VASALLAJE.edition;
export const SELF_SHOOTER='vort';
// V337: va ligado a la cuenta de Vort (id 11), que después se llamó Bowsy.
const isSelfShooter=p=>!p?.bot&&(Number(p?.id)===11||String(p?.username||'').toLowerCase()===SELF_SHOOTER);
// V327: solo Vort, solo en Hunger #11 y solo después de recibir sus 400 flechas.
// V328: si Vort muere por sus propias flechas, puede seguir disparando a los demás hasta el final.
export function canGhostShoot(s,p){return isVasallaje(s)&&s.phase==='active'&&isSelfShooter(p)&&!!p.selfShot327&&!!p.eliminatedAt&&p.deathCause==='arrow'&&!p.eliminatedBy&&Number(p.arrows)>0;}
export function canShootSelf(s,p){return isVasallaje(s)&&s.phase==='active'&&isSelfShooter(p)&&Number(s.vasallaje320?.vortArrows327)>0;}
const on=(s,at)=>isVasallaje(s)&&s.phase==='active'&&at>=VASALLAJE.startAt;
const v=s=>(s.vasallaje320??={announced:{},feast:false,final:false});
const dayOf=s=>Number(s.vasallaje320?.day)||0;
export function targetInterval(s,at,base){return on(s,at)&&dayOf(s)===1?base/2:base;}
export function fog(s,at){if(!on(s,at)||dayOf(s)!==3)return false;const from=s.vasallaje320.dayAt;return at>=from&&at<from+FOG_LENGTH;}
export function finalActive(s,alive,at){return on(s,at)&&alive<=FINAL_ALIVE;}
function announce(s,day,at,log){const st=v(s),info=DAYS.find(d=>d.day===day);st.day=day;st.dayAt=at;st.announced[day]=at;log(`EVENTO · El Vasallaje, día ${day}: ${info.title}. ${info.text}`,at,{kind:'event320'});}
// admin1 pasa al día siguiente.
export function nextDay(s,now,log){
 if(!isVasallaje(s))throw Error('Esta edición no tiene evento.');
 if(!on(s,now))throw Error('El Vasallaje empieza a las 22:00 y solo con la partida en juego.');
 const day=dayOf(s);if(!day)throw Error('El día 1 todavía no ha empezado. Actualiza la página.');
 if(day>=LAST_DAY)throw Error('El Vasallaje ya está en su último día.');
 announce(s,day+1,now,log);
}
// Se llama una vez por minuto de partida.
export function tick(s,at,{alive,log,weapons}){
 if(!on(s,at))return;
 const st=v(s);
 if(!st.day){announce(s,1,at,log);if(Number.isFinite(s.nextBonusAt))s.nextBonusAt=Math.min(s.nextBonusAt,at+10*MIN);}
 if(st.day===2&&!st.feast&&at>=st.dayAt+FEAST_DELAY){
  st.feast=at;const fed=[];
  for(const p of alive())if(p.location==='cornucopia'){p.health=Math.round(Math.min(100,p.health+15)*100)/100;delete p.arrowDeathPending;fed.push(p.username);}
  for(const type of ['sword','mace','axe'])if(weapons[type])s.drops.push({id:`${s.edition}-festin-${type}`,type,expiresAt:at+30*MIN});
  log(`EVENTO · ¡Empieza el Festín! ${fed.length?fed.length+' tributos en la Cornucopia recuperan 15 de salud.':'Nadie estaba en la Cornucopia.'} Hay una Espada, una Maza y un Hacha durante 30 minutos.`,at,{kind:'event320'});
 }
 if(st.day===3&&!st.fogEnded&&at>=st.dayAt+FOG_LENGTH){st.fogEnded=at;log('EVENTO · Se disipa la niebla tóxica.',at,{kind:'event320'});}
 // V327: al acabar la niebla, Vort recibe 400 flechas y puede dispararse a sí mismo (solo Hunger #11).
 if(st.fogEnded&&!st.vortArrows327){const vort=alive().find(p=>isSelfShooter(p));if(vort){st.vortArrows327=at;vort.arrows=(Number(vort.arrows)||0)+400;log('EVENTO · Se disipa la niebla y Vort recibe 400 flechas. Puede disparárselas incluso a sí mismo.',at,{kind:'event320'});}else st.vortArrows327=-1;}
 if(!st.final&&alive().length<=FINAL_ALIVE&&alive().length>1){st.final=at;log('EVENTO · ¡Duelo de campeones! Quedan '+alive().length+' tributos: los combates ponen en juego hasta 60 de salud y dan el doble de experiencia.',at,{kind:'event320'});}
}
// Lo que la página necesita para mostrar el cartel del evento.
export function eventView(s,now,admin=false){
 if(!isVasallaje(s))return null;
 const st=s.vasallaje320||{},started=now>=VASALLAJE.startAt&&s.phase!=='waiting',day=started?dayOf(s)||1:0;
 const today=s.phase==='finished'||!started?null:st.final?DAYS[3]:DAYS.find(d=>d.day===day)||null;
 const feastAt=day===2&&!st.feast&&st.dayAt?st.dayAt+FEAST_DELAY:null,fogUntil=fog(s,now)?st.dayAt+FOG_LENGTH:null;
 return {name:'El Vasallaje',startAt:VASALLAJE.startAt,started,day,dayAt:st.dayAt||null,today,days:DAYS,prizes:VASALLAJE_PRIZES,fog:!!fogUntil,fogUntil,feastAt,final:!!st.final,finished:s.phase==='finished',
  canAdvance:!!admin&&started&&s.phase==='active'&&day>=1&&day<LAST_DAY,next:day>=1&&day<LAST_DAY?DAYS[day]:null};
}
