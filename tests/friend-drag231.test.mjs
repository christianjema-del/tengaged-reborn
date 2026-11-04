import assert from 'node:assert/strict';import {enableFriendDrag231} from '../friend-drag231.js';
const classes=new Set(),row={dataset:{},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)}},handle={setPointerCapture(){},releasePointerCapture(){}},order=['Alice','Bob','Carol'];
const move=(a,b)=>{const i=order.indexOf(a),j=order.indexOf(b);if(i>=0&&j>=0&&i!==j)order.splice(j,0,order.splice(i,1)[0]);};
globalThis.document={elementFromPoint:()=>({closest:()=>({dataset:{friendName:'Carol'}})})};globalThis.window={innerHeight:900,scrollBy(){}};
enableFriendDrag231(row,handle,'Alice',move);const e={pointerId:1,button:0,preventDefault(){},clientX:100,clientY:300};handle.onpointerdown(e);handle.onpointermove(e);handle.onpointerup(e);assert.deepEqual(order,['Bob','Carol','Alice']);assert.equal(classes.size,0);
handle.onpointerdown(e);handle.onpointercancel();assert.deepEqual(order,['Bob','Carol','Alice']);
row.ondrop({preventDefault(){},dataTransfer:{getData:()=> 'Bob'}});assert.deepEqual(order,['Carol','Alice','Bob']);
console.log('PASS avatar drag: desktop reorder, mobile pointer capture/drop, cancellation and no accidental navigation.');
