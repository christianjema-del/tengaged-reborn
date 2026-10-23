import { ensureProfileSchema, getSessionUser, jsonError } from "../_shared/auth.js";
import { ensureCastingSchema, listCastingPlayers } from "../_shared/casting.js";

export async function onRequest(context) {

  const request = context.request;
  const db = context.env.DB;
  let authenticatedUser = null;

  const MAX_PLAYERS = 16;

  try {

    await ensureCastingSchema(db);

    if (request.method === "POST") {
      await ensureProfileSchema(db);
      authenticatedUser = await getSessionUser(request, db);
      if (!authenticatedUser) return jsonError("Inicia sesión para entrar al casting.", 401);
    }

    /* =========================
       GET = VER JUGADORES
    ========================= */

    if (request.method === "GET") {

      const result = { results: await listCastingPlayers(db) };

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

      const username = authenticatedUser.username;


      /* =========================
         COMPROBAR JUGADORES
      ========================= */

      const current = { results: await listCastingPlayers(db) };

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

      const joined = await db.prepare(`
        INSERT OR IGNORE INTO casting_players (username, casting_id)
        SELECT ?, 1
        WHERE (SELECT COUNT(*) FROM casting_players WHERE casting_id=1) < ?
          AND NOT EXISTS (SELECT 1 FROM casting_players WHERE casting_id=1 AND LOWER(username)=LOWER(?))
      `).bind(username, MAX_PLAYERS, username).run();


      /* =========================
         VOLVER A LEER D1
      ========================= */

      const updated = { results: await listCastingPlayers(db) };


      if (joined.meta.changes) {
        await db.prepare("INSERT OR IGNORE INTO casting_resources(casting_id,username,keys,apples,health) VALUES(1,?,0,3,100)").bind(username).run();
      }
      if (!joined.meta.changes) {
        const latest = { results: await listCastingPlayers(db) };
        const isNowJoined = latest.results.some(player => player.username.toLowerCase() === username.toLowerCase());
        return Response.json({
          ok: isNowJoined,
          alreadyJoined: isNowJoined,
          full: !isNowJoined && latest.results.length >= MAX_PLAYERS,
          message: isNowJoined ? "Ya estás dentro del Casting #1." : "El casting está completo. No quedan plazas.",
          players: latest.results,
          maxPlayers: MAX_PLAYERS
        }, { status: isNowJoined ? 200 : 409 });
      }

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
