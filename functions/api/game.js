const CASTING_ID = 1;
const MAX_PLAYERS = 16;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

async function ensureTables(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS game_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      casting_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      action_type TEXT NOT NULL,
      reaction_ms INTEGER,
      vote_target TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(casting_id, username, action_type)
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS game_state (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      casting_id INTEGER NOT NULL UNIQUE,
      phase TEXT DEFAULT 'immunity',
      status TEXT DEFAULT 'active',
      winner_username TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS game_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      casting_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      eliminated_at TEXT,
      UNIQUE(casting_id, username)
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS game_elimination_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      casting_id INTEGER NOT NULL,
      voter_username TEXT NOT NULL,
      target_username TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(casting_id, voter_username)
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS game_eliminations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      casting_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      votes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(casting_id, username)
    )
  `).run();

  let state = await db.prepare(`
    SELECT *
    FROM game_state
    WHERE casting_id = ?
  `).bind(CASTING_ID).first();

  if (!state) {
    await db.prepare(`
      INSERT INTO game_state
        (casting_id, phase, status)
      VALUES
        (?, 'immunity', 'active')
    `).bind(CASTING_ID).run();
  }

  // Sincronizamos jugadores del casting con el juego.
  const players = await db.prepare(`
    SELECT username
    FROM casting_players
    WHERE casting_id = ?
    ORDER BY id ASC
  `).bind(CASTING_ID).all();

  for (const player of players.results || []) {
    await db.prepare(`
      INSERT OR IGNORE INTO game_players
        (casting_id, username, status)
      VALUES
        (?, ?, 'active')
    `).bind(CASTING_ID, player.username).run();
  }
}

async function getState(db) {
  return await db.prepare(`
    SELECT *
    FROM game_state
    WHERE casting_id = ?
  `).bind(CASTING_ID).first();
}

async function getPlayers(db) {
  const result = await db.prepare(`
    SELECT
      gp.username,
      gp.status,
      gp.eliminated_at
    FROM game_players gp
    WHERE gp.casting_id = ?
    ORDER BY
      CASE WHEN gp.status = 'active' THEN 0 ELSE 1 END,
      gp.id ASC
  `).bind(CASTING_ID).all();

  return result.results || [];
}

async function getActivePlayers(db) {
  const result = await db.prepare(`
    SELECT username
    FROM game_players
    WHERE casting_id = ?
      AND status = 'active'
    ORDER BY id ASC
  `).bind(CASTING_ID).all();

  return result.results || [];
}

async function getImmunityData(db) {
  const rankingResult = await db.prepare(`
    SELECT
      username,
      reaction_ms
    FROM game_actions
    WHERE casting_id = ?
      AND action_type = 'immunity'
      AND reaction_ms IS NOT NULL
    ORDER BY reaction_ms ASC
  `).bind(CASTING_ID).all();

  const ranking = rankingResult.results || [];

  const pendingResult = await db.prepare(`
    SELECT gp.username
    FROM game_players gp
    LEFT JOIN game_actions ga
      ON ga.casting_id = gp.casting_id
      AND ga.username = gp.username
      AND ga.action_type = 'immunity'
      AND ga.reaction_ms IS NOT NULL
    WHERE gp.casting_id = ?
      AND gp.status = 'active'
      AND ga.username IS NULL
    ORDER BY gp.id ASC
  `).bind(CASTING_ID).all();

  const pending = (pendingResult.results || []).map(x => x.username);

  const winner = ranking.length > 0 ? ranking[0].username : null;

  return {
    ranking,
    pending,
    winner
  };
}

async function getNominationData(db) {
  const result = await db.prepare(`
    SELECT
      gp.username,
      COUNT(ga.id) AS votes
    FROM game_players gp
    LEFT JOIN game_actions ga
      ON ga.casting_id = gp.casting_id
      AND ga.action_type = 'vote'
      AND ga.vote_target = gp.username
    WHERE gp.casting_id = ?
      AND gp.status = 'active'
    GROUP BY gp.username
    ORDER BY votes DESC, gp.username ASC
  `).bind(CASTING_ID).all();

  const ranking = result.results || [];

  const maxVotes =
    ranking.length > 0
      ? Number(ranking[0].votes || 0)
      : 0;

  const nominees =
    maxVotes > 0
      ? ranking
          .filter(player => Number(player.votes || 0) === maxVotes)
          .map(player => player.username)
      : [];

  const totalResult = await db.prepare(`
    SELECT COUNT(*) AS total
    FROM game_actions
    WHERE casting_id = ?
      AND action_type = 'vote'
  `).bind(CASTING_ID).first();

  const totalVotes = Number(totalResult?.total || 0);

  const activePlayers = await getActivePlayers(db);

  return {
    ranking,
    nominees,
    maxVotes,
    totalVotes,
    expectedVotes: activePlayers.length
  };
}

async function getEliminationData(db) {
  const nomination = await getNominationData(db);

  const voteResult = await db.prepare(`
    SELECT
      target_username,
      COUNT(*) AS votes
    FROM game_elimination_votes
    WHERE casting_id = ?
    GROUP BY target_username
    ORDER BY votes DESC, target_username ASC
  `).bind(CASTING_ID).all();

  const voteRanking = voteResult.results || [];

  const totalResult = await db.prepare(`
    SELECT COUNT(*) AS total
    FROM game_elimination_votes
    WHERE casting_id = ?
  `).bind(CASTING_ID).first();

  const totalVotes = Number(totalResult?.total || 0);

  const activePlayers = await getActivePlayers(db);

  const eliminationsResult = await db.prepare(`
    SELECT
      username,
      votes,
      created_at
    FROM game_eliminations
    WHERE casting_id = ?
    ORDER BY id DESC
  `).bind(CASTING_ID).all();

  const eliminations = eliminationsResult.results || [];

  let currentEliminated = null;

  if (eliminations.length > 0) {
    currentEliminated = eliminations[0];
  }

  return {
    nominees: nomination.nominees,
    nominationRanking: nomination.ranking,
    voteRanking,
    totalVotes,
    expectedVotes: activePlayers.length,
    eliminations,
    currentEliminated
  };
}

async function migrateFinishedNominations(db, state) {
  if (
    state.phase !== "nominations" ||
    state.status !== "finished"
  ) {
    return state;
  }

  const nomination = await getNominationData(db);

  if (nomination.totalVotes < nomination.expectedVotes) {
    return state;
  }

  await db.prepare(`
    UPDATE game_state
    SET
      phase = 'elimination',
      status = 'active',
      completed_at = CURRENT_TIMESTAMP
    WHERE casting_id = ?
  `).bind(CASTING_ID).run();

  return await getState(db);
}

async function maybeStartElimination(db) {
  const state = await getState(db);

  if (!state) {
    return null;
  }

  if (
    state.phase !== "nominations" ||
    state.status !== "active"
  ) {
    return state;
  }

  const nomination = await getNominationData(db);

  if (
    nomination.expectedVotes > 0 &&
    nomination.totalVotes >= nomination.expectedVotes
  ) {
    await db.prepare(`
      UPDATE game_state
      SET
        phase = 'elimination',
        status = 'active',
        completed_at = CURRENT_TIMESTAMP
      WHERE casting_id = ?
    `).bind(CASTING_ID).run();

    return await getState(db);
  }

  return state;
}

async function maybeFinishElimination(db) {
  const state = await getState(db);

  if (
    !state ||
    state.phase !== "elimination" ||
    state.status !== "active"
  ) {
    return state;
  }

  const nomination = await getNominationData(db);

  if (nomination.nominees.length === 0) {
    return state;
  }

  // Si solo hay un nominado, queda eliminado automáticamente.
  if (nomination.nominees.length === 1) {
    const username = nomination.nominees[0];

    const alreadyEliminated = await db.prepare(`
      SELECT *
      FROM game_eliminations
      WHERE casting_id = ?
        AND username = ?
    `).bind(CASTING_ID, username).first();

    if (!alreadyEliminated) {
      await db.prepare(`
        INSERT INTO game_eliminations
          (casting_id, username, votes)
        VALUES
          (?, ?, ?)
      `).bind(
        CASTING_ID,
        username,
        nomination.maxVotes
      ).run();
    }

    await db.prepare(`
      UPDATE game_players
      SET
        status = 'eliminated',
        eliminated_at = CURRENT_TIMESTAMP
      WHERE casting_id = ?
        AND username = ?
    `).bind(CASTING_ID, username).run();

    await db.prepare(`
      UPDATE game_state
      SET
        status = 'finished',
        completed_at = CURRENT_TIMESTAMP
      WHERE casting_id = ?
    `).bind(CASTING_ID).run();

    return await getState(db);
  }

  const eliminationVotes = await db.prepare(`
    SELECT COUNT(*) AS total
    FROM game_elimination_votes
    WHERE casting_id = ?
  `).bind(CASTING_ID).first();

  const totalVotes = Number(eliminationVotes?.total || 0);

  const activePlayers = await getActivePlayers(db);
  const expectedVotes = activePlayers.length;

  if (
    expectedVotes === 0 ||
    totalVotes < expectedVotes
  ) {
    return state;
  }

  const rankingResult = await db.prepare(`
    SELECT
      target_username,
      COUNT(*) AS votes
    FROM game_elimination_votes
    WHERE casting_id = ?
      AND target_username IN (
        SELECT username
        FROM game_players
        WHERE casting_id = ?
          AND status = 'active'
      )
    GROUP BY target_username
    ORDER BY votes DESC
  `).bind(CASTING_ID, CASTING_ID).all();

  const ranking = rankingResult.results || [];

  if (ranking.length === 0) {
    return state;
  }

  const highest = Number(ranking[0].votes || 0);

  let tied = ranking.filter(
    row => Number(row.votes || 0) === highest
  );

  // Solo los nominados pueden ser eliminados.
  tied = tied.filter(
    row => nomination.nominees.includes(row.target_username)
  );

  if (tied.length === 0) {
    return state;
  }

  let eliminatedUsername = tied[0].target_username;

  // Desempate:
  // 1. más votos de nominación
  // 2. peor tiempo de inmunidad
  // 3. orden de ID
  if (tied.length > 1) {
    const immunity = await getImmunityData(db);

    const nominationMap = new Map(
      nomination.ranking.map(row => [
        row.username,
        Number(row.votes || 0)
      ])
    );

    const immunityMap = new Map(
      immunity.ranking.map(row => [
        row.username,
        Number(row.reaction_ms || 999999)
      ])
    );

    const castingIds = await db.prepare(`
      SELECT id, username
      FROM casting_players
      WHERE casting_id = ?
    `).bind(CASTING_ID).all();

    const idMap = new Map(
      (castingIds.results || []).map(row => [
        row.username,
        Number(row.id)
      ])
    );

    tied.sort((a, b) => {
      const nominationA =
        nominationMap.get(a.target_username) || 0;

      const nominationB =
        nominationMap.get(b.target_username) || 0;

      if (nominationA !== nominationB) {
        return nominationB - nominationA;
      }

      const immunityA =
        immunityMap.get(a.target_username) || 999999;

      const immunityB =
        immunityMap.get(b.target_username) || 999999;

      if (immunityA !== immunityB) {
        return immunityB - immunityA;
      }

      return (
        (idMap.get(b.target_username) || 0) -
        (idMap.get(a.target_username) || 0)
      );
    });

    eliminatedUsername = tied[0].target_username;
  }

  const alreadyEliminated = await db.prepare(`
    SELECT *
    FROM game_eliminations
    WHERE casting_id = ?
      AND username = ?
  `).bind(
    CASTING_ID,
    eliminatedUsername
  ).first();

  if (!alreadyEliminated) {
    await db.prepare(`
      INSERT INTO game_eliminations
        (casting_id, username, votes)
      VALUES
        (?, ?, ?)
    `).bind(
      CASTING_ID,
      eliminatedUsername,
      highest
    ).run();
  }

  await db.prepare(`
    UPDATE game_players
    SET
      status = 'eliminated',
      eliminated_at = CURRENT_TIMESTAMP
    WHERE casting_id = ?
      AND username = ?
  `).bind(
    CASTING_ID,
    eliminatedUsername
  ).run();

  await db.prepare(`
    UPDATE game_state
    SET
      status = 'finished',
      completed_at = CURRENT_TIMESTAMP
    WHERE casting_id = ?
  `).bind(CASTING_ID).run();

  return await getState(db);
}

async function getGameData(db) {
  let state = await getState(db);

  state = await migrateFinishedNominations(db, state);
  state = await maybeStartElimination(db);
  state = await maybeFinishElimination(db);

  const players = await getPlayers(db);
  const immunity = await getImmunityData(db);
  const nominations = await getNominationData(db);
  const elimination = await getEliminationData(db);

  const room = await db.prepare(`
    SELECT *
    FROM casting_rooms
    WHERE casting_id = ?
  `).bind(CASTING_ID).first();

  return {
    ok: true,
    room,
    state,
    phase: state?.phase || "immunity",
    status: state?.status || "active",

    players,
    maxPlayers: MAX_PLAYERS,

    immunity,
    ranking: immunity.ranking,
    pending: immunity.pending,
    immunityWinner: immunity.winner,

    nominations,
    nominationRanking: nominations.ranking,
    nominees: nominations.nominees,
    nominationVotes: nominations.totalVotes,
    expectedNominationVotes: nominations.expectedVotes,

    elimination,
    eliminationRanking: elimination.voteRanking,
    eliminationVotes: elimination.totalVotes,
    expectedEliminationVotes: elimination.expectedVotes,
    eliminated: elimination.currentEliminated
  };
}

async function handleGet(db) {
  return json(await getGameData(db));
}

async function handlePost(db, request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return json({
      ok: false,
      message: "JSON inválido."
    }, 400);
  }

  const username = String(body?.username || "").trim();

  if (!username) {
    return json({
      ok: false,
      message: "Falta el usuario."
    }, 400);
  }

  let state = await getState(db);

  state = await migrateFinishedNominations(db, state);
  state = await maybeStartElimination(db);

  // =========================
  // INMUNIDAD
  // =========================
  if (state.phase === "immunity") {
    const reaction = Number(body?.reaction_ms);

    if (
      !Number.isFinite(reaction) ||
      reaction < 100 ||
      reaction > 10000
    ) {
      return json({
        ok: false,
        message: "Tiempo de reacción inválido."
      }, 400);
    }

    const player = await db.prepare(`
      SELECT *
      FROM game_players
      WHERE casting_id = ?
        AND username = ?
        AND status = 'active'
    `).bind(
      CASTING_ID,
      username
    ).first();

    if (!player) {
      return json({
        ok: false,
        message: "No estás en la partida."
      }, 403);
    }

    const existing = await db.prepare(`
      SELECT *
      FROM game_actions
      WHERE casting_id = ?
        AND username = ?
        AND action_type = 'immunity'
    `).bind(
      CASTING_ID,
      username
    ).first();

    if (
      existing &&
      existing.reaction_ms !== null &&
      Number(existing.reaction_ms) >= 100 &&
      Number(existing.reaction_ms) <= 10000
    ) {
      return json({
        ok: false,
        message: "Ya has completado la prueba."
      }, 409);
    }

    if (existing) {
      await db.prepare(`
        UPDATE game_actions
        SET
          reaction_ms = ?,
          created_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        reaction,
        existing.id
      ).run();
    } else {
      await db.prepare(`
        INSERT INTO game_actions
          (casting_id, username, action_type, reaction_ms)
        VALUES
          (?, ?, 'immunity', ?)
      `).bind(
        CASTING_ID,
        username,
        reaction
      ).run();
    }

    const immunity = await getImmunityData(db);
    const activePlayers = await getActivePlayers(db);

    if (
      immunity.ranking.length >= activePlayers.length &&
      activePlayers.length > 0
    ) {
      const winner = immunity.ranking[0].username;

      await db.prepare(`
        UPDATE game_state
        SET
          phase = 'nominations',
          status = 'active',
          winner_username = ?,
          completed_at = CURRENT_TIMESTAMP
        WHERE casting_id = ?
      `).bind(
        winner,
        CASTING_ID
      ).run();
    }

    return json(await getGameData(db));
  }

  // =========================
  // NOMINACIONES
  // =========================
  if (state.phase === "nominations") {
    if (state.status !== "active") {
      return json({
        ok: false,
        message: "La fase de nominaciones ya terminó."
      }, 400);
    }

    const voteTarget = String(
      body?.vote_target || ""
    ).trim();

    if (!voteTarget) {
      return json({
        ok: false,
        message: "Selecciona a quién votar."
      }, 400);
    }

    const voter = await db.prepare(`
      SELECT *
      FROM game_players
      WHERE casting_id = ?
        AND username = ?
        AND status = 'active'
    `).bind(
      CASTING_ID,
      username
    ).first();

    if (!voter) {
      return json({
        ok: false,
        message: "No estás activo en la partida."
      }, 403);
    }

    if (username === voteTarget) {
      return json({
        ok: false,
        message: "No puedes votarte a ti mismo."
      }, 400);
    }

    const target = await db.prepare(`
      SELECT *
      FROM game_players
      WHERE casting_id = ?
        AND username = ?
        AND status = 'active'
    `).bind(
      CASTING_ID,
      voteTarget
    ).first();

    if (!target) {
      return json({
        ok: false,
        message: "Ese jugador no está activo."
      }, 400);
    }

    if (state.winner_username === voteTarget) {
      return json({
        ok: false,
        message: "El ganador de inmunidad no puede recibir votos."
      }, 400);
    }

    const existing = await db.prepare(`
      SELECT *
      FROM game_actions
      WHERE casting_id = ?
        AND username = ?
        AND action_type = 'vote'
    `).bind(
      CASTING_ID,
      username
    ).first();

    if (existing) {
      return json({
        ok: false,
        message: "Ya has votado."
      }, 409);
    }

    await db.prepare(`
      INSERT INTO game_actions
        (casting_id, username, action_type, vote_target)
      VALUES
        (?, ?, 'vote', ?)
    `).bind(
      CASTING_ID,
      username,
      voteTarget
    ).run();

    await maybeStartElimination(db);

    return json(await getGameData(db));
  }

  // =========================
  // ELIMINACIÓN
  // =========================
  if (state.phase === "elimination") {
    if (state.status !== "active") {
      return json({
        ok: false,
        message: "La eliminación ya terminó."
      }, 400);
    }

    const voteTarget = String(
      body?.elimination_target || ""
    ).trim();

    if (!voteTarget) {
      return json({
        ok: false,
        message: "Selecciona un nominado."
      }, 400);
    }

    const activePlayer = await db.prepare(`
      SELECT *
      FROM game_players
      WHERE casting_id = ?
        AND username = ?
        AND status = 'active'
    `).bind(
      CASTING_ID,
      username
    ).first();

    if (!activePlayer) {
      return json({
        ok: false,
        message: "No estás activo en la partida."
      }, 403);
    }

    if (username === voteTarget) {
      return json({
        ok: false,
        message: "No puedes votarte a ti mismo."
      }, 400);
    }

    const nomination = await getNominationData(db);

    if (!nomination.nominees.includes(voteTarget)) {
      return json({
        ok: false,
        message: "Solo puedes votar a un nominado."
      }, 400);
    }

    const existing = await db.prepare(`
      SELECT *
      FROM game_elimination_votes
      WHERE casting_id = ?
        AND voter_username = ?
    `).bind(
      CASTING_ID,
      username
    ).first();

    if (existing) {
      return json({
        ok: false,
        message: "Ya has votado en la eliminación."
      }, 409);
    }

    await db.prepare(`
      INSERT INTO game_elimination_votes
        (casting_id, voter_username, target_username)
      VALUES
        (?, ?, ?)
    `).bind(
      CASTING_ID,
      username,
      voteTarget
    ).run();

    await maybeFinishElimination(db);

    return json(await getGameData(db));
  }

  return json({
    ok: false,
    message: "Fase de juego desconocida."
  }, 400);
}

export async function onRequest(context) {
  const db = context.env.DB;

  if (!db) {
    return json({
      ok: false,
      message: "No se encontró el binding DB."
    }, 500);
  }

  try {
    await ensureTables(db);

    const method = context.request.method.toUpperCase();

    if (method === "GET") {
      return await handleGet(db);
    }

    if (method === "POST") {
      return await handlePost(db, context.request);
    }

    return json({
      ok: false,
      message: "Método no permitido."
    }, 405);

  } catch (error) {
    console.error("GAME API ERROR:", error);

    return json({
      ok: false,
      message: "Error interno del juego.",
      error: String(error?.message || error)
    }, 500);
  }
}
