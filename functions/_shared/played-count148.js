// Count memberships, not payouts. Canonical type+edition deduplicates current/archive/history.
export async function playedCount148(db,username){
 const names=new Set((await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('user_game_history','casting_matches','frookies_matches','hunger_arena','hunger_history','casting_players')").all()).results.map(r=>r.name));
 const selects=[],args=[];
 if(names.has('user_game_history')){selects.push("SELECT upper(trim(game_type)) AS kind,CAST(game_id AS TEXT) AS edition FROM user_game_history WHERE lower(username)=lower(?)");args.push(username);}
 for(const [table,kind,id] of [['casting_matches','CASTING',"CAST(m.id AS TEXT)"],['frookies_matches','FROOKIES',"CAST(m.id AS TEXT)"],['hunger_arena','HUNGER',"CAST(json_extract(m.state,'$.edition') AS TEXT)"],['hunger_history','HUNGER',"CAST(m.edition AS TEXT)"]])if(names.has(table)){
  selects.push(`SELECT '${kind}' AS kind,${id} AS edition FROM ${table} m,json_each(m.state,'$.players') p WHERE lower(json_extract(p.value,'$.username'))=lower(?)`);args.push(username);
 }
 if(!names.has('casting_matches')&&names.has('casting_players')){selects.push("SELECT 'CASTING' AS kind,CAST(casting_id AS TEXT) AS edition FROM casting_players WHERE lower(username)=lower(?)");args.push(username);}
 if(!selects.length)return 0;
 return Number((await db.prepare('SELECT COUNT(*) AS total FROM (SELECT DISTINCT kind,edition FROM ('+selects.join(' UNION ')+') WHERE edition IS NOT NULL)').bind(...args).first())?.total)||0;
}
