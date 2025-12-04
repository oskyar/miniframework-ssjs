<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * BearerAuthStrategy - Bearer Token Authentication
 *
 * Implements Bearer token authentication using a static token.
 * Useful for APIs that provide long-lived tokens or API keys.
 *
 * Configuration:
 * {
 *   token: string  // Bearer token or API key
 * }
 *
 * @version 3.0.0
 * @author OmegaFramework
 */
function BearerAuthStrategy(responseWrapper, bearerConfig) {
    var handler = 'BearerAuthStrategy';
    var response = responseWrapper;
    var config = bearerConfig || {};

    /**
     * Validates Bearer Auth configuration
     *
     * @returns {object|null} Error response if invalid, null if valid
     */
    function validateConfig() {
        if (!config.token) {
            return response.validationError(
                'token',
                'Bearer token is required',
                handler,
                'validateConfig'
            );
        }

        return null; // Valid
    }

    /**
     * Gets authentication headers for API requests
     *
     * @returns {object} Response with auth headers
     */
    function getHeaders() {
        var configValidation = validateConfig();
        if (configValidation) {
            return configValidation;
        }

        var headers = {
            'Authorization': 'Bearer ' + config.token,
            'Content-Type': 'application/json'
        };

        return response.success(headers, handler, 'getHeaders');
    }

    // Public API
    this.getHeaders = getHeaders;
    this.validateConfig = validateConfig;
}

// ============================================================================
// OMEGAFRAMEWORK MODULE REGISTRATION
// ============================================================================
if (typeof OmegaFramework !== 'undefined' && typeof OmegaFramework.register === 'function') {
    OmegaFramework.register('BearerAuthStrategy', {
        dependencies: ['ResponseWrapper'],
        blockKey: 'OMG_FW_BearerAuthStrategy',
        factory: function(responseWrapperInstance, config) {
            return new BearerAuthStrategy(responseWrapperInstance, config);
        }
    });
}

</script>
