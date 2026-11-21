import { Router } from "express";
import * as doctorController from "../controllers/doctor.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createDoctorSchema,
  doctorIdParamSchema,
  doctorPatientParamsSchema,
  listDoctorsQuerySchema,
  updateDoctorSchema,
} from "../validators/doctor.validator.js";
import {
  createPatientUnderDoctorSchema,
  listPatientsQuerySchema,
} from "../validators/patient.validator.js";

const router = Router();

// All doctor endpoints require authenticated admin access
router.use(requireAuth, requireAdmin);

router.get(
  "/",
  validate({ query: listDoctorsQuerySchema }),
  asyncHandler(doctorController.listDoctors)
);

router.get("/filters", asyncHandler(doctorController.getDoctorFilters));

router.post(
  "/",
  validate({ body: createDoctorSchema }),
  asyncHandler(doctorController.createDoctor)
);

router.get(
  "/:id",
  validate({ params: doctorIdParamSchema }),
  asyncHandler(doctorController.getDoctorById)
);

router.patch(
  "/:id",
  validate({ params: doctorIdParamSchema, body: updateDoctorSchema }),
  asyncHandler(doctorController.updateDoctor)
);

router.delete(
  "/:id",
  validate({ params: doctorIdParamSchema }),
  asyncHandler(doctorController.deleteDoctor)
);

router.get(
  "/:id/patients",
  validate({ params: doctorIdParamSchema, query: listPatientsQuerySchema }),
  asyncHandler(doctorController.listDoctorPatients)
);

router.post(
  "/:id/patients",
  validate({ params: doctorIdParamSchema, body: createPatientUnderDoctorSchema }),
  asyncHandler(doctorController.addPatientToDoctor)
);

router.delete(
  "/:id/patients/:patientId",
  validate({ params: doctorPatientParamsSchema }),
  asyncHandler(doctorController.removePatientFromDoctor)
);

export default router;
