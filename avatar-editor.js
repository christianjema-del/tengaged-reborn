import {isPhotoAvatar} from '/full-avatar115.js?v=159';
import {request as fetch} from '/http.js?v=170';
import {invalidateAvatar} from '/avatar-display.js?v=159';
import {avatarOptions,normalizeAvatar,renderAvatar,skinPalette,featurePalette} from '/avatar-art.js?v=306';
import {hairOrnamentCostume} from '/avatar-costumes.js?v=306';
import {$,el,api,post,buttonTask,loginLink} from '/market-ui.js?v=170';
const partRows=[['body','Cuerpo'],['hair','Pelo'],['eyes','Ojos'],['mouth','Boca'],['glasses','Gafas'],['shirt','Ropa']];
const colorRows=[['skin','Tono de piel',skinPalette],['shirtColor','Color de ropa',featurePalette],['eyeColor','Color de ojos',featurePalette],['mouthColor','Color de boca',featurePalette],['hairColor','Color de pelo',featurePalette],['glassesColor','Color de gafas',featurePalette],['background','Color de fondo',featurePalette]];
const labels=Object.fromEntries([...partRows,...colorRows.map(([k,l])=>[k,l]),['background','Fondo'],['skin','Cuerpo'],['hair_ornament','Adorno del pelo']]);
const ADMIN1_OUTFIT_ID=900000001;
let settings,saved,overlays={},user,dirty=false,selection={},savedSelection={},inventory=[],saving=false;
let wardrobeCategory='all';
const wardrobeTabs=[['all','Todos'],['background','Fondos'],['skin','Piel'],['shirt','Ropa'],['eyes','Ojos'],['glasses','Gafas'],['hair','Pelo'],['hair_ornament','Adornos del pelo'],['mouth','Boca'],['accessory','Accesorios'],['tattoo','Tatuajes / cicatrices']];
const paletteState=new Map();
const imageCache=new Map(),layers=['skin','shirt','eyes','mouth','hair','hair_ornament','glasses','background'];
const sameLayers=(a,b)=>layers.every(k=>(a[k]||null)===(b[k]||null));
function statLabel(part){
  const label=partRows.find(([k])=>k===part)?.[1]||part;
  const noun={body:'Cuerpo',shirt:'Ropa',eyes:'Ojos',mouth:'Boca',hair:'Pelo',glasses:'Gafas'};
  const current=(settings[part]||0)+1,total=avatarOptions[part];
  return `${part==='glasses'&&current===1?'Ninguna':(noun[part]||label)+' '+current}\n${current} / ${total}`;
}
function colorValue(color){return color.toUpperCase();}
function renderPalette(target,key,palette){
  const wrap=$(target); if(paletteState.get(key)===settings[key])return;paletteState.set(key,settings[key]);wrap.replaceChildren();
  for(const color of (palette.includes(settings[key])?palette:[...palette,settings[key]])){
    const b=el('button',undefined,'swatch'); b.type='button'; b.style.background=color; b.title=colorValue(color);
    b.setAttribute?.('aria-label',colorValue(color));b.setAttribute?.('aria-pressed',String(settings[key]===color));
    if(settings[key]===color) b.classList.add('selected');
    b.onclick=e=>{e.preventDefault();activateOriginalBase();settings[key]=color; draw();};
    wrap.append(b);
  }
}
function draw(){
  if(!settings) return;
  overlays._hairOrnamentCostume=hairOrnamentCostume(selection.hair_ornament);$('avatarPreview').innerHTML=renderAvatar(settings,overlays);
  dirty=JSON.stringify(settings)!==JSON.stringify(saved)||!sameLayers(selection,savedSelection);
  $('changes').textContent=dirty?'Vista previa · cambios sin guardar':'Avatar guardado';
  $('saveAvatar').disabled=!dirty||saving;
  for(const [part] of partRows) $('part-'+part).textContent=statLabel(part);
  for(const [key] of colorRows){ $('hex-'+key).textContent=colorValue(settings[key]);const picker=$('picker-'+key);if(picker)picker.value=settings[key]; renderPalette('swatches-'+key,key,colorRows.find(([k])=>k===key)[2]); }
}
function activateOriginalBase(){if(overlays._fullBody){delete selection.skin;delete overlays.skin;overlays._fullBody=false;renderWardrobe();}}
function colorControl(key,label,palette){
 const row=el('div',undefined,'reference-color');
 const swatches=el('div',undefined,'color-current');swatches.id='swatches-'+key;
 const more=el('label',undefined,'more-colors'),picker=el('input');picker.type='color';picker.id='picker-'+key;picker.setAttribute('aria-label','Más colores: '+label);
 picker.oninput=()=>{activateOriginalBase();settings[key]=picker.value;draw();};
 const hex=el('span',undefined,'color-hex');hex.id='hex-'+key;
 more.append(picker,el('span','Ver más colores'));row.append(swatches,more,hex);return row;
}
function buildControls(){
 const colorKeys={body:'skin',hair:'hairColor',eyes:'eyeColor',mouth:'mouthColor',glasses:'glassesColor',shirt:'shirtColor'};
 for(const [part,label] of partRows){
  const pair=el('section',undefined,'reference-pair'),heading=el('h3',label);
  const controls=el('div',undefined,'reference-navigation'),prev=el('button','◀','nav-arrow'),next=el('button','▶','nav-arrow'),value=el('span',undefined,'customize-value');value.id='part-'+part;value.setAttribute('aria-live','polite');
  for(const [btn,delta] of [[prev,-1],[next,1]]){btn.type='button';btn.setAttribute('aria-label',(delta<0?'Anterior: ':'Siguiente: ')+label);btn.onclick=()=>{activateOriginalBase();settings[part]=(settings[part]+avatarOptions[part]+delta)%avatarOptions[part];draw();};}
  controls.append(prev,next,value);pair.append(heading,controls,colorControl(...colorRows.find(([k])=>k===colorKeys[part])));$('partControls').append(pair);
 }
 const background=el('details',undefined,'background-colors');background.append(el('summary','Color de fondo básico'),colorControl(...colorRows.find(([k])=>k==='background')));$('colorControls').append(background);
}
async function imageFor(id){
 if(imageCache.has(id))return imageCache.get(id);
 const r=await fetch('/api/design-image?v=38&id='+id,{credentials:'include',cache:'no-store'});
 if(!r.ok)throw Error('No se pudo cargar la imagen del diseño.');
 const blob=await r.blob();
 const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('No se pudo leer la imagen.'));reader.readAsDataURL(blob);});
 imageCache.set(id,data);return data;
}
async function loadSelectedImages(){const missing=[];await Promise.all(Object.entries(selection).map(async([layer,id])=>{try{overlays[layer]=await imageFor(id);}catch{missing.push(labels[layer]||layer);}}));overlays._fullBody=(selection.skin===ADMIN1_OUTFIT_ID||isPhotoAvatar(overlays.skin))&&!!overlays.skin;return missing;}
async function choose(d,button){
 if(saving)return;
 await buttonTask(button,async()=>{
  if(selection[d.layer_type]===d.id){delete selection[d.layer_type];delete overlays[d.layer_type];}
  else{const image=await imageFor(d.id);selection[d.layer_type]=d.id;overlays[d.layer_type]=image;}
  overlays._fullBody=(selection.skin===ADMIN1_OUTFIT_ID||isPhotoAvatar(overlays.skin))&&!!overlays.skin;
  draw();renderWardrobe();$('avatarNotice').textContent='Vista previa actualizada. Pulsa Guardar para aplicar los cambios.';
 },$('avatarNotice'));
}
function renderWardrobe(){
 $('equippedLayers').replaceChildren();$('wardrobe').replaceChildren();$('wardrobeFilters').replaceChildren();
 for(const [category,label] of wardrobeTabs){const tab=el('button',label,'wardrobe-filter'+(wardrobeCategory===category?' active':''));tab.type='button';tab.setAttribute('aria-pressed',String(wardrobeCategory===category));tab.onclick=()=>{wardrobeCategory=category;renderWardrobe();};$('wardrobeFilters').append(tab);}
 const visible=inventory.filter(d=>wardrobeCategory==='all'||d.layer_type===wardrobeCategory);
 if(!visible.length){$('wardrobe').append(el('p',inventory.length?'Todavía no tienes diseños en esta categoría.':'Tus diseños comprados o recibidos como regalo aparecerán aquí.','wardrobe-empty'));return;}
 for(const d of visible){
  const selected=selection[d.layer_type]===d.id,canEquip=layers.includes(d.layer_type)&&d.has_image,card=el('button',undefined,'wardrobe-card'+(selected?' selected':''));card.type='button';card.disabled=!canEquip;card.setAttribute('aria-pressed',String(selected));card.setAttribute('aria-label',d.title+' · '+(selected?'Quitar':'Equipar'));
  const img=el('img');if(d.has_image)img.src='/api/design-image?v=38&id='+d.id;img.alt=d.title;img.loading='lazy';img.className='wardrobe-thumbnail';card.append(img,el('span',d.title,'wardrobe-title'));
  const status=selected?(savedSelection[d.layer_type]===d.id?'Equipado':'Seleccionado'):savedSelection[d.layer_type]===d.id?'Se quitará al guardar':canEquip?'Equipar':'Diseño de perfil';card.append(el('small',status,'wardrobe-status'));
  if(d.acquired_at){const time=el('time');time.dateTime=d.acquired_at;time.textContent='Adquirido: '+new Date(d.acquired_at.replace(' ','T')+'Z').toLocaleDateString('es-ES');card.title=d.title+' · '+time.textContent;}
  card.onclick=()=>choose(d,card);$('wardrobe').append(card);
 }
}
$('saveAvatar').onclick=async()=>{
 if(!dirty||saving)return;
 saving=true;draw();$('resetAvatar').disabled=true;
 try{
  const submittedSettings={...settings},submittedLayers={...selection};
  const data=await post('/api/avatar',{settings:submittedSettings,layers:submittedLayers});
  invalidateAvatar(user?.username);window.dispatchEvent(new CustomEvent('tengaged:avatar-updated',{detail:{username:user?.username}}));
  saved=submittedSettings;savedSelection=submittedLayers;
  $('avatarNotice').textContent=data.message;renderWardrobe();
  if(window.TengagedRefreshSession)await window.TengagedRefreshSession();
 }catch(e){$('avatarNotice').textContent=e.message;}
 finally{saving=false;$('resetAvatar').disabled=false;draw();}
};
$('resetAvatar').onclick=async()=>{
 if(saving)return;
 imageCache.clear();settings={...saved};selection={...savedSelection};overlays={};
 const missing=await loadSelectedImages();
 draw();renderWardrobe();$('avatarNotice').textContent=missing.length?'Se conserva tu selección, pero no se pudieron cargar: '+missing.join(', ')+'. Puedes quitar esas piezas o reintentar.':'Cambios descartados. Se muestra tu avatar guardado.';
};
addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
(async()=>{try{
 user=await window.TengagedSession;
 if(!user){$('avatarNotice').replaceChildren(loginLink('Inicia sesión para editar tu avatar'));return;}
 $('backProfile').href='/profile.html?username='+encodeURIComponent(user.username);
 const data=await api('/api/avatar?format=json');
 settings=normalizeAvatar(data.settings);saved={...settings};inventory=[...(data.wardrobe||[])].sort((a,b)=>String(b.acquired_at||'').localeCompare(String(a.acquired_at||''))||b.id-a.id);
 selection=Object.fromEntries(data.layers.map(x=>[x.layer_type,x.design_id]));savedSelection={...selection};
 buildControls();
 const missing=await loadSelectedImages();
 draw();renderWardrobe();$('editor').hidden=false;
 $('avatarNotice').textContent=missing.length?'No se pudieron cargar: '+missing.join(', ')+'. Tu selección se conserva. Puedes quitar esas piezas o reintentar.':'Prueba tus diseños comprados o regalados. Los cambios solo se aplican al guardar.';
}catch(e){$('avatarNotice').textContent=e.message;}})();
