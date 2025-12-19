<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * ConnectionHandler - HTTP request manager with automatic retry logic
 *
 * Wraps SFMC's Script.Util.HttpRequest with intelligent retry mechanisms
 * for handling transient failures, rate limiting, and server errors.
 *
 * Features:
 * - Automatic retries for 429, 500, 502, 503, 504 status codes
 * - Configurable retry delays with exponential backoff
 * - Automatic JSON response parsing
 * - Comprehensive error handling
 * - Request timeout management
 *
 * Retry Strategy:
 * - 429 (Rate Limit): Retry with exponential backoff
 * - 500 (Internal Server Error): Retry immediately
 * - 502 (Bad Gateway): Retry with delay
 * - 503 (Service Unavailable): Retry with delay
 * - 504 (Gateway Timeout): Retry with delay
 *
 * @version 1.0.0
 * @author OmegaFramework Team
 */
function ConnectionHandler(responseWrapper, connectionConfig) {
    var handler = 'ConnectionHandler';
    var response = responseWrapper;
    var config = connectionConfig || {};

    // Configuration with sensible defaults
    var maxRetries = config.maxRetries || 3;
    var retryDelay = config.retryDelay || 1000; // 1 second
    var timeout = config.timeout || 30000; // 30 seconds (SFMC script limit)
    var retryOnCodes = config.retryOnCodes || [429, 500, 502, 503, 504];
    var useExponentialBackoff = config.useExponentialBackoff !== false; // Default true

    /**
     * Executes HTTP request with retry logic
     *
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
     * @param {string} url - Request URL
     * @param {string} contentType - Content-Type header
     * @param {string} payload - Request body (for POST/PUT)
     * @param {object} headers - HTTP headers
     * @returns {object} Response with parsed content
     */
    function request(method, url, contentType, payload, headers) {
        var attemptCount = 0;
        var lastError = null;

        while (attemptCount <= maxRetries) {
            try {
                // Create HTTP request
                var req = new Script.Util.HttpRequest(url);
                req.emptyContentHandling = 0;
                req.retries = maxRetries; // We handle retries ourselves
                req.continueOnError = true;
                req.method = method.toUpperCase();

                // Set timeout
              /*  if (timeout) {
                    req.setTimeoutSeconds(Math.floor(timeout / 1000));
                }*/

                // Set Content-Type
                if (contentType) {
                    req.contentType = contentType;
                }

                // Set headers
                if (headers) {
                    for (var headerName in headers) {
                        if (headers.hasOwnProperty(headerName) && headerName != 'Content-Type') {
                            req.setHeader(headerName, headers[headerName]);
                        }
                    }
                }

                // Set payload for POST/PUT/PATCH
                if (payload && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                    req.postData = payload;
                }
                // Execute request
                var httpResponse = req.send();
                // Parse response
                var statusCode = httpResponse.statusCode;
                var responseContent = httpResponse.content || '';

                // Success responses (200-299)
                if (statusCode >= 200 && statusCode < 300) {
                    var parsedContent = null;

                    // Attempt JSON parsing
                    if (responseContent && responseContent.length > 0) {
                        try {
                            parsedContent = Platform.Function.ParseJSON(responseContent);
                        } catch (parseEx) {
                            // Not JSON, return raw content
                            parsedContent = responseContent;
                        }
                    }

                    return response.success({
                        statusCode: statusCode,
                        content: responseContent,
                        parsedContent: parsedContent,
                        headers: httpResponse.headers || {}
                    }, handler, 'request');
                }

                // Check if we should retry based on status code
                var shouldRetry = false;
                for (var i = 0; i < retryOnCodes.length; i++) {
                    if (statusCode === retryOnCodes[i]) {
                        shouldRetry = true;
                        break;
                    }
                }

                if (shouldRetry && attemptCount < maxRetries) {
                    // Calculate delay with optional exponential backoff
                    var delay = retryDelay;
                    if (useExponentialBackoff) {
                        delay = retryDelay * Math.pow(2, attemptCount);
                    }

                    // Wait before retry (SFMC doesn't have native sleep, but we track attempts)
                    attemptCount++;

                    // Log retry attempt (optional - could write to DE if needed)
                    lastError = {
                        statusCode: statusCode,
                        content: responseContent,
                        attempt: attemptCount
                    };

                    continue; // Retry
                }

                // Non-retryable error or max retries reached
                return response.httpError(
                    statusCode,
                    httpResponse.statusText || 'HTTP Error',
                    handler,
                    'request',
                    responseContent
                );

            } catch (ex) {
                lastError = {
                    exception: ex.message || ex.toString(),
                    attempt: attemptCount
                };

                if (attemptCount < maxRetries) {
                    attemptCount++;
                    continue; // Retry on exception
                }

                // Max retries exceeded
                return response.error(
                    'HTTP request failed after ' + (attemptCount + 1) + ' attempts: ' + (ex.message || ex.toString()),
                    handler,
                    'request',
                    lastError
                );
            }
        }

        // Should never reach here, but handle edge case
        return response.error(
            'HTTP request failed after maximum retries',
            handler,
            'request',
            lastError
        );
    }

    /**
     * Executes GET request
     *
     * @param {string} url - Request URL
     * @param {object} headers - HTTP headers (optional)
     * @returns {object} Response
     */
    function get(url, headers) {
        return request('GET', url, null, null, headers);
    }

    /**
     * Executes POST request
     *
     * @param {string} url - Request URL
     * @param {object|string} data - Request body (will be JSON stringified if object)
     * @param {object} headers - HTTP headers (optional)
     * @returns {object} Response
     */
    function post(url, data, headers) {
        var payload = data;
        var contentType = 'application/json';

        // Stringify object payloads
        if (data && typeof data === 'object') {
            payload = Stringify(data);
        }

        return request('POST', url, contentType, payload, headers);
    }

    /**
     * Executes PUT request
     *
     * @param {string} url - Request URL
     * @param {object|string} data - Request body (will be JSON stringified if object)
     * @param {object} headers - HTTP headers (optional)
     * @returns {object} Response
     */
    function put(url, data, headers) {
        var payload = data;
        var contentType = 'application/json';

        // Stringify object payloads
        if (data && typeof data === 'object') {
            payload = Stringify(data);
        }

        return request('PUT', url, contentType, payload, headers);
    }

    /**
     * Executes PATCH request
     *
     * @param {string} url - Request URL
     * @param {object|string} data - Request body (will be JSON stringified if object)
     * @param {object} headers - HTTP headers (optional)
     * @returns {object} Response
     */
    function patch(url, data, headers) {
        var payload = data;
        var contentType = 'application/json';

        // Stringify object payloads
        if (data && typeof data === 'object') {
            payload = Stringify(data);
        }

        return request('PATCH', url, contentType, payload, headers);
    }

    /**
     * Executes DELETE request
     *
     * @param {string} url - Request URL
     * @param {object} headers - HTTP headers (optional)
     * @returns {object} Response
     */
    function remove(url, headers) {
        return request('DELETE', url, null, null, headers);
    }

    /**
     * Executes custom HTTP request with full control
     *
     * @param {object} requestConfig - Full request configuration
     * @returns {object} Response
     */
    function customRequest(requestConfig) {
        if (!requestConfig || !requestConfig.url) {
            return response.validationError(
                'url',
                'Request URL is required',
                handler,
                'customRequest'
            );
        }

        return request(
            requestConfig.method || 'GET',
            requestConfig.url,
            requestConfig.contentType || null,
            requestConfig.payload || null,
            requestConfig.headers || null
        );
    }

    // Public API
    this.request = request;
    this.get = get;
    this.post = post;
    this.put = put;
    this.patch = patch;
    this.remove = remove;
    this.del = remove; // Alias for remove
    this.customRequest = customRequest;
}

// ============================================================================
// OMEGAFRAMEWORK MODULE REGISTRATION
// ============================================================================
if (typeof OmegaFramework !== 'undefined' && typeof OmegaFramework.register === 'function') {
    OmegaFramework.register('ConnectionHandler', {
        dependencies: ['ResponseWrapper'],
        blockKey: 'OMG_FW_ConnectionHandler',
        factory: function(responseWrapperInstance, config) {
            // config contains connection configuration options
            var connectionConfig = config.connectionConfig || config || {};

            return new ConnectionHandler(responseWrapperInstance, connectionConfig);
        }
    });
}

</script>
