import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {moveFriend333,moveToPage333} from '../friend-sort333.js';
test('V333: ordenar amigos arrastrando en PC',()=>{
 const o=['A','B','C','D'];
 assert.deepEqual(moveFriend333(o,'D','A'),['D','A','B','C'],'antes del destino');
 assert.deepEqual(moveFriend333(o,'A','C',true),['B','C','A','D'],'después del destino');
 assert.deepEqual(moveFriend333(o,'B','B'),o);assert.deepEqual(moveFriend333(o,'X','A'),o);
 const many=Array.from({length:20},(_,i)=>'U'+i);const moved=moveToPage333(many,'U0',2,15);assert.equal(moved.indexOf('U0'),15,'al principio de la página 2');assert.equal(moved.length,20);
 const src=fs.readFileSync(new URL('../friends.js',import.meta.url),'utf8');
 assert.match(src,/data\.self&&data\.friends\.length>1&&canDragFriends333\(\)\)enableGridSort333/,'solo el dueño y en PC');
 assert.match(src,/action:'reorder',usernames:order/);assert.match(fs.readFileSync(new URL('../profile.html',import.meta.url),'utf8'),/friends\.js\?v=337/);
});
