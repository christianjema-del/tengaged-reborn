export async function onRequest(context) {

  const request = context.request;
  const db = context.env.DB;

  const MAX_PLAYERS = 16;

  try {

    /* =========================
       GET = VER JUGADORES
    ========================= */

    if (request.method === "GET") {

      const result = await db.prepare(
        "SELECT username, joined_at FROM casting_players WHERE casting_id = 1 ORDER BY id ASC"
      ).all();

      return Response.json({
        ok: true,
        players: result.results,
        maxPlayers: MAX_PLAYERS,
        full: result.results.length >= MAX_PLAYERS
      });

    }


    /* =========================
       POST = ENTRAR AL CASTING
    ========================= */

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


      /* =========================
         COMPROBAR JUGADORES
      ========================= */

      const current =
        await db.prepare(
          "SELECT username, joined_at FROM casting_players WHERE casting_id = 1 ORDER BY id ASC"
        ).all();

      const players =
        current.results;


      /* =========================
         ¿YA ESTÁ DENTRO?
      ========================= */

      const alreadyJoined =
        players.some(function(player) {

          return player.username.toLowerCase() ===
                 username.toLowerCase();

        });


      if (alreadyJoined) {

        return Response.json({

          ok: true,

          alreadyJoined: true,

          message:
            "Ya estás dentro del Casting #1.",

          players: players,

          maxPlayers: MAX_PLAYERS,

          full:
            players.length >= MAX_PLAYERS

        });

      }


      /* =========================
         ¿CASTING LLENO?
      ========================= */

      if (players.length >= MAX_PLAYERS) {

        return Response.json(
          {

            ok: false,

            full: true,

            message:
              "El Casting #1 está completo. No quedan plazas.",

            players: players,

            maxPlayers: MAX_PLAYERS

          },

          { status: 409 }

        );

      }


      /* =========================
         AÑADIR JUGADOR
      ========================= */

      await db.prepare(

        "INSERT INTO casting_players (username, casting_id) VALUES (?, 1)"

      )
      .bind(username)
      .run();


      /* =========================
         VOLVER A LEER D1
      ========================= */

      const updated =
        await db.prepare(
          "SELECT username, joined_at FROM casting_players WHERE casting_id = 1 ORDER BY id ASC"
        ).all();


      return Response.json({

        ok: true,

        alreadyJoined: false,

        message:
          "Te has unido al Casting #1.",

        players:
          updated.results,

        maxPlayers:
          MAX_PLAYERS,

        full:
          updated.results.length >= MAX_PLAYERS

      });

    }


    /* =========================
       MÉTODO NO PERMITIDO
    ========================= */

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

        message:
          "Error del servidor.",

        error:
          error.message

      },

      { status: 500 }

    );

  }

}
