import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { Doctor } from "../models/Doctor.js";
import {
  Patient,
  PATIENT_CONDITIONS,
  PATIENT_GENDERS,
  PatientCondition,
  PatientGender,
} from "../models/Patient.js";
import { User } from "../models/User.js";

const SEED_DOCTORS = [
  { name: "Dr. Elena Vance", specialization: "Cardiology", hospital: "St. Jude Medical Center", phone: "+1 (415) 555-0101", email: "elena.vance@stjude.org", daysAgo: 88 },
  { name: "Dr. Marcus Thorne", specialization: "Neurology", hospital: "Mercy General Hospital", phone: "+1 (415) 555-0102", email: "marcus.thorne@mercygen.org", daysAgo: 85 },
  { name: "Dr. Priya Nair", specialization: "Pediatrics", hospital: "Pacific Children's Hospital", phone: "+1 (415) 555-0103", email: "priya.nair@pacificchildrens.org", daysAgo: 81 },
  { name: "Dr. David Chen", specialization: "Orthopedics", hospital: "Bayview Surgical Institute", phone: "+1 (415) 555-0104", email: "david.chen@bayviewsurg.org", daysAgo: 78 },
  { name: "Dr. Sofia Alverez", specialization: "Oncology", hospital: "Northstar Cancer Center", phone: "+1 (415) 555-0105", email: "sofia.alverez@northstarcancer.org", daysAgo: 74 },
  { name: "Dr. James Okafor", specialization: "Internal Medicine", hospital: "Metro Health Clinic", phone: "+1 (415) 555-0106", email: "james.okafor@metrohealth.org", daysAgo: 70 },
  { name: "Dr. Hannah Lindqvist", specialization: "Pulmonology", hospital: "St. Jude Medical Center", phone: "+1 (415) 555-0107", email: "hannah.lindqvist@stjude.org", daysAgo: 66 },
  { name: "Dr. Tariq Al-Mansoor", specialization: "Cardiology", hospital: "Mercy General Hospital", phone: "+1 (415) 555-0108", email: "tariq.almansoor@mercygen.org", daysAgo: 62 },
  { name: "Dr. Rachel Goldstein", specialization: "Dermatology", hospital: "Metro Health Clinic", phone: "+1 (415) 555-0109", email: "rachel.goldstein@metrohealth.org", daysAgo: 57 },
  { name: "Dr. Kenji Takahashi", specialization: "Neurology", hospital: "Bayview Surgical Institute", phone: "+1 (415) 555-0110", email: "kenji.takahashi@bayviewsurg.org", daysAgo: 52 },
  { name: "Dr. Amara Mensah", specialization: "Pediatrics", hospital: "Pacific Children's Hospital", phone: "+1 (415) 555-0111", email: "amara.mensah@pacificchildrens.org", daysAgo: 48 },
  { name: "Dr. Liam O'Connor", specialization: "Orthopedics", hospital: "St. Jude Medical Center", phone: "+1 (415) 555-0112", email: "liam.oconnor@stjude.org", daysAgo: 44 },
  { name: "Dr. Mei-Ling Zhou", specialization: "Internal Medicine", hospital: "Mercy General Hospital", phone: "+1 (415) 555-0113", email: "meiling.zhou@mercygen.org", daysAgo: 39 },
  { name: "Dr. Mateo Rossi", specialization: "Cardiology", hospital: "Bayview Surgical Institute", phone: "+1 (415) 555-0114", email: "mateo.rossi@bayviewsurg.org", daysAgo: 34 },
  { name: "Dr. Nadia Kowalski", specialization: "Oncology", hospital: "Northstar Cancer Center", phone: "+1 (415) 555-0115", email: "nadia.kowalski@northstarcancer.org", daysAgo: 29 },
  { name: "Dr. Samuel Boateng", specialization: "Pulmonology", hospital: "Metro Health Clinic", phone: "+1 (415) 555-0116", email: "samuel.boateng@metrohealth.org", daysAgo: 25 },
  { name: "Dr. Claire Beaumont", specialization: "Dermatology", hospital: "St. Jude Medical Center", phone: "+1 (415) 555-0117", email: "claire.beaumont@stjude.org", daysAgo: 21 },
  { name: "Dr. Vikram Patel", specialization: "Internal Medicine", hospital: "Mercy General Hospital", phone: "+1 (415) 555-0118", email: "vikram.patel@mercygen.org", daysAgo: 17 },
  { name: "Dr. Olivia Sterling", specialization: "Neurology", hospital: "Northstar Cancer Center", phone: "+1 (415) 555-0119", email: "olivia.sterling@northstarcancer.org", daysAgo: 13 },
  { name: "Dr. Lucas Mendes", specialization: "Orthopedics", hospital: "Bayview Surgical Institute", phone: "+1 (415) 555-0120", email: "lucas.mendes@bayviewsurg.org", daysAgo: 9 },
  { name: "Dr. Fatima Hassan", specialization: "Pediatrics", hospital: "Pacific Children's Hospital", phone: "+1 (415) 555-0121", email: "fatima.hassan@pacificchildrens.org", daysAgo: 6 },
  { name: "Dr. Daniel Brooks", specialization: "Cardiology", hospital: "St. Jude Medical Center", phone: "+1 (415) 555-0122", email: "daniel.brooks@stjude.org", daysAgo: 3 },
  { name: "Dr. Ingrid Solberg", specialization: "Pulmonology", hospital: "Mercy General Hospital", phone: "+1 (415) 555-0123", email: "ingrid.solberg@mercygen.org", daysAgo: 2 },
  { name: "Dr. Noah Kim", specialization: "Internal Medicine", hospital: "Metro Health Clinic", phone: "+1 (415) 555-0124", email: "noah.kim@metrohealth.org", daysAgo: 1 },
];

const FIRST_NAMES = [
  "Aiden", "Maya", "Ethan", "Chloe", "Lucas", "Zoe", "Benjamin", "Grace",
  "Henry", "Lily", "Alexander", "Layla", "Sebastian", "Aria", "Jack", "Nora",
  "Owen", "Hazel", "Caleb", "Violet", "Nathan", "Aurora", "Leo", "Savannah",
  "Julian", "Audrey", "Isaac", "Brooklyn", "Gabriel", "Bella", "Anthony", "Claire",
  "Dylan", "Skylar", "Wyatt", "Lucy", "Andrew", "Paisley", "Joshua", "Everly",
];

const LAST_NAMES = [
  "Carter", "Rivera", "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell",
  "Parker", "Evans", "Edwards", "Collins", "Stewart", "Sanchez", "Morris", "Rogers",
  "Reed", "Cook", "Morgan", "Bell", "Murphy", "Bailey", "Cooper", "Richardson",
  "Cox", "Howard", "Ward", "Torres", "Peterson", "Gray", "Ramirez", "James",
];

const DIAGNOSES_BY_SPEC: Record<string, string[]> = {
  Cardiology: ["Hypertension", "Atrial Fibrillation", "Coronary Artery Disease", "Heart Murmur"],
  Neurology: ["Chronic Migraine", "Epilepsy Monitoring", "Peripheral Neuropathy", "Post-Stroke Recovery"],
  Pediatrics: ["Acute Bronchitis", "Seasonal Asthma", "Pediatric Ear Infection", "Viral Fever"],
  Orthopedics: ["ACL Tear Recovery", "Lumbar Disc Herniation", "Rotator Cuff Strain", "Osteoarthritis"],
  Oncology: ["Stage II Breast Cancer", "Lymphoma Follow-up", "Chemotherapy Monitoring", "Remission Review"],
  "Internal Medicine": ["Type 2 Diabetes", "Hypothyroidism", "Iron-Deficiency Anemia", "Hyperlipidemia"],
  Pulmonology: ["COPD Management", "Community Pneumonia", "Sleep Apnea", "Allergic Asthma"],
  Dermatology: ["Severe Eczema", "Psoriasis Flare", "Contact Dermatitis", "Melanoma Screening"],
};

const WEIGHTED_CONDITIONS: PatientCondition[] = [
  "Stable", "Stable", "Stable", "Stable",
  "Recovering", "Recovering", "Recovering",
  "Under Observation", "Under Observation",
  "Discharged", "Discharged",
  "Critical",
];

// Deterministic pseudo-random helper so seeded charts look balanced every time
function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function daysAgoDate(days: number, hourOffset = 10): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hourOffset, Math.floor(seededRand(days + hourOffset) * 59), 0, 0);
  return d;
}

export async function seedDatabase(options: { onlyIfEmpty?: boolean; reset?: boolean } = {}) {
  const { onlyIfEmpty = false, reset = false } = options;

  if (onlyIfEmpty) {
    const existingUsers = await User.countDocuments();
    const existingDoctors = await Doctor.countDocuments();
    if (existingUsers > 0 && existingDoctors > 0) {
      return { skipped: true };
    }
  }

  if (reset) {
    await Promise.all([
      Patient.deleteMany({}),
      Doctor.deleteMany({}),
      User.deleteMany({}),
    ]);
  }

  // Ensure default admin exists
  let admin = await User.findOne({ email: env.ADMIN_EMAIL.toLowerCase() });
  if (!admin) {
    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
    admin = await User.create({
      name: env.ADMIN_NAME,
      email: env.ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      role: "admin",
    });
  }

  const doctorCount = await Doctor.countDocuments();
  if (doctorCount > 0 && !reset) {
    return { skipped: true, adminEmail: admin.email };
  }

  const doctorDocs = SEED_DOCTORS.map((doc) => {
    const createdAt = daysAgoDate(doc.daysAgo, 9);
    return {
      name: doc.name,
      specialization: doc.specialization,
      hospital: doc.hospital,
      phone: doc.phone,
      email: doc.email,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const insertedDoctors = await Doctor.insertMany(doctorDocs);

  // Distribute 144 patients unevenly across doctors (realistic workload spread for bar charts)
  const patientDistribution = [
    14, 12, 11, 10, 9, 9, 8, 8, 7, 7, 6, 6,
    5, 5, 5, 4, 4, 3, 3, 2, 2, 2, 1, 1,
  ];

  const patientsToInsert: Array<{
    name: string;
    doctor: (typeof insertedDoctors)[number]["_id"];
    condition: PatientCondition;
    diagnosis: string;
    age: number;
    gender: PatientGender;
    phone: string;
    email: string;
    admittedAt: Date;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  let idx = 1;
  insertedDoctors.forEach((doc, docIndex) => {
    const count = patientDistribution[docIndex] ?? 3;
    const diagnoses = DIAGNOSES_BY_SPEC[doc.specialization] ?? ["General Checkup"];
    const maxDaysAgo = Math.max(1, SEED_DOCTORS[docIndex].daysAgo);

    for (let i = 0; i < count; i++) {
      const r1 = seededRand(idx * 3 + 1);
      const r2 = seededRand(idx * 5 + 2);
      const r3 = seededRand(idx * 7 + 3);
      const r4 = seededRand(idx * 11 + 4);

      const first = FIRST_NAMES[Math.floor(r1 * FIRST_NAMES.length)];
      const last = LAST_NAMES[Math.floor(r2 * LAST_NAMES.length)];
      const fullName = `${first} ${last}`;
      const condition =
        WEIGHTED_CONDITIONS[Math.floor(r3 * WEIGHTED_CONDITIONS.length)] ??
        PATIENT_CONDITIONS[0];
      const diagnosis = diagnoses[idx % diagnoses.length];
      const gender = PATIENT_GENDERS[idx % 2 === 0 ? 0 : idx % 13 === 0 ? 2 : 1];
      const age =
        doc.specialization === "Pediatrics"
          ? 2 + Math.floor(r4 * 15)
          : 22 + Math.floor(r4 * 62);

      // Bias recent 30 days slightly higher for realistic growth curve
      const rawDaysAgo = Math.floor(Math.pow(r2, 1.35) * Math.min(maxDaysAgo, 89));
      const admittedAt = daysAgoDate(rawDaysAgo, 8 + (idx % 10));

      patientsToInsert.push({
        name: fullName,
        doctor: doc._id,
        condition,
        diagnosis,
        age,
        gender,
        phone: `+1 (650) 555-${String(1000 + idx).padStart(4, "0")}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}${idx}@patientmail.com`,
        admittedAt,
        notes: `${diagnosis} — routine follow-up scheduled with ${doc.name}.`,
        createdAt: admittedAt,
        updatedAt: admittedAt,
      });

      idx++;
    }
  });

  await Patient.insertMany(patientsToInsert);

  return {
    skipped: false,
    adminEmail: admin.email,
    doctorsCreated: insertedDoctors.length,
    patientsCreated: patientsToInsert.length,
  };
}
