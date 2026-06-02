import mongoose, { Schema, Document } from "mongoose";

export interface ILogChannel extends Document {
  guildId: string;
  channelId: string;
}

const LogChannelSchema = new Schema<ILogChannel>({
  guildId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
});

export default mongoose.model<ILogChannel>("LogChannel", LogChannelSchema);
