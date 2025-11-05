<script runat="server">

Platform.Load("core", "1.1.1");

/**
 * OmegaFramework ConnectionHandler
 * HTTP Connection handler con retry logic inteligente
 *
 * @version 1.1.0 - Ahora con soporte singleton y configuración desde Settings
 */

// Variable global para singleton (si se usa desde Core)
var _omegaFrameworkConnectionInstance = _omegaFrameworkConnectionInstance || null;

function ConnectionHandler(connectionConfig) {
    var handler = 'ConnectionHandler';
    var response = new OmegaFrameworkResponse();

    // Configuración por defecto
    var defaultConfig = {
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 5000,
        retryOnCodes: [429, 500, 502, 503, 504],
        continueOnError: true
    };

    // Configuración actual
    var config = connectionConfig || {};

    // Si existe OmegaFrameworkSettings y no se pasó config, usar Settings
    if (typeof OmegaFrameworkSettings === 'function') {
        try {
            var settings = new OmegaFrameworkSettings();
            var settingsConfig = settings.getConnectionConfig();
            config = mergeConfig(defaultConfig, settingsConfig);
        } catch (ex) {
            // Settings no disponible, usar defaults
            config = defaultConfig;
        }
    } else {
        config = mergeConfig(defaultConfig, config);
    }

    /**
     * Hace merge de configuración
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
     * Valida la configuración de la petición
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
     * Determina si un status code debe ser reintentado
     */
    function shouldRetry(statusCode) {
        var retryableStatusCodes = config.retryOnCodes || [429, 500, 502, 503, 504];
        return retryableStatusCodes.indexOf(statusCode) !== -1;
    }

    /**
     * Ejecuta una petición HTTP con retry logic
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
                        // Busy wait para delay
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
     * Petición GET
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
     * Petición POST
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
     * Petición PUT
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
     * Petición DELETE
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
     * Petición personalizada
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
     * Actualiza la configuración
     */
    function setConfig(newConfig) {
        config = mergeConfig(config, newConfig);
    }

    /**
     * Obtiene la configuración actual
     */
    function getConfig() {
        return config;
    }

    // API pública
    return {
        get: get,
        post: post,
        put: put,
        delete: del,
        request: request,
        setConfig: setConfig,
        getConfig: getConfig
    };
}

/**
 * Obtiene la instancia singleton de ConnectionHandler
 * Solo disponible si se carga a través de OmegaFramework Core
 */
function getConnectionHandlerInstance(config) {
    if (!_omegaFrameworkConnectionInstance) {
        _omegaFrameworkConnectionInstance = new ConnectionHandler(config);
    }
    return _omegaFrameworkConnectionInstance;
}

</script>
