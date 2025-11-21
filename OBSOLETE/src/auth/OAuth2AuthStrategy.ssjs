<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * OAuth2AuthStrategy - OAuth 2.0 authentication strategy
 *
 * Handles OAuth2 client credentials flow for external platforms
 * Supports token caching and automatic refresh
 *
 * @version 1.0.0
 */

function OAuth2AuthStrategy(oauth2Config, connectionInstance) {
    var handler = 'OAuth2AuthStrategy';
    var response = new OmegaFrameworkResponse();
    var connection = connectionInstance || new ConnectionHandler();

    // Configuration
    var config = oauth2Config || {};

    // Token cache
    var cachedToken = null;

    /**
     * Validates OAuth2 configuration
     * @returns {Object|null} Error or null if valid
     */
    function validateConfig() {
        if (!config.tokenUrl) {
            return response.validationError('tokenUrl', 'OAuth2 token URL is required', handler, 'validateConfig');
        }
        if (!config.clientId) {
            return response.validationError('clientId', 'OAuth2 client ID is required', handler, 'validateConfig');
        }
        if (!config.clientSecret) {
            return response.validationError('clientSecret', 'OAuth2 client secret is required', handler, 'validateConfig');
        }
        return null;
    }

    /**
     * Checks if token is expired
     * @param {Object} tokenInfo - Token information
     * @returns {Boolean} True if expired
     */
    function isTokenExpired(tokenInfo) {
        try {
            if (!tokenInfo || !tokenInfo.obtainedAt || !tokenInfo.expiresIn) {
                return true;
            }

            var buffer = config.tokenRefreshBuffer || 300000; // 5 minutes default
            var obtainedDate = new Date(tokenInfo.obtainedAt);
            var expirationDate = new Date(obtainedDate.getTime() + (tokenInfo.expiresIn * 1000) - buffer);
            var currentDate = new Date();

            return currentDate >= expirationDate;

        } catch (ex) {
            return true;
        }
    }

    /**
     * Gets OAuth2 token from provider
     * @returns {Object} Token response
     */
    function getToken() {
        try {
            var validation = validateConfig();
            if (validation) {
                return validation;
            }

            var tokenUrl = config.tokenUrl;
            var postData = {
                grant_type: config.grantType || 'client_credentials',
                client_id: config.clientId,
                client_secret: config.clientSecret
            };

            // Add scope if provided
            if (config.scope) {
                postData.scope = config.scope;
            }

            // Add custom parameters if provided
            if (config.additionalParams) {
                for (var key in config.additionalParams) {
                    if (config.additionalParams.hasOwnProperty(key)) {
                        postData[key] = config.additionalParams[key];
                    }
                }
            }

            var httpResult = connection.post(tokenUrl, postData);

            if (!httpResult.success) {
                return httpResult;
            }

            var tokenData = httpResult.data.parsedContent || Platform.Function.ParseJSON(httpResult.data.content);

            if (tokenData && tokenData.access_token) {
                var tokenInfo = {
                    accessToken: tokenData.access_token,
                    tokenType: tokenData.token_type || 'Bearer',
                    expiresIn: tokenData.expires_in || 3600,
                    scope: tokenData.scope || config.scope,
                    obtainedAt: new Date().getTime()
                };

                // Cache the token
                cachedToken = tokenInfo;

                return response.success(tokenInfo, handler, 'getToken');
            } else {
                return response.error('TOKEN_PARSE_ERROR', 'Failed to parse token from response', {response: httpResult.data.content}, handler, 'getToken');
            }

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getToken');
        }
    }

    /**
     * Gets valid token (uses cache if available)
     * @returns {Object} Token response
     */
    function getValidToken() {
        try {
            // If there's a cached token and it hasn't expired, use cache
            if (cachedToken && !isTokenExpired(cachedToken)) {
                return response.success(cachedToken, handler, 'getValidToken');
            }

            // Get new token
            return getToken();

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getValidToken');
        }
    }

    /**
     * Gets authorization headers
     * @returns {Object} Headers response
     */
    function getHeaders() {
        try {
            var tokenResult = getValidToken();

            if (!tokenResult.success) {
                return tokenResult;
            }

            var headers = {
                'Authorization': (tokenResult.data.tokenType || 'Bearer') + ' ' + tokenResult.data.accessToken,
                'Content-Type': 'application/json'
            };

            return response.success(headers, handler, 'getHeaders');

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getHeaders');
        }
    }

    /**
     * Clears token cache
     */
    function clearCache() {
        cachedToken = null;
    }

    // Public API
    this.getToken = getToken;
    this.getValidToken = getValidToken;
    this.getHeaders = getHeaders;
    this.clearCache = clearCache;
    this.isTokenExpired = isTokenExpired;
}

</script>