<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * DataExtensionHandler - Data Extension operations
 *
 * Provides dual-strategy approach:
 * 1. Native SSJS functions (faster, limited to non-enterprise DEs)
 * 2. REST API fallback (works with all DEs)
 *
 * @version 3.0.0
 * @author OmegaFramework
 */
function DataExtensionHandler(responseWrapper, sfmcIntegrationInstance) {
    var handler = 'DataExtensionHandler';
    var response = responseWrapper;
    var sfmc = sfmcIntegrationInstance;

    function validateIntegration() {
        if (!sfmc) {
            return response.error('SFMCIntegration instance is required', handler, 'validateIntegration');
        }
        return null;
    }

    /**
     * Queries Data Extension rows
     *
     * @param {string} dataExtensionKey - DE customer key or name
     * @param {object} options - Query options {pageSize, page, filter}
     * @returns {object} Response with rows
     */
    function query(dataExtensionKey, options) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!dataExtensionKey) {
            return response.validationError('dataExtensionKey', 'Data Extension key is required', handler, 'query');
        }

        // Try SSJS first (faster for non-enterprise DEs)
        // Note: This works only for non-enterprise Data Extensions
        // Enterprise DEs require REST API access
        try {
            var de = DataExtension.Init(dataExtensionKey);
            var filter = options && options.filter ? options.filter : null;
            var data = filter ? de.Rows.Lookup(filter.columns, filter.values) : de.Rows.Retrieve();

            return response.success({
                items: data,
                count: data ? data.length : 0
            }, handler, 'query');
        } catch (ex) {
            // SSJS failed (DE doesn't exist, is enterprise, or access denied)
            // Fall back to REST API
        }

        // Fallback to REST API
        return sfmc.queryDataExtension(dataExtensionKey, options);
    }

    /**
     * Inserts row into Data Extension
     *
     * @param {string} dataExtensionKey - DE customer key
     * @param {object} rowData - Row data
     * @returns {object} Response
     */
    function insertRow(dataExtensionKey, rowData) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!dataExtensionKey) {
            return response.validationError('dataExtensionKey', 'Data Extension key is required', handler, 'insertRow');
        }

        if (!rowData) {
            return response.validationError('rowData', 'Row data is required', handler, 'insertRow');
        }

        // Try SSJS first (faster for non-enterprise DEs)
        try {
            var de = DataExtension.Init(dataExtensionKey);
            var result = de.Rows.Add(rowData);
            if (result === 'OK' || result === 1) {
                return response.success({ inserted: true }, handler, 'insertRow');
            }
        } catch (ex) {
            // SSJS failed, fall back to REST API
        }

        // Fallback to REST API
        return sfmc.insertDataExtensionRow(dataExtensionKey, rowData);
    }

    /**
     * Updates row in Data Extension
     *
     * @param {string} dataExtensionKey - DE customer key
     * @param {object} rowData - Row data with primary key
     * @returns {object} Response
     */
    function updateRow(dataExtensionKey, rowData) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!dataExtensionKey) {
            return response.validationError('dataExtensionKey', 'Data Extension key is required', handler, 'updateRow');
        }

        if (!rowData) {
            return response.validationError('rowData', 'Row data is required', handler, 'updateRow');
        }

        // Try SSJS first (requires primary key in rowData)
        try {
            var de = DataExtension.Init(dataExtensionKey);
            // Note: Update requires knowing the primary key field name
            // This is simplified - in production, get schema first
            var result = de.Rows.Update(rowData);
            if (result === 'OK' || result === 1) {
                return response.success({ updated: true }, handler, 'updateRow');
            }
        } catch (ex) {
            // SSJS failed, fall back to REST API
        }

        // Fallback to REST API
        return sfmc.updateDataExtensionRow(dataExtensionKey, rowData);
    }

    /**
     * Deletes row from Data Extension
     *
     * @param {string} dataExtensionKey - DE customer key
     * @param {object} primaryKeyValues - Primary key values
     * @returns {object} Response
     */
    function deleteRow(dataExtensionKey, primaryKeyValues) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!dataExtensionKey) {
            return response.validationError('dataExtensionKey', 'Data Extension key is required', handler, 'deleteRow');
        }

        if (!primaryKeyValues) {
            return response.validationError('primaryKeyValues', 'Primary key values are required', handler, 'deleteRow');
        }

        // Try SSJS first
        try {
            var de = DataExtension.Init(dataExtensionKey);
            var columns = [];
            var values = [];

            for (var key in primaryKeyValues) {
                if (primaryKeyValues.hasOwnProperty(key)) {
                    columns.push(key);
                    values.push(primaryKeyValues[key]);
                }
            }

            var result = de.Rows.Remove(columns, values);
            if (result === 'OK' || result === 1) {
                return response.success({ deleted: true }, handler, 'deleteRow');
            }
        } catch (ex) {
            // SSJS failed, fall back to REST API
        }

        // Fallback to REST API
        return sfmc.deleteDataExtensionRow(dataExtensionKey, primaryKeyValues);
    }

    /**
     * Upserts row (insert or update)
     *
     * @param {string} dataExtensionKey - DE customer key
     * @param {object} rowData - Row data
     * @returns {object} Response
     */
    function upsertRow(dataExtensionKey, rowData) {
        var validation = validateIntegration();
        if (validation) return validation;

        // Try update first, if fails, insert
        var updateResult = updateRow(dataExtensionKey, rowData);

        if (updateResult.success) {
            return updateResult;
        }

        // Update failed, try insert
        return insertRow(dataExtensionKey, rowData);
    }

    /**
     * Gets Data Extension structure/schema
     *
     * @param {string} dataExtensionKey - DE customer key
     * @returns {object} Response with DE schema
     */
    function getStructure(dataExtensionKey) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!dataExtensionKey) {
            return response.validationError('dataExtensionKey', 'Data Extension key is required', handler, 'getStructure');
        }

        // SSJS doesn't provide schema info easily, use REST API
        return sfmc.makeRestRequest('GET', '/data/v1/customobjectdata/key/' + dataExtensionKey);
    }

    /**
     * Clears all rows from Data Extension
     *
     * WARNING: This deletes all data!
     *
     * @param {string} dataExtensionKey - DE customer key
     * @returns {object} Response
     */
    function clearRows(dataExtensionKey) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!dataExtensionKey) {
            return response.validationError('dataExtensionKey', 'Data Extension key is required', handler, 'clearRows');
        }

        try {
            var de = DataExtension.Init(dataExtensionKey);
            if (de) {
                // Get all rows and delete them
                var rows = de.Rows.Retrieve();
                if (rows && rows.length > 0) {
                    // Note: This is inefficient for large DEs - consider using Query Activity instead
                    for (var i = 0; i < rows.length; i++) {
                        de.Rows.Remove(rows[i]);
                    }
                }
                return response.success({ cleared: true, rowsDeleted: rows.length }, handler, 'clearRows');
            }
        } catch (ex) {
            return response.error('Failed to clear rows: ' + ex.message, handler, 'clearRows');
        }

        return response.error('Data Extension not found or not accessible', handler, 'clearRows');
    }

    // Public API
    this.query = query;
    this.insertRow = insertRow;
    this.updateRow = updateRow;
    this.deleteRow = deleteRow;
    this.upsertRow = upsertRow;
    this.getStructure = getStructure;
    this.clearRows = clearRows;
}

// ============================================================================
// OMEGAFRAMEWORK MODULE REGISTRATION
// ============================================================================
if (typeof OmegaFramework !== 'undefined' && typeof OmegaFramework.register === 'function') {
    OmegaFramework.register('DataExtensionHandler', {
        dependencies: ['ResponseWrapper', 'SFMCIntegration'],
        blockKey: 'OMG_FW_DataExtensionHandler',
        factory: function(responseWrapperInstance, sfmcIntegrationInstance, config) {
            return new DataExtensionHandler(responseWrapperInstance, sfmcIntegrationInstance);
        }
    });
}

</script>
