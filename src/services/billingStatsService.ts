/**
 * billingStatsService.js
 *
 * Aggregated billing statistics for the superadmin analytics dashboard.
 * All queries are scoped to an optional [from, to] date range on invoice.created_at.
 */

import { db } from "../../drizzle-db.js";
import { invoices, billingPayments, billItems, patientInsurance, insuranceProviders } from "../../drizzle/migrations/schema.js";
import { eq, gte, lte, and, sql } from "drizzle-orm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Builds a WHERE clause that optionally constrains invoice.created_at */
function dateRange(from: string | undefined, to: string | undefined) {
  const conditions = [];
  if (from) conditions.push(gte(invoices.createdAt, `${from} 00:00:00`));
  // Extend to end-of-day so invoices created any time on the `to` date are included.
  // A bare date string like "2026-04-11" would be cast to "2026-04-11 00:00:00" by
  // PostgreSQL, silently excluding every row created after midnight on that day.
  if (to)   conditions.push(lte(invoices.createdAt, `${to} 23:59:59`));
  return conditions.length ? and(...conditions) : undefined;
}

// ─── KPI summary ──────────────────────────────────────────────────────────────

/**
 * Returns top-level KPIs for the given date range:
 *   totalInvoices, totalRevenue (sum of bill items), totalCollected (sum of payments),
 *   outstanding, collectionRate (%)
 */
async function getKpiSummary(from: string | undefined, to: string | undefined) {
  const where = dateRange(from, to);

  // Count invoices and group by status in one pass
  const statusRows = await db
    .select({
      status: invoices.status,
      count: sql`COUNT(*)::int`,
    })
    .from(invoices)
    .where(where)
    .groupBy(invoices.status);

  const totalInvoices = statusRows.reduce((s, r) => s + Number(r.count), 0);
  const statusBreakdown = Object.fromEntries(statusRows.map((r) => [r.status, r.count]));

  // Total revenue = sum of all bill_items.line_total for invoices in range
  const [revenueRow] = await db
    .select({ total: sql`COALESCE(SUM(${billItems.lineTotal}), 0)` })
    .from(billItems)
    .innerJoin(invoices, eq(billItems.invoiceId, invoices.id))
    .where(where);

  // Total collected = sum of payments on invoices in range
  const [collectedRow] = await db
    .select({ total: sql`COALESCE(SUM(${billingPayments.amount}), 0)` })
    .from(billingPayments)
    .innerJoin(invoices, eq(billingPayments.invoiceId, invoices.id))
    .where(where);

  const totalRevenue   = parseFloat(String(revenueRow?.total  || 0));
  const totalCollected = parseFloat(String(collectedRow?.total || 0));
  const outstanding    = Math.max(0, totalRevenue - totalCollected);
  const collectionRate = totalRevenue > 0
    ? Math.round((totalCollected / totalRevenue) * 100)
    : 0;

  return { totalInvoices, totalRevenue, totalCollected, outstanding, collectionRate, statusBreakdown };
}

// ─── Revenue over time ────────────────────────────────────────────────────────

/**
 * Revenue (bill items total) and collections (payments total) bucketed by day/week/month.
 * groupBy: "day" | "week" | "month"
 */
async function getRevenueOverTime(from: string | undefined, to: string | undefined, groupBy: string = "day") {
  const where = dateRange(from, to);

  const trunc =
    groupBy === "month" ? "month"
    : groupBy === "week" ? "week"
    : "day";

  // Revenue by period
  const revenueRows = await db
    .select({
      period: sql`DATE_TRUNC('${sql.raw(trunc)}', ${invoices.createdAt})::date`,
      revenue: sql`COALESCE(SUM(${billItems.lineTotal}), 0)`,
    })
    .from(billItems)
    .innerJoin(invoices, eq(billItems.invoiceId, invoices.id))
    .where(where)
    .groupBy(sql`DATE_TRUNC('${sql.raw(trunc)}', ${invoices.createdAt})::date`)
    .orderBy(sql`DATE_TRUNC('${sql.raw(trunc)}', ${invoices.createdAt})::date`);

  // Collections by period
  const collectionRows = await db
    .select({
      period: sql`DATE_TRUNC('${sql.raw(trunc)}', ${billingPayments.createdAt})::date`,
      collected: sql`COALESCE(SUM(${billingPayments.amount}), 0)`,
    })
    .from(billingPayments)
    .innerJoin(invoices, eq(billingPayments.invoiceId, invoices.id))
    .where(where)
    .groupBy(sql`DATE_TRUNC('${sql.raw(trunc)}', ${billingPayments.createdAt})::date`)
    .orderBy(sql`DATE_TRUNC('${sql.raw(trunc)}', ${billingPayments.createdAt})::date`);

  // Merge by period key
  const map = new Map<string, { period: string; revenue: number; collected: number }>();
  for (const r of revenueRows) {
    const key = String(r.period);
    map.set(key, { period: key, revenue: parseFloat(String(r.revenue)), collected: 0 });
  }
  for (const r of collectionRows) {
    const key = String(r.period);
    if (map.has(key)) {
      map.get(key)!.collected = parseFloat(String(r.collected));
    } else {
      map.set(key, { period: key, revenue: 0, collected: parseFloat(String(r.collected)) });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.period.localeCompare(b.period));
}

// ─── Payment method breakdown ─────────────────────────────────────────────────

/** Sum of payments grouped by payment_method, for invoices in date range. */
async function getPaymentMethodBreakdown(from: string | undefined, to: string | undefined) {
  const where = dateRange(from, to);

  const rows = await db
    .select({
      method: billingPayments.paymentMethod,
      total:  sql`COALESCE(SUM(${billingPayments.amount}), 0)`,
      count:  sql`COUNT(*)::int`,
    })
    .from(billingPayments)
    .innerJoin(invoices, eq(billingPayments.invoiceId, invoices.id))
    .where(where)
    .groupBy(billingPayments.paymentMethod)
    .orderBy(sql`SUM(${billingPayments.amount}) DESC`);

  return rows.map((r) => ({
    method: r.method,
    total:  parseFloat(String(r.total)),
    count:  r.count,
  }));
}

// ─── Revenue by service category ──────────────────────────────────────────────

/** Revenue from bill_items grouped by category (lab, drug, service, ward …). */
async function getRevenueByCategory(from: string | undefined, to: string | undefined) {
  const where = dateRange(from, to);

  const rows = await db
    .select({
      category: billItems.category,
      revenue:  sql`COALESCE(SUM(${billItems.lineTotal}), 0)`,
      count:    sql`COUNT(*)::int`,
    })
    .from(billItems)
    .innerJoin(invoices, eq(billItems.invoiceId, invoices.id))
    .where(where)
    .groupBy(billItems.category)
    .orderBy(sql`SUM(${billItems.lineTotal}) DESC`);

  return rows.map((r) => ({
    category: r.category,
    revenue:  parseFloat(String(r.revenue)),
    count:    r.count,
  }));
}

// ─── Insurance revenue by provider ────────────────────────────────────────────

/** Sum of insurance payments grouped by provider for invoices in date range. */
async function getInsuranceRevenueByProvider(from: string | undefined, to: string | undefined) {
  const where = dateRange(from, to);

  const rows = await db
    .select({
      providerId: insuranceProviders.id,
      providerName: insuranceProviders.name,
      total: sql`COALESCE(SUM(${billingPayments.amount}), 0)`,
      count: sql`COUNT(*)::int`,
    })
    .from(billingPayments)
    .innerJoin(invoices, eq(billingPayments.invoiceId, invoices.id))
    .innerJoin(patientInsurance, eq(billingPayments.patientInsuranceId, patientInsurance.id))
    .innerJoin(insuranceProviders, eq(patientInsurance.providerId, insuranceProviders.id))
    .where(and(where, eq(billingPayments.paymentMethod, "insurance")))
    .groupBy(insuranceProviders.id, insuranceProviders.name)
    .orderBy(sql`SUM(${billingPayments.amount}) DESC`);

  return rows.map((r) => ({
    providerId: r.providerId,
    providerName: r.providerName,
    total: parseFloat(String(r.total)),
    count: r.count,
  }));
}

// ─── Top-level export ─────────────────────────────────────────────────────────

/**
 * Runs all five stat queries in parallel and returns a single response object.
 */
export async function getBillingStats({ from, to, groupBy = "day" }: { from?: string; to?: string; groupBy?: string } = {}) {
  const [kpi, revenueOverTime, paymentMethods, revenueByCategory, insuranceRevenueByProvider] = await Promise.all([
    getKpiSummary(from, to),
    getRevenueOverTime(from, to, groupBy),
    getPaymentMethodBreakdown(from, to),
    getRevenueByCategory(from, to),
    getInsuranceRevenueByProvider(from, to),
  ]);

  return { kpi, revenueOverTime, paymentMethods, revenueByCategory, insuranceRevenueByProvider };
}
