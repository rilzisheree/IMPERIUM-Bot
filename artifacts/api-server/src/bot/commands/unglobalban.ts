import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ColorResolvable,
} from "discord.js";
import { hasPermission } from "../utils/permissions.js";
import { logToAllServers, buildLogEmbed } from "../utils/logger.js";
import GlobalBan from "../models/GlobalBan.js";

const YELLOW = 0xffd700 as ColorResolvable;

export const data = new SlashCommandBuilder()
  .setName("unglobalban")
  .setDescription("Remove a user's global ban")
  .addStringOption((opt) =>
    opt.setName("user_id").setDescription("User ID to unban").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await hasPermission(interaction.user.id, "unglobalban"))) {
    await interaction.reply({ content: "❌ You don't have permission to use `/unglobalban`.", ephemeral: true });
    return;
  }

  const userId = interaction.options.getString("user_id", true).trim();

  await interaction.deferReply({ ephemeral: true });

  const record = await GlobalBan.findOne({ userId });
  if (!record) {
    await interaction.editReply({ content: `⚠️ No global ban found for user ID \`${userId}\`.` });
    return;
  }

  await GlobalBan.deleteOne({ userId });

  let unbannedCount = 0;
  let failedCount = 0;

  for (const [, guild] of interaction.client.guilds.cache) {
    try {
      await guild.bans.remove(userId, `[Global Unban] by ${interaction.user.tag}`);
      unbannedCount++;
    } catch {
      failedCount++;
    }
  }

  await logToAllServers(
    interaction.client,
    buildLogEmbed(
      "✅ Global Unban",
      `User \`${userId}\` (${record.username}) was globally unbanned by **${interaction.user.tag}**`,
      [
        { name: "Servers Unbanned", value: `${unbannedCount}`, inline: true },
        { name: "Failed", value: `${failedCount}`, inline: true },
      ]
    )
  );

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(YELLOW)
        .setTitle("✅ Global Unban Applied")
        .addFields(
          { name: "User", value: `${record.username} (\`${userId}\`)`, inline: true },
          { name: "Servers Unbanned", value: `${unbannedCount}`, inline: true },
          { name: "Failed", value: `${failedCount}`, inline: true }
        ),
    ],
  });
}
