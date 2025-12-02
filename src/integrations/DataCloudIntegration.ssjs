<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * DataCloudIntegration - Salesforce Data Cloud API Integration
 *
 * Provides access to Data Cloud APIs including data ingestion,
 * SQL queries, profile management, segmentation, and identity resolution.
 *
 * @version 2.0.0
 * @author OmegaFramework
 */
function DataCloudIntegration(dataCloudConfig, connectionInstance) {
    var handler = 'DataCloudIntegration';
    var response = new ResponseWrapper();
    var config = dataCloudConfig || {};

    // Initialize base integration
    var connection = connectionInstance || new ConnectionHandler();
    var base = new BaseIntegration(handler, config, null, connection);

    // Setup OAuth2 authentication for Data Cloud
    if (config.auth) {
        var oauth2Config = {
            tokenUrl: config.auth.tokenUrl,
            clientId: config.auth.clientId,
            clientSecret: config.auth.clientSecret,
            grantType: config.auth.grantType || 'client_credentials',
            scope: config.auth.scope || 'cdp_api',
            cacheKey: config.auth.clientId
        };

        var authStrategy = new OAuth2AuthStrategy(oauth2Config, connection);
        base.setAuthStrategy(authStrategy);
    }

    /**
     * Ingests data into Data Cloud
     *
     * @param {string} sourceName - Data source name
     * @param {array} records - Array of records to ingest
     * @returns {object} Response
     */
    function ingestData(sourceName, records) {
        if (!sourceName) {
            return response.validationError('sourceName', 'Data source name is required', handler, 'ingestData');
        }

        if (!records || records.length === 0) {
            return response.validationError('records', 'Records array is required', handler, 'ingestData');
        }

        var payload = {
            data: records
        };

        return base.post('/api/v1/ingest/sources/' + sourceName + '/actions/ingest', payload);
    }

    /**
     * Executes SQL query against Data Cloud
     *
     * @param {string} sqlQuery - SQL query string
     * @param {object} options - Query options
     * @returns {object} Response with query results
     */
    function query(sqlQuery, options) {
        if (!sqlQuery) {
            return response.validationError('sqlQuery', 'SQL query is required', handler, 'query');
        }

        options = options || {};

        var payload = {
            sql: sqlQuery,
            parameters: options.parameters || []
        };

        return base.post('/api/v1/query', payload);
    }

    /**
     * Gets unified individual profile
     *
     * @param {string} individualId - Individual ID
     * @returns {object} Response with profile data
     */
    function getProfile(individualId) {
        if (!individualId) {
            return response.validationError('individualId', 'Individual ID is required', handler, 'getProfile');
        }

        return base.get('/api/v1/profile/' + individualId);
    }

    /**
     * Gets segment definition
     *
     * @param {string} segmentId - Segment ID
     * @returns {object} Response with segment details
     */
    function getSegment(segmentId) {
        if (!segmentId) {
            return response.validationError('segmentId', 'Segment ID is required', handler, 'getSegment');
        }

        return base.get('/api/v1/segments/' + segmentId);
    }

    /**
     * Gets segment members
     *
     * @param {string} segmentId - Segment ID
     * @param {object} options - Pagination options {limit, offset}
     * @returns {object} Response with segment members
     */
    function getSegmentMembers(segmentId, options) {
        if (!segmentId) {
            return response.validationError('segmentId', 'Segment ID is required', handler, 'getSegmentMembers');
        }

        options = options || {};

        return base.get('/api/v1/segments/' + segmentId + '/members', {
            queryParams: {
                limit: options.limit || 100,
                offset: options.offset || 0
            }
        });
    }

    /**
     * Creates activation
     *
     * @param {object} activationData - Activation configuration
     * @returns {object} Response with created activation
     */
    function createActivation(activationData) {
        if (!activationData || !activationData.name) {
            return response.validationError('name', 'Activation name is required', handler, 'createActivation');
        }

        return base.post('/api/v1/activations', activationData);
    }

    /**
     * Gets activation status
     *
     * @param {string} activationId - Activation ID
     * @returns {object} Response with activation status
     */
    function getActivationStatus(activationId) {
        if (!activationId) {
            return response.validationError('activationId', 'Activation ID is required', handler, 'getActivationStatus');
        }

        return base.get('/api/v1/activations/' + activationId + '/status');
    }

    /**
     * Resolves identity across data sources
     *
     * @param {object} identityData - Identity attributes
     * @returns {object} Response with resolved identity
     */
    function resolveIdentity(identityData) {
        if (!identityData) {
            return response.validationError('identityData', 'Identity data is required', handler, 'resolveIdentity');
        }

        return base.post('/api/v1/identity/resolve', identityData);
    }

    /**
     * Gets data stream metadata
     *
     * @param {string} streamName - Data stream name
     * @returns {object} Response with stream metadata
     */
    function getDataStream(streamName) {
        if (!streamName) {
            return response.validationError('streamName', 'Stream name is required', handler, 'getDataStream');
        }

        return base.get('/api/v1/streams/' + streamName);
    }

    /**
     * Lists all calculated insights
     *
     * @param {object} options - Query options
     * @returns {object} Response with insights list
     */
    function listInsights(options) {
        return base.get('/api/v1/insights', { queryParams: options });
    }

    /**
     * Gets specific calculated insight
     *
     * @param {string} insightId - Insight ID
     * @returns {object} Response with insight details
     */
    function getInsight(insightId) {
        if (!insightId) {
            return response.validationError('insightId', 'Insight ID is required', handler, 'getInsight');
        }

        return base.get('/api/v1/insights/' + insightId);
    }

    // Public API
    this.ingestData = ingestData;
    this.query = query;
    this.getProfile = getProfile;
    this.getSegment = getSegment;
    this.getSegmentMembers = getSegmentMembers;
    this.createActivation = createActivation;
    this.getActivationStatus = getActivationStatus;
    this.resolveIdentity = resolveIdentity;
    this.getDataStream = getDataStream;
    this.listInsights = listInsights;
    this.getInsight = getInsight;

    // Base HTTP methods
    this.get = base.get;
    this.post = base.post;
    this.put = base.put;
    this.remove = base.remove;
}

</script>
