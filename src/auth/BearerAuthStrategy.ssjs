<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * BearerAuthStrategy - Bearer Token authentication strategy
 *
 * Handles Bearer token authentication for APIs with static tokens
 * Simple token-based auth without OAuth flow
 *
 * @version 1.0.0
 */

function BearerAuthStrategy(bearerConfig) {
    var handler = 'BearerAuthStrategy';
    var response = new OmegaFrameworkResponse();

    // Configuration
    var config = bearerConfig || {};

    /**
     * Validates Bearer Auth configuration
     * @returns {Object|null} Error or null if valid
     */
    function validateConfig() {
        if (!config.token) {
            return response.validationError('token', 'Bearer token is required', handler, 'validateConfig');
        }
        return null;
    }

    /**
     * Gets authorization headers
     * @returns {Object} Headers response
     */
    function getHeaders() {
        try {
            var validation = validateConfig();
            if (validation) {
                return validation;
            }

            var headers = {
                'Authorization': 'Bearer ' + config.token,
                'Content-Type': 'application/json'
            };

            return response.success(headers, handler, 'getHeaders');

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getHeaders');
        }
    }

    // Public API
    this.getHeaders = getHeaders;
    this.validateConfig = validateConfig;
}

</script>
