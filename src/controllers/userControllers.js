import * as userService from "../services/userServices.js";
import * as passwordResetService from "../services/passwordResetService.js";
import bcrypt from "bcrypt";
import config from "../constants/config.js";
import { ACTIVITY_TYPES } from "../constants/activityTypes.js";


export const seedSuperAdmin = async (req, res) => {
    try {
        const superAdmin = await userService.seedSuperAdmin();
        if (!superAdmin) {
            const hash = await bcrypt.hash(config.superAdmin.password, config.auth.saltRounds);
            await userService.insertSeedSuperAdmin(config.superAdmin.email, hash);
            res.status(200).json({
                message: "Superadmin seeded successfully",
            });
        }
    } catch (err) {
        console.error("error seeding superadmin:", err);
        res.status(500).json({
            message: "internal server error",
        });
    }
};



export async function loginController(req, res) {
    const { email, password } = req.body;
    try {
        const { accessToken, refreshToken, user } = await userService.login({ email, password });
        req.activityLogger(ACTIVITY_TYPES.USER_LOGIN, { email: req.body.email });
        res
            .cookie("refresh_token", refreshToken, {
                httpOnly: true,
                secure: config.app.production,
                // sameSite: "Strict",
                sameSite: config.app.production ? "None" : "Lax",
                maxAge: 30 * 24 * 60 * 60 * 1000,
            })
            .json({ access_token: accessToken, user });
    } catch (err) {

        res.status(err.status || 500).json({ error: err.message });
    }
}

export async function refreshController(req, res) {
    try {
        const token = req.cookies["refresh_token"];
        if (!token) {
            return res.status(401).json({ error: "No refresh token" });
        }
        const { accessToken, refreshToken, user } = await userService.refreshAccess(token);
        res
            .cookie("refresh_token", refreshToken, {
                httpOnly: true,
                secure: config.app.production,
                // sameSite: "Strict",
                sameSite: config.app.production ? "None" : "Lax",
                maxAge: 30 * 24 * 60 * 60 * 1000,
            })
            .json({ access_token: accessToken, user });
    } catch (err) {
        console.error(err)
        res.clearCookie("refresh_token").status(err.status || 500).json({ error: err.message });
    }
}

export async function logoutController(req, res) {
    req.activityLogger(ACTIVITY_TYPES.USER_LOGOUT);
    await userService.logout(req.userId);
    res.clearCookie("refresh_token").sendStatus(204);
}

export async function createStaffController(req, res) {
    try {
        const newU = await userService.createStaff(req.body, req.userId);
        req.activityLogger(ACTIVITY_TYPES.USER_CREATED, { createdUserId: newU.id, email: newU.email, role: newU.role });
        res.status(201).json({ user: newU, message: "Staff user created" });
    } catch (err) {
        if (err.code === "23505") {
            return res.status(400).json({ error: "User already exists" });
        }
        res.status(err.status || 500).json({ error: err.message });
    }
}

export async function listUsersController(req, res) {
    try {
        const users = await userService.listUsers();
        res.status(200).json(users);
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err.message });
    }
}


export async function updateUserController(req, res) {
    try {
        const updatedUser = await userService.updateUser(req.body, req.params.id);
        req.activityLogger(ACTIVITY_TYPES.USER_UPDATED, { targetUserId: Number(req.params.id) });
        res.status(200).json(updatedUser);
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err.message });
    }
}

export async function deleteUserController(req, res) {
    try {
        const deletedUser = await userService.deleteUser(req.params.id);
        req.activityLogger(ACTIVITY_TYPES.USER_DELETED, { targetUserId: Number(req.params.id) });
        res.status(200).json(deletedUser);
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err.message });
    }
}

export async function toggleUserController(req, res) {
    try {
        const disabledUser = await userService.toggleUser(req.params.id);
        req.activityLogger(ACTIVITY_TYPES.USER_TOGGLED, { targetUserId: Number(req.params.id), isActive: disabledUser?.isActive });
        res.status(200).json(disabledUser);
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err.message });
    }
}

// ─── Password Reset ───────────────────────────────────────────────────────────

/**
 * POST /auth/forgot-password
 * Triggers a password-reset email.
 * Always returns 200 regardless of whether the email exists
 * to prevent user-enumeration attacks.
 */
export async function forgotPasswordController(req, res) {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "A valid email address is required." });
    }

    const frontendBaseUrl = config.app.frontend;

    try {
        // This never throws for "email not found" — it's intentional
        await passwordResetService.initiatePasswordReset(email, frontendBaseUrl);
    } catch (err) {
        // Only log real unexpected errors; don't leak them to the client
        console.error("Forgot password error:", err);
    }

    // Always return the same message so attackers can't tell if the address exists
    return res.status(200).json({
        message: "If that email is registered, you will receive a password reset link shortly.",
    });
}

/**
 * POST /auth/reset-password
 * Validates the token and sets the new password.
 */
export async function resetPasswordController(req, res) {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required." });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    try {
        await passwordResetService.resetPassword(token, newPassword);
        return res.status(200).json({ message: "Password reset successfully. You can now log in." });
    } catch (err) {
        return res.status(err.status || 500).json({ error: err.message });
    }
}
