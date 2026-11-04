// Accept return paths only for real public pages on this origin.
export function safeReturn165(value,origin){
 if(!value||typeof value!=='string')return null;
 let url;try{url=new URL(value.startsWith('/')?value:'/'+value,origin);}catch{return null;}
 if(url.origin!==origin)return null;
 const pages=new Set(['','index','games','blogs','designs','shops','hall-of-fame','avatar','mail','groups','questions','community','profile','friends','casting-game','hunger','frookies','duel','mafias','enroll','minijuegos','help','normas','faq','admin']);
 const part=url.pathname.replace(/^\//,'').replace(/\.html$/,'');
 if(!pages.has(part)&&!/^\/(?:blog|posts)(?:\/|$)/.test(url.pathname))return null;
 return url.pathname+url.search+url.hash;
}
