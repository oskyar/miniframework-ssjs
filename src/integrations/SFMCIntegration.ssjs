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
        var response = connectionInstance ? new ResponseWrapper() : new ResponseWrapper();
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
            var credStore = new CredentialStore(integrationName);
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
        var connection = connectionInstance || new ConnectionHandler();
        var base = new BaseIntegration(handler, config, null, connection);

        // Initialize OAuth2 strategy with SFMC-specific configuration
        var oauth2Config = {
            tokenUrl: config.authBaseUrl + 'v2/token',
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            grantType: 'client_credentials',
            scope: config.scope || null,
            refreshBuffer: config.refreshBuffer || 300000, // 5 minutes
            cacheKey: config.clientId // Use clientId as cache key
        };

        var authStrategy = new OAuth2AuthStrategy(oauth2Config, connection);
        base.setAuthStrategy(authStrategy);

        // ====================================================================
        // TOKEN MANAGEMENT METHODS
        // ====================================================================

        /**
         * Gets OAuth2 token (from cache or new request)
         *
         * @returns {object} Response with token information
         */
        function getToken() {
            return authStrategy.getToken();
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

            // Get REST URL (will use cached token if available)
            var restUrlResult = getRestUrl();

            if (!restUrlResult.success) {
                return restUrlResult;
            }

            // Update base URL with actual REST instance URL
            config.baseUrl = restUrlResult.data;

            // Execute request using base integration methods
            method = method.toUpperCase();

            switch (method) {
                case 'GET':
                    return base.get(endpoint, options);
                case 'POST':
                    return base.post(endpoint, data, options);
                case 'PUT':
                    return base.put(endpoint, data, options);
                case 'PATCH':
                    return base.patch(endpoint, data, options);
                case 'DELETE':
                    return base.remove(endpoint, options);
                default:
                    return response.validationError(
                        'method',
                        'Invalid HTTP method: ' + method,
                        handler,
                        'makeRestRequest'
                    );
            }
        }

        /**
         * Checks if current token is expired
         *
         * @returns {boolean} true if expired or no token
         */
        function isTokenExpired() {
            var tokenResult = authStrategy.getToken();

            if (!tokenResult.success) {
                return true; // No token or error = expired
            }

            return authStrategy.isTokenExpired(tokenResult.data);
        }

        /**
         * Clears cached token (forces new token on next request)
         *
         * @returns {object} Response
         */
        function clearTokenCache() {
            return authStrategy.clearCache();
        }

        /**
         * Forces token refresh
         *
         * @returns {object} Response with new token
         */
        function refreshToken() {
            return authStrategy.refreshToken();
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
            dependencies: ['ResponseWrapper', 'ConnectionHandler', 'OAuth2AuthStrategy', 'BaseIntegration'],
            blockKey: 'OMG_FW_SFMCIntegration',
            factory: function(responseWrapper, connectionHandler, oauth2Factory, baseIntegrationFactory, config) {
                // Note: SFMCIntegration currently uses traditional instantiation pattern
                // For now, it will create its own dependencies internally
                // This registration enables future refactoring to full dependency injection
                return new SFMCIntegration(config);
            }
        });
    }

    // ========================================================================
    // END OF SFMCINTEGRATION
    // ========================================================================
}

</script>
