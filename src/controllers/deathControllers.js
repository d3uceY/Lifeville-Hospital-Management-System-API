import * as deathServices from "../services/deathServices.js";
import { ACTIVITY_TYPES } from "../constants/activityTypes.js";

export const getDeathRecords = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = "", sex = "" } = req.query;
    const deaths = await deathServices.getDeathRecords({
      page: Number(page),
      pageSize: Number(pageSize),
      search,
      sex,
    });
    res.status(200).json(deaths);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createDeathRecord = async (req, res) => {
  try {
    const deathRecord = await deathServices.createDeathRecord(req.body);
    res.status(201).json({ deathRecord, message: "Submitted Successfully" });
    req.activityLogger(ACTIVITY_TYPES.DEATH_CREATED, { deathId: deathRecord.id });
  } catch (err) {
    if (err.code === "DUPLICATE_DEATH_RECORD") {
      return res.status(400).json({
        message: err.message, // Send custom error message to the frontend
      });
    }
    res.status(500).json({ message: err.message });
  }
};

export const deleteDeathRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDeathRecord = await deathServices.deleteDeathRecord(id);
    if (!deletedDeathRecord) {
      return res.status(404).json({
        message: "Death Record not found",
      });
    }
    res
      .status(200)
      .json({ deletedDeathRecord, message: "Deleted Successfully" });
    req.activityLogger(ACTIVITY_TYPES.DEATH_DELETED, { deathId: Number(id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateDeathRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const deathData = req.body;
    const updatedDeathRecord = await deathServices.updateDeathRecord(
      id,
      deathData
    );
    res
      .status(200)
      .json({ updatedDeathRecord, message: "Updated Successfully" });
    req.activityLogger(ACTIVITY_TYPES.DEATH_UPDATED, { deathId: Number(id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
