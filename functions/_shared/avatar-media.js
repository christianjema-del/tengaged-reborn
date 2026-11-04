import {cleanDesignLayer} from './clean-design-layers.js';import {decodeDesignImage} from './design-images.js';
export function avatarLayerImage(value){if(typeof value!=='string')return null;const cleaned=cleanDesignLayer(value).trim().replace(/\\n|\s/g,'');try{return decodeDesignImage(cleaned)?cleaned:null;}catch{return null;}}
