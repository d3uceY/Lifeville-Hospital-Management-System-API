import type { Request, Response } from "express";
import * as symptomsServices from "../services/symptomsServices.js";

export const getSymptomTypes = async (req: Request, res: Response) => {
  try {
    const symptomTypes = await symptomsServices.getSymptomTypes();
    res.status(200).json(symptomTypes);
  } catch (err) {
    console.error("error fetching symptom types:", err);
    res.status(500).json({
      message: "internal server error",
    });
  }
};

export const createSymptomType = async (req: Request, res: Response) => {
  try {
    const symptomType = await symptomsServices.createSymptomType(req.body);
    res.status(200).json({ symptomType, message: "Submitted Successfully" });
  } catch (err) {
    console.error("error creating symptom type:", err);
    res.status(500).json({
      message: "internal server error",
    });
  }
};

export const deleteSymptomType = async (req: Request, res: Response) => {
  try {
    const symptomType = await symptomsServices.deleteSymptomType(req.params.id);
    res.status(200).json({ symptomType, message: "Deleted Successfully" });
  } catch (err) {
    console.error("error deleting symptom type:", err);
    res.status(500).json({
      message: "internal server error",
    });
  }
};

export const updateSymptomType = async (req: Request, res: Response) => {
  try {
    const symptomType = await symptomsServices.updateSymptomType(
      req.params.id,
      req.body
    );
    res.status(200).json({ symptomType, message: "Updated Successfully" });
  } catch (err) {
    console.error("error updating symptom type:", err);
    res.status(500).json({
      message: "internal server error",
    });
  }
};


export const getSymptomHeads = async (req: Request, res: Response) => {
  try {
    const symptomHeads = await symptomsServices.getSymptomHeads();
    res.status(200).json(symptomHeads);
  } catch (err) {
    console.error("error fetching symptom heads:", err);
    res.status(500).json({
      message: "internal server error",
    });
  }
};

export const createSymptomHead = async (req: Request, res: Response) => {
  try {
    const symptomHead = await symptomsServices.createSymptomHead(req.body);
    res.status(200).json({ symptomHead, message: "Submitted Successfully" });
  } catch (err) {
    console.error("error creating symptom head:", err);
    res.status(500).json({
      message: "internal server error",
    });
  }
};

export const deleteSymptomHead = async (req: Request, res: Response) => {
  try {
    const symptomHead = await symptomsServices.deleteSymptomHead(req.params.id);
    res.status(200).json({ symptomHead, message: "Deleted Successfully" });
  } catch (err) {
    console.error("error deleting symptom head:", err);
    res.status(500).json({
      message: "internal server error",
    });
  }
};

export const updateSymptomHead = async (req: Request, res: Response) => {
  try {
    const symptomHead = await symptomsServices.updateSymptomHead(
      req.params.id,
      req.body
    );
    res.status(200).json({ symptomHead, message: "Updated Successfully" });
  } catch (err) {
    console.error("error updating symptom head:", err);
    res.status(500).json({
      message: "internal server error",
    });
  }
};

export const getSymptomsData = async (req: Request, res: Response) => {
  try {
    const [symptomTypes, symptomHeads] = await Promise.all([
      symptomsServices.getSymptomTypes(),
      symptomsServices.getSymptomHeads(),
    ]);
    res.status(200).json({ symptomTypes, symptomHeads });
  } catch (err) {
    console.error("error fetching symptoms data:", err);
    res.status(500).json({ message: "internal server error" });
  }
};
