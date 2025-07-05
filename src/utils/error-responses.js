/**
 * Utility functions for creating standardized error responses
 */

/**
 * Create a standardized error response for MCP tools
 * @param {string} message - The error message
 * @param {string} code - Error code for categorization
 * @param {Object} context - Additional context information
 * @returns {Object} Standardized error response
 */
export const createErrorResponse = (message, code = 'UNKNOWN_ERROR', context = {}) => ({
  content: [{ type: "text", text: message }],
  isError: true,
  errorCode: code,
  context,
  timestamp: new Date().toISOString()
});

/**
 * Create a success response for MCP tools
 * @param {string} message - The success message
 * @param {Object} data - Additional data to include
 * @returns {Object} Standardized success response
 */
export const createSuccessResponse = (message, data = {}) => ({
  content: [{ type: "text", text: message }],
  data,
  timestamp: new Date().toISOString()
});

/**
 * Validation error for invalid input parameters
 * @param {string} parameter - Name of the invalid parameter
 * @param {any} value - The invalid value
 * @param {string} expected - What was expected
 * @returns {Object} Validation error response
 */
export const createValidationError = (parameter, value, expected) => 
  createErrorResponse(
    `Invalid ${parameter}: received ${typeof value === 'object' ? JSON.stringify(value) : value}, expected ${expected}`,
    'VALIDATION_ERROR',
    { parameter, value, expected }
  );

/**
 * System error for underlying system/library failures
 * @param {string} operation - The operation that failed
 * @param {Error} originalError - The original error
 * @returns {Object} System error response
 */
export const createSystemError = (operation, originalError) =>
  createErrorResponse(
    `System error during ${operation}: ${originalError.message}`,
    'SYSTEM_ERROR',
    { 
      operation, 
      originalMessage: originalError.message,
      stack: originalError.stack?.split('\n')[1] || 'No stack trace'
    }
  );

/**
 * Timeout error for operations that exceed time limits
 * @param {string} operation - The operation that timed out
 * @param {number} timeoutMs - The timeout value in milliseconds
 * @returns {Object} Timeout error response
 */
export const createTimeoutError = (operation, timeoutMs) =>
  createErrorResponse(
    `Operation ${operation} timed out after ${timeoutMs}ms`,
    'TIMEOUT_ERROR',
    { operation, timeoutMs }
  );