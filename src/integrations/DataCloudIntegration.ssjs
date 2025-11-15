<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * DataCloudIntegration - Salesforce Data Cloud API integration
 *
 * Provides methods for interacting with Data Cloud API:
 * - Data ingestion
 * - Query API
 * - Segment management
 * - Identity resolution
 *
 * @version 1.0.0
 * @see https://developer.salesforce.com/docs/atlas.en-us.c360a_api.meta/c360a_api/
 */

function DataCloudIntegration(dataCloudConfig, connectionInstance) {
    // Initialize base integration
    var base = new BaseIntegration('DataCloudIntegration', dataCloudConfig, null, connectionInstance);

    // Extract base properties
    var handler = base.handler;
    var response = base.response;
    var connection = base.connection;
    var config = base.config;

    // Setup OAuth2 authentication for Data Cloud
    if (config.auth && config.auth.tokenUrl) {
        var authStrategy = new OAuth2AuthStrategy({
            tokenUrl: config.auth.tokenUrl,
            clientId: config.auth.clientId,
            clientSecret: config.auth.clientSecret,
            scope: config.auth.scope || 'cdp_api',
            grantType: 'client_credentials'
        }, connection);

        base.setAuthStrategy(authStrategy);
    }

    /**
     * Ingests data into Data Cloud
     * @param {String} dataSourceName - Data source object name
     * @param {Array} records - Array of records to ingest
     * @returns {Object} Response with ingestion result
     */
    function ingestData(dataSourceName, records) {
        try {
            if (!dataSourceName) {
                return response.validationError('dataSourceName', 'Data source name is required', handler, 'ingestData');
            }

            if (!records || !records.length) {
                return response.validationError('records', 'Records array is required', handler, 'ingestData');
            }

            var endpoint = '/api/v1/ingest/sources/' + dataSourceName;
            var payload = {
                data: records
            };

            return base.post(endpoint, payload);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'ingestData');
        }
    }

    /**
     * Queries Data Cloud using SQL
     * @param {String} sqlQuery - SQL query string
     * @returns {Object} Response with query results
     */
    function query(sqlQuery) {
        try {
            if (!sqlQuery) {
                return response.validationError('sqlQuery', 'SQL query is required', handler, 'query');
            }

            var endpoint = '/api/v1/query';
            var payload = {
                sql: sqlQuery
            };

            return base.post(endpoint, payload);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'query');
        }
    }

    /**
     * Gets profile by unified individual ID
     * @param {String} individualId - Unified individual ID
     * @returns {Object} Response with profile data
     */
    function getProfile(individualId) {
        try {
            if (!individualId) {
                return response.validationError('individualId', 'Individual ID is required', handler, 'getProfile');
            }

            var endpoint = '/api/v1/profile/' + individualId;
            return base.get(endpoint);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getProfile');
        }
    }

    /**
     * Gets segment by ID
     * @param {String} segmentId - Segment ID
     * @returns {Object} Response with segment data
     */
    function getSegment(segmentId) {
        try {
            if (!segmentId) {
                return response.validationError('segmentId', 'Segment ID is required', handler, 'getSegment');
            }

            var endpoint = '/api/v1/segments/' + segmentId;
            return base.get(endpoint);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getSegment');
        }
    }

    /**
     * Gets segment members
     * @param {String} segmentId - Segment ID
     * @param {Object} options - Query options (limit, offset, etc.)
     * @returns {Object} Response with segment members
     */
    function getSegmentMembers(segmentId, options) {
        try {
            if (!segmentId) {
                return response.validationError('segmentId', 'Segment ID is required', handler, 'getSegmentMembers');
            }

            var endpoint = '/api/v1/segments/' + segmentId + '/members';

            var queryParams = '';
            if (options) {
                var params = [];
                if (options.limit) {
                    params.push('limit=' + options.limit);
                }
                if (options.offset) {
                    params.push('offset=' + options.offset);
                }
                if (params.length > 0) {
                    queryParams = '?' + params.join('&');
                }
            }

            return base.get(endpoint + queryParams);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getSegmentMembers');
        }
    }

    /**
     * Creates activation
     * @param {Object} activationData - Activation configuration
     * @returns {Object} Response with activation result
     */
    function createActivation(activationData) {
        try {
            if (!activationData) {
                return response.validationError('activationData', 'Activation data is required', handler, 'createActivation');
            }

            var endpoint = '/api/v1/activations';
            return base.post(endpoint, activationData);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'createActivation');
        }
    }

    /**
     * Gets activation status
     * @param {String} activationId - Activation ID
     * @returns {Object} Response with activation status
     */
    function getActivationStatus(activationId) {
        try {
            if (!activationId) {
                return response.validationError('activationId', 'Activation ID is required', handler, 'getActivationStatus');
            }

            var endpoint = '/api/v1/activations/' + activationId;
            return base.get(endpoint);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getActivationStatus');
        }
    }

    /**
     * Resolves identity across data sources
     * @param {Object} identityData - Identity resolution criteria
     * @returns {Object} Response with resolved identity
     */
    function resolveIdentity(identityData) {
        try {
            if (!identityData) {
                return response.validationError('identityData', 'Identity data is required', handler, 'resolveIdentity');
            }

            var endpoint = '/api/v1/identity/resolve';
            return base.post(endpoint, identityData);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'resolveIdentity');
        }
    }

    /**
     * Gets data stream by name
     * @param {String} streamName - Data stream name
     * @returns {Object} Response with stream metadata
     */
    function getDataStream(streamName) {
        try {
            if (!streamName) {
                return response.validationError('streamName', 'Stream name is required', handler, 'getDataStream');
            }

            var endpoint = '/api/v1/metadata/datastreams/' + streamName;
            return base.get(endpoint);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getDataStream');
        }
    }

    // Public API - Data Cloud specific methods
    this.ingestData = ingestData;
    this.query = query;
    this.getProfile = getProfile;
    this.getSegment = getSegment;
    this.getSegmentMembers = getSegmentMembers;
    this.createActivation = createActivation;
    this.getActivationStatus = getActivationStatus;
    this.resolveIdentity = resolveIdentity;
    this.getDataStream = getDataStream;

    // Expose base methods
    this.get = base.get;
    this.post = base.post;
    this.put = base.put;
    this.remove = base.remove;
}

</script>
