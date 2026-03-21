import { query } from "../../drizzle-db.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import config from "../constants/config.js";

const SALT_ROUNDS = Number(config.auth.saltRounds) || 12;


export async function seedSuperAdmin() {
    const { rows } = await query("SELECT id FROM users WHERE role = 'superadmin' LIMIT 1");
    return rows.length > 0;
}


export const insertSeedSuperAdmin = async (email, hash) => {
    const result = await query(
        "INSERT INTO users (name, email, password_hash, role) VALUES ('Super Admin', $1, $2, 'superadmin') RETURNING *",
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

export async function login({ email, password }) {
    const { rows } = await query(`SELECT name, id, password_hash, created_at, is_active, role FROM users WHERE email = $1`, [email.toLowerCase()]);
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

export async function refreshAccess(oldRefresh) {
    let payload;
    try {
        payload = jwt.verify(oldRefresh, config.auth.jwtRefreshKey);
    } catch {
        const err = new Error("Invalid or expired refresh token");
        err.status = 401;
        throw err;
    }

    const { rows } = await query(`SELECT refresh_token, created_at, is_active, role, email, name FROM users WHERE id = $1`, [payload.sub]);
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

export async function logout(userId) {
    await query(`UPDATE users SET refresh_token = NULL WHERE id = $1`, [userId]);
}

export async function createStaff({ email, password, role, name }, creatorId) {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const res = await query(
        `INSERT INTO users(email, password_hash, role, created_by, name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, role, name`,
        [email.toLowerCase(), hashed, role || "staff", creatorId, name]
    );
    return res.rows[0];
}

export async function listUsers() {
    const { rows } = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.is_active,
        u.created_by,
        cb.name AS created_by_name,
        u.created_at
      FROM users u
      LEFT JOIN users cb ON u.created_by = cb.id
      ORDER BY u.id DESC;
    `);
    return rows;
}

export async function updateUser(userData, userId) {
    const { rows } = await query(
        `UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4 RETURNING *`,
        [userData.name, userData.email, userData.role, userId]
    );
    return rows[0];
}


export async function deleteUser(userId) {
    const { rows } = await query(`DELETE FROM users WHERE id = $1 RETURNING *`, [userId]);
    return rows[0];
}

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
