import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ColorResolvable,
  TextChannel,
} from "discord.js";
import { hasPermission } from "../utils/permissions.js";
import { logToAllServers, buildLogEmbed } from "../utils/logger.js";
import LogChannel from "../models/LogChannel.js";

const YELLOW = 0xffd700 as ColorResolvable;

export const data = new SlashCommandBuilder()
  .setName("setlogchannel")
  .setDescription("Manage the global log channel")
  .addSubcommand((sub) =>
    sub
      .setName("setglobal")
      .setDescription("Set the global log channel for this server")
      .addChannelOption((opt) =>
        opt.setName("channel").setDescription("Log channel").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("remove").setDescription("Remove the global log channel for this server")
  )
  .addSubcommand((sub) =>
    sub.setName("check").setDescription("Show the current global log channel for this server")
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await hasPermission(interaction.user.id, "setlogchannel"))) {
    await interaction.reply({ content: "❌ You don't have permission to use `/setlogchannel`.", ephemeral: true });
    return;
  }

  if (!interaction.guild) {
    await interaction.reply({ content: "❌ This command must be used in a server.", ephemeral: true });
    return;
  }

  const sub = interaction.options.getSubcommand();

  if (sub === "setglobal") {
    const ch = interaction.options.getChannel("channel", true);
    await LogChannel.findOneAndUpdate(
      { guildId: interaction.guild.id },
      { channelId: ch.id },
      { upsert: true }
    );

    await logToAllServers(
      interaction.client,
      buildLogEmbed(
        "📋 Log Channel Set",
        `**${interaction.user.tag}** set the log channel in **${interaction.guild.name}** to <#${ch.id}>`
      )
    );

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(YELLOW)
          .setDescription(`✅ Global log channel set to <#${ch.id}>.`),
      ],
      ephemeral: true,
    });
  } else if (sub === "remove") {
    const deleted = await LogChannel.findOneAndDelete({ guildId: interaction.guild.id });
    if (!deleted) {
      await interaction.reply({ content: "⚠️ No log channel is configured for this server.", ephemeral: true });
      return;
    }

    await logToAllServers(
      interaction.client,
      buildLogEmbed(
        "📋 Log Channel Removed",
        `**${interaction.user.tag}** removed the log channel from **${interaction.guild.name}**`
      )
    );

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(YELLOW)
          .setDescription("✅ Global log channel removed for this server."),
      ],
      ephemeral: true,
    });
  } else if (sub === "check") {
    const record = await LogChannel.findOne({ guildId: interaction.guild.id });
    if (!record) {
      await interaction.reply({ content: "⚠️ No log channel configured for this server.", ephemeral: true });
      return;
    }
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(YELLOW)
          .setDescription(`📋 Current log channel: <#${record.channelId}>`),
      ],
      ephemeral: true,
    });
  }
}
