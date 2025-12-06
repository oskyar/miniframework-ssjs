<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// DUPLICATE LOAD PREVENTION
// ============================================================================
if (typeof __OmegaFramework === 'undefined') {
    var __OmegaFramework = { loaded: {} };
}

if (__OmegaFramework.loaded['SFMCIntegration']) {
    // Already loaded, skip execution
} else {
    __OmegaFramework.loaded['SFMCIntegration'] = true;

    // ========================================================================
    // LOAD DEPENDENCIES
    // ========================================================================
    if (!__OmegaFramework.loaded['ResponseWrapper']) {
        Platform.Function.ContentBlockByKey("OMG_FW_ResponseWrapper");
    }

    if (!__OmegaFramework.loaded['ConnectionHandler']) {
        Platform.Function.ContentBlockByKey("OMG_FW_ConnectionHandler");
    }

    if (!__OmegaFramework.loaded['OAuth2AuthStrategy']) {
        Platform.Function.ContentBlockByKey("OMG_FW_OAuth2AuthStrategy");
    }

    if (!__OmegaFramework.loaded['BaseIntegration']) {
        Platform.Function.ContentBlockByKey("OMG_FW_BaseIntegration");
    }

    // ========================================================================
    // SFMCINTEGRATION - MAIN CODE
    // ========================================================================

    /**
     * SFMCIntegration - Salesforce Marketing Cloud REST API Integration
     *
     * Provides comprehensive access to SFMC REST APIs with OAuth2 authentication
     * and persistent token caching via Data Extensions.
     *
     * Initialization Modes:
     * 1. CredentialStore (Production): Pass integration name as string
     *    Example: new SFMCIntegration('SFMC_Production')
     *
     * 2. Direct Config (Development/Testing): Pass config object
     *    Example: new SFMCIntegration({ clientId: '...', clientSecret: '...', authBaseUrl: '...' })
     *
     * Features:
     * - OAuth2 authentication with Data Extension token caching
     * - Automatic REST instance URL discovery
     * - Token management (get, refresh, cache)
     * - Direct access to all SFMC REST API endpoints
     * - Secure credential management via CredentialStore
     *
     * CredentialStore Mapping (AuthType: OAuth2):
     * - clientId → credentials.clientId (decrypted)
     * - clientSecret → credentials.clientSecret (decrypted)
     * - authBaseUrl → credentials.authUrl
     * - baseUrl → credentials.baseUrl (optional)
     * - accountId → credentials.customField1 (optional, SFMC MID)
     * - scope → credentials.customField2 (optional, OAuth scope)
     *
     * @param {string|object} integrationNameOrConfig - Integration name (CredentialStore) or config object
     * @param {object} connectionInstance - Optional ConnectionHandler instance (deprecated for v3.0)
     * @version 3.0.0 (transitional - supports both v2 and v3 patterns)
     * @author OmegaFramework
     */
    function SFMCIntegration(integrationNameOrConfig, connectionInstance) {
        var handler = 'SFMCIntegration';
        var response = connectionInstance ? OmegaFramework.require('ResponseWrapper', {}) : OmegaFramework.require('ResponseWrapper', {});
        var config = {};

        // ====================================================================
        // INITIALIZATION MODE DETECTION
        // ====================================================================

        if (typeof integrationNameOrConfig === 'string') {
            // MODE 1: Load from CredentialStore (Production)
            var integrationName = integrationNameOrConfig;

            // Lazy-load CredentialStore only when needed
            if (!__OmegaFramework.loaded['CredentialStore']) {
                Platform.Function.ContentBlockByKey("OMG_FW_CredentialStore");
            }

            // Get credentials from CredentialStore
            var credStore = OmegaFramework.create('CredentialStore', {
                integrationName: integrationName
            });
            var credResult = credStore.getCredentials();

            if (!credResult.success) {
                throw new Error('Failed to load credentials for "' + integrationName + '": ' + credResult.error.message);
            }

            // Validate AuthType
            if (credResult.data.authType !== 'OAuth2') {
                throw new Error(
                    'Invalid AuthType: Integration "' + integrationName +
                    '" has AuthType "' + credResult.data.authType +
                    '" but SFMCIntegration requires "OAuth2"'
                );
            }

            // Map CredentialStore fields to SFMC config
            config = {
                clientId: credResult.data.clientId,
                clientSecret: credResult.data.clientSecret,
                authBaseUrl: credResult.data.authUrl,
                baseUrl: credResult.data.baseUrl || 'https://www.marketingcloudapis.com',
                accountId: credResult.data.customField1 || null,
                scope: credResult.data.customField2 || null,
                refreshBuffer: 300000 // 5 minutes
            };

        } else if (typeof integrationNameOrConfig === 'object' && integrationNameOrConfig !== null) {
            // MODE 2: Direct config (Development/Testing)
            config = integrationNameOrConfig || {};
            config.baseUrl = config.baseUrl || 'https://www.marketingcloudapis.com';

        } else {
            throw new Error('Invalid parameter: expected string (integration name) or object (config)');
        }

        // ====================================================================
        // INITIALIZATION - Same for both modes
        // ====================================================================

        // Initialize base integration
        var connection = connectionInstance || OmegaFramework.require('ConnectionHandler', {});
        var base = OmegaFramework.create('BaseIntegration', {
            integrationName: handler,
            integrationConfig: config
        });

        // ====================================================================
        // SFMC OAUTH2 AUTHENTICATION (Internal)
        // ====================================================================

        // Initialize token cache
        var tokenCache = null;
        if (!__OmegaFramework.loaded['DataExtensionTokenCache']) {
            Platform.Function.ContentBlockByKey("OMG_FW_DataExtensionTokenCache");
        }

        // Create token cache factory
        var DataExtensionTokenCache = OmegaFramework.require('DataExtensionTokenCache', {});

        // Initialize cache with clientId as key
        tokenCache = DataExtensionTokenCache(config.clientId, {
            refreshBuffer: config.refreshBuffer || 300000 // 5 minutes
        });

        /**
         * Requests new OAuth2 token from SFMC
         * @private
         * @returns {object} Response with token info
         */
        function requestNewToken() {
            try {
                var tokenPayload = {
                    grant_type: 'client_credentials',
                    client_id: config.clientId,
                    client_secret: config.clientSecret
                };

                if (config.scope) {
                    tokenPayload.scope = config.scope;
                }

                // Make OAuth2 token request
                var httpResult = connection.post(config.authBaseUrl + 'v2/token', tokenPayload);

                if (!httpResult.success) {
                    return httpResult;
                }

                // Parse SFMC token response
                var tokenData = httpResult.data.parsedContent;

                // Fallback manual parsing if needed
                if (!tokenData && httpResult.data.content) {
                    try {
                        tokenData = Platform.Function.ParseJSON(String(httpResult.data.content));
                    } catch (parseEx) {
                        return response.error(
                            'Failed to parse SFMC OAuth2 token response: ' + parseEx.message,
                            handler,
                            'requestNewToken',
                            { response: httpResult.data.content }
                        );
                    }
                }

                if (!tokenData || !tokenData.access_token) {
                    return response.error(
                        'SFMC OAuth2 token response missing access_token',
                        handler,
                        'requestNewToken',
                        {
                            response: httpResult.data.content,
                            parsedContent: tokenData
                        }
                    );
                }

                // Build SFMC-specific token info
                var tokenInfo = {
                    accessToken: tokenData.access_token,
                    tokenType: tokenData.token_type || 'Bearer',
                    expiresIn: tokenData.expires_in || 1080,
                    obtainedAt: new Date().getTime(),
                    expiresAt: null,
                    scope: tokenData.scope || config.scope || null,
                    restInstanceUrl: tokenData.rest_instance_url || null,
                    soapInstanceUrl: tokenData.soap_instance_url || null
                };

                // Calculate expiresAt
                tokenInfo.expiresAt = tokenInfo.obtainedAt + (tokenInfo.expiresIn * 1000);

                // Store in cache
                var cacheResult = tokenCache.set(tokenInfo);

                if (!cacheResult.success) {
                    // Token obtained but caching failed - continue anyway
                }

                return response.success(tokenInfo, handler, 'requestNewToken');

            } catch (ex) {
                return response.error(
                    'Failed to request SFMC OAuth2 token: ' + (ex.message || ex.toString()),
                    handler,
                    'requestNewToken',
                    { exception: ex.toString() }
                );
            }
        }

        /**
         * Checks if a token is expired
         * @private
         * @param {object} tokenInfo - Token info to check
         * @returns {boolean} true if expired
         */
        function isTokenExpired(tokenInfo) {
            return tokenCache.isExpired(tokenInfo);
        }

        // ====================================================================
        // TOKEN MANAGEMENT METHODS
        // ====================================================================

        /**
         * Gets OAuth2 token (from cache or new request)
         *
         * @returns {object} Response with token information
         */
        function getToken() {
            // Check cache first
            var cachedResult = tokenCache.get();

            if (cachedResult.success && cachedResult.data !== null && !isTokenExpired(cachedResult.data)) {
                return response.success(cachedResult.data, handler, 'getToken');
            }

            // No valid cached token, request new one
            return requestNewToken();
        }

        /**
         * Gets SFMC REST instance URL from token response
         *
         * SFMC tokens include rest_instance_url which is the correct
         * API endpoint for the specific SFMC instance.
         *
         * @returns {object} Response with REST URL or error
         */
        function getRestUrl() {
            var tokenResult = getToken();

            if (!tokenResult.success) {
                return tokenResult;
            }

            var restUrl = tokenResult.data.restInstanceUrl;

            if (!restUrl) {
                // Fallback to configured base URL or default
                restUrl = config.baseUrl || 'https://www.marketingcloudapis.com';
            }

            return response.success(restUrl, handler, 'getRestUrl');
        }

        /**
         * Gets SFMC SOAP instance URL from token response
         *
         * @returns {object} Response with SOAP URL or error
         */
        function getSoapUrl() {
            var tokenResult = getToken();

            if (!tokenResult.success) {
                return tokenResult;
            }

            var soapUrl = tokenResult.data.soapInstanceUrl;

            if (!soapUrl) {
                // Fallback to default
                soapUrl = 'https://webservice.s7.exacttarget.com/Service.asmx';
            }

            return response.success(soapUrl, handler, 'getSoapUrl');
        }

        /**
         * Makes authenticated REST API request to SFMC
         *
         * Automatically uses the correct REST instance URL from token.
         *
         * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
         * @param {string} endpoint - API endpoint (e.g., '/asset/v1/content/assets')
         * @param {object} data - Request payload (for POST/PUT)
         * @param {object} options - Additional options {headers, queryParams}
         * @returns {object} Response
         */
        function makeRestRequest(method, endpoint, data, options) {
            options = options || {};

            // Get OAuth2 token
            var tokenResult = getToken();
            if (!tokenResult.success) {
                return tokenResult;
            }

            var tokenInfo = tokenResult.data;

            // Build auth headers
            var headers = {
                'Authorization': tokenInfo.tokenType + ' ' + tokenInfo.accessToken,
                'Content-Type': 'application/json'
            };

            // Use rest_instance_url from token if available
            var baseUrl = tokenInfo.restInstanceUrl || config.baseUrl;
            var url = baseUrl + endpoint;

            // Add query params if provided
            if (options && options.queryParams) {
                url += base.buildQueryString(options.queryParams);
            }

            // Merge custom headers
            if (options && options.headers) {
                for (var key in options.headers) {
                    headers[key] = options.headers[key];
                }
            }

            // Make HTTP request
            method = method.toUpperCase();
            var httpResult = connection.request(method, url, data, headers);

            return httpResult;
        }

        /**
         * Clears cached token (forces new token on next request)
         *
         * @returns {object} Response
         */
        function clearTokenCache() {
            return tokenCache.clear();
        }

        /**
         * Forces token refresh
         *
         * @returns {object} Response with new token
         */
        function refreshToken() {
            tokenCache.clear();
            return getToken();
        }

        // ====================================================================
        // ASSET MANAGEMENT API
        // ====================================================================

        /**
         * Lists assets from Content Builder
         *
         * @param {object} options - Query options {pageSize, page, filter, orderBy}
         * @returns {object} Response with assets
         */
        function listAssets(options) {
            return makeRestRequest('GET', '/asset/v1/content/assets', null, {
                queryParams: options
            });
        }

        /**
         * Gets asset by ID
         *
         * @param {number} assetId - Asset ID
         * @returns {object} Response with asset details
         */
        function getAsset(assetId) {
            return makeRestRequest('GET', '/asset/v1/content/assets/' + assetId);
        }

        /**
         * Creates asset
         *
         * @param {object} assetData - Asset data
         * @returns {object} Response with created asset
         */
        function createAsset(assetData) {
            return makeRestRequest('POST', '/asset/v1/content/assets', assetData);
        }

        /**
         * Updates asset
         *
         * @param {number} assetId - Asset ID
         * @param {object} assetData - Updated asset data
         * @returns {object} Response
         */
        function updateAsset(assetId, assetData) {
            return makeRestRequest('PATCH', '/asset/v1/content/assets/' + assetId, assetData);
        }

        /**
         * Deletes asset
         *
         * @param {number} assetId - Asset ID
         * @returns {object} Response
         */
        function deleteAsset(assetId) {
            return makeRestRequest('DELETE', '/asset/v1/content/assets/' + assetId);
        }

        // ====================================================================
        // DATA EXTENSION API
        // ====================================================================

        /**
         * Retrieves data from Data Extension
         *
         * @param {string} dataExtensionKey - Data Extension customer key
         * @param {object} options - Query options
         * @returns {object} Response with rows
         */
        function queryDataExtension(dataExtensionKey, options) {
            return makeRestRequest('GET', '/data/v1/customobjectdata/key/' + dataExtensionKey + '/rowset', null, {
                queryParams: options
            });
        }

        /**
         * Inserts row into Data Extension
         *
         * @param {string} dataExtensionKey - Data Extension customer key
         * @param {object} rowData - Row data
         * @returns {object} Response
         */
        function insertDataExtensionRow(dataExtensionKey, rowData) {
            return makeRestRequest('POST', '/hub/v1/dataevents/key:' + dataExtensionKey + '/rowset', [rowData]);
        }

        /**
         * Updates row in Data Extension
         *
         * @param {string} dataExtensionKey - Data Extension customer key
         * @param {object} rowData - Row data with primary key
         * @returns {object} Response
         */
        function updateDataExtensionRow(dataExtensionKey, rowData) {
            return makeRestRequest('PUT', '/hub/v1/dataevents/key:' + dataExtensionKey + '/rowset', [rowData]);
        }

        /**
         * Deletes row from Data Extension
         *
         * @param {string} dataExtensionKey - Data Extension customer key
         * @param {object} keys - Primary key values
         * @returns {object} Response
         */
        function deleteDataExtensionRow(dataExtensionKey, keys) {
            return makeRestRequest('DELETE', '/hub/v1/dataevents/key:' + dataExtensionKey + '/rowset', [{ keys: keys }]);
        }

        // ====================================================================
        // JOURNEY API
        // ====================================================================

        /**
         * Gets journey by ID
         *
         * @param {string} journeyId - Journey ID
         * @returns {object} Response with journey details
         */
        function getJourney(journeyId) {
            return makeRestRequest('GET', '/interaction/v1/interactions/' + journeyId);
        }

        /**
         * Publishes journey
         *
         * @param {string} journeyId - Journey ID
         * @returns {object} Response
         */
        function publishJourney(journeyId) {
            return makeRestRequest('POST', '/interaction/v1/interactions/publishAsync/' + journeyId);
        }

        /**
         * Stops journey
         *
         * @param {string} journeyId - Journey ID
         * @returns {object} Response
         */
        function stopJourney(journeyId) {
            return makeRestRequest('POST', '/interaction/v1/interactions/stop/' + journeyId);
        }

        // ====================================================================
        // TRANSACTIONAL MESSAGING API
        // ====================================================================

        /**
         * Sends transactional email
         *
         * @param {string} messageKey - Transactional message key
         * @param {object} messageData - Message data (recipient, content, etc.)
         * @returns {object} Response
         */
        function sendTransactionalEmail(messageKey, messageData) {
            return makeRestRequest('POST', '/messaging/v1/messageDefinitionSends/key:' + messageKey + '/send', messageData);
        }

        // ====================================================================
        // PUBLIC API
        // ====================================================================

        // Token management
        this.getToken = getToken;
        this.getRestUrl = getRestUrl;
        this.getSoapUrl = getSoapUrl;
        this.makeRestRequest = makeRestRequest;
        this.isTokenExpired = isTokenExpired;
        this.clearTokenCache = clearTokenCache;
        this.refreshToken = refreshToken;

        // HTTP methods (delegated to base)
        this.get = base.get;
        this.post = base.post;
        this.put = base.put;
        this.patch = base.patch;
        this.remove = base.remove;

        // SFMC-specific API methods
        this.listAssets = listAssets;
        this.getAsset = getAsset;
        this.createAsset = createAsset;
        this.updateAsset = updateAsset;
        this.deleteAsset = deleteAsset;

        this.queryDataExtension = queryDataExtension;
        this.insertDataExtensionRow = insertDataExtensionRow;
        this.updateDataExtensionRow = updateDataExtensionRow;
        this.deleteDataExtensionRow = deleteDataExtensionRow;

        this.getJourney = getJourney;
        this.publishJourney = publishJourney;
        this.stopJourney = stopJourney;

        this.sendTransactionalEmail = sendTransactionalEmail;
    }

    // ========================================================================
    // OMEGAFRAMEWORK MODULE REGISTRATION
    // ========================================================================
    if (typeof OmegaFramework !== 'undefined' && typeof OmegaFramework.register === 'function') {
        OmegaFramework.register('SFMCIntegration', {
            dependencies: ['ResponseWrapper', 'ConnectionHandler', 'BaseIntegration', 'DataExtensionTokenCache', 'CredentialStore'],
            blockKey: 'OMG_FW_SFMCIntegration',
            factory: function(responseWrapper, connectionHandler, baseIntegrationFactory, tokenCacheFactory, credStoreFactory, config) {
                // Note: SFMCIntegration uses traditional instantiation pattern
                // It handles OAuth2 authentication internally
                return new SFMCIntegration(config);
            }
        });
    }

    // ========================================================================
    // END OF SFMCINTEGRATION
    // ========================================================================
}

</script>
