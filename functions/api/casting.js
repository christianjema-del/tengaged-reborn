export async function onRequest(context) {

  const request = context.request;
  const db = context.env.DB;

  try {

    /* GET = devolver todos los jugadores */

    if (request.method === "GET") {

      const result = await db.prepare(
        "SELECT username, joined_at FROM casting_players WHERE casting_id = 1 ORDER BY id ASC"
      ).all();

      return Response.json({
        ok: true,
        players: result.results
      });

    }

    /* POST = añadir jugador */

    if (request.method === "POST") {

      const data = await request.json();

      const username = String(data.username || "").trim();

      if (!username) {

        return Response.json(
          {
            ok: false,
            message: "Falta el nombre de usuario."
          },
          { status: 400 }
        );

      }

      await db.prepare(
        "INSERT OR IGNORE INTO casting_players (username, casting_id) VALUES (?, 1)"
      )
      .bind(username)
      .run();

      const result = await db.prepare(
        "SELECT username, joined_at FROM casting_players WHERE casting_id = 1 ORDER BY id ASC"
      ).all();

      return Response.json({
        ok: true,
        message: "Jugador añadido al Casting #1.",
        players: result.results
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
