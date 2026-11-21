import { Request, Response } from "express";
import * as patientService from "../services/patient.service.js";
import type {
  CreatePatientInput,
  ListPatientsQuery,
  UpdatePatientInput,
} from "../validators/patient.validator.js";

export async function listPatients(req: Request, res: Response) {
  const result = await patientService.listPatients(
    req.query as unknown as ListPatientsQuery
  );
  res.status(200).json({
    success: true,
    data: result.items,
    meta: result.meta,
  });
}

export async function getPatientById(req: Request, res: Response) {
  const patient = await patientService.getPatientById(req.params.id);
  res.status(200).json({
    success: true,
    data: patient,
  });
}

export async function createPatient(req: Request, res: Response) {
  const patient = await patientService.createPatient(req.body as CreatePatientInput);
  res.status(201).json({
    success: true,
    message: "Patient created successfully",
    data: patient,
  });
}

export async function updatePatient(req: Request, res: Response) {
  const patient = await patientService.updatePatient(
    req.params.id,
    req.body as UpdatePatientInput
  );
  res.status(200).json({
    success: true,
    message: "Patient updated successfully",
    data: patient,
  });
}

export async function deletePatient(req: Request, res: Response) {
  const result = await patientService.deletePatient(req.params.id);
  res.status(200).json({
    success: true,
    message: "Patient deleted successfully",
    data: result,
  });
}
