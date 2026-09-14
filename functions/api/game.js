const CASTING_ID = 1;
const MAX_PLAYERS = 16;

function response(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

async function createTables(db) {

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
      VALUES (?, 'immunity', 'active')
    `).bind(CASTING_ID).run();
  }

  // Copiar jugadores actuales al sistema de juego.
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
      VALUES (?, ?, 'active')
    `).bind(
      CASTING_ID,
      player.username
    ).run();

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
      username,
      status,
      eliminated_at
    FROM game_players
    WHERE casting_id = ?
    ORDER BY id ASC
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


async function getImmunity(db) {

  const result = await db.prepare(`
    SELECT
      username,
      reaction_ms
    FROM game_actions
    WHERE casting_id = ?
      AND action_type = 'immunity'
      AND reaction_ms IS NOT NULL
    ORDER BY reaction_ms ASC
  `).bind(CASTING_ID).all();

  const ranking = result.results || [];

  const activePlayers =
    await getActivePlayers(db);

  const pending = [];

  for (const player of activePlayers) {

    const done = await db.prepare(`
      SELECT id
      FROM game_actions
      WHERE casting_id = ?
        AND username = ?
        AND action_type = 'immunity'
        AND reaction_ms IS NOT NULL
    `).bind(
      CASTING_ID,
      player.username
    ).first();

    if (!done) {
      pending.push(player.username);
    }

  }

  return {
    ranking,
    pending,
    winner:
      ranking.length > 0
        ? ranking[0].username
        : null
  };
}


async function getNominations(db) {

  const activePlayers =
    await getActivePlayers(db);

  const ranking = [];

  for (const player of activePlayers) {

    const result = await db.prepare(`
      SELECT COUNT(*) AS votes
      FROM game_actions
      WHERE casting_id = ?
        AND action_type = 'vote'
        AND vote_target = ?
    `).bind(
      CASTING_ID,
      player.username
    ).first();

    ranking.push({
      username: player.username,
      votes: Number(result?.votes || 0)
    });

  }

  ranking.sort(
    (a, b) => b.votes - a.votes
  );

  const maxVotes =
    ranking.length
      ? ranking[0].votes
      : 0;

  const nominees =
    maxVotes > 0
      ? ranking
          .filter(
            p => p.votes === maxVotes
          )
          .map(
            p => p.username
          )
      : [];

  const voteResult =
    await db.prepare(`
      SELECT COUNT(*) AS total
      FROM game_actions
      WHERE casting_id = ?
        AND action_type = 'vote'
    `).bind(CASTING_ID).first();

  return {
    ranking,
    nominees,
    maxVotes,
    totalVotes:
      Number(voteResult?.total || 0),
    expectedVotes:
      activePlayers.length
  };
}


async function getElimination(db) {

  const nominations =
    await getNominations(db);

  const result =
    await db.prepare(`
      SELECT
        target_username,
        COUNT(*) AS votes
      FROM game_elimination_votes
      WHERE casting_id = ?
      GROUP BY target_username
      ORDER BY votes DESC
    `).bind(CASTING_ID).all();

  const voteRanking =
    result.results || [];

  const total =
    await db.prepare(`
      SELECT COUNT(*) AS total
      FROM game_elimination_votes
      WHERE casting_id = ?
    `).bind(CASTING_ID).first();

  const eliminations =
    await db.prepare(`
      SELECT
        username,
        votes,
        created_at
      FROM game_eliminations
      WHERE casting_id = ?
      ORDER BY id DESC
    `).bind(CASTING_ID).all();

  return {
    nominees:
      nominations.nominees,

    nominationRanking:
      nominations.ranking,

    voteRanking,

    totalVotes:
      Number(total?.total || 0),

    expectedVotes:
      (await getActivePlayers(db)).length,

    eliminations:
      eliminations.results || [],

    currentEliminated:
      eliminations.results?.[0] || null
  };
}


async function checkTransitions(db) {

  let state =
    await getState(db);

  if (!state) {
    return null;
  }

  // --------------------------
  // Nominaciones terminadas
  // --------------------------

  if (
    state.phase === "nominations" &&
    state.status === "active"
  ) {

    const nominations =
      await getNominations(db);

    if (
      nominations.totalVotes >=
      nominations.expectedVotes &&
      nominations.expectedVotes > 0
    ) {

      await db.prepare(`
        UPDATE game_state
        SET
          phase = 'elimination',
          status = 'active',
          completed_at = CURRENT_TIMESTAMP
        WHERE casting_id = ?
      `).bind(CASTING_ID).run();

    }

  }

  // --------------------------
  // Compatibilidad con versión anterior
  // --------------------------

  if (
    state.phase === "nominations" &&
    state.status === "finished"
  ) {

    const nominations =
      await getNominations(db);

    if (
      nominations.totalVotes >=
      nominations.expectedVotes
    ) {

      await db.prepare(`
        UPDATE game_state
        SET
          phase = 'elimination',
          status = 'active'
        WHERE casting_id = ?
      `).bind(CASTING_ID).run();

    }

  }

  return await getState(db);
}


async function getGame(db) {

  let state =
    await checkTransitions(db);

  const players =
    await getPlayers(db);

  const immunity =
    await getImmunity(db);

  const nominations =
    await getNominations(db);

  const elimination =
    await getElimination(db);

  const room =
    await db.prepare(`
      SELECT *
      FROM casting_rooms
      WHERE casting_id = ?
    `).bind(CASTING_ID).first();

  return {
    ok: true,

    room,

    state,

    phase:
      state?.phase || "immunity",

    status:
      state?.status || "active",

    players,

    maxPlayers: MAX_PLAYERS,

    immunity,

    ranking:
      immunity.ranking,

    pending:
      immunity.pending,

    immunityWinner:
      immunity.winner,

    nominations,

    nominationRanking:
      nominations.ranking,

    nominees:
      nominations.nominees,

    nominationVotes:
      nominations.totalVotes,

    expectedNominationVotes:
      nominations.expectedVotes,

    elimination,

    eliminationRanking:
      elimination.voteRanking,

    eliminationVotes:
      elimination.totalVotes,

    expectedEliminationVotes:
      elimination.expectedVotes,

    eliminated:
      elimination.currentEliminated
  };
}


// ==========================================
// POST
// ==========================================

async function handlePost(db, request) {

  let body;

  try {
    body = await request.json();
  } catch {
    return response({
      ok:false,
      message:"JSON inválido."
    },400);
  }

  const username =
    String(
      body?.username || ""
    ).trim();

  if (!username) {
    return response({
      ok:false,
      message:"Falta el usuario."
    },400);
  }


  let state =
    await checkTransitions(db);


  // =====================================
  // INMUNIDAD
  // =====================================

  if (state.phase === "immunity") {

    const reaction =
      Number(body?.reaction_ms);

    if (
      !Number.isFinite(reaction) ||
      reaction < 100 ||
      reaction > 10000
    ) {

      return response({
        ok:false,
        message:
          "Tiempo de reacción inválido."
      },400);

    }


    const player =
      await db.prepare(`
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

      return response({
        ok:false,
        message:
          "No estás en la partida."
      },403);

    }


    const existing =
      await db.prepare(`
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
      existing.reaction_ms !== null
    ) {

      return response({
        ok:false,
        message:
          "Ya has completado la prueba."
      },409);

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
        (
          casting_id,
          username,
          action_type,
          reaction_ms
        )
        VALUES (?, ?, 'immunity', ?)
      `).bind(
        CASTING_ID,
        username,
        reaction
      ).run();

    }


    const immunity =
      await getImmunity(db);

    const active =
      await getActivePlayers(db);


    if (
      immunity.ranking.length >=
      active.length
      &&
      active.length > 0
    ) {

      const winner =
        immunity.ranking[0].username;

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


    return response(
      await getGame(db)
    );
  }


  // =====================================
  // NOMINACIONES
  // =====================================

  if (state.phase === "nominations") {

    if (state.status !== "active") {

      return response({
        ok:false,
        message:
          "Las nominaciones ya terminaron."
      },400);

    }


    const target =
      String(
        body?.vote_target || ""
      ).trim();


    if (!target) {

      return response({
        ok:false,
        message:
          "Selecciona un jugador."
      },400);

    }


    const voter =
      await db.prepare(`
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

      return response({
        ok:false,
        message:
          "No estás activo."
      },403);

    }


    if (target === username) {

      return response({
        ok:false,
        message:
          "No puedes votarte a ti mismo."
      },400);

    }


    if (
      target === state.winner_username
    ) {

      return response({
        ok:false,
        message:
          "El ganador de inmunidad está protegido."
      },400);

    }


    const targetPlayer =
      await db.prepare(`
        SELECT *
        FROM game_players
        WHERE casting_id = ?
          AND username = ?
          AND status = 'active'
      `).bind(
        CASTING_ID,
        target
      ).first();


    if (!targetPlayer) {

      return response({
        ok:false,
        message:
          "Jugador no válido."
      },400);

    }


    const existing =
      await db.prepare(`
        SELECT id
        FROM game_actions
        WHERE casting_id = ?
          AND username = ?
          AND action_type = 'vote'
      `).bind(
        CASTING_ID,
        username
      ).first();


    if (existing) {

      return response({
        ok:false,
        message:
          "Ya has votado."
      },409);

    }


    await db.prepare(`
      INSERT INTO game_actions
      (
        casting_id,
        username,
        action_type,
        vote_target
      )
      VALUES (?, ?, 'vote', ?)
    `).bind(
      CASTING_ID,
      username,
      target
    ).run();


    await checkTransitions(db);


    return response(
      await getGame(db)
    );

  }


  // =====================================
  // ELIMINACIÓN
  // =====================================

  if (state.phase === "elimination") {

    if (state.status !== "active") {

      return response({
        ok:false,
        message:
          "La eliminación ya terminó."
      },400);

    }


    const target =
      String(
        body?.elimination_target || ""
      ).trim();


    if (!target) {

      return response({
        ok:false,
        message:
          "Selecciona un nominado."
      },400);

    }


    const active =
      await db.prepare(`
        SELECT *
        FROM game_players
        WHERE casting_id = ?
          AND username = ?
          AND status = 'active'
      `).bind(
        CASTING_ID,
        username
      ).first();


    if (!active) {

      return response({
        ok:false,
        message:
          "No estás activo."
      },403);

    }


    if (target === username) {

      return response({
        ok:false,
        message:
          "No puedes votarte a ti mismo."
      },400);

    }


    const nominations =
      await getNominations(db);


    if (
      !nominations.nominees.includes(target)
    ) {

      return response({
        ok:false,
        message:
          "Solo puedes votar a un nominado."
      },400);

    }


    const existing =
      await db.prepare(`
        SELECT id
        FROM game_elimination_votes
        WHERE casting_id = ?
          AND voter_username = ?
      `).bind(
        CASTING_ID,
        username
      ).first();


    if (existing) {

      return response({
        ok:false,
        message:
          "Ya has votado."
      },409);

    }


    await db.prepare(`
      INSERT INTO game_elimination_votes
      (
        casting_id,
        voter_username,
        target_username
      )
      VALUES (?, ?, ?)
    `).bind(
      CASTING_ID,
      username,
      target
    ).run();


    const votes =
      await db.prepare(`
        SELECT
          target_username,
          COUNT(*) AS votes
        FROM game_elimination_votes
        WHERE casting_id = ?
        GROUP BY target_username
        ORDER BY votes DESC
      `).bind(CASTING_ID).all();


    const ranking =
      votes.results || [];


    const activePlayers =
      await getActivePlayers(db);


    if (
      ranking.length > 0 &&
      ranking[0].votes >=
      activePlayers.length
    ) {

      const eliminated =
        ranking[0].target_username;

      const voteCount =
        Number(ranking[0].votes);


      await db.prepare(`
        INSERT OR IGNORE INTO game_eliminations
        (
          casting_id,
          username,
          votes
        )
        VALUES (?, ?, ?)
      `).bind(
        CASTING_ID,
        eliminated,
        voteCount
      ).run();


      await db.prepare(`
        UPDATE game_players
        SET
          status = 'eliminated',
          eliminated_at = CURRENT_TIMESTAMP
        WHERE casting_id = ?
          AND username = ?
      `).bind(
        CASTING_ID,
        eliminated
      ).run();


      await db.prepare(`
        UPDATE game_state
        SET
          status = 'finished',
          completed_at = CURRENT_TIMESTAMP
        WHERE casting_id = ?
      `).bind(CASTING_ID).run();

    }


    return response(
      await getGame(db)
    );

  }


  return response({
    ok:false,
    message:"Fase desconocida."
  },400);
}


// ==========================================
// CLOUDFLARE
// ==========================================

export async function onRequest(context) {

  try {

    const db =
      context.env.DB;

    if (!db) {

      return response({
        ok:false,
        message:
          "No existe el binding DB."
      },500);

    }


    await createTables(db);


    if (
      context.request.method === "GET"
    ) {

      return response(
        await getGame(db)
      );

    }


    if (
      context.request.method === "POST"
    ) {

      return await handlePost(
        db,
        context.request
      );

    }


    return response({
      ok:false,
      message:"Método no permitido."
    },405);


  } catch(error) {

    console.error(
      "GAME API ERROR:",
      error
    );

    return response({

      ok:false,

      message:
        "Error interno del juego.",

      error:
        String(
          error?.message ||
          error
        )

    },500);

  }

}
