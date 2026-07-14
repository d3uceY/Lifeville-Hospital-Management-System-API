import { HttpError } from "../lib/errors.js";
import { query } from "../../drizzle-db.js";

export const getPaginatedBills = async (
    page = 1,
    pageSize = 10,
    { billNumber, status, issuedBy, patientId } = {}
) => {
    const pageNumber = Number(page);
    const pageSizeNumber = Number(pageSize);
    const offset = (pageNumber - 1) * pageSizeNumber;

    const normalize = (val) =>
        typeof val === "string" && val.trim() !== "" && val !== "undefined" ? val.trim() : null;

    // Dynamic WHERE clause parts
    const whereClauses = [];
    const values = [];
    let paramIndex = 1;

    if (normalize(billNumber)) {
        whereClauses.push(`b.bill_number ILIKE $${paramIndex++}`);
        values.push(`%${normalize(billNumber)}%`);
    }
    if (normalize(status)) {
        whereClauses.push(`b.status ILIKE $${paramIndex++}`);
        values.push(`%${normalize(status)}%`);
    }
    if (normalize(issuedBy)) {
        whereClauses.push(`b.issued_by ILIKE $${paramIndex++}`);
        values.push(`%${normalize(issuedBy)}%`);
    }
    if (normalize(patientId)) {
        whereClauses.push(`b.patient_id = $${paramIndex++}`);
        values.push(normalize(patientId));
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // 1️⃣ Get total count (for totalPages)
    const countResult = await query(
        `SELECT COUNT(*) AS total FROM bills b ${whereSQL}`,
        values
    );
    const totalItems = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(totalItems / pageSizeNumber);

    // 2️⃣ Get paginated bills with their items
    const { rows } = await query(
        `
        SELECT 
            b.id AS bill_id,
            b.patient_id,
            b.bill_number,
            b.issued_by,
            b.updated_by,
            b.updated_at,
            b.bill_date,
            b.subtotal,
            b.discount,
            b.tax,
            b.total_amount,
            b.status,
            b.payment_method,
            b.amount_paid,
            b.payment_date,
            b.notes,
            bi.id AS bill_item_id,
            bi.description,
            bi.unit_price,
            bi.quantity,
            p.surname,
            p.first_name,
            p.other_names,
            p.hospital_number
        FROM bills b
        LEFT JOIN bill_items bi ON b.id = bi.bill_id
        LEFT JOIN patients p ON b.patient_id = p.patient_id
        ${whereSQL}
        ORDER BY b.bill_date DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `,
        [...values, pageSizeNumber, offset]
    );

    // 3️⃣ Group rows into bills with items
    const billsMap = new Map();

    rows.forEach(row => {
        if (!billsMap.has(row.bill_id)) {
            billsMap.set(row.bill_id, {
                id: row.bill_id,
                patientId: row.patient_id,
                patientName: `${row.first_name} ${row.other_names ?? ''} ${row.surname}`.trim(),
                hospitalNumber: row.hospital_number,
                billNumber: row.bill_number,
                issuedBy: row.issued_by,
                updatedBy: row.updated_by,
                updatedAt: row.updated_at,
                billDate: row.bill_date,
                subtotal: row.subtotal,
                discount: row.discount,
                tax: row.tax,
                totalAmount: row.total_amount,
                status: row.status,
                paymentMethod: row.payment_method,
                amountPaid: row.amount_paid,
                paymentDate: row.payment_date,
                notes: row.notes,
                items: []
            });
        }

        if (row.bill_item_id) {
            billsMap.get(row.bill_id).items.push({
                id: row.bill_item_id,
                description: row.description,
                unitPrice: row.unit_price,
                quantity: row.quantity
            });
        }
    });

    return {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize,
        skipped: offset,
        data: Array.from(billsMap.values())
    };
};

export const getBillByPatientId = async (patientId) => {
    const { rows } = await query(
        `
        SELECT 
            b.id AS bill_id,
            b.patient_id,
            b.bill_number,
            b.issued_by,
            b.updated_by,
            b.updated_at,
            b.bill_date,
            b.subtotal,
            b.discount,
            b.tax,
            b.total_amount,
            b.status,
            b.payment_method,
            b.amount_paid,
            b.payment_date,
            b.notes,
            bi.id AS bill_item_id,
            bi.description,
            bi.unit_price,
            bi.quantity,
            p.surname,
            p.first_name,
            p.other_names,
            p.hospital_number
        FROM bills b
        LEFT JOIN bill_items bi ON b.id = bi.bill_id
        LEFT JOIN patients p ON b.patient_id = p.patient_id
        WHERE b.patient_id = $1
        ORDER BY b.bill_date DESC
        `,
        [patientId]
    );

    // Group bills with their items
    const billsMap = new Map();

    rows.forEach(row => {
        if (!billsMap.has(row.bill_id)) {
            billsMap.set(row.bill_id, {
                id: row.bill_id,
                patient_id: row.patient_id,
                patient_name: `${row.first_name} ${row.other_names ?? ''} ${row.surname}`.trim(),
                hospital_number: row.hospital_number,
                bill_number: row.bill_number,
                issued_by: row.issued_by,
                updated_by: row.updated_by,
                updated_at: row.updated_at,
                bill_date: row.bill_date,
                subtotal: row.subtotal,
                discount: row.discount,
                tax: row.tax,
                total_amount: row.total_amount,
                status: row.status,
                payment_method: row.payment_method,
                amount_paid: row.amount_paid,
                payment_date: row.payment_date,
                notes: row.notes,
                items: []
            });
        }

        if (row.bill_item_id) {
            billsMap.get(row.bill_id).items.push({
                id: row.bill_item_id,
                description: row.description,
                unit_price: row.unit_price,
                quantity: row.quantity
            });
        }
    });

    return Array.from(billsMap.values());
};

export const createBill = async (billData) => {
    const {
        billNumber,
        patientId,
        issuedBy,
        billDate,
        subtotal,
        discount,
        tax,
        totalAmount,
        status,
        paymentMethod,
        amountPaid,
        paymentDate,
        billItems,
        notes
    } = billData;


    const { rows } = await query(
        `INSERT INTO bills (patient_id, bill_number, issued_by, bill_date, subtotal, status, discount, tax, total_amount, payment_method, amount_paid, payment_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
            patientId, billNumber, issuedBy, billDate, subtotal,
            status, discount, tax, totalAmount, paymentMethod,
            amountPaid, paymentDate, notes
        ]
    );

    const bill_id = rows[0].id;

    await Promise.all(
        billItems.map(billItem =>
            query(
                `INSERT INTO bill_items (bill_id, description, unit_price, quantity)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [bill_id, billItem.description, billItem.unitPrice, billItem.quantity]
            )
        )
    );

    return rows;
};


export async function deleteBill(billId) {
    const { rows } = await query(`DELETE FROM bills WHERE id = $1 RETURNING *`, [billId]);
    return rows.length > 0;
}


export const getBillById = async (billId) => {
    const { rows } = await query(
        `
        SELECT 
            b.id AS bill_id,
            b.patient_id,
            b.bill_number,
            b.issued_by,
            b.bill_date,
            b.subtotal,
            b.discount,
            b.tax,
            b.total_amount,
            b.status,
            b.payment_method,
            b.amount_paid,
            b.payment_date,
            b.notes,
            b.updated_by,
            b.updated_at,
            bi.id AS bill_item_id,
            bi.description,
            bi.unit_price,
            bi.quantity
        FROM bills b
        LEFT JOIN bill_items bi ON b.id = bi.bill_id
        WHERE b.id = $1
        `,
        [billId]
    );

    if (rows.length === 0) return null; // No bill found

    // Transform rows into a single bill object with an array of items
    const bill = {
        id: rows[0].bill_id,
        patient_id: rows[0].patient_id,
        bill_number: rows[0].bill_number,
        issued_by: rows[0].issued_by,
        updated_by: rows[0].updated_by,
        updated_at: rows[0].updated_at,
        bill_date: rows[0].bill_date,
        subtotal: rows[0].subtotal,
        discount: rows[0].discount,
        tax: rows[0].tax,
        total_amount: rows[0].total_amount,
        status: rows[0].status,
        payment_method: rows[0].payment_method,
        amount_paid: rows[0].amount_paid,
        payment_date: rows[0].payment_date,
        notes: rows[0].notes,
        items: rows
            .filter(row => row.bill_item_id) // Avoid null if no items
            .map(row => ({
                id: row.bill_item_id,
                description: row.description,
                unit_price: row.unit_price,
                quantity: row.quantity
            }))
    };

    return bill;
};


export const updateBillPayment = async (billId, {
    status,
    amountPaid,
    paymentMethod,
    paymentDate,
    updatedBy,
    notes
}) => {
    // Fetch current status first
    const { rows: current } = await query(`SELECT status FROM bills WHERE id = $1`, [billId]);
    if (current.length === 0) return null;

    const currentStatus = current[0].status;
    if (currentStatus === "paid" || currentStatus === "cancelled") {
        const err = new Error(`Cannot modify a ${currentStatus} bill.`);
        err.status = 409;
        throw err;
    }

    const { rows } = await query(
        `
        UPDATE bills
        SET 
            status = COALESCE($1, status),
            amount_paid = COALESCE($2, amount_paid),
            payment_method = COALESCE($3, payment_method),
            payment_date = COALESCE($4, payment_date),
            updated_by = COALESCE($5, updated_by),
            notes = COALESCE($6, notes),
            updated_at = NOW()
        WHERE id = $7
        RETURNING *
        `,
        [status, amountPaid, paymentMethod, paymentDate, updatedBy, notes, billId]
    );

    return rows[0] ?? null;
};
