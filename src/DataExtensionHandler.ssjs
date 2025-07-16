<script runat="server">

Platform.Load("core", "1.1.1");

function DataExtensionHandler(authConfig) {
    var handler = 'DataExtensionHandler';
    var response = new OmegaFrameworkResponse();
    var auth = new AuthHandler();
    var connection = new ConnectionHandler();
    var config = authConfig || {};
    
    function validateAuthConfig() {
        if (!config.clientId || !config.clientSecret || !config.authBaseUrl) {
            return response.authError('Authentication configuration is required. Please provide clientId, clientSecret, and authBaseUrl.', handler, 'validateAuthConfig');
        }
        return null;
    }
    
    function getRestUrl() {
        var tokenResult = auth.getValidToken(config);
        if (!tokenResult.success) {
            return tokenResult;
        }
        return tokenResult.data.restInstanceUrl || 'https://YOUR_SUBDOMAIN.rest.marketingcloudapis.com';
    }
    
    function getAuthHeaders() {
        var authValidation = validateAuthConfig();
        if (authValidation) {
            return authValidation;
        }
        
        var tokenResult = auth.getValidToken(config);
        if (!tokenResult.success) {
            return tokenResult;
        }
        
        return auth.createAuthHeader(tokenResult.data);
    }
    
    function createDE(deData) {
        try {
            if (!deData) {
                return response.validationError('deData', 'Data Extension data is required', handler, 'createDE');
            }
            
            if (!deData.name) {
                return response.validationError('name', 'Data Extension name is required', handler, 'createDE');
            }
            
            if (!deData.fields || !deData.fields.length) {
                return response.validationError('fields', 'Data Extension fields are required', handler, 'createDE');
            }
            
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/data/v1/customobjectdata/key/' + (deData.externalKey || deData.name) + '/rowset';
            
            var dePayload = {
                name: deData.name,
                externalKey: deData.externalKey || deData.name,
                description: deData.description || '',
                isSendable: deData.isSendable || false,
                isTestable: deData.isTestable || false,
                retainUntil: deData.retainUntil || '',
                rowBasedRetention: deData.rowBasedRetention || false,
                resetRetentionPeriodOnImport: deData.resetRetentionPeriodOnImport || false,
                deleteAtEndOfRetentionPeriod: deData.deleteAtEndOfRetentionPeriod || false,
                fields: deData.fields,
                categoryId: deData.categoryId || null
            };
            
            return connection.post(url, dePayload, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'createDE');
        }
    }
    
    function addRecord(deKey, recordData) {
        try {
            if (!deKey) {
                return response.validationError('deKey', 'Data Extension key is required', handler, 'addRecord');
            }
            
            if (!recordData) {
                return response.validationError('recordData', 'Record data is required', handler, 'addRecord');
            }
            
            try {
                var de = DataExtension.Init(deKey);
                var rowAdded = de.Rows.Add(recordData);
                
                if (rowAdded > 0) {
                    return response.success({
                        rowsAdded: rowAdded,
                        deKey: deKey,
                        method: 'SSJS'
                    }, handler, 'addRecord');
                } else {
                    return response.error('ADD_FAILED', 'Failed to add record using SSJS method', {deKey: deKey}, handler, 'addRecord');
                }
                
            } catch (ssjsEx) {
                var authResult = getAuthHeaders();
                if (!authResult.success) {
                    return authResult;
                }
                
                var restUrlResult = getRestUrl();
                if (!restUrlResult.success) {
                    return restUrlResult;
                }
                
                var url = restUrlResult + '/hub/v1/dataevents/key:' + deKey + '/rowset';
                var payload = [recordData];
                
                return connection.post(url, payload, authResult.data);
            }
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'addRecord');
        }
    }
    
    function updateRecord(deKey, recordData, whereClause) {
        try {
            if (!deKey) {
                return response.validationError('deKey', 'Data Extension key is required', handler, 'updateRecord');
            }
            
            if (!recordData) {
                return response.validationError('recordData', 'Record data is required', handler, 'updateRecord');
            }
            
            try {
                var de = DataExtension.Init(deKey);
                var rowsUpdated = de.Rows.Update(recordData, whereClause || '');
                
                if (rowsUpdated >= 0) {
                    return response.success({
                        rowsUpdated: rowsUpdated,
                        deKey: deKey,
                        method: 'SSJS'
                    }, handler, 'updateRecord');
                } else {
                    return response.error('UPDATE_FAILED', 'Failed to update record using SSJS method', {deKey: deKey}, handler, 'updateRecord');
                }
                
            } catch (ssjsEx) {
                var authResult = getAuthHeaders();
                if (!authResult.success) {
                    return authResult;
                }
                
                var restUrlResult = getRestUrl();
                if (!restUrlResult.success) {
                    return restUrlResult;
                }
                
                var url = restUrlResult + '/hub/v1/dataevents/key:' + deKey + '/rowset';
                var payload = [recordData];
                
                return connection.put(url, payload, authResult.data);
            }
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'updateRecord');
        }
    }
    
    function deleteRecord(deKey, whereClause) {
        try {
            if (!deKey) {
                return response.validationError('deKey', 'Data Extension key is required', handler, 'deleteRecord');
            }
            
            if (!whereClause) {
                return response.validationError('whereClause', 'Where clause is required for safety', handler, 'deleteRecord');
            }
            
            try {
                var de = DataExtension.Init(deKey);
                var rowsDeleted = de.Rows.Remove(whereClause);
                
                if (rowsDeleted >= 0) {
                    return response.success({
                        rowsDeleted: rowsDeleted,
                        deKey: deKey,
                        method: 'SSJS'
                    }, handler, 'deleteRecord');
                } else {
                    return response.error('DELETE_FAILED', 'Failed to delete record using SSJS method', {deKey: deKey}, handler, 'deleteRecord');
                }
                
            } catch (ssjsEx) {
                return response.error('SSJS_DELETE_ERROR', 'SSJS delete failed: ' + ssjsEx.message, {
                    deKey: deKey,
                    whereClause: whereClause,
                    suggestion: 'Use REST API method or check Data Extension permissions'
                }, handler, 'deleteRecord');
            }
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'deleteRecord');
        }
    }
    
    function query(deKey, fields, whereClause, orderBy) {
        try {
            if (!deKey) {
                return response.validationError('deKey', 'Data Extension key is required', handler, 'query');
            }
            
            try {
                var de = DataExtension.Init(deKey);
                var data = de.Rows.Lookup(fields || [], whereClause || '');
                
                return response.success({
                    records: data,
                    recordCount: data ? data.length : 0,
                    deKey: deKey,
                    method: 'SSJS'
                }, handler, 'query');
                
            } catch (ssjsEx) {
                var authResult = getAuthHeaders();
                if (!authResult.success) {
                    return authResult;
                }
                
                var restUrlResult = getRestUrl();
                if (!restUrlResult.success) {
                    return restUrlResult;
                }
                
                var url = restUrlResult + '/data/v1/customobjectdata/key/' + deKey + '/rowset';
                
                var queryParams = [];
                if (fields && fields.length > 0) {
                    queryParams.push('$fields=' + fields.join(','));
                }
                if (whereClause) {
                    queryParams.push('$filter=' + encodeURIComponent(whereClause));
                }
                if (orderBy) {
                    queryParams.push('$orderBy=' + encodeURIComponent(orderBy));
                }
                
                if (queryParams.length > 0) {
                    url += '?' + queryParams.join('&');
                }
                
                return connection.get(url, authResult.data);
            }
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'query');
        }
    }
    
    function getStructure(deKey) {
        try {
            if (!deKey) {
                return response.validationError('deKey', 'Data Extension key is required', handler, 'getStructure');
            }
            
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/data/v1/customobjectdata/key/' + deKey;
            
            return connection.get(url, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getStructure');
        }
    }
    
    function list(options) {
        try {
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/data/v1/customobjectdata';
            
            var queryParams = [];
            if (options) {
                if (options.pageSize) {
                    queryParams.push('$pageSize=' + options.pageSize);
                }
                if (options.page) {
                    queryParams.push('$page=' + options.page);
                }
                if (options.filter) {
                    queryParams.push('$filter=' + encodeURIComponent(options.filter));
                }
                if (options.orderBy) {
                    queryParams.push('$orderBy=' + encodeURIComponent(options.orderBy));
                }
            }
            
            if (queryParams.length > 0) {
                url += '?' + queryParams.join('&');
            }
            
            return connection.get(url, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'list');
        }
    }
    
    function deleteDE(deKey) {
        try {
            if (!deKey) {
                return response.validationError('deKey', 'Data Extension key is required', handler, 'deleteDE');
            }
            
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/data/v1/customobjectdata/key/' + deKey;
            
            return connection.delete(url, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'deleteDE');
        }
    }
    
    return {
        createDE: createDE,
        addRecord: addRecord,
        updateRecord: updateRecord,
        deleteRecord: deleteRecord,
        query: query,
        getStructure: getStructure,
        list: list,
        deleteDE: deleteDE
    };
}

</script>