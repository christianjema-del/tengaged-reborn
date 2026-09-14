```javascript
/* =========================================
   GET — ESTADO DE LA SALA
========================================= */

export async function onRequestGet(context) {

  const db = context.env.DB;

  try {

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


    const players = await db.prepare(`
      SELECT
        username,
        joined_at
      FROM casting_players
      WHERE casting_id = 1
      ORDER BY id ASC
    `).all();


    return Response.json({

      ok: true,

      room: room,

      players: players.results,

      maxPlayers: 16,

      playerCount: players.results.length

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


/* =========================================
   POST — ENTRAR EN LA SALA
========================================= */

export async function onRequestPost(context) {

  const db = context.env.DB;

  try {

    const data =
      await context.request.json();


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


    const player = await db.prepare(`
      SELECT
        username
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
          message: "Primero debes apuntarte al Casting #1."
        },
        { status: 403 }
      );

    }


    let room = await db.prepare(`
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

      await db.prepare(`
        INSERT INTO casting_rooms
        (casting_id, status)
        VALUES
        (1, 'waiting')
      `).run();


      room = await db.prepare(`
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

    }


    return Response.json({

      ok: true,

      message:
        "Has entrado en la sala del Casting #1.",

      room: room,

      username: player.username

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


/* =========================================
   PUT — INICIAR PARTIDA
========================================= */

export async function onRequestPut(context) {

  const db = context.env.DB;

  const ADMIN_USERNAME = "admin1";


  try {

    const data =
      await context.request.json();


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
       COMPROBAR ADMIN
    ========================= */

    if (
      username.toLowerCase() !==
      ADMIN_USERNAME.toLowerCase()
    ) {

      return Response.json(
        {
          ok: false,
          message:
            "No tienes permisos para iniciar la partida."
        },
        { status: 403 }
      );

    }


    /* =========================
       BUSCAR SALA
    ========================= */

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
          message:
            "La sala todavía no existe."
        },
        { status: 404 }
      );

    }


    /* =========================
       YA INICIADA
    ========================= */

    if (room.status === "started") {

      return Response.json({

        ok: true,

        message:
          "La partida ya está iniciada.",

        room: room

      });

    }


    /* =========================
       CONTAR JUGADORES
    ========================= */

    const players = await db.prepare(`
      SELECT COUNT(*) AS total
      FROM casting_players
      WHERE casting_id = 1
    `).first();


    const playerCount =
      Number(players.total || 0);


    if (playerCount < 2) {

      return Response.json(
        {
          ok: false,

          message:
            "Necesitas al menos 2 jugadores para iniciar la pa
```
