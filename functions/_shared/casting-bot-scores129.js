// Conservative simulated ranges in each original game's scoring units.
const ranges={wheel:[50,300],numbers:[50,400],deal:[500,20000],match:[100,1500],guitar:[50,500],endurance:[100,600],maze:[40,250],snow:[20,200],words:[20,200],line:[50,500]};
export function castingBotScore(kind,duration,random=n=>crypto.getRandomValues(new Uint32Array(1))[0]%n){const [min,max]=ranges[kind]||[20,200];return Math.round((min+random(max-min+1))*Math.max(1,Math.min(1.5,Number(duration)/100||1)));}
