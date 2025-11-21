<script runat="server">

Platform.Load("core", "1.1.1");

/**
 * BaseHandler - Base class for all OmegaFramework handlers
 *
 * Provides common functionality shared across all handlers:
 * - Authentication validation
 * - REST URL retrieval
 * - Auth headers generation
 * - Shared instances of ResponseWrapper, AuthHandler, ConnectionHandler
 *
 * This eliminates code duplication across EmailHandler, DataExtensionHandler,
 * AssetHandler, FolderHandler, LogHandler, and other handlers.
 *
 * @param {string} handlerName - Name of the handler (e.g., 'EmailHandler')
 * @param {object} authConfig - Authentication configuration object
 * @param {object} authInstance - (Optional) Shared AuthHandler instance
 * @param {object} connectionInstance - (Optional) Shared ConnectionHandler instance
 * @returns {object} Base handler object with common methods
 */
function BaseHandler(handlerName, authConfig, authInstance, connectionInstance) {
    var handler = handlerName;
    var response = new OmegaFrameworkResponse();

    // Use shared instances if provided, otherwise create new ones
    var auth = authInstance || new AuthHandler(authConfig);
    var connection = connectionInstance || new ConnectionHandler();
    var config = authConfig || {};

    /**
     * Validates authentication configuration
     * @returns {object|null} Error response if validation fails, null if valid
     */
    function validateAuthConfig() {
        if (!config.clientId || !config.clientSecret || !config.authBaseUrl) {
            return response.authError(
                'Authentication configuration is required. Please provide clientId, clientSecret, and authBaseUrl.',
                handler,
                'validateAuthConfig'
            );
        }
        return null;
    }

    /**
     * Gets the REST API base URL from token response
     * @returns {string|object} REST URL string or error response object
     */
    function getRestUrl() {
        var tokenResult = auth.getValidToken(config);
        if (!tokenResult.success) {
            return tokenResult;
        }
        return tokenResult.data.restInstanceUrl || 'https://YOUR_SUBDOMAIN.rest.marketingcloudapis.com';
    }

    /**
     * Gets authentication headers for API requests
     * @returns {object} Auth headers object or error response object
     */
    function getAuthHeaders() {
        var authValidation = validateAuthConfig();
        if (authValidation) {
            return authValidation;
        }

        var tokenResult = auth.getValidToken(config);
        if (!tokenResult.success) {
            return tokenResult;
        }

        return auth.createAuthHeader(tokenResult.data);
    }

    /**
     * Helper to build query string from options object
     * @param {object} options - Options object with query parameters
     * @returns {string} Query string (e.g., "?$pageSize=50&$page=1")
     */
    function buildQueryString(options) {
        if (!options) {
            return '';
        }

        var queryParams = [];

        if (options.pageSize) {
            queryParams.push('$pageSize=' + options.pageSize);
        }
        if (options.page) {
            queryParams.push('$page=' + options.page);
        }
        if (options.filter) {
            queryParams.push('$filter=' + encodeURIComponent(options.filter));
        }
        if (options.orderBy) {
            queryParams.push('$orderBy=' + encodeURIComponent(options.orderBy));
        }

        return queryParams.length > 0 ? '?' + queryParams.join('&') : '';
    }

    // Public API - Using this pattern for SFMC Content Block compatibility

    // Properties
    this.handler = handler;
    this.response = response;
    this.auth = auth;
    this.connection = connection;
    this.config = config;

    // Methods
    this.validateAuthConfig = validateAuthConfig;
    this.getRestUrl = getRestUrl;
    this.getAuthHeaders = getAuthHeaders;
    this.buildQueryString = buildQueryString;
}

</script>
