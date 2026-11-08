import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {avatarOptions,normalizeAvatar,renderAvatar,skinPalette,featurePalette} from '../avatar-art.js';
import {hairOrnamentCostume} from '../avatar-costumes.js';
class E{
 constructor(tag,text,cls){this.tag=tag;this.textContent=text||'';this.className=cls||'';this.children=[];this.style={};this.disabled=false;this.classList={add(){}};}
 setAttribute(k,v){this[k]=v;}
 append(...c){this.children.push(...c);}
 replaceChildren(...c){this.children=[...c];}
}
const nodes=new Map(),requests=[];
const get=id=>{if(!nodes.has(id))nodes.set(id,new E('div'));return nodes.get(id);};
const wardrobe=[{id:1,title:'Pelo comprado',layer_type:'hair',has_image:1,acquired_at:'2026-11-03 08:00:00'},{id:2,title:'Camiseta regalada',layer_type:'shirt',has_image:1,acquired_at:'2026-11-02 08:00:00'}];
const context=vm.createContext({setAvatar:(img,name)=>{img.src='/api/avatar?username='+encodeURIComponent(name);return img;},invalidateAvatar(){},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
 avatarOptions,normalizeAvatar,renderAvatar,skinPalette,featurePalette,hairOrnamentCostume,
 isPhotoAvatar:()=>false,$:get,el:(...a)=>new E(...a),console,
 api:async()=>({settings:normalizeAvatar({}),layers:[],wardrobe}),
 post:async(url,body)=>{requests.push({url,body});return {message:'Avatar guardado'};},
 buttonTask:async(button,fn,notice)=>{if(button.disabled)return;button.disabled=true;try{await fn();}catch(e){notice.textContent=e.message;}finally{button.disabled=false;}},
 loginLink:()=>new E('a'),window:{dispatchEvent(){},TengagedSession:Promise.resolve({id:3,username:'Recipient'}),TengagedRefreshSession:async()=>{}},
 addEventListener(){},fetch:async()=>({ok:true,blob:async()=>({})}),
 FileReader:class{readAsDataURL(){this.result='data:image/png;base64,YQ==';this.onload();}}
});
const source=readFileSync(new URL('../avatar-editor.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'');
await vm.runInContext(source,context);
assert.equal(get('wardrobe').children.length,2);
assert.equal(get('wardrobe').children[0].children[0].tag,'img');
const code=c=>vm.runInContext(c,context);
await code('choose(inventory[0],{disabled:false})');
await code('choose(inventory[1],{disabled:false})');
assert.equal(requests.length,0);
assert.ok(get('avatarPreview').innerHTML.includes('data:image/png'));
assert.equal(get('saveAvatar').disabled,false);
await get('resetAvatar').onclick();
assert.equal(requests.length,0);assert.equal(get('saveAvatar').disabled,true);
await code('choose(inventory[0],{disabled:false})');
await get('saveAvatar').onclick();
assert.equal(requests.length,1);
assert.equal(requests[0].body.layers.hair,1);
assert.equal(get('saveAvatar').disabled,true);
assert.ok(get('changes').textContent.includes('guardado'));
assert.equal(get('wardrobeFilters').children.length,11);
await code('choose(inventory[0],{disabled:false})');
assert.equal(code('selection.hair'),undefined,'clicking an equipped design removes it in preview');
assert.equal(requests.length,1,'removing in preview does not save implicitly');
await get('resetAvatar').onclick();assert.equal(code('selection.hair'),1);
code("wardrobeCategory='shirt';renderWardrobe()");assert.equal(get('wardrobe').children.length,1);
assert.equal(get('wardrobe').children[0].children[1].textContent,'Camiseta regalada');
code("wardrobeCategory='accessory';renderWardrobe()");assert.equal(get('wardrobe').children[0].className,'wardrobe-empty');
code("wardrobeCategory='all';renderWardrobe()");
assert.equal(get('wardrobe').children[0].children[1].textContent,'Pelo comprado','purchase/gift order remains chronological across filter changes');
console.log('PASS: wardrobe thumbnails, preview without writes, discard without writes, explicit save sends selected designs.');
