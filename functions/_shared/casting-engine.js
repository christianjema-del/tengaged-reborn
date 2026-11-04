import * as legacy from './casting-legacy.js';
import * as daily from './casting-daily.js';
export {CHALLENGES,challengeQuestions,alive,KEY_FIRST_MS,KEY_INTERVAL_MS,KEY_LIFETIME_MS,LOBBY_MS,PHASE_MS} from './casting-legacy.js';
export const CAPACITY=20;
export const fresh=daily.fresh;
export function challengeFor(s){return s.rulesVersion>=78?s.selectedChallenge:legacy.challengeFor(s);}
export const freshLegacy=legacy.fresh;
const engine=s=>s.rulesVersion>=78?daily:legacy;
export function advance(s,...args){return engine(s).advance(s,...args);}
export function act(s,...args){return engine(s).act(s,...args);}
export function view(s,...args){const out=engine(s).view(s,...args);if(!out.capacity)out.capacity=16;return out;}
