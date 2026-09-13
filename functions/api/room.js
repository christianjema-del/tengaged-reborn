export async function onRequest(context) {

  const request = context.request;
  const db = context.env.DB;

  try {

    /*
     * GET
     * Devuelve el estado de la sala del Casting #1
     */

    if (request.method === "GET") {

      const room = await db.prepare(
        `
        SELECT
          id,
          casting_id,
          status,
          created_at,
          started_at
        FROM casting_rooms
        WHERE casting_id = 1
        LIMIT 1
        `
      ).first();

      if (!room) {

        return Response.json(
          {
            ok: false,
            message: "La sala todavía no existe."
          },
          { status: 404 }
        );

      }

      const players = await db.prepare(
        `
        SELECT
          username,
          joined_at
        FROM casting_players
        WHERE casting_id = 1
        ORDER BY id ASC
        `
      ).all();

      return Response.json({

        ok: true,

        room: room,

        players: players.results,

        maxPlayers: 16,

        playerCount: players.results.length

      });

    }


    /*
     * POST
     * Permite entrar en la sala
     */

    if (request.method === "POST") {

      const data = await request.json();

      const username =
        String(data.username || "").trim();

      if (!username) {

        return Response.json(
          {
            ok: false,
            message: "Falta el nombre de usuario."
          },
          { status: 400 }
        );

      }


      /*
       * Comprobar que el jugador está apuntado
       * al Casting #1
       */

      const player = await db.prepare(
        `
        SELECT
          username
        FROM casting_players
        WHERE casting_id = 1
        AND LOWER(username) = LOWER(?)
        LIMIT 1
        `
      )
      .bind(username)
      .first();


      if (!player) {

        return Response.json(
          {
            ok: false,
            message: "Primero debes apuntarte al Casting #1."
          },
          { status: 403 }
        );

      }


      /*
       * Buscar la sala
       */

      let room = await db.prepare(
        `
        SELECT
          id,
          casting_id,
          status,
          created_at,
          started_at
        FROM casting_rooms
        WHERE casting_id = 1
        LIMIT 1
        `
      ).first();


      /*
       * Si por algún motivo no existe,
       * la creamos automáticamente.
       */

      if (!room) {

        await db.prepare(
          `
          INSERT INTO casting_rooms
          (casting_id, status)
          VALUES
          (1, 'waiting')
          `
        ).run();


        room = await db.prepare(
          `
          SELECT
            id,
            casting_id,
            status,
            created_at,
            started_at
          FROM casting_rooms
          WHERE casting_id = 1
          LIMIT 1
          `
        ).first();

      }


      return Response.json({

        ok: true,

        message: "Has entrado en la sala del Casting #1.",

        room: room,

        username: player.username

      });

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
