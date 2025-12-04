<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * BasicAuthStrategy - HTTP Basic Authentication
 *
 * Implements HTTP Basic Authentication using username and password.
 * Credentials are Base64 encoded and sent in the Authorization header.
 *
 * Configuration:
 * {
 *   username: string,  // Username for authentication
 *   password: string   // Password for authentication
 * }
 *
 * @version 3.0.0
 * @author OmegaFramework
 */
function BasicAuthStrategy(responseWrapper, basicAuthConfig) {
    var handler = 'BasicAuthStrategy';
    var response = responseWrapper;
    var config = basicAuthConfig || {};

    /**
     * Validates Basic Auth configuration
     *
     * @returns {object|null} Error response if invalid, null if valid
     */
    function validateConfig() {
        if (!config.username) {
            return response.validationError(
                'username',
                'Username is required for Basic Auth',
                handler,
                'validateConfig'
            );
        }

        if (!config.password) {
            return response.validationError(
                'password',
                'Password is required for Basic Auth',
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

        // Create credentials string
        var credentials = config.username + ':' + config.password;

        // Base64 encode credentials
        var base64Credentials = Base64Encode(credentials);

        var headers = {
            'Authorization': 'Basic ' + base64Credentials,
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
    OmegaFramework.register('BasicAuthStrategy', {
        dependencies: ['ResponseWrapper'],
        blockKey: 'OMG_FW_BasicAuthStrategy',
        factory: function(responseWrapperInstance, config) {
            return new BasicAuthStrategy(responseWrapperInstance, config);
        }
    });
}

</script>
