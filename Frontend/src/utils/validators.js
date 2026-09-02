/**
 * Validation utility functions
 */

/**
 * Validate principal amount
 * @param {string|number} principal - Principal amount
 * @returns {object} Validation result with isValid and message
 */
export const validatePrincipal = (principal) => {
    if (!principal) {
        return { isValid: false, message: 'Principal amount is required' }
    }

    const p = parseFloat(principal)
    if (isNaN(p) || p <= 0) {
        return { isValid: false, message: 'Principal must be a positive number' }
    }

    return { isValid: true, message: '' }
}

/**
 * Validate interest rate
 * @param {string|number} rate - Interest rate
 * @returns {object} Validation result with isValid and message
 */
export const validateRate = (rate) => {
    if (!rate) {
        return { isValid: false, message: 'Interest rate is required' }
    }

    const r = parseFloat(rate)
    if (isNaN(r) || r <= 0) {
        return { isValid: false, message: 'Interest rate must be a positive number' }
    }

    return { isValid: true, message: '' }
}

/**
 * Validate time components
 * @param {string|number} years - Years
 * @param {string|number} months - Months
 * @param {string|number} days - Days
 * @returns {object} Validation result with isValid and message
 */
export const validateTime = (years, months, days) => {
    const y = parseFloat(years || '0')
    const m = parseFloat(months || '0')
    const d = parseFloat(days || '0')

    if (isNaN(y) || isNaN(m) || isNaN(d) || y < 0 || m < 0 || d < 0) {
        return { isValid: false, message: 'Time values must be non-negative numbers' }
    }

    if (y === 0 && m === 0 && d === 0) {
        return { isValid: false, message: 'Please provide at least one time component (years, months, or days)' }
    }

    return { isValid: true, message: '' }
}

/**
 * Validate cycles
 * @param {string|number} cycles - Number of cycles
 * @returns {object} Validation result with isValid and message
 */
export const validateCycles = (cycles) => {
    const n = parseInt(cycles || '1', 10)

    if (isNaN(n) || n <= 0) {
        return { isValid: false, message: 'Number of cycles must be a positive integer' }
    }

    return { isValid: true, message: '' }
}

/**
 * Validate all form inputs
 * @param {object} inputs - Form inputs object
 * @returns {object} Validation result with isValid and message
 */
export const validateAll = (inputs) => {
    const { principal, rate, years, months, days, cycles } = inputs

    const principalValidation = validatePrincipal(principal)
    if (!principalValidation.isValid) return principalValidation

    const rateValidation = validateRate(rate)
    if (!rateValidation.isValid) return rateValidation

    const timeValidation = validateTime(years, months, days)
    if (!timeValidation.isValid) return timeValidation

    const cyclesValidation = validateCycles(cycles)
    if (!cyclesValidation.isValid) return cyclesValidation

    return { isValid: true, message: '' }
}
