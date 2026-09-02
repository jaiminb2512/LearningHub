import { verifyToken } from "../utils/jwt.js";
import sendResponse from "../utils/response.js";
import prisma from "../dbConnect/prismaClient.js";

/**
 * Common helper function to verify token and get user
 * Handles all common authentication checks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object|null} - User object (without password) or null if authentication fails
 */
export const verifyAndGetUser = async (req, res) => {
    try {
        // Check for authorization header or query param (for EventSource / SSE)
        let token = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else if (req.query && req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            sendResponse(res, 401, "Authorization token is required");
            return null;
        }

        // Verify token
        const decoded = verifyToken(token);

        if (!decoded) {
            sendResponse(res, 401, "Invalid or expired token");
            return null;
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { userId: decoded.userId }
        });

        if (!user) {
            sendResponse(res, 401, "User not found");
            return null;
        }

        // Check if user is deleted
        if (user.isDeleted) {
            sendResponse(res, 401, "User account is deactivated");
            return null;
        }

        // Return user without password
        const { password, ...userDetails } = user;
        return userDetails;
    } catch (error) {
        console.error("Token verification error:", error);
        sendResponse(res, 500, "Authentication failed", { error: error.message });
        return null;
    }
}

export const loggedIn = async (req, res, next) => {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        sendResponse(res, 401, "Authorization token is required");
        return null;
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
        sendResponse(res, 401, "Invalid or expired token");
        return null;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
        where: { userId: decoded.userId }
    });

    if (!user) {
        sendResponse(res, 401, "User not found");
        return null;
    }

    // Check if user is deleted
    if (user.isDeleted) {
        sendResponse(res, 401, "User account is deactivated");
        return null;
    }

    // Return user without password
    const { password, ...userDetails } = user;
    req.user = userDetails;
    next();
};

export const authenticate = async (req, res, next) => {
    const user = await verifyAndGetUser(req, res);

    if (!user) {
        return; // Response already sent by verifyAndGetUser
    }

    // Attach user details to request object
    req.user = user;
    next();
};

export const isAdmin = async (req, res, next) => {
    const user = await verifyAndGetUser(req, res);

    if (!user) {
        return; // Response already sent by verifyAndGetUser
    }

    // Check if user is Admin
    if (user.role !== "admin") {
        return sendResponse(res, 403, "Access denied. Admin privileges required");
    }

    // Attach user details to request object
    req.user = user;
    next();
};

export const isSuperAdmin = async (req, res, next) => {
    const user = await verifyAndGetUser(req, res);

    if (!user) {
        return; // Response already sent by verifyAndGetUser
    }

    // Check if user is SuperAdmin
    if (user.role !== "superAdmin") {
        return sendResponse(res, 403, "Access denied. SuperAdmin privileges required");
    }

    // Attach user details to request object
    req.user = user;
    next();
};

export const isSubAdmin = async (req, res, next) => {
    const user = await verifyAndGetUser(req, res);

    if (!user) {
        return; // Response already sent by verifyAndGetUser
    }

    // Check if user is SubAdmin
    if (user.role !== "subAdmin") {
        return sendResponse(res, 403, "Access denied. SubAdmin privileges required");
    }

    // Attach user details to request object
    req.user = user;
    next();
};

export const isAdminOrSubAdmin = async (req, res, next) => {
    const user = await verifyAndGetUser(req, res);

    if (!user) {
        return; // Response already sent by verifyAndGetUser
    }

    // Check if user is Admin or SubAdmin
    if (user.role !== "admin" && user.role !== "subAdmin") {
        return sendResponse(res, 403, "Access denied. Admin or SubAdmin privileges required");
    }

    // Attach user details to request object
    req.user = user;
    next();
};