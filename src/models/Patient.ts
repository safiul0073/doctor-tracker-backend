import mongoose, { Document, Model, Schema } from "mongoose";

export const PATIENT_CONDITIONS = [
  "Stable",
  "Under Observation",
  "Critical",
  "Recovering",
  "Discharged",
] as const;

export type PatientCondition = (typeof PATIENT_CONDITIONS)[number];

export const PATIENT_GENDERS = ["Male", "Female", "Other"] as const;
export type PatientGender = (typeof PATIENT_GENDERS)[number];

export interface IPatient extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  doctor: mongoose.Types.ObjectId;
  condition: PatientCondition;
  diagnosis: string;
  age: number;
  gender: PatientGender;
  phone: string;
  email?: string;
  admittedAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
  {
    name: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Assigned doctor is required"],
    },
    condition: {
      type: String,
      enum: PATIENT_CONDITIONS,
      required: [true, "Patient condition is required"],
      default: "Stable",
    },
    diagnosis: {
      type: String,
      required: [true, "Diagnosis is required"],
      trim: true,
      maxlength: 160,
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: 0,
      max: 130,
    },
    gender: {
      type: String,
      enum: PATIENT_GENDERS,
      required: [true, "Gender is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      maxlength: 30,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    admittedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound & single indexes optimized for doctor-patient lookups,
// condition filtering, date-range analytics, and paginated sorting
patientSchema.index({ doctor: 1, createdAt: -1 });
patientSchema.index({ condition: 1, createdAt: -1 });
patientSchema.index({ doctor: 1, condition: 1, createdAt: -1 });
patientSchema.index({ admittedAt: -1 });
patientSchema.index({ createdAt: -1 });
patientSchema.index({ name: 1 });

export const Patient: Model<IPatient> =
  mongoose.models.Patient || mongoose.model<IPatient>("Patient", patientSchema);
