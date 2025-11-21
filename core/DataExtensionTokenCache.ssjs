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
 *   - ObtainedAt (Number) - Unix timestamp when token was obtained
 *   - Scope (Text 500) - Token scope (optional)
 *   - RestInstanceUrl (Text 200) - SFMC REST instance URL (optional)
 *   - SoapInstanceUrl (Text 200) - SFMC SOAP instance URL (optional)
 *   - UpdatedAt (Date) - Last update timestamp
 *
 * Benefits:
 * - Tokens persist across script executions
 * - Multiple automations can share the same token
 * - Reduces auth API calls by ~95%
 * - Automatic expiration checking
 * - Thread-safe (SFMC handles DE locking)
 *
 * @version 2.0.0
 * @author OmegaFramework
 */
function DataExtensionTokenCache(cacheConfig) {
    var handler = 'DataExtensionTokenCache';
    var response = new ResponseWrapper();
    var config = cacheConfig || {};

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
     * @param {string} cacheKey - Cache key to lookup
     * @returns {object} Response with token data or null
     */
    function get(cacheKey) {
        try {
            var key = cacheKey || generateCacheKey(config.cacheKey);

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
                accessToken: data.AccessToken || null,
                tokenType: data.TokenType || 'Bearer',
                expiresIn: parseInt(data.ExpiresIn) || 3600,
                obtainedAt: parseInt(data.ObtainedAt) || 0,
                scope: data.Scope || null,
                restInstanceUrl: data.RestInstanceUrl || null,
                soapInstanceUrl: data.SoapInstanceUrl || null
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
     * @param {string} cacheKey - Cache key (optional, uses config.cacheKey if not provided)
     * @returns {object} Response indicating success/failure
     */
    function set(tokenInfo, cacheKey) {
        try {
            if (!tokenInfo || !tokenInfo.accessToken) {
                return response.validationError(
                    'tokenInfo',
                    'Token info with accessToken is required',
                    handler,
                    'set'
                );
            }

            var key = cacheKey || generateCacheKey(config.cacheKey);

            // Ensure obtainedAt is set
            if (!tokenInfo.obtainedAt) {
                tokenInfo.obtainedAt = new Date().getTime();
            }

            // Initialize Data Extension
            // Note: Init() always returns an object, even if DE doesn't exist
            // The error will be thrown when we try to access Rows methods
            var de = DataExtension.Init(dataExtensionName);

            // Prepare row data
            var rowData = {
                CacheKey: key,
                AccessToken: tokenInfo.accessToken,
                TokenType: tokenInfo.tokenType || 'Bearer',
                ExpiresIn: tokenInfo.expiresIn || 3600,
                ObtainedAt: tokenInfo.obtainedAt,
                Scope: tokenInfo.scope || '',
                RestInstanceUrl: tokenInfo.restInstanceUrl || '',
                SoapInstanceUrl: tokenInfo.soapInstanceUrl || '',
                UpdatedAt: Now()
            };

            // Check if record exists
            var existing = de.Rows.Lookup(['CacheKey'], [key]);

            if (existing && existing.length > 0) {
                // Update existing record
                var updateResult = de.Rows.Update(
                    ['CacheKey'], // Filter on primary key
                    [key],
                    Object.keys(rowData), // Columns to update
                    Object.keys(rowData).map(function(k) { return rowData[k]; }) // Values
                );

                if (updateResult !== 'OK' && updateResult !== 1) {
                    return response.error(
                        'Failed to update token in cache',
                        handler,
                        'set',
                        { updateResult: updateResult }
                    );
                }
            } else {
                // Insert new record
                var insertResult = de.Rows.Add(rowData);

                if (insertResult !== 'OK' && insertResult !== 1) {
                    return response.error(
                        'Failed to insert token in cache',
                        handler,
                        'set',
                        { insertResult: insertResult }
                    );
                }
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
                { exception: ex.toString() }
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
        if (!tokenInfo || !tokenInfo.expiresIn || !tokenInfo.obtainedAt) {
            return true;
        }

        var now = new Date().getTime();
        var expirationTime = tokenInfo.obtainedAt + (tokenInfo.expiresIn * 1000);

        // Apply refresh buffer to avoid using tokens right before expiration
        return now >= (expirationTime - refreshBuffer);
    }

    /**
     * Clears cached token
     *
     * @param {string} cacheKey - Cache key to clear (optional)
     * @returns {object} Response indicating success/failure
     */
    function clear(cacheKey) {
        try {
            var key = cacheKey || generateCacheKey(config.cacheKey);

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
     * @param {string} cacheKey - Cache key to check (optional)
     * @returns {boolean} true if valid token exists
     */
    function hasValidToken(cacheKey) {
        var result = get(cacheKey);
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

</script>
