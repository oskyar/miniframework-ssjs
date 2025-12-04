<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * BaseIntegration - Foundation for all external system integrations
 *
 * Provides common functionality for integrating with external APIs:
 * - HTTP request handling with authentication
 * - Strategy pattern for pluggable authentication
 * - URL building and header management
 * - Standardized error handling
 *
 * All integration classes (SFMC, Veeva, Data Cloud, etc.) extend this base.
 *
 * @version 3.0.0
 * @author OmegaFramework
 */
function BaseIntegration(responseWrapper, connectionHandler, integrationName, integrationConfig, authStrategy) {
    var handler = integrationName || 'BaseIntegration';
    var response = responseWrapper;
    var config = integrationConfig || {};

    // Dependencies
    var connection = connectionHandler;
    var auth = authStrategy || null;

    /**
     * Validates base integration configuration
     *
     * @returns {object|null} Error response if invalid, null if valid
     */
    function validateConfig() {
        if (!config.baseUrl) {
            return response.validationError(
                'baseUrl',
                'Base URL is required for integration',
                handler,
                'validateConfig'
            );
        }

        return null; // Valid
    }

    /**
     * Sets or updates the authentication strategy
     *
     * @param {object} authStrategyInstance - Authentication strategy instance
     */
    function setAuthStrategy(authStrategyInstance) {
        auth = authStrategyInstance;
    }

    /**
     * Gets authentication headers from the configured strategy
     *
     * @returns {object} Response with auth headers or error
     */
    function getAuthHeaders() {
        if (!auth) {
            return response.error(
                'No authentication strategy configured',
                handler,
                'getAuthHeaders'
            );
        }

        return auth.getHeaders();
    }

    /**
     * Builds full URL from base URL and endpoint
     *
     * @param {string} endpoint - API endpoint path
     * @returns {string} Full URL
     */
    function buildUrl(endpoint) {
        var baseUrl = config.baseUrl;

        // Remove trailing slash from base URL
        if (baseUrl && baseUrl.charAt(baseUrl.length - 1) === '/') {
            baseUrl = baseUrl.substring(0, baseUrl.length - 1);
        }

        // Ensure endpoint starts with slash
        if (endpoint && endpoint.charAt(0) !== '/') {
            endpoint = '/' + endpoint;
        }

        return baseUrl + (endpoint || '');
    }

    /**
     * Merges custom headers with auth headers
     *
     * @param {object} customHeaders - Custom headers to merge
     * @returns {object} Response with merged headers or error
     */
    function buildHeaders(customHeaders) {
        var authHeadersResult = getAuthHeaders();

        if (!authHeadersResult.success) {
            return authHeadersResult; // Return auth error
        }

        var headers = authHeadersResult.data;

        // Merge custom headers (custom headers override auth headers)
        if (customHeaders) {
            for (var key in customHeaders) {
                if (customHeaders.hasOwnProperty(key)) {
                    headers[key] = customHeaders[key];
                }
            }
        }

        return response.success(headers, handler, 'buildHeaders');
    }

    /**
     * Executes GET request
     *
     * @param {string} endpoint - API endpoint
     * @param {object} options - Request options {headers, queryParams}
     * @returns {object} Response
     */
    function get(endpoint, options) {
        options = options || {};

        var url = buildUrl(endpoint);

        // Add query parameters if provided
        if (options.queryParams) {
            var queryString = buildQueryString(options.queryParams);
            url += queryString;
        }

        var headersResult = buildHeaders(options.headers);
        if (!headersResult.success) {
            return headersResult;
        }

        return connection.get(url, headersResult.data);
    }

    /**
     * Executes POST request
     *
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request payload
     * @param {object} options - Request options {headers}
     * @returns {object} Response
     */
    function post(endpoint, data, options) {
        options = options || {};

        var url = buildUrl(endpoint);

        var headersResult = buildHeaders(options.headers);
        if (!headersResult.success) {
            return headersResult;
        }

        return connection.post(url, data, headersResult.data);
    }

    /**
     * Executes PUT request
     *
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request payload
     * @param {object} options - Request options {headers}
     * @returns {object} Response
     */
    function put(endpoint, data, options) {
        options = options || {};

        var url = buildUrl(endpoint);

        var headersResult = buildHeaders(options.headers);
        if (!headersResult.success) {
            return headersResult;
        }

        return connection.put(url, data, headersResult.data);
    }

    /**
     * Executes PATCH request
     *
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request payload
     * @param {object} options - Request options {headers}
     * @returns {object} Response
     */
    function patch(endpoint, data, options) {
        options = options || {};

        var url = buildUrl(endpoint);

        var headersResult = buildHeaders(options.headers);
        if (!headersResult.success) {
            return headersResult;
        }

        return connection.patch(url, data, headersResult.data);
    }

    /**
     * Executes DELETE request
     *
     * @param {string} endpoint - API endpoint
     * @param {object} options - Request options {headers}
     * @returns {object} Response
     */
    function remove(endpoint, options) {
        options = options || {};

        var url = buildUrl(endpoint);

        var headersResult = buildHeaders(options.headers);
        if (!headersResult.success) {
            return headersResult;
        }

        return connection.remove(url, headersResult.data);
    }

    /**
     * Builds query string from parameters object
     *
     * @param {object} params - Query parameters
     * @returns {string} Query string (e.g., "?key1=value1&key2=value2")
     */
    function buildQueryString(params) {
        if (!params || typeof params !== 'object') {
            return '';
        }

        var queryParts = [];

        for (var key in params) {
            if (params.hasOwnProperty(key)) {
                var value = params[key];
                if (value !== null && value !== undefined) {
                    queryParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
                }
            }
        }

        return queryParts.length > 0 ? '?' + queryParts.join('&') : '';
    }

    // Public API
    this.handler = handler;
    this.response = response;
    this.config = config;
    this.connection = connection;
    this.auth = auth;

    this.validateConfig = validateConfig;
    this.setAuthStrategy = setAuthStrategy;
    this.getAuthHeaders = getAuthHeaders;
    this.buildUrl = buildUrl;
    this.buildHeaders = buildHeaders;
    this.buildQueryString = buildQueryString;

    this.get = get;
    this.post = post;
    this.put = put;
    this.patch = patch;
    this.remove = remove;
}

// ============================================================================
// OMEGAFRAMEWORK MODULE REGISTRATION
// ============================================================================
if (typeof OmegaFramework !== 'undefined' && typeof OmegaFramework.register === 'function') {
    OmegaFramework.register('BaseIntegration', {
        dependencies: ['ResponseWrapper', 'ConnectionHandler'],
        blockKey: 'OMG_FW_BaseIntegration',
        factory: function(responseWrapper, connectionHandler, config) {
            return new BaseIntegration(
                responseWrapper,
                connectionHandler,
                config.integrationName,
                config.integrationConfig,
                config.authStrategy
            );
        }
    });
}

</script>
