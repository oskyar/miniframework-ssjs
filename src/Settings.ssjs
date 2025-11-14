<script runat="server">

/**
 * OmegaFramework Settings
 * Centralized framework configuration
 *
 * @version 1.0.0
 */

function OmegaFrameworkSettings() {

    /**
     * Default framework configuration
     */
    var defaultConfig = {
        // Framework information
        framework: {
            name: "OmegaFramework",
            version: "1.0.0",
            prefix: "OMG_FW_"
        },

        // Authentication configuration (user-overridable)
        auth: {
            clientId: null,
            clientSecret: null,
            authBaseUrl: null,
            tokenCacheDuration: 3600000, // 1 hour in ms
            tokenRefreshBuffer: 300000   // 5 minutes before expiration
        },

        // HTTP connection configuration
        connection: {
            maxRetries: 3,
            retryDelay: 1000,
            timeout: 5000,
            retryOnCodes: [429, 500, 502, 503, 504],
            continueOnError: true
        },

        // Logging configuration
        logging: {
            level: "INFO",              // DEBUG, INFO, WARN, ERROR
            enableConsole: true,
            enableDataExtension: false,
            enableEmailAlerts: false,
            dataExtensionKey: "omegaframework_logs",
            emailAlertAddress: null
        },

        // Data Extensions configuration
        dataExtension: {
            preferSSJS: true,           // Try SSJS functions first
            fallbackToREST: true,       // If SSJS fails, use REST API
            defaultPageSize: 50
        },

        // Specific handlers configuration
        handlers: {
            email: {
                defaultAssetType: "htmlemail",
                defaultAssetTypeId: 208
            },
            asset: {
                defaultCategoryId: null
            }
        }
    };

    // User configuration (set with configure())
    var userConfig = {};

    // Current configuration (merge of default + user)
    var currentConfig = mergeConfig(defaultConfig, {});

    /**
     * Deep merge two configuration objects
     */
    function mergeConfig(target, source) {
        var result = {};

        // Copy all properties from target
        for (var key in target) {
            if (target.hasOwnProperty(key)) {
                if (typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
                    // If it's an object, do recursive merge
                    result[key] = mergeConfig(target[key], source[key] || {});
                } else {
                    result[key] = target[key];
                }
            }
        }

        // Overwrite/add properties from source
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    // If it's an object and already exists in result, merge
                    if (result[key] && typeof result[key] === 'object') {
                        result[key] = mergeConfig(result[key], source[key]);
                    } else {
                        result[key] = source[key];
                    }
                } else {
                    result[key] = source[key];
                }
            }
        }

        return result;
    }

    /**
     * Configure the framework with user settings
     * @param {Object} config - Custom configuration
     * @returns {Object} Updated configuration
     */
    function configure(config) {
        if (!config || typeof config !== 'object') {
            return currentConfig;
        }

        userConfig = config;
        currentConfig = mergeConfig(defaultConfig, userConfig);
        return currentConfig;
    }

    /**
     * Gets the complete current configuration
     * @returns {Object} Current configuration
     */
    function getConfig() {
        return currentConfig;
    }

    /**
     * Gets a specific configuration value
     * @param {String} path - Dot-separated path (e.g. "auth.clientId")
     * @returns {*} Configuration value or null
     */
    function get(path) {
        if (!path) return currentConfig;

        var keys = path.split('.');
        var value = currentConfig;

        for (var i = 0; i < keys.length; i++) {
            if (value && typeof value === 'object' && keys[i] in value) {
                value = value[keys[i]];
            } else {
                return null;
            }
        }

        return value;
    }

    /**
     * Sets a specific value in the configuration
     * @param {String} path - Dot-separated path
     * @param {*} value - Value to set
     */
    function set(path, value) {
        if (!path) return;

        var keys = path.split('.');
        var obj = currentConfig;

        for (var i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in obj)) {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }

        obj[keys[keys.length - 1]] = value;
    }

    /**
     * Validates that the authentication configuration is complete
     * @returns {Object} {valid: boolean, errors: Array}
     */
    function validateAuthConfig() {
        var errors = [];

        if (!currentConfig.auth.clientId) {
            errors.push('auth.clientId is required');
        }
        if (!currentConfig.auth.clientSecret) {
            errors.push('auth.clientSecret is required');
        }
        if (!currentConfig.auth.authBaseUrl) {
            errors.push('auth.authBaseUrl is required');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Gets authentication configuration
     * @returns {Object} Auth config
     */
    function getAuthConfig() {
        return {
            clientId: currentConfig.auth.clientId,
            clientSecret: currentConfig.auth.clientSecret,
            authBaseUrl: currentConfig.auth.authBaseUrl,
            tokenCacheDuration: currentConfig.auth.tokenCacheDuration,
            tokenRefreshBuffer: currentConfig.auth.tokenRefreshBuffer
        };
    }

    /**
     * Gets connection configuration
     * @returns {Object} Connection config
     */
    function getConnectionConfig() {
        return {
            maxRetries: currentConfig.connection.maxRetries,
            retryDelay: currentConfig.connection.retryDelay,
            timeout: currentConfig.connection.timeout,
            retryOnCodes: currentConfig.connection.retryOnCodes,
            continueOnError: currentConfig.connection.continueOnError
        };
    }

    /**
     * Reset to default configuration
     */
    function reset() {
        userConfig = {};
        currentConfig = mergeConfig(defaultConfig, {});
    }

    // Public API - Using this pattern for SFMC Content Block compatibility
    this.configure = configure;
    this.getConfig = getConfig;
    this.get = get;
    this.set = set;
    this.validateAuthConfig = validateAuthConfig;
    this.getAuthConfig = getAuthConfig;
    this.getConnectionConfig = getConnectionConfig;
    this.reset = reset;
}

</script>
