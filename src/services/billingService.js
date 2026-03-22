/**
 * billingService.js
 *
 * Central event-driven billing service.
 * Every clinical action that should generate a charge calls addItem().
 *
 * Architecture:
 *  - Each inpatient admission  →  one Invoice (created lazily on first billable event)
 *  - Each outpatient visit     →  one Invoice (created lazily on first billable event)
 *  - Each billable event       →  one BillItem linked to the Invoice
 *  - Daily inpatient charges   →  computed virtually at read-time (NOT stored)
 *  - Payments                  →  BillingPayment rows linked to the Invoice
 */

import { db } from "../../drizzle-db.js";
import { SERVICE_CATEGORIES } from "../constants/domain.js";
import {
  billItems,
  invoices,
  billingPayments,
  services,
  inpatientAdmissions,
  patientVisits,
  patients,
} from "../../drizzle/migrations/schema.js";
import { eq, and, or, sum, sql } from "drizzle-orm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Simple invoice number: INV-YYYYMMDD-<random 4 digits> */
function generateInvoiceNumber() {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${ymd}-${rand}`;
}

// ─── Invoice management ───────────────────────────────────────────────────────

/**
 * Get the open invoice for an admission or visit.
 * Creates one if it does not yet exist.
 */
export async function getOrCreateInvoice({ admissionId = null, visitId = null }) {
  if (!admissionId && !visitId) {
    throw new Error("getOrCreateInvoice requires admissionId or visitId");
  }

  const conditions = [];
  if (admissionId) conditions.push(eq(invoices.admissionId, admissionId));
  if (visitId) conditions.push(eq(invoices.visitId, visitId));

  const where = conditions.length === 1 ? conditions[0] : and(...conditions);
  const existing = await db.select().from(invoices).where(where).limit(1);
  if (existing.length > 0) return existing[0];

  // Create a brand-new invoice
  let invoiceNumber = generateInvoiceNumber();
  // Ensure uniqueness (retry once on collision)
  try {
    const [created] = await db
      .insert(invoices)
      .values({ admissionId, visitId, invoiceNumber })
      .returning();
    return created;
  } catch {
    invoiceNumber = generateInvoiceNumber();
    const [created] = await db
      .insert(invoices)
      .values({ admissionId, visitId, invoiceNumber })
      .returning();
    return created;
  }
}

// ─── Add a bill item ──────────────────────────────────────────────────────────

/**
 * addItem — the single entry-point for all auto-billing events.
 *
 * @param {object} opts
 * @param {number}  [opts.admissionId]    - inpatient_admissions.id
 * @param {number}  [opts.visitId]        - patient_visits.id
 * @param {number}  [opts.invoiceId]      - bypass invoice lookup (optional)
 * @param {number}  [opts.serviceId]      - services.id (optional)
 * @param {string}  opts.description      - human-readable label
 * @param {string}  [opts.category]       - lab|drug|service|ward|food|consultation|daily_charge
 * @param {number}  [opts.quantity]       - default 1
 * @param {number}  opts.unitPrice        - price per unit
 * @param {string}  [opts.billingType]    - 'credit'|'pay_now'
 * @param {number}  [opts.discountPercent] - 0-100
 * @param {number}  [opts.createdBy]      - users.id
 */
export async function addItem({
  admissionId = null,
  visitId = null,
  invoiceId = null,
  serviceId = null,
  description,
  category = SERVICE_CATEGORIES.SERVICE,
  quantity = 1,
  unitPrice,
  billingType = "credit",
  discountPercent = 0,
  createdBy = null,
}) {
  // Resolve invoice
  if (!invoiceId) {
    const invoice = await getOrCreateInvoice({ admissionId, visitId });
    invoiceId = invoice.id;
  }

  const [item] = await db
    .insert(billItems)
    .values({
      invoiceId,
      serviceId: serviceId || null,
      description,
      category,
      quantity,
      unitPrice: String(unitPrice),
      billingType,
      discountPercent: String(discountPercent),
      createdBy: createdBy || null,
    })
    .returning();

  return item;
}

// ─── Service price lookup ─────────────────────────────────────────────────────

/** Returns the price for a named service, or 0 if not found. */
export async function getServicePrice(name) {
  const [svc] = await db
    .select({ price: services.price })
    .from(services)
    .where(eq(services.name, name))
    .limit(1);
  return svc ? parseFloat(svc.price) : 0;
}

/** Returns the price for a service by its ID, or null if not found. */
export async function getServicePriceById(id) {
  const [svc] = await db
    .select({ price: services.price })
    .from(services)
    .where(eq(services.id, id))
    .limit(1);
  return svc ? parseFloat(svc.price) : null;
}

/** Returns all services in a category (used for daily charge computation). */
export async function getServicesByCategory(category) {
  return db
    .select()
    .from(services)
    .where(eq(services.category, category));
}

// ─── Admission bill ───────────────────────────────────────────────────────────

/**
 * getBillForAdmission
 *
 * Returns:
 *   invoice, admission, storedItems, dailyItems, allItems,
 *   totalAmount, totalPaid, balance, payments, days
 *
 * Daily charges are NOT stored in DB – they are computed from
 *   days = ceil( (dischargeDate || now) − admissionDate )
 * and filled from services with category = 'daily_charge'.
 */
export async function getBillForAdmission(admissionId) {
  // Fetch admission
  const [admission] = await db
    .select()
    .from(inpatientAdmissions)
    .where(eq(inpatientAdmissions.id, admissionId));
  if (!admission) throw new Error("Admission not found");

  // Ensure invoice exists
  const invoice = await getOrCreateInvoice({ admissionId });

  // Stored bill items
  const storedItems = await db
    .select()
    .from(billItems)
    .where(eq(billItems.invoiceId, invoice.id))
    .orderBy(billItems.createdAt);

  // Compute daily charges ─────────────────────────────────────────────────────
  const admissionDate = new Date(admission.admissionDate);
  const endDate = admission.endDate ? new Date(admission.endDate) : new Date();
  const days = Math.max(1, Math.ceil((endDate - admissionDate) / (1000 * 60 * 60 * 24)));

  const dailyServices = await getServicesByCategory(SERVICE_CATEGORIES.DAILY_CHARGE);

  // One entry per daily-service, quantity = days (compact timeline)
  const dailyItems = dailyServices.map((svc) => ({
    id: `virtual-${svc.id}`,
    isVirtual: true,
    invoiceId: invoice.id,
    serviceId: svc.id,
    description: `${svc.name} × ${days} day${days !== 1 ? "s" : ""}`,
    category: SERVICE_CATEGORIES.DAILY_CHARGE,
    quantity: days,
    unitPrice: parseFloat(svc.price),
    lineTotal: parseFloat(svc.price) * days,
    discountPercent: 0,
    billingType: "credit",
    createdAt: admission.admissionDate,
  }));

  // Payments ──────────────────────────────────────────────────────────────────
  const payments = await db
    .select()
    .from(billingPayments)
    .where(eq(billingPayments.invoiceId, invoice.id))
    .orderBy(billingPayments.createdAt);

  // Totals ────────────────────────────────────────────────────────────────────
  const storedTotal = storedItems.reduce(
    (acc, item) => acc + parseFloat(item.lineTotal || 0),
    0
  );
  const dailyTotal = dailyItems.reduce((acc, item) => acc + item.lineTotal, 0);
  const totalAmount = storedTotal + dailyTotal;
  const totalPaid = payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);

  // Running total per row (stored items + daily items merged)
  const allItems = [...storedItems, ...dailyItems];
  let running = 0;
  const itemsWithRunning = allItems.map((item) => {
    const lineTotal = item.lineTotal !== undefined ? parseFloat(item.lineTotal) : item.unitPrice * item.quantity;
    running += lineTotal;
    return { ...item, lineTotal, runningTotal: running };
  });

  return {
    invoice,
    admission,
    items: itemsWithRunning,
    storedItems,
    dailyItems,
    totalAmount,
    totalPaid,
    balance: totalAmount - totalPaid,
    payments,
    days,
  };
}

// ─── Outpatient visit bill ────────────────────────────────────────────────────

/**
 * Builds the bill for an outpatient visit: stored bill items, payment history, and running totals.
 * @param {number} visitId
 * @returns {Promise<object>} Bill summary with items, payments, subtotal, paid, and balance
 */
export async function getBillForVisit(visitId) {
  const invoice = await getOrCreateInvoice({ visitId });

  const items = await db
    .select()
    .from(billItems)
    .where(eq(billItems.invoiceId, invoice.id))
    .orderBy(billItems.createdAt);

  const payments = await db
    .select()
    .from(billingPayments)
    .where(eq(billingPayments.invoiceId, invoice.id));

  const totalAmount = items.reduce(
    (acc, item) => acc + parseFloat(item.lineTotal || 0),
    0
  );
  const totalPaid = payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);

  // running total per row
  let running = 0;
  const itemsWithRunning = items.map((item) => {
    const lineTotal = parseFloat(item.lineTotal || 0);
    running += lineTotal;
    return { ...item, lineTotal, runningTotal: running };
  });

  return {
    invoice,
    items: itemsWithRunning,
    totalAmount,
    totalPaid,
    balance: totalAmount - totalPaid,
    payments,
  };
}

// ─── Record a payment ─────────────────────────────────────────────────────────

/**
 * Records a payment against an invoice and auto-closes it when fully settled.
 * @param {{ invoiceId: number, amount: number, paymentMethod?: string, notes?: string|null, createdBy?: number|null }} opts
 * @returns {Promise<object>} The inserted payment row
 */
export async function recordPayment({ invoiceId, amount, paymentMethod = "cash", notes = null, createdBy = null }) {
  const [payment] = await db
    .insert(billingPayments)
    .values({ invoiceId, amount: String(amount), paymentMethod, notes, createdBy })
    .returning();

  // Auto-close invoice if fully paid
  const [totRow] = await db
    .select({ total: sql`COALESCE(SUM(line_total),0)` })
    .from(billItems)
    .where(eq(billItems.invoiceId, invoiceId));

  const paid = await db
    .select({ paid: sql`COALESCE(SUM(amount),0)` })
    .from(billingPayments)
    .where(eq(billingPayments.invoiceId, invoiceId));

  const total = parseFloat(totRow?.total || 0);
  const totalPaidSoFar = parseFloat(paid[0]?.paid || 0);

  if (totalPaidSoFar >= total && total > 0) {
    await db
      .update(invoices)
      .set({ status: "paid" })
      .where(eq(invoices.id, invoiceId));
  }

  return payment;
}

// ─── List all services ────────────────────────────────────────────────────────

let servicesCache = null;
const invalidateServicesCache = () => { servicesCache = null; };

/** Returns all services ordered by category and name, using an in-memory cache.
 * @returns {Promise<object[]>}
 */
export async function listServices() {
  if (servicesCache) return servicesCache;
  const result = await db.select().from(services).orderBy(services.category, services.name);
  servicesCache = result;
  return result;
}

/**
 * Creates or updates a service record and invalidates the services cache.
 * @param {{ id?: number|null, name: string, category: string, price: number, isVariablePrice?: boolean }} serviceData
 * @returns {Promise<object>} The upserted service row
 */
export async function upsertService({ id = null, name, category, price, isVariablePrice = false }) {
  if (id) {
    const [updated] = await db
      .update(services)
      .set({ name, category, price: String(price), isVariablePrice })
      .where(eq(services.id, id))
      .returning();
    invalidateServicesCache();
    return updated;
  }
  const [created] = await db
    .insert(services)
    .values({ name, category, price: String(price), isVariablePrice })
    .returning();
  invalidateServicesCache();
  return created;
}

/** Deletes a service by ID and invalidates the services cache.
 * @param {number} id
 * @returns {Promise<object>} The deleted service row
 */
export async function deleteService(id) {
  const [deleted] = await db
    .delete(services)
    .where(eq(services.id, id))
    .returning();
  invalidateServicesCache();
  return deleted;
}

// ─── Patient-level invoice queries ───────────────────────────────────────────

/**
 * Get all invoices for a patient (via admissions, visits, or direct patientId).
 * Returns each invoice with computed totals and payment amounts.
 */
export async function getPatientInvoices(patientId) {
  // Get all admissions for this patient
  const admissionRows = await db
    .select({ id: inpatientAdmissions.id, admissionDate: inpatientAdmissions.admissionDate })
    .from(inpatientAdmissions)
    .where(eq(inpatientAdmissions.patientId, patientId));

  // Get all visits for this patient
  const visitRows = await db
    .select({ id: patientVisits.id, visitDate: patientVisits.createdAt, purpose: patientVisits.purpose })
    .from(patientVisits)
    .where(eq(patientVisits.patientId, patientId));

  const admissionIds = admissionRows.map(a => a.id);
  const visitIds = visitRows.map(v => v.id);

  // Build OR conditions to find all invoices for this patient
  const conditions = [eq(invoices.patientId, patientId)];
  for (const aid of admissionIds) conditions.push(eq(invoices.admissionId, aid));
  for (const vid of visitIds) conditions.push(eq(invoices.visitId, vid));

  const allInvoices = await db
    .select()
    .from(invoices)
    .where(or(...conditions))
    .orderBy(sql`${invoices.createdAt} DESC`);

  // For each invoice, compute totals
  const enriched = await Promise.all(allInvoices.map(async (inv) => {
    const [totRow] = await db
      .select({ total: sql`COALESCE(SUM(line_total), 0)` })
      .from(billItems)
      .where(eq(billItems.invoiceId, inv.id));

    const [paidRow] = await db
      .select({ paid: sql`COALESCE(SUM(amount), 0)` })
      .from(billingPayments)
      .where(eq(billingPayments.invoiceId, inv.id));

    const total = parseFloat(totRow?.total || 0);
    const totalPaid = parseFloat(paidRow?.paid || 0);
    const balance = Math.max(0, total - totalPaid);

    // Determine invoice type
    let type = "manual";
    let typeLabel = "Manual Bill";
    let linkId = null;
    if (inv.admissionId) {
      type = "admission";
      typeLabel = "Inpatient Admission";
      linkId = inv.admissionId;
    } else if (inv.visitId) {
      type = "visit";
      typeLabel = "Outpatient Visit";
      linkId = inv.visitId;
    }

    return { ...inv, total, totalPaid, balance, type, typeLabel, linkId };
  }));

  return enriched;
}

/**
 * Create a standalone manual invoice for a patient (not tied to admission/visit).
 */
export async function createPatientInvoice(patientId) {
  const invoiceNumber = generateInvoiceNumber();
  const [created] = await db
    .insert(invoices)
    .values({ patientId, invoiceNumber })
    .returning();
  return created;
}
