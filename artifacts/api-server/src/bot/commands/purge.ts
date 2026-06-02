import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  TextChannel,
  EmbedBuilder,
  ColorResolvable,
} from "discord.js";
import { hasPermission } from "../utils/permissions.js";
import { logToAllServers, buildLogEmbed } from "../utils/logger.js";

const YELLOW = 0xffd700 as ColorResolvable;

export const data = new SlashCommandBuilder()
  .setName("purge")
  .setDescription("Delete a specified number of messages")
  .addIntegerOption((opt) =>
    opt
      .setName("amount")
      .setDescription("Number of messages to delete (1-100)")
      .setMinValue(1)
      .setMaxValue(100)
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await hasPermission(interaction.user.id, "purge"))) {
    await interaction.reply({ content: "❌ You don't have permission to use `/purge`.", ephemeral: true });
    return;
  }

  const amount = interaction.options.getInteger("amount", true);
  const channel = interaction.channel as TextChannel;

  await interaction.deferReply({ ephemeral: true });

  const deleted = await channel.bulkDelete(amount, true);

  await logToAllServers(
    interaction.client,
    buildLogEmbed(
      "🗑️ Messages Purged",
      `**${interaction.user.tag}** purged messages in **${interaction.guild?.name ?? "Unknown"}**`,
      [
        { name: "Channel", value: `<#${channel.id}>`, inline: true },
        { name: "Deleted", value: `${deleted.size}`, inline: true },
      ]
    )
  );

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(YELLOW)
        .setDescription(`✅ Deleted **${deleted.size}** message(s).`),
    ],
  });
}
