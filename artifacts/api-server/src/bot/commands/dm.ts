import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ColorResolvable,
} from "discord.js";
import { hasPermission } from "../utils/permissions.js";
import { logToAllServers, buildLogEmbed } from "../utils/logger.js";

const YELLOW = 0xffd700 as ColorResolvable;

export const data = new SlashCommandBuilder()
  .setName("dm")
  .setDescription("Send a direct message to a user as the bot")
  .addUserOption((opt) =>
    opt.setName("user").setDescription("Target user").setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName("message").setDescription("Message to send").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await hasPermission(interaction.user.id, "dm"))) {
    await interaction.reply({ content: "❌ You don't have permission to use `/dm`.", ephemeral: true });
    return;
  }

  const target = interaction.options.getUser("user", true);
  const text = interaction.options.getString("message", true);

  await interaction.deferReply({ ephemeral: true });

  try {
    await target.send(text);

    await logToAllServers(
      interaction.client,
      buildLogEmbed(
        "📨 DM Sent",
        `**${interaction.user.tag}** sent a DM to **${target.tag}**`,
        [
          { name: "Recipient", value: `<@${target.id}>`, inline: true },
          { name: "Content", value: text.slice(0, 1024) },
        ]
      )
    );

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(YELLOW)
          .setDescription(`✅ DM sent to **${target.tag}**.`),
      ],
    });
  } catch (err) {
    await interaction.editReply({
      content: `❌ Could not DM **${target.tag}** — they may have DMs disabled.`,
    });
  }
}
