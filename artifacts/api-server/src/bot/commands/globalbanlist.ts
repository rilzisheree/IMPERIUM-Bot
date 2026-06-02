import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ColorResolvable,
} from "discord.js";
import { hasPermission } from "../utils/permissions.js";
import GlobalBan from "../models/GlobalBan.js";

const YELLOW = 0xffd700 as ColorResolvable;

export const data = new SlashCommandBuilder()
  .setName("globalbanlist")
  .setDescription("View and manage the global ban list")
  .addStringOption((opt) =>
    opt.setName("search").setDescription("Search by username or user ID (optional)")
  )
  .addStringOption((opt) =>
    opt.setName("remove_id").setDescription("Remove a global ban by user ID (optional)")
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await hasPermission(interaction.user.id, "globalbanlist"))) {
    await interaction.reply({ content: "❌ You don't have permission to use `/globalbanlist`.", ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const removeId = interaction.options.getString("remove_id");
  if (removeId) {
    const record = await GlobalBan.findOneAndDelete({ userId: removeId.trim() });
    if (!record) {
      await interaction.editReply({ content: `⚠️ No global ban found for user ID \`${removeId}\`.` });
    } else {
      await interaction.editReply({ content: `✅ Removed global ban for **${record.username}** (\`${removeId}\`).` });
    }
    return;
  }

  const search = interaction.options.getString("search");
  const query = search
    ? {
        $or: [
          { userId: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const bans = await GlobalBan.find(query).sort({ bannedAt: -1 }).limit(25);

  if (bans.length === 0) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(YELLOW)
          .setTitle("Global Ban List")
          .setDescription(search ? "No results found." : "No global bans on record."),
      ],
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(YELLOW)
    .setTitle(`🔨 Global Ban List${search ? ` — "${search}"` : ""}`)
    .setDescription(`Showing **${bans.length}** result(s)`)
    .setTimestamp();

  for (const ban of bans) {
    embed.addFields({
      name: `${ban.username} (${ban.userId})`,
      value: `Reason: ${ban.reason}\nBanned: <t:${Math.floor(ban.bannedAt.getTime() / 1000)}:R>`,
    });
  }

  await interaction.editReply({ embeds: [embed] });
}
