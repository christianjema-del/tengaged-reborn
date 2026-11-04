import {PEACH_EYES,PEACH_EYES_SOURCE_HASH} from './peach-eyes108.js';
import {DEMO_DESIGNS as originals} from './demo-designs-original.js';
import {DEMO_DESIGNS as previous} from './demo-designs-v31.js';
import {DEMO_DESIGNS as v35} from './demo-designs-v35.js';
import {DEMO_DESIGNS as v37} from './demo-designs-v37.js';
import {DEMO_DESIGNS as clean} from './demo-designs.js';
// Exact known imports only: preserve custom artwork and existing inventory IDs.
const replacements=new Map([...originals.map((d,i)=>[d.image_data,clean[i].image_data]),...previous.map((d,i)=>[d.image_data,clean[i].image_data]),...v35.map((d,i)=>[d.image_data,clean[i].image_data]),...v37.map((d,i)=>[d.image_data,clean[i].image_data])]);
export function cleanDesignLayer(data){if(typeof data==='string'){const canonical=data.trim().replace(/\\n|\s/g,'');let hash=2166136261;for(let i=0;i<canonical.length;i++)hash=Math.imul(hash^canonical.charCodeAt(i),16777619)>>>0;if(String(hash)===PEACH_EYES_SOURCE_HASH)return PEACH_EYES;}return replacements.get(data)||data;}
