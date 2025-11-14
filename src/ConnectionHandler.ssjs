<script runat="server">

Platform.Load("core", "1.1.1");

/**
 * OmegaFramework ConnectionHandler
 * HTTP Connection handler with intelligent retry logic
 *
 * @version 1.1.0 - Now with singleton support and configuration from Settings
 */

// Global variable for singleton (if used from Core)
var _omegaFrameworkConnectionInstance = _omegaFrameworkConnectionInstance || null;

function ConnectionHandler(connectionConfig) {
    var handler = 'ConnectionHandler';
    var response = new OmegaFrameworkResponse();

    // Default configuration
    var defaultConfig = {
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 5000,
        retryOnCodes: [429, 500, 502, 503, 504],
        continueOnError: true
    };

    // Current configuration
    var config = connectionConfig || {};

    // If OmegaFrameworkSettings exists and no config was passed, use Settings
    if (typeof OmegaFrameworkSettings === 'function') {
        try {
            var settings = new OmegaFrameworkSettings();
            var settingsConfig = settings.getConnectionConfig();
            config = mergeConfig(defaultConfig, settingsConfig);
        } catch (ex) {
            // Settings not available, use defaults
            config = defaultConfig;
        }
    } else {
        config = mergeConfig(defaultConfig, config);
    }

    /**
     * Merges configuration
     */
    function mergeConfig(target, source) {
        var result = {};
        for (var key in target) {
            if (target.hasOwnProperty(key)) {
                result[key] = target[key];
            }
        }
        for (var key in source) {
            if (source.hasOwnProperty(key) && source[key] !== null && source[key] !== undefined) {
                result[key] = source[key];
            }
        }
        return result;
    }

    /**
     * Validates the request configuration
     */
    function validateRequestConfig(reqConfig) {
        if (!reqConfig) {
            return response.validationError('config', 'Request configuration is required', handler, 'validateRequestConfig');
        }
        if (!reqConfig.url) {
            return response.validationError('url', 'URL is required', handler, 'validateRequestConfig');
        }
        if (reqConfig.method && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].indexOf(reqConfig.method.toUpperCase()) === -1) {
            return response.validationError('method', 'Invalid HTTP method', handler, 'validateRequestConfig');
        }
        return null;
    }

    /**
     * Determines if a status code should be retried
     */
    function shouldRetry(statusCode) {
        var retryableStatusCodes = config.retryOnCodes || [429, 500, 502, 503, 504];
        return retryableStatusCodes.indexOf(statusCode) !== -1;
    }

    /**
     * Executes an HTTP request with retry logic
     */
    function executeRequest(reqConfig, attempt) {
        try {
            var currentAttempt = attempt || 1;
            var maxRetries = reqConfig.maxRetries !== undefined ? reqConfig.maxRetries : config.maxRetries;
            var retryDelay = reqConfig.retryDelay !== undefined ? reqConfig.retryDelay : config.retryDelay;

            var request = new Script.Util.HttpRequest(reqConfig.url);
            request.emptyContentHandling = 0;
            request.continueOnError = config.continueOnError;
            request.method = (reqConfig.method || 'GET').toUpperCase();

            if (reqConfig.contentType) {
                request.contentType = reqConfig.contentType;
            }

            if (reqConfig.encoding) {
                request.encoding = reqConfig.encoding;
            }

            if (reqConfig.headers) {
                for (var headerName in reqConfig.headers) {
                    if (reqConfig.headers.hasOwnProperty(headerName)) {
                        request.setHeader(headerName, reqConfig.headers[headerName]);
                    }
                }
            }

            if (reqConfig.postData && (reqConfig.method === 'POST' || reqConfig.method === 'PUT' || reqConfig.method === 'PATCH')) {
                if (typeof reqConfig.postData === 'object') {
                    request.postData = Stringify(reqConfig.postData);
                } else {
                    request.postData = reqConfig.postData;
                }
            }

            var httpResponse = request.send();

            if (httpResponse.statusCode >= 200 && httpResponse.statusCode < 300) {
                var responseData = {
                    statusCode: httpResponse.statusCode,
                    content: httpResponse.content,
                    headers: httpResponse.headers || {},
                    attempt: currentAttempt
                };

                if (reqConfig.parseJSON && httpResponse.content) {
                    try {
                        responseData.parsedContent = Platform.Function.ParseJSON(httpResponse.content);
                    } catch (parseEx) {
                        responseData.parseError = parseEx.message;
                    }
                }

                return response.success(responseData, handler, 'executeRequest');

            } else if (shouldRetry(httpResponse.statusCode) && currentAttempt < maxRetries) {

                if (retryDelay > 0) {
                    var startTime = new Date().getTime();
                    while (new Date().getTime() - startTime < retryDelay) {
                        // Busy wait for delay
                    }
                }

                return executeRequest(reqConfig, currentAttempt + 1);

            } else {
                var errorDetails = {
                    statusCode: httpResponse.statusCode,
                    responseText: httpResponse.content,
                    attempt: currentAttempt,
                    maxRetries: maxRetries
                };
                return response.httpError(httpResponse.statusCode, httpResponse.content, handler, 'executeRequest');
            }

        } catch (ex) {
            if (attempt < (reqConfig.maxRetries || config.maxRetries)) {
                return executeRequest(reqConfig, (attempt || 1) + 1);
            }
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex, attempt: attempt}, handler, 'executeRequest');
        }
    }

    /**
     * GET request
     */
    function get(url, headers, options) {
        try {
            var reqConfig = {
                url: url,
                method: 'GET',
                headers: headers || {},
                parseJSON: true
            };

            if (options) {
                for (var key in options) {
                    if (options.hasOwnProperty(key)) {
                        reqConfig[key] = options[key];
                    }
                }
            }

            var validation = validateRequestConfig(reqConfig);
            if (validation) {
                return validation;
            }

            return executeRequest(reqConfig);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'get');
        }
    }

    /**
     * POST request
     */
    function post(url, data, headers, options) {
        try {
            var reqConfig = {
                url: url,
                method: 'POST',
                postData: data,
                headers: headers || {},
                contentType: 'application/json',
                parseJSON: true
            };

            if (options) {
                for (var key in options) {
                    if (options.hasOwnProperty(key)) {
                        reqConfig[key] = options[key];
                    }
                }
            }

            var validation = validateRequestConfig(reqConfig);
            if (validation) {
                return validation;
            }

            return executeRequest(reqConfig);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'post');
        }
    }

    /**
     * PUT request
     */
    function put(url, data, headers, options) {
        try {
            var reqConfig = {
                url: url,
                method: 'PUT',
                postData: data,
                headers: headers || {},
                contentType: 'application/json',
                parseJSON: true
            };

            if (options) {
                for (var key in options) {
                    if (options.hasOwnProperty(key)) {
                        reqConfig[key] = options[key];
                    }
                }
            }

            var validation = validateRequestConfig(reqConfig);
            if (validation) {
                return validation;
            }

            return executeRequest(reqConfig);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'put');
        }
    }

    /**
     * DELETE request
     */
    function del(url, headers, options) {
        try {
            var reqConfig = {
                url: url,
                method: 'DELETE',
                headers: headers || {},
                parseJSON: true
            };

            if (options) {
                for (var key in options) {
                    if (options.hasOwnProperty(key)) {
                        reqConfig[key] = options[key];
                    }
                }
            }

            var validation = validateRequestConfig(reqConfig);
            if (validation) {
                return validation;
            }

            return executeRequest(reqConfig);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'del');
        }
    }

    /**
     * Custom request
     */
    function request(reqConfig) {
        try {
            var validation = validateRequestConfig(reqConfig);
            if (validation) {
                return validation;
            }

            return executeRequest(reqConfig);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'request');
        }
    }

    /**
     * Updates the configuration
     */
    function setConfig(newConfig) {
        config = mergeConfig(config, newConfig);
    }

    /**
     * Gets the current configuration
     */
    function getConfig() {
        return config;
    }

    // Public API - Using this pattern for SFMC Content Block compatibility
    this.get = get;
    this.post = post;
    this.put = put;
    this.delete = del;
    this.request = request;
    this.setConfig = setConfig;
    this.getConfig = getConfig;
}

/**
 * Gets the singleton instance of ConnectionHandler
 * Only available if loaded through OmegaFramework Core
 */
function getConnectionHandlerInstance(config) {
    if (!_omegaFrameworkConnectionInstance) {
        _omegaFrameworkConnectionInstance = new ConnectionHandler(config);
    }
    return _omegaFrameworkConnectionInstance;
}

</script>
