import {resourceOrder188} from './casting-ranking188.js';
export function repairCastingSeven192(s,now=Date.now()){
 if(s.id!==7||s.phase!=='finished'||s.positionRecovery192)return false;
 s.positionRecovery192={at:now,previousWinner:s.winner,previous:s.players.map(p=>({username:p.username,placement:p.placement})),policy:'active-users-keys-first-then-apples-checks-then-minigame',inactive:['Giovanni','AntonioJ']};
 const rows=resourceOrder188(s,s.players,true,s.finishedAt||now);
 rows.forEach((r,i)=>{r.placement=i+1;s.players.find(p=>p.username.toLowerCase()===r.username.toLowerCase()).placement=i+1;});
 s.finalStandings=rows.map(({tie,...r})=>r);s.winner=rows[0]?.username||null;
 s.events.unshift({at:now,text:'Clasificación corregida: primero las llaves. Con las mismas llaves, manzanas + tics verdes; minijuegos para desempatar. Usuarios activos por delante de inactivos y bots.'});return true;
}
