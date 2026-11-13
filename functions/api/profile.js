import {reconcilePrevious161} from '../_shared/casting-service.js';
import {playedCount148} from '../_shared/played-count148.js';
import {shownPlayed336} from '../_shared/admin-extra336.js';
import {withStorageGuard} from '../_shared/storage-guard141.js';
import {expireModeration} from '../_shared/moderation.js';
import { ensureProfileSchema, jsonError } from "../_shared/auth.js";
import { ensureCommunitySchema } from "../_shared/community.js";
import { getSessionUser } from "../_shared/auth.js";
import { ensureCastingSchema } from "../_shared/casting.js";
import { ensureGameHistorySchema } from "../_shared/games.js";

async function handle141_onRequest({ request, env }) {
  if (!env.DB) return jsonError("La base de datos no está disponible.", 503);
  try {
    await ensureProfileSchema(env.DB);await expireModeration(env.DB);
    await ensureCommunitySchema(env.DB);
    await ensureCastingSchema(env.DB);
    await ensureGameHistorySchema(env.DB);if(request.method==="GET")await reconcilePrevious161(env.DB);
    if (request.method === "PUT") {
      if(request.headers.get("Origin")!==new URL(request.url).origin)return jsonError("Origen no permitido.",403);
      const viewer = await getSessionUser(request, env.DB);
    // Schema is also initialized by the auth service on older installations.
      if (!viewer) return jsonError("Inicia sesión para editar el perfil.", 401);
      const body = await request.json().catch(() => ({}));
      let updatedBio = false;
      let updatedAvatar = false;
      if (Object.prototype.hasOwnProperty.call(body, "bio")) {
        const bio = String(body.bio || "").trim();
        if (bio.length > 1000) return jsonError("La descripción no puede superar 1.000 caracteres.", 400);
        await env.DB.prepare("UPDATE users SET bio=? WHERE id=?").bind(bio, viewer.id).run();
        updatedBio = true;
      }
      if (Object.prototype.hasOwnProperty.call(body, "avatar_code")) {
        const avatarCode = String(body.avatar_code || "");
        const allowedAvatars = new Set(["classic-blue", "classic-rose", "classic-gold", "classic-mint", "classic-lilac", "classic-sunset", "classic-ocean", "classic-coral"]);
        if (!allowedAvatars.has(avatarCode)) return jsonError("El avatar seleccionado no está disponible.", 400);
        const avatar = await env.DB.prepare("SELECT code FROM shop_items WHERE category='Avatares' AND theme_code=? AND price=0 LIMIT 1").bind(avatarCode).first();
        if (!avatar) return jsonError("No se pudo encontrar ese avatar.", 404);
        await env.DB.batch([
          env.DB.prepare("UPDATE user_inventory SET is_equipped=0 WHERE user_id=? AND item_code IN (SELECT code FROM shop_items WHERE category='Avatares')").bind(viewer.id),
          env.DB.prepare("INSERT OR IGNORE INTO user_inventory(user_id,item_code) VALUES(?,?)").bind(viewer.id, avatar.code),
          env.DB.prepare("UPDATE user_inventory SET is_equipped=1 WHERE user_id=? AND item_code=?").bind(viewer.id, avatar.code)
        ]);
        updatedAvatar = true;
      }
      if (!updatedBio && !updatedAvatar) return jsonError("No hay cambios de perfil para guardar.", 400);
      const message = updatedBio && updatedAvatar ? "Perfil y avatar actualizados." : updatedAvatar ? "Avatar actualizado." : "Perfil actualizado.";
      return Response.json({ ok: true, message });
    }
    if (request.method !== "GET") return jsonError("Método no permitido.", 405);
    const username = String(new URL(request.url).searchParams.get("username") || "").trim();
    if (!username) return jsonError("Falta el usuario.", 400);
    const viewer = await getSessionUser(request, env.DB);
    // Schema is also initialized by the auth service on older installations.

    // Optional statistics vary between older installations. Only interpolate
    // fixed, inspected column names; usernames remain bound parameters.
    const [statsInfo,usersInfo]=await Promise.all([
      env.DB.prepare('PRAGMA table_info(user_stats)').all(),
      env.DB.prepare('PRAGMA table_info(users)').all()
    ]);
    const statsColumns=new Set((statsInfo.results||[]).map(c=>c.name));
    const userColumns=new Set((usersInfo.results||[]).map(c=>c.name));
    const hasStats=statsColumns.has('username');
    const played=hasStats&&statsColumns.has('games_played')?'COALESCE(s.games_played,0)':'0';
    const wins=hasStats&&statsColumns.has('wins')?'COALESCE(s.wins,0)':'0';
    const seen=userColumns.has('last_seen_at')?'u.last_seen_at':'NULL';
    const created=userColumns.has('created_at')?(hasStats&&statsColumns.has('created_at')?'COALESCE(u.created_at,s.created_at)':'u.created_at'):hasStats&&statsColumns.has('created_at')?'s.created_at':'NULL';
    let profile = await env.DB.prepare(`
      SELECT u.id AS user_id, u.username, u.karma, u.t_money, u.is_admin, u.is_moderator, u.is_system, u.is_banned, u.is_test_bot, u.ban_reason, u.bio, u.ban_until,u.red_nose_until,u.red_nose_reason,
             ${played} AS games_played, ${wins} AS wins, ${created} AS created_at, ${seen} AS last_seen_at, COALESCE(custom.theme_code,equipped.theme_code) AS theme_code, color.theme_code AS color_code,
             COALESCE(avatar.theme_code,'classic-blue') AS avatar_code,
             COALESCE((SELECT r.health FROM casting_resources r WHERE r.casting_id=1 AND LOWER(r.username)=LOWER(u.username)),0) AS casting_health
      FROM users u
      ${hasStats?'LEFT JOIN user_stats s ON LOWER(s.username)=LOWER(u.username)':''}
      LEFT JOIN user_inventory inventory ON inventory.user_id=u.id AND inventory.is_equipped=1
        AND inventory.item_code IN (SELECT code FROM shop_items WHERE category='Diseños de perfil')
      LEFT JOIN shop_items equipped ON equipped.code=inventory.item_code AND equipped.category='Diseños de perfil'
      LEFT JOIN user_inventory custom_inventory ON custom_inventory.user_id=u.id AND custom_inventory.is_equipped=1 AND custom_inventory.item_code IN (SELECT 'userdesign-' || id FROM community_designs WHERE layer_type='profile')
      LEFT JOIN community_designs custom ON ('userdesign-' || custom.id)=custom_inventory.item_code
      LEFT JOIN user_inventory avatar_inventory ON avatar_inventory.user_id=u.id AND avatar_inventory.is_equipped=1
        AND avatar_inventory.item_code IN (SELECT code FROM shop_items WHERE category='Avatares')
      LEFT JOIN shop_items avatar ON avatar.code=avatar_inventory.item_code AND avatar.category='Avatares'
      LEFT JOIN user_inventory color_inventory ON color_inventory.user_id=u.id AND color_inventory.is_equipped=1
        AND color_inventory.item_code IN (SELECT code FROM shop_items WHERE category='Tarjetas de color')
      LEFT JOIN shop_items color ON color.code=color_inventory.item_code AND color.category='Tarjetas de color'
      WHERE LOWER(u.username) = LOWER(?)
      LIMIT 1
    `).bind(username).first();

    // Older casting entries can predate registered user accounts. Keep their
    // public profile links working using the participant record and its game
    // resources; registered accounts always take precedence above.
    if (!profile) {
      const participant = await env.DB.prepare(`
        SELECT p.username, p.joined_at,
               COALESCE(r.health,100) AS casting_health
        FROM casting_players p
        LEFT JOIN casting_resources r
          ON r.casting_id=p.casting_id AND LOWER(r.username)=LOWER(p.username)
        WHERE p.casting_id=1 AND LOWER(p.username)=LOWER(?)
        ORDER BY p.id DESC LIMIT 1
      `).bind(username).first();
      if (!participant) return jsonError("No existe ese perfil.", 404);
      profile = {
        ...participant,
        karma: 0, t_money: 0, is_admin: 0, is_banned: 0,
        is_test_bot: 0, ban_reason: null, bio: "", theme_code: null,
        avatar_code: "classic-blue", games_played: 0, wins: 0,
        created_at: participant.joined_at
      };
    }
    const isOwner = Boolean(viewer && profile.user_id && Number(viewer.id) === Number(profile.user_id));
    const hasNewCasting=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='casting_matches'").first();
    if (!hasNewCasting) try {
      await env.DB.prepare(`
        INSERT OR IGNORE INTO user_game_history(username,game_type,game_id,status,placement,joined_at,finished_at)
        SELECT gp.username,'CASTING',CAST(gp.casting_id AS TEXT),
               CASE WHEN gs.status='finished' THEN 'finished' WHEN gp.status='eliminated' THEN 'eliminated' ELSE 'active' END,
               CASE WHEN LOWER(gs.winner_username)=LOWER(gp.username) THEN 'Ganador' WHEN gp.status='eliminated' THEN 'Eliminado' ELSE NULL END,
               COALESCE(cp.joined_at,CURRENT_TIMESTAMP),gs.completed_at
        FROM game_players gp
        LEFT JOIN game_state gs ON gs.casting_id=gp.casting_id
        LEFT JOIN casting_players cp ON cp.casting_id=gp.casting_id AND LOWER(cp.username)=LOWER(gp.username)
        WHERE LOWER(gp.username)=LOWER(?)
      `).bind(profile.username).run();
      await env.DB.prepare(`
        UPDATE user_game_history
        SET status=CASE WHEN (SELECT status FROM game_state WHERE casting_id=CAST(game_id AS INTEGER))='finished' THEN 'finished'
                        WHEN EXISTS(SELECT 1 FROM game_players gp WHERE gp.casting_id=CAST(game_id AS INTEGER) AND LOWER(gp.username)=LOWER(user_game_history.username) AND gp.status='eliminated') THEN 'eliminated'
                        ELSE status END,
            placement=CASE WHEN EXISTS(SELECT 1 FROM game_state gs WHERE gs.casting_id=CAST(game_id AS INTEGER) AND LOWER(gs.winner_username)=LOWER(user_game_history.username)) THEN 'Ganador'
                           WHEN status='eliminated' THEN 'Eliminado' ELSE placement END,
            finished_at=COALESCE(finished_at,(SELECT completed_at FROM game_state WHERE casting_id=CAST(game_id AS INTEGER)))
        WHERE game_type='CASTING' AND LOWER(username)=LOWER(?)
      `).bind(profile.username).run();
    } catch (error) {
      if (!/no such (table|column)/i.test(String(error.message || error))) throw error;
      console.warn('Legacy game history unavailable; serving the public profile.');
    }
    const gameHistory = await env.DB.prepare(`
      SELECT game_type, game_id, status, placement, joined_at, finished_at
      FROM user_game_history WHERE LOWER(username)=LOWER(?)
      ORDER BY (status='active') DESC, COALESCE(finished_at,joined_at) DESC, id DESC LIMIT 300
    `).bind(profile.username).all();
    if(hasNewCasting){
      const matches=(await env.DB.prepare('SELECT state FROM casting_matches ORDER BY id DESC LIMIT 60').all()).results;
      let currentHealthFound=false;
      for(const row of matches){const s=JSON.parse(row.state),member=s.players.find(p=>p.username.toLowerCase()===profile.username.toLowerCase());if(!member)continue;
        if(!currentHealthFound&&member.status==='active'&&s.phase!=='finished'){profile.casting_health=Number(member.health);currentHealthFound=true;}
        const entry={game_type:'CASTING',game_id:String(s.id),status:s.phase==='finished'?'finished':member.status==='eliminated'?'eliminated':'active',placement:member.placement===1?'Ganador':member.placement?'Puesto '+member.placement:null,joined_at:Number.isFinite(new Date(s.createdAt).getTime())?new Date(s.createdAt).toISOString():null,created_at:Number.isFinite(new Date(s.createdAt).getTime())?new Date(s.createdAt).toISOString():null,finished_at:s.finishedAt&&Number.isFinite(new Date(s.finishedAt).getTime())?new Date(s.finishedAt).toISOString():null,day:s.phase==='waiting'?0:Number(s.round)||null};
        const i=gameHistory.results.findIndex(x=>x.game_type==='CASTING'&&x.game_id===entry.game_id);if(i>=0)gameHistory.results[i]=entry;else gameHistory.results.unshift(entry);
      }
    }
    // V333: día de juego de las partidas en curso, para las burbujas de «Mis Juegos» (como en Tengaged).
    try{
      const tables={ROOKIES:['rookies_matches','day'],FROOKIES:['frookies_matches','round'],SURVIVOR:['survivor_matches','day'],DUEL:['duel_matches','round'],RACE:['race_matches','leg']};
      for(const [type,[table,field]] of Object.entries(tables)){
        const ids=[...new Set(gameHistory.results.filter(g=>g.game_type===type&&g.status==='active'&&g.day==null).map(g=>Number(g.game_id)).filter(Number.isSafeInteger))].slice(0,20);
        if(!ids.length)continue;
        const rows=(await env.DB.prepare(`SELECT id,json_extract(state,'$.${field}') AS day,json_extract(state,'$.phase') AS phase FROM ${table} WHERE id IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all()).results;
        for(const r of rows)for(const g of gameHistory.results)if(g.game_type===type&&Number(g.game_id)===Number(r.id))g.day=r.phase==='waiting'?0:Number(r.day)||null;
      }
      if(gameHistory.results.some(g=>g.game_type==='HUNGER'&&g.status==='active')){
        const h=await env.DB.prepare("SELECT json_extract(state,'$.edition') AS edition,json_extract(state,'$.phase') AS phase,json_extract(state,'$.startedAt') AS started FROM hunger_arena WHERE id=1").first();
        for(const g of gameHistory.results)if(g.game_type==='HUNGER'&&g.status==='active'&&Number(g.game_id)===Number(h?.edition))g.day=h.phase==='waiting'?0:h.started?Math.floor((Date.now()-Number(h.started))/86400000)+1:null;
      }
    }catch(e){console.warn('Profile game days unavailable',e);}
    const historyDate=item=>{let raw=item.created_at||item.joined_at||item.finished_at;if(typeof raw==='string'&&/^\d{4}-\d{2}-\d{2} /.test(raw))raw=raw.replace(' ','T')+'Z';const value=new Date(raw).getTime();return Number.isFinite(value)?value:0;};
    gameHistory.results.sort((a,b)=>Number(b.status==='active')-Number(a.status==='active')||historyDate(b)-historyDate(a));
    return Response.json({
      ok: true,
      profile: {
        username: profile.username,
        karma: Number(profile.karma) || 0,
        karma_rank: profile.user_id ? Number((await env.DB.prepare('SELECT COUNT(*)+1 AS rank FROM users WHERE COALESCE(is_banned,0)=0 AND COALESCE(is_system,0)=0 AND COALESCE(karma,0)>?').bind(Number(profile.karma)||0).first())?.rank)||null : null,
        t_money: isOwner ? Number(profile.t_money) || 0 : null,
        is_admin: Boolean(profile.is_admin),
        is_moderator: Boolean(profile.is_moderator),
        is_system: Boolean(profile.is_system),
        is_test_bot: Boolean(profile.is_test_bot),
        is_banned: Boolean(profile.is_banned),
        ban_until:profile.ban_until||null,red_nose_until:profile.red_nose_until||null,red_nose_reason:isOwner||viewer?.is_admin?profile.red_nose_reason||null:null,
        ban_reason: profile.is_banned ? (profile.ban_reason || "Sin motivo especificado") : null,
        bio: profile.bio || "",
        theme_code: profile.theme_code || "default",
        avatar_code: profile.avatar_code || "default",
        color_code: profile.color_code || "",
        casting_health: isOwner ? Number(profile.casting_health) || 0 : null,
        games_played: profile.user_id?(await shownPlayed336(env.DB,{id:profile.user_id,username:profile.username})).shown:await playedCount148(env.DB,profile.username),
        wins: Number(profile.wins) || 0,
        created_at: profile.created_at || null,
        last_seen_at: profile.last_seen_at || null,
        games: gameHistory.results || []
      }
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Profile lookup failed", error);
    return jsonError("No se pudo cargar el perfil.", 500);
  }
}

export async function onRequest(context){return withStorageGuard(context,handle141_onRequest);}
