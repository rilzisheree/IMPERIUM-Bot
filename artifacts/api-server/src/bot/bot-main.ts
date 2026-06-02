import { startBot } from "./bot/index.js";
import { logger } from "./lib/logger.js";

startBot().catch((err) => {
  logger.error({ err }, "Bot startup failed");
  process.exit(1);
});
