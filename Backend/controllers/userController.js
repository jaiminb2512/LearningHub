import prisma from "../dbConnect/prismaClient.js";
import sendResponse from "../utils/response.js";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";
import { validatePassword } from "../utils/passwordValidation.js";

// User Registration - Users can create their own account
export const register = async (req, res) => {
    try {
        const { fullName, emailId, password } = req.body;

        if (!fullName || typeof fullName !== "string" || fullName.trim() === "") {
            return sendResponse(res, 400, "fullName is required");
        }

        if (!emailId || typeof emailId !== "string" || emailId.trim() === "") {
            return sendResponse(res, 400, "emailId is required");
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailId.trim())) {
            return sendResponse(res, 400, "Invalid email format");
        }

        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            return sendResponse(res, 400, passwordValidation.message);
        }

        // Check if emailId already exists
        const existingUser = await prisma.user.findUnique({
            where: { emailId: emailId.trim().toLowerCase() }
        });

        if (existingUser) {
            return sendResponse(res, 409, "Email already exists");
        }

        const id = randomUUID();
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);

        const newUser = await prisma.user.create({
            data: {
                userId: id,
                fullName: fullName.trim(),
                emailId: emailId.trim().toLowerCase(),
                password: hashedPassword
            },
            select: {
                userId: true,
                fullName: true,
                emailId: true,
                createdAt: true
            }
        });

        return sendResponse(res, 201, "User registered successfully", newUser);
    } catch (error) {
        console.error("register error:", error);
        return sendResponse(res, 500, "Failed to register user", { error: error.message });
    }
};

// User Login
export const login = async (req, res) => {
    try {
        const { emailId, password } = req.body;

        if (!emailId || typeof emailId !== "string" || emailId.trim() === "") {
            return sendResponse(res, 400, "emailId is required");
        }

        if (!password || typeof password !== "string" || password.trim() === "") {
            return sendResponse(res, 400, "password is required");
        }

        // Find user by emailId
        const user = await prisma.user.findUnique({
            where: {
                emailId: emailId.trim().toLowerCase()
            }
        });

        if (!user) {
            return sendResponse(res, 401, "Invalid email or password");
        }

        // Check if user is deleted
        if (user.isDeleted) {
            return sendResponse(res, 401, "User account is deactivated");
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password.trim(), user.password);

        if (!isPasswordValid) {
            return sendResponse(res, 401, "Invalid email or password");
        }

        // Generate JWT token with userId
        const token = generateToken({
            userId: user.userId
        });

        // Return user info and token
        const userData = {
            userId: user.userId,
            fullName: user.fullName,
            emailId: user.emailId,
            token: token
        };

        return sendResponse(res, 200, "Login successful", userData);
    } catch (error) {
        console.error("login error:", error);
        return sendResponse(res, 500, "Failed to login", { error: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        // Clear any server-side session or cookies if applicable
        // Since we are using JWT in localStorage, the client handles the removal
        // But we can return a success message
        return sendResponse(res, 200, "Logout successful");
    } catch (error) {
        console.error("logout error:", error);
        return sendResponse(res, 500, "Failed to logout", { error: error.message });
    }
};


// Verify token and get current user
export const getMe = async (req, res) => {
    try {
        // req.user is set by the loggedIn middleware
        const user = req.user;

        if (!user) {
            return sendResponse(res, 401, "Unauthorized");
        }

        // Return user info without password
        const userData = {
            userId: user.userId,
            fullName: user.fullName,
            emailId: user.emailId,
            createdAt: user.createdAt
        };

        return sendResponse(res, 200, "Token is valid", userData);
    } catch (error) {
        console.error("getMe error:", error);
        return sendResponse(res, 500, "Failed to verify token", { error: error.message });
    }
};