const input=document.getElementById('help-search'),count=document.getElementById('help-count'),items=[...document.querySelectorAll('#preguntas details')];
const normalize=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const entries=items.map(node=>({node,text:normalize(node.textContent)}));
function search(){const words=normalize(input.value.trim()).split(/\s+/).filter(Boolean);let found=0;for(const entry of entries){const show=words.every(word=>entry.text.includes(word));entry.node.hidden=!show;if(show)found++;}count.textContent=words.length?(found?found+' preguntas encontradas.':'No hay coincidencias. Prueba con otra palabra.'):items.length+' preguntas frecuentes.';}
input.addEventListener('input',search);input.addEventListener('search',search);search();
