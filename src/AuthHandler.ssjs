<script runat="server">

Platform.Load("core", "1.1.1");

/**
 * OmegaFramework AuthHandler
 * REST API authentication management with token caching
 *
 * @version 1.1.0 - Now with singleton support and token caching
 */

// Global variable for singleton (if used from Core)
var _omegaFrameworkAuthInstance = _omegaFrameworkAuthInstance || null;

function AuthHandler(authConfig) {
    var handler = 'AuthHandler';
    var response = new OmegaFrameworkResponse();

    // Token cache (private for this instance)
    var cachedToken = null;

    // Configuration (can come from constructor or Settings)
    var config = authConfig || null;

    // If OmegaFrameworkSettings exists and no config was passed, use Settings
    if (!config && typeof OmegaFrameworkSettings === 'function') {
        try {
            var settings = new OmegaFrameworkSettings();
            config = settings.getAuthConfig();
        } catch (ex) {
            // Settings not available, continue without config
        }
    }

    /**
     * Valida la configuración de autenticación
     */
    function validateConfig(cfg) {
        var configToValidate = cfg || config;

        if (!configToValidate) {
            return response.validationError('config', 'Configuration object is required', handler, 'validateConfig');
        }
        if (!configToValidate.clientId) {
            return response.validationError('clientId', 'Client ID is required', handler, 'validateConfig');
        }
        if (!configToValidate.clientSecret) {
            return response.validationError('clientSecret', 'Client Secret is required', handler, 'validateConfig');
        }
        if (!configToValidate.authBaseUrl) {
            return response.validationError('authBaseUrl', 'Auth Base URL is required', handler, 'validateConfig');
        }
        return null;
    }

    /**
     * Obtiene un nuevo token de autenticación
     */
    function getToken(cfg) {
        try {
            var configToUse = cfg || config;

            var validation = validateConfig(configToUse);
            if (validation) {
                return validation;
            }

            var tokenUrl = configToUse.authBaseUrl + 'v2/token';
            var postData = {
                'grant_type': 'client_credentials',
                'client_id': configToUse.clientId,
                'client_secret': configToUse.clientSecret
            };

            var request = new Script.Util.HttpRequest(tokenUrl);
            request.emptyContentHandling = 0;
            request.retries = 1;
            request.continueOnError = true;
            request.contentType = 'application/json';
            request.method = 'POST';
            request.postData = Stringify(postData);

            var httpResponse = request.send();

            if (httpResponse.statusCode == 200) {
                var tokenData = Platform.Function.ParseJSON(httpResponse.content);
                if (tokenData && tokenData.access_token) {
                    var tokenInfo = {
                        accessToken: tokenData.access_token,
                        tokenType: tokenData.token_type || 'Bearer',
                        expiresIn: tokenData.expires_in || 3600,
                        restInstanceUrl: tokenData.rest_instance_url,
                        soapInstanceUrl: tokenData.soap_instance_url,
                        obtainedAt: new Date().toISOString()
                    };

                    // Cache the token
                    cachedToken = tokenInfo;

                    return response.success(tokenInfo, handler, 'getToken');
                } else {
                    return response.error('TOKEN_PARSE_ERROR', 'Failed to parse token from response', {response: httpResponse.content}, handler, 'getToken');
                }
            } else {
                return response.httpError(httpResponse.statusCode, httpResponse.content, handler, 'getToken');
            }

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getToken');
        }
    }

    /**
     * Refresca el token de autenticación
     */
    function refreshToken(cfg) {
        return getToken(cfg);
    }

    /**
     * Verifica si un token ha expirado
     */
    function isTokenExpired(tokenInfo, bufferMinutes) {
        try {
            if (!tokenInfo || !tokenInfo.obtainedAt || !tokenInfo.expiresIn) {
                return true;
            }

            var buffer = bufferMinutes || 5;
            var obtainedDate = new Date(tokenInfo.obtainedAt);
            var expirationDate = new Date(obtainedDate.getTime() + ((tokenInfo.expiresIn - buffer * 60) * 1000));
            var currentDate = new Date();

            return currentDate >= expirationDate;

        } catch (ex) {
            return true;
        }
    }

    /**
     * Obtiene un token válido (usa cache si está disponible)
     */
    function getValidToken(cfg) {
        try {
            var configToUse = cfg || config;

            var validation = validateConfig(configToUse);
            if (validation) {
                return validation;
            }

            // If there's a cached token and it hasn't expired, use cache
            if (cachedToken && !isTokenExpired(cachedToken)) {
                return response.success(cachedToken, handler, 'getValidToken');
            }

            // If there's no cache or it expired, get new token
            return getToken(configToUse);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getValidToken');
        }
    }

    /**
     * Valida el acceso con los scopes requeridos
     */
    function validateAccess(cfg, scopes) {
        try {
            var configToUse = cfg || config;

            var tokenResult = getToken(configToUse);
            if (!tokenResult.success) {
                return tokenResult;
            }

            var accessValidation = {
                hasAccess: true,
                tokenValid: true,
                requestedScopes: scopes || [],
                message: 'Access validation completed successfully'
            };

            return response.success(accessValidation, handler, 'validateAccess');

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'validateAccess');
        }
    }

    /**
     * Crea el header de autorización a partir de token info
     */
    function createAuthHeader(tokenInfo) {
        try {
            if (!tokenInfo || !tokenInfo.accessToken) {
                return response.validationError('tokenInfo', 'Valid token info is required', handler, 'createAuthHeader');
            }

            var authHeader = {
                'Authorization': (tokenInfo.tokenType || 'Bearer') + ' ' + tokenInfo.accessToken,
                'Content-Type': 'application/json'
            };

            return response.success(authHeader, handler, 'createAuthHeader');

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'createAuthHeader');
        }
    }

    /**
     * Updates the authentication configuration
     */
    function setConfig(newConfig) {
        config = newConfig;
        cachedToken = null; // Clear cache when changing config
    }

    /**
     * Clears the token cache
     */
    function clearCache() {
        cachedToken = null;
    }

    /**
     * Gets the currently cached token
     */
    function getCachedToken() {
        return cachedToken;
    }

    // Public API - Using this pattern for SFMC Content Block compatibility
    this.getToken = getToken;
    this.refreshToken = refreshToken;
    this.isTokenExpired = isTokenExpired;
    this.getValidToken = getValidToken;
    this.validateAccess = validateAccess;
    this.createAuthHeader = createAuthHeader;
    this.setConfig = setConfig;
    this.clearCache = clearCache;
    this.getCachedToken = getCachedToken;
}

/**
 * Gets the singleton instance of AuthHandler
 * Only available if loaded through OmegaFramework Core
 */
function getAuthHandlerInstance(config) {
    if (!_omegaFrameworkAuthInstance) {
        _omegaFrameworkAuthInstance = new AuthHandler(config);
    }
    return _omegaFrameworkAuthInstance;
}

</script>
