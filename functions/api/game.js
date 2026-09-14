export async function onRequest(context) {
  const request = context.request;
  const db = context.env.DB;

  try {
    // =========================================================
    // TABLA DE ACCIONES
    // =========================================================

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS game_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        casting_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        action_type TEXT NOT NULL,
        reaction_ms INTEGER,
        vote_target TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(casting_id, username, action_type)
      )
    `).run();

    // Añadimos columnas si la tabla ya existía
    try {
      await db.prepare(`
        ALTER TABLE game_actions ADD COLUMN reaction_ms INTEGER
      `).run();
    } catch (e) {}

    try {
      await db.prepare(`
        ALTER TABLE game_actions ADD COLUMN vote_target TEXT
      `).run();
    } catch (e) {}

    // =========================================================
    // ESTADO DE LA PARTIDA
    // =========================================================

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

    await db.prepare(`
      INSERT OR IGNORE INTO game_state (
        casting_id,
        phase,
        status
      )
      VALUES (1, 'immunity', 'active')
    `).run();

    // =========================================================
    // FUNCIÓN PRINCIPAL DE DATOS
    // =========================================================

    async function getGameData() {

      const room = await db.prepare(`
        SELECT id, casting_id, status, created_at, started_at
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
        SELECT username, joined_at
        FROM casting_players
        WHERE casting_id = 1
        ORDER BY id ASC
      `).all();

      const allPlayers = playersResult.results || [];

      // =======================================================
      // INMUNIDAD
      // =======================================================

      const immunityResult = await db.prepare(`
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

      const completedImmunity = immunityResult.results || [];

      const ranking = completedImmunity.map((player, index) => ({
        position: index + 1,
        username: player.username,
        reaction_ms: Number(player.reaction_ms),
        created_at: player.created_at
      }));

      const completedNames = new Set(
        completedImmunity.map(player =>
          player.username.toLowerCase()
        )
      );

      const pending = allPlayers
        .filter(player =>
          !completedNames.has(player.username.toLowerCase())
        )
        .map(player => ({
          username: player.username,
          reaction_ms: null,
          pending: true
        }));

      // =======================================================
      // GANADOR DE INMUNIDAD
      // =======================================================

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

      if (!winner && ranking.length > 0) {
        winner = ranking[0];
      }

      // =======================================================
      // NOMINACIONES
      // =======================================================

      const voteResult = await db.prepare(`
        SELECT
          id,
          username,
          vote_target,
          created_at
        FROM game_actions
        WHERE casting_id = 1
        AND action_type = 'vote'
        AND vote_target IS NOT NULL
        AND TRIM(vote_target) != ''
        ORDER BY id ASC
      `).all();

      const votes = voteResult.results || [];

      const voteCountMap = {};

      for (const vote of votes) {
        const target = String(vote.vote_target).toLowerCase();

        if (!voteCountMap[target]) {
          voteCountMap[target] = 0;
        }

        voteCountMap[target]++;
      }

      const voteRanking = allPlayers
        .map(player => ({
          username: player.username,
          votes: voteCountMap[player.username.toLowerCase()] || 0
        }))
        .filter(player => player.votes > 0)
        .sort((a, b) => {
          if (b.votes !== a.votes) {
            return b.votes - a.votes;
          }

          return a.username.localeCompare(
            b.username,
            'es',
            { sensitivity: 'base' }
          );
        });

      let nominees = [];

      if (voteRanking.length > 0) {

        const highestVotes = voteRanking[0].votes;

        nominees = voteRanking.filter(
          player => player.votes === highestVotes
        );

      }

      // =======================================================
      // JUGADORES QUE YA HAN VOTADO
      // =======================================================

      const votedNames = new Set(
        votes.map(vote =>
          vote.username.toLowerCase()
        )
      );

      const pendingVotes = allPlayers
        .filter(player =>
          !votedNames.has(player.username.toLowerCase())
        )
        .map(player => player.username);

      return {
        ok: true,

        room,

        state,

        phase: state ? state.phase : 'immunity',

        status: state ? state.status : 'active',

        finished:
          state &&
          state.phase === 'nominations' &&
          state.status === 'finished',

        players: allPlayers,

        // INMUNIDAD
        ranking,
        pending,
        winner,

        totalPlayers: allPlayers.length,
        completedPlayers: completedImmunity.length,
        pendingPlayers: pending.length,

        // VOTACIÓN
        votes,
        voteRanking,
        nominees,

        totalVotes: votes.length,
        pendingVotes,

        winner_username:
          state ? state.winner_username : null
      };
    }

    // =========================================================
    // GET
    // =========================================================

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

    // =========================================================
    // POST
    // =========================================================

    if (request.method === "POST") {

      const body = await request.json();

      const username =
        String(body.username || "").trim();

      if (!username) {
        return Response.json(
          {
            ok: false,
            message: "Falta el nombre de usuario."
          },
          { status: 400 }
        );
      }

      const room = await db.prepare(`
        SELECT id, casting_id, status, created_at, started_at
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

      const state = await db.prepare(`
        SELECT
          phase,
          status,
          winner_username,
          completed_at
        FROM game_state
        WHERE casting_id = 1
        LIMIT 1
      `).first();

      if (!state) {
        return Response.json(
          {
            ok: false,
            message: "No existe el estado de la partida."
          },
          { status: 500 }
        );
      }

      // =======================================================
      // COMPROBAR JUGADOR
      // =======================================================

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

      // =======================================================
      // FASE DE INMUNIDAD
      // =======================================================

      if (state.phase === "immunity") {

        if (state.status === "finished") {
          return Response.json(
            {
              ok: false,
              message:
                "La prueba de inmunidad ya ha terminado."
            },
            { status: 400 }
          );
        }

        const reactionMs =
          Number(body.reaction_ms);

        if (
          !Number.isFinite(reactionMs) ||
          reactionMs < 100 ||
          reactionMs > 10000
        ) {
          return Response.json(
            {
              ok: false,
              message:
                "Tiempo de reacción no válido."
            },
            { status: 400 }
          );
        }

        // ¿Ya participó?
        const existing = await db.prepare(`
          SELECT id, username, reaction_ms
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

        // =====================================================
        // COMPROBAR SI TERMINÓ INMUNIDAD
        // =====================================================

        const totalResult =
          await db.prepare(`
            SELECT COUNT(*) AS total
            FROM casting_players
            WHERE casting_id = 1
          `)
          .first();

        const completedResult =
          await db.prepare(`
            SELECT COUNT(*) AS total
            FROM game_actions
            WHERE casting_id = 1
            AND action_type = 'immunity'
            AND reaction_ms IS NOT NULL
            AND reaction_ms > 0
          `)
          .first();

        const totalPlayers =
          Number(totalResult.total || 0);

        const completedPlayers =
          Number(completedResult.total || 0);

        if (
          totalPlayers > 0 &&
          completedPlayers >= totalPlayers
        ) {

          const winnerRow =
            await db.prepare(`
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
            `)
            .first();

          if (winnerRow) {

            // IMPORTANTE:
            // La partida pasa automáticamente
            // a NOMINACIONES.

            await db.prepare(`
              UPDATE game_state
              SET
                phase = 'nominations',
                status = 'active',
                winner_username = ?,
                completed_at = CURRENT_TIMESTAMP
              WHERE casting_id = 1
            `)
            .bind(winnerRow.username)
            .run();
          }
        }

        const gameData =
          await getGameData();

        return Response.json({
          ...gameData,
          alreadyParticipated: false,
          message:
            gameData.phase === 'nominations'
              ? "🏆 ¡Inmunidad terminada! ¡Comienzan las nominaciones!"
              : "¡Tiempo registrado!",
          reaction_ms: finalTime
        });
      }

      // =======================================================
      // FASE DE NOMINACIONES
      // =======================================================

      if (state.phase === "nominations") {

        if (state.status === "finished") {

          const gameData =
            await getGameData();

          return Response.json(
            {
              ...gameData,
              alreadyVoted: false,
              message:
                "La votación ya ha terminado."
            },
            { status: 400 }
          );
        }

        const voteTarget =
          String(body.vote_target || "").trim();

        if (!voteTarget) {
          return Response.json(
            {
              ok: false,
              message:
                "Debes seleccionar a quién nominas."
            },
            { status: 400 }
          );
        }

        // =====================================================
        // NO VOTARSE A UNO MISMO
        // =====================================================

        if (
          voteTarget.toLowerCase() ===
          player.username.toLowerCase()
        ) {
          return Response.json(
            {
              ok: false,
              message:
                "No puedes nominarte a ti mismo."
            },
            { status: 400 }
          );
        }

        // =====================================================
        // COMPROBAR QUE EL OBJETIVO EXISTE
        // =====================================================

        const targetPlayer =
          await db.prepare(`
            SELECT username
            FROM casting_players
            WHERE casting_id = 1
            AND LOWER(username) = LOWER(?)
            LIMIT 1
          `)
          .bind(voteTarget)
          .first();

        if (!targetPlayer) {
          return Response.json(
            {
              ok: false,
              message:
                "Ese jugador no pertenece al casting."
            },
            { status: 400 }
          );
        }

        // =====================================================
        // EL INMUNE NO PUEDE SER NOMINADO
        // =====================================================

        if (
          state.winner_username &&
          targetPlayer.username.toLowerCase() ===
          state.winner_username.toLowerCase()
        ) {
          return Response.json(
            {
              ok: false,
              message:
                "🛡️ Ese jugador tiene inmunidad y no puede ser nominado."
            },
            { status: 400 }
          );
        }

        // =====================================================
        // COMPROBAR VOTO DUPLICADO
        // =====================================================

        const existingVote =
          await db.prepare(`
            SELECT id
            FROM game_actions
            WHERE casting_id = 1
            AND LOWER(username) = LOWER(?)
            AND action_type = 'vote'
            LIMIT 1
          `)
          .bind(player.username)
          .first();

        if (existingVote) {

          const gameData =
            await getGameData();

          return Response.json({
            ...gameData,
            alreadyVoted: true,
            message:
              "Ya has votado en esta ronda."
          });
        }

        // =====================================================
        // GUARDAR VOTO
        // =====================================================

        await db.prepare(`
          INSERT INTO game_actions (
            casting_id,
            username,
            action_type,
            vote_target
          )
          VALUES (
            1,
            ?,
            'vote',
            ?
          )
        `)
        .bind(
          player.username,
          targetPlayer.username
        )
        .run();

        // =====================================================
        // COMPROBAR SI HAN VOTADO TODOS
        // =====================================================

        const totalResult =
          await db.prepare(`
            SELECT COUNT(*) AS total
            FROM casting_players
            WHERE casting_id = 1
          `)
          .first();

        const votesResult =
          await db.prepare(`
            SELECT COUNT(*) AS total
            FROM game_actions
            WHERE casting_id = 1
            AND action_type = 'vote'
            AND vote_target IS NOT NULL
          `)
          .first();

        const totalPlayers =
          Number(totalResult.total || 0);

        const totalVotes =
          Number(votesResult.total || 0);

        if (
          totalPlayers > 0 &&
          totalVotes >= totalPlayers
        ) {

          // ---------------------------------------------------
          // CALCULAR EL MÁXIMO DE VOTOS
          // ---------------------------------------------------

          const topVote =
            await db.prepare(`
              SELECT
                vote_target,
                COUNT(*) AS votes
              FROM game_actions
              WHERE casting_id = 1
              AND action_type = 'vote'
              AND vote_target IS NOT NULL
              AND LOWER(vote_target) != LOWER(?)
              GROUP BY LOWER(vote_target)
              ORDER BY votes DESC
              LIMIT 1
            `)
            .bind(state.winner_username || "")
            .first();

          if (topVote) {

            await db.prepare(`
              UPDATE game_state
              SET
                status = 'finished',
                completed_at = CURRENT_TIMESTAMP
              WHERE casting_id = 1
            `)
            .run();
          }
        }

        const gameData =
          await getGameData();

        return Response.json({
          ...gameData,
          alreadyVoted: false,
          message:
            gameData.status === 'finished'
              ? "🗳️ ¡Nominaciones terminadas!"
              : "¡Voto registrado!",
          vote_target: targetPlayer.username
        });
      }

      return Response.json(
        {
          ok: false,
          message:
            "Fase de juego no reconocida."
        },
        { status: 400 }
      );
    }

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
