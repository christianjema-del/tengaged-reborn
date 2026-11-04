import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
class E{constructor(tag,text,cls){this.tag=tag;this.textContent=text||'';this.className=cls||'';this.children=[];this.style={};}append(...c){this.children.push(...c);}replaceChildren(...c){this.children=c;}setAttribute(k,v){this[k]=v;}}
const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,new E('div'));return nodes.get(id);};
const leaders=Array.from({length:20},(_,i)=>({username:'Jugador '+i,karma:500-i,games_played:2,wins:1,color_code:'white'}));
const data={leaders,loved:[{username:'Querido',value:3}],trending:[{username:'Mencionado',value:2}],starsWinners:[],survivors:[],monthly:[{username:'Mensual',value:30}],fashionista:{username:'Modelo',designs:[{id:1,title:'Pelo <b>',author:'Autor',price:12}]}};
let fail=false;const context=vm.createContext({console,Date,Number,encodeURIComponent,$:get,el:(...args)=>new E(...args),colorCard:()=>({background:'#fff',label:'Blanca'}),setAvatar:(img,name)=>img.src='/api/avatar?username='+encodeURIComponent(name),document:{createTextNode:text=>new E('text',text)},api:async()=>{if(fail)throw Error('Sin conexión');return data;}});
vm.runInContext(readFileSync(new URL('../ranking.js',import.meta.url),'utf8').replace(/^import .*\n/gm,''),context);await new Promise(r=>setTimeout(r,0));
assert.equal(get('topHousemates').children.length,20);const walk=n=>[n,...n.children.flatMap(walk)],all=id=>walk(get(id));
assert.ok(all('topHousemates').some(e=>e.href==='/profile.html?username=Jugador%200'));
assert.ok(all('hofLoved').some(e=>e.textContent==='♥'));assert.ok(!all('hofTrending').some(e=>e.textContent==='♥'));
assert.ok(all('hofMonthly').some(e=>e.textContent==='+30'));assert.ok(all('hofFashion').some(e=>e.textContent==='12 T$'));assert.ok(all('hofFashion').some(e=>e.textContent==='Pelo <b>'));
assert.equal(get('refreshRanking').disabled,false);fail=true;await get('refreshRanking').onclick();assert.equal(get('rankNotice').textContent,'Sin conexión');assert.equal(get('refreshRanking').disabled,false);
const html=readFileSync(new URL('../hall-of-fame.html',import.meta.url),'utf8');assert.ok(html.includes('Salón de la Fama'));assert.ok(!html.includes('Más clasificaciones'));const css=readFileSync(new URL('../hof-reference230.css',import.meta.url),'utf8');assert.equal((css.match(/\(/g)||[]).length,(css.match(/\)/g)||[]).length);
console.log('PASS HOF UI: 20 profiles, rankings, heart only for loved users, fashion prices, escaped titles, errors/retry, CSS parentheses.');
