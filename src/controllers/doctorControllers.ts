import type { Request, Response } from "express";
import * as doctorServices from "../services/doctorServices.js";

export const createDoctor = async (req: Request, res: Response) => {
  try {
    const doctor = await doctorServices.createDoctor(req.body);
    res.status(201).json({ doctor, message: "Submitted Successfully" });
  } catch (error) {
    res.status(500).json({ message: `internal server error ${error.message}` });
  }
};

export const getDoctors = async (req: Request, res: Response) => {
  try {
    const doctors = await doctorServices.getDoctors();
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: `internal server error ${error.message}` });
  }
};

export const deleteDoctor = async (req: Request, res: Response) => {
  try {
    const doctor = await doctorServices.deleteDoctor(req.params.id);
    res.status(200).json({ doctor, message: "Doctor Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: `internal server error ${error.message}` });
  }
};

export const updateDoctor = async (req: Request, res: Response) => {
  try {
    const doctor = await doctorServices.updateDoctor(req.body);
    res.status(200).json({ doctor, message: "Updated Successfully" });
  } catch (error) {
    res.status(500).json({ message: `internal server error ${error.message}` });
    console.error(error)
  }
};

export const viewDoctor = async (req: Request, res: Response) => {
  try {
    const doctor = await doctorServices.viewDoctor(req.params.id);
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: `internal server error ${error.message}` });
  }
};
