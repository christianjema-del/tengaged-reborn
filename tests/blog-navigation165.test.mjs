import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {blogHref162,authorHref162,blogRoute162} from '../blog-routing162.js';
import {safeReturn165} from '../navigation165.js';
const origin='https://test.local';
for(const author of ['admin1','Peach','Nombre con espacios','A&B']){
 const href=blogHref162({id:17,author,title:'Entrada'});assert.equal(new URL(href,origin).pathname,'/blogs');assert.equal(blogRoute162(origin+href).get('id'),'17');assert.equal(blogRoute162(origin+authorHref162(author)).get('author'),author);
}
assert.equal(blogRoute162(origin+'/blog/admin1/17/entrada').get('id'),'17');
for(const route of ['/blogs?id=17#comments','blogs?id=17','/blog/admin1/17/entrada','/posts/topic/Blogs','casting-game.html?id=5','hunger.html?edition=4'])assert.equal(safeReturn165(route,origin),route.startsWith('/')?route:'/'+route);
for(const route of ['//evil.test/x','/api/logout','https://evil.test','/unlisted','/blogs/../../api/login'])assert.equal(safeReturn165(route,origin),null);
const redirects=readFileSync(new URL('../_redirects',import.meta.url),'utf8');for(const row of redirects.trim().split('\n').filter(row=>/^\/(?:posts|blog)(?:[\s/*]|$)/.test(row)))assert.equal(row.split(/\s+/)[1],'/blogs','rewrites must target the extensionless document to avoid the observed 308 discarding the blog path');
console.log('PASS V165 entry/author links, retained query/hash, legacy routes and safe sign-in return paths.');
