export const WHEEL_PRIZES=Object.freeze([20,20,20,20,20,20,50,50,50,50,75,75,75,100,300,0]);
const madrid=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'});
export function wheelDay(now=Date.now()){const p=Object.fromEntries(madrid.formatToParts(new Date(now)).map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`;}
export function wheelReset(now=Date.now()){const day=wheelDay(now);let low=Math.floor(now/1000),high=low+27*3600;while(low+1<high){const mid=Math.floor((low+high)/2);if(wheelDay(mid*1000)===day)low=mid;else high=mid;}return high*1000;}
export async function ensureWheel(db){
 await db.prepare(`CREATE TABLE IF NOT EXISTS daily_wheel_spins(user_id INTEGER NOT NULL,day TEXT NOT NULL,segment INTEGER NOT NULL CHECK(segment BETWEEN 0 AND 15),prize INTEGER NOT NULL CHECK(prize IN (0,20,50,75,100,300)),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,day),CHECK(prize=CASE WHEN segment<6 THEN 20 WHEN segment<10 THEN 50 WHEN segment<13 THEN 75 WHEN segment=13 THEN 100 WHEN segment=14 THEN 300 ELSE 0 END))`).run();
 await db.prepare(`CREATE TRIGGER IF NOT EXISTS daily_wheel_credit116 AFTER INSERT ON daily_wheel_spins BEGIN UPDATE users SET t_money=t_money+NEW.prize WHERE id=NEW.user_id; END`).run();
}
