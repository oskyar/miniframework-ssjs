<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * DataExtensionHandler v2.0 - Simplified and Streamlined
 *
 * Design Philosophy:
 * - FEWER functions, MORE functionality
 * - ONE way to do each operation
 * - SIMPLE and PREDICTABLE API
 * - BASED on official SFMC WSProxy documentation
 *
 * Public API (10 functions total):
 *
 * METADATA (2 functions):
 * - schema()      - Get complete DE metadata (name, fields, primary keys, everything)
 * - exists()      - Check if DE exists
 *
 * READ (2 functions):
 * - get()         - Universal read function (single row, multiple rows, all rows, with/without filters)
 * - count()       - Count rows (with optional filter)
 *
 * WRITE (3 functions):
 * - insert()      - Insert one or many rows (auto-detects single vs batch)
 * - update()      - Update one or many rows (auto-detects single vs batch)
 * - remove()      - Delete one or many rows (auto-detects single vs batch)
 *
 * UTILITY (3 functions):
 * - upsert()      - Insert or update (auto-detects single vs batch)
 * - clear()       - Delete all rows from DE
 * - setBU()       - Set Business Unit for cross-BU operations
 *
 * @version 2.0.0
 * @author OmegaFramework
 */
function DataExtensionHandler(responseWrapperInstance, wsProxyWrapperInstance) {
    var handler = 'DataExtensionHandler';
    var response = responseWrapperInstance;
    var wsProxy = wsProxyWrapperInstance;

    // Current Business Unit (null = current BU)
    var currentBU = null;

    // ========================================================================
    // CONSTANTS
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
        LIKE: 'like',
        IN: 'IN'
    };

    // ========================================================================
    // VALIDATION
    // ========================================================================

    function validate(dataExtensionKey, operation) {
        if (!wsProxy) {
            return response.error('WSProxyWrapper instance is required', handler, operation);
        }
        if (!dataExtensionKey) {
            return response.validationError('dataExtensionKey', 'Data Extension key is required', handler, operation);
        }
        return null;
    }

    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================

    /**
     * ES3-compatible array check (Array.isArray doesn't exist in Jint/ES3)
     * @private
     * @param {*} obj - Value to check
     * @returns {boolean} True if obj is an array
     */
    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    /**
     * Converts object to WSProxy Properties array
     * @private
     */
    function toProperties(obj) {
        var props = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                props.push({ Name: key, Value: obj[key] });
            }
        }
        return props;
    }

    /**
     * Builds WSProxy filter from simple object
     * @private
     */
    function buildFilter(filterObj) {
        if (!filterObj) return null;

        // Single filter
        if (filterObj.property) {
            return {
                Property: filterObj.property,
                SimpleOperator: filterObj.operator || 'equals',
                Value: filterObj.value
            };
        }

        // Multiple filters (AND/OR)
        if (filterObj.filters && filterObj.filters.length > 0) {
            var filters = filterObj.filters;
            var operator = filterObj.logicalOperator || 'AND';

            if (filters.length === 1) {
                return buildFilter(filters[0]);
            }

            var left = buildFilter(filters[0]);
            for (var i = 1; i < filters.length; i++) {
                var right = buildFilter(filters[i]);
                left = {
                    LeftOperand: left,
                    LogicalOperator: operator,
                    RightOperand: right
                };
            }
            return left;
        }

        return null;
    }

    /**
     * Converts WSProxy results to plain objects
     * @private
     */
    function parseResults(wsResults) {
        var items = [];
        if (!wsResults || wsResults.length === 0) return items;

        for (var i = 0; i < wsResults.length; i++) {
            var item = wsResults[i];
            var row = {};

            // WSProxy can return Properties in different formats:
            // 1. item.Properties.Property (array of {Name, Value})
            // 2. item.Properties (array of {Name, Value})
            // 3. Direct properties on item itself
            var props = null;

            if (item.Properties) {
                if (item.Properties.Property) {
                    // Format 1: Properties.Property array
                    props = item.Properties.Property;
                } else if (isArray(item.Properties)) {
                    // Format 2: Properties is directly an array
                    props = item.Properties;
                }
            }

            if (props && props.length > 0) {
                for (var j = 0; j < props.length; j++) {
                    var prop = props[j];
                    // Exclude internal properties starting with underscore
                    if (prop.Name && prop.Name.indexOf("_") !== 0) {
                        row[prop.Name] = prop.Value;
                    }
                }
            }

            items.push(row);
        }
        return items;
    }

    // ========================================================================
    // METADATA OPERATIONS (2 functions)
    // ========================================================================

    /**
     * Gets complete Data Extension metadata (schema + fields + primary keys)
     *
     * Returns EVERYTHING in one call - no need for separate getSchema/getFields/getPrimaryKeys
     *
     * @param {string} deKey - Data Extension customer key
     * @returns {object} Response with complete metadata
     *
     * @example
     * var meta = deHandler.schema('MyDE');
     * // Returns: { name, customerKey, isSendable, fields: [...], primaryKeys: [...] }
     */
    function schema(deKey) {
        var err = validate(deKey, 'schema');
        if (err) return err;

        try {
            // Get DE metadata
            var deFilter = wsProxy.createFilter('CustomerKey', 'equals', deKey);
            var deResult = wsProxy.retrieve('DataExtension',
                ['ObjectID', 'CustomerKey', 'Name', 'Description', 'IsSendable', 'IsTestable'],
                deFilter
            );

            if (!deResult.success || deResult.data.count === 0) {
                return response.notFoundError('Data Extension: ' + deKey, handler, 'schema');
            }

            var de = deResult.data.items[0];

            // Get fields
            var fieldsFilter = wsProxy.createFilter('DataExtension.CustomerKey', 'equals', deKey);
            var fieldsResult = wsProxy.retrieve('DataExtensionField',
                ['Name', 'FieldType', 'MaxLength', 'IsPrimaryKey', 'IsRequired', 'DefaultValue', 'Ordinal'],
                fieldsFilter
            );

            if (!fieldsResult.success) {
                return fieldsResult;
            }

            var fields = [];
            var primaryKeys = [];

            for (var i = 0; i < fieldsResult.data.items.length; i++) {
                var f = fieldsResult.data.items[i];
                var field = {
                    name: f.Name,
                    type: f.FieldType,
                    maxLength: f.MaxLength,
                    isPrimaryKey: f.IsPrimaryKey === true || f.IsPrimaryKey === 'true',
                    isRequired: f.IsRequired === true || f.IsRequired === 'true',
                    defaultValue: f.DefaultValue,
                    ordinal: f.Ordinal || 0
                };
                fields.push(field);

                if (field.isPrimaryKey) {
                    primaryKeys.push(field.name);
                }
            }

            // Sort by ordinal
            fields.sort(function(a, b) { return a.ordinal - b.ordinal; });

            return response.success({
                objectId: de.ObjectID,
                customerKey: de.CustomerKey,
                name: de.Name,
                description: de.Description,
                isSendable: de.IsSendable === true || de.IsSendable === 'true',
                isTestable: de.IsTestable === true || de.IsTestable === 'true',
                fields: fields,
                primaryKeys: primaryKeys,
                fieldCount: fields.length
            }, handler, 'schema');

        } catch (ex) {
            return response.error('Schema error: ' + (ex.message || String(ex)), handler, 'schema');
        }
    }

    /**
     * Checks if Data Extension exists
     *
     * @param {string} deKey - Data Extension customer key
     * @returns {object} Response with exists: boolean
     */
    function exists(deKey) {
        var err = validate(deKey, 'exists');
        if (err) return err;

        var filter = wsProxy.createFilter('CustomerKey', 'equals', deKey);
        var result = wsProxy.retrieve('DataExtension', ['CustomerKey'], filter);

        if (result.success) {
            return response.success({
                exists: result.data.count > 0,
                dataExtensionKey: deKey
            }, handler, 'exists');
        }

        return result;
    }

    // ========================================================================
    // READ OPERATIONS (2 functions)
    // ========================================================================

    /**
     * Universal GET function - retrieves rows with maximum flexibility
     *
     * Auto-handles all scenarios:
     * - Single row by primary key
     * - Multiple rows with filter
     * - All rows (with auto-pagination)
     * - Specific fields only
     * - Manual pagination
     *
     * @param {string} deKey - Data Extension customer key
     * @param {object} options - Retrieve options
     * @param {object} options.where - Filter (single: {property, operator, value} or multiple: {filters:[], logicalOperator})
     * @param {Array} options.fields - Specific fields to retrieve (default: all)
     * @param {number} options.limit - Max records to retrieve (default: unlimited with auto-pagination)
     * @param {string} options.continueRequest - RequestID for manual pagination
     * @returns {object} Response with items, count, hasMoreRows, requestId
     *
     * @example
     * // Get all rows
     * deHandler.get('MyDE');
     *
     * // Get single row by primary key
     * deHandler.get('MyDE', { where: { property: 'Id', value: '123' } });
     *
     * // Get with complex filter
     * deHandler.get('MyDE', {
     *   where: {
     *     filters: [
     *       { property: 'Status', value: 'Active' },
     *       { property: 'Age', operator: 'greaterThan', value: 18 }
     *     ],
     *     logicalOperator: 'AND'
     *   }
     * });
     *
     * // Get specific fields only
     * deHandler.get('MyDE', { fields: ['Id', 'Name'], where: {...} });
     */
    function get(deKey, options) {
        var err = validate(deKey, 'get');
        if (err) return err;

        options = options || {};

        try {
            // Use a local WSProxy instance for retrieve operations
            // (wsProxy wrapper doesn't expose raw retrieve with bracket notation)
            var proxy = new Script.Util.WSProxy();

            // Get fields to retrieve
            var fieldsToRetrieve = options.fields;
            if (!fieldsToRetrieve || fieldsToRetrieve.length === 0) {
                var schemaResult = schema(deKey);
                if (!schemaResult.success) return schemaResult;

                fieldsToRetrieve = [];
                for (var i = 0; i < schemaResult.data.fields.length; i++) {
                    fieldsToRetrieve.push(schemaResult.data.fields[i].name);
                }
            }

            // Build filter
            var filter = buildFilter(options.where);

            // Official SFMC syntax: bracket notation
            var objectType = "DataExtensionObject[" + deKey + "]";

            var allResults = [];
            var hasMoreRows = false;
            var requestId = null;
            var limit = options.limit || 0; // 0 = unlimited (auto-pagination)

            // Retrieve data
            var result;
            if (options.continueRequest) {
                result = proxy.getNextBatch(objectType, options.continueRequest);
            } else {
                result = proxy.retrieve(objectType, fieldsToRetrieve, filter);
            }

            if (result && result.Status === 'OK') {
                if (result.Results && result.Results.length > 0) {
                    // DEBUG: Log raw WSProxy structure for first item
                    if (options.debug && result.Results[0]) {
                        Write('<p><strong>DEBUG RAW WSProxy Result[0]:</strong> ' + Stringify(result.Results[0]) + '</p>');
                    }

                    allResults = parseResults(result.Results);

                    // Apply limit if specified
                    if (limit > 0 && allResults.length > limit) {
                        allResults = allResults.slice(0, limit);
                    }
                }

                hasMoreRows = result.HasMoreRows === true;
                requestId = result.RequestID;

                // Auto-pagination if no limit specified and more data available
                if (limit === 0 && hasMoreRows) {
                    var maxIterations = 100; // Safety limit
                    var iterations = 0;

                    while (hasMoreRows && iterations < maxIterations) {
                        result = proxy.getNextBatch(objectType, requestId);
                        if (result && result.Status === 'OK') {
                            if (result.Results && result.Results.length > 0) {
                                var moreItems = parseResults(result.Results);
                                allResults = allResults.concat(moreItems);
                            }
                            hasMoreRows = result.HasMoreRows === true;
                            requestId = result.RequestID;
                        } else {
                            hasMoreRows = false;
                        }
                        iterations++;
                    }

                    // Reset pagination flags for final result
                    hasMoreRows = false;
                    requestId = null;
                }

                return response.success({
                    items: allResults,
                    count: allResults.length,
                    hasMoreRows: hasMoreRows,
                    requestId: hasMoreRows ? requestId : null,
                    dataExtensionKey: deKey
                }, handler, 'get');

            } else if (result && result.Status === 'Error') {
                return response.error(
                    'Retrieve failed: ' + (result.StatusMessage || 'Unknown error'),
                    handler,
                    'get',
                    { status: result.Status, statusMessage: result.StatusMessage }
                );
            } else {
                // No results
                return response.success({
                    items: [],
                    count: 0,
                    hasMoreRows: false,
                    requestId: null,
                    dataExtensionKey: deKey
                }, handler, 'get');
            }

        } catch (ex) {
            return response.error('Get error: ' + (ex.message || String(ex)), handler, 'get');
        }
    }

    /**
     * Counts rows in Data Extension
     *
     * @param {string} deKey - Data Extension customer key
     * @returns {object} Response with count
     *
     * @example
     * deHandler.count('MyDE'); // Count all
     */
    function count(deKey) {
        var recordCount = TreatAsContent("\%\%=DataExtensionRowCount('" + deKey + "')=\%\%");

        if (recordCount >= 0) {
            return response.success({
                count: recordCount,
                dataExtensionKey: deKey
            }, handler, 'count');
        }

        return recordCount;
    }

    // ========================================================================
    // WRITE OPERATIONS (3 functions)
    // ========================================================================

    /**
     * Insert rows - auto-detects single vs batch
     *
     * @param {string} deKey - Data Extension customer key
     * @param {object|Array} data - Single row object or array of row objects
     * @returns {object} Response
     *
     * @example
     * // Single row
     * deHandler.insert('MyDE', { Id: '1', Name: 'John' });
     *
     * // Batch
     * deHandler.insert('MyDE', [
     *   { Id: '1', Name: 'John' },
     *   { Id: '2', Name: 'Jane' }
     * ]);
     */
    function insert(deKey, data) {
        var err = validate(deKey, 'insert');
        if (err) return err;

        if (!data) {
            return response.validationError('data', 'Data is required', handler, 'insert');
        }

        try {
            var isBatch = isArray(data);
            var rows = isBatch ? data : [data];

            var deObjects = [];
            for (var i = 0; i < rows.length; i++) {
                deObjects.push({
                    CustomerKey: deKey,
                    Properties: toProperties(rows[i])
                });
            }

            var result = wsProxy.create('DataExtensionObject', deObjects);

            if (result.success) {
                return response.success({
                    inserted: true,
                    count: rows.length,
                    batch: isBatch
                }, handler, 'insert');
            }

            return result;

        } catch (ex) {
            return response.error('Insert failed: ' + (ex.message || String(ex)), handler, 'insert');
        }
    }

    /**
     * Update rows - auto-detects single vs batch
     *
     * @param {string} deKey - Data Extension customer key
     * @param {object|Array} data - Single row object or array (must include primary key)
     * @returns {object} Response
     */
    function update(deKey, data) {
        var err = validate(deKey, 'update');
        if (err) return err;

        if (!data) {
            return response.validationError('data', 'Data is required', handler, 'update');
        }

        try {
            var isBatch = isArray(data);
            var rows = isBatch ? data : [data];

            var deObjects = [];
            for (var i = 0; i < rows.length; i++) {
                deObjects.push({
                    CustomerKey: deKey,
                    Properties: toProperties(rows[i])
                });
            }

            var result = wsProxy.update('DataExtensionObject', deObjects);

            if (result.success) {
                return response.success({
                    updated: true,
                    count: rows.length,
                    batch: isBatch
                }, handler, 'update');
            }

            return result;

        } catch (ex) {
            return response.error('Update failed: ' + (ex.message || String(ex)), handler, 'update');
        }
    }

    /**
     * Delete rows - auto-detects single vs batch
     *
     * @param {string} deKey - Data Extension customer key
     * @param {object|Array} primaryKeys - Single PK object or array of PK objects
     * @returns {object} Response
     *
     * @example
     * // Single row
     * deHandler.remove('MyDE', { Id: '123' });
     *
     * // Batch
     * deHandler.remove('MyDE', [
     *   { Id: '123' },
     *   { Id: '456' }
     * ]);
     */
    function remove(deKey, primaryKeys) {
        var err = validate(deKey, 'remove');
        if (err) return err;

        if (!primaryKeys) {
            return response.validationError('primaryKeys', 'Primary keys are required', handler, 'remove');
        }

        try {
            var isBatch = isArray(primaryKeys);
            var keys = isBatch ? primaryKeys : [primaryKeys];

            var deObjects = [];
            for (var i = 0; i < keys.length; i++) {
                deObjects.push({
                    CustomerKey: deKey,
                    Keys: toProperties(keys[i]) // Keys use same format as Properties
                });
            }

            var result = wsProxy.remove('DataExtensionObject', deObjects);

            if (result.success) {
                return response.success({
                    deleted: true,
                    count: keys.length,
                    batch: isBatch
                }, handler, 'remove');
            }

            return result;

        } catch (ex) {
            return response.error('Delete failed: ' + (ex.message || String(ex)), handler, 'remove');
        }
    }

    // ========================================================================
    // UTILITY OPERATIONS (3 functions)
    // ========================================================================

    /**
     * Upsert rows (insert or update) - auto-detects single vs batch
     *
     * @param {string} deKey - Data Extension customer key
     * @param {object|Array} data - Single row or array (must include primary key)
     * @returns {object} Response
     */
    function upsert(deKey, data) {
        var err = validate(deKey, 'upsert');
        if (err) return err;

        if (!data) {
            return response.validationError('data', 'Data is required', handler, 'upsert');
        }

        try {
            var isBatch = isArray(data);
            var rows = isBatch ? data : [data];

            var deObjects = [];
            for (var i = 0; i < rows.length; i++) {
                deObjects.push({
                    CustomerKey: deKey,
                    Properties: toProperties(rows[i])
                });
            }

            var result = wsProxy.upsert('DataExtensionObject', deObjects);

            if (result.success) {
                return response.success({
                    upserted: true,
                    count: rows.length,
                    batch: isBatch
                }, handler, 'upsert');
            }

            return result;

        } catch (ex) {
            return response.error('Upsert failed: ' + (ex.message || String(ex)), handler, 'upsert');
        }
    }

    /**
     * Clears all rows from Data Extension
     *
     * WARNING: Deletes ALL data!
     *
     * @param {string} deKey - Data Extension customer key
     * @returns {object} Response
     */
    function clear(deKey) {
        var err = validate(deKey, 'clear');
        if (err) return err;

        // Get all rows
        var allRows = get(deKey);
        if (!allRows.success) return allRows;

        if (allRows.data.count === 0) {
            return response.success({ cleared: true, rowsDeleted: 0 }, handler, 'clear');
        }

        // Get primary keys
        var schemaResult = schema(deKey);
        if (!schemaResult.success || schemaResult.data.primaryKeys.length === 0) {
            return response.error('Cannot determine primary keys', handler, 'clear');
        }

        var pks = schemaResult.data.primaryKeys;
        var deleteKeys = [];

        for (var i = 0; i < allRows.data.items.length; i++) {
            var row = allRows.data.items[i];
            var pkValues = {};
            for (var j = 0; j < pks.length; j++) {
                pkValues[pks[j]] = row[pks[j]];
            }
            deleteKeys.push(pkValues);
        }

        var deleteResult = remove(deKey, deleteKeys);

        if (deleteResult.success) {
            return response.success({
                cleared: true,
                rowsDeleted: deleteKeys.length
            }, handler, 'clear');
        }

        return deleteResult;
    }

    /**
     * Set Business Unit for cross-BU operations
     *
     * @param {number} mid - Business Unit MID (null to reset to current BU)
     * @returns {object} Response
     */
    function setBU(mid) {
        if (!wsProxy) {
            return response.error('WSProxyWrapper instance is required', handler, 'setBU');
        }

        if (mid === null || mid === undefined) {
            currentBU = null;
            return wsProxy.resetClientId();
        }

        currentBU = mid;
        return wsProxy.setClientId(mid);
    }

    // ========================================================================
    // PUBLIC API (10 functions total)
    // ========================================================================

    this.schema = schema;       // Get complete metadata
    this.exists = exists;       // Check if DE exists

    this.get = get;             // Universal read function
    this.count = count;         // Count rows

    this.insert = insert;       // Insert (auto single/batch)
    this.update = update;       // Update (auto single/batch)
    this.remove = remove;       // Delete (auto single/batch)

    this.upsert = upsert;       // Upsert (auto single/batch)
    this.clear = clear;         // Clear all rows
    this.setBU = setBU;         // Set Business Unit

    this.OPERATORS = OPERATORS; // Filter operators
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
