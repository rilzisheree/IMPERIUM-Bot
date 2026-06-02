import mongoose, { Schema, Document } from "mongoose";

export interface IGlobalBan extends Document {
  userId: string;
  username: string;
  reason: string;
  bannedBy: string;
  bannedAt: Date;
}

const GlobalBanSchema = new Schema<IGlobalBan>({
  userId: { type: String, required: true, unique: true },
  username: { type: String, default: "Unknown" },
  reason: { type: String, required: true },
  bannedBy: { type: String, required: true },
  bannedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IGlobalBan>("GlobalBan", GlobalBanSchema);
