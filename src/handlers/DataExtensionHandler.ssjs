<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * DataExtensionHandler - Comprehensive Data Extension operations using WSProxy
 *
 * Uses WSProxy (native SOAP API) for all operations - faster and more reliable
 * than REST API, with no OAuth authentication required.
 *
 * Features:
 * - Full CRUD operations (Create, Read, Update, Delete)
 * - Upsert support
 * - Batch operations for bulk data handling
 * - Schema/metadata retrieval
 * - Cross-BU support (default to current BU)
 * - Filtering with simple and complex filters
 *
 * @version 4.0.0
 * @author OmegaFramework
 */
function DataExtensionHandler(responseWrapperInstance, wsProxyWrapperInstance) {
    var handler = 'DataExtensionHandler';
    var response = responseWrapperInstance;
    var wsProxy = wsProxyWrapperInstance;

    // ========================================================================
    // VALIDATION
    // ========================================================================

    function validateWSProxy() {
        if (!wsProxy) {
            return response.error('WSProxyWrapper instance is required', handler, 'validateWSProxy');
        }
        return null;
    }

    function validateDataExtensionKey(dataExtensionKey, operation) {
        if (!dataExtensionKey) {
            return response.validationError('dataExtensionKey', 'Data Extension key is required', handler, operation);
        }
        return null;
    }

    // ========================================================================
    // CROSS-BU SUPPORT
    // ========================================================================

    /**
     * Sets the Business Unit for cross-BU operations
     *
     * @param {number} mid - Member ID (Business Unit ID)
     * @returns {object} Response
     */
    function setBusinessUnit(mid) {
        var validation = validateWSProxy();
        if (validation) return validation;

        return wsProxy.setClientId(mid);
    }

    /**
     * Resets to current Business Unit
     *
     * @returns {object} Response
     */
    function resetBusinessUnit() {
        var validation = validateWSProxy();
        if (validation) return validation;

        return wsProxy.resetClientId();
    }

    /**
     * Gets the current Business Unit MID
     *
     * @returns {number|null} Current MID or null if using current BU
     */
    function getCurrentBusinessUnit() {
        var validation = validateWSProxy();
        if (validation) return null;

        return wsProxy.getCurrentMid();
    }

    // ========================================================================
    // METADATA OPERATIONS
    // ========================================================================

    /**
     * Checks if a Data Extension exists
     *
     * @param {string} dataExtensionKey - DE customer key
     * @returns {object} Response with exists: boolean
     */
    function exists(dataExtensionKey) {
        var validation = validateWSProxy();
        if (validation) return validation;

        validation = validateDataExtensionKey(dataExtensionKey, 'exists');
        if (validation) return validation;

        var filter = wsProxy.createFilter('CustomerKey', 'equals', dataExtensionKey);
        var result = wsProxy.retrieve('DataExtension', ['CustomerKey', 'Name'], filter);

        if (result.success) {
            return response.success({
                exists: result.data.count > 0,
                dataExtensionKey: dataExtensionKey
            }, handler, 'exists');
        }

        return result;
    }

    /**
     * Gets Data Extension schema/metadata
     *
     * @param {string} dataExtensionKey - DE customer key
     * @returns {object} Response with DE metadata
     */
    function getSchema(dataExtensionKey) {
        var validation = validateWSProxy();
        if (validation) return validation;

        validation = validateDataExtensionKey(dataExtensionKey, 'getSchema');
        if (validation) return validation;

        var filter = wsProxy.createFilter('CustomerKey', 'equals', dataExtensionKey);
        var properties = [
            'ObjectID',
            'CustomerKey',
            'Name',
            'Description',
            'IsSendable',
            'IsTestable',
            'SendableDataExtensionField.Name',
            'SendableSubscriberField.Name',
            'CategoryID',
            'CreatedDate',
            'ModifiedDate'
        ];

        var result = wsProxy.retrieve('DataExtension', properties, filter);

        if (result.success && result.data.count > 0) {
            var de = result.data.items[0];
            return response.success({
                objectId: de.ObjectID,
                customerKey: de.CustomerKey,
                name: de.Name,
                description: de.Description,
                isSendable: de.IsSendable === true || de.IsSendable === 'true',
                isTestable: de.IsTestable === true || de.IsTestable === 'true',
                sendableField: de.SendableDataExtensionField ? de.SendableDataExtensionField.Name : null,
                subscriberField: de.SendableSubscriberField ? de.SendableSubscriberField.Name : null,
                categoryId: de.CategoryID,
                createdDate: de.CreatedDate,
                modifiedDate: de.ModifiedDate
            }, handler, 'getSchema');
        } else if (result.success && result.data.count === 0) {
            return response.notFoundError('Data Extension: ' + dataExtensionKey, handler, 'getSchema');
        }

        return result;
    }

    /**
     * Gets Data Extension fields/columns
     *
     * @param {string} dataExtensionKey - DE customer key
     * @returns {object} Response with fields array
     */
    function getFields(dataExtensionKey) {
        var validation = validateWSProxy();
        if (validation) return validation;

        validation = validateDataExtensionKey(dataExtensionKey, 'getFields');
        if (validation) return validation;

        var filter = wsProxy.createFilter('DataExtension.CustomerKey', 'equals', dataExtensionKey);
        var properties = [
            'ObjectID',
            'Name',
            'FieldType',
            'MaxLength',
            'IsPrimaryKey',
            'IsRequired',
            'DefaultValue',
            'Ordinal',
            'Scale'
        ];

        var result = wsProxy.retrieve('DataExtensionField', properties, filter);

        if (result.success) {
            var fields = [];
            for (var i = 0; i < result.data.items.length; i++) {
                var field = result.data.items[i];
                fields.push({
                    name: field.Name,
                    type: field.FieldType,
                    maxLength: field.MaxLength,
                    isPrimaryKey: field.IsPrimaryKey === true || field.IsPrimaryKey === 'true',
                    isRequired: field.IsRequired === true || field.IsRequired === 'true',
                    defaultValue: field.DefaultValue,
                    ordinal: field.Ordinal,
                    scale: field.Scale
                });
            }

            // Sort by ordinal
            fields.sort(function(a, b) {
                return (a.ordinal || 0) - (b.ordinal || 0);
            });

            return response.success({
                fields: fields,
                count: fields.length,
                dataExtensionKey: dataExtensionKey
            }, handler, 'getFields');
        }

        return result;
    }

    /**
     * Gets primary key field names for a Data Extension
     *
     * @param {string} dataExtensionKey - DE customer key
     * @returns {object} Response with primaryKeys array
     */
    function getPrimaryKeys(dataExtensionKey) {
        var fieldsResult = getFields(dataExtensionKey);

        if (fieldsResult.success) {
            var primaryKeys = [];
            for (var i = 0; i < fieldsResult.data.fields.length; i++) {
                if (fieldsResult.data.fields[i].isPrimaryKey) {
                    primaryKeys.push(fieldsResult.data.fields[i].name);
                }
            }

            return response.success({
                primaryKeys: primaryKeys,
                count: primaryKeys.length,
                dataExtensionKey: dataExtensionKey
            }, handler, 'getPrimaryKeys');
        }

        return fieldsResult;
    }

    // ========================================================================
    // CRUD OPERATIONS
    // ========================================================================

    /**
     * Queries Data Extension rows
     *
     * @param {string} dataExtensionKey - DE customer key
     * @param {object} options - Query options
     * @param {Array} options.fields - Fields to retrieve (default: all)
     * @param {object} options.filter - Filter object {property, operator, value}
     * @param {Array} options.filters - Multiple filters with logical operator
     * @returns {object} Response with rows
     */
    function query(dataExtensionKey, options) {
        var validation = validateWSProxy();
        if (validation) return validation;

        validation = validateDataExtensionKey(dataExtensionKey, 'query');
        if (validation) return validation;

        options = options || {};

        // Get fields if not specified
        var fieldsToRetrieve = options.fields;
        if (!fieldsToRetrieve || fieldsToRetrieve.length === 0) {
            var fieldsResult = getFields(dataExtensionKey);
            if (fieldsResult.success) {
                fieldsToRetrieve = [];
                for (var i = 0; i < fieldsResult.data.fields.length; i++) {
                    fieldsToRetrieve.push(fieldsResult.data.fields[i].name);
                }
            } else {
                return fieldsResult;
            }
        }

        // Build filter
        var filter = null;
        if (options.filter) {
            filter = wsProxy.createFilter(
                options.filter.property,
                options.filter.operator || 'equals',
                options.filter.value
            );
        } else if (options.filters && options.filters.length > 0) {
            filter = buildComplexFilter(options.filters, options.logicalOperator || 'AND');
        }

        // Create DataExtensionObject filter with DE CustomerKey
        var deFilter = wsProxy.createFilter('_CustomObjectKey', 'equals', dataExtensionKey);

        // Combine with any additional filter
        if (filter) {
            filter = wsProxy.createComplexFilter(deFilter, 'AND', filter);
        } else {
            filter = deFilter;
        }

        var result = wsProxy.retrieve('DataExtensionObject', fieldsToRetrieve, filter);

        if (result.success) {
            return response.success({
                items: result.data.items,
                count: result.data.count,
                dataExtensionKey: dataExtensionKey
            }, handler, 'query');
        }

        return result;
    }

    /**
     * Retrieves a single row by primary key
     *
     * @param {string} dataExtensionKey - DE customer key
     * @param {object} primaryKeyValues - Object with primary key field:value pairs
     * @param {Array} fields - Optional fields to retrieve
     * @returns {object} Response with single row or not found
     */
    function getRow(dataExtensionKey, primaryKeyValues, fields) {
        var validation = validateWSProxy();
        if (validation) return validation;

        validation = validateDataExtensionKey(dataExtensionKey, 'getRow');
        if (validation) return validation;

        if (!primaryKeyValues || typeof primaryKeyValues !== 'object') {
            return response.validationError('primaryKeyValues', 'Primary key values object is required', handler, 'getRow');
        }

        // Build filters from primary key values
        var filters = [];
        for (var key in primaryKeyValues) {
            if (primaryKeyValues.hasOwnProperty(key)) {
                filters.push({
                    property: key,
                    operator: 'equals',
                    value: primaryKeyValues[key]
                });
            }
        }

        var result = query(dataExtensionKey, {
            fields: fields,
            filters: filters,
            logicalOperator: 'AND'
        });

        if (result.success) {
            if (result.data.count > 0) {
                return response.success({
                    row: result.data.items[0],
                    found: true
                }, handler, 'getRow');
            } else {
                return response.success({
                    row: null,
                    found: false
                }, handler, 'getRow');
            }
        }

        return result;
    }

    /**
     * Inserts a row into Data Extension
     *
     * @param {string} dataExtensionKey - DE customer key
     * @param {object} rowData - Row data as field:value object
     * @returns {object} Response
     */
    function insertRow(dataExtensionKey, rowData) {
        var validation = validateWSProxy();
        if (validation) return validation;

        validation = validateDataExtensionKey(dataExtensionKey, 'insertRow');
        if (validation) return validation;

        if (!rowData || typeof rowData !== 'object') {
            return response.validationError('rowData', 'Row data object is required', handler, 'insertRow');
        }

        var deObject = buildDEObject(dataExtensionKey, rowData);
        var result = wsProxy.create('DataExtensionObject', deObject);

        if (result.success) {
            return response.success({
                inserted: true,
                rowData: rowData
            }, handler, 'insertRow');
        }

        return result;
    }

    /**
     * Updates a row in Data Extension
     *
     * @param {string} dataExtensionKey - DE customer key
     * @param {object} rowData - Row data with primary key(s) and fields to update
     * @returns {object} Response
     */
    function updateRow(dataExtensionKey, rowData) {
        var validation = validateWSProxy();
        if (validation) return validation;

        validation = validateDataExtensionKey(dataExtensionKey, 'updateRow');
        if (validation) return validation;

        if (!rowData || typeof rowData !== 'object') {
            return response.validationError('rowData', 'Row data object is required', handler, 'updateRow');
        }

        var deObject = buildDEObject(dataExtensionKey, rowData);
        var result = wsProxy.update('DataExtensionObject', deObject);

        if (result.success) {
            return response.success({
                updated: true,
                rowData: rowData
            }, handler, 'updateRow');
        }

        return result;
    }

    /**
     * Upserts a row (insert or update)
     *
     * @param {string} dataExtensionKey - DE customer key
     * @param {object} rowData - Row data with primary key(s)
     * @returns {object} Response
     */
    function upsertRow(dataExtensionKey, rowData) {
        var validation = validateWSProxy();
        if (validation) return validation;

        validation = validateDataExtensionKey(dataExtensionKey, 'upsertRow');
        if (validation) return validation;

        if (!rowData || typeof rowData !== 'object') {
            return response.validationError('rowData', 'Row data object is required', handler, 'upsertRow');
        }

        // Try update first
        var updateResult = updateRow(dataExtensionKey, rowData);

        if (updateResult.success) {
            updateResult.data.operation = 'update';
            return updateResult;
        }

        // If update failed (row doesn't exist), try insert
        var insertResult = insertRow(dataExtensionKey, rowData);

        if (insertResult.success) {
            insertResult.data.operation = 'insert';
        }

        return insertResult;
    }

    /**
     * Deletes a row from Data Extension
     *
     * @param {string} dataExtensionKey - DE customer key
     * @param {object} primaryKeyValues - Primary key field:value pairs
     * @returns {object} Response
     */
    function deleteRow(dataExtensionKey, primaryKeyValues) {
        var validation = validateWSProxy();
        if (validation) return validation;

        validation = validateDataExtensionKey(dataExtensionKey, 'deleteRow');
        if (validation) return validation;

        if (!primaryKeyValues || typeof primaryKeyValues !== 'object') {
            return response.validationError('primaryKeyValues', 'Primary key values are required', handler, 'deleteRow');
        }

        var deObject = buildDEObject(dataExtensionKey, primaryKeyValues);
        var result = wsProxy.delete('DataExtensionObject', deObject);

        if (result.success) {
            return response.success({
                deleted: true,
                primaryKeyValues: primaryKeyValues
            }, handler, 'deleteRow');
        }

        return result;
    }

    // ========================================================================
    // BATCH OPERATIONS
    // ========================================================================

    /**
     * Inserts multiple rows in batch
     *
     * @param {string} dataExtensionKey - DE customer key
     * @param {Array} rows - Array of row data objects
     * @returns {object} Response with batch results
     */
    function insertBatch(dataExtensionKey, rows) {
        var validation = validateWSProxy();
        if (validation) return validation;

        validation = validateDataExtensionKey(dataExtensionKey, 'insertBatch');
        if (validation) return validation;

        if (!rows || rows.length === 0) {
            return response.validationError('rows', 'Rows array is required and cannot be empty', handler, 'insertBatch');
        }

        var deObjects = [];
        for (var i = 0; i < rows.length; i++) {
            deObjects.push(buildDEObject(dataExtensionKey, rows[i]));
        }

        var result = wsProxy.create('DataExtensionObject', deObjects);

        if (result.success) {
            return response.success({
                inserted: true,
                count: rows.length,
                results: result.data.results
            }, handler, 'insertBatch');
        }

        return result;
    }

    /**
     * Updates multiple rows in batch
     *
     * @param {string} dataExtensionKey - DE customer key
     * @param {Array} rows - Array of row data objects with primary keys
     * @returns {object} Response with batch results
     */
    function updateBatch(dataExtensionKey, rows) {
        var validation = validateWSProxy();
        if (validation) return validation;

        validation = validateDataExtensionKey(dataExtensionKey, 'updateBatch');
        if (validation) return validation;

        if (!rows || rows.length === 0) {
            return response.validationError('rows', 'Rows array is required and cannot be empty', handler, 'updateBatch');
        }

        var deObjects = [];
        for (var i = 0; i < rows.length; i++) {
            deObjects.push(buildDEObject(dataExtensionKey, rows[i]));
        }

        var result = wsProxy.update('DataExtensionObject', deObjects);

        if (result.success) {
            return response.success({
                updated: true,
                count: rows.length,
                results: result.data.results
            }, handler, 'updateBatch');
        }

        return result;
    }

    /**
     * Upserts multiple rows in batch
     *
     * @param {string} dataExtensionKey - DE customer key
     * @param {Array} rows - Array of row data objects
     * @returns {object} Response with batch results
     */
    function upsertBatch(dataExtensionKey, rows) {
        var validation = validateWSProxy();
        if (validation) return validation;

        validation = validateDataExtensionKey(dataExtensionKey, 'upsertBatch');
        if (validation) return validation;

        if (!rows || rows.length === 0) {
            return response.validationError('rows', 'Rows array is required and cannot be empty', handler, 'upsertBatch');
        }

        // WSProxy doesn't have native upsert, so we batch process
        var insertResults = [];
        var updateResults = [];
        var errors = [];

        for (var i = 0; i < rows.length; i++) {
            var result = upsertRow(dataExtensionKey, rows[i]);
            if (result.success) {
                if (result.data.operation === 'insert') {
                    insertResults.push(rows[i]);
                } else {
                    updateResults.push(rows[i]);
                }
            } else {
                errors.push({
                    row: rows[i],
                    error: result.error
                });
            }
        }

        return response.success({
            upserted: true,
            inserted: insertResults.length,
            updated: updateResults.length,
            errors: errors.length,
            total: rows.length,
            errorDetails: errors
        }, handler, 'upsertBatch');
    }

    /**
     * Deletes multiple rows in batch
     *
     * @param {string} dataExtensionKey - DE customer key
     * @param {Array} primaryKeyValuesList - Array of primary key value objects
     * @returns {object} Response with batch results
     */
    function deleteBatch(dataExtensionKey, primaryKeyValuesList) {
        var validation = validateWSProxy();
        if (validation) return validation;

        validation = validateDataExtensionKey(dataExtensionKey, 'deleteBatch');
        if (validation) return validation;

        if (!primaryKeyValuesList || primaryKeyValuesList.length === 0) {
            return response.validationError('primaryKeyValuesList', 'Primary key values array is required', handler, 'deleteBatch');
        }

        var deObjects = [];
        for (var i = 0; i < primaryKeyValuesList.length; i++) {
            deObjects.push(buildDEObject(dataExtensionKey, primaryKeyValuesList[i]));
        }

        var result = wsProxy.delete('DataExtensionObject', deObjects);

        if (result.success) {
            return response.success({
                deleted: true,
                count: primaryKeyValuesList.length,
                results: result.data.results
            }, handler, 'deleteBatch');
        }

        return result;
    }

    /**
     * Clears all rows from a Data Extension
     *
     * WARNING: This deletes ALL data from the DE!
     *
     * @param {string} dataExtensionKey - DE customer key
     * @returns {object} Response
     */
    function clearRows(dataExtensionKey) {
        var validation = validateWSProxy();
        if (validation) return validation;

        validation = validateDataExtensionKey(dataExtensionKey, 'clearRows');
        if (validation) return validation;

        // Use SSJS DataExtension.Init for clear operation (more efficient)
        try {
            var de = DataExtension.Init(dataExtensionKey);
            if (de) {
                var rows = de.Rows.Retrieve();
                var count = rows ? rows.length : 0;

                if (count > 0) {
                    // Get primary keys to delete rows
                    var pkResult = getPrimaryKeys(dataExtensionKey);
                    if (!pkResult.success || pkResult.data.primaryKeys.length === 0) {
                        return response.error('Cannot determine primary keys for deletion', handler, 'clearRows');
                    }

                    var primaryKeys = pkResult.data.primaryKeys;
                    var deleteKeys = [];

                    for (var i = 0; i < rows.length; i++) {
                        var pkValues = {};
                        for (var j = 0; j < primaryKeys.length; j++) {
                            pkValues[primaryKeys[j]] = rows[i][primaryKeys[j]];
                        }
                        deleteKeys.push(pkValues);
                    }

                    // Delete in batches
                    return deleteBatch(dataExtensionKey, deleteKeys);
                }

                return response.success({
                    cleared: true,
                    rowsDeleted: 0
                }, handler, 'clearRows');
            }
        } catch (ex) {
            return response.error('Failed to clear rows: ' + (ex.message || String(ex)), handler, 'clearRows');
        }

        return response.error('Data Extension not found or not accessible', handler, 'clearRows');
    }

    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================

    /**
     * Builds a DataExtensionObject for WSProxy operations
     * @private
     */
    function buildDEObject(dataExtensionKey, rowData) {
        var properties = [];

        for (var field in rowData) {
            if (rowData.hasOwnProperty(field)) {
                properties.push({
                    Name: field,
                    Value: rowData[field]
                });
            }
        }

        return {
            CustomerKey: dataExtensionKey,
            Properties: properties
        };
    }

    /**
     * Builds complex filter from array of filter conditions
     * @private
     */
    function buildComplexFilter(filters, logicalOperator) {
        if (!filters || filters.length === 0) {
            return null;
        }

        if (filters.length === 1) {
            return wsProxy.createFilter(
                filters[0].property,
                filters[0].operator || 'equals',
                filters[0].value
            );
        }

        var leftFilter = wsProxy.createFilter(
            filters[0].property,
            filters[0].operator || 'equals',
            filters[0].value
        );

        for (var i = 1; i < filters.length; i++) {
            var rightFilter = wsProxy.createFilter(
                filters[i].property,
                filters[i].operator || 'equals',
                filters[i].value
            );
            leftFilter = wsProxy.createComplexFilter(leftFilter, logicalOperator, rightFilter);
        }

        return leftFilter;
    }

    // ========================================================================
    // CONVENIENCE METHODS
    // ========================================================================

    /**
     * Counts rows in a Data Extension
     *
     * @param {string} dataExtensionKey - DE customer key
     * @param {object} filter - Optional filter
     * @returns {object} Response with count
     */
    function count(dataExtensionKey, filter) {
        var result = query(dataExtensionKey, { filter: filter });

        if (result.success) {
            return response.success({
                count: result.data.count,
                dataExtensionKey: dataExtensionKey
            }, handler, 'count');
        }

        return result;
    }

    /**
     * Searches rows using LIKE operator
     *
     * @param {string} dataExtensionKey - DE customer key
     * @param {string} field - Field to search
     * @param {string} searchValue - Value to search for (supports % wildcards)
     * @param {Array} fieldsToRetrieve - Optional fields to retrieve
     * @returns {object} Response with matching rows
     */
    function search(dataExtensionKey, field, searchValue, fieldsToRetrieve) {
        return query(dataExtensionKey, {
            fields: fieldsToRetrieve,
            filter: {
                property: field,
                operator: 'like',
                value: searchValue
            }
        });
    }

    // ========================================================================
    // FILTER OPERATORS (exported for convenience)
    // ========================================================================
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

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    // Cross-BU Support
    this.setBusinessUnit = setBusinessUnit;
    this.resetBusinessUnit = resetBusinessUnit;
    this.getCurrentBusinessUnit = getCurrentBusinessUnit;

    // Metadata Operations
    this.exists = exists;
    this.getSchema = getSchema;
    this.getFields = getFields;
    this.getPrimaryKeys = getPrimaryKeys;

    // CRUD Operations
    this.query = query;
    this.getRow = getRow;
    this.insertRow = insertRow;
    this.updateRow = updateRow;
    this.upsertRow = upsertRow;
    this.deleteRow = deleteRow;

    // Batch Operations
    this.insertBatch = insertBatch;
    this.updateBatch = updateBatch;
    this.upsertBatch = upsertBatch;
    this.deleteBatch = deleteBatch;
    this.clearRows = clearRows;

    // Convenience Methods
    this.count = count;
    this.search = search;

    // Constants
    this.OPERATORS = OPERATORS;
}

// ============================================================================
// OMEGAFRAMEWORK MODULE REGISTRATION
// ============================================================================
if (typeof OmegaFramework !== 'undefined' && typeof OmegaFramework.register === 'function') {
    OmegaFramework.register('DataExtensionHandler', {
        dependencies: ['ResponseWrapper', 'WSProxyWrapper'],
        blockKey: 'OMG_FW_DataExtensionHandler',
        factory: function(responseWrapperInstance, wsProxyWrapperInstance, config) {
            return new DataExtensionHandler(responseWrapperInstance, wsProxyWrapperInstance);
        }
    });
}

</script>
