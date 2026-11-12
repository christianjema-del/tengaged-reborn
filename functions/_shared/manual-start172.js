// V349: los controles de anfitrión de las partidas (iniciar, completar con bots, expulsar, pausar, día siguiente…)
// son de admin1 y también de la cuenta de Bowsy (id 11), que es suya. Va por id para que siga valiendo si cambia de nombre.
export const GAME_HOST_IDS349=[11];
export function startAdmin172(user){
 if(!user||user.is_banned||user.is_system||user.is_test_bot)return false;
 return (!!user.is_admin&&String(user.username||'').toLowerCase()==='admin1')||GAME_HOST_IDS349.includes(Number(user.id));
}
export function validStart172(s,kind){const m=s.manualStart172;return !!m&&m.kind===kind&&m.game===(kind==='hunger'?s.edition:s.id)&&m.run===(s.runId||null)&&m.by==='admin1'&&Number.isFinite(m.at)&&m.at>=Number(s.createdAt||0);}
export function authorizeStart172(s,user,kind,now){if(!startAdmin172(user)||s.phase!=='waiting')throw Error('Solo admin1 puede iniciar una partida en inscripción.');s.manualStart172={kind,game:kind==='hunger'?s.edition:s.id,run:s.runId||null,by:'admin1',user:String(user.username||''),at:now};}
export function requireStart172(s){if(s.phase==='waiting'){s.manualStartRequired172=true;s.startAt=null;s.lobbyEndsAt=null;}}
