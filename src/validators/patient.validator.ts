import { z } from "zod";
import { PATIENT_CONDITIONS, PATIENT_GENDERS } from "../models/Patient.js";
import { objectIdSchema, optionalDateString, paginationQuerySchema } from "./common.validator.js";

const basePatientFields = {
  name: z.string().trim().min(2, "Patient name is required").max(120),
  condition: z.enum(PATIENT_CONDITIONS),
  diagnosis: z.string().trim().min(2, "Diagnosis is required").max(160),
  age: z.coerce.number().int().min(0, "Age must be 0 or above").max(130, "Invalid age"),
  gender: z.enum(PATIENT_GENDERS),
  phone: z.string().trim().min(7, "Phone number must be at least 7 characters").max(30),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email")
    .toLowerCase()
    .or(z.literal(""))
    .optional()
    .default(""),
  admittedAt: optionalDateString,
  notes: z.string().trim().max(1000).optional().default(""),
};

export const createPatientSchema = z.object({
  ...basePatientFields,
  doctor: objectIdSchema,
});

export const createPatientUnderDoctorSchema = z.object(basePatientFields);

export const updatePatientSchema = z
  .object({
    ...basePatientFields,
    doctor: objectIdSchema,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export const patientIdParamSchema = z.object({
  id: objectIdSchema,
});

export const listPatientsQuerySchema = paginationQuerySchema.extend({
  condition: z.enum([...PATIENT_CONDITIONS, ""]).optional().default(""),
  doctorId: z.union([objectIdSchema, z.literal("")]).optional().default(""),
  gender: z.enum([...PATIENT_GENDERS, ""]).optional().default(""),
  sortBy: z
    .enum(["admittedAt", "createdAt", "name", "age", "condition"])
    .optional()
    .default("admittedAt"),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type CreatePatientUnderDoctorInput = z.infer<typeof createPatientUnderDoctorSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type ListPatientsQuery = z.infer<typeof listPatientsQuerySchema>;
