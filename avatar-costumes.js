// V306: disfraces subidos como «adorno del pelo» que cubren el avatar entero (capucha + sudadera,
// o una escena delante). Se pintan por encima de todo el pelo, también del que cae bajo el cuello,
// y las capuchas ocultan el pelo para que no asome por encima ni por los lados.
export const HAIR_ORNAMENT_COSTUMES=Object.freeze({
 299:Object.freeze({hideHair:true}),// Stitch
 300:Object.freeze({hideHair:true}),// bicho
 301:Object.freeze({hideHair:false})// Tiburón
});
export function hairOrnamentCostume(designId){return HAIR_ORNAMENT_COSTUMES[Number(designId)]||null;}
