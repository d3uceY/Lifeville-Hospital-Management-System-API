import * as userService from "../services/userServices.js";

import bcrypt from "bcrypt";
import config from "../constants/config.js";


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
    await userService.logout(req.userId);
    res.clearCookie("refresh_token").sendStatus(204);
}

export async function createStaffController(req, res) {
    try {
        const newU = await userService.createStaff(req.body, req.userId);
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
        res.status(200).json(updatedUser);
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err.message });
    }
}

export async function deleteUserController(req, res) {
    try {
        const deletedUser = await userService.deleteUser(req.params.id);
        res.status(200).json(deletedUser);
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err.message });
    }
}

export async function toggleUserController(req, res) {
    try {
        const disabledUser = await userService.toggleUser(req.params.id);
        res.status(200).json(disabledUser);
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err.message });
    }
}
