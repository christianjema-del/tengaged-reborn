import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';import {activeGame348,assertOneGame348} from '../functions/_shared/one-game348.js';
// V348: no se puede estar en dos partidas del mismo juego a la vez.
const sql=new DatabaseSync(':memory:');class Q{constructor(q,a=[]){this.q=q;this.a=a;}bind(...a){return new Q(this.q,a);}async first(){return sql.prepare(this.q).get(...this.a)||null;}}const db={prepare:q=>new Q(q)};
sql.exec('CREATE TABLE frookies_matches(id INTEGER PRIMARY KEY,state TEXT)');
const add=(id,phase,players)=>sql.prepare('INSERT INTO frookies_matches VALUES(?,?)').run(id,JSON.stringify({id,phase,players}));
add(34,'nominations',[{id:5,status:'active'},{id:6,status:'eliminated'}]);add(35,'waiting',[{id:7,status:'active'}]);add(30,'finished',[{id:8,status:'active'}]);
assert.equal((await activeGame348(db,'frookies',5,35))?.id,34,'sigue en la #34');
await assert.rejects(assertOneGame348(db,'frookies',5,35),/Ya estás inscrito en Frookies #34/);
await assertOneGame348(db,'frookies',6,35);// eliminado en la #34: puede entrar
await assertOneGame348(db,'frookies',8,35);// la #30 ya terminó
await assertOneGame348(db,'frookies',5,34);// volver a pulsar en su propia partida no falla
await assertOneGame348(db,'frookies',9,35);// nunca ha jugado
assert.equal(await activeGame348(db,'rookies',5,1),null,'sin tabla todavía: no bloquea');
for(const [f,kind] of [['rookies','rookies'],['frookies','frookies'],['duel','duel'],['survivor','survivor']])assert.match(readFileSync(new URL('../functions/api/'+f+'.js',import.meta.url),'utf8'),new RegExp("action==='join'\\)await assertOneGame348\\(env\\.DB,'"+kind+"'"),f+' comprueba al inscribirse');
const page=readFileSync(new URL('../enrollment-layout.js',import.meta.url),'utf8');assert.match(page,/already-in348/);assert.match(page,/Ya estás inscrito · #/);
assert.match(readFileSync(new URL('../enroll.html',import.meta.url),'utf8'),/enroll348\.css\?v=\d+[\s\S]*enrollment-layout\.js\?v=\d+/);
console.log('PASS V348: una partida por juego a la vez; tarjeta gris con cruz si ya estás inscrito');
