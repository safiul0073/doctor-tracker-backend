import { Router } from "express";
import * as patientController from "../controllers/patient.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createPatientSchema,
  listPatientsQuerySchema,
  patientIdParamSchema,
  updatePatientSchema,
} from "../validators/patient.validator.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get(
  "/",
  validate({ query: listPatientsQuerySchema }),
  asyncHandler(patientController.listPatients)
);

router.post(
  "/",
  validate({ body: createPatientSchema }),
  asyncHandler(patientController.createPatient)
);

router.get(
  "/:id",
  validate({ params: patientIdParamSchema }),
  asyncHandler(patientController.getPatientById)
);

router.patch(
  "/:id",
  validate({ params: patientIdParamSchema, body: updatePatientSchema }),
  asyncHandler(patientController.updatePatient)
);

router.delete(
  "/:id",
  validate({ params: patientIdParamSchema }),
  asyncHandler(patientController.deletePatient)
);

export default router;
