import { Client, Events, Message, AuditLogEvent } from "discord.js";
import { logToAllServers, buildLogEmbed } from "../utils/logger.js";

export function registerMessageEvents(client: Client) {
  client.on(Events.MessageDelete, async (message) => {
    if (message.partial || message.author?.bot) return;
    await logToAllServers(
      client,
      buildLogEmbed(
        "🗑️ Message Deleted",
        `A message by **${message.author?.tag ?? "Unknown"}** was deleted in **${message.guild?.name ?? "Unknown"}**`,
        [
          {
            name: "Channel",
            value: `<#${message.channelId}>`,
            inline: true,
          },
          {
            name: "Content",
            value: (message.content?.slice(0, 1024)) || "_[No text content]_",
          },
        ]
      )
    );
  });

  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (oldMessage.partial || newMessage.partial) return;
    if (newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    await logToAllServers(
      client,
      buildLogEmbed(
        "✏️ Message Edited",
        `**${newMessage.author?.tag ?? "Unknown"}** edited a message in **${newMessage.guild?.name ?? "Unknown"}**`,
        [
          { name: "Channel", value: `<#${newMessage.channelId}>`, inline: true },
          { name: "Before", value: (oldMessage.content?.slice(0, 512)) || "_empty_" },
          { name: "After", value: (newMessage.content?.slice(0, 512)) || "_empty_" },
        ]
      )
    );
  });
}
