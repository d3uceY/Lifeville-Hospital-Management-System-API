// controllers/bedControllers.js
import * as bedServices from "../services/bedServices.js";
import { ACTIVITY_TYPES } from "../constants/activityTypes.js";

// BED TYPES

export const getBedTypes = async (req, res) => {
  try {
    const types = await bedServices.getBedTypes();
    res.status(200).json(types);
  } catch (err) {
    console.error("Error fetching bed types:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const createBedType = async (req, res) => {
  try {
    const typeData = req.body;
    const newType = await bedServices.createBedType(typeData);
    res.status(200).json({ newType, message: "Bed type created successfully" });
  } catch (err) {
    console.error("Error creating bed type:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const updateBedType = async (req, res) => {
  try {
    const typeId = req.params.id;
    const typeData = req.body;
    const updatedType = await bedServices.updateBedType(typeId, typeData);
    if (!updatedType) {
      return res.status(404).json({ message: "Bed type not found" });
    }
    res
      .status(200)
      .json({ updatedType, message: "Bed type updated successfully" });
  } catch (err) {
    console.error("Error updating bed type:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const deleteBedType = async (req, res) => {
  try {
    const typeId = req.params.id; 
    const deleted = await bedServices.deleteBedType(typeId);
    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Bed type not found or already deleted" });
    }
    res.status(200).json({ deleted, message: "Bed type deleted successfully" });
  } catch (err) {
    console.error("Error deleting bed type:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

// BED GROUPS

export const getBedGroups = async (req, res) => {
  try {
    const groups = await bedServices.getBedGroups();
    res.status(200).json(groups);
  } catch (err) {
    console.error("Error fetching bed groups:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const createBedGroup = async (req, res) => {
  try {
    const groupData = req.body;
    const newGroup = await bedServices.createBedGroup(groupData);
    res
      .status(200)
      .json({ newGroup, message: "Bed group created successfully" });
  } catch (err) {
    console.error("Error creating bed group:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const updateBedGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const groupData = req.body;
    const updatedGroup = await bedServices.updateBedGroup(groupId, groupData);
    if (!updatedGroup) {
      return res.status(404).json({ message: "Bed group not found" });
    }
    res
      .status(200)
      .json({ updatedGroup, message: "Bed group updated successfully" });
  } catch (err) {
    console.error("Error updating bed group:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const deleteBedGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const deleted = await bedServices.deleteBedGroup(groupId);
    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Bed group not found or already deleted" });
    }
    res
      .status(200)
      .json({ deleted, message: "Bed group deleted successfully" });
  } catch (err) {
    console.error("Error deleting bed group:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

// BEDS

export const getBeds = async (req, res) => {
  try {
    const beds = await bedServices.getBeds();
    res.status(200).json(beds);
  } catch (err) {
    console.error("Error fetching beds:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const getBedData = async (req, res) => {
  try {
    const [beds, bedGroups, bedTypes] = await Promise.all([
      bedServices.getBeds(),
      bedServices.getBedGroups(),
      bedServices.getBedTypes(),
    ]);
    res.status(200).json({ beds, bedGroups, bedTypes });
  } catch (err) {
    console.error("Error fetching bed data:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const viewBed = async (req, res) => {
  try {
    const bedId = req.params.id;
    const bed = await bedServices.viewBed(bedId);
    if (!bed) {
      return res.status(404).json({ message: "Bed not found" });
    }
    res.status(200).json(bed);
  } catch (err) {
    console.error("Error fetching bed:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const createBed = async (req, res) => {
  try {
    const bedData = req.body;
    const newBed = await bedServices.createBed(bedData);
    res.status(200).json({ newBed, message: "Bed created successfully" });
    req.activityLogger(ACTIVITY_TYPES.BED_CREATED, { bedId: newBed.id });
  } catch (err) {
    console.error("Error creating bed:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const updateBed = async (req, res) => {
  try {
    const bedId = req.params.id;
    const bedData = req.body;
    const updatedBed = await bedServices.updateBed(bedId, bedData);
    if (!updatedBed) {
      return res.status(404).json({ message: "Bed not found" });
    }
    res.status(200).json({ updatedBed, message: "Bed updated successfully" });
    req.activityLogger(ACTIVITY_TYPES.BED_UPDATED, { bedId: Number(req.params.id) });
  } catch (err) {
    console.error("Error updating bed:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const deleteBed = async (req, res) => {
  try {
    const bedId = req.params.id;
    const deleted = await bedServices.deleteBed(bedId);
    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Bed not found or already deleted" });
    }
    res.status(200).json({ deleted, message: "Bed deleted successfully" });
    req.activityLogger(ACTIVITY_TYPES.BED_DELETED, { bedId: Number(req.params.id) });
  } catch (err) {
    console.error("Error deleting bed:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};
