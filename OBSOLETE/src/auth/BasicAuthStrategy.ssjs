<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * BasicAuthStrategy - HTTP Basic Authentication strategy
 *
 * Handles Basic Auth for APIs that require username/password
 * Encodes credentials in Base64 format
 *
 * @version 1.0.0
 */

function BasicAuthStrategy(basicAuthConfig) {
    var handler = 'BasicAuthStrategy';
    var response = new OmegaFrameworkResponse();

    // Configuration
    var config = basicAuthConfig || {};

    /**
     * Validates Basic Auth configuration
     * @returns {Object|null} Error or null if valid
     */
    function validateConfig() {
        if (!config.username) {
            return response.validationError('username', 'Username is required for Basic Auth', handler, 'validateConfig');
        }
        if (!config.password) {
            return response.validationError('password', 'Password is required for Basic Auth', handler, 'validateConfig');
        }
        return null;
    }

    /**
     * Encodes credentials to Base64
     * @returns {String} Base64 encoded credentials
     */
    function encodeCredentials() {
        try {
            var credentials = config.username + ':' + config.password;

            // SFMC Base64 encoding
            var base64 = Base64Encode(credentials);

            return base64;

        } catch (ex) {
            return null;
        }
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

            var encodedCredentials = encodeCredentials();

            if (!encodedCredentials) {
                return response.error('ENCODING_ERROR', 'Failed to encode credentials', {}, handler, 'getHeaders');
            }

            var headers = {
                'Authorization': 'Basic ' + encodedCredentials,
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
