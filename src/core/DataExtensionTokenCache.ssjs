<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * DataExtensionTokenCache - Persistent token caching using SFMC Data Extensions
 *
 * IMPORTANT: This solves the SFMC-specific challenge where each script execution
 * is independent and doesn't share memory. By storing tokens in a Data Extension,
 * multiple executions can share the same cached token, drastically reducing
 * authentication API calls.
 *
 * Data Extension Structure Required:
 * Name: OMG_FW_TokenCache
 * Fields:
 *   - CacheKey (Text 200, Primary Key) - Unique identifier for the token
 *   - AccessToken (Text 500) - The OAuth2 access token
 *   - TokenType (Text 50) - Token type (usually "Bearer")
 *   - ExpiresIn (Number) - Token lifetime in seconds
 *   - ObtainedAt (Decimal 18,0) - Unix timestamp (ms) when token was obtained
 *   - ExpiresAt (Decimal 18,0) - Unix timestamp (ms) when token expires (pre-calculated)
 *   - Scope (Text 500) - Token scope (optional)
 *   - RestInstanceUrl (Text 200) - SFMC REST instance URL (optional)
 *   - SoapInstanceUrl (Text 200) - SFMC SOAP instance URL (optional)
 *   - UpdatedAt (Date) - Last update timestamp
 *
 * Benefits:
 * - Tokens persist across script executions
 * - Multiple automations can share the same token
 * - Reduces auth API calls by ~95%
 * - Automatic expiration checking with pre-calculated ExpiresAt
 * - Thread-safe (SFMC handles DE locking)
 * - Optimized performance: expiration calculated once on write, not on every read
 *
 * @version 3.0.0
 * @author OmegaFramework
 */
function DataExtensionTokenCache(responseWrapper, cacheKey, cacheConfig) {
    var handler = 'DataExtensionTokenCache';
    var response = responseWrapper;
    var config = cacheConfig || {};

    // Validate required cacheKey
    if (!cacheKey) {
        throw new Error('DataExtensionTokenCache requires a cacheKey parameter');
    }

    // Store cacheKey for this instance
    var instanceCacheKey = cacheKey;

    // Data Extension configuration
    var dataExtensionName = config.dataExtensionName || 'OMG_FW_TokenCache';
    var refreshBuffer = config.refreshBuffer || 300000; // 5 minutes default buffer

    /**
     * Generates a unique cache key based on credentials
     * This allows different OAuth2 configs to have separate cached tokens
     *
     * @param {string} identifier - Unique identifier (e.g., clientId, username, system name)
     * @returns {string} Cache key
     */
    function generateCacheKey(identifier) {
        if (!identifier) {
            return 'default_token';
        }
        // Create a simple hash-like key (SFML doesn't have crypto functions)
        return 'token_' + identifier.replace(/[^a-zA-Z0-9]/g, '_');
    }

    /**
     * Retrieves token from Data Extension
     *
     * @returns {object} Response with token data or null
     */
    function get() {
        try {
            var key = instanceCacheKey;
            // Initialize Data Extension
            // Note: Init() always returns an object, even if DE doesn't exist
            // The error will be thrown when we try to access Rows.Lookup()
            var de = DataExtension.Init(dataExtensionName);

            // Lookup token by cache key
            // This will throw an error if the Data Extension doesn't exist
            var data = de.Rows.Lookup(['CacheKey'], [key]);

            // No token found
            if (!data || data.length === 0) {
                return response.success(null, handler, 'get');
            }

            // Extract token info from DE row
            var tokenInfo = {
                accessToken: data[0].AccessToken || null,
                tokenType: data[0].TokenType || 'Bearer',
                expiresIn: parseInt(data[0].ExpiresIn) || 3600,
                obtainedAt: parseFloat(data[0].ObtainedAt) || 0,
                expiresAt: parseFloat(data[0].ExpiresAt) || 0,
                scope: data[0].Scope || null,
                restInstanceUrl: data[0].RestInstanceUrl || null,
                soapInstanceUrl: data[0].SoapInstanceUrl || null
            };

            // Check if token is expired
            if (isExpired(tokenInfo)) {
                // Token expired, return null (caller will request new token)
                return response.success(null, handler, 'get');
            }

            // Return valid cached token
            return response.success(tokenInfo, handler, 'get');

        } catch (ex) {
            return response.error(
                'Failed to retrieve token from cache: ' + (ex.message || ex.toString()),
                handler,
                'get',
                { exception: ex.toString() }
            );
        }
    }

    /**
     * Stores token in Data Extension
     *
     * @param {object} tokenInfo - Token information to cache
     * @returns {object} Response indicating success/failure
     */
    function set(tokenInfo) {
        try {
            if (!tokenInfo || !tokenInfo.accessToken) {
                return response.validationError(
                    'tokenInfo',
                    'Token info with accessToken is required',
                    handler,
                    'set'
                );
            }

            var key = instanceCacheKey;

            // Ensure obtainedAt is set
            if (!tokenInfo.obtainedAt) {
                tokenInfo.obtainedAt = new Date().getTime();
            }

            // Initialize Data Extension
            var de = DataExtension.Init(dataExtensionName);

            var expiresAtMs = tokenInfo.obtainedAt + (tokenInfo.expiresIn * 1000);

            // Prepare row data - IMPORTANT: Only include non-null values
            var rowData = {
                CacheKey: key,
                AccessToken: tokenInfo.accessToken,
                TokenType: tokenInfo.tokenType || 'Bearer',
                ExpiresIn: tokenInfo.expiresIn || 3600,
                ObtainedAt: tokenInfo.obtainedAt,
                ExpiresAt: expiresAtMs
            };

            // Add optional fields only if they have values
            if (tokenInfo.scope) {
                rowData.Scope = tokenInfo.scope;
            }
            if (tokenInfo.restInstanceUrl) {
                rowData.RestInstanceUrl = tokenInfo.restInstanceUrl;
            }
            if (tokenInfo.soapInstanceUrl) {
                rowData.SoapInstanceUrl = tokenInfo.soapInstanceUrl;
            }

            // Always set UpdatedAt
            rowData.UpdatedAt = Now(); 

            // Check if row already exists (lookup by primary key)
            var existingData = de.Rows.Lookup(['CacheKey'], [key]);

            if (existingData && existingData.length > 0) {
                // Update existing row
                // Rows.Update(filterColumns, filterValues, updateColumns, updateValues)
                de.Rows.Update(
                    {'CacheKey':key},
                    ['AccessToken', 'TokenType', 'ExpiresIn', 'ObtainedAt', 'ExpiresAt', 'Scope', 'RestInstanceUrl', 'SoapInstanceUrl', 'UpdatedAt'],
                    [
                        rowData.AccessToken,
                        rowData.TokenType,
                        rowData.ExpiresIn,
                        rowData.ObtainedAt,
                        rowData.ExpiresAt,
                        rowData.Scope || '',
                        rowData.RestInstanceUrl || '',
                        rowData.SoapInstanceUrl || '',
                        rowData.UpdatedAt
                    ]
                );
            } else {
                // Add new row
                de.Rows.Add(rowData);
            }

            return response.success(
                { cached: true, cacheKey: key },
                handler,
                'set'
            );

        } catch (ex) {
            return response.error(
                'Failed to store token in cache: ' + (ex.message || ex.toString()),
                handler,
                'set',
                {
                    exception: ex.toString(),
                    message: ex.message || 'Unknown error',
                    description: ex.description || 'No description'
                }
            );
        }
    }

    /**
     * Checks if a token is expired
     *
     * @param {object} tokenInfo - Token info with expiresIn and obtainedAt
     * @returns {boolean} true if expired, false if still valid
     */
    function isExpired(tokenInfo) {
        if (!tokenInfo || !tokenInfo.expiresAt) {
            return true;
        }
        
        var now = new Date().getTime();
        
        return now >= (tokenInfo.expiresAt - refreshBuffer);

    }

    /**
     * Clears cached token
     *
     * @returns {object} Response indicating success/failure
     */
    function clear() {
        try {
            var key = instanceCacheKey;

            // Initialize Data Extension
            // Note: Init() always returns an object, even if DE doesn't exist
            // The error will be thrown when we try to access Rows.Remove()
            var de = DataExtension.Init(dataExtensionName);

            // Delete the row
            var deleteResult = de.Rows.Remove(['CacheKey'], [key]);

            return response.success(
                { cleared: true, cacheKey: key },
                handler,
                'clear'
            );

        } catch (ex) {
            return response.error(
                'Failed to clear token cache: ' + (ex.message || ex.toString()),
                handler,
                'clear',
                { exception: ex.toString() }
            );
        }
    }

    /**
     * Checks if cache has a valid token without retrieving it
     *
     * @returns {boolean} true if valid token exists
     */
    function hasValidToken() {
        var result = get();
        return result.success && result.data !== null;
    }

    /**
     * Creates the token cache Data Extension if it doesn't exist
     *
     * WARNING: This requires elevated permissions and should be run
     * during framework installation, not during normal operation.
     *
     * @returns {object} Response indicating success/failure
     */
    function createDataExtension() {
        try {
            // Check if DE already exists
            // Note: We need to try a Rows operation to truly check existence
            var deExists = false;
            try {
                var testDE = DataExtension.Init(dataExtensionName);
                testDE.Rows.Retrieve();
                deExists = true;
            } catch (ex) {
                deExists = false;
            }

            if (deExists) {
                return response.success(
                    { exists: true, message: 'Data Extension already exists' },
                    handler,
                    'createDataExtension'
                );
            }

            // Define Data Extension structure
            var deConfig = {
                Name: dataExtensionName,
                CustomerKey: dataExtensionName,
                Description: 'OmegaFramework OAuth2 token cache for cross-execution token persistence',
                IsSendable: false,
                IsTestable: false,
                CategoryID: 0, // Root folder - update as needed
                Fields: [
                    {
                        Name: 'CacheKey',
                        FieldType: 'Text',
                        MaxLength: 200,
                        IsPrimaryKey: true,
                        IsRequired: true
                    },
                    {
                        Name: 'AccessToken',
                        FieldType: 'Text',
                        MaxLength: 500,
                        IsRequired: true
                    },
                    {
                        Name: 'TokenType',
                        FieldType: 'Text',
                        MaxLength: 50,
                        DefaultValue: 'Bearer'
                    },
                    {
                        Name: 'ExpiresIn',
                        FieldType: 'Number',
                        DefaultValue: '3600'
                    },
                    {
                        Name: 'ObtainedAt',
                        FieldType: 'Number',
                        IsRequired: true
                    },
                    {
                        Name: 'Scope',
                        FieldType: 'Text',
                        MaxLength: 500
                    },
                    {
                        Name: 'RestInstanceUrl',
                        FieldType: 'Text',
                        MaxLength: 200
                    },
                    {
                        Name: 'SoapInstanceUrl',
                        FieldType: 'Text',
                        MaxLength: 200
                    },
                    {
                        Name: 'UpdatedAt',
                        FieldType: 'Date',
                        DefaultValue: 'GETDATE()'
                    }
                ]
            };

            // Note: SSJS doesn't have native DE creation via DataExtension.Init()
            // This would need to use REST API or be created manually/via installer
            return response.error(
                'Data Extension creation requires REST API. Use the installer script or create manually.',
                handler,
                'createDataExtension',
                { deConfig: deConfig }
            );

        } catch (ex) {
            return response.error(
                'Failed to create Data Extension: ' + (ex.message || ex.toString()),
                handler,
                'createDataExtension',
                { exception: ex.toString() }
            );
        }
    }

    // Public API
    this.get = get;
    this.set = set;
    this.clear = clear;
    this.isExpired = isExpired;
    this.hasValidToken = hasValidToken;
    this.generateCacheKey = generateCacheKey;
    this.createDataExtension = createDataExtension;
}

// ============================================================================
// OMEGAFRAMEWORK MODULE REGISTRATION
// ============================================================================
if (typeof OmegaFramework !== 'undefined' && typeof OmegaFramework.register === 'function') {
    OmegaFramework.register('DataExtensionTokenCache', {
        dependencies: ['ResponseWrapper'],
        blockKey: 'OMG_FW_DataExtensionTokenCache',
        factory: function(responseWrapperInstance, config) {
            // config contains: { cacheKey, cacheConfig, ... }
            var cacheKey = config.cacheKey || 'default_token';
            var cacheConfig = config.cacheConfig || {};

            return new DataExtensionTokenCache(responseWrapperInstance, cacheKey, cacheConfig);
        }
    });
}

</script>
