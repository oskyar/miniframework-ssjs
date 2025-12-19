<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * -----------------------------------------------------------------------------
 * NOTE: Ensure 'ResponseWrapper' is loaded before this script runs.
 * If it is in a separate Content Block, load it using:
 * Platform.Function.ContentBlockByName("Your-ResponseWrapper-Key");
 * -----------------------------------------------------------------------------
 */

/**
 * CredentialStore - Secure credential management with SFMC encryption
 *
 * Reads and decrypts API credentials from OMG_FW_Credentials Data Extension.
 * Credentials are encrypted using SFMC Platform Variables (Sym_Cred, Salt_Cred, IV_Cred)
 * or keys stored in Key Management.
 *
 * Optimization: Uses a centralized AMPScript bridge for Automation Studio compatibility.
 *
 * @version 1.0.0
 * @author OmegaFramework Team
 */
function CredentialStore(responseWrapper, integrationName, password, salt, initvector) {
    var handler = 'CredentialStore';
    var response = responseWrapper;

    // Configuration
    var dataExtensionName = 'OMG_FW_Credentials';

    // Encryption Keys/Variables (defaults to standard names if not provided)
    var symKeyVar = password || 'Sym_Cred';
    var saltVar = salt || 'Salt_Cred';
    var ivVar = initvector || 'IV_Cred';

    /**
     * Internal Helper: Executes AMPScript via SSJS to handle Encryption/Decryption.
     * This is required because SSJS in Automation Studio cannot handle AES natively 
     * without external libraries, but TreatAsContent works.
     */
    function executeCrypto(action, value) {
        if (!value) return null;

        try {
            // Set SSJS variables to AMPScript variables
            // using distinct names to avoid global scope collisions
            Variable.SetValue("@_sys_action", action);
            Variable.SetValue("@_sys_val", value);
            Variable.SetValue("@_sys_pass", symKeyVar);
            Variable.SetValue("@_sys_salt", saltVar);
            Variable.SetValue("@_sys_iv", ivVar);

            var script = "";
            script += "%%[";
            script += "SET @Algo = 'AES'";
            
            // Determine operation based on action parameter

            if(action == 'encrypt'){
                script += "  SET @Output = EncryptSymmetric(@_sys_val, @Algo, @_sys_pass, @null, @_sys_salt, @null, @_sys_iv, @null)";
            }else{
                script += "  SET @Output = DecryptSymmetric(@_sys_val, @Algo, @_sys_pass, @null, @_sys_salt, @null, @_sys_iv, @null)";
            }
            
            script += "Output(Concat(@Output))";
            script += "]%%";

            return Platform.Function.TreatAsContent(script);

        } catch (e) {
            // If crypto fails (e.g., bad keys), return null to avoid crashing the automation
            // You might want to log this error to a DE in a real scenario
            return null;
        }
    }

    /**
     * Decrypts a value using the configured keys
     */
    this.decrypt = function(encryptedValue) {
        return executeCrypto('decrypt', encryptedValue);
    };

    /**
     * Encrypts a value using the configured keys
     */
    this.encrypt = function(value) {
        return executeCrypto('encrypt', value);
    };

    /**
     * Retrieves and decrypts credentials for the specified integration
     * @returns {object} Response with decrypted credential data
     */
    this.getCredentials = function() {
        try {
            if (!integrationName) {
                return response.validationError('integrationName', 'Integration name is required', handler, 'getCredentials');
            }

            // Initialize Data Extension
            var de = DataExtension.Init(dataExtensionName);

            // Lookup credentials by Name (primary key)
            var data = de.Rows.Lookup(['Name'], [integrationName]);
            
            // No credentials found
            if (!data || data.length === 0) {
                return response.error(
                    'Credentials not found for integration: ' + integrationName,
                    handler, 'getCredentials', { integrationName: integrationName }
                );
            }

            var row = data[0];

            // Check if credentials are active (handles boolean or string 'false')
            if (row.IsActive === false || String(row.IsActive).toLowerCase() === 'false') {
                return response.error(
                    'Credentials are inactive for integration: ' + integrationName,
                    handler, 'getCredentials', { integrationName: integrationName }
                );
            }

            // Build credential object
            var credentials = {
                name: row.Name,
                description: row.Description || null,
                authType: row.AuthType,
                platform: row.Platform,
                isActive: row.IsActive,
                // Common fields
                baseUrl: row.BaseUrl || null,
                domain: row.Domain || null,
                // SFMC-specific field (with backward compatibility from CustomField1)
                mid: row.MID || row.CustomField1 || null,
                // Custom fields for extensibility
                customField1: row.CustomField1 || null,
                customField2: row.CustomField2 || null,
                customField3: row.CustomField3 || null,
                // Audit fields
                createdAt: row.CreatedAt || null,
                updatedAt: row.UpdatedAt || null,
                createdBy: row.CreatedBy || null
            };

            // Decrypt and add fields based on AuthType
            // NOTE: Using 'this.decrypt' (the internal method), not 'decryptField'
            if (row.AuthType === 'OAuth2') {
                credentials.clientId = this.decrypt(row.ClientId);
                credentials.clientSecret = this.decrypt(row.ClientSecret);
                credentials.authUrl = row.AuthUrl || null;
                credentials.tokenEndpoint = row.TokenEndpoint || null;
                credentials.grantType = row.GrantType || 'client_credentials';
                credentials.scope = row.Scope || null;
            } else if (row.AuthType === 'Basic') {
                credentials.username = this.decrypt(row.Username);
                credentials.password = this.decrypt(row.Password);
            } else if (row.AuthType === 'Bearer') {
                credentials.staticToken = this.decrypt(row.StaticToken);
            } else if (row.AuthType === 'ApiKey') {
                credentials.apiKey = this.decrypt(row.ApiKey);
                credentials.apiSecret = this.decrypt(row.ApiSecret);
            }

            return response.success(credentials, handler, 'getCredentials');

        } catch (ex) {
            return response.error(
                'Failed to retrieve credentials: ' + (ex.message || ex.toString()),
                handler, 'getCredentials',
                { exception: ex.toString(), integrationName: integrationName }
            );
        }
    };

    /**
     * Checks if credentials exist for the integration
     */
    this.hasCredentials = function() {
        var result = this.getCredentials();
        return result.status === 'OK' || result.success === true; // Handle different ResponseWrapper structures
    };

    /**
     * Gets raw (encrypted) credentials without decryption
     * Useful for debugging or migration purposes
     */
    this.getRawCredentials = function() {
        try {
            if (!integrationName) return response.validationError('integrationName', 'Required', handler, 'getRaw');
            
            var de = DataExtension.Init(dataExtensionName);
            var data = de.Rows.Lookup(['Name'], [integrationName]);

            if (!data || data.length === 0) return response.error('Not found', handler, 'getRaw');

            return response.success(data[0], handler, 'getRawCredentials');
        } catch (ex) {
            return response.error('Error: ' + ex.message, handler, 'getRawCredentials');
        }
    };

    /**
     * Lists all available integrations (names only)
     */
    this.listIntegrations = function() {
        try {
            var de = DataExtension.Init(dataExtensionName);
            var data = de.Rows.Retrieve();

            // Handle null or undefined data
            if (!data) {
                data = [];
            }

            var integrations = [];
            for (var i = 0; i < data.length; i++) {
                integrations.push({
                    name: data[i].Name,
                    platform: data[i].Platform || '',
                    authType: data[i].AuthType,
                    isActive: data[i].IsActive
                });
            }
            return response.success(integrations, handler, 'listIntegrations');
        } catch (ex) {
            // Get error message - try multiple properties
            var errorMsg = ex.message || ex.description || String(ex) || ex.toString() || 'Unknown error in listIntegrations';

            return response.error(
                'Failed to list integrations: ' + errorMsg,
                handler,
                'listIntegrations',
                {
                    exception: String(ex),
                    exceptionType: typeof ex,
                    exceptionStringified: Stringify(ex)
                }
            );
        }
    };
}

// ============================================================================
// OMEGAFRAMEWORK MODULE REGISTRATION
// ============================================================================
if (typeof OmegaFramework !== 'undefined' && typeof OmegaFramework.register === 'function') {
    OmegaFramework.register('CredentialStore', {
        dependencies: ['ResponseWrapper'],
        blockKey: 'OMG_FW_CredentialStore',
        factory: function(responseWrapperInstance, config) {
            // config contains: { integrationName, password, salt, initvector }
            var integrationName = config.integrationName || null;
            var password = config.password || 'Sym_Cred';
            var salt = config.salt || 'Salt_Cred';
            var initvector = config.initvector || 'IV_Cred';

            return new CredentialStore(responseWrapperInstance, integrationName, password, salt, initvector);
        }
    });
}

</script>