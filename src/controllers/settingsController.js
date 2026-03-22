import * as settings from "../services/settingsService.js";

const ok  = (res, data)    => res.status(200).json({ success: true, data });
const err = (res, e, msg)  => {
  console.error(msg, e);
  return res.status(500).json({ success: false, message: msg });
};

export function getCurrenciesController(_req, res) {
  return ok(res, settings.listCurrencies());
}

export async function getAllSettingsController(_req, res) {
  try {
    return ok(res, await settings.getAllSettings());
  } catch (e) {
    return err(res, e, "Failed to fetch settings");
  }
}

export async function updateAllSettingsController(req, res) {
  try {
    const updated = await settings.updateAllSettings(req.body);
    return ok(res, updated);
  } catch (e) {
    if (e.message?.startsWith("Unknown currency")) {
      return res.status(400).json({ success: false, message: e.message });
    }
    return err(res, e, "Failed to update settings");
  }
}

// ─── Hospital Info ────────────────────────────────────────────────────────────

export async function getHospitalInfoController(_req, res) {
  try {
    return ok(res, await settings.getHospitalInfo());
  } catch (e) {
    return err(res, e, "Failed to fetch hospital info settings");
  }
}

export async function upsertHospitalInfoController(req, res) {
  try {
    const data = await settings.upsertHospitalInfo(req.body);
    return ok(res, data);
  } catch (e) {
    return err(res, e, "Failed to save hospital info settings");
  }
}

// ─── Contact ──────────────────────────────────────────────────────────────────

export async function getContactController(_req, res) {
  try {
    return ok(res, await settings.getContact());
  } catch (e) {
    return err(res, e, "Failed to fetch contact settings");
  }
}

export async function upsertContactController(req, res) {
  try {
    return ok(res, await settings.upsertContact(req.body));
  } catch (e) {
    return err(res, e, "Failed to save contact settings");
  }
}

// ─── Prefixes ─────────────────────────────────────────────────────────────────

export async function getPrefixesController(_req, res) {
  try {
    return ok(res, await settings.getPrefixes());
  } catch (e) {
    return err(res, e, "Failed to fetch prefix settings");
  }
}

export async function upsertPrefixesController(req, res) {
  try {
    return ok(res, await settings.upsertPrefixes(req.body));
  } catch (e) {
    return err(res, e, "Failed to save prefix settings");
  }
}

// ─── Billing ──────────────────────────────────────────────────────────────────

export async function getBillingController(_req, res) {
  try {
    return ok(res, await settings.getBilling());
  } catch (e) {
    return err(res, e, "Failed to fetch billing settings");
  }
}

export async function upsertBillingController(req, res) {
  try {
    return ok(res, await settings.upsertBilling(req.body));
  } catch (e) {
    if (e.message?.startsWith("Unknown currency")) {
      return res.status(400).json({ success: false, message: e.message });
    }
    return err(res, e, "Failed to save billing settings");
  }
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function getDocumentsController(_req, res) {
  try {
    return ok(res, await settings.getDocuments());
  } catch (e) {
    return err(res, e, "Failed to fetch document settings");
  }
}

export async function upsertDocumentsController(req, res) {
  try {
    return ok(res, await settings.upsertDocuments(req.body));
  } catch (e) {
    return err(res, e, "Failed to save document settings");
  }
}
