import mongoose, { FilterQuery, PipelineStage } from "mongoose";
import { Doctor, IDoctor } from "../models/Doctor.js";
import { Patient } from "../models/Patient.js";
import { conflictError, notFoundError } from "../utils/errors.js";
import { escapeRegex } from "../utils/regex.js";
import type {
  CreateDoctorInput,
  ListDoctorsQuery,
  UpdateDoctorInput,
} from "../validators/doctor.validator.js";
import type {
  CreatePatientUnderDoctorInput,
  ListPatientsQuery,
} from "../validators/patient.validator.js";

function buildDateFilter(from?: string, to?: string) {
  const range: Record<string, Date> = {};
  if (from) {
    range.$gte = new Date(from);
  }
  if (to) {
    const end = new Date(to);
    // Include the full day if an ISO date (YYYY-MM-DD) is supplied
    if (to.length <= 10) {
      end.setUTCHours(23, 59, 59, 999);
    }
    range.$lte = end;
  }
  return Object.keys(range).length > 0 ? range : undefined;
}

export async function listDoctors(query: ListDoctorsQuery) {
  const { page, limit, search, specialization, hospital, from, to, sortBy, sortOrder } =
    query;

  const match: FilterQuery<IDoctor> = {};

  if (specialization) {
    match.specialization = specialization;
  }

  if (hospital) {
    match.hospital = hospital;
  }

  const createdRange = buildDateFilter(from, to);
  if (createdRange) {
    match.createdAt = createdRange;
  }

  if (search) {
    const safeRegex = new RegExp(escapeRegex(search), "i");
    match.$or = [
      { name: safeRegex },
      { specialization: safeRegex },
      { hospital: safeRegex },
      { email: safeRegex },
      { phone: safeRegex },
    ];
  }

  const direction = sortOrder === "asc" ? 1 : -1;
  const skip = (page - 1) * limit;

  // Optimization: When sorting by an indexed Doctor field, paginate ($skip/$limit) BEFORE
  // joining patient counts via $lookup so MongoDB only counts patients for the current page.
  const patientCountLookup: PipelineStage.FacetPipelineStage[] = [
    {
      $lookup: {
        from: "patients",
        let: { doctorId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$doctor", "$$doctorId"] } } },
          { $count: "count" },
        ],
        as: "patientStats",
      },
    },
    {
      $addFields: {
        patientCount: {
          $ifNull: [{ $arrayElemAt: ["$patientStats.count", 0] }, 0],
        },
      },
    },
    { $project: { patientStats: 0 } },
  ];

  let pipeline: PipelineStage[];

  if (sortBy === "patientCount") {
    pipeline = [
      { $match: match },
      ...patientCountLookup,
      { $sort: { patientCount: direction, createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          meta: [{ $count: "total" }],
        },
      },
    ];
  } else {
    pipeline = [
      { $match: match },
      { $sort: { [sortBy]: direction, _id: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }, ...patientCountLookup],
          meta: [{ $count: "total" }],
        },
      },
    ];
  }

  const [result] = await Doctor.aggregate(pipeline);
  const items = result?.data ?? [];
  const total: number = result?.meta?.[0]?.total ?? 0;

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

export async function getDoctorFilterOptions() {
  const [specializations, hospitals, doctors] = await Promise.all([
    Doctor.distinct("specialization"),
    Doctor.distinct("hospital"),
    Doctor.find({}).select("name specialization hospital").sort({ name: 1 }).lean(),
  ]);

  return {
    specializations: specializations.filter(Boolean).sort((a, b) => a.localeCompare(b)),
    hospitals: hospitals.filter(Boolean).sort((a, b) => a.localeCompare(b)),
    doctors,
  };
}

export async function getDoctorById(id: string) {
  const objectId = new mongoose.Types.ObjectId(id);

  const [doctor, conditionCounts] = await Promise.all([
    Doctor.findById(objectId).lean(),
    Patient.aggregate([
      { $match: { doctor: objectId } },
      { $group: { _id: "$condition", count: { $sum: 1 } } },
    ]),
  ]);

  if (!doctor) {
    throw notFoundError("Doctor");
  }

  const conditionSummary: Record<string, number> = {};
  let patientCount = 0;
  for (const row of conditionCounts) {
    conditionSummary[row._id] = row.count;
    patientCount += row.count;
  }

  return {
    ...doctor,
    patientCount,
    conditionSummary,
  };
}

export async function createDoctor(input: CreateDoctorInput) {
  const existing = await Doctor.findOne({ email: input.email.toLowerCase() })
    .select("_id")
    .lean();

  if (existing) {
    throw conflictError("A doctor with this email already exists");
  }

  const doctor = await Doctor.create(input);
  return { ...doctor.toObject(), patientCount: 0 };
}

export async function updateDoctor(id: string, input: UpdateDoctorInput) {
  if (input.email) {
    const duplicate = await Doctor.findOne({
      email: input.email.toLowerCase(),
      _id: { $ne: id },
    })
      .select("_id")
      .lean();
    if (duplicate) {
      throw conflictError("Another doctor already uses this email");
    }
  }

  const updated = await Doctor.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  }).lean();

  if (!updated) {
    throw notFoundError("Doctor");
  }

  const patientCount = await Patient.countDocuments({ doctor: updated._id });
  return { ...updated, patientCount };
}

export async function deleteDoctor(id: string) {
  const doctor = await Doctor.findByIdAndDelete(id).lean();
  if (!doctor) {
    throw notFoundError("Doctor");
  }

  const deletedPatients = await Patient.deleteMany({ doctor: doctor._id });

  return {
    deletedDoctorId: doctor._id.toString(),
    deletedPatientsCount: deletedPatients.deletedCount ?? 0,
  };
}

export async function listDoctorPatients(doctorId: string, query: ListPatientsQuery) {
  const doctorExists = await Doctor.exists({ _id: doctorId });
  if (!doctorExists) {
    throw notFoundError("Doctor");
  }

  const { page, limit, search, condition, gender, from, to, sortBy, sortOrder } = query;
  const filter: Record<string, unknown> = {
    doctor: new mongoose.Types.ObjectId(doctorId),
  };

  if (condition) {
    filter.condition = condition;
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
    filter.$or = [
      { name: safeRegex },
      { diagnosis: safeRegex },
      { phone: safeRegex },
      { email: safeRegex },
      { condition: safeRegex },
    ];
  }

  const sortDirection = sortOrder === "asc" ? 1 : -1;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Patient.find(filter)
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

export async function addPatientToDoctor(
  doctorId: string,
  input: CreatePatientUnderDoctorInput
) {
  const doctor = await Doctor.findById(doctorId).select("name specialization hospital").lean();
  if (!doctor) {
    throw notFoundError("Doctor");
  }

  const patient = await Patient.create({
    ...input,
    doctor: doctor._id,
    admittedAt: input.admittedAt ? new Date(input.admittedAt) : new Date(),
  });

  return {
    ...patient.toObject(),
    doctor,
  };
}

export async function removePatientFromDoctor(doctorId: string, patientId: string) {
  const deleted = await Patient.findOneAndDelete({
    _id: patientId,
    doctor: doctorId,
  }).lean();

  if (!deleted) {
    throw notFoundError("Patient under this doctor");
  }

  return { deletedPatientId: deleted._id.toString() };
}
