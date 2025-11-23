<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * CredentialStore - Secure credential management with SFMC encryption
 *
 * Reads and decrypts API credentials from OMG_FW_Credentials Data Extension.
 * Credentials are encrypted using SFMC Platform Variables (Sym_Cred, Salt_Cred, IV_Cred).
 *
 * Supported Auth Types: OAuth2, Basic, Bearer, ApiKey
 * Supported Platforms: SFMC, DataCloud, Veeva CRM, Veeva Vault, MDG
 *
 * Usage:
 * var credStore = new CredentialStore('MyIntegrationName');
 * var creds = credStore.getCredentials();
 * if (creds.success) {
 *     // Use creds.data.clientId, creds.data.clientSecret, etc.
 * }
 *
 * @version 2.0.0
 * @author OmegaFramework
 */
function CredentialStore(integrationName) {
    var handler = 'CredentialStore';
    var response = new ResponseWrapper();

    // Data Extension name
    var dataExtensionName = 'OMG_FW_Credentials';

    // Platform Variables for encryption (stored in SFMC)
    var symKeyVar = 'Sym_Cred';
    var saltVar = 'Salt_Cred';
    var ivVar = 'IV_Cred';

    /**
     * Retrieves and decrypts credentials for the specified integration
     *
     * @returns {object} Response with decrypted credential data
     */
    function getCredentials() {
        try {
            if (!integrationName) {
                return response.validationError(
                    'integrationName',
                    'Integration name is required',
                    handler,
                    'getCredentials'
                );
            }

            // Initialize Data Extension
            var de = DataExtension.Init(dataExtensionName);

            // Lookup credentials by Name (primary key)
            var data = de.Rows.Lookup(['Name'], [integrationName]);

            // No credentials found
            if (!data || data.length === 0) {
                return response.error(
                    'Credentials not found for integration: ' + integrationName,
                    handler,
                    'getCredentials',
                    { integrationName: integrationName }
                );
            }

            var row = data[0];

            // Check if credentials are active
            if (row.IsActive === false || row.IsActive === 'false') {
                return response.error(
                    'Credentials are inactive for integration: ' + integrationName,
                    handler,
                    'getCredentials',
                    { integrationName: integrationName, isActive: false }
                );
            }

            // Build credential object based on AuthType
            var credentials = {
                name: row.Name,
                description: row.Description || null,
                authType: row.AuthType,
                platform: row.Platform,
                isActive: row.IsActive
            };

            // Decrypt and add fields based on AuthType
            if (row.AuthType === 'OAuth2') {
                credentials.clientId = decryptField(row.ClientId);
                credentials.clientSecret = decryptField(row.ClientSecret);
                credentials.authUrl = row.AuthUrl || null;
                credentials.tokenEndpoint = row.TokenEndpoint || null;
                credentials.grantType = row.GrantType || 'client_credentials';
                credentials.scope = row.Scope || null;
            } else if (row.AuthType === 'Basic') {
                credentials.username = decryptField(row.Username);
                credentials.password = decryptField(row.Password);
            } else if (row.AuthType === 'Bearer') {
                credentials.staticToken = decryptField(row.StaticToken);
            } else if (row.AuthType === 'ApiKey') {
                credentials.apiKey = decryptField(row.ApiKey);
                credentials.apiSecret = decryptField(row.ApiSecret);
            }

            // Add common fields
            credentials.baseUrl = row.BaseUrl || null;
            credentials.domain = row.Domain || null;
            credentials.customField1 = row.CustomField1 || null;
            credentials.customField2 = row.CustomField2 || null;
            credentials.customField3 = row.CustomField3 || null;

            // Add audit fields
            credentials.createdAt = row.CreatedAt || null;
            credentials.updatedAt = row.UpdatedAt || null;
            credentials.createdBy = row.CreatedBy || null;

            return response.success(credentials, handler, 'getCredentials');

        } catch (ex) {
            return response.error(
                'Failed to retrieve credentials: ' + (ex.message || ex.toString()),
                handler,
                'getCredentials',
                {
                    exception: ex.toString(),
                    integrationName: integrationName
                }
            );
        }
    }

    /**
     * Decrypts a field using SFMC Platform Variables
     *
     * @param {string} encryptedValue - The encrypted value
     * @returns {string} Decrypted value or null if empty
     */
    function decryptField(encryptedValue) {
        try {
            // Return null if field is empty
            if (!encryptedValue || encryptedValue === '') {
                return null;
            }

            // Decrypt using SFMC Platform Variables
            var decrypted = Platform.Function.DecryptSymmetric(
                'AES',
                'CBC',
                encryptedValue,
                symKeyVar,
                null,
                saltVar,
                null,
                ivVar,
                null
            );

            return decrypted;

        } catch (ex) {
            // If decryption fails, return null
            // This could happen if:
            // - Platform Variables are not set
            // - Value was not encrypted
            // - Encryption keys changed
            return null;
        }
    }

    /**
     * Checks if credentials exist for the integration
     *
     * @returns {boolean} true if credentials exist
     */
    function hasCredentials() {
        var result = getCredentials();
        return result.success;
    }

    /**
     * Gets raw (encrypted) credentials without decryption
     * Useful for debugging or migration purposes
     *
     * @returns {object} Response with raw encrypted data
     */
    function getRawCredentials() {
        try {
            if (!integrationName) {
                return response.validationError(
                    'integrationName',
                    'Integration name is required',
                    handler,
                    'getRawCredentials'
                );
            }

            var de = DataExtension.Init(dataExtensionName);
            var data = de.Rows.Lookup(['Name'], [integrationName]);

            if (!data || data.length === 0) {
                return response.error(
                    'Credentials not found for integration: ' + integrationName,
                    handler,
                    'getRawCredentials',
                    { integrationName: integrationName }
                );
            }

            return response.success(data[0], handler, 'getRawCredentials');

        } catch (ex) {
            return response.error(
                'Failed to retrieve raw credentials: ' + (ex.message || ex.toString()),
                handler,
                'getRawCredentials',
                { exception: ex.toString() }
            );
        }
    }

    /**
     * Lists all available integrations (names only)
     *
     * @returns {object} Response with array of integration names
     */
    function listIntegrations() {
        try {
            var de = DataExtension.Init(dataExtensionName);
            var data = de.Rows.Retrieve(['Name', 'Platform', 'AuthType', 'IsActive']);

            if (!data || data.length === 0) {
                return response.success([], handler, 'listIntegrations');
            }

            var integrations = [];
            for (var i = 0; i < data.length; i++) {
                integrations.push({
                    name: data[i].Name,
                    platform: data[i].Platform,
                    authType: data[i].AuthType,
                    isActive: data[i].IsActive
                });
            }

            return response.success(integrations, handler, 'listIntegrations');

        } catch (ex) {
            return response.error(
                'Failed to list integrations: ' + (ex.message || ex.toString()),
                handler,
                'listIntegrations',
                { exception: ex.toString() }
            );
        }
    }

    // Public API
    this.getCredentials = getCredentials;
    this.hasCredentials = hasCredentials;
    this.getRawCredentials = getRawCredentials;
    this.listIntegrations = listIntegrations;
}

</script>