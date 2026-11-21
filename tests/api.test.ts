import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { seedDatabase } from "../src/utils/seedData.js";

process.env.NODE_ENV = "test";
process.env.USE_MEMORY_DB = "true";

const app = createApp();

let authToken = "";
let createdDoctorId = "";
let createdPatientId = "";

describe("Doctor Tracker REST API", () => {
  beforeAll(async () => {
    await connectDatabase();
    await seedDatabase({ reset: true });
  }, 30000);

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("exposes a public health check endpoint", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
  });

  it("blocks unauthenticated access to protected routes", async () => {
    const [doctorsRes, patientsRes, analyticsRes] = await Promise.all([
      request(app).get("/api/v1/doctors"),
      request(app).get("/api/v1/patients"),
      request(app).get("/api/v1/analytics/overview"),
    ]);

    expect(doctorsRes.status).toBe(401);
    expect(patientsRes.status).toBe(401);
    expect(analyticsRes.status).toBe(401);
  });

  it("authenticates seeded admin and returns user profile via /auth/me", async () => {
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "admin@example.com",
      password: "password",
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.token).toBeTruthy();
    authToken = loginRes.body.data.token;

    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${authToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe("admin@example.com");
  });

  it("creates, searches, filters, and paginates doctors", async () => {
    const createRes = await request(app)
      .post("/api/v1/doctors")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Dr. Ada Lovelace",
        specialization: "Cardiology",
        hospital: "Analytical Heart Hospital",
        phone: "+1 (555) 901-2233",
        email: "ada.lovelace@hospital.org",
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toBe("Dr. Ada Lovelace");
    createdDoctorId = createRes.body.data._id;

    const listRes = await request(app)
      .get("/api/v1/doctors")
      .query({ page: 1, limit: 5, search: "Lovelace", specialization: "Cardiology" })
      .set("Authorization", `Bearer ${authToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].email).toBe("ada.lovelace@hospital.org");
    expect(listRes.body.meta.total).toBe(1);
  });

  it("adds, lists, updates, filters, and deletes patients under a doctor and globally", async () => {
    const addRes = await request(app)
      .post(`/api/v1/doctors/${createdDoctorId}/patients`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Alan Turing",
        condition: "Under Observation",
        diagnosis: "Sinus Tachycardia",
        age: 41,
        gender: "Male",
        phone: "+1 (555) 888-7766",
        email: "alan.turing@example.com",
      });

    expect(addRes.status).toBe(201);
    createdPatientId = addRes.body.data._id;

    const docPatientsRes = await request(app)
      .get(`/api/v1/doctors/${createdDoctorId}/patients`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(docPatientsRes.status).toBe(200);
    expect(docPatientsRes.body.data).toHaveLength(1);
    expect(docPatientsRes.body.data[0].name).toBe("Alan Turing");

    const updateRes = await request(app)
      .patch(`/api/v1/patients/${createdPatientId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ condition: "Stable" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.condition).toBe("Stable");

    const searchRes = await request(app)
      .get("/api/v1/patients")
      .query({ search: "Turing", condition: "Stable", doctorId: createdDoctorId })
      .set("Authorization", `Bearer ${authToken}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data).toHaveLength(1);
    expect(searchRes.body.data[0].doctor.name).toBe("Dr. Ada Lovelace");

    const deleteRes = await request(app)
      .delete(`/api/v1/doctors/${createdDoctorId}/patients/${createdPatientId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.deletedPatientId).toBe(createdPatientId);
  });

  it("returns aggregated dashboard analytics", async () => {
    const res = await request(app)
      .get("/api/v1/analytics/overview")
      .query({ range: "30d" })
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary.totalDoctors).toBeGreaterThanOrEqual(24);
    expect(res.body.data.summary.totalPatients).toBeGreaterThanOrEqual(140);
    expect(res.body.data.patientsPerDoctor.length).toBeGreaterThan(0);
    expect(res.body.data.dateStats.length).toBeGreaterThan(0);
    expect(res.body.data.conditionBreakdown).toHaveLength(5);
  });
});
