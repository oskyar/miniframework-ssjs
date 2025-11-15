<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * ResponseWrapper - Standardized response format for all framework operations
 *
 * Provides consistent response structure across all handlers and integrations.
 * All framework methods return responses in this format for predictable error handling.
 *
 * Response Structure:
 * {
 *   success: boolean,        // Operation success status
 *   data: any,              // Response data (null if error)
 *   error: {                // Error details (null if success)
 *     code: string,         // Error type identifier
 *     message: string,      // Human-readable error description
 *     details: object       // Additional error context
 *   },
 *   meta: {                 // Operation metadata
 *     timestamp: number,    // Unix timestamp (milliseconds)
 *     handler: string,      // Handler/component name
 *     operation: string     // Method/operation name
 *   }
 * }
 *
 * @version 2.0.0
 * @author OmegaFramework
 */
function ResponseWrapper() {

    /**
     * Creates a success response
     *
     * @param {*} data - Response data
     * @param {string} handler - Handler name
     * @param {string} operation - Operation name
     * @returns {object} Success response
     */
    function success(data, handler, operation) {
        return {
            success: true,
            data: data,
            error: null,
            meta: {
                timestamp: new Date().getTime(),
                handler: handler || 'Unknown',
                operation: operation || 'Unknown'
            }
        };
    }

    /**
     * Creates a generic error response
     *
     * @param {string} message - Error message
     * @param {string} handler - Handler name
     * @param {string} operation - Operation name
     * @param {object} details - Additional error details
     * @returns {object} Error response
     */
    function error(message, handler, operation, details) {
        return {
            success: false,
            data: null,
            error: {
                code: 'ERROR',
                message: message || 'An error occurred',
                details: details || {}
            },
            meta: {
                timestamp: new Date().getTime(),
                handler: handler || 'Unknown',
                operation: operation || 'Unknown'
            }
        };
    }

    /**
     * Creates a validation error response
     *
     * @param {string} field - Field that failed validation
     * @param {string} message - Validation error message
     * @param {string} handler - Handler name
     * @param {string} operation - Operation name
     * @returns {object} Validation error response
     */
    function validationError(field, message, handler, operation) {
        return {
            success: false,
            data: null,
            error: {
                code: 'VALIDATION_ERROR',
                message: message || 'Validation failed',
                details: {
                    field: field,
                    reason: message
                }
            },
            meta: {
                timestamp: new Date().getTime(),
                handler: handler || 'Unknown',
                operation: operation || 'Unknown'
            }
        };
    }

    /**
     * Creates an authentication error response
     *
     * @param {string} message - Auth error message
     * @param {string} handler - Handler name
     * @param {string} operation - Operation name
     * @returns {object} Auth error response
     */
    function authError(message, handler, operation) {
        return {
            success: false,
            data: null,
            error: {
                code: 'AUTH_ERROR',
                message: message || 'Authentication failed',
                details: {}
            },
            meta: {
                timestamp: new Date().getTime(),
                handler: handler || 'Unknown',
                operation: operation || 'Unknown'
            }
        };
    }

    /**
     * Creates an HTTP error response
     *
     * @param {number} statusCode - HTTP status code
     * @param {string} statusText - HTTP status text
     * @param {string} handler - Handler name
     * @param {string} operation - Operation name
     * @param {*} responseBody - Response body from API
     * @returns {object} HTTP error response
     */
    function httpError(statusCode, statusText, handler, operation, responseBody) {
        return {
            success: false,
            data: null,
            error: {
                code: 'HTTP_ERROR',
                message: 'HTTP request failed with status ' + statusCode,
                details: {
                    statusCode: statusCode,
                    statusText: statusText,
                    responseBody: responseBody
                }
            },
            meta: {
                timestamp: new Date().getTime(),
                handler: handler || 'Unknown',
                operation: operation || 'Unknown'
            }
        };
    }

    /**
     * Creates a not found error response
     *
     * @param {string} resource - Resource that was not found
     * @param {string} handler - Handler name
     * @param {string} operation - Operation name
     * @returns {object} Not found error response
     */
    function notFoundError(resource, handler, operation) {
        return {
            success: false,
            data: null,
            error: {
                code: 'NOT_FOUND',
                message: resource + ' not found',
                details: {
                    resource: resource
                }
            },
            meta: {
                timestamp: new Date().getTime(),
                handler: handler || 'Unknown',
                operation: operation || 'Unknown'
            }
        };
    }

    // Public API
    this.success = success;
    this.error = error;
    this.validationError = validationError;
    this.authError = authError;
    this.httpError = httpError;
    this.notFoundError = notFoundError;
}

</script>