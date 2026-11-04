// Corrección limitada al informe revisado del 04/11/2026. No toca Hunger.
export const plan229 = [
 [7,11,'Lamine',3,40,20,15,14],
 [7,27,'Giovanni',7,15,14,5,7],
 [7,18,'PauCubarsi',2,40,20,25,16],
 [7,13,'Cristi',4,15,14,8,10],
 [7,23,'AntonioJ',6,8,10,6,8],
 [7,22,'Ricardito',5,8,10,7,9],
 [8,26,'Oscar',6,15,14,6,8],
 [8,14,'Peach',3,40,20,15,14]
];
const quote = s => "'"+String(s).replaceAll("'","''")+"'";
export function sql229(){
 return `CREATE TABLE IF NOT EXISTS economy_fix229 (
 match_id INTEGER NOT NULL,user_id INTEGER NOT NULL,username TEXT NOT NULL,
 placement INTEGER NOT NULL,old_karma INTEGER NOT NULL,old_money REAL NOT NULL,
 new_karma INTEGER NOT NULL,new_money REAL NOT NULL,
 previous_account TEXT NOT NULL,previous_receipt TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(match_id,user_id));
CREATE TRIGGER IF NOT EXISTS economy_fix229_apply AFTER INSERT ON economy_fix229 BEGIN
 SELECT CASE WHEN NEW.match_id NOT IN (7,8) OR LOWER(NEW.username) IN ('admin1','mod')
 OR NEW.old_karma<NEW.new_karma OR NEW.old_money<NEW.new_money
 THEN RAISE(ABORT,'Ajuste fuera del alcance autorizado') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM casting_results WHERE match_id=NEW.match_id AND LOWER(username)=LOWER(NEW.username))<>1
 OR NOT EXISTS(SELECT 1 FROM casting_results WHERE match_id=NEW.match_id AND LOWER(username)=LOWER(NEW.username) AND pending=0 AND placement=NEW.placement AND reward=NEW.old_karma AND reward_money=NEW.old_money)
 THEN RAISE(ABORT,'El recibo ha cambiado: repetir auditoria') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM casting_matches m,json_each(m.state,'$.players') p
 WHERE m.id=NEW.match_id AND json_extract(m.state,'$.phase')='finished'
 AND LOWER(json_extract(p.value,'$.username'))=LOWER(NEW.username)
 AND json_extract(p.value,'$.placement')=NEW.placement)
 THEN RAISE(ABORT,'La clasificacion ha cambiado: repetir auditoria') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM users WHERE id=NEW.user_id AND LOWER(username)=LOWER(NEW.username)
 AND COALESCE(is_system,0)=0 AND COALESCE(is_test_bot,0)=0
 AND karma>=NEW.old_karma-NEW.new_karma AND t_money>=NEW.old_money-NEW.new_money)
 THEN RAISE(ABORT,'Usuario o saldo no valido: revisar sin descontar') END;
 UPDATE users SET karma=karma-(NEW.old_karma-NEW.new_karma),
 t_money=ROUND(t_money-(NEW.old_money-NEW.new_money),2) WHERE id=NEW.user_id;
 UPDATE casting_results SET reward=NEW.new_karma,reward_money=NEW.new_money
 WHERE match_id=NEW.match_id AND LOWER(username)=LOWER(NEW.username);
END;
`+plan229.map(([m,id,u,p,ok,om,nk,nm])=>`INSERT INTO economy_fix229(match_id,user_id,username,placement,old_karma,old_money,new_karma,new_money,previous_account,previous_receipt)
 SELECT ${m},${id},${quote(u)},${p},${ok},${om},${nk},${nm},
 COALESCE((SELECT json_object('id',id,'username',username,'karma',karma,'t_money',t_money) FROM users WHERE id=${id}),'null'),
 COALESCE((SELECT json_object('match_id',match_id,'username',username,'placement',placement,'reward',reward,'reward_money',reward_money,'pending',pending) FROM casting_results WHERE match_id=${m} AND LOWER(username)=LOWER(${quote(u)})),'null')
 WHERE NOT EXISTS(SELECT 1 FROM economy_fix229 WHERE match_id=${m} AND user_id=${id});`).join('\n');
}
