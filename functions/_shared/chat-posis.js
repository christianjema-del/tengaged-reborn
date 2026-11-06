// Positivos de Casting y Rookies: +1 da 10, y cada positivo mas duplica (+2=20, +3=40...).
// El tercer comentario seguido de un mismo usuario, y los siguientes, se consideran spam y no suman.
export const SPAM_STREAK=3;
export const commentPosis=score=>score>0?10*2**Math.min(score-1,20):0;
// Quita de la lista los comentarios que cuentan como spam.
export function validComments(rows,idOf=r=>r.user_id){
 let last=null,streak=0;
 return rows.filter(row=>{const id=idOf(row);streak=id===last?streak+1:1;last=id;return streak<SPAM_STREAK;});
}
export function totalPosis(rows,idOf=r=>r.user_id){
 const totals=new Map(rows.map(row=>[idOf(row),0]));
 for(const row of validComments(rows,idOf)){const id=idOf(row);totals.set(id,totals.get(id)+commentPosis(Number(row.score)||0));}
 return totals;
}
export async function roomPosis(db,room){
 const rows=(await db.prepare('SELECT c.id,c.user_id,u.username,c.created_at,COALESCE(SUM(v.value),0) AS score FROM game_chat c JOIN users u ON u.id=c.user_id LEFT JOIN game_chat_votes v ON v.message_id=c.id AND v.user_id<>c.user_id WHERE c.room=? GROUP BY c.id,c.user_id,u.username,c.created_at ORDER BY c.id').bind(room).all()).results;
 return {rows,totals:totalPosis(rows)};
}
