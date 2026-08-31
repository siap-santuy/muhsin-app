import { buildContainer } from "./bootstrap/container";

const { app } = buildContainer();

export default {
  port: 3001,
  fetch: app.fetch.bind(app),
  error(err: Error) {
    console.error("[BUN_ERROR]", err);
    return new Response(
      JSON.stringify({
        data: null,
        error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan internal" },
        meta: null,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  },
};
