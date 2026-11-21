import mongoose, { Document, Model, Schema } from "mongoose";

export interface IDoctor extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>(
  {
    name: {
      type: String,
      required: [true, "Doctor name is required"],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      trim: true,
      maxlength: 100,
    },
    hospital: {
      type: String,
      required: [true, "Hospital is required"],
      trim: true,
      maxlength: 150,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      maxlength: 30,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes optimized for search, filtering, date-range queries, and pagination
doctorSchema.index({ createdAt: -1 });
doctorSchema.index({ specialization: 1, createdAt: -1 });
doctorSchema.index({ hospital: 1, createdAt: -1 });
doctorSchema.index({ name: 1 });

export const Doctor: Model<IDoctor> =
  mongoose.models.Doctor || mongoose.model<IDoctor>("Doctor", doctorSchema);
