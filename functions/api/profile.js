export async function onRequest(context) {

  const request = context.request;
  const db = context.env.DB;

  try {

    if (request.method !== "GET") {
      return Response.json(
        {
          ok: false,
          message: "Método no permitido."
        },
        { status: 405 }
      );
    }

    const url = new URL(request.url);
    const username = String(
      url.searchParams.get("username") || ""
    ).trim();

    if (!username) {
      return Response.json(
        {
          ok: false,
          message: "Falta el usuario."
        },
        { status: 400 }
      );
    }

    let stats = await db.prepare(
      "SELECT username, games_played, wins, points, created_at FROM user_stats WHERE LOWER(username) = LOWER(?)"
    )
    .bind(username)
    .first();

    if (!stats) {

      await db.prepare(
        "INSERT INTO user_stats (username) VALUES (?)"
      )
      .bind(username)
      .run();

      stats = await db.prepare(
        "SELECT username, games_played, wins, points, created_at FROM user_stats WHERE LOWER(username) = LOWER(?)"
      )
      .bind(username)
      .first();
    }

    return Response.json({
      ok: true,
      profile: stats
    });

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
