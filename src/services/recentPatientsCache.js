/**
 * In-memory cache for recently viewed patients.
 * Stores max 5 entries per user (userId is extracted from auth token).
 * When a duplicate patient is viewed, it moves to the front.
 */
const MAX_RECENT = 5;
const recentByUser = new Map();

/**
 * Record a patient view. Pushes to front, removes duplicates, trims to max.
 * @param {number} userId
 * @param {object} patient - { patientId, surname, first_name, sex, hospitalNumber }
 */
export const recordRecentPatient = (userId, patient) => {
  if (!userId) return;
  if (!recentByUser.has(userId)) {
    recentByUser.set(userId, []);
  }
  const list = recentByUser.get(userId);

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
 * @param {number} userId
 * @returns {object[]}
 */
export const getRecentPatients = (userId) => {
  return recentByUser.get(userId) ?? [];
};
