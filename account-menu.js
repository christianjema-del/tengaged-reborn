(()=>{
const menu=document.getElementById('tg-account-menu');if(!menu)return;
const get=id=>document.getElementById(id),toggle=get('tg-menu-toggle');
let portraitUser='';
let avatarModule;
function portrait(user){const name=user?.username||'',img=get('tg-menu-avatar');if(!img)return;toggle.setAttribute('aria-label',name?'Abrir menú de '+name:'Abrir menú de navegación');menu.classList.toggle('has-avatar',!!name);if(name===portraitUser)return;portraitUser=name;img._avatarTask=null;img.removeAttribute('src');img.removeAttribute('data-avatar-username');img.removeAttribute('data-avatar-state');img.hidden=!name;img.alt=name?'Avatar de '+name:'';if(name)(avatarModule ||= import('/avatar-display.js?v=159')).then(({setAvatar})=>{if(portraitUser===name)setAvatar(img,name);}).catch(()=>{});}
function render(user){portrait(user);get('tg-menu-welcome').textContent=user?'Bienvenido, '+user.username:'Bienvenido';for(const id of ['tg-menu-profile','tg-menu-logout','tg-menu-mail'])get(id).hidden=!user;for(const id of ['tg-menu-login','tg-menu-register'])get(id).hidden=!!user;get('tg-menu-admin').hidden=!(user?.is_moderator||(user?.is_admin&&user.username?.toLowerCase()==='admin1'));get('tg-menu-admin').textContent=user?.is_moderator&&!(user?.is_admin&&user.username?.toLowerCase()==='admin1')?'Moderación':'Administración';}
window.TengagedRenderMenu=render;render(window.TengagedUser||null);
menu.addEventListener('toggle',()=>toggle.setAttribute('aria-expanded',String(menu.open)));
document.addEventListener('click',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;toggle.focus();}});
menu.addEventListener('click',event=>{if(event.target.closest('a'))menu.open=false;});
get('tg-menu-logout').onclick=()=>{const error=get('tg-menu-error');error.hidden=true;get('tg-logout').click();};
})();
