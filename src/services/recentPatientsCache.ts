/**
 * In-memory cache for recently viewed patients.
 * Stores max 5 entries per user (userId is extracted from auth token).
 * When a duplicate patient is viewed, it moves to the front.
 */

interface RecentPatientEntry {
  patientId: number;
  surname: string;
  first_name: string;
  sex: string;
  hospitalNumber: number;
  viewedAt: string;
}

const MAX_RECENT = 5;
const recentByUser = new Map<number, RecentPatientEntry[]>();

/**
 * Record a patient view. Pushes to front, removes duplicates, trims to max.
 */
export const recordRecentPatient = (
  userId: number | undefined,
  patient: { patientId: number; surname: string; first_name: string; sex: string; hospitalNumber: number }
): void => {
  if (!userId) return;
  if (!recentByUser.has(userId)) {
    recentByUser.set(userId, []);
  }
  const list = recentByUser.get(userId)!;

  // Remove existing entry for this patient
  const filtered = list.filter((p) => p.patientId !== patient.patientId);

  // Push to front
  filtered.unshift({
    patientId: patient.patientId,
    surname: patient.surname,
    first_name: patient.first_name,
    sex: patient.sex,
    hospitalNumber: patient.hospitalNumber,
    viewedAt: new Date().toISOString(),
  });

  // Trim to max
  recentByUser.set(userId, filtered.slice(0, MAX_RECENT));
};

/**
 * Get the last N recently viewed patients for a user.
 */
export const getRecentPatients = (userId: number | undefined): RecentPatientEntry[] => {
  if (!userId) return [];
  return recentByUser.get(userId) ?? [];
};
