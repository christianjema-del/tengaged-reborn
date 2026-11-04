// Compatibility encoding from the original SWFs; this is not an anti-cheat mechanism.
const KEY='tengTESTsecret';
function transform(bytes){const s=Uint8Array.from({length:256},(_,i)=>i);let j=0;
for(let i=0;i<256;i++){j=(j+s[i]+KEY.charCodeAt(i%KEY.length))&255;[s[i],s[j]]=[s[j],s[i]];}
let i=0;j=0;const out=new Uint8Array(bytes.length);
for(let n=0;n<bytes.length;n++){i=(i+1)&255;j=(j+s[i])&255;[s[i],s[j]]=[s[j],s[i]];out[n]=bytes[n]^s[(s[i]+s[j])&255];}return out;}
export function decode(hex){if(typeof hex!=='string'||hex.length>8192||hex.length%2||!/^[0-9a-f]+$/i.test(hex))throw Error('invalid data');const b=Uint8Array.from(hex.match(/../g),x=>parseInt(x,16));return JSON.parse(new TextDecoder().decode(transform(b)));}
export function encode(obj){return Array.from(transform(new TextEncoder().encode(JSON.stringify(obj))),b=>b.toString(16).padStart(2,'0')).join('');}
