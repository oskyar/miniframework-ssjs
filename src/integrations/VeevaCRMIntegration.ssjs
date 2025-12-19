<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * VeevaCRMIntegration - Veeva CRM API Integration
 *
 * Veeva CRM is built on Salesforce, so this integration uses
 * Salesforce REST API patterns with Veeva-specific objects.
 *
 * @version 1.0.0
 * @author OmegaFramework Team
 */
function VeevaCRMIntegration(veevaConfig, connectionInstance) {
    var handler = 'VeevaCRMIntegration';
    var response = connectionInstance ? OmegaFramework.require('ResponseWrapper', {}) : OmegaFramework.require('ResponseWrapper', {});
    var config = veevaConfig || {};

    // Set API version
    var apiVersion = config.apiVersion || 'v60.0';
    config.baseUrl = config.baseUrl || 'https://login.salesforce.com';

    // Initialize base integration
    var connection = connectionInstance || OmegaFramework.require('ConnectionHandler', {});
    var base = OmegaFramework.create('BaseIntegration', {
        integrationName: handler,
        integrationConfig: config
    });

    // ====================================================================
    // VEEVA CRM OAUTH2 PASSWORD GRANT AUTHENTICATION (Internal)
    // ====================================================================

    // Initialize token cache
    var tokenCache = null;
    if (!__OmegaFramework.loaded['DataExtensionTokenCache']) {
        Platform.Function.ContentBlockByName("OMG_FW_DataExtensionTokenCache");
    }

    // Create token cache factory
    var DataExtensionTokenCache = OmegaFramework.require('DataExtensionTokenCache', {});

    // Initialize cache with username as key (password grant uses username)
    tokenCache = DataExtensionTokenCache(config.username, {
        refreshBuffer: config.refreshBuffer || 300000 // 5 minutes
    });

    /**
     * Requests new OAuth2 token from Veeva CRM using password grant
     * @private
     * @returns {object} Response with token info
     */
    function requestNewToken() {
        try {
            // OAuth2 password grant payload
            var tokenPayload = {
                grant_type: 'password',
                client_id: config.clientId,
                client_secret: config.clientSecret,
                username: config.username,
                password: config.password
            };

            // Add security token if provided (Salesforce requirement)
            if (config.securityToken) {
                tokenPayload.password = config.password + config.securityToken;
            }

            // Make OAuth2 token request
            var tokenEndpoint = config.authBaseUrl || config.baseUrl;
            var httpResult = connection.post(tokenEndpoint + '/services/oauth2/token', tokenPayload);

            if (!httpResult.success) {
                return httpResult;
            }

            // Parse Veeva CRM token response
            var tokenData = httpResult.data.parsedContent;

            // Fallback manual parsing if needed
            if (!tokenData && httpResult.data.content) {
                try {
                    tokenData = Platform.Function.ParseJSON(String(httpResult.data.content));
                } catch (parseEx) {
                    return response.error(
                        'Failed to parse Veeva CRM OAuth2 token response: ' + parseEx.message,
                        handler,
                        'requestNewToken',
                        { response: httpResult.data.content }
                    );
                }
            }

            if (!tokenData || !tokenData.access_token) {
                return response.error(
                    'Veeva CRM OAuth2 token response missing access_token',
                    handler,
                    'requestNewToken',
                    {
                        response: httpResult.data.content,
                        parsedContent: tokenData
                    }
                );
            }

            // Build Veeva CRM token info (Salesforce-based)
            var tokenInfo = {
                accessToken: tokenData.access_token,
                tokenType: tokenData.token_type || 'Bearer',
                expiresIn: tokenData.expires_in || 7200,
                obtainedAt: new Date().getTime(),
                expiresAt: null,
                instanceUrl: tokenData.instance_url || null,
                id: tokenData.id || null,
                issuedAt: tokenData.issued_at || null,
                signature: tokenData.signature || null
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
                'Failed to request Veeva CRM OAuth2 token: ' + (ex.message || ex.toString()),
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
     * Makes authenticated REST request to Veeva CRM
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

        // Use instance URL from token (Salesforce returns instance_url)
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
     * Executes SOQL query
     *
     * @param {string} soql - SOQL query string
     * @returns {object} Response with query results
     */
    function query(soql) {
        if (!soql) {
            return response.validationError('soql', 'SOQL query is required', handler, 'query');
        }

        return makeAuthenticatedRequest('GET', '/services/data/' + apiVersion + '/query', null, {
            queryParams: { q: soql }
        });
    }

    /**
     * Gets account by ID
     *
     * @param {string} accountId - Account Salesforce ID
     * @returns {object} Response with account details
     */
    function getAccount(accountId) {
        if (!accountId) {
            return response.validationError('accountId', 'Account ID is required', handler, 'getAccount');
        }

        return makeAuthenticatedRequest('GET', '/services/data/' + apiVersion + '/sobjects/Account/' + accountId);
    }

    /**
     * Creates new account
     *
     * @param {object} accountData - Account data
     * @returns {object} Response with created account ID
     */
    function createAccount(accountData) {
        if (!accountData || !accountData.Name) {
            return response.validationError('Name', 'Account name is required', handler, 'createAccount');
        }

        return makeAuthenticatedRequest('POST', '/services/data/' + apiVersion + '/sobjects/Account', accountData);
    }

    /**
     * Updates account
     *
     * @param {string} accountId - Account ID
     * @param {object} accountData - Updated account data
     * @returns {object} Response
     */
    function updateAccount(accountId, accountData) {
        if (!accountId) {
            return response.validationError('accountId', 'Account ID is required', handler, 'updateAccount');
        }

        return makeAuthenticatedRequest('PATCH', '/services/data/' + apiVersion + '/sobjects/Account/' + accountId, accountData);
    }

    /**
     * Gets contact by ID
     *
     * @param {string} contactId - Contact Salesforce ID
     * @returns {object} Response with contact details
     */
    function getContact(contactId) {
        if (!contactId) {
            return response.validationError('contactId', 'Contact ID is required', handler, 'getContact');
        }

        return makeAuthenticatedRequest('GET', '/services/data/' + apiVersion + '/sobjects/Contact/' + contactId);
    }

    /**
     * Creates new contact
     *
     * @param {object} contactData - Contact data
     * @returns {object} Response with created contact ID
     */
    function createContact(contactData) {
        if (!contactData || !contactData.LastName) {
            return response.validationError('LastName', 'Contact last name is required', handler, 'createContact');
        }

        return makeAuthenticatedRequest('POST', '/services/data/' + apiVersion + '/sobjects/Contact', contactData);
    }

    /**
     * Creates call report (Medical Inquiry)
     *
     * @param {object} callData - Call data
     * @returns {object} Response with created call ID
     */
    function createCall(callData) {
        if (!callData || !callData.Account_vod__c) {
            return response.validationError('Account_vod__c', 'Account is required for call', handler, 'createCall');
        }

        if (!callData.Call_Date_vod__c) {
            return response.validationError('Call_Date_vod__c', 'Call date is required', handler, 'createCall');
        }

        return makeAuthenticatedRequest('POST', '/services/data/' + apiVersion + '/sobjects/Call2_vod__c', callData);
    }

    /**
     * Gets call report by ID
     *
     * @param {string} callId - Call Salesforce ID
     * @returns {object} Response with call details
     */
    function getCall(callId) {
        if (!callId) {
            return response.validationError('callId', 'Call ID is required', handler, 'getCall');
        }

        return makeAuthenticatedRequest('GET', '/services/data/' + apiVersion + '/sobjects/Call2_vod__c/' + callId);
    }

    /**
     * Creates sample order
     *
     * @param {object} orderData - Sample order data
     * @returns {object} Response with created order ID
     */
    function createSampleOrder(orderData) {
        if (!orderData || !orderData.Account_vod__c) {
            return response.validationError('Account_vod__c', 'Account is required', handler, 'createSampleOrder');
        }

        return makeAuthenticatedRequest('POST', '/services/data/' + apiVersion + '/sobjects/Sample_Order_vod__c', orderData);
    }

    /**
     * Gets custom object record
     *
     * @param {string} objectName - Object API name
     * @param {string} recordId - Record ID
     * @returns {object} Response with record details
     */
    function getCustomObject(objectName, recordId) {
        if (!objectName) {
            return response.validationError('objectName', 'Object name is required', handler, 'getCustomObject');
        }

        if (!recordId) {
            return response.validationError('recordId', 'Record ID is required', handler, 'getCustomObject');
        }

        return makeAuthenticatedRequest('GET', '/services/data/' + apiVersion + '/sobjects/' + objectName + '/' + recordId);
    }

    /**
     * Creates custom object record
     *
     * @param {string} objectName - Object API name
     * @param {object} recordData - Record data
     * @returns {object} Response with created record ID
     */
    function createCustomObject(objectName, recordData) {
        if (!objectName) {
            return response.validationError('objectName', 'Object name is required', handler, 'createCustomObject');
        }

        if (!recordData) {
            return response.validationError('recordData', 'Record data is required', handler, 'createCustomObject');
        }

        return makeAuthenticatedRequest('POST', '/services/data/' + apiVersion + '/sobjects/' + objectName, recordData);
    }

    /**
     * Updates custom object record
     *
     * @param {string} objectName - Object API name
     * @param {string} recordId - Record ID
     * @param {object} recordData - Updated record data
     * @returns {object} Response
     */
    function updateCustomObject(objectName, recordId, recordData) {
        if (!objectName) {
            return response.validationError('objectName', 'Object name is required', handler, 'updateCustomObject');
        }

        if (!recordId) {
            return response.validationError('recordId', 'Record ID is required', handler, 'updateCustomObject');
        }

        return makeAuthenticatedRequest('PATCH', '/services/data/' + apiVersion + '/sobjects/' + objectName + '/' + recordId, recordData);
    }

    /**
     * Deletes record
     *
     * @param {string} objectName - Object API name
     * @param {string} recordId - Record ID
     * @returns {object} Response
     */
    function deleteRecord(objectName, recordId) {
        if (!objectName) {
            return response.validationError('objectName', 'Object name is required', handler, 'deleteRecord');
        }

        if (!recordId) {
            return response.validationError('recordId', 'Record ID is required', handler, 'deleteRecord');
        }

        return makeAuthenticatedRequest('DELETE', '/services/data/' + apiVersion + '/sobjects/' + objectName + '/' + recordId);
    }

    // Public API - Veeva CRM specific methods
    this.query = query;
    this.getAccount = getAccount;
    this.createAccount = createAccount;
    this.updateAccount = updateAccount;
    this.getContact = getContact;
    this.createContact = createContact;
    this.createCall = createCall;
    this.getCall = getCall;
    this.createSampleOrder = createSampleOrder;
    this.getCustomObject = getCustomObject;
    this.createCustomObject = createCustomObject;
    this.updateCustomObject = updateCustomObject;
    this.deleteRecord = deleteRecord;

    // Token management methods
    this.getToken = getToken;
    this.refreshToken = refreshToken;
    this.clearTokenCache = clearTokenCache;

    // Base HTTP methods (for advanced use)
    this.get = base.get;
    this.post = base.post;
    this.put = base.put;
    this.patch = base.patch;
    this.remove = base.remove;
}

// ============================================================================
// OMEGAFRAMEWORK MODULE REGISTRATION
// ============================================================================
if (typeof OmegaFramework !== 'undefined' && typeof OmegaFramework.register === 'function') {
    OmegaFramework.register('VeevaCRMIntegration', {
        dependencies: ['ResponseWrapper', 'ConnectionHandler', 'BaseIntegration'],
        blockKey: 'OMG_FW_VeevaCRMIntegration',
        factory: function(responseWrapper, connectionHandler, baseIntegrationFactory, config) {
            // Note: VeevaCRMIntegration currently uses traditional instantiation pattern
            // TODO: Implement internal OAuth2 password grant authentication
            return new VeevaCRMIntegration(config);
        }
    });
}

</script>
