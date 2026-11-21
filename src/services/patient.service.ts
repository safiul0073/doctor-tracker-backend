import mongoose from "mongoose";
import { Doctor } from "../models/Doctor.js";
import { Patient } from "../models/Patient.js";
import { notFoundError } from "../utils/errors.js";
import { escapeRegex } from "../utils/regex.js";
import type {
  CreatePatientInput,
  ListPatientsQuery,
  UpdatePatientInput,
} from "../validators/patient.validator.js";

function buildDateFilter(from?: string, to?: string) {
  const range: Record<string, Date> = {};
  if (from) {
    range.$gte = new Date(from);
  }
  if (to) {
    const end = new Date(to);
    if (to.length <= 10) {
      end.setUTCHours(23, 59, 59, 999);
    }
    range.$lte = end;
  }
  return Object.keys(range).length > 0 ? range : undefined;
}

export async function listPatients(query: ListPatientsQuery) {
  const {
    page,
    limit,
    search,
    condition,
    doctorId,
    gender,
    from,
    to,
    sortBy,
    sortOrder,
  } = query;

  const filter: Record<string, unknown> = {};

  if (condition) {
    filter.condition = condition;
  }

  if (doctorId) {
    filter.doctor = new mongoose.Types.ObjectId(doctorId);
  }

  if (gender) {
    filter.gender = gender;
  }

  const dateRange = buildDateFilter(from, to);
  if (dateRange) {
    filter.admittedAt = dateRange;
  }

  if (search) {
    const safeRegex = new RegExp(escapeRegex(search), "i");
    // Also allow searching by doctor's name cleanly via indexed doctor lookup
    const matchingDoctors = await Doctor.find({ name: safeRegex })
      .select("_id")
      .lean();
    const matchingDoctorIds = matchingDoctors.map((d) => d._id);

    filter.$or = [
      { name: safeRegex },
      { diagnosis: safeRegex },
      { phone: safeRegex },
      { email: safeRegex },
      { condition: safeRegex },
      ...(matchingDoctorIds.length > 0 ? [{ doctor: { $in: matchingDoctorIds } }] : []),
    ];
  }

  const sortDirection = sortOrder === "asc" ? 1 : -1;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Patient.find(filter)
      .populate("doctor", "name specialization hospital")
      .sort({ [sortBy]: sortDirection, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Patient.countDocuments(filter),
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
}

export async function getPatientById(id: string) {
  const patient = await Patient.findById(id)
    .populate("doctor", "name specialization hospital phone email")
    .lean();

  if (!patient) {
    throw notFoundError("Patient");
  }

  return patient;
}

export async function createPatient(input: CreatePatientInput) {
  const doctorExists = await Doctor.exists({ _id: input.doctor });
  if (!doctorExists) {
    throw notFoundError("Assigned doctor");
  }

  const created = await Patient.create({
    ...input,
    admittedAt: input.admittedAt ? new Date(input.admittedAt) : new Date(),
  });

  const populated = await Patient.findById(created._id)
    .populate("doctor", "name specialization hospital")
    .lean();

  return populated;
}

export async function updatePatient(id: string, input: UpdatePatientInput) {
  if (input.doctor) {
    const doctorExists = await Doctor.exists({ _id: input.doctor });
    if (!doctorExists) {
      throw notFoundError("Assigned doctor");
    }
  }

  const updatePayload: Record<string, unknown> = { ...input };
  if (input.admittedAt) {
    updatePayload.admittedAt = new Date(input.admittedAt);
  }

  const updated = await Patient.findByIdAndUpdate(id, updatePayload, {
    new: true,
    runValidators: true,
  })
    .populate("doctor", "name specialization hospital")
    .lean();

  if (!updated) {
    throw notFoundError("Patient");
  }

  return updated;
}

export async function deletePatient(id: string) {
  const deleted = await Patient.findByIdAndDelete(id).lean();
  if (!deleted) {
    throw notFoundError("Patient");
  }

  return { deletedPatientId: deleted._id.toString() };
}
