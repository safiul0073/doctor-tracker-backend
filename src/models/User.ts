import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
