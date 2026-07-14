import { HttpError } from "../lib/errors.js";
/**
 * passwordResetService.js
 * Handles forgot-password and reset-password business logic.
 *
 * Security notes:
 *  - A random 32-byte raw token is generated and sent in the reset URL.
 *  - Only the SHA-256 hash of that token is stored in the database,
 *    so a DB breach cannot be used to hijack accounts.
 *  - The response for "email not found" is intentionally identical to the
 *    success response to prevent user-enumeration attacks.
 *  - Tokens expire after PASSWORD_RESET_EXPIRY_MS (default: 1 hour).
 *  - The token is consumed (cleared) immediately after a successful reset.
 */

import crypto from "crypto";
import bcrypt from "bcrypt";
import { query } from "../../drizzle-db.js";
import { sendPasswordResetEmail } from "../lib/emailService.js";
import config from "../constants/config.js";

const SALT_ROUNDS = Number(config.auth.saltRounds) || 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generates a secure random hex token and its SHA-256 hash. */
function generateResetToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, hashedToken };
}

/** Returns the future timestamp when the token should expire. */
function tokenExpiryDate() {
  return new Date(Date.now() + config.passwordReset.tokenExpiryMs);
}

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Initiates the password-reset flow for a given email address.
 *
 * Always returns successfully — even when the email does not exist — to
 * prevent user-enumeration attacks. The email is only sent when we find a
 * matching, non-deleted account.
 *
 * @param {string} email - The address the user typed in the forgot-password form
 * @param {string} frontendBaseUrl - Root URL of the frontend app (e.g. http://localhost:5173)
 */
export async function initiatePasswordReset(email, frontendBaseUrl) {
  const { rows } = await query(
    `SELECT id, name, email FROM users WHERE email = $1 AND is_deleted = false LIMIT 1`,
    [email.toLowerCase().trim()]
  );

  // Silently return when the account doesn't exist (no user-enumeration)
  if (rows.length === 0) return;

  const user = rows[0];

  const { rawToken, hashedToken } = generateResetToken();
  const expiry = tokenExpiryDate();

  // Store only the hashed token
  await query(
    `UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3`,
    [hashedToken, expiry, user.id]
  );

  // Build the full reset URL that lands on the frontend reset-password page
  const resetUrl = `${frontendBaseUrl}/#/reset-password?token=${rawToken}`;

  await sendPasswordResetEmail({
    toEmail: user.email,
    toName: user.name,
    resetUrl,
  });
}

/**
 * Validates the raw token and updates the user's password.
 *
 * @param {string} rawToken   - The plain-text token from the URL query string
 * @param {string} newPassword - The new password chosen by the user (plain-text)
 * @throws {Error} 400 if the token is invalid or expired
 */
export async function resetPassword(rawToken, newPassword) {
  if (!rawToken || !newPassword) {
    const err = new Error("Token and new password are required.");
    err.status = 400;
    throw err;
  }

  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  const { rows } = await query(
    `SELECT id, reset_token_expiry FROM users
     WHERE reset_token = $1 AND is_deleted = false LIMIT 1`,
    [hashedToken]
  );

  // Token not found
  if (rows.length === 0) {
    const err = new Error("This password reset link is invalid or has already been used.");
    err.status = 400;
    throw err;
  }

  const user = rows[0];

  // Check expiry
  if (new Date() > new Date(user.reset_token_expiry)) {
    // Clear the stale token
    await query(`UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE id = $1`, [user.id]);
    const err = new Error("This password reset link has expired. Please request a new one.");
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password and clear the reset token in a single query
  await query(
    `UPDATE users
     SET password_hash = $1,
         reset_token = NULL,
         reset_token_expiry = NULL,
         refresh_token = NULL
     WHERE id = $2`,
    [passwordHash, user.id]
  );
}
