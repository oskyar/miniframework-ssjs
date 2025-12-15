<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * JourneyHandler - Journey Builder and Event Definitions management
 *
 * Manages Journey Builder journeys including listing, creating, publishing,
 * stopping, versioning, status monitoring, and Event Definitions for entry sources.
 *
 * Journey States (status parameter values):
 * - Draft: Journey is being designed
 * - Published: Journey is active and running
 * - Stopped: Journey has been stopped
 * - ScheduledToPublish: Journey is scheduled to start
 * - Paused: Journey is paused (no new entries, existing continue)
 * - Unpublished: Journey was unpublished
 * - Deleted: Journey was deleted
 *
 * Event Definition Types:
 * - Event: Generic event type
 * - ContactEvent: Contact-related event
 * - DateEvent: Date-triggered event
 * - RestEvent: REST API-triggered event
 *
 * API Endpoints Reference:
 * @see https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/getInteractionCollection.html
 * @see https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/jb-api-specification.html
 * @see https://developer.salesforce.com/docs/marketing/marketing-cloud/references/mc_rest_interaction/postEvent.html
 * @see https://developer.salesforce.com/docs/marketing/marketing-cloud/references/mc_rest_interaction/getEventDefinitions.html
 *
 * @version 4.2.0
 * @author OmegaFramework
 */
function JourneyHandler(responseWrapper, sfmcIntegrationInstance) {
    var handler = 'JourneyHandler';
    var response = responseWrapper;
    var sfmc = sfmcIntegrationInstance;

    // ========================================================================
    // CONSTANTS - Journey States and Statuses
    // Based on official SFMC documentation
    // ========================================================================

    /**
     * Journey status values for filtering
     * @see https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/getInteractionCollection.html
     */
    var JOURNEY_STATUS = {
        DRAFT: 'Draft',
        PUBLISHED: 'Published',
        STOPPED: 'Stopped',
        SCHEDULED: 'ScheduledToPublish',
        PAUSED: 'Paused',
        UNPUBLISHED: 'Unpublished',
        DELETED: 'Deleted'
    };

    /**
     * Sort fields available for $orderBy parameter
     * Values: ModifiedDate, Name, Performance (each with ASC or DESC)
     */
    var ORDER_BY = {
        MODIFIED_DATE_DESC: 'ModifiedDate DESC',
        MODIFIED_DATE_ASC: 'ModifiedDate ASC',
        NAME_DESC: 'Name DESC',
        NAME_ASC: 'Name ASC',
        PERFORMANCE_DESC: 'Performance DESC',
        PERFORMANCE_ASC: 'Performance ASC'
    };

    /**
     * Extra data options for the 'extras' parameter
     */
    var EXTRAS = {
        ALL: 'all',
        ACTIVITIES: 'activities',
        OUTCOMES: 'outcomes',
        STATS: 'stats'
    };

    /**
     * Entry Mode types for journey configuration
     */
    var ENTRY_MODE = {
        SINGLE_ENTRY: 'SingleEntry',
        MULTIPLE_ENTRY: 'MultipleEntry',
        REENTRY_ONLY: 'ReentryOnly'
    };

    /**
     * Definition types for filtering
     */
    var DEFINITION_TYPE = {
        TRANSACTIONAL: 'transactional'
    };

    /**
     * Event definition types
     * @see https://developer.salesforce.com/docs/marketing/marketing-cloud/references/mc_rest_interaction/createEventDefinition.html
     */
    var EVENT_TYPE = {
        EVENT: 'Event',
        CONTACT_EVENT: 'ContactEvent',
        DATE_EVENT: 'DateEvent',
        REST_EVENT: 'RestEvent'
    };

    /**
     * Event definition modes
     */
    var EVENT_MODE = {
        PRODUCTION: 'Production',
        TEST: 'Test'
    };

    function validateIntegration() {
        if (!sfmc) {
            return response.error('SFMCIntegration instance is required', handler, 'validateIntegration');
        }
        return null;
    }

    // ========================================================================
    // LIST AND RETRIEVE METHODS
    // GET /interaction/v1/interactions
    // ========================================================================

    /**
     * Lists all journeys with optional filtering
     *
     * @see https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/getInteractionCollection.html
     *
     * @param {object} options - Query options
     * @param {number} options.page - Page number (starts at 1, default: 1)
     * @param {number} options.pageSize - Results per page (1-50, default: 50, max: 50)
     * @param {string} options.status - Filter by status: Draft, Published, Stopped, ScheduledToPublish, Paused, Unpublished, Deleted
     * @param {string} options.nameOrDescription - Search by name or description
     * @param {string} options.orderBy - Sort field: ModifiedDate DESC (default), Name ASC, Performance DESC, etc.
     * @param {string} options.extras - Additional data: all, activities, outcomes, stats
     * @param {string} options.key - Filter by journey key (external identifier)
     * @param {string} options.id - Filter by journey ID
     * @param {boolean} options.mostRecentVersionOnly - Return only most recent version (default: true)
     * @param {string} options.tag - Filter by assigned tag
     * @param {string} options.definitionType - Filter by definition type: transactional
     * @param {number} options.versionNumber - Specific version to retrieve
     * @param {number} options.specificApiVersionNumber - Workflow API version (default: 1)
     * @returns {object} Response with journey list
     */
    function list(options) {
        var validation = validateIntegration();
        if (validation) return validation;

        try {
            var opts = options || {};
            var queryParams = {};

            // Pagination (official params use $ prefix)
            if (opts.page) {
                queryParams['$page'] = opts.page;
            }
            if (opts.pageSize) {
                // Max 50 per documentation
                queryParams['$pageSize'] = Math.min(opts.pageSize, 50);
            }

            // Sorting
            if (opts.orderBy) {
                queryParams['$orderBy'] = opts.orderBy;
            }

            // Filtering
            if (opts.status) {
                queryParams['status'] = opts.status;
            }
            if (opts.nameOrDescription) {
                queryParams['nameOrDescription'] = opts.nameOrDescription;
            }
            if (opts.key) {
                queryParams['key'] = opts.key;
            }
            if (opts.id) {
                queryParams['id'] = opts.id;
            }
            if (opts.tag) {
                queryParams['tag'] = opts.tag;
            }
            if (opts.definitionType) {
                queryParams['definitionType'] = opts.definitionType;
            }

            // Version control
            if (opts.mostRecentVersionOnly !== undefined) {
                queryParams['mostRecentVersionOnly'] = opts.mostRecentVersionOnly;
            }
            if (opts.versionNumber) {
                queryParams['versionNumber'] = opts.versionNumber;
            }
            if (opts.specificApiVersionNumber) {
                queryParams['specificApiVersionNumber'] = opts.specificApiVersionNumber;
            }

            // Extras (all, activities, outcomes, stats)
            if (opts.extras) {
                queryParams['extras'] = opts.extras;
            }

            var result = sfmc.makeRestRequest('GET', '/interaction/v1/interactions', null, {
                queryParams: queryParams
            });

            if (result.success && result.data) {
                // Normalize response
                var items = result.data.items || [];
                return response.success({
                    items: items,
                    count: result.data.count || items.length,
                    page: result.data.page || 1,
                    pageSize: result.data.pageSize || items.length
                }, handler, 'list');
            }

            return result;
        } catch (ex) {
            return response.error('List error: ' + (ex.message || String(ex)), handler, 'list');
        }
    }

    /**
     * Gets journey by ID
     * GET /interaction/v1/interactions/{id}
     *
     * @param {string} journeyId - Journey ID (GUID)
     * @param {object} options - Additional options
     * @param {string} options.extras - Extra data: all, activities, outcomes, stats
     * @param {number} options.versionNumber - Specific version to retrieve (defaults to latest)
     * @returns {object} Response with journey details
     */
    function get(journeyId, options) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!journeyId) {
            return response.validationError('journeyId', 'Journey ID is required', handler, 'get');
        }

        try {
            var opts = options || {};
            var queryParams = {};

            if (opts.extras) {
                queryParams['extras'] = opts.extras;
            }
            if (opts.versionNumber) {
                queryParams['versionNumber'] = opts.versionNumber;
            }

            var result = sfmc.makeRestRequest('GET', '/interaction/v1/interactions/' + journeyId, null, {
                queryParams: queryParams
            });

            return result;
        } catch (ex) {
            return response.error('Get error: ' + (ex.message || String(ex)), handler, 'get');
        }
    }

    /**
     * Gets journey by key (CustomerKey/external identifier)
     * GET /interaction/v1/interactions/key:{key}
     *
     * @param {string} key - Journey key (prefix with key: is handled automatically)
     * @param {object} options - Additional options
     * @param {string} options.extras - Extra data: all, activities, outcomes, stats
     * @returns {object} Response with journey details
     */
    function getByKey(key, options) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!key) {
            return response.validationError('key', 'Journey key is required', handler, 'getByKey');
        }

        try {
            var opts = options || {};
            var queryParams = {};

            if (opts.extras) {
                queryParams['extras'] = opts.extras;
            }

            // Use key: prefix as per documentation
            var result = sfmc.makeRestRequest('GET', '/interaction/v1/interactions/key:' + key, null, {
                queryParams: queryParams
            });

            return result;
        } catch (ex) {
            return response.error('GetByKey error: ' + (ex.message || String(ex)), handler, 'getByKey');
        }
    }

    // ========================================================================
    // CREATE AND UPDATE METHODS
    // POST /interaction/v1/interactions
    // PUT /interaction/v1/interactions/{id}
    // ========================================================================

    /**
     * Creates new journey
     * POST /interaction/v1/interactions
     *
     * @param {object} journeyData - Journey configuration
     * @param {string} journeyData.name - Journey name (required)
     * @param {string} journeyData.key - Journey key/CustomerKey
     * @param {string} journeyData.description - Journey description
     * @param {string} journeyData.workflowApiVersion - API version (default 1.0)
     * @param {array} journeyData.triggers - Entry triggers
     * @param {array} journeyData.activities - Journey activities
     * @param {object} journeyData.goals - Journey goals
     * @param {object} journeyData.entryMode - Entry mode settings
     * @param {object} journeyData.defaults - Default settings
     * @returns {object} Response with created journey
     */
    function create(journeyData) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!journeyData || !journeyData.name) {
            return response.validationError('name', 'Journey name is required', handler, 'create');
        }

        try {
            // Build journey object
            var journey = {
                name: journeyData.name,
                workflowApiVersion: journeyData.workflowApiVersion || '1.0'
            };

            // Optional fields
            if (journeyData.key) {
                journey.key = journeyData.key;
            }
            if (journeyData.description) {
                journey.description = journeyData.description;
            }
            if (journeyData.triggers) {
                journey.triggers = journeyData.triggers;
            }
            if (journeyData.activities) {
                journey.activities = journeyData.activities;
            }
            if (journeyData.goals) {
                journey.goals = journeyData.goals;
            }
            if (journeyData.entryMode) {
                journey.entryMode = journeyData.entryMode;
            }
            if (journeyData.defaults) {
                journey.defaults = journeyData.defaults;
            }

            var result = sfmc.makeRestRequest('POST', '/interaction/v1/interactions', journey);

            return result;
        } catch (ex) {
            return response.error('Create error: ' + (ex.message || String(ex)), handler, 'create');
        }
    }

    /**
     * Updates existing journey (draft version only)
     * PUT /interaction/v1/interactions/{id}
     *
     * @param {string} journeyId - Journey ID
     * @param {object} journeyData - Updated journey data
     * @returns {object} Response
     */
    function update(journeyId, journeyData) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!journeyId) {
            return response.validationError('journeyId', 'Journey ID is required', handler, 'update');
        }

        try {
            // Ensure ID is included in payload
            journeyData.id = journeyId;

            var result = sfmc.makeRestRequest('PUT', '/interaction/v1/interactions/' + journeyId, journeyData);

            return result;
        } catch (ex) {
            return response.error('Update error: ' + (ex.message || String(ex)), handler, 'update');
        }
    }

    /**
     * Deletes journey
     * DELETE /interaction/v1/interactions/{id}
     *
     * @param {string} journeyId - Journey ID
     * @returns {object} Response
     */
    function remove(journeyId) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!journeyId) {
            return response.validationError('journeyId', 'Journey ID is required', handler, 'remove');
        }

        try {
            var result = sfmc.makeRestRequest('DELETE', '/interaction/v1/interactions/' + journeyId);

            if (result.success) {
                return response.success({
                    id: journeyId,
                    deleted: true
                }, handler, 'remove');
            }

            return result;
        } catch (ex) {
            return response.error('Remove error: ' + (ex.message || String(ex)), handler, 'remove');
        }
    }

    // ========================================================================
    // PUBLISH AND STOP METHODS
    // POST /interaction/v1/interactions/publishAsync/{id}
    // POST /interaction/v1/interactions/stop/{id}
    // ========================================================================

    /**
     * Publishes journey asynchronously (activates it)
     * POST /interaction/v1/interactions/publishAsync/{id}?versionNumber={versionNumber}
     *
     * @param {string} journeyId - Journey ID
     * @param {number} versionNumber - Version to publish (optional)
     * @returns {object} Response with statusId for checking publish progress
     */
    function publish(journeyId, versionNumber) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!journeyId) {
            return response.validationError('journeyId', 'Journey ID is required', handler, 'publish');
        }

        try {
            var endpoint = '/interaction/v1/interactions/publishAsync/' + journeyId;
            if (versionNumber) {
                endpoint += '?versionNumber=' + versionNumber;
            }

            var result = sfmc.makeRestRequest('POST', endpoint);

            return result;
        } catch (ex) {
            return response.error('Publish error: ' + (ex.message || String(ex)), handler, 'publish');
        }
    }

    /**
     * Stops a running journey
     * POST /interaction/v1/interactions/stop/{id}?versionNumber={versionNumber}
     *
     * @param {string} journeyId - Journey ID
     * @param {number} versionNumber - Version to stop (optional)
     * @returns {object} Response
     */
    function stop(journeyId, versionNumber) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!journeyId) {
            return response.validationError('journeyId', 'Journey ID is required', handler, 'stop');
        }

        try {
            var endpoint = '/interaction/v1/interactions/stop/' + journeyId;
            if (versionNumber) {
                endpoint += '?versionNumber=' + versionNumber;
            }

            var result = sfmc.makeRestRequest('POST', endpoint);

            return result;
        } catch (ex) {
            return response.error('Stop error: ' + (ex.message || String(ex)), handler, 'stop');
        }
    }

    /**
     * Gets the status of an async publish operation
     * GET /interaction/v1/interactions/publishStatus/{statusId}
     *
     * @param {string} statusId - Status ID returned from publish() call
     * @returns {object} Response with publish progress
     */
    function getPublishStatus(statusId) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!statusId) {
            return response.validationError('statusId', 'Status ID is required', handler, 'getPublishStatus');
        }

        try {
            var result = sfmc.makeRestRequest(
                'GET',
                '/interaction/v1/interactions/publishStatus/' + statusId
            );

            return result;
        } catch (ex) {
            return response.error('GetPublishStatus error: ' + (ex.message || String(ex)), handler, 'getPublishStatus');
        }
    }

    // ========================================================================
    // AUDIT AND HISTORY METHODS
    // GET /interaction/v1/interactions/{id}/audit/{action}
    // ========================================================================

    /**
     * Gets journey audit logs
     * GET /interaction/v1/interactions/{id}/audit/{action}
     *
     * @param {string} journeyId - Journey ID or key (use key: prefix for key)
     * @param {string} action - Audit action to retrieve
     * @returns {object} Response with audit data
     */
    function getAudit(journeyId, action) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!journeyId) {
            return response.validationError('journeyId', 'Journey ID is required', handler, 'getAudit');
        }

        if (!action) {
            return response.validationError('action', 'Audit action is required', handler, 'getAudit');
        }

        try {
            var result = sfmc.makeRestRequest(
                'GET',
                '/interaction/v1/interactions/' + journeyId + '/audit/' + action
            );

            return result;
        } catch (ex) {
            return response.error('GetAudit error: ' + (ex.message || String(ex)), handler, 'getAudit');
        }
    }

    // ========================================================================
    // SEARCH AND FILTER METHODS
    // ========================================================================

    /**
     * Search journeys by name or description
     *
     * @param {string} searchTerm - Search term for nameOrDescription parameter
     * @param {object} options - Additional options (page, pageSize, status, orderBy)
     * @returns {object} Response with matching journeys
     */
    function search(searchTerm, options) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!searchTerm) {
            return response.validationError('searchTerm', 'Search term is required', handler, 'search');
        }

        var opts = options || {};
        opts.nameOrDescription = searchTerm;

        return list(opts);
    }

    /**
     * Gets journeys by status
     *
     * @param {string} status - Journey status: Draft, Published, Stopped, ScheduledToPublish, Paused, Unpublished, Deleted
     * @param {object} options - Additional options (page, pageSize, orderBy)
     * @returns {object} Response with journeys
     */
    function getByStatus(status, options) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!status) {
            return response.validationError('status', 'Status is required', handler, 'getByStatus');
        }

        var opts = options || {};
        opts.status = status;

        return list(opts);
    }

    /**
     * Gets journeys by tag
     *
     * @param {string} tag - Tag to filter by
     * @param {object} options - Additional options (page, pageSize, status, orderBy)
     * @returns {object} Response with tagged journeys
     */
    function getByTag(tag, options) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!tag) {
            return response.validationError('tag', 'Tag is required', handler, 'getByTag');
        }

        var opts = options || {};
        opts.tag = tag;

        return list(opts);
    }

    /**
     * Gets all published (active) journeys
     *
     * @param {object} options - Additional options (page, pageSize, orderBy)
     * @returns {object} Response with published journeys
     */
    function getPublished(options) {
        return getByStatus(JOURNEY_STATUS.PUBLISHED, options);
    }

    /**
     * Gets all draft journeys
     *
     * @param {object} options - Additional options (page, pageSize, orderBy)
     * @returns {object} Response with draft journeys
     */
    function getDrafts(options) {
        return getByStatus(JOURNEY_STATUS.DRAFT, options);
    }

    /**
     * Gets all stopped journeys
     *
     * @param {object} options - Additional options (page, pageSize, orderBy)
     * @returns {object} Response with stopped journeys
     */
    function getStopped(options) {
        return getByStatus(JOURNEY_STATUS.STOPPED, options);
    }

    /**
     * Gets all paused journeys
     *
     * @param {object} options - Additional options (page, pageSize, orderBy)
     * @returns {object} Response with paused journeys
     */
    function getPaused(options) {
        return getByStatus(JOURNEY_STATUS.PAUSED, options);
    }

    // ========================================================================
    // EVENT DEFINITION METHODS
    // GET/POST/PUT/DELETE /interaction/v1/eventDefinitions
    // @see https://developer.salesforce.com/docs/marketing/marketing-cloud/references/mc_rest_interaction/getEventDefinitions.html
    // ========================================================================

    /**
     * Lists all event definitions with optional filtering
     * GET /interaction/v1/eventDefinitions
     *
     * @param {object} options - Query options
     * @param {number} options.page - Page number (starts at 1, default: 1)
     * @param {number} options.pageSize - Results per page (1-50, default: 50, max: 50)
     * @param {string} options.name - Filter by event definition name (searches entire name)
     * @returns {object} Response with event definitions list
     */
    function listEventDefinitions(options) {
        var validation = validateIntegration();
        if (validation) return validation;

        try {
            var opts = options || {};
            var queryParams = {};

            // Pagination
            if (opts.page) {
                queryParams['$page'] = opts.page;
            }
            if (opts.pageSize) {
                queryParams['$pageSize'] = Math.min(opts.pageSize, 50);
            }

            // Filter by name
            if (opts.name) {
                queryParams['name'] = opts.name;
            }

            var result = sfmc.makeRestRequest('GET', '/interaction/v1/eventDefinitions', null, {
                queryParams: queryParams
            });

            if (result.success && result.data) {
                var items = result.data.items || [];
                return response.success({
                    items: items,
                    count: result.data.count || items.length,
                    page: result.data.page || 1,
                    pageSize: result.data.pageSize || items.length
                }, handler, 'listEventDefinitions');
            }

            return result;
        } catch (ex) {
            return response.error('ListEventDefinitions error: ' + (ex.message || String(ex)), handler, 'listEventDefinitions');
        }
    }

    /**
     * Gets event definition by ID
     * GET /interaction/v1/eventDefinitions/{id}
     *
     * @param {string} eventDefId - Event definition ID (GUID)
     * @returns {object} Response with event definition details
     */
    function getEventDefinition(eventDefId) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!eventDefId) {
            return response.validationError('eventDefId', 'Event definition ID is required', handler, 'getEventDefinition');
        }

        try {
            var result = sfmc.makeRestRequest('GET', '/interaction/v1/eventDefinitions/' + eventDefId);

            return result;
        } catch (ex) {
            return response.error('GetEventDefinition error: ' + (ex.message || String(ex)), handler, 'getEventDefinition');
        }
    }

    /**
     * Gets event definition by key
     * GET /interaction/v1/eventDefinitions/key:{key}
     *
     * @param {string} eventDefKey - Event definition key
     * @returns {object} Response with event definition details
     */
    function getEventDefinitionByKey(eventDefKey) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!eventDefKey) {
            return response.validationError('eventDefKey', 'Event definition key is required', handler, 'getEventDefinitionByKey');
        }

        try {
            var result = sfmc.makeRestRequest('GET', '/interaction/v1/eventDefinitions/key:' + eventDefKey);

            return result;
        } catch (ex) {
            return response.error('GetEventDefinitionByKey error: ' + (ex.message || String(ex)), handler, 'getEventDefinitionByKey');
        }
    }

    /**
     * Creates new event definition
     * POST /interaction/v1/eventDefinitions
     *
     * @see https://developer.salesforce.com/docs/marketing/marketing-cloud/references/mc_rest_interaction/createEventDefinition.html
     *
     * @param {object} eventDefData - Event definition configuration
     * @param {string} eventDefData.eventDefinitionKey - Unique ID for the event (required, no special characters)
     * @param {string} eventDefData.name - Display name for the event (required)
     * @param {string} eventDefData.type - Event type: Event, ContactEvent, DateEvent, RestEvent (required)
     * @param {string} eventDefData.dataExtensionId - Data Extension ID (required if no schema)
     * @param {object} eventDefData.schema - Schema for creating DE (required if no dataExtensionId)
     * @param {string} eventDefData.description - Event description
     * @param {string} eventDefData.category - Event category (default: Event)
     * @param {string} eventDefData.mode - Production or Test (default: Production)
     * @param {boolean} eventDefData.isVisibleInPicker - Show in Journey Builder picker
     * @param {string} eventDefData.iconUrl - Icon URL for Event Administration
     * @returns {object} Response with created event definition
     */
    function createEventDefinition(eventDefData) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!eventDefData || !eventDefData.eventDefinitionKey) {
            return response.validationError('eventDefinitionKey', 'Event definition key is required', handler, 'createEventDefinition');
        }

        if (!eventDefData.name) {
            return response.validationError('name', 'Event definition name is required', handler, 'createEventDefinition');
        }

        if (!eventDefData.type) {
            return response.validationError('type', 'Event type is required', handler, 'createEventDefinition');
        }

        if (!eventDefData.dataExtensionId && !eventDefData.schema) {
            return response.validationError('dataExtensionId', 'Either dataExtensionId or schema is required', handler, 'createEventDefinition');
        }

        try {
            // Build event definition object
            var eventDef = {
                eventDefinitionKey: eventDefData.eventDefinitionKey,
                name: eventDefData.name,
                type: eventDefData.type
            };

            // Data source (one is required)
            if (eventDefData.dataExtensionId) {
                eventDef.dataExtensionId = eventDefData.dataExtensionId;
            }
            if (eventDefData.schema) {
                eventDef.schema = eventDefData.schema;
            }

            // Optional fields
            if (eventDefData.description) {
                eventDef.description = eventDefData.description;
            }
            if (eventDefData.category) {
                eventDef.category = eventDefData.category;
            }
            if (eventDefData.mode) {
                eventDef.mode = eventDefData.mode;
            }
            if (eventDefData.isVisibleInPicker !== undefined) {
                eventDef.isVisibleInPicker = eventDefData.isVisibleInPicker;
            }
            if (eventDefData.iconUrl) {
                eventDef.iconUrl = eventDefData.iconUrl;
            }
            if (eventDefData.sourceApplicationExtensionId) {
                eventDef.sourceApplicationExtensionId = eventDefData.sourceApplicationExtensionId;
            }
            if (eventDefData.arguments) {
                eventDef.arguments = eventDefData.arguments;
            }
            if (eventDefData.metaData) {
                eventDef.metaData = eventDefData.metaData;
            }

            var result = sfmc.makeRestRequest('POST', '/interaction/v1/eventDefinitions', eventDef);

            return result;
        } catch (ex) {
            return response.error('CreateEventDefinition error: ' + (ex.message || String(ex)), handler, 'createEventDefinition');
        }
    }

    /**
     * Updates existing event definition
     * PUT /interaction/v1/eventDefinitions/{id}
     *
     * Note: Only limited fields can be updated after creation
     *
     * @param {string} eventDefId - Event definition ID
     * @param {object} eventDefData - Updated event definition data
     * @param {string} eventDefData.name - Display name
     * @param {string} eventDefData.eventDefinitionKey - Event definition key
     * @param {string} eventDefData.dataExtensionId - Data Extension ID
     * @param {string} eventDefData.sourceApplicationExtensionId - Source application extension ID
     * @returns {object} Response
     */
    function updateEventDefinition(eventDefId, eventDefData) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!eventDefId) {
            return response.validationError('eventDefId', 'Event definition ID is required', handler, 'updateEventDefinition');
        }

        try {
            var result = sfmc.makeRestRequest('PUT', '/interaction/v1/eventDefinitions/' + eventDefId, eventDefData);

            return result;
        } catch (ex) {
            return response.error('UpdateEventDefinition error: ' + (ex.message || String(ex)), handler, 'updateEventDefinition');
        }
    }

    /**
     * Updates event definition by key
     * PUT /interaction/v1/eventDefinitions/key:{key}
     *
     * @param {string} eventDefKey - Event definition key
     * @param {object} eventDefData - Updated event definition data
     * @returns {object} Response
     */
    function updateEventDefinitionByKey(eventDefKey, eventDefData) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!eventDefKey) {
            return response.validationError('eventDefKey', 'Event definition key is required', handler, 'updateEventDefinitionByKey');
        }

        try {
            var result = sfmc.makeRestRequest('PUT', '/interaction/v1/eventDefinitions/key:' + eventDefKey, eventDefData);

            return result;
        } catch (ex) {
            return response.error('UpdateEventDefinitionByKey error: ' + (ex.message || String(ex)), handler, 'updateEventDefinitionByKey');
        }
    }

    /**
     * Deletes event definition
     * DELETE /interaction/v1/eventDefinitions/{id}
     *
     * @param {string} eventDefId - Event definition ID
     * @returns {object} Response
     */
    function removeEventDefinition(eventDefId) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!eventDefId) {
            return response.validationError('eventDefId', 'Event definition ID is required', handler, 'removeEventDefinition');
        }

        try {
            var result = sfmc.makeRestRequest('DELETE', '/interaction/v1/eventDefinitions/' + eventDefId);

            if (result.success) {
                return response.success({
                    id: eventDefId,
                    deleted: true
                }, handler, 'removeEventDefinition');
            }

            return result;
        } catch (ex) {
            return response.error('RemoveEventDefinition error: ' + (ex.message || String(ex)), handler, 'removeEventDefinition');
        }
    }

    /**
     * Deletes event definition by key
     * DELETE /interaction/v1/eventDefinitions/key:{key}
     *
     * @param {string} eventDefKey - Event definition key
     * @returns {object} Response
     */
    function removeEventDefinitionByKey(eventDefKey) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!eventDefKey) {
            return response.validationError('eventDefKey', 'Event definition key is required', handler, 'removeEventDefinitionByKey');
        }

        try {
            var result = sfmc.makeRestRequest('DELETE', '/interaction/v1/eventDefinitions/key:' + eventDefKey);

            if (result.success) {
                return response.success({
                    key: eventDefKey,
                    deleted: true
                }, handler, 'removeEventDefinitionByKey');
            }

            return result;
        } catch (ex) {
            return response.error('RemoveEventDefinitionByKey error: ' + (ex.message || String(ex)), handler, 'removeEventDefinitionByKey');
        }
    }

    // ========================================================================
    // ENTRY EVENT METHODS
    // POST /interaction/v1/events
    // ========================================================================

    /**
     * Fires an entry event to inject a contact into a journey
     * POST /interaction/v1/events
     *
     * @see https://developer.salesforce.com/docs/marketing/marketing-cloud/references/mc_rest_interaction/postEvent.html
     *
     * @param {object} eventData - Event data
     * @param {string} eventData.contactKey - Unique ID of subscriber/contact (required)
     * @param {string} eventData.eventDefinitionKey - Event definition key from Event Administration (required, no periods allowed)
     * @param {object} eventData.data - Properties of the event (required if defined in custom event)
     * @returns {object} Response with eventInstanceId
     */
    function fireEntryEvent(eventData) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!eventData || !eventData.contactKey) {
            return response.validationError('contactKey', 'Contact key is required', handler, 'fireEntryEvent');
        }

        if (!eventData.eventDefinitionKey) {
            return response.validationError('eventDefinitionKey', 'Event definition key is required', handler, 'fireEntryEvent');
        }

        try {
            // Build payload per official documentation
            var payload = {
                ContactKey: eventData.contactKey,
                EventDefinitionKey: eventData.eventDefinitionKey
            };

            // Data is optional but usually needed
            if (eventData.data) {
                payload.Data = eventData.data;
            }

            var result = sfmc.makeRestRequest('POST', '/interaction/v1/events', payload);

            return result;
        } catch (ex) {
            return response.error('FireEntryEvent error: ' + (ex.message || String(ex)), handler, 'fireEntryEvent');
        }
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    // Constants
    this.JOURNEY_STATUS = JOURNEY_STATUS;
    this.ORDER_BY = ORDER_BY;
    this.EXTRAS = EXTRAS;
    this.ENTRY_MODE = ENTRY_MODE;
    this.DEFINITION_TYPE = DEFINITION_TYPE;
    this.EVENT_TYPE = EVENT_TYPE;
    this.EVENT_MODE = EVENT_MODE;

    // List and Retrieve Journeys
    this.list = list;
    this.get = get;
    this.getByKey = getByKey;

    // Create, Update, Delete Journeys
    this.create = create;
    this.update = update;
    this.remove = remove;

    // Publish and Stop Journeys
    this.publish = publish;
    this.stop = stop;
    this.getPublishStatus = getPublishStatus;

    // Audit
    this.getAudit = getAudit;

    // Search and Filter Journeys
    this.search = search;
    this.getByStatus = getByStatus;
    this.getByTag = getByTag;
    this.getPublished = getPublished;
    this.getDrafts = getDrafts;
    this.getStopped = getStopped;
    this.getPaused = getPaused;

    // Event Definitions (CRUD)
    this.listEventDefinitions = listEventDefinitions;
    this.getEventDefinition = getEventDefinition;
    this.getEventDefinitionByKey = getEventDefinitionByKey;
    this.createEventDefinition = createEventDefinition;
    this.updateEventDefinition = updateEventDefinition;
    this.updateEventDefinitionByKey = updateEventDefinitionByKey;
    this.removeEventDefinition = removeEventDefinition;
    this.removeEventDefinitionByKey = removeEventDefinitionByKey;

    // Fire Entry Events
    this.fireEntryEvent = fireEntryEvent;
}

// ============================================================================
// OMEGAFRAMEWORK MODULE REGISTRATION
// ============================================================================
if (typeof OmegaFramework != 'undefined' && typeof OmegaFramework.register == 'function') {
    OmegaFramework.register('JourneyHandler', {
        dependencies: ['ResponseWrapper', 'SFMCIntegration'],
        blockKey: 'OMG_FW_JourneyHandler',
        factory: function(responseWrapperInstance, sfmcIntegrationInstance, config) {
            return new JourneyHandler(responseWrapperInstance, sfmcIntegrationInstance);
        }
    });
}

</script>
