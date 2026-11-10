import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('V326: el perfil trae siempre las partidas en curso (Rookies incluido) aunque haya muchas partidas',()=>{
 const src=fs.readFileSync(new URL('../functions/api/profile.js',import.meta.url),'utf8');
 assert.match(src,/FROM user_game_history WHERE LOWER\(username\)=LOWER\(\?\)\s*ORDER BY \(status='active'\) DESC, COALESCE\(finished_at,joined_at\) DESC, id DESC LIMIT 300/);
 assert.ok(!/ORDER BY COALESCE\(finished_at,joined_at\) DESC, id DESC LIMIT 30\b/.test(src));
});
