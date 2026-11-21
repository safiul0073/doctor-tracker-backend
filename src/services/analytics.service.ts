import { Doctor } from "../models/Doctor.js";
import { Patient, PATIENT_CONDITIONS } from "../models/Patient.js";
import type { AnalyticsQuery } from "../validators/analytics.validator.js";

function resolveDateRange(query: AnalyticsQuery): {
  startDate: Date | null;
  endDate: Date;
  bucketFormat: string;
} {
  const endDate = query.to ? new Date(query.to) : new Date();
  if (query.to && query.to.length <= 10) {
    endDate.setUTCHours(23, 59, 59, 999);
  }

  if (query.from) {
    const startDate = new Date(query.from);
    const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    return {
      startDate,
      endDate,
      bucketFormat: diffDays > 60 ? "%Y-%m-%d" : "%Y-%m-%d",
    };
  }

  if (query.range === "all") {
    return { startDate: null, endDate, bucketFormat: "%Y-%m-%d" };
  }

  const days = query.range === "7d" ? 7 : query.range === "90d" ? 90 : 30;
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
  startDate.setUTCHours(0, 0, 0, 0);

  return { startDate, endDate, bucketFormat: "%Y-%m-%d" };
}

export async function getOverviewAnalytics(query: AnalyticsQuery) {
  const { startDate, endDate, bucketFormat } = resolveDateRange(query);

  const patientDateMatch = startDate
    ? { admittedAt: { $gte: startDate, $lte: endDate } }
    : { admittedAt: { $lte: endDate } };

  const doctorDateMatch = startDate
    ? { createdAt: { $gte: startDate, $lte: endDate } }
    : { createdAt: { $lte: endDate } };

  // Two parallel single-round-trip $facet aggregations power all dashboard metrics & charts
  const [[doctorFacet], [patientFacet]] = await Promise.all([
    Doctor.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          inRangeCount: [{ $match: doctorDateMatch }, { $count: "count" }],
          bySpecialization: [
            { $group: { _id: "$specialization", doctors: { $sum: 1 } } },
            { $sort: { doctors: -1, _id: 1 } },
            { $project: { _id: 0, specialization: "$_id", doctors: 1 } },
          ],
          timeline: [
            { $match: doctorDateMatch },
            {
              $group: {
                _id: { $dateToString: { format: bucketFormat, date: "$createdAt" } },
                doctors: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]),
    Patient.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          inRangeCount: [{ $match: patientDateMatch }, { $count: "count" }],
          criticalCount: [
            { $match: { condition: "Critical" } },
            { $count: "count" },
          ],
          byCondition: [
            { $group: { _id: "$condition", count: { $sum: 1 } } },
            { $project: { _id: 0, condition: "$_id", count: 1 } },
          ],
          patientsPerDoctor: [
            { $group: { _id: "$doctor", patientCount: { $sum: 1 } } },
            { $sort: { patientCount: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "doctors",
                localField: "_id",
                foreignField: "_id",
                as: "doctor",
              },
            },
            { $unwind: "$doctor" },
            {
              $project: {
                _id: 0,
                doctorId: "$doctor._id",
                doctorName: "$doctor.name",
                specialization: "$doctor.specialization",
                hospital: "$doctor.hospital",
                patientCount: 1,
              },
            },
          ],
          bySpecializationPatients: [
            {
              $lookup: {
                from: "doctors",
                localField: "doctor",
                foreignField: "_id",
                as: "doctor",
              },
            },
            { $unwind: "$doctor" },
            { $group: { _id: "$doctor.specialization", patients: { $sum: 1 } } },
          ],
          timeline: [
            { $match: patientDateMatch },
            {
              $group: {
                _id: { $dateToString: { format: bucketFormat, date: "$admittedAt" } },
                patients: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          recentPatients: [
            { $sort: { admittedAt: -1, _id: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "doctors",
                localField: "doctor",
                foreignField: "_id",
                as: "doctor",
              },
            },
            { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 1,
                name: 1,
                condition: 1,
                diagnosis: 1,
                age: 1,
                gender: 1,
                admittedAt: 1,
                doctor: {
                  _id: "$doctor._id",
                  name: "$doctor.name",
                  specialization: "$doctor.specialization",
                },
              },
            },
          ],
        },
      },
    ]),
  ]);

  const totalDoctors: number = doctorFacet?.total?.[0]?.count ?? 0;
  const totalPatients: number = patientFacet?.total?.[0]?.count ?? 0;
  const newDoctorsInRange: number = doctorFacet?.inRangeCount?.[0]?.count ?? 0;
  const newPatientsInRange: number = patientFacet?.inRangeCount?.[0]?.count ?? 0;
  const criticalPatients: number = patientFacet?.criticalCount?.[0]?.count ?? 0;
  const avgPatientsPerDoctor =
    totalDoctors > 0 ? Number((totalPatients / totalDoctors).toFixed(1)) : 0;

  // Normalize condition breakdown to include all conditions consistently
  const conditionMap = new Map<string, number>();
  for (const row of patientFacet?.byCondition ?? []) {
    conditionMap.set(row.condition, row.count);
  }
  const conditionBreakdown = PATIENT_CONDITIONS.map((condition) => ({
    condition,
    count: conditionMap.get(condition) ?? 0,
  }));

  // Merge specialization stats (doctors + patients)
  const specPatientMap = new Map<string, number>();
  for (const row of patientFacet?.bySpecializationPatients ?? []) {
    specPatientMap.set(row._id, row.patients);
  }
  const specializationBreakdown = (doctorFacet?.bySpecialization ?? []).map(
    (row: { specialization: string; doctors: number }) => ({
      specialization: row.specialization,
      doctors: row.doctors,
      patients: specPatientMap.get(row.specialization) ?? 0,
    })
  );

  // Merge date-based timeline and fill continuous days when range <= 90 days
  const docTimelineMap = new Map<string, number>();
  for (const row of doctorFacet?.timeline ?? []) {
    docTimelineMap.set(row._id, row.doctors);
  }
  const patTimelineMap = new Map<string, number>();
  for (const row of patientFacet?.timeline ?? []) {
    patTimelineMap.set(row._id, row.patients);
  }

  const dateStats: Array<{ date: string; doctors: number; patients: number }> = [];

  if (startDate) {
    const cursor = new Date(startDate);
    cursor.setUTCHours(0, 0, 0, 0);
    const limitEnd = new Date(endDate);
    limitEnd.setUTCHours(23, 59, 59, 999);
    const maxDays = 120;
    let steps = 0;

    while (cursor <= limitEnd && steps < maxDays) {
      const key = cursor.toISOString().slice(0, 10);
      dateStats.push({
        date: key,
        doctors: docTimelineMap.get(key) ?? 0,
        patients: patTimelineMap.get(key) ?? 0,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      steps++;
    }
  } else {
    const allDates = Array.from(
      new Set([...docTimelineMap.keys(), ...patTimelineMap.keys()])
    ).sort();
    for (const date of allDates) {
      dateStats.push({
        date,
        doctors: docTimelineMap.get(date) ?? 0,
        patients: patTimelineMap.get(date) ?? 0,
      });
    }
  }

  return {
    summary: {
      totalDoctors,
      totalPatients,
      avgPatientsPerDoctor,
      criticalPatients,
      newDoctorsInRange,
      newPatientsInRange,
    },
    patientsPerDoctor: patientFacet?.patientsPerDoctor ?? [],
    dateStats,
    conditionBreakdown,
    specializationBreakdown,
    recentPatients: patientFacet?.recentPatients ?? [],
  };
}
