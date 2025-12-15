<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * FolderHandler - Folder management using WSProxy (SOAP API)
 *
 * Manages folder structure in SFMC for organizing assets, data extensions,
 * emails, and other content types. Uses WSProxy instead of REST API for
 * better performance and no credential requirements.
 *
 * Supported ContentTypes:
 * - asset: Content Builder folders
 * - dataextension: Data Extension folders
 * - email: Classic Email folders
 * - template: Template folders
 * - filterdefinition: Filter folders
 * - list: List folders
 * - triggered_send: Triggered Send folders
 * - suppression_list: Suppression List folders
 * - shared_content: Shared Content folders
 * - publication: Publication folders
 * - journey: Journey Builder folders
 *
 * @version 4.0.0 (WSProxy Only)
 * @author OmegaFramework
 */
function FolderHandler(responseWrapper, wsProxyWrapperInstance) {
    var handler = 'FolderHandler';
    var response = responseWrapper;
    var wsProxy = wsProxyWrapperInstance;

    // Standard fields to retrieve for folder operations
    var FOLDER_FIELDS = [
        'ID',
        'Name',
        'CustomerKey',
        'Description',
        'ContentType',
        'ParentFolder.ID',
        'ParentFolder.Name',
        'AllowChildren',
        'IsActive',
        'IsEditable'
    ];


    /**
     * ============================================================================
     * SFMC Folder ContentType Metadata
     * ============================================================================
     * | Name                             | ContentType                   | CustomerKey                     |
     * |----------------------------------|-------------------------------|---------------------------------|
     * | my emails                        | email                         | email_default                   |
     * | simple automated emails          | automated_email               | automated_email_default         |
     * | my templates                     | template                      | template_default                |
     * | my lists                         | list                          | list_default                    |
     * | my tracking                      | job                           | job_default                     |
     * | my contents                      | content                       | content_default                 |
     * | my documents                     | document                      | document_default                |
     * | my surveys                       | survey                        | survey_default                  |
     * | my images                        | image                         | image_default                   |
     * | Portfolio                        | media                         | media_default                   |
     * | my groups                        | group                         | group_default                   |
     * | my subscribers                   | mysubs                        | mysubs_default                  |
     * | Salesforce Sends                 | salesforcesendsv5             | salesforcesendsv5_default       |
     * | Salesforce Data Extensions       | salesforcedataextension       | salesforcedataextension_default |
     * | Suppression Lists                | suppression_list              | suppression_list_default        |
     * | Triggered Sends                  | triggered_send                | triggered_send_default          |
     * | User-Initiated                   | userinitiatedsends            | userinitiatedsends_default      |
     * | Data Extensions                  | dataextension                 | dataextension_default           |
     * | Publication Lists                | publication                   | publication_default             |
     * | my microsites                    | microsite                     | microsite_default               |
     * | microsite layouts                | micrositelayout               | micrositelayout_default         |
     * | Query                            | queryactivity                 | queryactivity_default           |
     * | Live Content                     | livecontent                   | livecontent_default             |
     * | Data Filters                     | filterdefinition              | filterdefinition_default        |
     * | Filter                           | filteractivity                | filteractivity_default          |
     * | Measures                         | measure                       | measure_default                 |
     * | my automations                   | AUTOMATIONS                   | AUTOMATIONS_default             |
     * | Scripts                          | SSJSActivity                  | SSJSActivity_default            |
     * | A/B Testing                      | ABTest                        | A/B Testing_default             |
     * | Auto-Suppression Configuration   | contextual_suppression_list   | contextual_suppression_list_default |
     * | Journey Builder Sends            | triggered_send_journeybuilder | triggered_send_journeybuilder   |
     * | my journeys                      | journey                       | journey_default                 |
     * | Content Builder                  | asset                         | N/A                             |
     * | HiddenCategory                   | Hidden                        | HiddenCategory_default          |
     * | my workflows                     | campaign                      | N/A                             |
     * | Recycle Bin                      | recyclebin                    | recyclebin_default              |
     * | CloudPages                       | cloudpages                    | N/A                             |
     * ============================================================================
     */
    var CONTENT_TYPES = {
        MYEMAILS: 'email',
        SIMPLEAUTOMATEDEMAILS: 'automated_email',
        MYTEMPLATES: 'template',
        MYLISTS: 'list',
        MYTRACKING: 'job',
        MYCONTENTS: 'content',
        MYDOCUMENTS: 'document',
        MYSURVEYS: 'survey',
        MYIMAGES: 'image',
        PORTFOLIO: 'media',
        MYGROUPS: 'group',
        MYSUBSCRIBERS: 'mysubs',
        SALESFORCESENDS: 'salesforcesendsv5',
        SALESFORCEDATAEXTENSIONS: 'salesforcedataextension',
        SUPPRESSIONLISTS: 'suppression_list',
        TRIGGEREDSENDS: 'triggered_send',
        USERINITIATED: 'userinitiatedsends',
        DATAEXTENSIONS: 'dataextension',
        PUBLICATIONLISTS: 'publication',
        MYMICROSITES: 'microsite',
        MICROSITELAYOUTS: 'micrositelayout',
        QUERY: 'queryactivity',
        LIVECONTENT: 'livecontent',
        DATAFILTERS: 'filterdefinition',
        FILTER: 'filteractivity',
        MEASURES: 'measure',
        MYAUTOMATIONS: 'AUTOMATIONS',
        SCRIPTS: 'SSJSActivity',
        ABTESTING: 'ABTest',
        AUTOSUPPRESSIONCONFIGURATION: 'contextual_suppression_list',
        JOURNEYBUILDERSENDS: 'triggered_send_journeybuilder',
        MYJOURNEYS: 'journey',
        CONTENTBUILDER: 'asset',
        HIDDENCATEGORY: 'Hidden',
        MYWORKFLOWS: 'campaign',
        RECYCLEBIN: 'recyclebin',
        CLOUDPAGES: 'cloudpages'
    };

    // This variable is used by getRootFolderId to find folders by CustomerKey.
    var SFMC_FOLDER_METADATA = [
        { "name": "my emails", "contentType": "email", "customerKey": "email_default" },
        { "name": "simple automated emails", "contentType": "automated_email", "customerKey": "automated_email_default" },
        { "name": "my templates", "contentType": "template", "customerKey": "template_default" },
        { "name": "my lists", "contentType": "list", "customerKey": "list_default" },
        { "name": "my tracking", "contentType": "job", "customerKey": "job_default" },
        { "name": "my contents", "contentType": "content", "customerKey": "content_default" },
        { "name": "my documents", "contentType": "document", "customerKey": "document_default" },
        { "name": "my surveys", "contentType": "survey", "customerKey": "survey_default" },
        { "name": "my images", "contentType": "image", "customerKey": "image_default" },
        { "name": "Portfolio", "contentType": "media", "customerKey": "media_default" },
        { "name": "my groups", "contentType": "group", "customerKey": "group_default" },
        { "name": "my subscribers", "contentType": "mysubs", "customerKey": "mysubs_default" },
        { "name": "Salesforce Sends", "contentType": "salesforcesendsv5", "customerKey": "salesforcesendsv5_default" },
        { "name": "Salesforce Data Extensions", "contentType": "salesforcedataextension", "customerKey": "salesforcedataextension_default" },
        { "name": "Suppression Lists", "contentType": "suppression_list", "customerKey": "suppression_list_default" },
        { "name": "Triggered Sends", "contentType": "triggered_send", "customerKey": "triggered_send_default" },
        { "name": "User-Initiated", "contentType": "userinitiatedsends", "customerKey": "userinitiatedsends_default" },
        { "name": "Data Extensions", "contentType": "dataextension", "customerKey": "dataextension_default" },
        { "name": "Publication Lists", "contentType": "publication", "customerKey": "publication_default" },
        { "name": "my microsites", "contentType": "microsite", "customerKey": "microsite_default" },
        { "name": "microsite layouts", "contentType": "micrositelayout", "customerKey": "micrositelayout_default" },
        { "name": "Query", "contentType": "queryactivity", "customerKey": "queryactivity_default" },
        { "name": "Live Content", "contentType": "livecontent", "customerKey": "livecontent_default" },
        { "name": "Data Filters", "contentType": "filterdefinition", "customerKey": "filterdefinition_default" },
        { "name": "Filter", "contentType": "filteractivity", "customerKey": "filteractivity_default" },
        { "name": "Measures", "contentType": "measure", "customerKey": "measure_default" },
        { "name": "my automations", "contentType": "AUTOMATIONS", "customerKey": "AUTOMATIONS_default" },
        { "name": "Scripts", "contentType": "SSJSActivity", "customerKey": "SSJSActivity_default" },
        { "name": "A/B Testing", "contentType": "ABTest", "customerKey": "A/B Testing_default" },
        { "name": "Auto-Suppression Configuration", "contentType": "contextual_suppression_list", "customerKey": "contextual_suppression_list_default" },
        { "name": "Journey Builder Sends", "contentType": "triggered_send_journeybuilder", "customerKey": "triggered_send_journeybuilder" },
        { "name": "my journeys", "contentType": "journey", "customerKey": "journey_default" },
        { "name": "Content Builder", "contentType": "asset", "customerKey": "N/A" },
        { "name": "HiddenCategory", "contentType": "Hidden", "customerKey": "HiddenCategory_default" },
        { "name": "my workflows", "contentType": "campaign", "customerKey": "N/A" },
        { "name": "Recycle Bin", "contentType": "recyclebin", "customerKey": "recyclebin_default" },
        { "name": "CloudPages", "contentType": "cloudpages", "customerKey": "N/A" }
    ];


    /**
     * ES3-compatible array check
     * @private
     */
    function isArray(obj) {
        return Object.prototype.toString.call(obj) == '[object Array]';
    }

    /**
     * Validates that WSProxy wrapper is available
     * @private
     */
    function validateWSProxy() {
        if (!wsProxy) {
            return response.error('WSProxyWrapper instance is required', handler, 'validateWSProxy');
        }
        return null;
    }

    /**
     * Normalizes folder data from WSProxy result
     * @private
     */
    function normalizeFolder(wsResult) {
        return {
            id: wsResult.ID,
            name: wsResult.Name,
            customerKey: wsResult.CustomerKey || '',
            description: wsResult.Description || '',
            contentType: wsResult.ContentType,
            parentId: (wsResult.ParentFolder && wsResult.ParentFolder.ID) ? wsResult.ParentFolder.ID : 0,
            parentName: (wsResult.ParentFolder && wsResult.ParentFolder.Name) ? wsResult.ParentFolder.Name : '',
            allowChildren: wsResult.AllowChildren != false,
            isActive: wsResult.IsActive != false,
            isEditable: wsResult.IsEditable != false
        };
    }

    /**
     * Normalizes array of folder results
     * @private
     */
    function normalizeFolders(results) {
        var folders = [];
        if (results && results.length > 0) {
            for (var i = 0; i < results.length; i++) {
                folders.push(normalizeFolder(results[i]));
            }
        }
        return folders;
    }

    // Cache for root folder IDs by ContentType
    var rootFolderCache = {};

    /**
     * Gets the root folder ID for a specific ContentType
     * Root folders in SFMC don't have ParentFolder.ID = 0, they have no ParentFolder at all
     * @private
     * @param {string} contentType - The ContentType to find root for
     * @returns {number|null} Root folder ID or null if not found
     */
    function getRootFolderId(contentType) {
        // Check cache first
        if (rootFolderCache[contentType]) {
            return rootFolderCache[contentType];
        }

        try {
            // Per user feedback, find the root by combining ContentType and ParentFolder.ID = 0 in a single query.
            var filter = {
                LeftOperand: {
                    Property: "ContentType",
                    SimpleOperator: "equals",
                    Value: contentType
                },
                LogicalOperator: "AND",
                RightOperand: {
                    Property: "ParentFolder.ID",
                    SimpleOperator: "equals",
                    Value: 0
                }
            };

            var result = wsProxy.retrieve('DataFolder', ['ID', 'Name'], filter);
            if (result.success && result.data.items && result.data.items.length > 0) {
                var rootId = result.data.items[0].ID;

                rootFolderCache[contentType] = rootId;
                return rootId;
            }

        } catch (ex) {
            // Silently fail, return null
        }

        return null;
    }

    /**
     * Lists all folders, optionally filtered by ContentType
     *
     * @param {object} options - Query options
     * @param {string} options.contentType - Filter by folder type (e.g., 'asset', 'dataextension')
     * @param {number} options.parentId - Filter by parent folder ID
     * @returns {object} Response with folder list
     */
    function list(options) {
        var validation = validateWSProxy();
        if (validation) return validation;

        try {
            var opts = options || {};
            var filter = null;

            // Build filter based on options
            if (opts.contentType && opts.parentId) {
                filter = {
                    LeftOperand: {
                        Property: 'ContentType',
                        SimpleOperator: 'equals',
                        Value: opts.contentType
                    },
                    LogicalOperator: 'AND',
                    RightOperand: {
                        Property: 'ParentFolder.ID',
                        SimpleOperator: 'equals',
                        Value: opts.parentId
                    }
                };
            } else if (opts.contentType) {
                filter = {
                    Property: 'ContentType',
                    SimpleOperator: 'equals',
                    Value: opts.contentType
                };
            } else if (opts.parentId != undefined) {
                filter = {
                    Property: 'ParentFolder.ID',
                    SimpleOperator: 'equals',
                    Value: opts.parentId
                };
            }

            var result = wsProxy.retrieve('DataFolder', FOLDER_FIELDS, filter);

            if (result.success) {
                var folders = normalizeFolders(result.data.items);
                return response.success({
                    folders: folders,
                    count: folders.length,
                    hasMore: result.data.hasMore || false
                }, handler, 'list');
            } else {
                return response.error(result.error ? result.error.message : 'Failed to list folders', handler, 'list');
            }
        } catch (ex) {
            return response.error('List error: ' + (ex.message || String(ex)), handler, 'list');
        }
    }

    /**
     * Gets folder by ID
     *
     * @param {number} folderId - Folder ID
     * @returns {object} Response with folder details
     */
    function get(folderId) {
        var validation = validateWSProxy();
        if (validation) return validation;

        if (!folderId) {
            return response.validationError('folderId', 'Folder ID is required', handler, 'get');
        }

        try {
            var filter = {
                Property: 'ID',
                SimpleOperator: 'equals',
                Value: folderId
            };

            var result = wsProxy.retrieve('DataFolder', FOLDER_FIELDS, filter);
            if (result.success && result.data.items && result.data.items.length > 0) {
                return response.success(normalizeFolder(result.data.items[0]), handler, 'get');
            } else if (result.success) {
                return response.error('Folder not found with ID: ' + folderId, handler, 'get');
            } else {
                return response.error(result.error ? result.error.message : 'Failed to get folder', handler, 'get');
            }
        } catch (ex) {
            return response.error('Get error: ' + (ex.message || String(ex)), handler, 'get');
        }
    }

    /**
     * Gets folder by CustomerKey
     *
     * @param {string} customerKey - Folder CustomerKey
     * @returns {object} Response with folder details
     */
    function getByCustomerKey(customerKey) {
        var validation = validateWSProxy();
        if (validation) return validation;

        if (!customerKey) {
            return response.validationError('customerKey', 'CustomerKey is required', handler, 'getByCustomerKey');
        }

        try {
            var filter = {
                Property: 'CustomerKey',
                SimpleOperator: 'equals',
                Value: customerKey
            };

            var result = wsProxy.retrieve('DataFolder', FOLDER_FIELDS, filter);

            if (result.success && result.data.items && result.data.items.length > 0) {
                return response.success(normalizeFolder(result.data.items[0]), handler, 'getByCustomerKey');
            } else if (result.success) {
                return response.error('Folder not found with CustomerKey: ' + customerKey, handler, 'getByCustomerKey');
            } else {
                return response.error(result.error ? result.error.message : 'Failed to get folder', handler, 'getByCustomerKey');
            }
        } catch (ex) {
            return response.error('GetByCustomerKey error: ' + (ex.message || String(ex)), handler, 'getByCustomerKey');
        }
    }

    /**
     * Gets folder by name and parent
     *
     * @param {string} name - Folder name
     * @param {number} parentId - Parent folder ID (0 for root)
     * @param {string} contentType - ContentType to search
     * @returns {object} Response with folder details
     */
    function getByName(name, parentId, contentType) {
        var validation = validateWSProxy();
        if (validation) return validation;

        if (!name) {
            return response.validationError('name', 'Folder name is required', handler, 'getByName');
        }

        try {
            var filter = {
                LeftOperand: {
                    Property: 'Name',
                    SimpleOperator: 'equals',
                    Value: name
                },
                LogicalOperator: 'AND',
                RightOperand: {
                    Property: 'ParentFolder.ID',
                    SimpleOperator: 'equals',
                    Value: parentId || 0
                }
            };

            // Add ContentType filter if specified
            if (contentType) {
                filter = {
                    LeftOperand: filter,
                    LogicalOperator: 'AND',
                    RightOperand: {
                        Property: 'ContentType',
                        SimpleOperator: 'equals',
                        Value: contentType
                    }
                };
            }

            var result = wsProxy.retrieve('DataFolder', FOLDER_FIELDS, filter);

            if (result.success && result.data.items && result.data.items.length > 0) {
                return response.success(normalizeFolder(result.data.items[0]), handler, 'getByName');
            } else if (result.success) {
                return response.error('Folder not found: ' + name, handler, 'getByName');
            } else {
                return response.error(result.error ? result.error.message : 'Failed to get folder', handler, 'getByName');
            }
        } catch (ex) {
            return response.error('GetByName error: ' + (ex.message || String(ex)), handler, 'getByName');
        }
    }

    /**
     * Creates new folder
     *
     * @param {object} folderData - Folder configuration
     * @param {string} folderData.name - Folder name (required)
     * @param {number} folderData.parentId - Parent folder ID
     * @param {string} folderData.contentType - Folder type (default: 'asset')
     * @param {string} folderData.customerKey - Custom key (auto-generated if not provided)
     * @param {string} folderData.description - Folder description
     * @param {boolean} folderData.allowChildren - Allow subfolders (default: true)
     * @returns {object} Response with created folder
     */
    function create(folderData) {
        var validation = validateWSProxy();
        if (validation) return validation;

        if (!folderData || !folderData.name) {
            return response.validationError('name', 'Folder name is required', handler, 'create');
        }

        try {
            var contentType = folderData.contentType || CONTENT_TYPES.CONTENTBUILDER;

            var customerKey = folderData.customerKey;
            if (!customerKey) {
                var baseName = folderData.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); // Sanitize
                var maxBaseNameLength = 27; // 36 (max) - "FW_" (3) - "_guid" (9) = 24. Setting to 27 to be safe.
                if (baseName.length > maxBaseNameLength) {
                    baseName = baseName.substring(0, maxBaseNameLength);
                }
                // Use platform-native GUID for robust uniqueness
                var randomSuffix = Platform.Function.GUID().substring(0, 8);
                customerKey = 'FW_' + baseName + '_' + randomSuffix;
            }
            // Final truncation just in case, ensuring it never exceeds 36 chars
            if (customerKey.length > 36) {
                customerKey = customerKey.substring(0, 36);
            }

            var newFolder = {
                Name: folderData.name,
                CustomerKey: customerKey,
                ContentType: contentType,
                Description: folderData.description || '',
                IsActive: true,
                IsEditable: true,
                AllowChildren: folderData.allowChildren != false
            };

            // Determine parent folder ID
            var parentId = folderData.parentId;
            // If no parentId provided (or is 0), find the root folder for this ContentType
            // SFMC requires a valid parent folder ID - root folders have real IDs, not 0
            if (!parentId || parentId == 0) {
                parentId = getRootFolderId(contentType);
                if (!parentId) {
                    return response.error(
                        'Could not find root folder for ContentType: ' + contentType + '. Please specify a parentId.',
                        handler,
                        'create'
                    );
                }
            }

            // Always set ParentFolder with valid ID
            newFolder.ParentFolder = {
                ID: parseInt(parentId)
            };

            var result = wsProxy.create('DataFolder', newFolder);
            if (result.success) {
                // Extract new folder ID from result
                var newId = null;
                if (result.data.results && result.data.results.length > 0) {
                    newId = result.data.results[0].NewID ||
                           (result.data.results[0].Object && result.data.results[0].Object.ID);
                }

                return response.success({
                    id: newId,
                    name: folderData.name,
                    customerKey: customerKey,
                    contentType: contentType,
                    parentId: parentId,
                    created: true
                }, handler, 'create');
            } else {
                return response.error(result.error ? result.error.message : 'Failed to create folder', handler, 'create');
            }
        } catch (ex) {
            return response.error('Create error: ' + (ex.message || String(ex)), handler, 'create');
        }
    }

    /**
     * Updates existing folder
     *
     * @param {number} folderId - Folder ID
     * @param {object} folderData - Updated folder data
     * @param {string} folderData.name - New folder name
     * @param {string} folderData.description - New description
     * @param {number} folderData.parentId - New parent folder ID (for moving)
     * @returns {object} Response
     */
    function update(folderId, folderData) {
        var validation = validateWSProxy();
        if (validation) return validation;

        if (!folderId) {
            return response.validationError('folderId', 'Folder ID is required', handler, 'update');
        }

        try {
            var updateData = {
                ID: parseInt(folderId)
            };

            // Add fields to update
            if (folderData.name) {
                updateData.Name = folderData.name;
            }
            if (folderData.description != undefined) {
                updateData.Description = folderData.description;
            }
            if (folderData.parentId != undefined) {
                updateData.ParentFolder = {
                    ID: parseInt(folderData.parentId, 10)
                };
            }
            if (folderData.allowChildren != undefined) {
                updateData.AllowChildren = folderData.allowChildren;
            }

            var result = wsProxy.update('DataFolder', updateData);

            if (result.success) {
                return response.success({
                    id: folderId,
                    updated: true
                }, handler, 'update');
            } else {
                return response.error(result.error ? result.error.message : 'Failed to update folder', handler, 'update');
            }
        } catch (ex) {
            return response.error('Update error: ' + (ex.message || String(ex)), handler, 'update');
        }
    }

    /**
     * Deletes folder (must be empty)
     *
     * @param {number} folderId - Folder ID
     * @returns {object} Response
     */
    function remove(folderId) {
        var validation = validateWSProxy();
        if (validation) return validation;

        if (!folderId) {
            return response.validationError('folderId', 'Folder ID is required', handler, 'remove');
        }

        try {
            var result = wsProxy.remove('DataFolder', { ID: parseInt(folderId, 10) });

            if (result.success) {
                return response.success({
                    id: folderId,
                    deleted: true
                }, handler, 'remove');
            } else {
                return response.error(result.error ? result.error.message : 'Failed to delete folder', handler, 'remove');
            }
        } catch (ex) {
            return response.error('Remove error: ' + (ex.message || String(ex)), handler, 'remove');
        }
    }

    /**
     * Deletes folder and all its subfolders recursively
     *
     * @param {number} folderId - Folder ID to delete
     * @returns {object} Response with deletion summary
     */
    function removeRecursive(folderId) {
        var validation = validateWSProxy();
        if (validation) return validation;

        if (!folderId) {
            return response.validationError('folderId', 'Folder ID is required', handler, 'removeRecursive');
        }

        var deletedFolders = [];
        var errors = [];

        function deleteRecursively(id) {
            // First, find and delete all child folders
            var childrenResult = list({ parentId: id });

            if (childrenResult.success && childrenResult.data.folders && childrenResult.data.folders.length > 0) {
                var children = childrenResult.data.folders;
                for (var i = 0; i < children.length; i++) {
                    deleteRecursively(children[i].id);
                }
            }

            // Then delete this folder
            var deleteResult = remove(id);
            if (deleteResult.success) {
                deletedFolders.push(id);
            } else {
                errors.push({
                    id: id,
                    error: deleteResult.error ? deleteResult.error.message : 'Unknown error'
                });
            }
        }

        try {
            deleteRecursively(folderId);

            if (errors.length == 0) {
                return response.success({
                    deletedCount: deletedFolders.length,
                    deletedFolders: deletedFolders
                }, handler, 'removeRecursive');
            } else {
                return response.error('Some folders could not be deleted', handler, 'removeRecursive', {
                    deletedCount: deletedFolders.length,
                    deletedFolders: deletedFolders,
                    errors: errors
                });
            }
        } catch (ex) {
            return response.error('RemoveRecursive error: ' + (ex.message || String(ex)), handler, 'removeRecursive');
        }
    }

    /**
     * Gets child folders of a parent folder
     *
     * @param {number} parentFolderId - Parent folder ID (0 for root)
     * @param {string} contentType - Optional ContentType filter
     * @returns {object} Response with child folders
     */
    function getChildren(parentFolderId, contentType) {
        return list({
            parentId: parentFolderId || 0,
            contentType: contentType
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
        var validation = validateWSProxy();
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
        var validation = validateWSProxy();
        if (validation) return validation;

        if (!folderId) {
            return response.validationError('folderId', 'Folder ID is required', handler, 'getPath');
        }

        try {
            var path = [];
            var currentFolderId = folderId;

            // Traverse up to root (max 50 levels to prevent infinite loops)
            var maxLevels = 50;
            var level = 0;

            while (currentFolderId > 0 && level < maxLevels) {
                var folderResult = get(currentFolderId);

                if (!folderResult.success) {
                    return folderResult;
                }

                var folder = folderResult.data;
                path.unshift({
                    id: folder.id,
                    name: folder.name
                });
                currentFolderId = folder.parentId || 0;
                level++;
            }

            // ES3-compatible: build path string without map()
            var pathNames = [];
            for (var p = 0; p < path.length; p++) {
                pathNames.push(path[p].name);
            }
            var pathString = '/' + pathNames.join('/');

            return response.success({
                path: pathString,
                folders: path,
                depth: path.length
            }, handler, 'getPath');
        } catch (ex) {
            return response.error('GetPath error: ' + (ex.message || String(ex)), handler, 'getPath');
        }
    }

    /**
     * Creates folder structure from text with indentation
     *
     * @param {number} parentFolderId - Base parent folder ID
     * @param {string} structure - Folder structure (tab-indented lines)
     * @param {string} contentType - ContentType for all folders
     * @returns {object} Response with creation summary
     */
    function createStructure(parentFolderId, structure, contentType) {
        var validation = validateWSProxy();
        if (validation) return validation;

        if (!structure) {
            return response.validationError('structure', 'Folder structure is required', handler, 'createStructure');
        }

        try {
            var folderType = contentType || CONTENT_TYPES.CONTENTBUILDER;

            // Resolve base parent folder ID
            // If no parentFolderId provided, find the root folder for this ContentType
            var baseParentId = parentFolderId;
            if (!baseParentId || baseParentId == 0) {
                baseParentId = getRootFolderId(folderType);
                if (!baseParentId) {
                    return response.error(
                        'Could not find root folder for ContentType: ' + folderType + '. Please specify a parentFolderId.',
                        handler,
                        'createStructure'
                    );
                }
            }

            var lines = structure.split('\n');
            var createdFolders = [];
            var existedFolders = [];
            var errors = [];
            var folderStack = []; // Stack to track parent folders by level

            // Build a map of existing folders for duplicate checking
            var existingResult = list({ contentType: folderType });
            var folderMap = {};

            if (existingResult.success && existingResult.data.folders) {
                var existing = existingResult.data.folders;
                for (var e = 0; e < existing.length; e++) {
                    var key = existing[e].name + '_' + existing[e].parentId;
                    folderMap[key] = existing[e].id;
                }
            }

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];

                if (!line || line.replace(/\s/g, '') == '') {
                    continue;
                }

                // Count leading tabs to determine level
                var tabCount = 0;
                for (var j = 0; j < line.length; j++) {
                    if (line.charAt(j) == '\t') {
                        tabCount++;
                    } else {
                        break;
                    }
                }

                var folderName = line.substring(tabCount).replace(/^\s+|\s+$/g, ''); // trim
                if (!folderName) continue;

                // Determine parent based on level
                var currentParent = baseParentId;
                if (tabCount == 0) {
                    // Root level - reset stack
                    folderStack = [];
                } else if (tabCount > 0 && folderStack.length >= tabCount) {
                    // Child level - get parent from stack
                    currentParent = folderStack[tabCount - 1];
                }

                // Check if folder already exists
                var folderKey = folderName + '_' + currentParent;
                var existingId = folderMap[folderKey];

                if (existingId) {
                    // Folder already exists
                    folderStack[tabCount] = existingId;
                    existedFolders.push({
                        name: folderName,
                        id: existingId,
                        level: tabCount
                    });
                } else {
                    // Create new folder
                    var createResult = create({
                        name: folderName,
                        parentId: currentParent,
                        contentType: folderType,
                        description: 'Created by FolderHandler.createStructure'
                    });

                    if (createResult.success) {
                        var newFolderId = createResult.data.id;
                        folderStack[tabCount] = newFolderId;
                        folderMap[folderKey] = newFolderId;
                        createdFolders.push({
                            name: folderName,
                            id: newFolderId,
                            level: tabCount,
                            parentId: currentParent
                        });
                    } else {
                        errors.push({
                            name: folderName,
                            error: createResult.error ? createResult.error.message : 'Unknown error',
                            level: tabCount
                        });
                    }
                }
            }

            return response.success({
                created: createdFolders,
                existed: existedFolders,
                errors: errors,
                totalCreated: createdFolders.length,
                totalExisted: existedFolders.length,
                totalErrors: errors.length
            }, handler, 'createStructure');
        } catch (ex) {
            return response.error('CreateStructure error: ' + (ex.message || String(ex)), handler, 'createStructure');
        }
    }

    /**
     * Checks if a folder exists by name and parent
     *
     * @param {string} name - Folder name
     * @param {number} parentId - Parent folder ID
     * @param {string} contentType - ContentType to search
     * @returns {object} Response with exists flag and folder data if found
     */
    function exists(name, parentId, contentType) {
        var result = getByName(name, parentId, contentType);

        if (result.success) {
            return response.success({
                exists: true,
                folder: result.data
            }, handler, 'exists');
        } else {
            return response.success({
                exists: false,
                folder: null
            }, handler, 'exists');
        }
    }

    /**
     * Creates folder only if it doesn't exist
     *
     * @param {object} folderData - Folder configuration (same as create())
     * @returns {object} Response with folder data and created flag
     */
    function createIfNotExists(folderData) {
        if (!folderData || !folderData.name) {
            return response.validationError('name', 'Folder name is required', handler, 'createIfNotExists');
        }

        var contentType = folderData.contentType || CONTENT_TYPES.CONTENTBUILDER;

        // Resolve parent ID - use root folder if not specified
        var parentId = folderData.parentId;
        if (!parentId || parentId == 0) {
            parentId = getRootFolderId(contentType);
            if (!parentId) {
                return response.error(
                    'Could not find root folder for ContentType: ' + contentType + '. Please specify a parentId.',
                    handler,
                    'createIfNotExists'
                );
            }
        }

        var existsResult = exists(folderData.name, parentId, contentType);

        if (existsResult.success && existsResult.data.exists) {
            return response.success({
                created: false,
                folder: existsResult.data.folder
            }, handler, 'createIfNotExists');
        }

        // Pass resolved parentId to create
        var createData = {
            name: folderData.name,
            parentId: parentId,
            contentType: contentType,
            customerKey: folderData.customerKey,
            description: folderData.description,
            allowChildren: folderData.allowChildren
        };

        var createResult = create(createData);
        if (createResult.success) {
            return response.success({
                created: true,
                folder: createResult.data
            }, handler, 'createIfNotExists');
        }

        return createResult;
    }

    /**
     * Gets the root folder for a specific ContentType
     * Root folders in SFMC have real IDs (not 0) and no parent folder
     *
     * @param {string} contentType - ContentType to find root for (e.g., 'asset', 'dataextension')
     * @returns {object} Response with root folder details
     */
    function getRootFolder(contentType) {
        var validation = validateWSProxy();
        if (validation) return validation;

        var folderType = contentType || CONTENT_TYPES.CONTENTBUILDER;

        try {
            var rootId = getRootFolderId(folderType);
            
            if (rootId) {
                // Get full folder details
                return get(rootId);
            } else {
                return response.error(
                    'Could not find root folder for ContentType: ' + folderType,
                    handler,
                    'getRootFolder'
                );
            }
        } catch (ex) {
            return response.error('GetRootFolder error: ' + (ex.message || String(ex)), handler, 'getRootFolder');
        }
    }

    // Public API
    this.list = list;
    this.get = get;
    this.getByCustomerKey = getByCustomerKey;
    this.getByName = getByName;
    this.create = create;
    this.update = update;
    this.remove = remove;
    this.removeRecursive = removeRecursive;
    this.getChildren = getChildren;
    this.move = move;
    this.getPath = getPath;
    this.createStructure = createStructure;
    this.exists = exists;
    this.createIfNotExists = createIfNotExists;
    this.getRootFolder = getRootFolder;

    // Expose constants
    this.CONTENT_TYPES = CONTENT_TYPES;
}

// ===================================================
// OMEGAFRAMEWORK MODULE REGISTRATION
// ===================================================
if (typeof OmegaFramework != 'undefined' && typeof OmegaFramework.register == 'function') {
    OmegaFramework.register('FolderHandler', {
        dependencies: ['ResponseWrapper', 'WSProxyWrapper'],
        blockKey: 'OMG_FW_FolderHandler',
        factory: function(responseWrapperInstance, wsProxyWrapperInstance, config) {
            return new FolderHandler(responseWrapperInstance, wsProxyWrapperInstance);
        }
    });
}

</script>
