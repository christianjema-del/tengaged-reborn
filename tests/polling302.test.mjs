import assert from 'node:assert/strict';import fs from 'node:fs';
// V302: menos consultas periódicas para no agotar el límite gratuito de peticiones del acceso.
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const expect={'casting-challenge.js':10000,'casting-game.js':10000,'casting-legacy-ui.js':10000,'casting-vote.js':10000,'duel-challenge217.js':10000,'duel-page212.js':20000,'frookies-challenge.js':15000,'frookies-page.js':15000,'game-feed.js':30000,'games-directory.js':30000,'games-lobby.js':30000,'shops-page.js':30000,'game-chat.js':20000,'friends.js':60000,'profile-extras.js':60000,'shell.js':120000,'engagement.js':120000,'my-active-games.js':120000,'player-activity.js':120000,'hunger-page.js':8000};
for(const [f,ms] of Object.entries(expect)){
 const delays=[...read(f).matchAll(/setInterval\(/g)].map(m=>{const seg=read(f).slice(m.index,m.index+500);const d=seg.match(/\},\s*(\d+)\)/);return d?Number(d[1]):0;}).filter(n=>n>1000);
 assert.ok(delays.includes(ms),f+' debe consultar cada '+ms+' ms (tiene '+delays+')');
 assert.ok(delays.every(n=>n>=8000),f+': ninguna consulta por debajo de 8 s ('+delays+')');
}
assert.match(read('hunger-page.js'),/lastArenaPoll>=30000/);
for(const f of fs.readdirSync(new URL('..',import.meta.url)).filter(f=>/\.(html|js)$/.test(f))){
 for(const m of read(f).matchAll(/(?<![\w.-])(shell|hunger-page|casting-game|frookies-page|engagement)\.js\?v=(\d+)/g))assert.ok(Number(m[2])>=302,f+' carga '+m[1]+'.js con versión antigua');
}
console.log('polling ok');
