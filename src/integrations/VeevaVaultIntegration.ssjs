<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * VeevaVaultIntegration - Veeva Vault API Integration
 *
 * Manages documents, metadata, and workflows in Veeva Vault.
 * Uses Bearer token authentication (session-based).
 *
 * Supports two initialization modes:
 * 1. String parameter: Credential name from CredentialStore (recommended)
 *    Example: new VeevaVaultIntegration('VeevaVaultTestAmerHP')
 * 2. Object parameter: Direct config object
 *    Example: new VeevaVaultIntegration({ username: 'user', password: 'pass', baseUrl: '...', authUrl: '...' })
 *
 * CredentialStore field mapping (when using credential name):
 * - credentials.username → config.username
 * - credentials.password → config.password
 * - credentials.baseUrl → config.baseUrl
 * - credentials.tokenEndpoint → config.authUrl (Veeva Vault authentication endpoint)
 *
 * @version 1.0.0
 * @author OmegaFramework Team
 */
function VeevaVaultIntegration(vaultConfig, connectionInstance) {
    var handler = 'VeevaVaultIntegration';
    var response = OmegaFramework.require('ResponseWrapper', {});
    var config = {};

    // ====================================================================
    // INITIALIZATION MODE DETECTION
    // ====================================================================

    if (typeof vaultConfig === 'string') {
        // MODE 1: Load from CredentialStore (Production)
        var integrationName = vaultConfig;

        // Lazy-load CredentialStore only when needed
        if (!__OmegaFramework.loaded['CredentialStore']) {
            Platform.Function.ContentBlockByName("OMG_FW_CredentialStore");
        }

        // Get credentials from CredentialStore
        // IMPORTANT: Use create() not require() to get a fresh instance
        var credStore = OmegaFramework.create('CredentialStore', {
            integrationName: integrationName
        });
        var credResult = credStore.getCredentials();

        if (!credResult.success) {
            throw new Error('Failed to load credentials for "' + integrationName + '": ' + credResult.error.message);
        }

        // Validate AuthType
        if (credResult.data.authType !== 'Basic') {
            throw new Error(
                'Invalid AuthType: Integration "' + integrationName +
                '" has AuthType "' + credResult.data.authType +
                '" but VeevaVaultIntegration requires "Basic"'
            );
        }

        // Map credentials to config
        // Field mapping: TokenEndpoint → authUrl (where Veeva Vault auth happens)
        config = {
            username: credResult.data.username,
            password: credResult.data.password,
            baseUrl: credResult.data.baseUrl,
            authUrl: credResult.data.tokenEndpoint || (credResult.data.baseUrl + '/api/v24.1/auth')
        };

    } else if (typeof vaultConfig === 'object' && vaultConfig !== null) {
        // MODE 2: Direct config (Development/Testing)
        config = vaultConfig;

    } else {
        throw new Error('Invalid parameter: expected string (integration name) or object (config)');
    }

    // ====================================================================
    // INITIALIZATION - Same for both modes
    // ====================================================================

    // Initialize base integration and connection handler
    var connection = connectionInstance || OmegaFramework.require('ConnectionHandler', {});

    var base = OmegaFramework.create('BaseIntegration', {
        integrationName: handler,
        integrationConfig: config
    });

    // ====================================================================
    // VEEVA VAULT BEARER TOKEN AUTHENTICATION (Internal)
    // ====================================================================

    // Store session token internally
    var sessionToken = null;

    /**
     * Authenticates with Veeva Vault and obtains session token
     * @private
     * @returns {object} Response with session token info
     */
    function authenticate() {
        try {
            // Veeva Vault authentication requires application/x-www-form-urlencoded
            // NOT application/json like most REST APIs
            var authPayload = 'username=' + encodeURIComponent(config.username) +
                              '&password=' + encodeURIComponent(config.password);

            // Make authentication request using authUrl from config
            // authUrl comes from credentials.tokenEndpoint when using CredentialStore
            var authEndpoint = config.authUrl || (config.baseUrl + '/api/v24.1/auth');

            // Use request() with form-urlencoded content type
            var httpResult = connection.request(
                'POST',
                authEndpoint,
                'application/x-www-form-urlencoded',
                authPayload,
                { 'Accept': 'application/json' }
            );

            if (!httpResult.success) {
                return httpResult;
            }

            // Parse Veeva Vault auth response
            var authData = httpResult.data.parsedContent;

            // Fallback manual parsing if needed
            if (!authData && httpResult.data.content) {
                try {
                    authData = Platform.Function.ParseJSON(String(httpResult.data.content));
                } catch (parseEx) {
                    return response.error(
                        'Failed to parse Veeva Vault auth response: ' + parseEx.message,
                        handler,
                        'authenticate',
                        { response: httpResult.data.content }
                    );
                }
            }

            // Check for successful authentication
            if (!authData || authData.responseStatus !== 'SUCCESS') {
                return response.error(
                    'Veeva Vault authentication failed: ' + (authData.errors ? authData.errors[0].message : 'Unknown error'),
                    handler,
                    'authenticate',
                    { response: httpResult.data.content, parsedContent: authData }
                );
            }

            if (!authData.sessionId) {
                return response.error(
                    'Veeva Vault auth response missing sessionId',
                    handler,
                    'authenticate',
                    { response: httpResult.data.content, parsedContent: authData }
                );
            }

            // Store session token
            sessionToken = authData.sessionId;

            var tokenInfo = {
                sessionId: authData.sessionId,
                userId: authData.userId || null,
                vaultId: authData.vaultId || null,
                obtainedAt: new Date().getTime()
            };

            return response.success(tokenInfo, handler, 'authenticate');

        } catch (ex) {
            return response.error(
                'Failed to authenticate with Veeva Vault: ' + (ex.message || ex.toString()),
                handler,
                'authenticate',
                { exception: ex.toString() }
            );
        }
    }

    /**
     * Gets session token, authenticating if necessary
     *
     * @returns {object} Response with session token
     */
    function getSessionToken() {
        // If token exists, return it
        if (sessionToken) {
            return response.success({ sessionId: sessionToken }, handler, 'getSessionToken');
        }

        // No token, authenticate
        var authResult = authenticate();
        if (!authResult.success) {
            return authResult;
        }

        return response.success({ sessionId: sessionToken }, handler, 'getSessionToken');
    }

    /**
     * Clears the session token (forces re-authentication on next request)
     *
     * @returns {object} Response
     */
    function clearSession() {
        sessionToken = null;
        return response.success({ cleared: true }, handler, 'clearSession');
    }

    /**
     * Makes authenticated REST request to Veeva Vault
     * @private
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request data
     * @param {object} options - Request options
     * @returns {object} Response
     */
    function makeAuthenticatedRequest(method, endpoint, data, options) {
        // Get valid session token
        var tokenResult = getSessionToken();
        if (!tokenResult.success) {
            return tokenResult;
        }

        var token = tokenResult.data.sessionId;

        // Build headers with Bearer token authentication
        var headers = {
            'Authorization': token, // Veeva Vault uses session token directly (not "Bearer {token}")
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

        // Build URL
        var url = config.baseUrl;

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

        var result = connection.request(method, url, data, headers);

        // If authentication error, clear token and retry once
        if (!result.success && result.data && result.data.httpCode === 401) {
            clearSession();

            // Retry with fresh authentication
            var retryTokenResult = getSessionToken();
            if (!retryTokenResult.success) {
                return retryTokenResult;
            }

            headers['Authorization'] = retryTokenResult.data.sessionId;
            result = connection.request(method, url, data, headers);
        }

        return result;
    }

    /**
     * Gets Vault metadata
     *
     * @returns {object} Response with vault metadata
     */
    function getVaultMetadata() {
        return makeAuthenticatedRequest('GET', '/api/v21.1/vaultinformation');
    }

    /**
     * Gets document by ID
     *
     * @param {string} documentId - Document ID
     * @returns {object} Response with document details
     */
    function getDocument(documentId) {
        if (!documentId) {
            return response.validationError('documentId', 'Document ID is required', handler, 'getDocument');
        }

        return makeAuthenticatedRequest('GET', '/api/v21.1/objects/documents/' + documentId);
    }

    /**
     * Creates new document
     *
     * @param {object} documentData - Document data
     * @returns {object} Response with created document ID
     */
    function createDocument(documentData) {
        if (!documentData || !documentData.name__v) {
            return response.validationError('name__v', 'Document name is required', handler, 'createDocument');
        }

        if (!documentData.type__v) {
            return response.validationError('type__v', 'Document type is required', handler, 'createDocument');
        }

        return makeAuthenticatedRequest('POST', '/api/v21.1/objects/documents', documentData);
    }

    /**
     * Updates document
     *
     * @param {string} documentId - Document ID
     * @param {object} documentData - Updated document data
     * @returns {object} Response
     */
    function updateDocument(documentId, documentData) {
        if (!documentId) {
            return response.validationError('documentId', 'Document ID is required', handler, 'updateDocument');
        }

        return makeAuthenticatedRequest('PUT', '/api/v21.1/objects/documents/' + documentId, documentData);
    }

    /**
     * Deletes document
     *
     * @param {string} documentId - Document ID
     * @returns {object} Response
     */
    function deleteDocument(documentId) {
        if (!documentId) {
            return response.validationError('documentId', 'Document ID is required', handler, 'deleteDocument');
        }

        return makeAuthenticatedRequest('DELETE', '/api/v21.1/objects/documents/' + documentId);
    }

    /**
     * Executes VQL query
     *
     * @param {string} vql - VQL query string
     * @returns {object} Response with query results
     */
    function executeQuery(vql) {
        if (!vql) {
            return response.validationError('vql', 'VQL query is required', handler, 'executeQuery');
        }

        return makeAuthenticatedRequest('POST', '/api/v21.1/query', { q: vql });
    }

    /**
     * Gets document versions
     *
     * @param {string} documentId - Document ID
     * @returns {object} Response with version list
     */
    function getDocumentVersions(documentId) {
        if (!documentId) {
            return response.validationError('documentId', 'Document ID is required', handler, 'getDocumentVersions');
        }

        return makeAuthenticatedRequest('GET', '/api/v21.1/objects/documents/' + documentId + '/versions');
    }

    /**
     * Downloads document file
     *
     * @param {string} documentId - Document ID
     * @param {string} versionId - Version ID (optional, uses latest if not provided)
     * @returns {object} Response with file data
     */
    function downloadDocument(documentId, versionId) {
        if (!documentId) {
            return response.validationError('documentId', 'Document ID is required', handler, 'downloadDocument');
        }

        var endpoint = '/api/v21.1/objects/documents/' + documentId;
        if (versionId) {
            endpoint += '/versions/' + versionId;
        }
        endpoint += '/file';

        return makeAuthenticatedRequest('GET', endpoint);
    }

    /**
     * Gets document renditions
     *
     * @param {string} documentId - Document ID
     * @param {string} versionId - Version ID
     * @returns {object} Response with renditions list
     */
    function getDocumentRenditions(documentId, versionId) {
        if (!documentId) {
            return response.validationError('documentId', 'Document ID is required', handler, 'getDocumentRenditions');
        }

        var endpoint = '/api/v21.1/objects/documents/' + documentId;
        if (versionId) {
            endpoint += '/versions/' + versionId;
        }
        endpoint += '/renditions';

        return makeAuthenticatedRequest('GET', endpoint);
    }

    /**
     * Gets picklist values for a field
     *
     * @param {string} objectName - Object name (e.g., 'documents')
     * @param {string} fieldName - Field name
     * @returns {object} Response with picklist values
     */
    function getPicklistValues(objectName, fieldName) {
        if (!objectName) {
            return response.validationError('objectName', 'Object name is required', handler, 'getPicklistValues');
        }

        if (!fieldName) {
            return response.validationError('fieldName', 'Field name is required', handler, 'getPicklistValues');
        }

        return makeAuthenticatedRequest('GET', '/api/v21.1/metadata/vobjects/' + objectName + '/properties/' + fieldName);
    }

    /**
     * Gets object metadata
     *
     * @param {string} objectName - Object name
     * @returns {object} Response with object metadata
     */
    function getObjectMetadata(objectName) {
        if (!objectName) {
            return response.validationError('objectName', 'Object name is required', handler, 'getObjectMetadata');
        }

        return makeAuthenticatedRequest('GET', '/api/v21.1/metadata/vobjects/' + objectName);
    }

    /**
     * Initiates document workflow
     *
     * @param {string} documentId - Document ID
     * @param {string} workflowName - Workflow name
     * @returns {object} Response
     */
    function initiateWorkflow(documentId, workflowName) {
        if (!documentId) {
            return response.validationError('documentId', 'Document ID is required', handler, 'initiateWorkflow');
        }

        if (!workflowName) {
            return response.validationError('workflowName', 'Workflow name is required', handler, 'initiateWorkflow');
        }

        return makeAuthenticatedRequest('POST', '/api/v21.1/objects/documents/' + documentId + '/versions/latest/lifecycle_actions/' + workflowName);
    }

    /**
     * Gets document relationships
     *
     * @param {string} documentId - Document ID
     * @returns {object} Response with relationships
     */
    function getDocumentRelationships(documentId) {
        if (!documentId) {
            return response.validationError('documentId', 'Document ID is required', handler, 'getDocumentRelationships');
        }

        return makeAuthenticatedRequest('GET', '/api/v21.1/objects/documents/' + documentId + '/versions/latest/relationships');
    }

    /**
     * Creates document relationship
     *
     * @param {string} documentId - Source document ID
     * @param {object} relationshipData - Relationship data
     * @returns {object} Response
     */
    function createDocumentRelationship(documentId, relationshipData) {
        if (!documentId) {
            return response.validationError('documentId', 'Document ID is required', handler, 'createDocumentRelationship');
        }

        return makeAuthenticatedRequest('POST', '/api/v21.1/objects/documents/' + documentId + '/versions/latest/relationships', relationshipData);
    }

    // Public API - Veeva Vault specific methods
    this.getVaultMetadata = getVaultMetadata;
    this.getDocument = getDocument;
    this.createDocument = createDocument;
    this.updateDocument = updateDocument;
    this.deleteDocument = deleteDocument;
    this.executeQuery = executeQuery;
    this.getDocumentVersions = getDocumentVersions;
    this.downloadDocument = downloadDocument;
    this.getDocumentRenditions = getDocumentRenditions;
    this.getPicklistValues = getPicklistValues;
    this.getObjectMetadata = getObjectMetadata;
    this.initiateWorkflow = initiateWorkflow;
    this.getDocumentRelationships = getDocumentRelationships;
    this.createDocumentRelationship = createDocumentRelationship;

    // Authentication methods
    this.authenticate = authenticate;
    this.getSessionToken = getSessionToken;
    this.clearSession = clearSession;

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
    OmegaFramework.register('VeevaVaultIntegration', {
        dependencies: ['ResponseWrapper', 'ConnectionHandler', 'BaseIntegration'],
        blockKey: 'OMG_FW_VeevaVaultIntegration',
        factory: function(responseWrapper, connectionHandler, baseIntegrationFactory, config) {
            // Support two modes:
            // 1. config.integrationName (string) - loads from CredentialStore
            // 2. config object with full credentials - direct configuration
            var vaultConfig = config.integrationName || config;
            return new VeevaVaultIntegration(vaultConfig);
        }
    });
}

</script>
