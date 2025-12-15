<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * DataExtensionHandler - Comprehensive Data Extension operations using WSProxy
 *
 * Uses WSProxy (native SOAP API) for ALL operations - faster and more reliable
 * than REST API, with no OAuth authentication required.
 *
 * Key fix for "Unable to retrieve security descriptor" error:
 * DataExtensionObject CRUD operations require proper CustomerKey + Properties/Keys structure.
 *
 * Based on official documentation:
 * - Create: https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/ssjs_WSProxy_create.html
 * - Update: https://www.ssjsdocs.xyz/shared/batches/update.html
 * - Delete: https://www.ssjsdocs.xyz/shared/batches/delete.html
 *
 * Features:
 * - Full CRUD operations (Create, Read, Update, Delete)
 * - Upsert support (UpdateAdd)
 * - Batch operations for bulk data handling
 * - Schema/metadata retrieval via WSProxy
 * - Cross-BU support (default to current BU)
 * - No REST API / OAuth dependency
 * - Scalable retrieve with pagination support:
 *   - retrieve(): flexible options with filter, fields, limit
 *   - retrieveAll(): get ALL records with auto-pagination
 *   - retrieveNext(): continue fetching next page
 *   - getRow(): single record by primary key
 *
 * @version 4.5.0
 * @author OmegaFramework
 */
function DataExtensionHandler(responseWrapperInstance, wsProxyWrapperInstance) {
    var handler = 'DataExtensionHandler';
    var response = responseWrapperInstance;
    var wsProxy = wsProxyWrapperInstance;

    // Cache for DE ObjectIDs (performance optimization)
    var objectIdCache = {};

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

    /**
     * Gets the ObjectID for a Data Extension (required for CRUD operations)
     * Caches the result for performance
     * @private
     */
    function getObjectId(dataExtensionKey) {
        if (objectIdCache[dataExtensionKey]) {
            return { success: true, objectId: objectIdCache[dataExtensionKey] };
        }

        var filter = wsProxy.createFilter('CustomerKey', 'equals', dataExtensionKey);
        var result = wsProxy.retrieve('DataExtension', ['ObjectID', 'CustomerKey'], filter);

        if (result.success && result.data.count > 0) {
            objectIdCache[dataExtensionKey] = result.data.items[0].ObjectID;
            return { success: true, objectId: result.data.items[0].ObjectID };
        }

        return { success: false, error: 'Data Extension not found: ' + dataExtensionKey };
    }

    /**
     * Clears the ObjectID cache (useful for cross-BU operations)
     * @private
     */
    function clearCache() {
        objectIdCache = {};
    }

    /**
     * Converts a plain object to WSProxy Properties array format
     * @private
     */
    function toPropertiesArray(obj) {
        var result = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                result.push({ Name: key, Value: obj[key] });
            }
        }
        return result;
    }

    /**
     * Converts a plain object to WSProxy Keys array format (for delete)
     * @private
     */
    function toKeysArray(obj) {
        var result = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                result.push({ Name: key, Value: obj[key] });
            }
        }
        return result;
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
    // METADATA OPERATIONS (using WSProxy - more complete)
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
    // READ OPERATIONS (using WSProxy with pagination support)
    // ========================================================================

    /**
     * Retrieves Data Extension rows with flexible options and pagination support
     *
     * @param {string} dataExtensionKey - DE customer key
     * @param {object} options - Retrieve options
     * @param {Array} options.fields - Fields to retrieve (default: all)
     * @param {object} options.filter - Single filter object {property, operator, value}
     * @param {Array} options.filters - Multiple filters with logical operator
     * @param {string} options.logicalOperator - 'AND' or 'OR' for multiple filters (default: 'AND')
     * @param {number} options.limit - Maximum records to retrieve (optional, for partial retrieval)
     * @param {string} options.continueRequest - RequestID from previous call to get next page
     * @returns {object} Response with items, count, hasMoreRows, and requestId for pagination
     */
    function retrieve(dataExtensionKey, options) {
        var validation = validateWSProxy();
        if (validation) return validation;

        validation = validateDataExtensionKey(dataExtensionKey, 'retrieve');
        if (validation) return validation;

        options = options || {};

        try {
            // Initialize WSProxy directly for pagination control
            var proxy = new Script.Util.WSProxy();

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
                filter = {
                    Property: options.filter.property,
                    SimpleOperator: options.filter.operator || 'equals',
                    Value: options.filter.value
                };
            } else if (options.filters && options.filters.length > 0) {
                // Build complex filter directly with native WSProxy format
                filter = buildNativeComplexFilter(options.filters, options.logicalOperator || 'AND');
            }

            // Create DataExtensionObject filter with DE CustomerKey
            var deFilter = {
                Property: '_CustomObjectKey',
                SimpleOperator: 'equals',
                Value: dataExtensionKey
            };

            // Combine with any additional filter
            if (filter) {
                filter = {
                    LeftOperand: deFilter,
                    LogicalOperator: 'AND',
                    RightOperand: filter
                };
            } else {
                filter = deFilter;
            }

            var allResults = [];
            var result;
            var hasMoreRows = false;
            var requestId = null;
            var limit = options.limit || 0; // 0 means no limit for this call

            // If continuing from previous request
            if (options.continueRequest) {
                result = proxy.getNextBatch('DataExtensionObject', options.continueRequest);
            } else {
                result = proxy.retrieve('DataExtensionObject', fieldsToRetrieve, filter);
            }

            if (result && result.Status == 'OK') {
                if (result.Results && result.Results.length > 0) {
                    // Convert WSProxy results to plain objects
                    for (var i = 0; i < result.Results.length; i++) {
                        var item = result.Results[i];
                        var row = {};
                        if (item.Properties && item.Properties.Property) {
                            var props = item.Properties.Property;
                            for (var j = 0; j < props.length; j++) {
                                row[props[j].Name] = props[j].Value;
                            }
                        }
                        allResults.push(row);

                        // Check limit
                        if (limit > 0 && allResults.length >= limit) {
                            break;
                        }
                    }
                }

                hasMoreRows = result.HasMoreRows === true;
                requestId = result.RequestID;

                // If we hit the limit but there's more data in current batch, still mark hasMoreRows
                if (limit > 0 && allResults.length >= limit && result.Results.length > allResults.length) {
                    hasMoreRows = true;
                }

                return response.success({
                    items: allResults,
                    count: allResults.length,
                    hasMoreRows: hasMoreRows,
                    requestId: hasMoreRows ? requestId : null,
                    dataExtensionKey: dataExtensionKey
                }, handler, 'retrieve');

            } else if (result && result.Status == 'Error') {
                return response.error(
                    'Retrieve failed: ' + (result.StatusMessage || 'Unknown error'),
                    handler,
                    'retrieve',
                    { status: result.Status }
                );
            } else {
                // No results
                return response.success({
                    items: [],
                    count: 0,
                    hasMoreRows: false,
                    requestId: null,
                    dataExtensionKey: dataExtensionKey
                }, handler, 'retrieve');
            }

        } catch (ex) {
            return response.error(
                'Retrieve error: ' + (ex.message || String(ex)),
                handler,
                'retrieve',
                { dataExtensionKey: dataExtensionKey }
            );
        }
    }

    /**
     * Retrieves ALL rows from a Data Extension using automatic pagination
     *
     * WARNING: For very large DEs, this may take time and memory!
     * Consider using retrieve() with pagination for large datasets.
     *
     * @param {string} dataExtensionKey - DE customer key
     * @param {Array} fields - Optional fields to retrieve (default: all)
     * @param {object} filter - Optional filter object {property, operator, value}
     * @param {number} maxRecords - Maximum records to retrieve (default: 250000, safety limit)
     * @returns {object} Response with all items
     */
    function retrieveAll(dataExtensionKey, fields, filter, maxRecords) {
        var validation = validateWSProxy();
        if (validation) return validation;

        validation = validateDataExtensionKey(dataExtensionKey, 'retrieveAll');
        if (validation) return validation;

        maxRecords = maxRecords || 250000; // Safety limit

        try {
            var proxy = new Script.Util.WSProxy();
            var allResults = [];

            // Get fields if not specified
            var fieldsToRetrieve = fields;
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
            var wsFilter = null;
            if (filter) {
                wsFilter = {
                    Property: filter.property,
                    SimpleOperator: filter.operator || 'equals',
                    Value: filter.value
                };
            }

            // Create DataExtensionObject filter with DE CustomerKey
            var deFilter = {
                Property: '_CustomObjectKey',
                SimpleOperator: 'equals',
                Value: dataExtensionKey
            };

            // Combine filters
            if (wsFilter) {
                wsFilter = {
                    LeftOperand: deFilter,
                    LogicalOperator: 'AND',
                    RightOperand: wsFilter
                };
            } else {
                wsFilter = deFilter;
            }

            var moreData = true;
            var requestId = null;

            while (moreData) {
                var result;
                if (requestId) {
                    result = proxy.getNextBatch('DataExtensionObject', requestId);
                } else {
                    result = proxy.retrieve('DataExtensionObject', fieldsToRetrieve, wsFilter);
                }

                if (result && result.Status == 'OK') {
                    if (result.Results && result.Results.length > 0) {
                        for (var i = 0; i < result.Results.length; i++) {
                            var item = result.Results[i];
                            var row = {};
                            if (item.Properties && item.Properties.Property) {
                                var props = item.Properties.Property;
                                for (var j = 0; j < props.length; j++) {
                                    row[props[j].Name] = props[j].Value;
                                }
                            }
                            allResults.push(row);
                        }
                    }
                    moreData = result.HasMoreRows === true;
                    requestId = result.RequestID;
                } else if (result && result.Status == 'Error') {
                    return response.error(
                        'RetrieveAll failed: ' + (result.StatusMessage || 'Unknown error'),
                        handler,
                        'retrieveAll',
                        { status: result.Status }
                    );
                } else {
                    moreData = false;
                }

                // Safety limit
                if (allResults.length >= maxRecords) {
                    moreData = false;
                }
            }

            return response.success({
                items: allResults,
                count: allResults.length,
                dataExtensionKey: dataExtensionKey,
                reachedLimit: allResults.length >= maxRecords
            }, handler, 'retrieveAll');

        } catch (ex) {
            return response.error(
                'RetrieveAll error: ' + (ex.message || String(ex)),
                handler,
                'retrieveAll',
                { dataExtensionKey: dataExtensionKey }
            );
        }
    }

    /**
     * Gets the next page of results using a requestId from a previous retrieve call
     *
     * @param {string} dataExtensionKey - DE customer key (for validation/context)
     * @param {string} requestId - RequestID from previous retrieve call
     * @param {Array} fields - Fields to retrieve (should match original request)
     * @returns {object} Response with next page items, hasMoreRows, and new requestId
     */
    function retrieveNext(dataExtensionKey, requestId, fields) {
        if (!requestId) {
            return response.validationError('requestId', 'RequestID is required for pagination', handler, 'retrieveNext');
        }

        return retrieve(dataExtensionKey, {
            fields: fields,
            continueRequest: requestId
        });
    }

    /**
     * Retrieves a single row by primary key using WSProxy
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

        if (!primaryKeyValues || typeof primaryKeyValues != 'object') {
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

        var result = retrieve(dataExtensionKey, {
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
     * @deprecated Use retrieve() instead. Kept for backward compatibility.
     */
    function query(dataExtensionKey, options) {
        return retrieve(dataExtensionKey, options);
    }

    /**
     * Inserts a row into Data Extension using WSProxy createBatch
     *
     * Uses CustomerKey reference for the DataExtensionObject
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

        if (!rowData || typeof rowData != 'object') {
            return response.validationError('rowData', 'Row data object is required', handler, 'insertRow');
        }

        try {
            // Build the DataExtensionObject with CustomerKey reference
            var deObject = {
                CustomerKey: dataExtensionKey,
                Properties: toPropertiesArray(rowData)
            };
            var result = wsProxy.create('DataExtensionObject', deObject);

            if (result.success) {
                return response.success({
                    inserted: true,
                    rowData: rowData
                }, handler, 'insertRow');
            }

            return result;

        } catch (ex) {
            return response.error(
                'Insert failed: ' + (ex.message || String(ex)),
                handler,
                'insertRow',
                { dataExtensionKey: dataExtensionKey }
            );
        }
    }

    /**
     * Updates a row in Data Extension using WSProxy updateBatch
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

        if (!rowData || typeof rowData != 'object') {
            return response.validationError('rowData', 'Row data object is required', handler, 'updateRow');
        }

        try {
            // Build the DataExtensionObject with CustomerKey reference
            var deObject = {
                CustomerKey: dataExtensionKey,
                Properties: toPropertiesArray(rowData)
            };

            var result = wsProxy.update('DataExtensionObject', deObject);

            if (result.success) {
                return response.success({
                    updated: true,
                    rowData: rowData
                }, handler, 'updateRow');
            }

            return result;

        } catch (ex) {
            return response.error(
                'Update failed: ' + (ex.message || String(ex)),
                handler,
                'updateRow',
                { dataExtensionKey: dataExtensionKey }
            );
        }
    }

    /**
     * Upserts a row (insert or update) using WSProxy with SaveAction: UpdateAdd
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

        if (!rowData || typeof rowData != 'object') {
            return response.validationError('rowData', 'Row data object is required', handler, 'upsertRow');
        }

        try {
            // Build the DataExtensionObject with CustomerKey reference
            var deObject = {
                CustomerKey: dataExtensionKey,
                Properties: toPropertiesArray(rowData)
            };

            var result = wsProxy.upsert('DataExtensionObject', deObject);

            if (result.success) {
                return response.success({
                    upserted: true,
                    rowData: rowData
                }, handler, 'upsertRow');
            }

            return result;

        } catch (ex) {
            return response.error(
                'Upsert failed: ' + (ex.message || String(ex)),
                handler,
                'upsertRow',
                { dataExtensionKey: dataExtensionKey }
            );
        }
    }

    /**
     * Deletes a row from Data Extension using WSProxy deleteBatch
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

        if (!primaryKeyValues || typeof primaryKeyValues != 'object') {
            return response.validationError('primaryKeyValues', 'Primary key values are required', handler, 'deleteRow');
        }

        try {
            // Build the DataExtensionObject with CustomerKey and Keys (not Properties!)
            var deObject = {
                CustomerKey: dataExtensionKey,
                Keys: toKeysArray(primaryKeyValues)
            };

            var result = wsProxy.remove('DataExtensionObject', deObject);

            if (result.success) {
                return response.success({
                    deleted: true,
                    primaryKeyValues: primaryKeyValues
                }, handler, 'deleteRow');
            }

            return result;

        } catch (ex) {
            return response.error(
                'Delete failed: ' + (ex.message || String(ex)),
                handler,
                'deleteRow',
                { dataExtensionKey: dataExtensionKey }
            );
        }
    }

    // ========================================================================
    // BATCH OPERATIONS
    // ========================================================================

    /**
     * Inserts multiple rows in batch using WSProxy createBatch
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

        try {
            // Build array of DE objects with correct structure
            var deObjects = [];
            for (var i = 0; i < rows.length; i++) {
                deObjects.push({
                    CustomerKey: dataExtensionKey,
                    Properties: toPropertiesArray(rows[i])
                });
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

        } catch (ex) {
            return response.error(
                'Insert batch failed: ' + (ex.message || String(ex)),
                handler,
                'insertBatch',
                { dataExtensionKey: dataExtensionKey }
            );
        }
    }

    /**
     * Updates multiple rows in batch using WSProxy updateBatch
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

        try {
            // Build array of DE objects with correct structure
            var deObjects = [];
            for (var i = 0; i < rows.length; i++) {
                deObjects.push({
                    CustomerKey: dataExtensionKey,
                    Properties: toPropertiesArray(rows[i])
                });
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

        } catch (ex) {
            return response.error(
                'Update batch failed: ' + (ex.message || String(ex)),
                handler,
                'updateBatch',
                { dataExtensionKey: dataExtensionKey }
            );
        }
    }

    /**
     * Upserts multiple rows in batch using WSProxy with SaveAction: UpdateAdd
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

        try {
            // Build array of DE objects with correct structure
            var deObjects = [];
            for (var i = 0; i < rows.length; i++) {
                deObjects.push({
                    CustomerKey: dataExtensionKey,
                    Properties: toPropertiesArray(rows[i])
                });
            }

            var result = wsProxy.upsert('DataExtensionObject', deObjects);

            if (result.success) {
                return response.success({
                    upserted: true,
                    count: rows.length,
                    results: result.data.results
                }, handler, 'upsertBatch');
            }

            return result;

        } catch (ex) {
            return response.error(
                'Upsert batch failed: ' + (ex.message || String(ex)),
                handler,
                'upsertBatch',
                { dataExtensionKey: dataExtensionKey }
            );
        }
    }

    /**
     * Deletes multiple rows in batch using WSProxy deleteBatch
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

        try {
            // Build array of DE objects with correct structure (Keys, not Properties)
            var deObjects = [];
            for (var i = 0; i < primaryKeyValuesList.length; i++) {
                deObjects.push({
                    CustomerKey: dataExtensionKey,
                    Keys: toKeysArray(primaryKeyValuesList[i])
                });
            }

            var result = wsProxy.remove('DataExtensionObject', deObjects);

            if (result.success) {
                return response.success({
                    deleted: true,
                    count: primaryKeyValuesList.length,
                    results: result.data.results
                }, handler, 'deleteBatch');
            }

            return result;

        } catch (ex) {
            return response.error(
                'Delete batch failed: ' + (ex.message || String(ex)),
                handler,
                'deleteBatch',
                { dataExtensionKey: dataExtensionKey }
            );
        }
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

        // Get all rows
        var queryResult = query(dataExtensionKey, {});
        if (!queryResult.success) {
            return queryResult;
        }

        if (queryResult.data.count === 0) {
            return response.success({
                cleared: true,
                rowsDeleted: 0
            }, handler, 'clearRows');
        }

        // Get primary keys
        var pkResult = getPrimaryKeys(dataExtensionKey);
        if (!pkResult.success || pkResult.data.primaryKeys.length === 0) {
            return response.error('Cannot determine primary keys for deletion', handler, 'clearRows');
        }

        var primaryKeys = pkResult.data.primaryKeys;
        var deleteKeys = [];

        for (var i = 0; i < queryResult.data.items.length; i++) {
            var row = queryResult.data.items[i];
            var pkValues = {};
            for (var j = 0; j < primaryKeys.length; j++) {
                pkValues[primaryKeys[j]] = row[primaryKeys[j]];
            }
            deleteKeys.push(pkValues);
        }

        // Delete all rows
        var deleteResult = deleteBatch(dataExtensionKey, deleteKeys);

        if (deleteResult.success) {
            return response.success({
                cleared: true,
                rowsDeleted: deleteKeys.length
            }, handler, 'clearRows');
        }

        return deleteResult;
    }

    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================

    /**
     * Builds complex filter from array of filter conditions (uses WSProxyWrapper)
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

    /**
     * Builds complex filter in native WSProxy format (for direct proxy.retrieve calls)
     * @private
     */
    function buildNativeComplexFilter(filters, logicalOperator) {
        if (!filters || filters.length === 0) {
            return null;
        }

        if (filters.length === 1) {
            return {
                Property: filters[0].property,
                SimpleOperator: filters[0].operator || 'equals',
                Value: filters[0].value
            };
        }

        var leftFilter = {
            Property: filters[0].property,
            SimpleOperator: filters[0].operator || 'equals',
            Value: filters[0].value
        };

        for (var i = 1; i < filters.length; i++) {
            var rightFilter = {
                Property: filters[i].property,
                SimpleOperator: filters[i].operator || 'equals',
                Value: filters[i].value
            };
            leftFilter = {
                LeftOperand: leftFilter,
                LogicalOperator: logicalOperator,
                RightOperand: rightFilter
            };
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

    // Read Operations (with pagination support)
    this.retrieve = retrieve;           // Main read function with options
    this.retrieveAll = retrieveAll;     // Get ALL records with auto-pagination
    this.retrieveNext = retrieveNext;   // Continue pagination
    this.getRow = getRow;               // Single row by primary key
    this.query = query;                 // @deprecated - alias for retrieve()

    // Write Operations
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
if (typeof OmegaFramework != 'undefined' && typeof OmegaFramework.register === 'function') {
    OmegaFramework.register('DataExtensionHandler', {
        dependencies: ['ResponseWrapper', 'WSProxyWrapper'],
        blockKey: 'OMG_FW_DataExtensionHandler',
        factory: function(responseWrapperInstance, wsProxyWrapperInstance, config) {
            return new DataExtensionHandler(responseWrapperInstance, wsProxyWrapperInstance);
        }
    });
}

</script>
