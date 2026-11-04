// Interpret stored legacy events only when their explicit wording identifies a player.
// Never infer the author of an anonymous shot from another event.
export function describeHungerEvent(raw,state){
 const e={...raw},players=state.players||[],text=String(e.text||''),f=e.fight&&(state.fights||[]).find(f=>f.id===e.fight);
 if(f&&e.kind==='challenge'){e.actor??=f.attacker;e.target??=f.defender;}
 if(f&&e.kind==='fight'&&f.winner){e.actor??=f.winner;e.target??=f.winner===f.attacker?f.defender:f.attacker;}
 for(const p of players){if(text.startsWith(p.username+' entra en la Cornucopia.')){e.kind='enter';e.actor??=p.id;}else if(text.startsWith(p.username+' se oculta en el bosque.')){e.kind='hide';e.actor??=p.id;}else if(text.startsWith(p.username+' comienza a recoger ')||text.startsWith(p.username+' recoge ')){e.kind=text.startsWith(p.username+' recoge ')?'weapon':'collect';e.phase=e.kind==='weapon'?'collected':'collecting';e.actor??=p.id;}else if(e.kind==='arrow'&&text.startsWith(p.username+' dispara una flecha a ')){e.actor??=p.id;}}
 if(e.kind==='arrow'&&e.damage===undefined){const damage=text.match(/: −([\d.]+) de salud/);if(damage)e.damage=Number(damage[1]);}
 if(['weapon','collect'].includes(e.kind)&&!e.weapon){const names={Cuchillo:'knife',Hacha:'axe',Maza:'mace',Espada:'sword'};for(const [name,type] of Object.entries(names))if(text.endsWith(name+'.'))e.weapon=type;}
 if(e.kind==='arrow'&&/^Un tributo desconocido dispara una flecha a /.test(text))delete e.actor;
 const actor=players.find(p=>p.id===e.actor),target=players.find(p=>p.id===e.target);
 return {event:e,actor:actor?.username||null,target:target?.username||null,actorBot:actor?.bot?actor.id:null,targetBot:target?.bot?target.id:null};
}
