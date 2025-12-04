<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * OAuth2AuthStrategy - OAuth2 authentication with credential management and token caching
 *
 * Implements OAuth2 client credentials and password grant types with:
 * - Encrypted credential storage via CredentialStore
 * - Persistent token caching via DataExtensionTokenCache
 * - Token sharing across multiple script executions
 *
 * Supported Grant Types:
 * - client_credentials: For service-to-service authentication
 * - password: For username/password authentication (Salesforce, Veeva CRM)
 *
 * Usage Option 1 - With CredentialStore (Recommended):
 * var auth = new OAuth2AuthStrategy('MyIntegrationName');
 * var token = auth.getToken();
 *
 * Usage Option 2 - With Manual Config:
 * var auth = new OAuth2AuthStrategy({
 *   tokenUrl: 'https://auth.example.com/oauth/token',
 *   clientId: 'client123',
 *   clientSecret: 'secret456',
 *   grantType: 'client_credentials',
 *   scope: 'read write'
 * });
 *
 * @version 3.0.0
 * @author OmegaFramework
 */
function OAuth2AuthStrategy(responseWrapper, connectionHandler, credentialStore, tokenCacheConstructor, configOrIntegrationName) {
    var handler = 'OAuth2AuthStrategy';
    var response = responseWrapper;
    var config = {};
    var integrationName = null;
    var tokenCache = null;

    // Dependencies
    var connection = connectionHandler;

    // Determine if using CredentialStore or manual config
    if (typeof configOrIntegrationName === 'string') {
        // Option 1: Integration name (use CredentialStore)
        integrationName = configOrIntegrationName;

        // Use injected CredentialStore
        var credResult = credentialStore.getCredentials();

        if (!credResult.success) {
            throw new Error('Failed to load credentials for integration: ' + integrationName + '. Error: ' + credResult.error);
        }

        var creds = credResult.data;

        // Validate auth type
        if (creds.authType !== 'OAuth2') {
            throw new Error('Integration "' + integrationName + '" is not configured for OAuth2. Auth type: ' + creds.authType);
        }

        // Build config from credentials
        config = {
            tokenUrl: creds.tokenEndpoint,
            clientId: creds.clientId,
            clientSecret: creds.clientSecret,
            grantType: creds.grantType || 'client_credentials',
            scope: creds.scope || null,
            baseUrl: creds.baseUrl || null,
            authUrl: creds.authUrl || null
        };

    } else {
        // Option 2: Manual config object
        config = configOrIntegrationName || {};
    }

    // Generate cache key for this integration
    var cacheKey = integrationName || config.cacheKey || config.clientId || config.username || 'default';

    // Initialize token cache with the cache key using the injected constructor
    tokenCache = tokenCacheConstructor(cacheKey, {
        refreshBuffer: config.refreshBuffer || 300000 // 5 minutes default
    });

    /**
     * Validates OAuth2 configuration
     *
     * @returns {object|null} Error response if invalid, null if valid
     */
    function validateConfig() {
        if (!config.tokenUrl) {
            return response.validationError(
                'tokenUrl',
                'OAuth2 token URL is required',
                handler,
                'validateConfig'
            );
        }

        if (!config.clientId) {
            return response.validationError(
                'clientId',
                'OAuth2 client ID is required',
                handler,
                'validateConfig'
            );
        }

        if (!config.clientSecret) {
            return response.validationError(
                'clientSecret',
                'OAuth2 client secret is required',
                handler,
                'validateConfig'
            );
        }

        // Validate grant type specific requirements
        if (config.grantType === 'password') {
            if (!config.username) {
                return response.validationError(
                    'username',
                    'Username is required for password grant type',
                    handler,
                    'validateConfig'
                );
            }

            if (!config.password) {
                return response.validationError(
                    'password',
                    'Password is required for password grant type',
                    handler,
                    'validateConfig'
                );
            }
        }

        return null; // Valid
    }

    /**
     * Retrieves OAuth2 token (from cache or by requesting new one)
     *
     * Flow:
     * 1. Check Data Extension cache for valid token
     * 2. If valid token exists, return it
     * 3. If no valid token, request new token from OAuth2 endpoint
     * 4. Store new token in Data Extension cache
     * 5. Return new token
     *
     * @returns {object} Response with token information
     */
    function getToken() {
        // Validate configuration first
        var configValidation = validateConfig();
        if (configValidation) {
            return configValidation;
        }

        // Check cache first
        var cachedResult = tokenCache.get();

        if (cachedResult.success && cachedResult.data !== null) {
            // Valid token found in cache
            return response.success(cachedResult.data, handler, 'getToken');
        }

        // No valid cached token, request new one
        return requestNewToken();
    }

    /**
     * Requests new token from OAuth2 endpoint
     *
     * @returns {object} Response with new token
     */
    function requestNewToken() {
        try {
            // Build token request payload
            var tokenPayload = {
                grant_type: config.grantType || 'client_credentials',
                client_id: config.clientId,
                client_secret: config.clientSecret
            };

            // Add scope if provided
            if (config.scope) {
                tokenPayload.scope = config.scope;
            }

            // Add username/password for password grant
            if (config.grantType === 'password') {
                tokenPayload.username = config.username;
                tokenPayload.password = config.password;
            }

            // Make HTTP request to token endpoint
            var httpResult = connection.post(config.tokenUrl, tokenPayload);

            if (!httpResult.success) {
                return httpResult; // Return HTTP error as-is
            }

            // Parse token response
            var tokenData = httpResult.data.parsedContent;

            if (!tokenData || !tokenData.access_token) {
                return response.error(
                    'OAuth2 token response missing access_token',
                    handler,
                    'requestNewToken',
                    { response: httpResult.data.content }
                );
            }

            // Build token info object
            var tokenInfo = {
                accessToken: tokenData.access_token,
                tokenType: tokenData.token_type || 'Bearer',
                expiresIn: tokenData.expires_in || 3600,
                obtainedAt: new Date().getTime(),
                scope: tokenData.scope || config.scope || null,
                restInstanceUrl: tokenData.rest_instance_url || null, // SFMC specific
                soapInstanceUrl: tokenData.soap_instance_url || null  // SFMC specific
            };

            // Store in Data Extension cache
            var cacheResult = tokenCache.set(tokenInfo);

            if (!cacheResult.success) {
                // Token obtained but caching failed - log warning but continue
                // (Token is still returned to caller, just not cached)
            }

            return response.success(tokenInfo, handler, 'requestNewToken');

        } catch (ex) {
            return response.error(
                'Failed to request OAuth2 token: ' + (ex.message || ex.toString()),
                handler,
                'requestNewToken',
                { exception: ex.toString() }
            );
        }
    }

    /**
     * Gets authentication headers for API requests
     *
     * @returns {object} Response with auth headers
     */
    function getHeaders() {
        var tokenResult = getToken();

        if (!tokenResult.success) {
            return tokenResult; // Return error
        }

        var tokenInfo = tokenResult.data;

        var headers = {
            'Authorization': tokenInfo.tokenType + ' ' + tokenInfo.accessToken,
            'Content-Type': 'application/json'
        };

        return response.success(headers, handler, 'getHeaders');
    }

    /**
     * Checks if a token is expired
     *
     * @param {object} tokenInfo - Token info to check
     * @returns {boolean} true if expired
     */
    function isTokenExpired(tokenInfo) {
        return tokenCache.isExpired(tokenInfo);
    }

    /**
     * Clears cached token (forces new token request on next call)
     *
     * @returns {object} Response indicating success/failure
     */
    function clearCache() {
        return tokenCache.clear();
    }

    /**
     * Forces token refresh (clears cache and requests new token)
     *
     * @returns {object} Response with new token
     */
    function refreshToken() {
        clearCache();
        return getToken();
    }

    // Public API
    this.getToken = getToken;
    this.getHeaders = getHeaders;
    this.isTokenExpired = isTokenExpired;
    this.clearCache = clearCache;
    this.refreshToken = refreshToken;
    this.validateConfig = validateConfig;
}

// ============================================================================
// OMEGAFRAMEWORK MODULE REGISTRATION
// ============================================================================
if (typeof OmegaFramework !== 'undefined' && typeof OmegaFramework.register === 'function') {
    OmegaFramework.register('OAuth2AuthStrategy', {
        dependencies: ['ResponseWrapper', 'ConnectionHandler', 'CredentialStore', 'DataExtensionTokenCache'],
        blockKey: 'OMG_FW_OAuth2AuthStrategy',
        factory: function(responseWrapper, connectionHandler, credentialStoreFactory, tokenCacheFactory, config) {
            // Create CredentialStore instance if config is a string (integration name)
            var credStore = null;
            if (typeof config === 'string') {
                credStore = credentialStoreFactory(config);
            }

            // Return OAuth2AuthStrategy instance
            return new OAuth2AuthStrategy(
                responseWrapper,
                connectionHandler,
                credStore,
                tokenCacheFactory,
                config
            );
        }
    });
}

</script>