<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * VeevaVaultIntegration - Veeva Vault API integration
 *
 * Provides methods for interacting with Veeva Vault API:
 * - Document management
 * - Metadata retrieval
 * - Query execution
 *
 * @version 1.0.0
 * @see https://developer.veevavault.com/api/
 */

function VeevaVaultIntegration(vaultConfig, connectionInstance) {
    // Initialize base integration
    var base = new BaseIntegration('VeevaVaultIntegration', vaultConfig, null, connectionInstance);

    // Extract base properties
    var handler = base.handler;
    var response = base.response;
    var connection = base.connection;
    var config = base.config;

    // Setup OAuth2 authentication for Veeva Vault
    if (config.auth && config.auth.tokenUrl) {
        var authStrategy = new OAuth2AuthStrategy({
            tokenUrl: config.auth.tokenUrl,
            clientId: config.auth.clientId,
            clientSecret: config.auth.clientSecret,
            scope: config.auth.scope,
            grantType: 'client_credentials'
        }, connection);

        base.setAuthStrategy(authStrategy);
    }

    /**
     * Gets Vault metadata
     * @returns {Object} Response with Vault metadata
     */
    function getVaultMetadata() {
        try {
            return base.get('/api/' + config.apiVersion + '/metadata/vobjects');
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getVaultMetadata');
        }
    }

    /**
     * Gets document by ID
     * @param {String} documentId - Document ID
     * @returns {Object} Response with document data
     */
    function getDocument(documentId) {
        try {
            if (!documentId) {
                return response.validationError('documentId', 'Document ID is required', handler, 'getDocument');
            }

            var endpoint = '/api/' + config.apiVersion + '/objects/documents/' + documentId;
            return base.get(endpoint);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getDocument');
        }
    }

    /**
     * Creates a new document
     * @param {Object} documentData - Document data
     * @returns {Object} Response with created document
     */
    function createDocument(documentData) {
        try {
            if (!documentData) {
                return response.validationError('documentData', 'Document data is required', handler, 'createDocument');
            }

            var endpoint = '/api/' + config.apiVersion + '/objects/documents';
            return base.post(endpoint, documentData);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'createDocument');
        }
    }

    /**
     * Updates document
     * @param {String} documentId - Document ID
     * @param {Object} documentData - Updated document data
     * @returns {Object} Response
     */
    function updateDocument(documentId, documentData) {
        try {
            if (!documentId) {
                return response.validationError('documentId', 'Document ID is required', handler, 'updateDocument');
            }

            if (!documentData) {
                return response.validationError('documentData', 'Document data is required', handler, 'updateDocument');
            }

            var endpoint = '/api/' + config.apiVersion + '/objects/documents/' + documentId;
            return base.put(endpoint, documentData);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'updateDocument');
        }
    }

    /**
     * Executes VQL query
     * @param {String} vqlQuery - VQL query string
     * @returns {Object} Response with query results
     */
    function executeQuery(vqlQuery) {
        try {
            if (!vqlQuery) {
                return response.validationError('vqlQuery', 'VQL query is required', handler, 'executeQuery');
            }

            var endpoint = '/api/' + config.apiVersion + '/query';
            return base.post(endpoint, {q: vqlQuery});

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'executeQuery');
        }
    }

    /**
     * Gets picklist values
     * @param {String} objectName - Object name
     * @param {String} fieldName - Field name
     * @returns {Object} Response with picklist values
     */
    function getPicklistValues(objectName, fieldName) {
        try {
            if (!objectName || !fieldName) {
                return response.validationError('params', 'Object name and field name are required', handler, 'getPicklistValues');
            }

            var endpoint = '/api/' + config.apiVersion + '/metadata/vobjects/' + objectName + '/fields/' + fieldName;
            return base.get(endpoint);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getPicklistValues');
        }
    }

    // Public API - Veeva Vault specific methods
    this.getVaultMetadata = getVaultMetadata;
    this.getDocument = getDocument;
    this.createDocument = createDocument;
    this.updateDocument = updateDocument;
    this.executeQuery = executeQuery;
    this.getPicklistValues = getPicklistValues;

    // Expose base methods
    this.get = base.get;
    this.post = base.post;
    this.put = base.put;
    this.remove = base.remove;
}

</script>
