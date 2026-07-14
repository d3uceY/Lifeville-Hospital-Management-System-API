/**
 * In-process cache for upcoming scheduled/confirmed appointments.
 *
 * Shape of every cached entry (CachedAppointment):
 *   { appointmentId, appointmentDate, status, patientId,
 *     patientFirstName, patientSurname, doctorName }
 *
 * Lifecycle
 * ---------
 *  • Populated lazily on the first cron tick (initializeCache).
 *  • Kept fresh by appointmentServices calling upsertAppointmentCache /
 *    removeFromAppointmentCache after every DB mutation.
 *  • Pruned on each cron tick via pruneAppointmentCache so memory stays bounded.
 *  • On server restart the cache is empty; the first cron tick repopulates it.
 */

import { db } from "../../drizzle-db.js";
import { appointments, patients, users } from "../../drizzle/migrations/schema.js";
import { eq, and, gte, or } from "drizzle-orm";

// ─── Types ──────────────────────────────────────────────────────────────────────────────
export interface CachedAppointment {
  appointmentId: number;
  appointmentDate: string;
  status: string;
  patientId: number;
  patientFirstName: string | null;
  patientSurname: string | null;
  doctorName?: string | null;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

/** Statuses that are eligible to be tracked for reminders. */
const ELIGIBLE_STATUSES = new Set(["scheduled", "confirmed"]);

// ─── Store ─────────────────────────────────────────────────────────────────────

export const appointmentCache = new Map<number, CachedAppointment>();

/**
 * Single init-promise guard.  Prevents duplicate DB fetches when the cron fires
 * before the first fetch has resolved (e.g. extremely short CRON_SCHEDULE).
 * @type {Promise<void> | null}
 */
let _initPromise: Promise<void> | null = null;

// ─── Initialisation ────────────────────────────────────────────────────────────

/**
 * Populates the cache with all future scheduled/confirmed appointments.
 * Safe to call multiple times — only the first call issues a DB query.
 */
export async function initializeCache() {
    if (_initPromise) return _initPromise;

    _initPromise = (async () => {
        const now = new Date();

        const rows = await db
            .select({
                appointmentId: appointments.appointmentId,
                appointmentDate: appointments.appointmentDate,
                status: appointments.status,
                patientId: appointments.patientId,
                patientFirstName: patients.firstName,
                patientSurname: patients.surname,
                doctorName: users.name,
            })
            .from(appointments)
            .leftJoin(patients, eq(appointments.patientId, patients.patientId))
            .leftJoin(users, eq(appointments.doctorId, users.id))
            .where(
                and(
                    gte(appointments.appointmentDate, now.toISOString()),
                    or(
                        eq(appointments.status, "scheduled"),
                        eq(appointments.status, "confirmed")
                    )
                )
            );

        for (const row of rows) {
            appointmentCache.set(row.appointmentId, row);
        }

        console.log(`[Appointment Cache] Initialized — ${appointmentCache.size} upcoming appointment(s) loaded`);
    })().catch((err) => {
        // Allow retry on next call if initialization fails.
        _initPromise = null;
        throw err;
    });

    return _initPromise;
}

/** Returns true once the initial DB fetch has completed successfully. */
export function isCacheInitialized() {
    return _initPromise !== null;
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Adds or updates an appointment in the cache.
 *
 * Accepts the mixed shapes returned by appointmentServices
 * (first_name / patientFirstName, doctor_name / doctorName) and normalises them.
 *
 * Automatically REMOVES the entry when the appointment is no longer eligible:
 *   - status is not "scheduled" or "confirmed"
 *   - appointmentDate is in the past
 *
 * Fields missing from the incoming object are preserved from the existing
 * cache entry (e.g. doctorName is not returned by updateAppointment but we
 * keep the value already stored).
 *
 * @param {object} rawAppt
 */
export function upsertAppointmentCache(rawAppt: Record<string, unknown>) {
    // Support both camelCase (initializeCache explicit aliases) and
    // snake_case (Drizzle .returning() with casing: "snake_case").
    // Coerce to Number — req.params IDs arrive as strings but cache keys are numbers.
    const appointmentId = Number(rawAppt?.appointmentId ?? rawAppt?.appointment_id as unknown);
    if (!appointmentId) return;

    const normalised: CachedAppointment = {
        appointmentId,
        appointmentDate: (rawAppt.appointmentDate ?? rawAppt.appointment_date) as string,
        status:          rawAppt.status as string,
        patientId:       (rawAppt.patientId ?? rawAppt.patient_id) as number,
        patientFirstName: (rawAppt.patientFirstName ?? rawAppt.first_name) as string,
        patientSurname:   (rawAppt.patientSurname ?? rawAppt.surname) as string,
        doctorName:       (rawAppt.doctorName ?? rawAppt.doctor_name) as string | null,
    };

    const isEligible =
        ELIGIBLE_STATUSES.has(normalised.status) &&
        new Date(normalised.appointmentDate) > new Date();

    if (!isEligible) {
        appointmentCache.delete(normalised.appointmentId);
        return;
    }

    // Merge: only overwrite defined, non-null values so we never lose existing
    // fields (e.g. doctorName) that the caller's service didn't return.
    const existing = appointmentCache.get(normalised.appointmentId) ?? {} as Partial<CachedAppointment>;
    const merged: CachedAppointment = { ...existing } as CachedAppointment;
    for (const [key, value] of Object.entries(normalised)) {
        if (value !== undefined && value !== null) {
            (merged as unknown as Record<string, unknown>)[key] = value;
        }
    }

    appointmentCache.set(normalised.appointmentId, merged);
}

/**
 * Removes an appointment from the cache (used after deletion).
 * Coerces to Number so string IDs from req.params also match numeric cache keys.
 * @param {number|string} appointmentId
 */
export function removeFromAppointmentCache(appointmentId: number | string) {
    appointmentCache.delete(Number(appointmentId));
}

// ─── Queries ───────────────────────────────────────────────────────────────────

/**
 * Returns all cached appointments whose date falls within
 * [now, now + windowMinutes].
 * @param {number} windowMinutes
 * @returns {CachedAppointment[]}
 */
export function getAppointmentsInWindow(windowMinutes: number): CachedAppointment[] {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + windowMinutes * 60_000);
    const results: CachedAppointment[] = [];

    for (const appt of appointmentCache.values()) {
        const date = new Date(appt.appointmentDate);
        if (date >= now && date <= windowEnd) {
            results.push(appt);
        }
    }

    return results;
}

// ─── Maintenance ───────────────────────────────────────────────────────────────

/**
 * Evicts appointments whose date is now in the past.
 * Call this at every cron tick to keep memory bounded.
 * @returns {number} number of entries removed
 */
export function pruneAppointmentCache(): number {
    const now = new Date();
    let pruned = 0;

    for (const [id, appt] of appointmentCache) {
        if (new Date(appt.appointmentDate) < now) {
            appointmentCache.delete(id);
            pruned++;
        }
    }

    return pruned;
}
