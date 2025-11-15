<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * AssetHandler - Content Builder asset management
 *
 * Handles all Content Builder asset operations including images, documents,
 * blocks, templates, and other content types.
 *
 * @version 2.0.0
 * @author OmegaFramework
 */
function AssetHandler(sfmcIntegrationInstance) {
    var handler = 'AssetHandler';
    var response = new ResponseWrapper();
    var sfmc = sfmcIntegrationInstance;

    function validateIntegration() {
        if (!sfmc) {
            return response.error('SFMCIntegration instance is required', handler, 'validateIntegration');
        }
        return null;
    }

    /**
     * Lists all assets with optional filtering
     *
     * @param {object} options - Query options {pageSize, page, assetType, filter}
     * @returns {object} Response with asset list
     */
    function list(options) {
        var validation = validateIntegration();
        if (validation) return validation;

        return sfmc.listAssets(options);
    }

    /**
     * Gets asset by ID
     *
     * @param {number} assetId - Asset ID
     * @returns {object} Response with asset details
     */
    function get(assetId) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!assetId) {
            return response.validationError('assetId', 'Asset ID is required', handler, 'get');
        }

        return sfmc.getAsset(assetId);
    }

    /**
     * Creates new asset
     *
     * @param {object} assetData - Asset configuration
     * @returns {object} Response with created asset
     */
    function create(assetData) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!assetData || !assetData.name) {
            return response.validationError('name', 'Asset name is required', handler, 'create');
        }

        if (!assetData.assetType) {
            return response.validationError('assetType', 'Asset type is required', handler, 'create');
        }

        return sfmc.createAsset(assetData);
    }

    /**
     * Updates existing asset
     *
     * @param {number} assetId - Asset ID
     * @param {object} assetData - Updated asset data
     * @returns {object} Response
     */
    function update(assetId, assetData) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!assetId) {
            return response.validationError('assetId', 'Asset ID is required', handler, 'update');
        }

        return sfmc.updateAsset(assetId, assetData);
    }

    /**
     * Deletes asset
     *
     * @param {number} assetId - Asset ID
     * @returns {object} Response
     */
    function remove(assetId) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!assetId) {
            return response.validationError('assetId', 'Asset ID is required', handler, 'remove');
        }

        return sfmc.deleteAsset(assetId);
    }

    /**
     * Gets assets by type
     *
     * @param {string} assetType - Asset type (e.g., 'htmlemail', 'template-email')
     * @param {object} options - Additional query options
     * @returns {object} Response with filtered assets
     */
    function getByType(assetType, options) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!assetType) {
            return response.validationError('assetType', 'Asset type is required', handler, 'getByType');
        }

        options = options || {};
        options.assetType = assetType;

        return list(options);
    }

    /**
     * Searches assets by name
     *
     * @param {string} searchTerm - Search term
     * @param {object} options - Additional options
     * @returns {object} Response with matching assets
     */
    function search(searchTerm, options) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!searchTerm) {
            return response.validationError('searchTerm', 'Search term is required', handler, 'search');
        }

        options = options || {};
        options.filter = options.filter || {};
        options.filter.property = 'name';
        options.filter.simpleOperator = 'like';
        options.filter.value = searchTerm;

        return list(options);
    }

    // Public API
    this.list = list;
    this.get = get;
    this.create = create;
    this.update = update;
    this.remove = remove;
    this.delete = remove;
    this.getByType = getByType;
    this.search = search;
}

</script>
