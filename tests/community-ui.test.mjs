import {blogRoute162,blogHref162,authorHref162} from '../blog-routing162.js';
import {elapsedMinutes} from '../elapsed-time.js';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
class E{
 constructor(tag,text,cls){this.tagName=tag;this.textContent=text||'';this.className=cls||'';this.children=[];this.style={};this.dataset={};this.hidden=false;this.disabled=false;this.classList={add:(x)=>{this.className+=" "+x;},remove:(x)=>{this.className=this.className.split(" ").filter(v=>v!==x).join(" ");}};}
 addEventListener(name,fn){this["on"+name]=fn;}
 append(...c){this.children.push(...c);}
 prepend(...c){this.children.unshift(...c);}
 replaceChildren(...c){this.children=[...c];}
 setAttribute(k,v){this[k]=v;}
 get elements(){const out={};const walk=n=>{if(n?.name)out[n.name]=n;for(const c of n?.children||[])walk(c);};walk(this);return out;}
 querySelector(tag){const walk=n=>{if(n?.tagName===tag)return n;for(const c of n?.children||[]){const found=walk(c);if(found)return found;}};return walk(this);}
}
const me={id:1,username:'Alice'};
const fixture={
 '/api/mail':{ok:true,messages:[{id:1,sender:'Bob',recipient:'Alice',subject:'Hello',body:'Private test',created_at:'2026-10-25 00:00:00',read_at:null}],total:1,page:1,unread:1,blocks:[]},
 '/api/groups':{ok:true,groups:[],group:{id:1,name:'Test group',description:'Public fixture',admission:'open',owner:'Alice',owner_id:1},membership:'accepted',is_owner:true,can_read:true,members:[{user_id:1,username:'Alice',status:'accepted'}],topics:[],polls:[],images:[],replies:[]},
 '/api/questions':{ok:true,target:'Alice',is_owner:true,questions:[{id:1,asker:'Bob',question:'Hello?',answer:null,created_at:'2026-10-25 00:00:00'}]},
 '/api/community-feed':{ok:true,online:1,users:[{username:'Alice',karma:5,last_seen_at:'2026-10-25 00:00:00'}],messages:[]},
 '/api/profile-extras':{ok:true,username:'Alice',self:true,owned:[],owned_count:0,gifts:[],gift_count:0,page:1,colors:[]},
 '/api/profile':{ok:true,profile:{bio:'Hello @Bob https://example.test/image.gif'}},
 '/api/blog':{ok:true,posts:[{id:1,author:'Bob',title:'Test blog',body:'Text <script> must stay text',score:1,comments_count:0,created_at:'2026-10-25 00:00:00',voting_open:1}],comments:[],page:1,total:1}
};
for(const [name,search] of [['mail-page',''],['groups-page',''],['groups-page','?id=1'],['groups-page','?id=1&view=images'],['questions-page','?user=Alice'],['community-page',''],['blogs-page',''],['gifts-page','']]){
 const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,new E('div'));return nodes.get(id);};
 const context=vm.createContext({setAvatar:(img,name)=>{img.src='/api/avatar?username='+encodeURIComponent(name);return img;},invalidateAvatar(){},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
  URL,URLSearchParams,Date,Number,Set,Object,Promise,console,elapsedMinutes,blogRoute162,blogHref162,authorHref162,colorCard:()=>({background:'#fff'}),preview:()=>new E('a'),
  window:{TengagedUser:me,TengagedSession:Promise.resolve(me)},location:{href:'https://test.local/blogs.html'+search,origin:'https://test.local',search,hash:'',assign(){}},
  document:{body:{classList:{toggle(){}}},createElement:tag=>new E(tag),createTextNode:text=>new E('text',text),getElementById:get},
  $:get,el:(...a)=>new E(...a),api:async url=>structuredClone(fixture[url.split('?')[0]]),
  post:async()=>({ok:true,message:'Saved'}),profileLink:name=>new E('a',name),date:String,
  buttonTask:async(b,fn,notice)=>{try{await fn();}catch(e){notice.textContent=e.message;}},
  loginLink:text=>new E('a',text),empty:(root,text)=>root.replaceChildren(new E('p',text)),
  confirm:()=>false
 });
 const strip=s=>s.replace(/^(?:export )?\{[^\n]+\} from [^\n]+\n/gm,'').replace(/^import [^\n]+\n/gm,'').replace(/export (const|function)/g,'$1');
 vm.runInContext(strip(readFileSync(new URL('../community-ui.js',import.meta.url),'utf8')),context);
 vm.runInContext(strip(readFileSync(new URL('../rich-profile.js',import.meta.url),'utf8')),context);
 vm.runInContext(strip(readFileSync(new URL('../publication-date159.js',import.meta.url),'utf8')),context);
 await vm.runInContext(strip(readFileSync(new URL('../'+name+'.js',import.meta.url),'utf8')),context);
 await new Promise(setImmediate);
 assert.equal(get('notice').textContent,'',name+': '+get('notice').textContent);
 assert.equal(get('blogNotice').textContent,'',name+': '+get('blogNotice').textContent);
 assert.ok(get(name==='blogs-page'?'blogPosts':'content').children.length,name+' rendered');
}
console.log('PASS: mail, group directory/detail/gallery, questions, community and blog screens render from API fixtures without runtime errors.');
