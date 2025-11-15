<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * BaseIntegration - Base class for external system integrations
 *
 * Provides common functionality for integrating with external platforms:
 * - Connection management via ConnectionHandler
 * - Authentication strategy pattern
 * - Standardized response handling
 * - Error management
 *
 * @version 1.0.0
 */

function BaseIntegration(integrationName, integrationConfig, authStrategy, connectionInstance) {
    var handler = integrationName || 'BaseIntegration';
    var response = new OmegaFrameworkResponse();

    // Configuration
    var config = integrationConfig || {};

    // Shared instances
    var connection = connectionInstance || new ConnectionHandler();
    var auth = authStrategy || null;

    /**
     * Validates integration configuration
     * @param {Object} cfg - Configuration to validate
     * @returns {Object|null} Error response if validation fails, null if valid
     */
    function validateConfig(cfg) {
        var configToValidate = cfg || config;

        if (!configToValidate) {
            return response.validationError('config', 'Configuration object is required', handler, 'validateConfig');
        }
        if (!configToValidate.baseUrl) {
            return response.validationError('baseUrl', 'Base URL is required', handler, 'validateConfig');
        }

        return null; // Validation passed
    }

    /**
     * Gets authentication headers using the configured strategy
     * @returns {Object} Auth headers or error response
     */
    function getAuthHeaders() {
        try {
            if (!auth) {
                return response.error('NO_AUTH_STRATEGY', 'No authentication strategy configured', {}, handler, 'getAuthHeaders');
            }

            return auth.getHeaders();

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getAuthHeaders');
        }
    }

    /**
     * Builds full URL from endpoint
     * @param {String} endpoint - API endpoint
     * @returns {String} Full URL
     */
    function buildUrl(endpoint) {
        var baseUrl = config.baseUrl || '';

        // Remove trailing slash from base URL
        if (baseUrl.charAt(baseUrl.length - 1) === '/') {
            baseUrl = baseUrl.substring(0, baseUrl.length - 1);
        }

        // Ensure endpoint starts with slash
        if (endpoint.charAt(0) !== '/') {
            endpoint = '/' + endpoint;
        }

        return baseUrl + endpoint;
    }

    /**
     * Makes an HTTP GET request
     * @param {String} endpoint - API endpoint
     * @param {Object} options - Request options (headers, queryParams, etc.)
     * @returns {Object} Response
     */
    function get(endpoint, options) {
        try {
            var validation = validateConfig();
            if (validation) {
                return validation;
            }

            var authHeaders = getAuthHeaders();
            if (!authHeaders.success) {
                return authHeaders;
            }

            var url = buildUrl(endpoint);
            var headers = authHeaders.data || {};

            // Merge custom headers if provided
            if (options && options.headers) {
                for (var key in options.headers) {
                    if (options.headers.hasOwnProperty(key)) {
                        headers[key] = options.headers[key];
                    }
                }
            }

            return connection.get(url, {headers: headers});

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'get');
        }
    }

    /**
     * Makes an HTTP POST request
     * @param {String} endpoint - API endpoint
     * @param {Object} data - Request payload
     * @param {Object} options - Request options
     * @returns {Object} Response
     */
    function post(endpoint, data, options) {
        try {
            var validation = validateConfig();
            if (validation) {
                return validation;
            }

            var authHeaders = getAuthHeaders();
            if (!authHeaders.success) {
                return authHeaders;
            }

            var url = buildUrl(endpoint);
            var headers = authHeaders.data || {};

            // Merge custom headers
            if (options && options.headers) {
                for (var key in options.headers) {
                    if (options.headers.hasOwnProperty(key)) {
                        headers[key] = options.headers[key];
                    }
                }
            }

            return connection.post(url, data, {headers: headers});

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'post');
        }
    }

    /**
     * Makes an HTTP PUT request
     * @param {String} endpoint - API endpoint
     * @param {Object} data - Request payload
     * @param {Object} options - Request options
     * @returns {Object} Response
     */
    function put(endpoint, data, options) {
        try {
            var validation = validateConfig();
            if (validation) {
                return validation;
            }

            var authHeaders = getAuthHeaders();
            if (!authHeaders.success) {
                return authHeaders;
            }

            var url = buildUrl(endpoint);
            var headers = authHeaders.data || {};

            if (options && options.headers) {
                for (var key in options.headers) {
                    if (options.headers.hasOwnProperty(key)) {
                        headers[key] = options.headers[key];
                    }
                }
            }

            return connection.put(url, data, {headers: headers});

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'put');
        }
    }

    /**
     * Makes an HTTP DELETE request
     * @param {String} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Object} Response
     */
    function remove(endpoint, options) {
        try {
            var validation = validateConfig();
            if (validation) {
                return validation;
            }

            var authHeaders = getAuthHeaders();
            if (!authHeaders.success) {
                return authHeaders;
            }

            var url = buildUrl(endpoint);
            var headers = authHeaders.data || {};

            if (options && options.headers) {
                for (var key in options.headers) {
                    if (options.headers.hasOwnProperty(key)) {
                        headers[key] = options.headers[key];
                    }
                }
            }

            return connection.delete(url, {headers: headers});

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'remove');
        }
    }

    /**
     * Sets authentication strategy
     * @param {Object} authStrategyInstance - Auth strategy instance
     */
    function setAuthStrategy(authStrategyInstance) {
        auth = authStrategyInstance;
    }

    /**
     * Gets current configuration
     * @returns {Object} Current config
     */
    function getConfig() {
        return config;
    }

    /**
     * Updates configuration
     * @param {Object} newConfig - New configuration
     */
    function setConfig(newConfig) {
        config = newConfig;
    }

    // Public API
    this.handler = handler;
    this.response = response;
    this.connection = connection;
    this.config = config;
    this.auth = auth;

    this.validateConfig = validateConfig;
    this.getAuthHeaders = getAuthHeaders;
    this.buildUrl = buildUrl;
    this.get = get;
    this.post = post;
    this.put = put;
    this.remove = remove;
    this.setAuthStrategy = setAuthStrategy;
    this.getConfig = getConfig;
    this.setConfig = setConfig;
}

</script>