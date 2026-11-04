// A zero-health eater hit by arrows remains a survivor until their grace ends.
export const isHungerAlive=p=>!!p&&(p.health>0||!!p.arrowDeathPending&&!p.eliminatedAt);
