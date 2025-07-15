<script runat="server">

Platform.Load("core", "1.1.1");

function ConnectionHandler() {
    var handler = 'ConnectionHandler';
    var response = new MiniFrameworkResponse();
    
    function validateRequestConfig(config) {
        if (!config) {
            return response.validationError('config', 'Request configuration is required', handler, 'validateRequestConfig');
        }
        if (!config.url) {
            return response.validationError('url', 'URL is required', handler, 'validateRequestConfig');
        }
        if (config.method && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].indexOf(config.method.toUpperCase()) === -1) {
            return response.validationError('method', 'Invalid HTTP method', handler, 'validateRequestConfig');
        }
        return null;
    }
    
    function executeRequest(config, attempt) {
        try {
            var currentAttempt = attempt || 1;
            var maxRetries = config.maxRetries || 3;
            var retryDelay = config.retryDelay || 1000;
            
            var request = new Script.Util.HttpRequest(config.url);
            request.emptyContentHandling = 0;
            request.continueOnError = true;
            request.method = (config.method || 'GET').toUpperCase();
            
            if (config.contentType) {
                request.contentType = config.contentType;
            }
            
            if (config.encoding) {
                request.encoding = config.encoding;
            }
            
            if (config.headers) {
                for (var headerName in config.headers) {
                    if (config.headers.hasOwnProperty(headerName)) {
                        request.setHeader(headerName, config.headers[headerName]);
                    }
                }
            }
            
            if (config.postData && (config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH')) {
                if (typeof config.postData === 'object') {
                    request.postData = Stringify(config.postData);
                } else {
                    request.postData = config.postData;
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
                
                if (config.parseJSON && httpResponse.content) {
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
                    }
                }
                
                return executeRequest(config, currentAttempt + 1);
                
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
            if (attempt < (config.maxRetries || 3)) {
                return executeRequest(config, (attempt || 1) + 1);
            }
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex, attempt: attempt}, handler, 'executeRequest');
        }
    }
    
    function shouldRetry(statusCode) {
        var retryableStatusCodes = [429, 500, 502, 503, 504];
        return retryableStatusCodes.indexOf(statusCode) !== -1;
    }
    
    function get(url, headers, options) {
        try {
            var config = {
                url: url,
                method: 'GET',
                headers: headers || {},
                parseJSON: true
            };
            
            if (options) {
                for (var key in options) {
                    if (options.hasOwnProperty(key)) {
                        config[key] = options[key];
                    }
                }
            }
            
            var validation = validateRequestConfig(config);
            if (validation) {
                return validation;
            }
            
            return executeRequest(config);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'get');
        }
    }
    
    function post(url, data, headers, options) {
        try {
            var config = {
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
                        config[key] = options[key];
                    }
                }
            }
            
            var validation = validateRequestConfig(config);
            if (validation) {
                return validation;
            }
            
            return executeRequest(config);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'post');
        }
    }
    
    function put(url, data, headers, options) {
        try {
            var config = {
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
                        config[key] = options[key];
                    }
                }
            }
            
            var validation = validateRequestConfig(config);
            if (validation) {
                return validation;
            }
            
            return executeRequest(config);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'put');
        }
    }
    
    function del(url, headers, options) {
        try {
            var config = {
                url: url,
                method: 'DELETE',
                headers: headers || {},
                parseJSON: true
            };
            
            if (options) {
                for (var key in options) {
                    if (options.hasOwnProperty(key)) {
                        config[key] = options[key];
                    }
                }
            }
            
            var validation = validateRequestConfig(config);
            if (validation) {
                return validation;
            }
            
            return executeRequest(config);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'del');
        }
    }
    
    function request(config) {
        try {
            var validation = validateRequestConfig(config);
            if (validation) {
                return validation;
            }
            
            return executeRequest(config);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'request');
        }
    }
    
    return {
        get: get,
        post: post,
        put: put,
        delete: del,
        request: request
    };
}

</script>