import { Request, Response } from "express";
import * as doctorService from "../services/doctor.service.js";
import type {
  CreateDoctorInput,
  ListDoctorsQuery,
  UpdateDoctorInput,
} from "../validators/doctor.validator.js";
import type {
  CreatePatientUnderDoctorInput,
  ListPatientsQuery,
} from "../validators/patient.validator.js";

export async function listDoctors(req: Request, res: Response) {
  const result = await doctorService.listDoctors(
    req.query as unknown as ListDoctorsQuery
  );
  res.status(200).json({
    success: true,
    data: result.items,
    meta: result.meta,
  });
}

export async function getDoctorFilters(_req: Request, res: Response) {
  const filters = await doctorService.getDoctorFilterOptions();
  res.status(200).json({
    success: true,
    data: filters,
  });
}

export async function getDoctorById(req: Request, res: Response) {
  const doctor = await doctorService.getDoctorById(req.params.id);
  res.status(200).json({
    success: true,
    data: doctor,
  });
}

export async function createDoctor(req: Request, res: Response) {
  const doctor = await doctorService.createDoctor(req.body as CreateDoctorInput);
  res.status(201).json({
    success: true,
    message: "Doctor created successfully",
    data: doctor,
  });
}

export async function updateDoctor(req: Request, res: Response) {
  const doctor = await doctorService.updateDoctor(
    req.params.id,
    req.body as UpdateDoctorInput
  );
  res.status(200).json({
    success: true,
    message: "Doctor updated successfully",
    data: doctor,
  });
}

export async function deleteDoctor(req: Request, res: Response) {
  const result = await doctorService.deleteDoctor(req.params.id);
  res.status(200).json({
    success: true,
    message: "Doctor deleted successfully",
    data: result,
  });
}

export async function listDoctorPatients(req: Request, res: Response) {
  const result = await doctorService.listDoctorPatients(
    req.params.id,
    req.query as unknown as ListPatientsQuery
  );
  res.status(200).json({
    success: true,
    data: result.items,
    meta: result.meta,
  });
}

export async function addPatientToDoctor(req: Request, res: Response) {
  const patient = await doctorService.addPatientToDoctor(
    req.params.id,
    req.body as CreatePatientUnderDoctorInput
  );
  res.status(201).json({
    success: true,
    message: "Patient added to doctor successfully",
    data: patient,
  });
}

export async function removePatientFromDoctor(req: Request, res: Response) {
  const result = await doctorService.removePatientFromDoctor(
    req.params.id,
    req.params.patientId
  );
  res.status(200).json({
    success: true,
    message: "Patient removed from doctor successfully",
    data: result,
  });
}
