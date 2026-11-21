import { Router } from "express";
import analyticsRoutes from "./analytics.routes.js";
import authRoutes from "./auth.routes.js";
import doctorRoutes from "./doctor.routes.js";
import patientRoutes from "./patient.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      service: "doctor-tracker-api",
      timestamp: new Date().toISOString(),
    },
  });
});

router.use("/auth", authRoutes);
router.use("/doctors", doctorRoutes);
router.use("/patients", patientRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
