import {setAvatar} from '/avatar-display.js?v=159';
import {elapsedMinutes} from '/elapsed-time.js?v=159';
export {$,el,api,post,profileLink,date,buttonTask,loginLink} from '/market-ui.js?v=170';
import {$,el,buttonTask} from '/market-ui.js?v=170';
export const notice=()=> $('notice');
export function link(label,href,cls=''){const a=el('a',label,cls);a.href=href;return a;}
export function title(text){return el('h2',text,'section-title');}
export function avatar(name){const img=el('img');setAvatar(img,name);img.alt='Avatar de '+name;img.className='social-avatar';img.loading='lazy';return img;}
export function relative(value){const raw=String(value||''),date=new Date(raw.replace(' ','T')+(!raw.includes('T')?'Z':''));if(!Number.isFinite(date.getTime()))return '';const minutes=Math.max(0,Math.floor((Date.now()-date.getTime())/60000));return minutes<1?'Ahora':'Hace '+elapsedMinutes(minutes);}
export function action(label,fn,cls='plain-btn'){const b=el('button',label,cls);b.type='button';b.onclick=()=>buttonTask(b,fn,notice());return b;}
export function form(fields,submit,fn){
 const f=el('form',undefined,'section-form');
 for(const field of fields){
  const {name,label,type='text',required=true,max=2000,value='',options}=field;
  const wrapper=el('label',label);let input;
  if(options){input=el('select');for(const [v,text] of options){const option=el('option',text);option.value=v;input.append(option);}}
  else input=el(type==='textarea'?'textarea':'input');
  if(type!=='textarea'&&!options)input.type=type;
  input.name=name;input.required=required;input.maxLength=max;input.value=value;
  wrapper.append(input);f.append(wrapper);
 }
 const send=el('button',submit,'market-btn');send.type='submit';f.append(send);
 f.onsubmit=e=>{e.preventDefault();return buttonTask(send,()=>fn(Object.fromEntries(new FormData(f)),f),notice());};
 return f;
}
export function tabs(items){const nav=el('nav',undefined,'market-tabs');for(const [text,href,current] of items){const a=link(text,href);if(current)a.setAttribute('aria-current','page');nav.append(a);}return nav;}
export function pages(page,total,size,href){const nav=el('nav',undefined,'social-pages');if(page>1)nav.append(link('‹ Anterior',href(page-1)));nav.append(el('span','Página '+page+' de '+Math.max(1,Math.ceil(total/size))));if(page*size<total)nav.append(link('Siguiente ›',href(page+1)));return nav;}
export function comment(author,body,time){const row=el('article',undefined,'social-comment'),head=el('div',undefined,'social-comment-head');head.append(link(author,'/profile.html?username='+encodeURIComponent(author)),el('small',relative(time)));row.append(head,el('p',body));return row;}
