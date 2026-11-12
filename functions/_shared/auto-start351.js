// V351: Frookies, Casting, Rookies y El Duelo empiezan solos. Cuando un usuario real se inscribe arranca una
// cuenta atrás de 10 minutos (se ve en el reloj de cada juego). Al acabar, el sistema completa las plazas con bots
// e inicia la partida, sin que admin1 o Bowsy tengan que pulsar nada. Hunger y Survivor no cambian.
export const AUTO_START_MS=10*60000;
const real=p=>!!p&&!p.bot&&!(Number(p.id)<0);
// Se llama al inscribirse un usuario real. Si ya hay cuenta atrás, no la reinicia.
export function armAutoStart351(s,now){
 if(s.phase!=='waiting'||s.practice)return;
 if(!s.players.some(real)){delete s.autoStart351;return;}
 if(!s.autoStart351||s.autoStart351.firedAt)s.autoStart351={at:now+AUTO_START_MS,armedAt:now};
}
export function autoStartDue351(s,now){return s.phase==='waiting'&&!s.practice&&!!s.autoStart351&&!s.autoStart351.firedAt&&now>=s.autoStart351.at&&s.players.some(real);}
// Marca la cuenta atrás como usada ANTES de rellenar, para que no se dispare dos veces.
export function fireAutoStart351(s,now){s.autoStart351.firedAt=now;}
// Inicio autorizado por el sistema (mismo formato que el inicio manual de admin1).
export function systemStart351(s,kind,now){s.manualStart172={kind,game:s.id,run:s.runId||null,by:'admin1',user:'sistema',at:now};s.autoStarted351=now;}
// Fin de la cuenta atrás, para el reloj de la partida durante la inscripción.
export function autoDeadline351(s){return s.phase==='waiting'&&s.autoStart351&&!s.autoStart351.firedAt?s.autoStart351.at:null;}
