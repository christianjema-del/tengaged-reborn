export async function onRequest(context) {
  const request = context.request;
  const db = context.env.DB;

  try {
    // Tabla de acciones de la partida
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS game_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        casting_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        action_type TEXT NOT NULL,
        reaction_ms INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(casting_id, username, action_type)
      )
    `).run();

    // Añadimos la columna si la tabla antigua ya existía
    try {
      await db.prepare(`
        ALTER TABLE game_actions ADD COLUMN reaction_ms INTEGER
      `).run();
    } catch (e) {
      // La columna ya existe. No hacemos nada.
    }

    // =========================
    // GET
    // =========================
    if (request.method === "GET") {

      const room = await db.prepare(`
        SELECT id, casting_id, status, created_at, started_at
        FROM casting_rooms
        WHERE casting_id = 1
        LIMIT 1
      `).first();

      if (!room) {
        return Response.json({
          ok: false,
          message: "La sala todavía no existe."
        }, { status: 404 });
      }

      if (room.status !== "started") {
        return Response.json({
          ok: false,
          message: "La partida todavía no ha comenzado."
        }, { status: 400 });
      }

      const players = await db.prepare(`
        SELECT username, joined_at
        FROM casting_players
        WHERE casting_id = 1
        ORDER BY id ASC
      `).all();

      const participants = await db.prepare(`
        SELECT username, reaction_ms, created_at
        FROM game_actions
        WHERE casting_id = 1
        AND action_type = 'immunity'
        ORDER BY
          CASE WHEN reaction_ms IS NULL THEN 1 ELSE 0 END,
          reaction_ms ASC,
          id ASC
      `).all();

      return Response.json({
        ok: true,
        room: room,
        players: players.results || [],
        participants: participants.results || [],
        phase: "immunity"
      });
    }

    // =========================
    // POST
    // =========================
    if (request.method === "POST") {

      const data = await request.json();

      const username = String(data.username || "").trim();

      if (!username) {
        return Response.json({
          ok: false,
          message: "Falta el nombre de usuario."
        }, { status: 400 });
      }

      const reactionMs = Number(data.reaction_ms);

      if (
        !Number.isFinite(reactionMs) ||
        reactionMs < 1 ||
        reactionMs > 60000
      ) {
        return Response.json({
          ok: false,
          message: "El tiempo de reacción no es válido."
        }, { status: 400 });
      }

      const room = await db.prepare(`
        SELECT id, casting_id, status, created_at, started_at
        FROM casting_rooms
        WHERE casting_id = 1
        LIMIT 1
      `).first();

      if (!room) {
        return Response.json({
          ok: false,
          message: "La sala todavía no existe."
        }, { status: 404 });
      }

      if (room.status !== "started") {
        return Response.json({
          ok: false,
          message: "La partida todavía no ha comenzado."
        }, { status: 400 });
      }

      const player = await db.prepare(`
        SELECT username
        FROM casting_players
        WHERE casting_id = 1
        AND LOWER(username) = LOWER(?)
        LIMIT 1
      `).bind(username).first();

      if (!player) {
        return Response.json({
          ok: false,
          message: "No perteneces al Casting #1."
        }, { status: 403 });
      }

      const existing = await db.prepare(`
        SELECT id, username, reaction_ms, created_at
        FROM game_actions
        WHERE casting_id = 1
        AND LOWER(username) = LOWER(?)
        AND action_type = 'immunity'
        LIMIT 1
      `).bind(player.username).first();

      if (existing) {

        const participants = await db.prepare(`
          SELECT username, reaction_ms, created_at
          FROM game_actions
          WHERE casting_id = 1
          AND action_type = 'immunity'
          ORDER BY
            CASE WHEN reaction_ms IS NULL THEN 1 ELSE 0 END,
            reaction_ms ASC,
            id ASC
        `).all();

        return Response.json({
          ok: true,
          alreadyParticipated: true,
          message: "Ya has participado en la prueba.",
          participants: participants.results || []
        });
      }

      await db.prepare(`
        INSERT INTO game_actions (
          casting_id,
          username,
          action_type,
          reaction_ms
        )
        VALUES (1, ?, 'immunity', ?)
      `).bind(
        player.username,
        Math.round(reactionMs)
      ).run();

      const participants = await db.prepare(`
        SELECT username, reaction_ms, created_at
        FROM game_actions
        WHERE casting_id = 1
        AND action_type = 'immunity'
        ORDER BY
          CASE WHEN reaction_ms IS NULL THEN 1 ELSE 0 END,
          reaction_ms ASC,
          id ASC
      `).all();

      const winner = participants.results &&
        participants.results.length > 0
        ? participants.results[0]
        : null;

      return Response.json({
        ok: true,
        alreadyParticipated: false,
        message: "¡Tiempo registrado!",
        reaction_ms: Math.round(reactionMs),
        participants: participants.results || [],
        winner: winner
      });
    }

    return Response.json({
      ok: false,
      message: "Método no permitido."
    }, { status: 405 });

  } catch (error) {

    return Response.json({
      ok: false,
      message: "Error del servidor.",
      error: error.message
    }, { status: 500 });
  }
}
