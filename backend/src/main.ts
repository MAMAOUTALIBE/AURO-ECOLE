import { createServer } from "node:http";
import { createApp } from "./app";
import { loadConfig } from "./config/env";
import { createRepository } from "./repositories/repository-factory";

const config = loadConfig();
const repository = createRepository(config);
const app = createApp(repository, config);
const server = createServer(app);

server.listen(config.PORT, () => {
  console.log(`LODEN API listening on http://127.0.0.1:${config.PORT}`);
});

function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down LODEN API`);
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
