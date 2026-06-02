import { Client, Events, REST, Routes } from "discord.js";
import { commands } from "../index.js";
import { logger } from "../../lib/logger.js";

export function registerReadyEvent(client: Client) {
  client.once(Events.ClientReady, async (readyClient) => {
    logger.info(`Discord bot logged in as ${readyClient.user.tag}`);

    const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!);
    const commandData = [...commands.values()].map((c) => c.data.toJSON());

    try {
      await rest.put(Routes.applicationCommands(readyClient.user.id), {
        body: commandData,
      });
      logger.info(`Registered ${commandData.length} global slash commands`);
    } catch (err) {
      logger.error({ err }, "Failed to register slash commands");
    }
  });
}
