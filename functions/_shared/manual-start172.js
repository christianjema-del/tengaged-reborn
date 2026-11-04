export function startAdmin172(user){return !!user?.is_admin&&String(user.username||'').toLowerCase()==='admin1';}
export function validStart172(s,kind){const m=s.manualStart172;return !!m&&m.kind===kind&&m.game===(kind==='hunger'?s.edition:s.id)&&m.run===(s.runId||null)&&m.by==='admin1'&&Number.isFinite(m.at)&&m.at>=Number(s.createdAt||0);}
export function authorizeStart172(s,user,kind,now){if(!startAdmin172(user)||s.phase!=='waiting')throw Error('Solo admin1 puede iniciar una partida en inscripción.');s.manualStart172={kind,game:kind==='hunger'?s.edition:s.id,run:s.runId||null,by:'admin1',at:now};}
export function requireStart172(s){if(s.phase==='waiting'){s.manualStartRequired172=true;s.startAt=null;s.lobbyEndsAt=null;}}
