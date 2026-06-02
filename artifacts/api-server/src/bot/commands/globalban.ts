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
  .setName("globalban")
  .setDescription("Ban a user across all servers the bot is in")
  .addUserOption((opt) =>
    opt.setName("user").setDescription("User to ban").setRequired(true)
  )
  .addStringOption((opt) =>
    opt.setName("reason").setDescription("Reason for the ban").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await hasPermission(interaction.user.id, "globalban"))) {
    await interaction.reply({ content: "❌ You don't have permission to use `/globalban`.", ephemeral: true });
    return;
  }

  const target = interaction.options.getUser("user", true);
  const reason = interaction.options.getString("reason", true);

  await interaction.deferReply({ ephemeral: true });

  const existing = await GlobalBan.findOne({ userId: target.id });
  if (existing) {
    await interaction.editReply({ content: `⚠️ **${target.tag}** is already globally banned.` });
    return;
  }

  await GlobalBan.create({
    userId: target.id,
    username: target.tag,
    reason,
    bannedBy: interaction.user.id,
  });

  let bannedCount = 0;
  let failedCount = 0;

  for (const [, guild] of interaction.client.guilds.cache) {
    try {
      await guild.bans.create(target.id, { reason: `[Global Ban] ${reason}` });
      bannedCount++;
    } catch {
      failedCount++;
    }
  }

  await logToAllServers(
    interaction.client,
    buildLogEmbed(
      "🔨 Global Ban",
      `**${target.tag}** (\`${target.id}\`) was globally banned by **${interaction.user.tag}**`,
      [
        { name: "Reason", value: reason },
        { name: "Servers Banned", value: `${bannedCount}`, inline: true },
        { name: "Failed", value: `${failedCount}`, inline: true },
      ]
    )
  );

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(YELLOW)
        .setTitle("✅ Global Ban Applied")
        .addFields(
          { name: "User", value: `${target.tag} (\`${target.id}\`)`, inline: true },
          { name: "Reason", value: reason },
          { name: "Servers Banned", value: `${bannedCount}`, inline: true },
          { name: "Failed", value: `${failedCount}`, inline: true }
        ),
    ],
  });
}
