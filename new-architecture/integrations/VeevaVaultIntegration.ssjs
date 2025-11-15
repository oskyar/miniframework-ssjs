<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * VeevaVaultIntegration - Veeva Vault API Integration
 *
 * Manages documents, metadata, and workflows in Veeva Vault.
 * Uses Bearer token authentication (session-based).
 *
 * @version 2.0.0
 * @author OmegaFramework
 */
function VeevaVaultIntegration(vaultConfig, connectionInstance) {
    var handler = 'VeevaVaultIntegration';
    var response = new ResponseWrapper();
    var config = vaultConfig || {};

    // Initialize base integration
    var connection = connectionInstance || new ConnectionHandler();
    var base = new BaseIntegration(handler, config, null, connection);

    // Setup Bearer token authentication
    if (config.auth && config.auth.token) {
        var bearerAuth = new BearerAuthStrategy({
            token: config.auth.token
        });
        base.setAuthStrategy(bearerAuth);
    }

    /**
     * Gets Vault metadata
     *
     * @returns {object} Response with vault metadata
     */
    function getVaultMetadata() {
        return base.get('/api/v21.1/vaultinformation');
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

        return base.get('/api/v21.1/objects/documents/' + documentId);
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

        return base.post('/api/v21.1/objects/documents', documentData);
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

        return base.put('/api/v21.1/objects/documents/' + documentId, documentData);
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

        return base.delete('/api/v21.1/objects/documents/' + documentId);
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

        return base.post('/api/v21.1/query', { q: vql });
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

        return base.get('/api/v21.1/objects/documents/' + documentId + '/versions');
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

        return base.get(endpoint);
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

        return base.get(endpoint);
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

        return base.get('/api/v21.1/metadata/vobjects/' + objectName + '/properties/' + fieldName);
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

        return base.get('/api/v21.1/metadata/vobjects/' + objectName);
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

        return base.post('/api/v21.1/objects/documents/' + documentId + '/versions/latest/lifecycle_actions/' + workflowName);
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

        return base.get('/api/v21.1/objects/documents/' + documentId + '/versions/latest/relationships');
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

        return base.post('/api/v21.1/objects/documents/' + documentId + '/versions/latest/relationships', relationshipData);
    }

    // Public API
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

    // Base HTTP methods
    this.get = base.get;
    this.post = base.post;
    this.put = base.put;
    this.delete = base.delete;
}

</script>
