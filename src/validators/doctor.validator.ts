import { z } from "zod";
import { objectIdSchema, paginationQuerySchema } from "./common.validator.js";

export const createDoctorSchema = z.object({
  name: z.string().trim().min(2, "Doctor name is required").max(120),
  specialization: z.string().trim().min(2, "Specialization is required").max(100),
  hospital: z.string().trim().min(2, "Hospital name is required").max(150),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number must be at least 7 characters")
    .max(30),
  email: z.string().trim().email("Valid email is required").toLowerCase(),
});

export const updateDoctorSchema = createDoctorSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field must be provided for update"
);

export const doctorIdParamSchema = z.object({
  id: objectIdSchema,
});

export const doctorPatientParamsSchema = z.object({
  id: objectIdSchema,
  patientId: objectIdSchema,
});

export const listDoctorsQuerySchema = paginationQuerySchema.extend({
  specialization: z.string().trim().optional().default(""),
  hospital: z.string().trim().optional().default(""),
  sortBy: z
    .enum(["createdAt", "name", "specialization", "hospital", "patientCount"])
    .optional()
    .default("createdAt"),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export type ListDoctorsQuery = z.infer<typeof listDoctorsQuerySchema>;
