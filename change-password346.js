// V346: cualquier usuario cambia su contraseña escribiendo la actual; con contraseña temporal no hace falta.
import {setAvatar} from '/avatar-display.js?v=337';
const $=id=>document.getElementById(id);
let pending=false;
function say(text,error=false){$('notice').textContent=text;$('notice').classList.toggle('error345',error);}
window.TengagedSession?.then(user=>{
 if(!user){location.replace('/?next=change-password.html#login');return;}
 pending=!!user.must_change_password;$('pwTemporary').hidden=!pending;$('pwCurrentBox').hidden=pending;
 setAvatar($('pwAvatar'),user.username);$('pwProfile').href='/profile.html?username='+encodeURIComponent(user.username);
 (pending?$('newPassword'):$('currentPassword')).focus();
});
$('pwShow').onchange=e=>{for(const id of ['currentPassword','newPassword','confirmPassword'])$(id).type=e.target.checked?'text':'password';};
$('changeForm').onsubmit=async event=>{
 event.preventDefault();const button=$('pwSave');
 if(!pending&&!$('currentPassword').value)return say('Escribe tu contraseña actual.',true);
 if($('newPassword').value.length<8)return say('La contraseña debe tener al menos 8 caracteres.',true);
 if($('newPassword').value!==$('confirmPassword').value)return say('Las dos contraseñas no coinciden.',true);
 button.disabled=true;say('Guardando…');
 try{
  const r=await fetch('/api/change-password',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({current:$('currentPassword').value,password:$('newPassword').value,confirm:$('confirmPassword').value})}),d=await r.json().catch(()=>({}));
  if(!r.ok||!d.ok)throw Error(d.message||d.error||'No se pudo cambiar la contraseña.');
  if(pending){location.replace('/');return;}
  for(const id of ['currentPassword','newPassword','confirmPassword'])$(id).value='';say(d.message);
 }catch(e){say(e.message,true);}finally{button.disabled=false;}
};
