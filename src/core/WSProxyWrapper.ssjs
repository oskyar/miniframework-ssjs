<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * WSProxyWrapper - Native SOAP API wrapper for SFMC operations
 *
 * Provides a clean interface to WSProxy for Data Extension and other SOAP operations.
 * WSProxy is faster than REST API and doesn't require OAuth authentication.
 *
 * Supported Objects:
 * - DataExtension
 * - DataExtensionObject (rows)
 * - DataExtensionField
 * - And other SOAP API objects
 *
 * @version 1.0.0
 * @author OmegaFramework
 */
function WSProxyWrapper(responseWrapperInstance) {
    var handler = 'WSProxyWrapper';
    var response = responseWrapperInstance;
    var proxy = null;
    var currentMid = null;

    /**
     * Initialize WSProxy instance
     * @private
     */
    function initProxy() {
        if (!proxy) {
            proxy = new Script.Util.WSProxy();
        }
        return proxy;
    }

    /**
     * Sets the client MID for cross-BU operations
     *
     * @param {number} mid - Member ID (Business Unit ID)
     * @returns {object} Response
     */
    function setClientId(mid) {
        try {
            initProxy();
            if (mid) {
                proxy.setClientId({ ID: mid });
                currentMid = mid;
            }
            return response.success({ mid: mid || 'current' }, handler, 'setClientId');
        } catch (ex) {
            return response.error('Failed to set client ID: ' + (ex.message || String(ex)), handler, 'setClientId');
        }
    }

    /**
     * Resets to current BU (clears cross-BU setting)
     *
     * @returns {object} Response
     */
    function resetClientId() {
        try {
            proxy = new Script.Util.WSProxy();
            currentMid = null;
            return response.success({ mid: 'current' }, handler, 'resetClientId');
        } catch (ex) {
            return response.error('Failed to reset client ID: ' + (ex.message || String(ex)), handler, 'resetClientId');
        }
    }

    /**
     * Retrieves objects from SFMC SOAP API
     *
     * @param {string} objectType - SOAP object type (e.g., 'DataExtension', 'DataExtensionObject')
     * @param {Array} properties - Properties to retrieve
     * @param {object} filter - SimpleFilterPart or ComplexFilterPart
     * @param {object} options - Additional options (QueryAllAccounts, etc.)
     * @returns {object} Response with results
     */
    function retrieve(objectType, properties, filter, options) {
        try {
            initProxy();

            var reqOptions = options || {};
            var retrieveRequest = {
                ObjectType: objectType,
                Properties: properties
            };

            if (filter) {
                retrieveRequest.Filter = filter;
            }

            // Handle continuation (pagination)
            var allResults = [];
            var moreData = true;
            var requestId = null;

            while (moreData) {
                var result;
                if (requestId) {
                    result = proxy.getNextBatch(objectType, requestId);
                } else {
                    result = proxy.retrieve(objectType, properties, filter);
                }

                if (result && result.Status === 'OK') {
                    if (result.Results && result.Results.length > 0) {
                        for (var i = 0; i < result.Results.length; i++) {
                            allResults.push(result.Results[i]);
                        }
                    }
                    moreData = result.HasMoreRows === true;
                    requestId = result.RequestID;
                } else if (result && result.Status === 'Error') {
                    return response.error(
                        'Retrieve failed: ' + (result.StatusMessage || 'Unknown error'),
                        handler,
                        'retrieve',
                        { objectType: objectType, status: result.Status }
                    );
                } else {
                    moreData = false;
                }

                // Prevent infinite loops - max 100 pages
                if (allResults.length > 250000) {
                    moreData = false;
                }
            }

            return response.success({
                items: allResults,
                count: allResults.length,
                objectType: objectType
            }, handler, 'retrieve');

        } catch (ex) {
            return response.error(
                'Retrieve error: ' + (ex.message || String(ex)),
                handler,
                'retrieve',
                { objectType: objectType }
            );
        }
    }

    /**
     * Creates objects in SFMC via SOAP API
     *
     * @param {string} objectType - SOAP object type
     * @param {object|Array} objects - Object(s) to create
     * @param {object} options - Additional options
     * @returns {object} Response
     */
    function create(objectType, objects, options) {
        try {
            initProxy();

            var items = Array.isArray ?
                (Array.isArray(objects) ? objects : [objects]) :
                (objects.length !== undefined ? objects : [objects]);

            var result = proxy.createBatch(objectType, items);

            if (result && result.Status === 'OK') {
                return response.success({
                    created: true,
                    count: items.length,
                    results: result.Results
                }, handler, 'create');
            } else {
                var errorMsg = 'Create failed';
                if (result && result.Results && result.Results.length > 0) {
                    errorMsg = result.Results[0].StatusMessage || errorMsg;
                }
                return response.error(errorMsg, handler, 'create', {
                    status: result ? result.Status : 'Unknown',
                    results: result ? result.Results : null
                });
            }

        } catch (ex) {
            return response.error(
                'Create error: ' + (ex.message || String(ex)),
                handler,
                'create',
                { objectType: objectType }
            );
        }
    }

    /**
     * Updates objects in SFMC via SOAP API
     *
     * @param {string} objectType - SOAP object type
     * @param {object|Array} objects - Object(s) to update
     * @param {object} options - Additional options
     * @returns {object} Response
     */
    function update(objectType, objects, options) {
        try {
            initProxy();

            var items = Array.isArray ?
                (Array.isArray(objects) ? objects : [objects]) :
                (objects.length !== undefined ? objects : [objects]);

            var result = proxy.updateBatch(objectType, items);

            if (result && result.Status === 'OK') {
                return response.success({
                    updated: true,
                    count: items.length,
                    results: result.Results
                }, handler, 'update');
            } else {
                var errorMsg = 'Update failed';
                if (result && result.Results && result.Results.length > 0) {
                    errorMsg = result.Results[0].StatusMessage || errorMsg;
                }
                return response.error(errorMsg, handler, 'update', {
                    status: result ? result.Status : 'Unknown',
                    results: result ? result.Results : null
                });
            }

        } catch (ex) {
            return response.error(
                'Update error: ' + (ex.message || String(ex)),
                handler,
                'update',
                { objectType: objectType }
            );
        }
    }

    /**
     * Deletes objects from SFMC via SOAP API
     *
     * @param {string} objectType - SOAP object type
     * @param {object|Array} objects - Object(s) to delete (with keys)
     * @param {object} options - Additional options
     * @returns {object} Response
     */
    function deleteObjects(objectType, objects, options) {
        try {
            initProxy();

            var items = Array.isArray ?
                (Array.isArray(objects) ? objects : [objects]) :
                (objects.length !== undefined ? objects : [objects]);

            var result = proxy.deleteBatch(objectType, items);

            if (result && result.Status === 'OK') {
                return response.success({
                    deleted: true,
                    count: items.length,
                    results: result.Results
                }, handler, 'delete');
            } else {
                var errorMsg = 'Delete failed';
                if (result && result.Results && result.Results.length > 0) {
                    errorMsg = result.Results[0].StatusMessage || errorMsg;
                }
                return response.error(errorMsg, handler, 'delete', {
                    status: result ? result.Status : 'Unknown',
                    results: result ? result.Results : null
                });
            }

        } catch (ex) {
            return response.error(
                'Delete error: ' + (ex.message || String(ex)),
                handler,
                'delete',
                { objectType: objectType }
            );
        }
    }

    /**
     * Performs an action on objects (used for special operations)
     *
     * @param {string} objectType - SOAP object type
     * @param {object|Array} objects - Object(s) for action
     * @param {string} action - Action name
     * @param {object} options - Additional options
     * @returns {object} Response
     */
    function perform(objectType, objects, action, options) {
        try {
            initProxy();

            var items = Array.isArray ?
                (Array.isArray(objects) ? objects : [objects]) :
                (objects.length !== undefined ? objects : [objects]);

            var result = proxy.performBatch(objectType, items, action);

            if (result && result.Status === 'OK') {
                return response.success({
                    performed: true,
                    action: action,
                    count: items.length,
                    results: result.Results
                }, handler, 'perform');
            } else {
                return response.error('Perform failed', handler, 'perform', {
                    status: result ? result.Status : 'Unknown',
                    results: result ? result.Results : null
                });
            }

        } catch (ex) {
            return response.error(
                'Perform error: ' + (ex.message || String(ex)),
                handler,
                'perform',
                { objectType: objectType, action: action }
            );
        }
    }

    /**
     * Creates a simple filter part for retrieve operations
     *
     * @param {string} property - Property name to filter on
     * @param {string} operator - Comparison operator
     * @param {*} value - Value to compare
     * @returns {object} SimpleFilterPart
     */
    function createFilter(property, operator, value) {
        return {
            Property: property,
            SimpleOperator: operator,
            Value: value
        };
    }

    /**
     * Creates a complex filter part combining multiple filters
     *
     * @param {object} leftFilter - Left operand filter
     * @param {string} logicalOperator - 'AND' or 'OR'
     * @param {object} rightFilter - Right operand filter
     * @returns {object} ComplexFilterPart
     */
    function createComplexFilter(leftFilter, logicalOperator, rightFilter) {
        return {
            LeftOperand: leftFilter,
            LogicalOperator: logicalOperator,
            RightOperand: rightFilter
        };
    }

    /**
     * Gets the current MID setting
     *
     * @returns {number|null} Current MID or null if using current BU
     */
    function getCurrentMid() {
        return currentMid;
    }

    // Filter Operators constants
    var OPERATORS = {
        EQUALS: 'equals',
        NOT_EQUALS: 'notEquals',
        GREATER_THAN: 'greaterThan',
        GREATER_THAN_OR_EQUAL: 'greaterThanOrEqual',
        LESS_THAN: 'lessThan',
        LESS_THAN_OR_EQUAL: 'lessThanOrEqual',
        IS_NULL: 'isNull',
        IS_NOT_NULL: 'isNotNull',
        BETWEEN: 'between',
        IN: 'IN',
        LIKE: 'like'
    };

    // Public API
    this.setClientId = setClientId;
    this.resetClientId = resetClientId;
    this.getCurrentMid = getCurrentMid;
    this.retrieve = retrieve;
    this.create = create;
    this.update = update;
    this.remove = deleteObjects;
    this.perform = perform;
    this.createFilter = createFilter;
    this.createComplexFilter = createComplexFilter;
    this.OPERATORS = OPERATORS;
}

// ============================================================================
// OMEGAFRAMEWORK MODULE REGISTRATION
// ============================================================================
if (typeof OmegaFramework !== 'undefined' && typeof OmegaFramework.register === 'function') {
    OmegaFramework.register('WSProxyWrapper', {
        dependencies: ['ResponseWrapper'],
        blockKey: 'OMG_FW_WSProxyWrapper',
        factory: function(responseWrapperInstance, config) {
            return new WSProxyWrapper(responseWrapperInstance);
        }
    });
}

</script>
