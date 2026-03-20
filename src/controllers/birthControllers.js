import * as birthServices from "../services/birthServices.js";

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
  } catch (err) {
    console.error(err.code);
    res.status(500).json({
      message: "internal server error",
      err,
    });
  }
};

export const createBirthRecord = (req, res) => {
  try {
    const createBirthRecord = birthServices.createBirthRecord(req.body);
    res
      .status(201)
      .json({ createBirthRecord, message: "Submitted Successfully" });
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
  } catch (err) {
    console.error(err.code);
    res.status(500).json({
      message: "internal server error",
      err,
    });
  }
};
