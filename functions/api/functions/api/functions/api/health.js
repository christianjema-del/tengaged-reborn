export async function onRequest(context) {
  return new Response(
    JSON.stringify({
      ok: true,
      message: "Tengaged Reborn API funcionando"
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
