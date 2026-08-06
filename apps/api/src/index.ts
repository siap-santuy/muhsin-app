import { buildContainer } from "./bootstrap/container";

const { app } = buildContainer();

export default {
  port: 3001,
  fetch: app.fetch,
};
