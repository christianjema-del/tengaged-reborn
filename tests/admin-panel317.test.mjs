import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {summarize} from '../functions/api/admin-games.js';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('V317: el panel no usa confirm()/prompt(), que algunos navegadores bloquean',()=>{
 for(const f of ['admin-page.js','admin-workbench.js']){const s=read(f).replaceAll('askConfirm(','').replaceAll('askText(','');assert.ok(!/\bconfirm\(/.test(s),f);assert.ok(!/\bprompt\(/.test(s),f);}
 assert.match(read('admin-page.js'),/await askConfirm\('Enviar aviso'/);assert.match(read('staff-dialog317.js'),/export const askConfirm/);
});
test('V317: resumen de partidas en curso para el panel',()=>{
 const g={type:'survivor',name:'Survivor',href:id=>'/survivor.html?id='+id};
 const r=summarize(g,1,{phase:'day',day:2,players:[{username:'a',status:'active'},{username:'b',status:'eliminated'},{username:'Bot',bot:true,status:'active'}]});
 assert.deepEqual([r.game,r.id,r.phaseName,r.day,r.players,r.bots,r.alive,r.href],['Survivor',1,'En juego',2,2,1,2,'/survivor.html?id=1']);
 const h=summarize({type:'hunger',name:'Hunger Games',href:()=>'/hunger.html'},10,{phase:'waiting',players:[{username:'Peach',health:70}]});assert.equal(h.phaseName,'Inscripción');assert.equal(h.alive,1);
 const html=read('admin.html');assert.match(html,/data-staff-tab="games"/);assert.match(html,/id="noticeTarget"/);
});
