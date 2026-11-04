import {gamePrize} from '../prize-catalog.js';
const excluded=n=>['admin1','mod'].includes(String(n).toLowerCase());
const quote=v=>v==null?'NULL':typeof v==='number'&&Number.isFinite(v)?String(v):"'"+String(v).replaceAll("'","''")+"'";
export const SNAPSHOT_SQL=`SELECT 'users' source,json_object('id',id,'username',username,'karma',karma,'t_money',t_money,'is_system',is_system,'is_test_bot',is_test_bot) payload FROM users
UNION ALL SELECT 'casting',json_object('id',id,'revision',revision,'state',state) FROM casting_matches
UNION ALL SELECT 'frookies',json_object('id',id,'revision',revision,'state',state) FROM frookies_matches
UNION ALL SELECT 'hunger',json_object('id',id,'revision',revision,'state',state) FROM hunger_arena
UNION ALL SELECT 'archive',json_object('edition',edition,'state',state) FROM hunger_history
UNION ALL SELECT 'casting_results',json_object('match_id',match_id,'username',username,'placement',placement,'reward',reward,'reward_money',reward_money,'pending',pending) FROM casting_results
UNION ALL SELECT 'hunger_wallet',json_object('event_key',event_key,'user_id',user_id,'money',money,'karma',karma) FROM hunger_wallet
UNION ALL SELECT 'frookies_wallet',json_object('event_key',event_key,'user_id',user_id,'money',money,'karma',karma) FROM frookies_wallet
UNION ALL SELECT 'triggers',json_object('name',name,'sql',sql,'table',tbl_name) FROM sqlite_master WHERE type='trigger';`;
export function decodeSnapshot(rows){const s={};for(const r of rows)(s[r.source]??=[]).push(typeof r.payload==='string'?JSON.parse(r.payload):r.payload);return s;}
// Each request is one simple SELECT. No compound SELECT, including on D1.
export const SNAPSHOT_QUERIES190=SNAPSHOT_SQL.replace(/;$/,'').split('\nUNION ALL ').map((sql,i)=>({source:['users','casting','frookies','hunger','archive','casting_results','hunger_wallet','frookies_wallet','triggers'][i],order:['id','id','id','id','edition','match_id,username','event_key','event_key','name'][i],sql:i===0?sql:sql.replace(/^(SELECT '[^']+'),/,'$1 source,').replace(' FROM ',' payload FROM ')}));
export function readSnapshot190(execute,progress=()=>{}){
 const rows=[];for(const q of SNAPSHOT_QUERIES190){let offset=0;progress(q.source);for(;;){const page=execute(q.sql+' ORDER BY '+q.order+' LIMIT 20 OFFSET '+offset);if(!Array.isArray(page)||page.some(r=>r.source!==q.source||r.payload==null))throw Error('Lectura incompleta de '+q.source);rows.push(...page);if(page.length<20)break;offset+=20;}}return decodeSnapshot(rows);
}
export function repairRequests190(report,batchId){const sql=repairSql(report,batchId);return [SETUP_SQL,...sql.slice(SETUP_SQL.length).split('\n').filter(s=>s.trim())];}
export function audit(s){
 const awards=[],issues=[],ignored=[],seen=new Set(),users=s.users||[],states=[];
 for(const kind of ['casting','frookies','hunger','archive'])for(const row of s[kind]||[]){let state;try{state=JSON.parse(row.state);}catch{issues.push({game:kind,id:row.id??row.edition,reason:'Estado ilegible'});continue;}states.push({kind,row,state});}
 // Current Hunger state wins over an archive of the same edition.
 for(const {kind,row,state:g} of states){const type=kind==='archive'?'hunger':kind,id=type==='hunger'?g.edition:g.id;
  const gameKey=type+':'+id;if(seen.has(gameKey))continue;seen.add(gameKey);
  if(g.phase==='waiting')continue;
  if(type==='hunger'&&id>=5&&(!Number.isFinite(g.startedAt)||g.startedAt<g.createdAt)){issues.push({game:type,id,reason:'Hunger sin inicio válido: no se pagan partidas automáticas inválidas'});continue;}
  if(!Array.isArray(g.players)){issues.push({game:type,id,reason:'Lista de participantes ilegible'});continue;}
  for(const p of g.players)if(!p.bot&&!excluded(p.username)&&(g.phase==='finished'||p.status==='eliminated'||type==='hunger'&&p.health<=0)&&(!Number.isInteger(p.placement)||p.placement<1))issues.push({game:type,id,username:p.username,reason:'Falta un puesto definitivo verificable'});
  const placed=(g.players||[]).filter(p=>!p.bot&&Number.isInteger(p.placement)&&p.placement>0&&(g.phase==='finished'||(type==='hunger'?(p.eliminatedAt||p.health<=0):p.status==='eliminated')));
  const positions=new Set();let invalid=false;for(const p of g.players||[])if(Number.isInteger(p.placement)&&p.placement>0){if(positions.has(p.placement))invalid=true;positions.add(p.placement);}
  if(invalid){issues.push({game:type,id,reason:'Puestos duplicados: requiere revisar la clasificación antes de pagar'});continue;}
  for(const p of placed){
   const u=users.find(u=>p.id>0?u.id===p.id:String(u.username).toLowerCase()===String(p.username).toLowerCase());
   if(excluded(p.username)||u&&excluded(u.username)){ignored.push({game:type,id,username:p.username});continue;}
   if(!u||u.is_system||u.is_test_bot){if(!u)issues.push({game:type,id,username:p.username,reason:'No se encuentra una cuenta real'});continue;}
   if(String(u.username).toLowerCase()!==String(p.username).toLowerCase()){issues.push({game:type,id,username:p.username,reason:'Identidad de usuario inconsistente'});continue;}
   const expected=gamePrize(type==='casting'?'casting_slow':type==='frookies'?'rookies_fast':'hunger',p.placement);if(type==='hunger'&&Number(id)===4){expected.karma*=2;expected.money*=2;}
   const run=type==='frookies'&&g.runId&&g.runId!=='initial'?':run:'+g.runId:'';
   const receiptKey=`${type}:${id}${run}:prize:${u.id}`;
   const receipts=type==='casting'?(s.casting_results||[]).filter(r=>r.match_id===id&&String(r.username).toLowerCase()===String(u.username).toLowerCase()):(s[type+'_wallet']||[]).filter(r=>r.event_key===receiptKey);
   if(receipts.length>1){issues.push({game:type,id,username:p.username,reason:'Existen recibos duplicados: se requiere revisión'});continue;}
   const receipt=receipts[0];
   if(receipt&&type!=='casting'&&receipt.user_id!==u.id){issues.push({game:type,id,username:p.username,reason:'Recibo asociado a otro usuario'});continue;}
   const paid=type==='casting'&&receipt?.pending!==0?{karma:0,money:0}:receipt?{karma:type==='casting'?receipt.reward:receipt.karma,money:type==='casting'?receipt.reward_money:receipt.money}:{karma:0,money:0};
   if(!Number.isInteger(paid.karma)||!Number.isInteger(paid.money)||paid.karma<0||paid.money<0){issues.push({game:type,id,username:p.username,reason:'Importe histórico sin justificante completo; no se inventa un pago'});continue;}
   const delta={karma:Math.max(0,expected.karma-paid.karma),money:Math.max(0,expected.money-paid.money)};
   awards.push({type,id,kind,row,user:u,placement:p.placement,expected,paid,delta,receipt,receiptKey,run,overpaid:paid.karma>expected.karma||paid.money>expected.money});
  }
 }
 return {awards,issues,ignored,totals:{games:seen.size,awards:awards.length,pending:awards.filter(a=>a.delta.karma||a.delta.money).length,karma:awards.reduce((n,a)=>n+a.delta.karma,0),money:awards.reduce((n,a)=>n+a.delta.money,0),overpaid:awards.filter(a=>a.overpaid).length}};
}
export const SETUP_SQL=`CREATE TABLE IF NOT EXISTS prize_audit189(
 event_key TEXT PRIMARY KEY,batch_id TEXT NOT NULL,game_type TEXT NOT NULL,game_id INTEGER NOT NULL,user_id INTEGER NOT NULL,username TEXT NOT NULL,placement INTEGER NOT NULL,receipt_key TEXT NOT NULL,
 expected_karma INTEGER NOT NULL,expected_money INTEGER NOT NULL,paid_karma INTEGER NOT NULL,paid_money INTEGER NOT NULL,delta_karma INTEGER NOT NULL,delta_money INTEGER NOT NULL,had_receipt INTEGER NOT NULL,had_paid INTEGER NOT NULL,previous_receipt TEXT,previous_account TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TRIGGER IF NOT EXISTS prize_audit189_apply AFTER INSERT ON prize_audit189 BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM users WHERE id=NEW.user_id AND lower(username)=lower(NEW.username) AND lower(username) NOT IN ('admin1','mod') AND COALESCE(is_system,0)=0 AND COALESCE(is_test_bot,0)=0) THEN RAISE(ABORT,'PRIZE_EXCLUDED_ACCOUNT') END;
 UPDATE users SET karma=COALESCE(karma,0)+NEW.delta_karma,t_money=COALESCE(t_money,0)+NEW.delta_money WHERE id=NEW.user_id AND (NEW.game_type='casting' OR NEW.had_receipt=1);
 INSERT INTO hunger_wallet(event_key,user_id,money,karma) SELECT NEW.receipt_key,NEW.user_id,NEW.expected_money,NEW.expected_karma WHERE NEW.game_type='hunger' AND NEW.had_receipt=0;
 UPDATE hunger_wallet SET money=MAX(money,NEW.expected_money),karma=MAX(karma,NEW.expected_karma) WHERE event_key=NEW.receipt_key AND NEW.game_type='hunger' AND NEW.had_receipt=1;
 INSERT INTO frookies_wallet(event_key,user_id,money,karma) SELECT NEW.receipt_key,NEW.user_id,NEW.expected_money,NEW.expected_karma WHERE NEW.game_type='frookies' AND NEW.had_receipt=0;
 UPDATE frookies_wallet SET money=MAX(money,NEW.expected_money),karma=MAX(karma,NEW.expected_karma) WHERE event_key=NEW.receipt_key AND NEW.game_type='frookies' AND NEW.had_receipt=1;
 INSERT INTO casting_results(match_id,username,placement,reward,reward_money,pending) SELECT NEW.game_id,COALESCE(json_extract(NEW.previous_receipt,'$.username'),NEW.username),NEW.placement,MAX(NEW.paid_karma,NEW.expected_karma),MAX(NEW.paid_money,NEW.expected_money),0 WHERE NEW.game_type='casting'
 ON CONFLICT(match_id,username) DO UPDATE SET placement=excluded.placement,reward=excluded.reward,reward_money=excluded.reward_money,pending=0;
 INSERT INTO user_stats(username,games_played,wins,points,created_at) SELECT NEW.username,CASE WHEN NEW.had_paid=0 THEN 1 ELSE 0 END,CASE WHEN NEW.had_paid=0 AND NEW.placement=1 THEN 1 ELSE 0 END,NEW.delta_karma,CURRENT_TIMESTAMP WHERE NEW.game_type='casting' OR (NEW.game_type='frookies' AND NEW.had_receipt=1)
 ON CONFLICT(username) DO UPDATE SET games_played=COALESCE(games_played,0)+excluded.games_played,wins=COALESCE(wins,0)+excluded.wins,points=COALESCE(points,0)+excluded.points;
END;`;
function stateGuard(a){const table={casting:'casting_matches',frookies:'frookies_matches',hunger:'hunger_arena',archive:'hunger_history'}[a.kind];if(a.kind!=='archive')return `EXISTS(SELECT 1 FROM ${table} WHERE id=${Number(a.row.id)} AND revision=${Number(a.row.revision)})`;
 const g=JSON.parse(a.row.state),i=g.players.findIndex(p=>p.id===a.user.id);
 return `EXISTS(SELECT 1 FROM hunger_history WHERE edition=${Number(a.id)} AND json_extract(state,'$.phase')=${quote(g.phase)} AND json_extract(state,'$.createdAt') IS ${quote(g.createdAt)} AND json_extract(state,'$.finishedAt') IS ${quote(g.finishedAt)} AND json_extract(state,'$.players[${i}].id')=${a.user.id} AND json_extract(state,'$.players[${i}].placement')=${a.placement})`;
}
function receiptGuard(a){const table=a.type==='casting'?'casting_results':a.type+'_wallet',where=a.type==='casting'?`match_id=${a.id} AND lower(username)=lower(${quote(a.user.username)})`:`event_key=${quote(a.receiptKey)}`;
 if(!a.receipt)return `NOT EXISTS(SELECT 1 FROM ${table} WHERE ${where})`;
 const fields=a.type==='casting'?['pending','placement','reward','reward_money']:['user_id','karma','money'];return `EXISTS(SELECT 1 FROM ${table} WHERE ${where} AND ${fields.map(k=>`${k} IS ${quote(a.receipt[k])}`).join(' AND ')})`;
}
export function repairSql(report,batchId){let sql=SETUP_SQL+'\n';for(const a of report.awards){if(!a.delta.karma&&!a.delta.money&&a.receipt&&(a.type!=='casting'||a.receipt.pending===0&&a.receipt.placement===a.placement))continue;
 const key=`audit189:${a.receiptKey}:${a.placement}:${a.expected.karma}:${a.expected.money}:${a.paid.karma}:${a.paid.money}:${a.receipt?.pending??'none'}`;
 const values=[key,batchId,a.type,a.id,a.user.id,a.user.username,a.placement,a.receiptKey,a.expected.karma,a.expected.money,a.paid.karma,a.paid.money,a.delta.karma,a.delta.money,Number(!!a.receipt),Number(!!a.receipt&&(a.type!=='casting'||a.receipt.pending===0)),a.receipt?JSON.stringify(a.receipt):null,JSON.stringify(a.user)];
 const encoded=values.map(quote);encoded[encoded.length-1]=`(SELECT json_object('id',id,'username',username,'karma',karma,'t_money',t_money) FROM users WHERE id=${a.user.id})`;
 sql+=`INSERT OR IGNORE INTO prize_audit189(event_key,batch_id,game_type,game_id,user_id,username,placement,receipt_key,expected_karma,expected_money,paid_karma,paid_money,delta_karma,delta_money,had_receipt,had_paid,previous_receipt,previous_account) SELECT ${encoded.join(',')} WHERE ${stateGuard(a)} AND ${receiptGuard(a)} AND EXISTS(SELECT 1 FROM users WHERE id=${a.user.id} AND lower(username)=lower(${quote(a.user.username)}) AND lower(username) NOT IN ('admin1','mod') AND COALESCE(is_system,0)=0 AND COALESCE(is_test_bot,0)=0);\n`;
 }return sql;}
export function validateTriggers(s){for(const name of ['hunger_wallet_apply','frookies_wallet_credit','frookies_prize_stats'])if(!(s.triggers||[]).some(t=>t.name===name))throw Error('Falta el mecanismo de pago '+name+'. No se modifica ningún saldo.');for(const t of s.triggers||[])if(['hunger_wallet','frookies_wallet'].includes(t.table)&&/\bUPDATE\b[\s\S]*?\bON\b/i.test((t.sql||'').split('BEGIN')[0]))throw Error('Existe un mecanismo adicional al editar recibos; se requiere revisión: '+t.name);}
