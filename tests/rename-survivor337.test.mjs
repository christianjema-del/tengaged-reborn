import test from 'node:test';import assert from 'node:assert/strict';
import {STATE_TABLES,NAME_COLUMNS,renameStatements} from '../functions/_shared/username-change296.js';
test('V337: cambiar de nombre también actualiza las partidas de Survivor',()=>{
 assert.ok(STATE_TABLES.some(([t])=>t==='survivor_matches'));assert.ok(NAME_COLUMNS.some(([t,c])=>t==='survivor_results'&&c==='username'));
 const seen=[];const db={prepare:q=>({bind:(...a)=>{seen.push(q);return {q,a};}})};
 renameStatements(db,new Set(['survivor_matches','survivor_results']),{userId:11,oldName:'Vort',newName:'Bowsy',price:0});
 assert.ok(seen.some(q=>/UPDATE survivor_matches SET state=replace/.test(q)));assert.ok(seen.some(q=>/UPDATE OR IGNORE survivor_results SET username/.test(q)));
});
