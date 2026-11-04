import {resourceOrder188} from './casting-ranking188.js';
export function repairCastingEight227(s,now=Date.now()){
 if(Number(s.id)!==8||s.phase!=='finished'||s.positionRecovery227)return false;
 s.positionRecovery227={at:now,previousWinner:s.winner,previous:s.players.map(p=>({username:p.username,placement:p.placement})),previousStandings:s.finalStandings,policy:'active-humans-keys-apples-checks-challenge-tie',reportedInactive:['Oscar']};
 const rows=resourceOrder188(s,s.players,true,s.finishedAt||now);rows.forEach((r,i)=>{r.placement=i+1;s.players.find(p=>p.username.toLowerCase()===r.username.toLowerCase()).placement=i+1;});s.finalStandings=rows.map(({tie,...row})=>row);s.winner=rows[0]?.username||null;s.resourceRankingVersion227=227;
 s.events.unshift({at:now,text:'Clasificación corregida: usuarios activos, llaves, manzanas y tics; desafíos solo para desempatar. Premios revisados con recibos para no repetir abonos.'});return true;
}
