// V336: país de conexión (código ISO de dos letras) con bandera y nombre en español.
export function flag336(code){const c=String(code||'').toUpperCase();return /^[A-Z]{2}$/.test(c)?String.fromCodePoint(...[...c].map(ch=>0x1F1E6+ch.charCodeAt(0)-65)):'';}
export function countryName336(code){const c=String(code||'').toUpperCase();if(!/^[A-Z]{2}$/.test(c))return 'Desconocido';try{return new Intl.DisplayNames(['es'],{type:'region'}).of(c)||c;}catch{return c;}}
export function place336(country,city){if(!country)return 'País desconocido';return flag336(country)+' '+countryName336(country)+(city?' · '+city:'');}
