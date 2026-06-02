import { Client, Events, ChatInputCommandInteraction } from "discord.js";
import { commands } from "../index.js";
import { logToAllServers, buildLogEmbed } from "../utils/logger.js";
import { logger } from "../../lib/logger.js";

export function registerInteractionCreateEvent(client: Client) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction as ChatInputCommandInteraction);

      await logToAllServers(
        client,
        buildLogEmbed(
          "⚙️ Command Used",
          `**${interaction.user.tag}** used \`/${interaction.commandName}\``,
          [
            {
              name: "Server",
              value: interaction.guild?.name ?? "DM",
              inline: true,
            },
            {
              name: "Channel",
              value: interaction.channelId
                ? `<#${interaction.channelId}>`
                : "DM",
              inline: true,
            },
          ]
        )
      );
    } catch (err) {
      logger.error({ err, command: interaction.commandName }, "Command error");

      const errorMsg = {
        content: "❌ An error occurred while executing this command.",
        ephemeral: true,
      };
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMsg);
        } else {
          await interaction.reply(errorMsg);
        }
      } catch {
        /* ignore secondary errors */
      }

      await logToAllServers(
        client,
        buildLogEmbed(
          "🚨 Command Error",
          `Error in \`/${interaction.commandName}\` by **${interaction.user.tag}**`,
          [{ name: "Error", value: (err as Error).message.slice(0, 1024) }]
        )
      );
    }
  });
}
