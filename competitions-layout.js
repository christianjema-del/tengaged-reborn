const links=[...document.querySelectorAll('.competition')];
for(const a of links){a.onclick=()=>{for(const item of links)item.removeAttribute('aria-current');a.setAttribute('aria-current','true');};if(new URL(a.href,location.href).searchParams.get('juego')==='guitar')a.setAttribute('aria-current','true');}
