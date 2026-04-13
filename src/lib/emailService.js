/**
 * emailService.js
 * Handles all outgoing emails via Nodemailer.
 * The SMTP transport is created lazily on the first call so the app can
 * start even when SMTP env-vars are not yet configured.
 */

import nodemailer from "nodemailer";
import { getAllSettings, getEmailRaw } from "../services/settingsService.js";

// ─── Transport ────────────────────────────────────────────────────────────────

let _transport = null;

/** Call after saving email settings to force a fresh transport on next use. */
export function invalidateEmailTransport() { _transport = null; }

async function getTransport() {
  if (_transport) return _transport;

  const emailRow = await getEmailRaw();
  const host   = emailRow?.smtp_host;
  const port   = emailRow?.smtp_port;
  const secure = emailRow?.smtp_secure;
  const user   = emailRow?.smtp_user;
  const pass   = emailRow?.smtp_pass;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP is not configured. Set SMTP settings in the admin panel (Settings → Email)"
    );
  }

  _transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return _transport;
}

// ─── HTML Template ────────────────────────────────────────────────────────────

/**
 * Builds the password-reset HTML email.
 * @param {object} opts
 * @param {string} opts.recipientName  - User's display name
 * @param {string} opts.resetUrl       - Full reset link (with raw token)
 * @param {string} opts.hospitalName   - From settings
 * @param {string} opts.hospitalEmail  - From settings (contact)
 * @param {string} opts.expiryMinutes  - How long the link is valid
 * @returns {string} HTML string
 */
function buildResetEmailHtml({ recipientName, resetUrl, hospitalName, hospitalEmail, expiryMinutes }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: #1d4ed8; padding: 32px 40px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { margin: 4px 0 0; color: #bfdbfe; font-size: 13px; }
    .body { padding: 40px; }
    .greeting { font-size: 16px; margin: 0 0 16px; }
    .message { font-size: 15px; color: #374151; line-height: 1.65; margin: 0 0 28px; }
    .btn-wrap { text-align: center; margin: 0 0 28px; }
    .btn { display: inline-block; background: #1d4ed8; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.2px; }
    .expiry-note { font-size: 13px; color: #6b7280; text-align: center; margin: 0 0 28px; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 28px 0; }
    .fallback { font-size: 13px; color: #6b7280; line-height: 1.6; }
    .fallback a { color: #1d4ed8; word-break: break-all; }
    .ignore-note { margin-top: 24px; font-size: 13px; color: #9ca3af; }
    .footer { background: #f9fafb; padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    .footer a { color: #6b7280; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>${hospitalName}</h1>
      <p>Hospital Management System</p>
    </div>
    <div class="body">
      <p class="greeting">Hello, <strong>${recipientName}</strong>!</p>
      <p class="message">
        We received a request to reset the password for the account associated with this email address.
        Click the button below to choose a new password.
      </p>
      <div class="btn-wrap">
        <a href="${resetUrl}" class="btn">Reset My Password</a>
      </div>
      <p class="expiry-note">This link will expire in <strong>${expiryMinutes} minutes</strong>.</p>
      <hr class="divider" />
      <p class="fallback">
        If the button above doesn't work, copy and paste this URL into your browser:
        <br />
        <a href="${resetUrl}">${resetUrl}</a>
      </p>
      <p class="ignore-note">
        If you did not request a password reset, you can safely ignore this email.
        Your password will not be changed.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${hospitalName}
      ${hospitalEmail ? ` &bull; <a href="mailto:${hospitalEmail}">${hospitalEmail}</a>` : ""}
    </div>
  </div>
</body>
</html>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Sends a password-reset email.
 * Pulls hospital branding from the settings tables automatically.
 *
 * @param {object} opts
 * @param {string} opts.toEmail       - Recipient email address
 * @param {string} opts.toName        - Recipient display name
 * @param {string} opts.resetUrl      - Full reset URL (contains the raw token)
 */
export async function sendPasswordResetEmail({ toEmail, toName, resetUrl }) {
  const expiryMinutes = Math.round(config.passwordReset.tokenExpiryMs / 60_000);

  // Pull branding from the in-memory settings cache (falls back to a fresh DB fetch if not yet cached)
  const settings = await getAllSettings();

  const hospitalName = settings?.hospitalInfo?.hospital_name ?? "Lifeville HMS";
  const hospitalEmail = settings?.contact?.email ?? null;

  const html = buildResetEmailHtml({
    recipientName: toName,
    resetUrl,
    hospitalName,
    hospitalEmail,
    expiryMinutes,
  });

  const emailRow = await getEmailRaw();
  const fromAddress =
    emailRow?.smtp_from ||
    `"${hospitalName}" <${emailRow?.smtp_user}>`;

  const transport = await getTransport();
  await transport.sendMail({
    from: fromAddress,
    to: `"${toName}" <${toEmail}>`,
    subject: `Reset your ${hospitalName} password`,
    html,
  });
}
