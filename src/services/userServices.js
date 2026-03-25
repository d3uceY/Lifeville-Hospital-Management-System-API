import { query } from "../../drizzle-db.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import config from "../constants/config.js";

const SALT_ROUNDS = Number(config.auth.saltRounds) || 12;


/** Returns true if a superadmin row already exists, false otherwise. */
export async function seedSuperAdmin() {
    const { rows } = await query("SELECT id FROM users WHERE role = 'superadmin' AND is_deleted = false LIMIT 1");
    return rows.length > 0;
}


/**
 * Inserts the initial super-admin user with role_id resolved from the roles table.
 * @param {string} email
 * @param {string} hash - bcrypt-hashed password
 * @returns {Promise<object>} The created user row
 */
export const insertSeedSuperAdmin = async (email, hash) => {
    const result = await query(
        `INSERT INTO users (name, email, password_hash, role, role_id)
         VALUES ('Super Admin', $1, $2, 'superadmin',
                 (SELECT id FROM roles WHERE name = 'superadmin' LIMIT 1))
         RETURNING *`,
        [email, hash]
    );
    return result.rows[0];
}


function signAccess(user) {
    return jwt.sign(
        { sub: user.id, role: user.role, createdAt: user.createdAt },
        config.auth.jwtAccessKey,
        { expiresIn: config.auth.accessExpires }
    );
}

function signRefresh(userId, jti) {
    return jwt.sign(
        { sub: userId, jti },
        config.auth.jwtRefreshKey,
        { expiresIn: config.auth.refreshExpires }
    );
}

/**
 * Authenticates a user by email/password, rotates the refresh token (hashed JTI), and returns a JWT pair.
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ accessToken: string, refreshToken: string, user: { id: number, name: string, email: string, role: string } }>}
 * @throws {Error} 401 if credentials are invalid or account is inactive
 */
export async function login({ email, password }) {
    const { rows } = await query(`SELECT name, id, password_hash, created_at, is_active, role FROM users WHERE email = $1 AND is_deleted = false`, [email.toLowerCase()]);
    const u = rows[0];
    // check if user is enabled
    if (!u || !u.is_active) {
        const err = new Error("Invalid credentials");
        err.status = 401;
        throw err;
    }
    // check if password is correct
    if (!u || !(await bcrypt.compare(password, u.password_hash))) {
        const err = new Error("Invalid credentials");
        err.status = 401;
        throw err;
    }

    const jti = crypto.randomUUID();
    const rtoken = signRefresh(u.id, jti);
    const hashJti = crypto.createHash("sha256").update(jti).digest("hex");
    await query(`UPDATE users SET refresh_token = $1 WHERE id = $2`, [hashJti, u.id]);

    return {
        accessToken: signAccess({ id: u.id, role: u.role, createdAt: u.created_at }),
        refreshToken: rtoken,
        user: { id: u.id, name: u.name, email, role: u.role },
    };
}

/**
 * Verifies an existing refresh token, detects token replay (stolen token reuse), rotates to a new
 * token pair, and returns the new JWTs together with the user object.
 * @param {string} oldRefresh - The raw refresh JWT from the cookie
 * @returns {Promise<{ accessToken: string, refreshToken: string, user: object }>}
 * @throws {Error} 401 if the token is invalid/expired, 403 on replay detection, 404 if user not found
 */
export async function refreshAccess(oldRefresh) {
    let payload;
    try {
        payload = jwt.verify(oldRefresh, config.auth.jwtRefreshKey);
    } catch {
        const err = new Error("Invalid or expired refresh token");
        err.status = 401;
        throw err;
    }

    const { rows } = await query(`SELECT refresh_token, created_at, is_active, role, email, name FROM users WHERE id = $1 AND is_deleted = false`, [payload.sub]);
    const u = rows[0];


    if (!u) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }

    // check if user is enabled
    if (!u || !u.is_active) {
        const err = new Error("Invalid credentials");
        err.status = 401;
        throw err;
    }

    const hashJti = crypto.createHash("sha256").update(payload.jti).digest("hex");
    if (!rows[0] || rows[0].refresh_token !== hashJti) {
        const err = new Error("Refresh token replay detected");
        err.status = 403;
        throw err;
    }

    const newJti = crypto.randomUUID();
    const newRefresh = signRefresh(payload.sub, newJti);
    const newHash = crypto.createHash("sha256").update(newJti).digest("hex");
    await query(`UPDATE users SET refresh_token = $1 WHERE id = $2`, [newHash, payload.sub]);

    return {
        accessToken: signAccess({ id: payload.sub, role: rows[0].role, createdAt: rows[0].created_at }),
        refreshToken: newRefresh,
        user: { id: payload.sub, name: rows[0].name, email: rows[0].email, role: rows[0].role },
    };
}

/** Clears the stored refresh token for the given user, effectively logging them out.
 * @param {number} userId
 */
export async function logout(userId) {
    await query(`UPDATE users SET refresh_token = NULL WHERE id = $1`, [userId]);
}

/**
 * Creates a new staff account with a bcrypt-hashed password.
 * @param {{ email: string, password: string, role: string, name: string, roleId?: number }} staffData
 * @param {number} creatorId - ID of the superadmin creating this account
 * @returns {Promise<object>} The newly inserted user row
 */
export async function createStaff({ email, password, role, name, roleId }, creatorId) {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const res = await query(
        `INSERT INTO users(email, password_hash, role, role_id, created_by, name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, role, role_id, name`,
        [email.toLowerCase(), hashed, role || "staff", roleId ?? null, creatorId, name]
    );
    return res.rows[0];
}

/** Returns all users joined with their role label and the name of the user who created them, ordered by newest first.
 * @returns {Promise<object[]>}
 */
export async function listUsers() {
    const { rows } = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.role_id,
        r.label AS role_label,
        u.is_active,
        u.created_by,
        cb.name AS created_by_name,
        u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN users cb ON u.created_by = cb.id
      WHERE u.is_deleted = false
      ORDER BY u.id DESC;
    `);
    return rows;
}

/**
 * Updates name, email, role, and role_id for a user.
 * @param {{ name: string, email: string, role: string, roleId?: number }} userData
 * @param {number} userId
 * @returns {Promise<object>} The updated user row
 */
export async function updateUser(userData, userId) {
    const { rows } = await query(
        `UPDATE users SET name = $1, email = $2, role = $3, role_id = $4 WHERE id = $5 RETURNING *`,
        [userData.name, userData.email, userData.role, userData.roleId ?? null, userId]
    );
    return rows[0];
}


/** Soft-deletes a user by setting is_deleted = true and clearing the refresh token.
 * The row is never physically removed to preserve foreign key references (e.g. patient_visits.doctor_id).
 * @param {number} userId
 * @returns {Promise<object>} The updated user row
 */
export async function deleteUser(userId) {
    const { rows } = await query(
        `UPDATE users SET is_deleted = true, refresh_token = NULL WHERE id = $1 RETURNING *`,
        [userId]
    );
    return rows[0];
}

/** Flips the `is_active` flag and clears the refresh token for a user, forcing them to re-login.
 * @param {number} userId
 * @returns {Promise<object>} The updated user row
 */
export async function toggleUser(userId) {
    const { rows } = await query(
        `UPDATE users 
       SET is_active = NOT is_active,
        refresh_token = NULL
       WHERE id = $1 
       RETURNING *`,
        [userId]
    );
    return rows[0];
}
