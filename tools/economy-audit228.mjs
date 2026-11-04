import {gamePrize} from '../prize-catalog.js';
const lower=x=>String(x||'').toLowerCase();
export function review228(snapshot){
 const users=snapshot.users||[],issues=[],awards=[],games=new Map(),used=new Set();
 const byUser=new Map(users.filter(u=>!u.is_system&&!u.is_test_bot).map(u=>[u.id,{id:u.id,usuario:u.username,karma:u.karma,t_money:u.t_money,premios:0,karmaEsperado:0,tEsperado:0,karmaRegistrado:0,tRegistrado:0,karmaPendiente:0,tPendiente:0,karmaExceso:0,tExceso:0,incidencias:0}]));
 const issue=(type,detail,user)=>{issues.push({type,...detail,user:user?.username||detail.user||null});if(user&&byUser.has(user.id))byUser.get(user.id).incidencias++;};
 for(const u of users)if(byUser.has(u.id)&&(!Number.isFinite(Number(u.karma))||!Number.isFinite(Number(u.t_money))||u.karma<0||u.t_money<0))issue('saldo_invalido',{karma:u.karma,money:u.t_money},u);
 for(const [source,type]of [['hunger_history','hunger'],['hunger_arena','hunger'],['casting_matches','casting'],['frookies_matches','frookies'],['duel_matches','duel']])for(const row of snapshot[source]||[]){try{const s=JSON.parse(row.state),id=type==='hunger'?s.edition:s.id;if(!Array.isArray(s.players))throw Error();games.set(type+':'+id,{s,type,id});}catch{issue('estado_ilegible',{source,id:row.id||row.edition});}}
 for(const {s,type,id}of games.values()){
  const positions=new Set();for(const p of s.players){if(Number.isInteger(p.placement)&&p.placement>0){if(positions.has(p.placement))issue('puestos_duplicados',{game:type,id,placement:p.placement});positions.add(p.placement);}}
  if(s.phase==='waiting')continue;
  for(const p of s.players.filter(p=>!p.bot)){
   const u=users.find(u=>p.id>0?u.id===p.id:lower(u.username)===lower(p.username));if(!u||!byUser.has(u.id)){if(!u)issue('usuario_no_encontrado',{game:type,id,user:p.username});continue;}
   const placed=Number.isInteger(p.placement)&&p.placement>0&&(s.phase==='finished'||p.status==='eliminated'||!!p.eliminatedAt);
   if(!placed)continue;
   let expected=type==='duel'?{karma:0,money:0}:gamePrize(type==='casting'?'casting_slow':type==='frookies'?'rookies_fast':'hunger',p.placement);
   if(type==='hunger'&&Number(id)===4)expected={karma:expected.karma*2,money:expected.money*2};
   const run=type==='frookies'&&s.runId&&s.runId!=='initial'?':run:'+s.runId:'',receiptKey=`${type}:${id}${run}:prize:${u.id}`;
   const table=type==='casting'?'casting_results':type+'_wallet';const receipts=(snapshot[table]||[]).filter(r=>type==='casting'?Number(r.match_id)===Number(id)&&lower(r.username)===lower(u.username):r.event_key===receiptKey);
   let paidK=0,paidT=0;for(const r of receipts){used.add(table+':'+JSON.stringify(r));if(type==='casting'&&r.pending!==0)continue;const k=type==='casting'?r.reward:r.karma,m=type==='casting'?r.reward_money:r.money;if(!Number.isFinite(k)||!Number.isFinite(m)){issue('recibo_incompleto',{game:type,id,receipt:r},u);continue;}paidK+=k;paidT+=m;if(type!=='casting'&&r.user_id!==u.id)issue('recibo_otro_usuario',{game:type,id,receipt:r},u);}
   if(receipts.length>1)issue('recibos_duplicados',{game:type,id,count:receipts.length},u);
   const row={game:type,id,user:u.username,userId:u.id,placement:p.placement,expected,recorded:{karma:paidK,money:paidT},missing:{karma:Math.max(0,expected.karma-paidK),money:Math.max(0,expected.money-paidT)},excess:{karma:Math.max(0,paidK-expected.karma),money:Math.max(0,paidT-expected.money)}};awards.push(row);
   if(row.missing.karma||row.missing.money)issue('premio_pendiente',row,u);if(row.excess.karma||row.excess.money)issue('pago_superior_al_premio_actual',row,u);
   const a=byUser.get(u.id);a.premios++;a.karmaEsperado+=expected.karma;a.tEsperado+=expected.money;a.karmaRegistrado+=paidK;a.tRegistrado+=paidT;a.karmaPendiente+=row.missing.karma;a.tPendiente+=row.missing.money;a.karmaExceso+=row.excess.karma;a.tExceso+=row.excess.money;
  }
 }
 for(const table of ['casting_results','hunger_wallet','frookies_wallet'])for(const r of snapshot[table]||[]){if(table!=='casting_results'&&!String(r.event_key).includes(':prize:'))continue;if(!used.has(table+':'+JSON.stringify(r)))issue('recibo_sin_puesto_actual',{table,receipt:r,user:r.username||users.find(u=>u.id===r.user_id)?.username});}
 const creditTriggers=new Map();for(const trigger of snapshot.triggers||[]){if(!/UPDATE\s+users\s+SET[\s\S]*?(karma|t_money)/i.test(trigger.sql||''))continue;if(!/AFTER\s+INSERT/i.test(trigger.sql||''))continue;const group=creditTriggers.get(trigger.tbl_name)||[];group.push(trigger.name);creditTriggers.set(trigger.tbl_name,group);}for(const [table,triggers]of creditTriggers)if(triggers.length>1)issue('posibles_mecanismos_dobles_de_abono',{table,triggers});
 const adjustments=Object.fromEntries(Object.entries(snapshot).filter(([name])=>/adjustments|recovery|prize_audit/.test(name)));
 for(const [table,rows]of Object.entries(adjustments))for(const r of rows)if((r.delta_karma??0)<0||(r.delta_money??0)<0)issue('ajuste_negativo',{table,receipt:r,user:r.username});
 return {generatedAt:new Date().toISOString(),mode:'SOLO LECTURA',users:[...byUser.values()],awards,issues,adjustments,totals:{users:byUser.size,games:games.size,awards:awards.length,issues:issues.length,missingKarma:awards.reduce((n,a)=>n+a.missing.karma,0),missingMoney:awards.reduce((n,a)=>n+a.missing.money,0),excessKarma:awards.reduce((n,a)=>n+a.excess.karma,0),excessMoney:awards.reduce((n,a)=>n+a.excess.money,0)},limitations:['Los recibos reflejan pagos registrados; no prueban por sí solos cada cambio histórico del saldo.','Los excesos pueden proceder de premios anteriores conservados al corregir puestos; no equivalen automáticamente a un pago duplicado.','No se reconstruye el saldo total sumando premios: también hay compras, ventas, inscripciones, regalos y movimientos administrativos.','Las consultas paginadas no son una transacción única; si hay partidas activas, confirmar las incidencias con una segunda revisión.']};
}
