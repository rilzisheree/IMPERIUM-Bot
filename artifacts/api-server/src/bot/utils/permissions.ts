import { Client } from "discord.js";
import AllowedUser from "../models/AllowedUser.js";

export function getBotOwners(): string[] {
  const raw = process.env.DISCORD_BOT_OWNER_IDS ?? "";
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isBotOwner(userId: string): boolean {
  return getBotOwners().includes(userId);
}

export async function hasPermission(
  userId: string,
  command: string
): Promise<boolean> {
  if (isBotOwner(userId)) return true;
  const record = await AllowedUser.findOne({ userId });
  if (!record) return false;
  return record.commands.includes(command);
}

export async function grantPermission(
  userId: string,
  command: string
): Promise<void> {
  await AllowedUser.findOneAndUpdate(
    { userId },
    { $addToSet: { commands: command } },
    { upsert: true }
  );
}

export async function revokePermission(
  userId: string,
  command: string
): Promise<void> {
  await AllowedUser.findOneAndUpdate({ userId }, { $pull: { commands: command } });
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const record = await AllowedUser.findOne({ userId });
  return record?.commands ?? [];
}

export async function getAllAllowedUsers(): Promise<
  { userId: string; commands: string[] }[]
> {
  const records = await AllowedUser.find();
  return records.map((r) => ({ userId: r.userId, commands: r.commands }));
}
