import type { Request, Response } from "express";
import * as notificationServices from "../services/notificationServices.js";

export const getNotificationsByUserData = async (req: Request, res: Response) => {
    try {
        const userData = {
            id: req.userId,
            role: req.userRole,
            userCreatedAt: new Date(req.userCreatedAt)
        };
        const notifications = await notificationServices.getNotificationsByUserData(userData);
        res.status(200).json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
}

export const getPaginatedNotificationsByUserData = async (req: Request, res: Response) => {
    try {
        const { page, pageSize } = req.query;
        const notifications = await notificationServices.getPaginatedNotificationsByUserData({
            id: req.userId,
            role: req.userRole,
            userCreatedAt: new Date(req.userCreatedAt)
        }, Number(page), Number(pageSize));
        res.status(200).json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
}

export const getUnreadNotifications = async (req: Request, res: Response) => {
    try {
        const userData = {
            id: req.userId,
            role: req.userRole,
            userCreatedAt: new Date(req.userCreatedAt)    
        };
        const notifications = await notificationServices.getUnreadNotifications(userData);
        res.status(200).json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
}

export const markNotificationAsRead = async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;
        const userData = {
            id: req.userId,
            role: req.userRole
        };
        await notificationServices.markNotificationAsRead(notificationId, userData);
        res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to mark notification as read" });
    }
}
