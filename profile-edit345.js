// V345: «Información personal» (réplica de Personal Info del Tengaged original).
import {setAvatar} from '/avatar-display.js?v=337';
const $=id=>document.getElementById(id);
const MONTHS=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function fill(select,blank,items){select.replaceChildren(new Option(blank,''),...items.map(([value,text])=>new Option(text,String(value))));}
function say(text,error=false){$('notice').textContent=text;$('notice').classList.toggle('error345',error);}
async function api(method,body){
 const response=await fetch('/api/personal-info',{method,credentials:'include',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
 const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw Error(data.message||data.error||'No se pudo completar la acción.');return data;
}
async function load(){
 const form=$('piForm');form.inert=true;
 try{
  const me=await window.TengagedSession;if(!me){say('Inicia sesión para editar tu información personal.',true);return;}
  setAvatar($('piAvatar'),me.username);$('piProfile').href='/profile.html?username='+encodeURIComponent(me.username);
  const {info,languages,genders}=await api('GET');const year=new Date().getFullYear();
  fill($('piDay'),'Día',Array.from({length:31},(_,i)=>[i+1,i+1]));fill($('piMonth'),'Mes',MONTHS.map((m,i)=>[i+1,m]));fill($('piYear'),'Año',Array.from({length:year-1899},(_,i)=>[year-i,year-i]));
  fill($('piLang'),'Elige idioma',languages.map(l=>[l,l]));fill($('piGender'),'—',genders.map(g=>[g,g]));
  $('piName').value=info.full_name;$('piDay').value=info.birth_day??'';$('piMonth').value=info.birth_month??'';$('piYear').value=info.birth_year??'';
  $('piLang').value=info.language;$('piGender').value=info.gender;$('piBio').value=info.bio;$('piBlog').value=info.blog;$('piNews').checked=info.news;$('piNotify').checked=info.notify;
  form.inert=false;
 }catch(e){say(e.message,true);}
}
$('piForm').addEventListener('submit',async event=>{
 event.preventDefault();const f=event.currentTarget;$('piSave').disabled=true;say('Guardando…');
 try{const r=await api('PUT',{full_name:f.full_name.value,birth_day:f.birth_day.value,birth_month:f.birth_month.value,birth_year:f.birth_year.value,language:f.language.value,gender:f.gender.value,bio:f.bio.value,blog:f.blog.value,news:f.news.checked,notify:f.notify.checked});say(r.message);}
 catch(e){say(e.message,true);}finally{$('piSave').disabled=false;}
});
load();
