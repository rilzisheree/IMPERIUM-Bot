import {
  Client,
  GatewayIntentBits,
  Collection,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import mongoose from "mongoose";
import { logger } from "../lib/logger.js";

import * as allowuser from "./commands/allowuser.js";
import * as purge from "./commands/purge.js";
import * as say from "./commands/say.js";
import * as dm from "./commands/dm.js";
import * as serverlist from "./commands/serverlist.js";
import * as globalban from "./commands/globalban.js";
import * as unglobalban from "./commands/unglobalban.js";
import * as globalbanlist from "./commands/globalbanlist.js";
import * as setlogchannel from "./commands/setlogchannel.js";
import * as wave from "./commands/wave.js";

import { registerReadyEvent } from "./events/ready.js";
import { registerInteractionCreateEvent } from "./events/interactionCreate.js";
import { registerMessageEvents } from "./events/messageEvents.js";
import { registerGuildEvents } from "./events/guildEvents.js";

type Command = {
  data:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

export const commands = new Collection<string, Command>();

const commandModules: Command[] = [
  allowuser,
  purge,
  say,
  dm,
  serverlist,
  globalban,
  unglobalban,
  globalbanlist,
  setlogchannel,
  wave,
];

for (const mod of commandModules) {
  commands.set(mod.data.name, mod);
}

export async function startBot() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    logger.error("MONGODB_URI is not set — bot cannot start");
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    logger.info("Connected to MongoDB");
  } catch (err) {
    logger.error({ err }, "Failed to connect to MongoDB");
    return;
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    logger.error("DISCORD_BOT_TOKEN is not set — bot cannot start");
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildBans,
      GatewayIntentBits.MessageContent,
    ],
  });

  registerReadyEvent(client);
  registerInteractionCreateEvent(client);
  registerMessageEvents(client);
  registerGuildEvents(client);

  try {
    await client.login(token);
  } catch (err) {
    logger.error({ err }, "Failed to login to Discord");
  }
}
