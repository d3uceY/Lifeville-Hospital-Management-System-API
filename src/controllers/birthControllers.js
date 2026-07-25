import * as birthServices from "../services/birthServices.js";
import { ACTIVITY_TYPES } from "../constants/activityTypes.js";

export const getBirthRecords = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = "", gender = "" } = req.query;
    const birthRecords = await birthServices.getBirthRecords({
      page: Number(page),
      pageSize: Number(pageSize),
      search,
      gender,
    });
    res.status(200).json(birthRecords);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBirthRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const birthData = req.body;
    const updatedBirthRecord = await birthServices.updateBirthRecord(
      id,
      birthData
    );
    res
      .status(200)
      .json({ updatedBirthRecord, message: "Updated Successfully" });
    req.activityLogger(ACTIVITY_TYPES.BIRTH_UPDATED, { birthId: Number(id) });
  } catch (err) {
    console.error(err.code);
    res.status(500).json({
      message: "internal server error",
      err,
    });
  }
};

export const createBirthRecord = async (req, res) => {
  try {
    const record = await birthServices.createBirthRecord(req.body);
    res
      .status(201)
      .json({ createBirthRecord: record, message: "Submitted Successfully" });
    req.activityLogger(ACTIVITY_TYPES.BIRTH_CREATED, { birthId: record.id });
  } catch (err) {
    console.error(err.code);
    res.status(500).json({
      message: "internal server error",
      err,
    });
  }
};

export const deleteBirthRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBirthRecord = await birthServices.deleteBirthRecord(id);
    if (!deletedBirthRecord) {
      return res.status(404).json({
        message: "Birth Record not found",
      });
    }
    res
      .status(200)
      .json({ deletedBirthRecord, message: "Deleted Successfully" });
    req.activityLogger(ACTIVITY_TYPES.BIRTH_DELETED, { birthId: Number(id) });
  } catch (err) {
    console.error(err.code);
    res.status(500).json({
      message: "internal server error",
      err,
    });
  }
};
