// IP de conexión por cuenta. Admin1 y los moderadores pueden consultarla (V298); se conserva 180 días para detectar multicuentas.
const VALID_IP=/^[0-9a-fA-F:.]{3,45}$/,RETENTION="-180 days";
const ready=new WeakMap();
export async function ensureUserIps(db){if(!ready.has(db))ready.set(db,db.batch([
 db.prepare('CREATE TABLE IF NOT EXISTS user_ips(user_id INTEGER NOT NULL,ip TEXT NOT NULL,first_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,last_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,hits INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(user_id,ip))'),
 db.prepare('CREATE INDEX IF NOT EXISTS user_ips_ip ON user_ips(ip)'),
 db.prepare('CREATE TABLE IF NOT EXISTS blocked_ips(ip TEXT PRIMARY KEY,reason TEXT NOT NULL,actor_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)')]).then(addGeoColumns336).catch(error=>{ready.delete(db);throw error;}));return ready.get(db);
 // V336: país y ciudad de cada IP (los da Cloudflare o el acceso de Vercel; no se consulta ningún servicio externo).
 async function addGeoColumns336(){for(const col of ['country TEXT','city TEXT'])try{await db.prepare('ALTER TABLE user_ips ADD COLUMN '+col).run();}catch(e){if(!/duplicate column/i.test(String(e?.message||e)))throw e;}}}
// El acceso de Vercel envía la IP real junto con una clave compartida; sin ella solo vale la IP que ve Cloudflare.
export function clientIp(request,env){
 const key=env?.TENGAGED_PROXY_KEY,forwarded=request.headers.get('x-tengaged-client-ip');
 const ip=key&&forwarded&&request.headers.get('x-tengaged-proxy-key')===key?forwarded:request.headers.get('cf-connecting-ip');
 return ip&&VALID_IP.test(ip)?ip.toLowerCase():null;
}
// País (código ISO de dos letras) y ciudad de la conexión. Por Vercel solo se aceptan con la clave compartida.
export function clientGeo(request,env){
 const key=env?.TENGAGED_PROXY_KEY,proxied=!!key&&request.headers.get('x-tengaged-proxy-key')===key;
 let country=proxied?request.headers.get('x-tengaged-client-country'):(request.cf?.country||request.headers.get('cf-ipcountry'));
 let city=proxied?request.headers.get('x-tengaged-client-city'):request.cf?.city;
 try{if(city&&/%[0-9a-f]{2}/i.test(city))city=decodeURIComponent(city);}catch{}
 country=/^[A-Za-z]{2}$/.test(String(country||''))&&!/^(XX|T1)$/i.test(country)?String(country).toUpperCase():null;
 city=city?String(city).replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,60)||null:null;
 return {country,city};
}
export async function recordIp(db,request,env,userId){
 try{const ip=clientIp(request,env);if(!ip||!userId)return;await ensureUserIps(db);const {country,city}=clientGeo(request,env);await db.prepare("INSERT INTO user_ips(user_id,ip,country,city) VALUES(?,?,?,?) ON CONFLICT(user_id,ip) DO UPDATE SET last_seen=CURRENT_TIMESTAMP,hits=hits+1,country=COALESCE(excluded.country,user_ips.country),city=COALESCE(excluded.city,user_ips.city) WHERE user_ips.last_seen<datetime('now','-10 minutes') OR user_ips.country IS NULL").bind(userId,ip,country,city).run();}
 catch(error){console.warn('Registro de IP',error);}
}
export async function ipBlocked(db,request,env){
 try{const ip=clientIp(request,env);if(!ip)return false;await ensureUserIps(db);return !!await db.prepare('SELECT 1 FROM blocked_ips WHERE ip=?').bind(ip).first();}
 catch(error){console.warn('Bloqueo de IP',error);return false;}
}
export const purgeOldIps=db=>db.prepare(`DELETE FROM user_ips WHERE last_seen<datetime('now','${RETENTION}')`).run();
export async function accountDetails(db,target,{email=true}={}){
 await ensureUserIps(db);
 const account=await db.prepare('SELECT email,created_at,last_seen_at,(SELECT COUNT(*) FROM sessions s WHERE s.user_id=users.id) AS sessions FROM users WHERE id=?').bind(target.id).first();
 const ips=(await db.prepare(`SELECT i.ip,i.first_seen,i.last_seen,i.hits,i.country,i.city,EXISTS(SELECT 1 FROM blocked_ips b WHERE b.ip=i.ip) AS blocked FROM user_ips i WHERE i.user_id=? ORDER BY i.last_seen DESC LIMIT 30`).bind(target.id).all()).results;
 const related=(await db.prepare(`SELECT u.username,u.is_banned,GROUP_CONCAT(DISTINCT other.ip) AS ips FROM user_ips own JOIN user_ips other ON other.ip=own.ip AND other.user_id<>own.user_id JOIN users u ON u.id=other.user_id WHERE own.user_id=? AND COALESCE(u.is_system,0)=0 GROUP BY u.id ORDER BY u.username COLLATE NOCASE LIMIT 50`).bind(target.id).all()).results;
 const hasNames=!!await db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='username_changes296'").first();
 const names=hasNames?(await db.prepare('SELECT old_username,new_username,price,created_at FROM username_changes296 WHERE user_id=? ORDER BY id DESC LIMIT 20').bind(target.id).all()).results:[];
 if(!email)delete account.email;
 const last=ips.find(row=>row.country);
 return {...account,names,country:last?.country||null,city:last?.city||null,ips:ips.map(row=>({...row,blocked:!!row.blocked})),related:related.map(row=>({username:row.username,is_banned:!!row.is_banned,ips:String(row.ips||'').split(',')}))};
}
