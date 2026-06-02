import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ColorResolvable,
  GuildMember,
} from "discord.js";
import { hasPermission } from "../utils/permissions.js";
import { logToAllServers, buildLogEmbed } from "../utils/logger.js";

const YELLOW = 0xffd700 as ColorResolvable;
const ROLE_ADD_ID = "1463028818275991685";
const ROLE_REMOVE_ID = "1444837994270822452";

export const data = new SlashCommandBuilder()
  .setName("wave")
  .setDescription("Wave a user into IMPERIUM")
  .addUserOption((opt) =>
    opt.setName("user").setDescription("User to wave in").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await hasPermission(interaction.user.id, "wave"))) {
    await interaction.reply({
      content: "❌ You don't have permission to use `/wave`.",
      ephemeral: true,
    });
    return;
  }

  if (!interaction.guild) {
    await interaction.reply({
      content: "❌ This command must be used in a server.",
      ephemeral: true,
    });
    return;
  }

  const target = interaction.options.getUser("user", true);
  await interaction.deferReply({ ephemeral: true });

  const member = await interaction.guild.members.fetch(target.id).catch(() => null);
  if (!member) {
    await interaction.editReply({ content: "❌ That user is not in this server." });
    return;
  }

  const errors: string[] = [];

  try {
    await member.roles.add(ROLE_ADD_ID, `Waved in by ${interaction.user.tag}`);
  } catch {
    errors.push("⚠️ Could not add the waved role (missing permissions or invalid role).");
  }

  try {
    await member.roles.remove(ROLE_REMOVE_ID, `Waved in by ${interaction.user.tag}`);
  } catch {
    /* User may not have the role — silently skip */
  }

  const guild = interaction.guild;
  const embed = new EmbedBuilder()
    .setColor(YELLOW)
    .setTitle("You have been waved in IMPERIUM!")
    .setDescription(
      `Welcome to **IMPERIUM!** **IMPERIUM** is a hardcore game with permanent death. Losing characters is part of the experience.\n\n` +
      `You've been **accepted** and have been **waved**, and now have **full access** to join **IMPERIUM**.\n\n` +
      `## How to get started?\n` +
      `Please read and follow the general and lore rules stated in the server. You may also ask for help from Staff Members or other community members.\n` +
      `Join the IMPERIUM-affiliated servers, such as "Lore Information" and "Support" servers, for further information.\n\n` +
      `We're excited to see the path you carve out in **IMPERIUM**. There's a lot ahead of you, and we can't wait to watch you grow, push your limits, and make your mark. Good luck, and enjoy every step of the journey!`
    )
    .setThumbnail(guild.iconURL() ?? null)
    .setFooter({
      text: guild.name,
      iconURL: guild.iconURL() ?? undefined,
    })
    .setTimestamp();

  let dmSent = true;
  try {
    await target.send({ embeds: [embed] });
  } catch {
    dmSent = false;
  }

  await logToAllServers(
    interaction.client,
    buildLogEmbed(
      "👋 User Waved",
      `**${interaction.user.tag}** waved **${target.tag}** into **${guild.name}**`,
      [
        { name: "User", value: `<@${target.id}>`, inline: true },
        { name: "DM Sent", value: dmSent ? "✅ Yes" : "❌ No (DMs closed)", inline: true },
      ]
    )
  );

  const replyLines = [`✅ **${target.tag}** has been waved in.`];
  if (!dmSent) replyLines.push("⚠️ Could not DM the user — they may have DMs disabled.");
  if (errors.length > 0) replyLines.push(...errors);

  await interaction.editReply({ content: replyLines.join("\n") });
}
