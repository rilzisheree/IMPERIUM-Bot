import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  TextChannel,
  Message,
} from "discord.js";
import { hasPermission } from "../utils/permissions.js";
import { logToAllServers, buildLogEmbed } from "../utils/logger.js";

export const data = new SlashCommandBuilder()
  .setName("say")
  .setDescription("Send, reply to, or edit a message as the bot")
  .addStringOption((opt) =>
    opt.setName("message").setDescription("The message text").setRequired(true)
  )
  .addChannelOption((opt) =>
    opt.setName("channel").setDescription("Channel to send in (optional)")
  )
  .addStringOption((opt) =>
    opt.setName("reply_message_id").setDescription("Message ID to reply to (optional)")
  )
  .addStringOption((opt) =>
    opt.setName("edit_message_id").setDescription("Bot message ID to edit (optional)")
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await hasPermission(interaction.user.id, "say"))) {
    await interaction.reply({ content: "❌ You don't have permission to use `/say`.", ephemeral: true });
    return;
  }

  const text = interaction.options.getString("message", true);
  const channelOpt = interaction.options.getChannel("channel");
  const replyId = interaction.options.getString("reply_message_id");
  const editId = interaction.options.getString("edit_message_id");

  await interaction.deferReply({ ephemeral: true });

  const targetChannel = (channelOpt
    ? await interaction.client.channels.fetch(channelOpt.id)
    : interaction.channel) as TextChannel;

  if (!targetChannel) {
    await interaction.editReply({ content: "❌ Could not find the target channel." });
    return;
  }

  try {
    if (editId) {
      const msg = await targetChannel.messages.fetch(editId);
      await msg.edit(text);
      await interaction.editReply({ content: "✅ Message edited." });
    } else if (replyId) {
      const msg = await targetChannel.messages.fetch(replyId);
      await msg.reply(text);
      await interaction.editReply({ content: "✅ Replied to message." });
    } else {
      await targetChannel.send(text);
      await interaction.editReply({ content: "✅ Message sent." });
    }

    await logToAllServers(
      interaction.client,
      buildLogEmbed(
        "💬 Say Command Used",
        `**${interaction.user.tag}** used /say in **${interaction.guild?.name ?? "DM"}**`,
        [
          { name: "Channel", value: `<#${targetChannel.id}>`, inline: true },
          { name: "Action", value: editId ? "Edit" : replyId ? "Reply" : "Send", inline: true },
          { name: "Content", value: text.slice(0, 1024) },
        ]
      )
    );
  } catch (err) {
    await interaction.editReply({ content: `❌ Error: ${(err as Error).message}` });
  }
}
