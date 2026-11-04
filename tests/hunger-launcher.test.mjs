import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';
import {CASTING_MINIGAMES} from '../minigame-catalog.js';
class E{constructor(){this.children=[];this.dataset={};this.style={};this.isConnected=true;}append(...x){this.children.push(...x);}replaceChildren(...x){this.children=x;}setAttribute(){}remove(){}}
const loads=[];const context=vm.createContext({document:{createElement:()=>new E()},window:{RufflePlayer:{newest:()=>({createPlayer:()=>Object.assign(new E(),{load:async options=>loads.push(options)})})}},setTimeout,clearTimeout,WebAssembly,console,Number,String,Error});
vm.runInContext(readFileSync(new URL('../original-flash.js',import.meta.url),'utf8').replace('export async function play','async function play')+'\nthis.launch=play;',context);
for(const kind of Object.keys(CASTING_MINIGAMES)){await context.launch(new E(),kind,null,()=>{},{hunger:true,contextId:7,fightId:'7-12'});const params=loads.at(-1).parameters;assert.equal(params.contextId,'7');assert.equal(params.subcontext,'hunger');assert.equal(params.subcontextId,'12');assert.equal(Number(params.subcontextId),12);}
await assert.rejects(()=>context.launch(new E(),'guitar',null,()=>{},{hunger:true,contextId:7,fightId:'invalid'}),/Identificador/);
const page=readFileSync(new URL('../hunger-page.js',import.meta.url),'utf8');assert.ok(page.includes('Si ganas: ❤️ '));assert.ok(page.includes('Si pierdes: ❤️ '));assert.ok(page.includes('Si huyes: ❤️ '));
const files=['wheel-of-fortune','numbers','deal-or-no-deal','match-three','guitar','endurance','maze','snow-flakes','words','line-balls'];for(const file of files)assert.ok(existsSync(new URL('../assets/minigames/regaged-capturas/'+file+'.png',import.meta.url)));assert.ok(!page.includes("img.src='/assets/minigames/'+"));
console.log('PASS real launcher numeric FlashVars for all ten Hunger games, invalid ID rejection, real screenshots and heart emoji.');
