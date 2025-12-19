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
 *     datetime: number,    // Unix timestamp (milliseconds)
 *     handler: string,      // Handler/component name
 *     operation: string     // Method/operation name
 *   }
 * }
 *
 * @version 1.0.0
 * @author OmegaFramework Team
 */

 /* ============================================================================
                                    DATE
============================================================================ */ 

if (!Date.prototype.toISOString) {
    Date.prototype.toISOString = function() {

        var pad = function(number) {
            if (number < 10) {
                return '0' + number;
            }
            return number;
        }

        return this.getUTCFullYear() +
            '-' + pad(this.getUTCMonth() + 1) +
            '-' + pad(this.getUTCDate()) +
            'T' + pad(this.getUTCHours()) +
            ':' + pad(this.getUTCMinutes()) +
            ':' + pad(this.getUTCSeconds()) +
            '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
            'Z';
    }
}

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
                datetime: Platform.Function.SystemDateToLocalDate(new Date()),
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
                datetime: Platform.Function.SystemDateToLocalDate(new Date()),
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
                datetime: Platform.Function.SystemDateToLocalDate(new Date()),
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
                datetime: Platform.Function.SystemDateToLocalDate(new Date()),
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
                datetime: Platform.Function.SystemDateToLocalDate(new Date()),
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
                datetime: Platform.Function.SystemDateToLocalDate(new Date()),
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

// ========================================================================
// MODULE REGISTRATION (for OmegaFramework Module Loader)
// ========================================================================
if (typeof OmegaFramework !== 'undefined' && typeof OmegaFramework.register === 'function') {
    OmegaFramework.register('ResponseWrapper', {
        dependencies: [], // No dependencies - this is a leaf node
        blockKey: 'OMG_FW_ResponseWrapper',
        factory: function(config) {
            // Factory returns new instance of ResponseWrapper
            return new ResponseWrapper();
        }
    });
}

</script>