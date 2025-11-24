<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * FolderHandler - Content Builder folder management
 *
 * Manages folder structure in Content Builder for organizing assets.
 *
 * @version 2.0.0
 * @author OmegaFramework
 */
function FolderHandler(sfmcIntegrationInstance) {
    var handler = 'FolderHandler';
    var response = new ResponseWrapper();
    var sfmc = sfmcIntegrationInstance;

    function validateIntegration() {
        if (!sfmc) {
            return response.error('SFMCIntegration instance is required', handler, 'validateIntegration');
        }
        return null;
    }

    /**
     * Lists all folders
     *
     * @param {object} options - Query options
     * @returns {object} Response with folder list
     */
    function list(options) {
        var validation = validateIntegration();
        if (validation) return validation;

        return sfmc.makeRestRequest('GET', '/asset/v1/content/categories', null, {
            queryParams: options
        });
    }

    /**
     * Gets folder by ID
     *
     * @param {number} folderId - Folder ID
     * @returns {object} Response with folder details
     */
    function get(folderId) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!folderId) {
            return response.validationError('folderId', 'Folder ID is required', handler, 'get');
        }

        return sfmc.makeRestRequest('GET', '/asset/v1/content/categories/' + folderId);
    }

    /**
     * Creates new folder
     *
     * @param {object} folderData - Folder configuration
     * @returns {object} Response with created folder
     */
    function create(folderData) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!folderData || !folderData.name) {
            return response.validationError('name', 'Folder name is required', handler, 'create');
        }

        var payload = {
            name: folderData.name,
            parentId: folderData.parentId || 0
        };

        return sfmc.makeRestRequest('POST', '/asset/v1/content/categories', payload);
    }

    /**
     * Updates existing folder
     *
     * @param {number} folderId - Folder ID
     * @param {object} folderData - Updated folder data
     * @returns {object} Response
     */
    function update(folderId, folderData) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!folderId) {
            return response.validationError('folderId', 'Folder ID is required', handler, 'update');
        }

        return sfmc.makeRestRequest('PATCH', '/asset/v1/content/categories/' + folderId, folderData);
    }

    /**
     * Deletes folder
     *
     * @param {number} folderId - Folder ID
     * @returns {object} Response
     */
    function remove(folderId) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!folderId) {
            return response.validationError('folderId', 'Folder ID is required', handler, 'remove');
        }

        return sfmc.makeRestRequest('DELETE', '/asset/v1/content/categories/' + folderId);
    }

    /**
     * Gets child folders of a parent folder
     *
     * @param {number} parentFolderId - Parent folder ID (0 for root)
     * @returns {object} Response with child folders
     */
    function getChildFolders(parentFolderId) {
        var validation = validateIntegration();
        if (validation) return validation;

        var parentId = parentFolderId || 0;

        return sfmc.makeRestRequest('GET', '/asset/v1/content/categories', null, {
            queryParams: { parentId: parentId }
        });
    }

    /**
     * Moves folder to different parent
     *
     * @param {number} folderId - Folder ID to move
     * @param {number} newParentId - New parent folder ID
     * @returns {object} Response
     */
    function move(folderId, newParentId) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!folderId) {
            return response.validationError('folderId', 'Folder ID is required', handler, 'move');
        }

        return update(folderId, { parentId: newParentId || 0 });
    }

    /**
     * Gets folder path from root to specified folder
     *
     * @param {number} folderId - Folder ID
     * @returns {object} Response with folder path
     */
    function getPath(folderId) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!folderId) {
            return response.validationError('folderId', 'Folder ID is required', handler, 'getPath');
        }

        var path = [];
        var currentFolderId = folderId;

        // Traverse up to root
        while (currentFolderId > 0) {
            var folderResult = get(currentFolderId);

            if (!folderResult.success) {
                return folderResult;
            }

            var folder = folderResult.data.parsedContent;
            path.unshift(folder.name);
            currentFolderId = folder.parentId || 0;
        }

        return response.success({
            path: '/' + path.join('/'),
            folders: path
        }, handler, 'getPath');
    }

    // Public API
    this.list = list;
    this.get = get;
    this.create = create;
    this.update = update;
    this.remove = remove;
    this.getChildFolders = getChildFolders;
    this.move = move;
    this.getPath = getPath;
}

</script>
