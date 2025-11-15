<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * SFMCIntegration - Salesforce Marketing Cloud REST API integration
 *
 * Provides methods for interacting with SFMC REST API:
 * - Authentication (OAuth2 client credentials)
 * - Token management and caching
 * - REST API requests with proper auth headers
 *
 * @version 1.1.0
 * @see https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/mc-apis.html
 */

function SFMCIntegration(sfmcConfig, connectionInstance) {
    // Initialize base integration
    var base = new BaseIntegration('SFMCIntegration', sfmcConfig, null, connectionInstance);

    // Extract base properties
    var handler = base.handler;
    var response = base.response;
    var connection = base.connection;
    var config = base.config;

    // Setup OAuth2 authentication for SFMC
    if (config.clientId && config.clientSecret && config.authBaseUrl) {
        var authStrategy = new OAuth2AuthStrategy({
            tokenUrl: config.authBaseUrl + 'v2/token',
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            grantType: 'client_credentials',
            tokenRefreshBuffer: config.tokenRefreshBuffer || 300000
        }, connection);

        base.setAuthStrategy(authStrategy);
    }

    /**
     * Gets REST instance URL from token
     * @returns {String|Object} REST URL or error
     */
    function getRestUrl() {
        try {
            if (!base.auth) {
                return response.error('NO_AUTH', 'Authentication not configured', {}, handler, 'getRestUrl');
            }

            var tokenResult = base.auth.getValidToken();

            if (!tokenResult.success) {
                return tokenResult;
            }

            var restUrl = tokenResult.data.rest_instance_url ||
                         config.restBaseUrl ||
                         'https://YOUR_SUBDOMAIN.rest.marketingcloudapis.com';

            return restUrl;

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getRestUrl');
        }
    }

    /**
     * Gets SOAP instance URL from token
     * @returns {String|Object} SOAP URL or error
     */
    function getSoapUrl() {
        try {
            if (!base.auth) {
                return response.error('NO_AUTH', 'Authentication not configured', {}, handler, 'getSoapUrl');
            }

            var tokenResult = base.auth.getValidToken();

            if (!tokenResult.success) {
                return tokenResult;
            }

            return tokenResult.data.soap_instance_url || config.soapBaseUrl;

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getSoapUrl');
        }
    }

    /**
     * Makes REST API request with automatic base URL resolution
     * @param {String} method - HTTP method (GET, POST, PUT, DELETE)
     * @param {String} endpoint - API endpoint
     * @param {Object} data - Request data (optional)
     * @param {Object} options - Additional options (optional)
     * @returns {Object} Response
     */
    function makeRestRequest(method, endpoint, data, options) {
        try {
            var restUrl = getRestUrl();

            if (typeof restUrl === 'object' && !restUrl.success) {
                return restUrl; // Error from getRestUrl
            }

            // Update base URL to REST instance
            var originalBaseUrl = config.baseUrl;
            config.baseUrl = restUrl;

            var result;

            switch (method.toUpperCase()) {
                case 'GET':
                    result = base.get(endpoint, options);
                    break;
                case 'POST':
                    result = base.post(endpoint, data, options);
                    break;
                case 'PUT':
                    result = base.put(endpoint, data, options);
                    break;
                case 'DELETE':
                    result = base.remove(endpoint, options);
                    break;
                default:
                    result = response.error('INVALID_METHOD', 'Invalid HTTP method: ' + method, {}, handler, 'makeRestRequest');
            }

            // Restore original base URL
            config.baseUrl = originalBaseUrl;

            return result;

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'makeRestRequest');
        }
    }

    /**
     * Gets current authentication token
     * @returns {Object} Token info or error
     */
    function getToken() {
        try {
            if (!base.auth) {
                return response.error('NO_AUTH', 'Authentication not configured', {}, handler, 'getToken');
            }

            return base.auth.getValidToken();

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getToken');
        }
    }

    /**
     * Checks if current token is expired
     * @returns {Boolean} True if expired
     */
    function isTokenExpired() {
        try {
            if (!base.auth) {
                return true;
            }

            var tokenResult = base.auth.getValidToken();

            if (!tokenResult.success) {
                return true;
            }

            return base.auth.isTokenExpired(tokenResult.data);

        } catch (ex) {
            return true;
        }
    }

    /**
     * Clears cached token (forces refresh on next request)
     */
    function clearTokenCache() {
        try {
            if (base.auth && typeof base.auth.clearCache === 'function') {
                base.auth.clearCache();
            }
        } catch (ex) {
            // Silently fail
        }
    }

    /**
     * Creates authorization header for manual use
     * @returns {Object} Auth header or error
     */
    function createAuthHeader() {
        try {
            if (!base.auth) {
                return response.error('NO_AUTH', 'Authentication not configured', {}, handler, 'createAuthHeader');
            }

            return base.auth.getHeaders();

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'createAuthHeader');
        }
    }

    // Public API - SFMC specific methods
    this.getRestUrl = getRestUrl;
    this.getSoapUrl = getSoapUrl;
    this.makeRestRequest = makeRestRequest;
    this.getToken = getToken;
    this.isTokenExpired = isTokenExpired;
    this.clearTokenCache = clearTokenCache;
    this.createAuthHeader = createAuthHeader;

    // Expose base methods
    this.get = base.get;
    this.post = base.post;
    this.put = base.put;
    this.remove = base.remove;
    this.buildUrl = base.buildUrl;

    // Expose base properties
    this.handler = handler;
    this.response = response;
    this.connection = connection;
    this.config = config;
}

</script>
