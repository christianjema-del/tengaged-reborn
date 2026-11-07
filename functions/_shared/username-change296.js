// V296: cambio de nombre de usuario por 500 T$, sin límite de cambios.
// El nombre se guarda como texto en varias tablas y dentro de las partidas (JSON). Todo se reescribe en un único lote
// atómico; cada sentencia solo actúa si el primer UPDATE de users ha cobrado y renombrado de verdad.
export const USERNAME_PRICE=500;
const RESERVED=new Set(['admin','admin1','administrador','administrator','mod','moderador','moderator','tengaged','system','sistema','staff','soporte','support','null','undefined','bot','anonimo','anonymous','root']);
// Palabras internas que aparecen como claves o valores en el estado de las partidas: un nombre igual a una de ellas
// podría confundirse con datos del juego al reescribir el JSON.
const GAME_TOKENS=new Set('abeja abril active activehumans181 activity activitybase activitysince180 actor adjustedscores admin after agosto almohada amarillo animal answer apple apples applescount188 arrow arrows arrowvictory arroz atenas attacker attempts axe azul ballena ballots barcelona barco base batman before bicicleta bilbao blancanieves blanco boca body bombero bonus bonuses bonusid bonuskind bosque bot botchecks botella botjuryschedule botsaddedat botsaddedby bush bushcycle bushes bushruleversion caballo cabeza cangrejo caracas cartero casting cause cebolla cebra cereza cervantes chainleader challenge challengearchive146 challengebag challengehistory challengeruleversion challengescore changes chatprotected chatvotecutoffat checks checksbonus checksrank chocolate ciudad claimedat claimedby cocinero cohete collect collected collecting color comida commitid conejo copenhague cornucopia cost counts createdat cuaderno cuchara cuchillo cuerpo cycle daily damage datapoints day daystartedat deadline deal death deathcause defender dentista desierto diciembre domingo dropchattotal droppolicy drops duel duelitototototot dulcinea duration edimburgo edition eeeee eeeeee elefante eliminated eliminatedat eliminatedat186 eliminatedby elimination eliminations elsa endedat endsat endurance enero enfermera ensalada enter escoba espalda espejo estocolmo estrella events evicted eviction experience experienceafter experiencegain expiresat fee fight fightgamebag fights final finalchooserversion185 finalentry195 finalists finalpoints finalstandings finished finishedat flashattempts flashdata flashscores flauta food foodday foodstage forest fourth fresa frokieskieskies from frookies galleta gallina game gametotaltimeleft gato gift granada guitar guitarra health healthbonus healthchatcursor142 healthpaid278 healthruleversion heart history hoh hohpicks hola holaaa holaaaaa holi holiiii holiwis hombro hormiga huevo hunger hungercitototototo idlecharged immune immunity inactividad index initial invierno isla items jchchcytftft jejejejejejejej jirafa jjfjfkjfdjjfdjj jkhuib joinedat juryvotes karma key keydrops keys kills kind knife lago lalalaaaa lastactiveat lastat lastchatat lastcheckat lastfightkind lastshot lastwhisper lechuga line lisboa lists listsavedstages llave lluvia lobbyendsat lobo location londres loot lunes mace madrid maestra mallorca manualgate187 manualopened187 manualstart manualstart160 manualstart172 manualstart213 manualstartrequired172 manualstartversion manzana mario mariposa martes marzo match maze mesa messagebaseline messages minutes mochila mode money mono monte montevideo morning musica naranja nariz naturaleza negro nextbonusat nextdropat nieve nominationrepairs223 nominations nominees notice notifyonstart nube numbers objeto ops oslo oveja packages paella paloma panadero paraguas parentrun passivecount passiveday patata pato pending146 pera performancedays performancetotal perro phase phasestartedat piano pinocho pintor placement playa player players points policy position positionrecovery166 positionrecovery227 positionrecovery268 positionslocked186 positives positivevoters pov povsourceround146 practice previous previousballots previouschallenge146 previoushoh previousnominees previousphase previousround previouswinner primavera primeroroorororororor prize prizes profesion puerta puesotro queso question quito rana reactions reason receipts recorded recordedat redo295 reloj remaining replacement results rodilla rojo roma rookies round roundstartedat146 route rule rules146 rules158 rulesversion ruleversion run runid runs santiago saturno saved savedat savedduringpause184 savedfood294 savednominee score scorebonuses scores scoringmode search seed selectedchallenge serpiente sevilla silla simulated sjaajjajaj snow sopa sponsors stage stake startat started startedat startrequested stats status survival sword tambor target targetscheduleversion taxi tenedor text third tickat ticket tickpackagesearned tickspending tie tiempo tigre tijeras timeleft titanic toalla token toledo tormenta tortilla tortuga total_won totals transporte type until use user username uses uuuu vaca valencia varsovia ventana verano verde verified version vetodecision viena viento viernes waiting weapon welcomes wheel whispers winner wolfadjust words xpruleversion xxxxdx zanahoria zaragoza zorro'.split(' '));
const LOCKED=new Set(['admin1','mod','tengaged']);
// [tabla, columna] con el nombre en texto que identifica al jugador. Las tablas de auditoría de premios no se tocan:
// guardan el nombre que tenía cada uno cuando se pagó.
export const NAME_COLUMNS=[['casting_players','username'],['user_stats','username'],['game_actions','username'],['game_actions','vote_target'],['game_state','winner_username'],['game_elimination_votes','voter_username'],['game_elimination_votes','target_username'],['game_eliminations','username'],['casting_resources','username'],['user_game_history','username'],['casting_results','username'],['rookies_bets','username'],['rookies_results','username'],['duel_results','username'],['blog_posts','author'],['design_comments','author'],['community_designs','author']];
// Tablas con el estado de cada partida en JSON; true si llevan columna revision (control de concurrencia).
export const STATE_TABLES=[['casting_matches',true],['frookies_matches',true],['rookies_matches',true],['duel_matches',true],['hunger_arena',true],['hunger_history',false]];
export function checkNewName(value){
 const name=String(value||'').trim();
 if(!/^[A-Za-z0-9_]{3,24}$/.test(name))throw Error('El nombre debe tener entre 3 y 24 caracteres: letras sin tildes, números o guion bajo.');
 const low=name.toLowerCase();if(RESERVED.has(low)||low.startsWith('bot_')||GAME_TOKENS.has(low))throw Error('Ese nombre está reservado. Elige otro.');
 return name;
}
export function renameBlocked(user){
 if(!user)return 'Inicia sesión para cambiar tu nombre.';
 if(user.is_system||user.is_test_bot||user.is_banned||LOCKED.has(String(user.username).toLowerCase()))return 'Esta cuenta no puede cambiar de nombre.';
 if(GAME_TOKENS.has(String(user.username).toLowerCase()))return 'Tu nombre actual coincide con una palabra interna del juego. Pide el cambio a un administrador.';
 return null;
}
const quoted=name=>JSON.stringify(String(name));
export async function existingTables(db){return new Set((await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(r=>r.name));}
// Comprueba que el nombre nuevo no esté en uso: ni por otra cuenta, ni como resto de otra identidad en tablas o partidas.
export async function nameTaken(db,tables,userId,oldName,newName){
 if(await db.prepare('SELECT 1 FROM users WHERE lower(username)=lower(?) AND id<>? LIMIT 1').bind(newName,userId).first())return true;
 if(oldName.toLowerCase()===newName.toLowerCase())return false;
 for(const [t,c] of NAME_COLUMNS)if(tables.has(t)&&await db.prepare(`SELECT 1 FROM ${t} WHERE lower(${c})=lower(?) LIMIT 1`).bind(newName).first())return true;
 const needle=quoted(newName.toLowerCase());
 for(const [t] of STATE_TABLES)if(tables.has(t)&&await db.prepare(`SELECT 1 FROM ${t} WHERE instr(lower(state),?)>0 LIMIT 1`).bind(needle).first())return true;
 return false;
}
export function renameStatements(db,tables,{userId,oldName,newName,price=USERNAME_PRICE}){
 const guard='EXISTS(SELECT 1 FROM users WHERE id=? AND username=?)',g=[userId,newName];
 const list=[
  db.prepare('UPDATE users SET username=?,t_money=round(COALESCE(t_money,0)-?,2) WHERE id=? AND username=? AND COALESCE(t_money,0)>=? AND NOT EXISTS(SELECT 1 FROM users WHERE lower(username)=lower(?) AND id<>?)').bind(newName,price,userId,oldName,price,newName,userId),
  db.prepare('INSERT INTO username_changes296(user_id,old_username,new_username,price) SELECT ?,?,?,? WHERE '+guard).bind(userId,oldName,newName,price,...g)
 ];
 for(const [t,c] of NAME_COLUMNS)if(tables.has(t))list.push(db.prepare(`UPDATE OR IGNORE ${t} SET ${c}=? WHERE lower(${c})=lower(?) AND ${guard}`).bind(newName,oldName,...g));
 const a=quoted(oldName),b=quoted(newName),la=quoted(oldName.toLowerCase()),lb=quoted(newName.toLowerCase());
 for(const [t,rev] of STATE_TABLES)if(tables.has(t))list.push(db.prepare(`UPDATE ${t} SET state=replace(replace(state,?,?),?,?)${rev?',revision=revision+1':''} WHERE (instr(state,?)>0 OR instr(state,?)>0) AND ${guard}`).bind(a,b,la,lb,a,la,...g));
 return list;
}
export async function ensureUsernameChanges(db){await db.prepare('CREATE TABLE IF NOT EXISTS username_changes296(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,old_username TEXT NOT NULL,new_username TEXT NOT NULL,price REAL NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();}
