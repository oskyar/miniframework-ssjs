<script runat="server">

Platform.Load("core", "1.1.1");

function AssetHandler(authConfig, authInstance, connectionInstance) {
    // Initialize base handler with common functionality
    var base = new BaseHandler('AssetHandler', authConfig, authInstance, connectionInstance);

    // Extract base properties for convenience
    var handler = base.handler;
    var response = base.response;
    var auth = base.auth;
    var connection = base.connection;
    var config = base.config;
    var getAuthHeaders = base.getAuthHeaders;
    var getRestUrl = base.getRestUrl;
    
    function create(assetData) {
        try {
            if (!assetData) {
                return response.validationError('assetData', 'Asset data is required', handler, 'create');
            }
            
            if (!assetData.name) {
                return response.validationError('name', 'Asset name is required', handler, 'create');
            }
            
            if (!assetData.assetType) {
                return response.validationError('assetType', 'Asset type is required', handler, 'create');
            }
            
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/asset/v1/content/assets';
            
            var assetPayload = {
                name: assetData.name,
                assetType: assetData.assetType,
                content: assetData.content || '',
                meta: assetData.meta || {},
                category: assetData.category || {}
            };
            
            if (assetData.description) {
                assetPayload.description = assetData.description;
            }
            
            if (assetData.tags) {
                assetPayload.tags = assetData.tags;
            }
            
            return connection.post(url, assetPayload, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'create');
        }
    }
    
    function update(assetId, assetData) {
        try {
            if (!assetId) {
                return response.validationError('assetId', 'Asset ID is required', handler, 'update');
            }
            
            if (!assetData) {
                return response.validationError('assetData', 'Asset data is required', handler, 'update');
            }
            
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/asset/v1/content/assets/' + assetId;
            
            return connection.put(url, assetData, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'update');
        }
    }
    
    function get(assetId) {
        try {
            if (!assetId) {
                return response.validationError('assetId', 'Asset ID is required', handler, 'get');
            }
            
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/asset/v1/content/assets/' + assetId;
            
            return connection.get(url, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'get');
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
            
            var url = restUrlResult + '/asset/v1/content/assets';
            
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
                if (options.assetType) {
                    queryParams.push('$filter=assetType.name eq \'' + options.assetType + '\'');
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
    
    function del(assetId) {
        try {
            if (!assetId) {
                return response.validationError('assetId', 'Asset ID is required', handler, 'delete');
            }
            
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/asset/v1/content/assets/' + assetId;
            
            return connection.delete(url, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'delete');
        }
    }
    
    function move(assetId, targetCategoryId) {
        try {
            if (!assetId) {
                return response.validationError('assetId', 'Asset ID is required', handler, 'move');
            }
            
            if (!targetCategoryId) {
                return response.validationError('targetCategoryId', 'Target category ID is required', handler, 'move');
            }
            
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/asset/v1/content/assets/' + assetId;
            
            var movePayload = {
                category: {
                    id: targetCategoryId
                }
            };
            
            return connection.put(url, movePayload, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'move');
        }
    }
    
    function copy(assetId, copyData) {
        try {
            if (!assetId) {
                return response.validationError('assetId', 'Asset ID is required', handler, 'copy');
            }
            
            if (!copyData || !copyData.name) {
                return response.validationError('copyData', 'Copy data with name is required', handler, 'copy');
            }
            
            var getResult = get(assetId);
            if (!getResult.success) {
                return getResult;
            }
            
            var originalAsset = getResult.data.parsedContent || getResult.data.content;
            if (typeof originalAsset === 'string') {
                try {
                    originalAsset = Platform.Function.ParseJSON(originalAsset);
                } catch (parseEx) {
                    return response.error('PARSE_ERROR', 'Failed to parse original asset data', {parseError: parseEx.message}, handler, 'copy');
                }
            }
            
            var newAssetData = {
                name: copyData.name,
                assetType: originalAsset.assetType,
                content: originalAsset.content,
                meta: originalAsset.meta || {},
                category: copyData.category || originalAsset.category || {}
            };
            
            if (copyData.description) {
                newAssetData.description = copyData.description;
            }
            
            return create(newAssetData);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'copy');
        }
    }
    
    function getByType(assetType, options) {
        try {
            if (!assetType) {
                return response.validationError('assetType', 'Asset type is required', handler, 'getByType');
            }
            
            var listOptions = options || {};
            listOptions.assetType = assetType;
            
            return list(listOptions);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getByType');
        }
    }
    
    function search(searchTerm, options) {
        try {
            if (!searchTerm) {
                return response.validationError('searchTerm', 'Search term is required', handler, 'search');
            }
            
            var searchOptions = options || {};
            var filter = "name like '%" + searchTerm + "%'";
            
            if (searchOptions.assetType) {
                filter += " and assetType.name eq '" + searchOptions.assetType + "'";
            }
            
            searchOptions.filter = filter;
            
            return list(searchOptions);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'search');
        }
    }
    
    function getAssetTypes() {
        try {
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/asset/v1/content/categories/asset-types';
            
            return connection.get(url, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getAssetTypes');
        }
    }
    
    // Public API - Using this pattern for SFMC Content Block compatibility
    this.create = create;
    this.update = update;
    this.get = get;
    this.list = list;
    this.delete = del;
    this.move = move;
    this.copy = copy;
    this.getByType = getByType;
    this.search = search;
    this.getAssetTypes = getAssetTypes;
}

</script>