/**
 * visitGuard.js
 *
 * Shared utility for services that require an active (not checked-out) patient visit.
 *
 * Usage in any clinical service:
 *   const visit = await getOrCreateVisit(patientId, data.visitInfo ?? null);
 *   // use visit.id
 */

import { db } from "../../drizzle-db.js";
import { patientVisits } from "../../drizzle/migrations/schema.js";
import { eq, desc, isNull, and } from "drizzle-orm";
import { createPatientVisit } from "../services/patientVisitsServices.js";

/**
 * Returns the currently open visit for a patient, or creates one automatically
 * when `visitInfo` is supplied.
 *
 * @param {number} patientId
 * @param {{ purpose: string, doctorId: number|string, recordedBy?: string } | null} visitInfo
 *   Pass null (or omit) if you only want to look up an existing visit.
 *   Pass visit details to auto-create a visit when none is found.
 * @returns {Promise<{ id: number }>}
 * @throws Error with code "NO_ONGOING_VISIT" if no visit exists and visitInfo is absent
 */
export async function getOrCreateVisit(patientId, visitInfo = null) {
  const [ongoingVisit] = await db
    .select({ id: patientVisits.id })
    .from(patientVisits)
    .where(
      and(
        eq(patientVisits.patientId, Number(patientId)),
        isNull(patientVisits.checkOutTime)
      )
    )
    .orderBy(desc(patientVisits.checkInTime))
    .limit(1);

  if (ongoingVisit) return ongoingVisit;

  // Auto-create a visit when caller provides visit details
  if (visitInfo?.purpose && visitInfo?.doctorId) {
    const newVisit = await createPatientVisit({
      patientId:  Number(patientId),
      doctorId:   Number(visitInfo.doctorId),
      recordedBy: visitInfo.recordedBy ?? "system",
      purpose:    visitInfo.purpose,
    });
    return { id: newVisit.id };
  }

  const err = new Error(
    "No ongoing visit found for this patient. Please start a visit before proceeding."
  );
  err.code   = "NO_ONGOING_VISIT";
  err.status = 400;
  throw err;
}
