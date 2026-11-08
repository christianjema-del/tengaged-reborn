import {ensureSystemAccount} from './system-account.js';
export function enrollmentOptions(input){if(!input.enrollment)return null;const welcome=String(input.welcome||'').trim();if(!welcome||welcome.length>500)throw Error('Escribe un mensaje de presentación de entre 1 y 500 caracteres.');return {welcome,notifyOnStart:input.notifyOnStart===true};}
export async function ensureEnrollmentNotifications(db,type){await ensureSystemAccount(db);
 for(const [kind,table,key] of [['rookies','rookies_matches','id'],['duel','duel_matches','id'],['casting','casting_matches','id'],['hunger','hunger_arena','edition'],['frookies','frookies_matches','id'],['survivor','survivor_matches','id']].filter(row=>row[0]===type)){
 await db.prepare(`CREATE TRIGGER IF NOT EXISTS ${type}_enrollment_start_notice AFTER UPDATE OF state ON ${table}
 WHEN json_extract(OLD.state,'$.phase')='waiting' AND json_extract(NEW.state,'$.phase')<>'waiting' BEGIN
 INSERT OR IGNORE INTO private_messages(sender,recipient,subject,body,system_event)
 SELECT sys.id,recipient.id,'¡Tu partida ha empezado!',
 'Hola, '||recipient.username||'. Tu partida de ${type==='casting'?'Casting':type==='frookies'?'Frookies':type==='duel'?'El Duelo':type==='rookies'?'Rookies':type==='survivor'?'Survivor':'Hunger Games'} #'||json_extract(NEW.state,'$.${key}')||' ya ha empezado. Entra en Juegos → Mis juegos activos para participar.',
 '${type}:start:'||json_extract(NEW.state,'$.${key}')||':'||recipient.id
 FROM json_each(NEW.state,'$.players') p JOIN users recipient ON LOWER(recipient.username)=LOWER(json_extract(p.value,'$.username'))
 JOIN users sys ON sys.username='Tengaged' COLLATE NOCASE AND sys.is_system=1
 WHERE json_extract(p.value,'$.notifyOnStart')=1 AND recipient.is_system=0;
 END`).run();}
}
