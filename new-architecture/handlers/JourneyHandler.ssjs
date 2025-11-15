<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * JourneyHandler - Journey Builder management
 *
 * Manages Journey Builder journeys including creation, publishing,
 * stopping, and status monitoring.
 *
 * @version 2.0.0
 * @author OmegaFramework
 */
function JourneyHandler(sfmcIntegrationInstance) {
    var handler = 'JourneyHandler';
    var response = new ResponseWrapper();
    var sfmc = sfmcIntegrationInstance;

    function validateIntegration() {
        if (!sfmc) {
            return response.error('SFMCIntegration instance is required', handler, 'validateIntegration');
        }
        return null;
    }

    /**
     * Lists all journeys
     *
     * @param {object} options - Query options
     * @returns {object} Response with journey list
     */
    function list(options) {
        var validation = validateIntegration();
        if (validation) return validation;

        return sfmc.makeRestRequest('GET', '/interaction/v1/interactions', null, {
            queryParams: options
        });
    }

    /**
     * Gets journey by ID
     *
     * @param {string} journeyId - Journey ID
     * @returns {object} Response with journey details
     */
    function get(journeyId) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!journeyId) {
            return response.validationError('journeyId', 'Journey ID is required', handler, 'get');
        }

        return sfmc.getJourney(journeyId);
    }

    /**
     * Creates new journey
     *
     * @param {object} journeyData - Journey configuration
     * @returns {object} Response with created journey
     */
    function create(journeyData) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!journeyData || !journeyData.name) {
            return response.validationError('name', 'Journey name is required', handler, 'create');
        }

        return sfmc.makeRestRequest('POST', '/interaction/v1/interactions', journeyData);
    }

    /**
     * Updates existing journey
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

        return sfmc.makeRestRequest('PUT', '/interaction/v1/interactions/' + journeyId, journeyData);
    }

    /**
     * Deletes journey
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

        return sfmc.makeRestRequest('DELETE', '/interaction/v1/interactions/' + journeyId);
    }

    /**
     * Publishes journey (starts it)
     *
     * @param {string} journeyId - Journey ID
     * @returns {object} Response
     */
    function publish(journeyId) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!journeyId) {
            return response.validationError('journeyId', 'Journey ID is required', handler, 'publish');
        }

        return sfmc.publishJourney(journeyId);
    }

    /**
     * Stops journey
     *
     * @param {string} journeyId - Journey ID
     * @returns {object} Response
     */
    function stop(journeyId) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!journeyId) {
            return response.validationError('journeyId', 'Journey ID is required', handler, 'stop');
        }

        return sfmc.stopJourney(journeyId);
    }

    /**
     * Gets journey version by ID
     *
     * @param {string} journeyId - Journey ID
     * @param {number} version - Version number
     * @returns {object} Response with journey version
     */
    function getVersion(journeyId, version) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!journeyId) {
            return response.validationError('journeyId', 'Journey ID is required', handler, 'getVersion');
        }

        if (!version) {
            return response.validationError('version', 'Version number is required', handler, 'getVersion');
        }

        return sfmc.makeRestRequest('GET', '/interaction/v1/interactions/' + journeyId + '/versions/' + version);
    }

    /**
     * Gets journey statistics
     *
     * @param {string} journeyId - Journey ID
     * @returns {object} Response with journey stats
     */
    function getStats(journeyId) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!journeyId) {
            return response.validationError('journeyId', 'Journey ID is required', handler, 'getStats');
        }

        return sfmc.makeRestRequest('GET', '/interaction/v1/interactions/' + journeyId + '/stats');
    }

    // Public API
    this.list = list;
    this.get = get;
    this.create = create;
    this.update = update;
    this.remove = remove;
    this.delete = remove;
    this.publish = publish;
    this.stop = stop;
    this.getVersion = getVersion;
    this.getStats = getStats;
}

</script>
