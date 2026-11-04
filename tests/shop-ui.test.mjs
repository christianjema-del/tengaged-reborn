import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
class Element{
 constructor(tag,text,cls){this.tag=tag;this.textContent=text||'';this.className=cls||'';this.children=[];this.disabled=false;this.value='';}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=[...children];}
 setAttribute(k,v){this[k]=v;}
 focus(){}
 remove(){this.removed=true;}
}
const nodes=new Map(['shopContent','shopNotice','shopBalance'].map(x=>[x,new Element('div')]));
const requests=[];
const context=vm.createContext({
 URLSearchParams,location:{search:'',pathname:'/shops.html'},Date,Number,Set,console,
 document:{querySelectorAll:()=>[],body:new Element('body'),activeElement:new Element('button'),addEventListener(){},removeEventListener(){}},
 window:{TengagedSession:{then(){return {catch(){}};}},TengagedRefreshSession:async()=>{}},
 $:id=>nodes.get(id),el:(...args)=>new Element(...args),
 api:async()=>({signed_in:true,balance:100,karma:0,inventory:[],cycle:{ends_at:9999999999},shops:[],products:[]}),
 post:async(url,body)=>{requests.push({url,body});return {message:'Regalo enviado'};},
 preview:()=>new Element('img'),profileLink:()=>new Element('a'),date:String,
 buttonTask:async(button,fn,notice)=>{if(button.disabled)return;button.disabled=true;try{await fn();}catch(e){notice.textContent=e.message;}finally{button.disabled=false;}},
 loginLink:label=>new Element('a',label),empty(){},setInterval(){}
});
const source=readFileSync(new URL('../shops-page.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'');
vm.runInContext(source,context);
vm.runInContext("viewer={id:2,username:'Buyer'};accountState={balance:100,karma:0};",context);
const run=code=>vm.runInContext(code,context);
const d="{design_id:1,title:'Cabello',price:10,quantity:3}",s="{id:1,owner_id:1,active:1}";
let card=run('shopProduct('+d+','+s+')');
let gift=card.children.find(x=>x.textContent==='Regalar');
assert.ok(gift);assert.equal(gift.disabled,false);
gift.onclick();
const dialog=context.document.body.children.at(-1);
assert.equal(dialog.role,'dialog');
const form=dialog.children[0].children.at(-1);
const input=form.children[0].children[0];input.value='Recipient';
await form.onsubmit({preventDefault(){}});
assert.equal(requests.length,1);assert.equal(requests[0].url,'/api/player-shops');
assert.equal(requests[0].body.action,'gift');assert.equal(requests[0].body.recipient,'Recipient');
assert.equal(requests[0].body.design_id,1);assert.ok(dialog.removed);
run("shopInventory.add('userdesign-1')");
card=run('shopProduct('+d+','+s+')');
assert.equal(card.children.find(x=>x.textContent==='Ya lo tienes').disabled,true);
assert.equal(card.children.find(x=>x.textContent==='Regalar').disabled,false);
card=run('shopProduct('+d+",{id:1,owner_id:1,active:0})");
assert.equal(card.children.find(x=>x.textContent==='Regalar').disabled,true);
assert.ok(card.children.some(x=>x.textContent.includes('escaparate')));
run("viewer=null");
card=run('shopProduct('+d+','+s+')');assert.ok(card.children.some(x=>x.textContent.includes('Entrar para comprar o regalar')));
console.log('PASS: real storefront UI exposes gift button, opens recipient dialog, submits gift, preserves gifting for owned items and explains inactive shops.');

run("viewer={id:1,username:'Seller'};shopInventory.clear()");
card=run('shopProduct('+d+','+s+')');
assert.equal(card.children.find(x=>x.textContent==='Comprar').disabled,false);
console.log('PASS: owner can use Buy in own storefront.');

assert.equal(card.children.find(x=>x.textContent==='Regalar').disabled,false);
card.children.find(x=>x.textContent==='Regalar').onclick();
assert.equal(context.document.body.children.at(-1).role,'dialog');
console.log('PASS: owner gift button enabled and opens recipient form.');
