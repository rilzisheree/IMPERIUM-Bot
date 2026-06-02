import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ColorResolvable,
} from "discord.js";
import {
  isBotOwner,
  grantPermission,
  revokePermission,
  getUserPermissions,
  getAllAllowedUsers,
} from "../utils/permissions.js";
import { logToAllServers, buildLogEmbed } from "../utils/logger.js";

const YELLOW = 0xffd700 as ColorResolvable;

export const data = new SlashCommandBuilder()
  .setName("allowuser")
  .setDescription("Manage user command permissions")
  .addSubcommand((sub) =>
    sub
      .setName("add")
      .setDescription("Grant a user access to a command")
      .addUserOption((opt) =>
        opt.setName("user").setDescription("Target user").setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("command")
          .setDescription("Command name to grant")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("remove")
      .setDescription("Remove a user's access to a command")
      .addUserOption((opt) =>
        opt.setName("user").setDescription("Target user").setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("command")
          .setDescription("Command name to revoke")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("list")
      .setDescription("List all allowed users and their commands")
      .addUserOption((opt) =>
        opt.setName("user").setDescription("Filter by user (optional)")
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("check")
      .setDescription("Check what commands a user can access")
      .addUserOption((opt) =>
        opt.setName("user").setDescription("Target user").setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!isBotOwner(interaction.user.id)) {
    await interaction.reply({
      content: "❌ Only Bot Owners can manage permissions.",
      ephemeral: true,
    });
    return;
  }

  const sub = interaction.options.getSubcommand();

  if (sub === "add") {
    const target = interaction.options.getUser("user", true);
    const command = interaction.options.getString("command", true).toLowerCase();
    await grantPermission(target.id, command);

    await logToAllServers(
      interaction.client,
      buildLogEmbed(
        "🔑 Permission Granted",
        `**${interaction.user.tag}** granted **${target.tag}** access to \`/${command}\``,
        [
          { name: "User", value: `<@${target.id}>`, inline: true },
          { name: "Command", value: `\`/${command}\``, inline: true },
        ]
      )
    );

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(YELLOW)
          .setDescription(`✅ Granted **${target.tag}** access to \`/${command}\``),
      ],
      ephemeral: true,
    });
  } else if (sub === "remove") {
    const target = interaction.options.getUser("user", true);
    const command = interaction.options.getString("command", true).toLowerCase();
    await revokePermission(target.id, command);

    await logToAllServers(
      interaction.client,
      buildLogEmbed(
        "🔒 Permission Revoked",
        `**${interaction.user.tag}** revoked **${target.tag}**'s access to \`/${command}\``,
        [
          { name: "User", value: `<@${target.id}>`, inline: true },
          { name: "Command", value: `\`/${command}\``, inline: true },
        ]
      )
    );

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(YELLOW)
          .setDescription(`✅ Revoked **${target.tag}**'s access to \`/${command}\``),
      ],
      ephemeral: true,
    });
  } else if (sub === "list") {
    const filterUser = interaction.options.getUser("user");
    if (filterUser) {
      const cmds = await getUserPermissions(filterUser.id);
      const embed = new EmbedBuilder()
        .setColor(YELLOW)
        .setTitle(`Permissions for ${filterUser.tag}`)
        .setDescription(
          cmds.length > 0
            ? cmds.map((c) => `\`/${c}\``).join(", ")
            : "No permissions granted."
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
      const all = await getAllAllowedUsers();
      const embed = new EmbedBuilder()
        .setColor(YELLOW)
        .setTitle("All Allowed Users");

      if (all.length === 0) {
        embed.setDescription("No users have been granted permissions.");
      } else {
        for (const entry of all) {
          embed.addFields({
            name: `<@${entry.userId}> (${entry.userId})`,
            value: entry.commands.length > 0 ? entry.commands.map((c) => `\`/${c}\``).join(", ") : "None",
          });
        }
      }
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  } else if (sub === "check") {
    const target = interaction.options.getUser("user", true);
    const cmds = await getUserPermissions(target.id);
    const isOwner = isBotOwner(target.id);

    const embed = new EmbedBuilder()
      .setColor(YELLOW)
      .setTitle(`Command Access for ${target.tag}`)
      .setDescription(
        isOwner
          ? "✅ **Bot Owner** — Full access to all commands."
          : cmds.length > 0
          ? cmds.map((c) => `\`/${c}\``).join(", ")
          : "No permissions granted."
      );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
