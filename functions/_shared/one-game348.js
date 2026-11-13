// V348: no puedes estar en dos partidas del mismo juego a la vez. Para entrar en otra tienes que haber
// terminado, haber sido eliminado o que te expulsen de la que tienes en curso.
export const ONE_GAME348={rookies:['rookies_matches','Rookies'],frookies:['frookies_matches','Frookies'],duel:['duel_matches','El Duelo'],survivor:['survivor_matches','Survivor'],race:['race_matches','Race']};
export async function activeGame348(db,kind,userId,exceptId=null){
 const [table]=ONE_GAME348[kind]||[];if(!table||!Number.isSafeInteger(Number(userId)))return null;
 try{return await db.prepare(`SELECT id FROM ${table} WHERE id<>? AND COALESCE(json_extract(state,'$.phase'),'')<>'finished' AND EXISTS(SELECT 1 FROM json_each(state,'$.players') p WHERE json_extract(p.value,'$.id')=? AND COALESCE(json_extract(p.value,'$.status'),'active') NOT IN ('eliminated','finished')) ORDER BY id LIMIT 1`).bind(Number(exceptId)||0,Number(userId)).first();}
 catch(e){if(/no such table/i.test(String(e?.message||e)))return null;throw e;}
}
export async function assertOneGame348(db,kind,userId,matchId){
 const row=await activeGame348(db,kind,userId,matchId);
 if(row)throw Error(`Ya estás inscrito en ${ONE_GAME348[kind][1]} #${row.id}. No puedes jugar dos partidas a la vez: primero tiene que terminar, que te eliminen o que te expulsen de esa.`);
}
