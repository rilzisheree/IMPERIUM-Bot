import { Client, Events, Guild } from "discord.js";
import { logToAllServers, buildLogEmbed } from "../utils/logger.js";
import GlobalBan from "../models/GlobalBan.js";
import { logger } from "../../lib/logger.js";

export function registerGuildEvents(client: Client) {
  client.on(Events.GuildCreate, async (guild: Guild) => {
    logger.info(`Joined server: ${guild.name} (${guild.id})`);

    await logToAllServers(
      client,
      buildLogEmbed(
        "✅ Bot Joined Server",
        `Bot joined **${guild.name}**`,
        [
          { name: "Server ID", value: guild.id, inline: true },
          { name: "Members", value: `${guild.memberCount}`, inline: true },
        ]
      )
    );

    // Apply existing global bans to new server
    const bans = await GlobalBan.find();
    let applied = 0;
    for (const ban of bans) {
      try {
        await guild.bans.create(ban.userId, {
          reason: `[Global Ban] ${ban.reason}`,
        });
        applied++;
      } catch {
        /* user may not be in this guild */
      }
    }
    if (applied > 0) {
      logger.info(`Applied ${applied} global bans to new guild ${guild.name}`);
    }
  });

  client.on(Events.GuildDelete, async (guild: Guild) => {
    logger.info(`Left server: ${guild.name} (${guild.id})`);

    await logToAllServers(
      client,
      buildLogEmbed(
        "🚪 Bot Left Server",
        `Bot left or was removed from **${guild.name}**`,
        [{ name: "Server ID", value: guild.id, inline: true }]
      )
    );
  });
}
