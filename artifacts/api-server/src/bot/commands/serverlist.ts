import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ColorResolvable,
  Guild,
} from "discord.js";
import { hasPermission } from "../utils/permissions.js";
import { logToAllServers, buildLogEmbed } from "../utils/logger.js";

const YELLOW = 0xffd700 as ColorResolvable;

export const data = new SlashCommandBuilder()
  .setName("serverlist")
  .setDescription("List all servers the bot is in")
  .addStringOption((opt) =>
    opt
      .setName("leave")
      .setDescription("Server ID to leave (optional)")
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await hasPermission(interaction.user.id, "serverlist"))) {
    await interaction.reply({ content: "❌ You don't have permission to use `/serverlist`.", ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const leaveId = interaction.options.getString("leave");

  if (leaveId) {
    const guild = interaction.client.guilds.cache.get(leaveId);
    if (!guild) {
      await interaction.editReply({ content: `❌ Bot is not in a server with ID \`${leaveId}\`.` });
      return;
    }
    const guildName = guild.name;
    await guild.leave();

    await logToAllServers(
      interaction.client,
      buildLogEmbed(
        "🚪 Left Server",
        `Bot left server **${guildName}** (ID: \`${leaveId}\`) by **${interaction.user.tag}**`
      )
    );

    await interaction.editReply({ content: `✅ Left server **${guildName}**.` });
    return;
  }

  const guilds = interaction.client.guilds.cache;
  const chunks: EmbedBuilder[] = [];
  let current = new EmbedBuilder()
    .setColor(YELLOW)
    .setTitle(`📋 Server List (${guilds.size} servers)`)
    .setTimestamp();

  let fieldCount = 0;
  for (const [id, guild] of guilds) {
    let invite = "N/A";
    try {
      const invites = await guild.invites.create(guild.systemChannelId ?? (guild.channels.cache.find((c) => c.isTextBased())?.id ?? ""), { maxAge: 0, maxUses: 0 });
      invite = invites.url;
    } catch {
      /* no permissions */
    }

    current.addFields({
      name: guild.name,
      value: `ID: \`${id}\`\nMembers: **${guild.memberCount}**\nInvite: ${invite}`,
      inline: true,
    });
    fieldCount++;

    if (fieldCount === 9) {
      chunks.push(current);
      current = new EmbedBuilder().setColor(YELLOW).setTitle("📋 Server List (continued)");
      fieldCount = 0;
    }
  }

  if (fieldCount > 0) chunks.push(current);
  if (chunks.length === 0) {
    chunks.push(new EmbedBuilder().setColor(YELLOW).setDescription("Bot is not in any servers."));
  }

  await interaction.editReply({ embeds: [chunks[0]] });
  for (let i = 1; i < chunks.length; i++) {
    await interaction.followUp({ embeds: [chunks[i]], ephemeral: true });
  }
}
