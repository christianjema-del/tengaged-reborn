export async function onRequest(context) {
  const request = context.request;
  const db = context.env.DB;

  try {

    // =====================================================
    // TABLA DE ACCIONES
    // =====================================================

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


    // Por si la tabla ya existía antes
    try {
      await db.prepare(`
        ALTER TABLE game_actions ADD COLUMN reaction_ms INTEGER
      `).run();
    } catch (e) {
      // La columna ya existe
    }


    // =====================================================
    // TABLA DEL ESTADO DE LA PRUEBA
    // =====================================================

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS game_state (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        casting_id INTEGER NOT NULL UNIQUE,
        phase TEXT NOT NULL DEFAULT 'immunity',
        status TEXT NOT NULL DEFAULT 'active',
        winner_username TEXT,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();


    // Crear estado para Casting #1 si todavía no existe

    await db.prepare(`
      INSERT OR IGNORE INTO game_state (
        casting_id,
        phase,
        status
      )
      VALUES (
        1,
        'immunity',
        'active'
      )
    `).run();


    // =====================================================
    // OBTENER DATOS COMPLETOS DE LA PRUEBA
    // =====================================================

    async function getGameData() {

      const room = await db.prepare(`
        SELECT
          id,
          casting_id,
          status,
          created_at,
          started_at
        FROM casting_rooms
        WHERE casting_id = 1
        LIMIT 1
      `).first();


      if (!room) {

        return {
          ok: false,
          message: "La sala todavía no existe."
        };

      }


      const state = await db.prepare(`
        SELECT
          id,
          casting_id,
          phase,
          status,
          winner_username,
          completed_at,
          created_at
        FROM game_state
        WHERE casting_id = 1
        LIMIT 1
      `).first();


      const playersResult = await db.prepare(`
        SELECT
          username,
          joined_at
        FROM casting_players
        WHERE casting_id = 1
        ORDER BY id ASC
      `).all();


      const allPlayers = playersResult.results || [];


      // Solo contamos tiempos reales
      const results = await db.prepare(`
        SELECT
          id,
          username,
          reaction_ms,
          created_at
        FROM game_actions
        WHERE casting_id = 1
        AND action_type = 'immunity'
        AND reaction_ms IS NOT NULL
        AND reaction_ms > 0
        ORDER BY reaction_ms ASC, id ASC
      `).all();


      const completed = results.results || [];


      const ranking = completed.map((player, index) => ({
        position: index + 1,
        username: player.username,
        reaction_ms: Number(player.reaction_ms),
        created_at: player.created_at
      }));


      const completedNames = new Set(
        completed.map(
          player => player.username.toLowerCase()
        )
      );


      const pending = allPlayers
        .filter(
          player =>
            !completedNames.has(
              player.username.toLowerCase()
            )
        )
        .map(player => ({
          username: player.username,
          reaction_ms: null,
          pending: true
        }));


      const totalPlayers = allPlayers.length;

      const completedPlayers = completed.length;

      const pendingPlayers = pending.length;


      // ===================================================
      // GANADOR
      // ===================================================

      let winner = null;


      if (state && state.winner_username) {

        const savedWinner = ranking.find(
          player =>
            player.username.toLowerCase() ===
            state.winner_username.toLowerCase()
        );


        if (savedWinner) {
          winner = savedWinner;
        }

      }


      // Si todavía no está guardado pero ya hay resultados,
      // el primero provisional es el más rápido.

      if (!winner && ranking.length > 0) {

        winner = ranking[0];

      }


      const finished =
        state &&
        state.status === "finished";


      return {

        ok: true,

        room,

        state,

        players: allPlayers,

        ranking,

        pending,

        winner,

        totalPlayers,

        completedPlayers,

        pendingPlayers,

        phase: "immunity",

        finished: Boolean(finished)

      };

    }


    // =====================================================
    // GET
    // =====================================================

    if (request.method === "GET") {

      const data = await getGameData();


      if (!data.ok) {

        return Response.json(
          data,
          { status: 404 }
        );

      }


      if (data.room.status !== "started") {

        return Response.json(
          {
            ok: false,
            message: "La partida todavía no ha comenzado."
          },
          { status: 400 }
        );

      }


      return Response.json(data);

    }


    // =====================================================
    // POST
    // =====================================================

    if (request.method === "POST") {

      const body = await request.json();


      const username =
        String(body.username || "").trim();


      const reactionMs =
        Number(body.reaction_ms);


      if (!username) {

        return Response.json(
          {
            ok: false,
            message: "Falta el nombre de usuario."
          },
          { status: 400 }
        );

      }


      if (
        !Number.isFinite(reactionMs) ||
        reactionMs < 100 ||
        reactionMs > 10000
      ) {

        return Response.json(
          {
            ok: false,
            message: "Tiempo de reacción no válido."
          },
          { status: 400 }
        );

      }


      // ===================================================
      // COMPROBAR SALA
      // ===================================================

      const room = await db.prepare(`
        SELECT
          id,
          casting_id,
          status,
          created_at,
          started_at
        FROM casting_rooms
        WHERE casting_id = 1
        LIMIT 1
      `).first();


      if (!room) {

        return Response.json(
          {
            ok: false,
            message: "La sala todavía no existe."
          },
          { status: 404 }
        );

      }


      if (room.status !== "started") {

        return Response.json(
          {
            ok: false,
            message: "La partida todavía no ha comenzado."
          },
          { status: 400 }
        );

      }


      // ===================================================
      // COMPROBAR ESTADO DE LA PRUEBA
      // ===================================================

      const state = await db.prepare(`
        SELECT
          status,
          winner_username,
          completed_at
        FROM game_state
        WHERE casting_id = 1
        LIMIT 1
      `).first();


      if (state && state.status === "finished") {

        const gameData = await getGameData();


        return Response.json(
          {
            ...gameData,
            alreadyParticipated: false,
            message:
              "La prueba de inmunidad ya ha terminado."
          },
          { status: 400 }
        );

      }


      // ===================================================
      // COMPROBAR JUGADOR
      // ===================================================

      const player = await db.prepare(`
        SELECT username
        FROM casting_players
        WHERE casting_id = 1
        AND LOWER(username) = LOWER(?)
        LIMIT 1
      `)
      .bind(username)
      .first();


      if (!player) {

        return Response.json(
          {
            ok: false,
            message: "No perteneces al Casting #1."
          },
          { status: 403 }
        );

      }


      // ===================================================
      // COMPROBAR SI YA HA PARTICIPADO
      // ===================================================

      const existing = await db.prepare(`
        SELECT
          id,
          username,
          reaction_ms
        FROM game_actions
        WHERE casting_id = 1
        AND LOWER(username) = LOWER(?)
        AND action_type = 'immunity'
        AND reaction_ms IS NOT NULL
        AND reaction_ms > 0
        LIMIT 1
      `)
      .bind(player.username)
      .first();


      if (existing) {

        const gameData =
          await getGameData();


        return Response.json({

          ...gameData,

          alreadyParticipated: true,

          message:
            "Ya has participado en la prueba."

        });

      }


      // ===================================================
      // GUARDAR TIEMPO
      // ===================================================

      const oldRow = await db.prepare(`
        SELECT id
        FROM game_actions
        WHERE casting_id = 1
        AND LOWER(username) = LOWER(?)
        AND action_type = 'immunity'
        LIMIT 1
      `)
      .bind(player.username)
      .first();


      const finalTime =
        Math.round(reactionMs);


      if (oldRow) {

        await db.prepare(`
          UPDATE game_actions
          SET
            reaction_ms = ?,
            created_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .bind(
          finalTime,
          oldRow.id
        )
        .run();

      } else {

        await db.prepare(`
          INSERT INTO game_actions (
            casting_id,
            username,
            action_type,
            reaction_ms
          )
          VALUES (
            1,
            ?,
            'immunity',
            ?
          )
        `)
        .bind(
          player.username,
          finalTime
        )
        .run();

      }


      // ===================================================
      // COMPROBAR SI YA HAN TERMINADO TODOS
      // ===================================================

      const totalResult = await db.prepare(`
        SELECT COUNT(*) AS total
        FROM casting_players
        WHERE casting_id = 1
      `).first();


      const completedResult = await db.prepare(`
        SELECT COUNT(*) AS total
        FROM game_actions
        WHERE casting_id = 1
        AND action_type = 'immunity'
        AND reaction_ms IS NOT NULL
        AND reaction_ms > 0
      `).first();


      const totalPlayers =
        Number(totalResult.total || 0);


      const completedPlayers =
        Number(completedResult.total || 0);


      // ===================================================
      // SI ESTÁN TODOS -> CERRAR PRUEBA
      // ===================================================

      if (
        totalPlayers > 0 &&
        completedPlayers >= totalPlayers
      ) {

        // Buscar el jugador más rápido

        const winnerRow = await db.prepare(`
          SELECT
            username,
            reaction_ms,
            created_at
          FROM game_actions
          WHERE casting_id = 1
          AND action_type = 'immunity'
          AND reaction_ms IS NOT NULL
          AND reaction_ms > 0
          ORDER BY reaction_ms ASC, id ASC
          LIMIT 1
        `).first();


        if (winnerRow) {

          await db.prepare(`
            UPDATE game_state
            SET
              status = 'finished',
              winner_username = ?,
              completed_at = CURRENT_TIMESTAMP
            WHERE casting_id = 1
          `)
          .bind(
            winnerRow.username
          )
          .run();

        }

      }


      // ===================================================
      // DEVOLVER ESTADO FINAL
      // ===================================================

      const gameData =
        await getGameData();


      return Response.json({

        ...gameData,

        alreadyParticipated: false,

        message:
          gameData.finished
            ? "🏆 ¡Prueba terminada! Se ha concedido la inmunidad al ganador."
            : "¡Tiempo registrado!",

        reaction_ms: finalTime

      });

    }


    // =====================================================
    // OTRO MÉTODO
    // =====================================================

    return Response.json(
      {
        ok: false,
        message: "Método no permitido."
      },
      { status: 405 }
    );


  } catch (error) {

    return Response.json(
      {
        ok: false,
        message: "Error del servidor.",
        error: error.message
      },
      { status: 500 }
    );

  }
}
