// V317: confirmaciones del panel dentro de la propia página, con el diseño de la web.
// Sustituye a confirm()/prompt(), que algunos navegadores y vistas integradas bloquean
// (devuelven «Cancelar» sin mostrar nada y la acción no se hacía).
function style(){if(document.getElementById('staffDialogStyle'))return;const st=document.createElement('style');st.id='staffDialogStyle';st.textContent=`.staff-dialog-back{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(47,70,90,.35)}
.staff-dialog{width:100%;max-width:420px;box-sizing:border-box;background:#fff;border:1px solid #4682b4;border-radius:5px;box-shadow:0 6px 24px rgba(0,0,0,.2);padding:14px 16px;font:12px/1.5 Arial,sans-serif;color:#55646e}
.staff-dialog h2{margin:0 0 8px;padding:0 0 3px;border-bottom:1px dotted #ffc3c3;color:#ff536d;font:bold 17px/22px 'Trebuchet MS',Arial,sans-serif;overflow-wrap:anywhere}
.staff-dialog p{margin:0 0 10px;overflow-wrap:anywhere}
.staff-dialog-input{display:block;width:100%;box-sizing:border-box;margin:0 0 10px;font:12px Arial;border:1px solid #c9dcea;border-radius:3px;padding:6px}
.staff-dialog-input[aria-invalid=true]{border-color:#ff536d}
.staff-dialog-actions{display:flex;justify-content:flex-end;gap:6px}
.staff-dialog-actions button{min-height:30px;padding:4px 12px;border:1px solid #c9dcea;border-radius:3px;background:linear-gradient(#fff,#e8f0f6);color:#2f6da3;font:bold 12px 'Trebuchet MS',Arial,sans-serif;cursor:pointer}
.staff-dialog-actions .staff-primary{background:linear-gradient(#fff9b7,#fff092);border-color:#eee18c;color:#6b6230}
.staff-dialog-actions .staff-danger{background:linear-gradient(#ff8597,#ff536d);border-color:#e9455e;color:#fff}`;document.head.append(st);}
function build(title,text,{input=false,ok='Confirmar',cancel='Cancelar',danger=false}={}){
 style();return new Promise(resolve=>{
  const back=document.createElement('div'),box=document.createElement('div'),h=document.createElement('h2'),p=document.createElement('p'),row=document.createElement('div'),yes=document.createElement('button'),no=document.createElement('button');
  back.className='staff-dialog-back';box.className='staff-dialog';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');h.textContent=title;p.textContent=text;row.className='staff-dialog-actions';
  yes.type=no.type='button';yes.textContent=ok;no.textContent=cancel;yes.className=danger?'staff-danger':'staff-primary';
  let field=null;if(input){field=document.createElement('textarea');field.rows=3;field.maxLength=300;field.className='staff-dialog-input';}
  const last=document.activeElement,close=v=>{document.removeEventListener('keydown',key);back.remove();last?.focus?.();resolve(v);};
  const key=e=>{if(e.key==='Escape')close(input?null:false);};
  yes.onclick=()=>{if(input){const v=field.value.trim();if(!v){field.focus();field.setAttribute('aria-invalid','true');return;}close(v);}else close(true);};
  no.onclick=()=>close(input?null:false);back.onclick=e=>{if(e.target===back)close(input?null:false);};
  row.append(no,yes);box.append(h,p);if(field)box.append(field);box.append(row);back.append(box);document.body.append(back);document.addEventListener('keydown',key);(field||yes).focus();
 });
}
export const askConfirm=(title,text,options)=>build(title,text,options);
export const askText=(title,text,options)=>build(title,text,{...options,input:true});
