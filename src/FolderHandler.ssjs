<script runat="server">

Platform.Load("core", "1.1.1");

function FolderHandler(authConfig, authInstance, connectionInstance) {
    // Initialize base handler with common functionality
    var base = new BaseHandler('FolderHandler', authConfig, authInstance, connectionInstance);

    // Extract base properties for convenience
    var handler = base.handler;
    var response = base.response;
    var auth = base.auth;
    var connection = base.connection;
    var config = base.config;
    var getAuthHeaders = base.getAuthHeaders;
    var getRestUrl = base.getRestUrl;
    
    function create(folderData) {
        try {
            if (!folderData) {
                return response.validationError('folderData', 'Folder data is required', handler, 'create');
            }
            
            if (!folderData.name) {
                return response.validationError('name', 'Folder name is required', handler, 'create');
            }
            
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/asset/v1/content/categories';
            
            var folderPayload = {
                name: folderData.name,
                parentId: folderData.parentId || 0,
                description: folderData.description || '',
                categoryType: folderData.categoryType || 'asset'
            };
            
            return connection.post(url, folderPayload, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'create');
        }
    }
    
    function update(folderId, folderData) {
        try {
            if (!folderId) {
                return response.validationError('folderId', 'Folder ID is required', handler, 'update');
            }
            
            if (!folderData) {
                return response.validationError('folderData', 'Folder data is required', handler, 'update');
            }
            
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/asset/v1/content/categories/' + folderId;
            
            return connection.put(url, folderData, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'update');
        }
    }
    
    function get(folderId) {
        try {
            if (!folderId) {
                return response.validationError('folderId', 'Folder ID is required', handler, 'get');
            }
            
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/asset/v1/content/categories/' + folderId;
            
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
            
            var url = restUrlResult + '/asset/v1/content/categories';
            
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
                if (options.parentId !== undefined) {
                    queryParams.push('$filter=parentId eq ' + options.parentId);
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
    
    function del(folderId) {
        try {
            if (!folderId) {
                return response.validationError('folderId', 'Folder ID is required', handler, 'delete');
            }
            
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/asset/v1/content/categories/' + folderId;
            
            return connection.delete(url, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'delete');
        }
    }
    
    function move(folderId, newParentId) {
        try {
            if (!folderId) {
                return response.validationError('folderId', 'Folder ID is required', handler, 'move');
            }
            
            if (newParentId === undefined || newParentId === null) {
                return response.validationError('newParentId', 'New parent ID is required', handler, 'move');
            }
            
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/asset/v1/content/categories/' + folderId;
            
            var movePayload = {
                parentId: newParentId
            };
            
            return connection.put(url, movePayload, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'move');
        }
    }
    
    function getStructure(rootId) {
        try {
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/asset/v1/content/categories';
            
            if (rootId !== undefined && rootId !== null) {
                url += '?$filter=parentId eq ' + rootId;
            }
            
            var result = connection.get(url, authResult.data);
            
            if (result.success) {
                var folders = result.data.parsedContent || result.data.content;
                if (typeof folders === 'string') {
                    try {
                        folders = Platform.Function.ParseJSON(folders);
                    } catch (parseEx) {
                        return response.error('PARSE_ERROR', 'Failed to parse folder structure', {parseError: parseEx.message}, handler, 'getStructure');
                    }
                }
                
                var structuredData = {
                    rootId: rootId || 0,
                    folders: folders,
                    totalFolders: folders ? folders.length : 0
                };
                
                return response.success(structuredData, handler, 'getStructure');
            }
            
            return result;
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getStructure');
        }
    }
    
    function getChildFolders(parentId) {
        try {
            if (parentId === undefined || parentId === null) {
                return response.validationError('parentId', 'Parent ID is required', handler, 'getChildFolders');
            }
            
            var options = {
                parentId: parentId
            };
            
            return list(options);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getChildFolders');
        }
    }
    
    function search(searchTerm, options) {
        try {
            if (!searchTerm) {
                return response.validationError('searchTerm', 'Search term is required', handler, 'search');
            }
            
            var searchOptions = options || {};
            var filter = "name like '%" + searchTerm + "%'";
            
            if (searchOptions.categoryType) {
                filter += " and categoryType eq '" + searchOptions.categoryType + "'";
            }
            
            searchOptions.filter = filter;
            
            return list(searchOptions);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'search');
        }
    }
    
    function getPath(folderId) {
        try {
            if (!folderId) {
                return response.validationError('folderId', 'Folder ID is required', handler, 'getPath');
            }
            
            var path = [];
            var currentId = folderId;
            var maxIterations = 50;
            var iterations = 0;
            
            while (currentId && currentId !== 0 && iterations < maxIterations) {
                var folderResult = get(currentId);
                if (!folderResult.success) {
                    break;
                }
                
                var folder = folderResult.data.parsedContent || folderResult.data.content;
                if (typeof folder === 'string') {
                    try {
                        folder = Platform.Function.ParseJSON(folder);
                    } catch (parseEx) {
                        break;
                    }
                }
                
                path.unshift({
                    id: folder.id,
                    name: folder.name,
                    parentId: folder.parentId
                });
                
                currentId = folder.parentId;
                iterations++;
            }
            
            return response.success({
                folderId: folderId,
                path: path,
                pathString: path.map(function(p) { return p.name; }).join(' > ')
            }, handler, 'getPath');
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getPath');
        }
    }
    
    return {
        create: create,
        update: update,
        get: get,
        list: list,
        delete: del,
        move: move,
        getStructure: getStructure,
        getChildFolders: getChildFolders,
        search: search,
        getPath: getPath
    };
}

</script>