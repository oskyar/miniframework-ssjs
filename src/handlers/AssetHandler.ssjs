<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * AssetHandler - Content Builder asset management
 *
 * Handles all Content Builder asset operations including images, documents,
 * blocks, templates, and other content types.
 *
 * Supports both Simple Query (GET) and Advanced Query (POST) methods:
 * - Simple Query: Uses $filter, $orderBy, $page, $pagesize, $fields
 * - Advanced Query: Uses POST with complex query object for nested filters
 *
 * @see https://developer.salesforce.com/docs/marketing/marketing-cloud/references/mc_rest_assets/assetSimpleQuery.html
 * @see https://developer.salesforce.com/docs/marketing/marketing-cloud/references/mc_rest_assets/assetAdvancedQuery.html
 *
 * @version 1.0.0
 * @author OmegaFramework Team
 */
function AssetHandler(responseWrapper, sfmcIntegrationInstance) {
    var handler = 'AssetHandler';
    var response = responseWrapper;
    var sfmc = sfmcIntegrationInstance;

    // ========================================================================
    // CONSTANTS - Asset Types
    // ========================================================================
    var ASSET_TYPES = {
        // Images
        AI: 16,
        PSD: 17,
        PNG: 28,
        JPG: 23,
        GIF: 20,
        // Documents
        DOCUMENT: 1,
        // Code
        HTML_BLOCK: 197,
        CODE_SNIPPET: 220,
        CUSTOM_BLOCK: 225,
        // Email
        HTML_EMAIL: 208,
        TEMPLATE_EMAIL: 207,
        TEXT_EMAIL: 209,
        // Templates
        TEMPLATE: 4,
        EMAIL_TEMPLATE: 214
    };

    // Simple Query Operators (for $filter)
    var SIMPLE_OPERATORS = ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'like'];

    // Advanced Query Operators (for POST query)
    var ADVANCED_OPERATORS = [
        'equal', 'notEqual', 'lessThan', 'lessThanOrEqual',
        'greaterThan', 'greaterThanOrEqual', 'like', 'isNull',
        'isNotNull', 'contains', 'mustContain', 'startsWith', 'in'
    ];

    function validateIntegration() {
        if (!sfmc) {
            return response.error('SFMCIntegration instance is required', handler, 'validateIntegration');
        }
        return null;
    }

    // ========================================================================
    // SIMPLE QUERY METHODS (GET /asset/v1/content/assets)
    // ========================================================================

    /**
     * Lists assets using simple query (GET method)
     *
     * @param {object} options - Query options
     * @param {number} options.page - Page number (starts at 1)
     * @param {number} options.pageSize - Results per page (default 50)
     * @param {string} options.orderBy - Sort field and direction (e.g., 'name ASC')
     * @param {string} options.filter - Simple filter string (e.g., 'name like test')
     * @param {string} options.fields - Comma-separated list of fields to return
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
     * @param {string} assetData.name - Asset name (required)
     * @param {object} assetData.assetType - Asset type object with id (required)
     * @param {string} assetData.content - Asset content
     * @param {object} assetData.category - Category object with id
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
     * Gets assets by type using simple query
     *
     * @param {number|string} assetTypeId - Asset type ID or name from ASSET_TYPES
     * @param {object} options - Additional query options (page, pageSize, orderBy)
     * @returns {object} Response with filtered assets
     */
    function getByType(assetTypeId, options) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!assetTypeId) {
            return response.validationError('assetTypeId', 'Asset type is required', handler, 'getByType');
        }

        // Resolve asset type name to ID if string provided
        var typeId = assetTypeId;
        if (typeof assetTypeId === 'string' && ASSET_TYPES[assetTypeId.toUpperCase()]) {
            typeId = ASSET_TYPES[assetTypeId.toUpperCase()];
        }

        options = options || {};
        options.filter = 'assetType.id eq ' + typeId;

        return list(options);
    }

    /**
     * Simple search using GET $filter parameter
     *
     * @param {string} searchTerm - Search term (3-6 characters recommended)
     * @param {object} options - Additional options
     * @param {string} options.property - Property to search (default: 'name')
     * @param {string} options.operator - Operator: eq, neq, like (default: 'like')
     * @param {number} options.page - Page number
     * @param {number} options.pageSize - Results per page
     * @param {string} options.orderBy - Sort order (e.g., 'modifiedDate DESC')
     * @returns {object} Response with matching assets
     */
    function simpleSearch(searchTerm, options) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!searchTerm) {
            return response.validationError('searchTerm', 'Search term is required', handler, 'simpleSearch');
        }

        options = options || {};
        var property = options.property || 'name';
        var operator = options.operator || 'like';

        // Build simple filter string: "property operator value"
        options.filter = property + ' ' + operator + ' ' + searchTerm;

        return list(options);
    }

    // ========================================================================
    // ADVANCED QUERY METHODS (POST /asset/v1/content/assets/query)
    // ========================================================================

    /**
     * Advanced search using POST query endpoint
     * Supports complex nested filters with AND/OR logic
     *
     * @param {object} queryConfig - Advanced query configuration
     * @param {object} queryConfig.query - Query object with filters (required)
     * @param {array} queryConfig.fields - Fields to return (optional)
     * @param {object} queryConfig.page - Pagination {page, pageSize}
     * @param {array} queryConfig.sort - Sort rules [{property, direction}]
     * @returns {object} Response with matching assets
     *
     * @example
     * // Simple single condition
     * advancedSearch({
     *   query: {
     *     property: 'name',
     *     simpleOperator: 'like',
     *     value: 'test'
     *   }
     * });
     *
     * @example
     * // Complex AND condition
     * advancedSearch({
     *   query: {
     *     leftOperand: {
     *       property: 'name',
     *       simpleOperator: 'like',
     *       value: 'test'
     *     },
     *     logicalOperator: 'AND',
     *     rightOperand: {
     *       property: 'assetType.id',
     *       simpleOperator: 'equal',
     *       value: 208
     *     }
     *   },
     *   page: { page: 1, pageSize: 25 },
     *   sort: [{ property: 'modifiedDate', direction: 'DESC' }]
     * });
     */
    function advancedSearch(queryConfig) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!queryConfig || !queryConfig.query) {
            return response.validationError('query', 'Query object is required for advanced search', handler, 'advancedSearch');
        }

        return sfmc.advancedAssetQuery(queryConfig);
    }

    /**
     * Search assets by name using advanced query
     *
     * @param {string} searchTerm - Search term (3-6 chars recommended)
     * @param {object} options - Search options
     * @param {string} options.operator - Operator: equal, like, contains, startsWith (default: 'like')
     * @param {number} options.page - Page number (default: 1)
     * @param {number} options.pageSize - Results per page (default: 50)
     * @param {string} options.sortBy - Sort property (default: 'modifiedDate')
     * @param {string} options.sortDirection - Sort direction: ASC, DESC (default: 'DESC')
     * @param {array} options.fields - Fields to return
     * @returns {object} Response with matching assets
     */
    function search(searchTerm, options) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!searchTerm) {
            return response.validationError('searchTerm', 'Search term is required', handler, 'search');
        }

        options = options || {};

        var queryConfig = {
            query: {
                property: 'name',
                simpleOperator: options.operator || 'like',
                value: searchTerm
            },
            page: {
                page: options.page || 1,
                pageSize: options.pageSize || 50
            }
        };

        // Add sorting if specified
        if (options.sortBy) {
            queryConfig.sort = [{
                property: options.sortBy,
                direction: options.sortDirection || 'DESC'
            }];
        }

        // Add fields if specified
        if (options.fields) {
            queryConfig.fields = options.fields;
        }

        return advancedSearch(queryConfig);
    }

    /**
     * Search with multiple conditions (AND)
     *
     * @param {array} conditions - Array of condition objects
     * @param {string} conditions[].property - Property to filter
     * @param {string} conditions[].operator - Operator (equal, like, contains, etc.)
     * @param {*} conditions[].value - Value to compare
     * @param {object} options - Additional options (page, pageSize, sort, fields)
     * @returns {object} Response with matching assets
     *
     * @example
     * searchWithConditions([
     *   { property: 'name', operator: 'like', value: 'test' },
     *   { property: 'assetType.id', operator: 'equal', value: 208 },
     *   { property: 'status.name', operator: 'equal', value: 'Published' }
     * ], { pageSize: 25 });
     */
    function searchWithConditions(conditions, options) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!conditions || !conditions.length) {
            return response.validationError('conditions', 'At least one condition is required', handler, 'searchWithConditions');
        }

        options = options || {};

        // Build nested AND query from conditions array
        var query = buildNestedQuery(conditions, 'AND');

        var queryConfig = {
            query: query,
            page: {
                page: options.page || 1,
                pageSize: options.pageSize || 50
            }
        };

        if (options.sort) {
            queryConfig.sort = options.sort;
        } else if (options.sortBy) {
            queryConfig.sort = [{
                property: options.sortBy,
                direction: options.sortDirection || 'DESC'
            }];
        }

        if (options.fields) {
            queryConfig.fields = options.fields;
        }

        return advancedSearch(queryConfig);
    }

    /**
     * Search with OR conditions
     *
     * @param {array} conditions - Array of condition objects
     * @param {object} options - Additional options
     * @returns {object} Response with matching assets
     */
    function searchWithOrConditions(conditions, options) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!conditions || !conditions.length) {
            return response.validationError('conditions', 'At least one condition is required', handler, 'searchWithOrConditions');
        }

        options = options || {};

        var query = buildNestedQuery(conditions, 'OR');

        var queryConfig = {
            query: query,
            page: {
                page: options.page || 1,
                pageSize: options.pageSize || 50
            }
        };

        if (options.sort) {
            queryConfig.sort = options.sort;
        }

        if (options.fields) {
            queryConfig.fields = options.fields;
        }

        return advancedSearch(queryConfig);
    }

    /**
     * Builds nested query object from array of conditions
     * @private
     */
    function buildNestedQuery(conditions, logicalOperator) {
        if (conditions.length === 1) {
            return {
                property: conditions[0].property,
                simpleOperator: conditions[0].operator,
                value: conditions[0].value
            };
        }

        // Build nested structure from right to left
        var result = {
            property: conditions[conditions.length - 1].property,
            simpleOperator: conditions[conditions.length - 1].operator,
            value: conditions[conditions.length - 1].value
        };

        for (var i = conditions.length - 2; i >= 0; i--) {
            result = {
                leftOperand: {
                    property: conditions[i].property,
                    simpleOperator: conditions[i].operator,
                    value: conditions[i].value
                },
                logicalOperator: logicalOperator,
                rightOperand: result
            };
        }

        return result;
    }

    /**
     * Get assets by category ID
     *
     * @param {number} categoryId - Category (folder) ID
     * @param {object} options - Additional options
     * @returns {object} Response with assets in category
     */
    function getByCategory(categoryId, options) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!categoryId) {
            return response.validationError('categoryId', 'Category ID is required', handler, 'getByCategory');
        }

        options = options || {};

        return advancedSearch({
            query: {
                property: 'category.id',
                simpleOperator: 'equal',
                value: categoryId
            },
            page: {
                page: options.page || 1,
                pageSize: options.pageSize || 50
            },
            sort: options.sort || [{ property: 'name', direction: 'ASC' }]
        });
    }

    /**
     * Get recently modified assets
     *
     * @param {object} options - Options
     * @param {number} options.pageSize - Number of results (default: 25)
     * @param {number} options.assetTypeId - Filter by asset type ID
     * @returns {object} Response with recent assets
     */
    function getRecent(options) {
        var validation = validateIntegration();
        if (validation) return validation;

        options = options || {};

        var queryConfig = {
            query: {
                property: 'id',
                simpleOperator: 'greaterThan',
                value: 0
            },
            page: {
                page: 1,
                pageSize: options.pageSize || 25
            },
            sort: [{ property: 'modifiedDate', direction: 'DESC' }]
        };

        // Add asset type filter if specified
        if (options.assetTypeId) {
            queryConfig.query = {
                leftOperand: {
                    property: 'assetType.id',
                    simpleOperator: 'equal',
                    value: options.assetTypeId
                },
                logicalOperator: 'AND',
                rightOperand: {
                    property: 'id',
                    simpleOperator: 'greaterThan',
                    value: 0
                }
            };
        }

        return advancedSearch(queryConfig);
    }

    /**
     * Get assets by status
     *
     * @param {string} status - Status name: 'Draft', 'Published', etc.
     * @param {object} options - Additional options
     * @returns {object} Response with assets
     */
    function getByStatus(status, options) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!status) {
            return response.validationError('status', 'Status is required', handler, 'getByStatus');
        }

        options = options || {};

        return advancedSearch({
            query: {
                property: 'status.name',
                simpleOperator: 'equal',
                value: status
            },
            page: {
                page: options.page || 1,
                pageSize: options.pageSize || 50
            },
            sort: options.sort || [{ property: 'modifiedDate', direction: 'DESC' }]
        });
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    // Constants
    this.ASSET_TYPES = ASSET_TYPES;
    this.SIMPLE_OPERATORS = SIMPLE_OPERATORS;
    this.ADVANCED_OPERATORS = ADVANCED_OPERATORS;

    // Basic CRUD
    this.list = list;
    this.get = get;
    this.create = create;
    this.update = update;
    this.remove = remove;

    // Simple Query Methods
    this.getByType = getByType;
    this.simpleSearch = simpleSearch;

    // Advanced Query Methods
    this.advancedSearch = advancedSearch;
    this.search = search;
    this.searchWithConditions = searchWithConditions;
    this.searchWithOrConditions = searchWithOrConditions;

    // Convenience Methods
    this.getByCategory = getByCategory;
    this.getRecent = getRecent;
    this.getByStatus = getByStatus;
}

// ============================================================================
// OMEGAFRAMEWORK MODULE REGISTRATION
// ============================================================================
if (typeof OmegaFramework !== 'undefined' && typeof OmegaFramework.register === 'function') {
    OmegaFramework.register('AssetHandler', {
        dependencies: ['ResponseWrapper', 'SFMCIntegration'],
        blockKey: 'OMG_FW_AssetHandler',
        factory: function(responseWrapperInstance, sfmcIntegrationInstance, config) {
            return new AssetHandler(responseWrapperInstance, sfmcIntegrationInstance);
        }
    });
}

</script>
