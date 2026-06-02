import {
  Client,
  EmbedBuilder,
  TextChannel,
  Guild,
  ColorResolvable,
} from "discord.js";
import LogChannel from "../models/LogChannel.js";

const YELLOW = 0xffd700 as ColorResolvable;

export async function getLogChannel(
  client: Client,
  guildId: string
): Promise<TextChannel | null> {
  const record = await LogChannel.findOne({ guildId });
  if (!record) return null;
  try {
    const channel = await client.channels.fetch(record.channelId);
    if (channel instanceof TextChannel) return channel;
  } catch {
    /* channel may have been deleted */
  }
  return null;
}

export async function logToAllServers(
  client: Client,
  embed: EmbedBuilder
): Promise<void> {
  const records = await LogChannel.find();
  for (const record of records) {
    try {
      const channel = await client.channels.fetch(record.channelId);
      if (channel instanceof TextChannel) {
        await channel.send({ embeds: [embed] });
      }
    } catch {
      /* skip unreachable channels */
    }
  }
}

export function buildLogEmbed(
  title: string,
  description: string,
  fields?: { name: string; value: string; inline?: boolean }[]
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(YELLOW)
    .setTimestamp();
  if (fields) embed.addFields(fields);
  return embed;
}
