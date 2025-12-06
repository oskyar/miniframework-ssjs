<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * DataCloudIntegration - Salesforce Data Cloud API Integration
 *
 * Provides access to Data Cloud APIs including data ingestion,
 * SQL queries, profile management, segmentation, and identity resolution.
 *
 * @version 3.0.0 (transitional - supports both v2 and v3 patterns)
 * @author OmegaFramework
 */
function DataCloudIntegration(dataCloudConfig, connectionInstance) {
    var handler = 'DataCloudIntegration';
    var response = connectionInstance ? OmegaFramework.require('ResponseWrapper', {}) : OmegaFramework.require('ResponseWrapper', {});
    var config = dataCloudConfig || {};

    // Initialize base integration
    var connection = connectionInstance || OmegaFramework.require('ConnectionHandler', {});
    var base = OmegaFramework.create('BaseIntegration', {
        integrationName: handler,
        integrationConfig: config
    });

    // ====================================================================
    // DATA CLOUD OAUTH2 AUTHENTICATION (Internal)
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
     * Requests new OAuth2 token from Data Cloud
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
            var tokenEndpoint = config.authBaseUrl || config.baseUrl;
            var httpResult = connection.post(tokenEndpoint + '/services/oauth2/token', tokenPayload);

            if (!httpResult.success) {
                return httpResult;
            }

            // Parse Data Cloud token response
            var tokenData = httpResult.data.parsedContent;

            // Fallback manual parsing if needed
            if (!tokenData && httpResult.data.content) {
                try {
                    tokenData = Platform.Function.ParseJSON(String(httpResult.data.content));
                } catch (parseEx) {
                    return response.error(
                        'Failed to parse Data Cloud OAuth2 token response: ' + parseEx.message,
                        handler,
                        'requestNewToken',
                        { response: httpResult.data.content }
                    );
                }
            }

            if (!tokenData || !tokenData.access_token) {
                return response.error(
                    'Data Cloud OAuth2 token response missing access_token',
                    handler,
                    'requestNewToken',
                    {
                        response: httpResult.data.content,
                        parsedContent: tokenData
                    }
                );
            }

            // Build Data Cloud token info
            var tokenInfo = {
                accessToken: tokenData.access_token,
                tokenType: tokenData.token_type || 'Bearer',
                expiresIn: tokenData.expires_in || 3600,
                obtainedAt: new Date().getTime(),
                expiresAt: null,
                scope: tokenData.scope || config.scope || null,
                instanceUrl: tokenData.instance_url || null
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
                'Failed to request Data Cloud OAuth2 token: ' + (ex.message || ex.toString()),
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
     * Refreshes the OAuth2 token
     *
     * @returns {object} Response with new token information
     */
    function refreshToken() {
        return requestNewToken();
    }

    /**
     * Clears the cached token
     *
     * @returns {object} Response
     */
    function clearTokenCache() {
        var result = tokenCache.clear();
        if (result.success) {
            return response.success({ cleared: true }, handler, 'clearTokenCache');
        }
        return result;
    }

    /**
     * Makes authenticated REST request to Data Cloud
     * @private
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request data
     * @param {object} options - Request options
     * @returns {object} Response
     */
    function makeAuthenticatedRequest(method, endpoint, data, options) {
        // Get valid token
        var tokenResult = getToken();
        if (!tokenResult.success) {
            return tokenResult;
        }

        var tokenInfo = tokenResult.data;

        // Build headers with authentication
        var headers = {
            'Authorization': tokenInfo.tokenType + ' ' + tokenInfo.accessToken,
            'Content-Type': 'application/json'
        };

        // Merge custom headers
        if (options && options.headers) {
            for (var key in options.headers) {
                if (options.headers.hasOwnProperty(key)) {
                    headers[key] = options.headers[key];
                }
            }
        }

        // Use instance URL from token if available
        var baseUrl = tokenInfo.instanceUrl || config.baseUrl;
        var url = baseUrl;

        // Add endpoint
        if (endpoint) {
            if (url && url.charAt(url.length - 1) === '/') {
                url = url.substring(0, url.length - 1);
            }
            if (endpoint.charAt(0) !== '/') {
                endpoint = '/' + endpoint;
            }
            url += endpoint;
        }

        // Add query parameters if provided
        if (options && options.queryParams) {
            url += base.buildQueryString(options.queryParams);
        }

        return connection.request(method, url, data, headers);
    }

    /**
     * Ingests data into Data Cloud
     *
     * @param {string} sourceName - Data source name
     * @param {array} records - Array of records to ingest
     * @returns {object} Response
     */
    function ingestData(sourceName, records) {
        if (!sourceName) {
            return response.validationError('sourceName', 'Data source name is required', handler, 'ingestData');
        }

        if (!records || records.length === 0) {
            return response.validationError('records', 'Records array is required', handler, 'ingestData');
        }

        var payload = {
            data: records
        };

        return makeAuthenticatedRequest('POST', '/api/v1/ingest/sources/' + sourceName + '/actions/ingest', payload);
    }

    /**
     * Executes SQL query against Data Cloud
     *
     * @param {string} sqlQuery - SQL query string
     * @param {object} options - Query options
     * @returns {object} Response with query results
     */
    function query(sqlQuery, options) {
        if (!sqlQuery) {
            return response.validationError('sqlQuery', 'SQL query is required', handler, 'query');
        }

        options = options || {};

        var payload = {
            sql: sqlQuery,
            parameters: options.parameters || []
        };

        return makeAuthenticatedRequest('POST', '/api/v1/query', payload);
    }

    /**
     * Gets unified individual profile
     *
     * @param {string} individualId - Individual ID
     * @returns {object} Response with profile data
     */
    function getProfile(individualId) {
        if (!individualId) {
            return response.validationError('individualId', 'Individual ID is required', handler, 'getProfile');
        }

        return makeAuthenticatedRequest('GET', '/api/v1/profile/' + individualId);
    }

    /**
     * Gets segment definition
     *
     * @param {string} segmentId - Segment ID
     * @returns {object} Response with segment details
     */
    function getSegment(segmentId) {
        if (!segmentId) {
            return response.validationError('segmentId', 'Segment ID is required', handler, 'getSegment');
        }

        return makeAuthenticatedRequest('GET', '/api/v1/segments/' + segmentId);
    }

    /**
     * Gets segment members
     *
     * @param {string} segmentId - Segment ID
     * @param {object} options - Pagination options {limit, offset}
     * @returns {object} Response with segment members
     */
    function getSegmentMembers(segmentId, options) {
        if (!segmentId) {
            return response.validationError('segmentId', 'Segment ID is required', handler, 'getSegmentMembers');
        }

        options = options || {};

        return makeAuthenticatedRequest('GET', '/api/v1/segments/' + segmentId + '/members', null, {
            queryParams: {
                limit: options.limit || 100,
                offset: options.offset || 0
            }
        });
    }

    /**
     * Creates activation
     *
     * @param {object} activationData - Activation configuration
     * @returns {object} Response with created activation
     */
    function createActivation(activationData) {
        if (!activationData || !activationData.name) {
            return response.validationError('name', 'Activation name is required', handler, 'createActivation');
        }

        return makeAuthenticatedRequest('POST', '/api/v1/activations', activationData);
    }

    /**
     * Gets activation status
     *
     * @param {string} activationId - Activation ID
     * @returns {object} Response with activation status
     */
    function getActivationStatus(activationId) {
        if (!activationId) {
            return response.validationError('activationId', 'Activation ID is required', handler, 'getActivationStatus');
        }

        return makeAuthenticatedRequest('GET', '/api/v1/activations/' + activationId + '/status');
    }

    /**
     * Resolves identity across data sources
     *
     * @param {object} identityData - Identity attributes
     * @returns {object} Response with resolved identity
     */
    function resolveIdentity(identityData) {
        if (!identityData) {
            return response.validationError('identityData', 'Identity data is required', handler, 'resolveIdentity');
        }

        return makeAuthenticatedRequest('POST', '/api/v1/identity/resolve', identityData);
    }

    /**
     * Gets data stream metadata
     *
     * @param {string} streamName - Data stream name
     * @returns {object} Response with stream metadata
     */
    function getDataStream(streamName) {
        if (!streamName) {
            return response.validationError('streamName', 'Stream name is required', handler, 'getDataStream');
        }

        return makeAuthenticatedRequest('GET', '/api/v1/streams/' + streamName);
    }

    /**
     * Lists all calculated insights
     *
     * @param {object} options - Query options
     * @returns {object} Response with insights list
     */
    function listInsights(options) {
        return makeAuthenticatedRequest('GET', '/api/v1/insights', null, { queryParams: options });
    }

    /**
     * Gets specific calculated insight
     *
     * @param {string} insightId - Insight ID
     * @returns {object} Response with insight details
     */
    function getInsight(insightId) {
        if (!insightId) {
            return response.validationError('insightId', 'Insight ID is required', handler, 'getInsight');
        }

        return makeAuthenticatedRequest('GET', '/api/v1/insights/' + insightId);
    }

    // Public API - Data Cloud specific methods
    this.ingestData = ingestData;
    this.query = query;
    this.getProfile = getProfile;
    this.getSegment = getSegment;
    this.getSegmentMembers = getSegmentMembers;
    this.createActivation = createActivation;
    this.getActivationStatus = getActivationStatus;
    this.resolveIdentity = resolveIdentity;
    this.getDataStream = getDataStream;
    this.listInsights = listInsights;
    this.getInsight = getInsight;

    // Token management methods
    this.getToken = getToken;
    this.refreshToken = refreshToken;
    this.clearTokenCache = clearTokenCache;

    // Base HTTP methods (for advanced use)
    this.get = base.get;
    this.post = base.post;
    this.put = base.put;
    this.remove = base.remove;
}

// ============================================================================
// OMEGAFRAMEWORK MODULE REGISTRATION
// ============================================================================
if (typeof OmegaFramework !== 'undefined' && typeof OmegaFramework.register === 'function') {
    OmegaFramework.register('DataCloudIntegration', {
        dependencies: ['ResponseWrapper', 'ConnectionHandler', 'BaseIntegration'],
        blockKey: 'OMG_FW_DataCloudIntegration',
        factory: function(responseWrapper, connectionHandler, baseIntegrationFactory, config) {
            // Note: DataCloudIntegration currently uses traditional instantiation pattern
            // TODO: Implement internal OAuth2 authentication
            return new DataCloudIntegration(config);
        }
    });
}

</script>
