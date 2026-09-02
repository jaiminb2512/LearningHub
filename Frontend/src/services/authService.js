import apiClient from "./apiClient";
import { ENDPOINTS } from "./apiEndpoints";

const authService = {
    login: async (credentials) => {
        const response = await apiClient.post(ENDPOINTS.LOGIN.path, credentials);
        if (response.data.data.token) {
            localStorage.setItem("token", response.data.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.data));
        }
        return response.data;
    },
    register: async (userData) => {
        const response = await apiClient.post(ENDPOINTS.REGISTER.path, userData);
        return response.data;
    },
    logout: async () => {
        try {
            await apiClient.post(ENDPOINTS.LOGOUT.path);
        } catch (error) {
            console.error("Logout failed on server:", error);
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
        }
    },
    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem("user"));
    },
    // New function to verify token
    verifyToken: async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                return { valid: false, user: null };
            }

            // Call the /me endpoint (or any protected endpoint) to verify token
            const response = await apiClient.get("/users/me");

            if (response.data.success) {
                // Update user data in localStorage if needed
                const userData = {
                    userId: response.data.data.userId,
                    fullName: response.data.data.fullName,
                    emailId: response.data.data.emailId,
                    token: token
                };
                localStorage.setItem("user", JSON.stringify(userData));
                return { valid: true, user: userData };
            }

            return { valid: false, user: null };
        } catch (error) {
            // Token is invalid or expired
            console.error("Token verification failed:", error);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            return { valid: false, user: null };
        }
    }
};

export default authService;