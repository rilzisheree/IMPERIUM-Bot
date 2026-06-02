import mongoose, { Schema, Document } from "mongoose";

export interface IAllowedUser extends Document {
  userId: string;
  commands: string[];
}

const AllowedUserSchema = new Schema<IAllowedUser>({
  userId: { type: String, required: true, unique: true },
  commands: { type: [String], default: [] },
});

export default mongoose.model<IAllowedUser>("AllowedUser", AllowedUserSchema);
