/**
 * Password Validation Utility
 * 
 * Validates password based on security requirements:
 * - Length: 6 to 12 characters
 * - At least one capital letter
 * - At least one special character
 * - At least one number
 */

/**
 * Validates password against security requirements
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid: boolean, message: string }
 */
export const validatePassword = (password) => {
    if (!password || typeof password !== "string") {
        return {
            isValid: false,
            message: "Password is required"
        };
    }

    const trimmedPassword = password.trim();

    // Check length (6 to 16 characters)
    if (trimmedPassword.length < 6) {
        return {
            isValid: false,
            message: "Password must be at least 6 characters long"
        };
    }

    if (trimmedPassword.length > 16) {
        return {
            isValid: false,
            message: "Password must not exceed 16 characters"
        };
    }

    // Check for at least one capital letter
    const hasCapitalLetter = /[A-Z]/.test(trimmedPassword);
    if (!hasCapitalLetter) {
        return {
            isValid: false,
            message: "Password must contain at least one capital letter"
        };
    }

    // Check for at least one number
    const hasNumber = /[0-9]/.test(trimmedPassword);
    if (!hasNumber) {
        return {
            isValid: false,
            message: "Password must contain at least one number"
        };
    }

    // Check for at least one special character
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(trimmedPassword);
    if (!hasSpecialChar) {
        return {
            isValid: false,
            message: "Password must contain at least one special character (!@#$%^&*()_+-=[]{}; etc.)"
        };
    }

    return {
        isValid: true,
        message: "Password is valid"
    };
};

/**
 * Get password requirements as a string
 * @returns {string} - Password requirements description
 */
export const getPasswordRequirements = () => {
    return "Password must be 6-12 characters long and contain at least one capital letter, one number, and one special character";
};

/**
 * Get password requirements as an array
 * @returns {Array<string>} - Array of password requirements
 */
export const getPasswordRequirementsList = () => {
    return [
        "Length: 6 to 12 characters",
        "At least one capital letter (A-Z)",
        "At least one number (0-9)",
        "At least one special character (!@#$%^&* etc.)"
    ];
};

