<script runat="server">

/**
 * OmegaFramework Settings
 * Configuración centralizada del framework
 *
 * @version 1.0.0
 */

function OmegaFrameworkSettings() {

    /**
     * Configuración por defecto del framework
     */
    var defaultConfig = {
        // Información del framework
        framework: {
            name: "OmegaFramework",
            version: "1.0.0",
            prefix: "OMG_FW_"
        },

        // Configuración de autenticación (se sobrescribe por usuario)
        auth: {
            clientId: null,
            clientSecret: null,
            authBaseUrl: null,
            tokenCacheDuration: 3600000, // 1 hora en ms
            tokenRefreshBuffer: 300000   // 5 minutos antes de expirar
        },

        // Configuración de conexión HTTP
        connection: {
            maxRetries: 3,
            retryDelay: 1000,
            timeout: 5000,
            retryOnCodes: [429, 500, 502, 503, 504],
            continueOnError: true
        },

        // Configuración de logging
        logging: {
            level: "INFO",              // DEBUG, INFO, WARN, ERROR
            enableConsole: true,
            enableDataExtension: false,
            enableEmailAlerts: false,
            dataExtensionKey: "omegaframework_logs",
            emailAlertAddress: null
        },

        // Configuración de Data Extensions
        dataExtension: {
            preferSSJS: true,           // Intentar SSJS functions primero
            fallbackToREST: true,       // Si SSJS falla, usar REST API
            defaultPageSize: 50
        },

        // Configuración de handlers específicos
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

    // Configuración de usuario (se setea con configure())
    var userConfig = {};

    // Configuración actual (merge de default + user)
    var currentConfig = mergeConfig(defaultConfig, {});

    /**
     * Hace merge profundo de dos objetos de configuración
     */
    function mergeConfig(target, source) {
        var result = {};

        // Copiar todas las propiedades del target
        for (var key in target) {
            if (target.hasOwnProperty(key)) {
                if (typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
                    // Si es objeto, hacer merge recursivo
                    result[key] = mergeConfig(target[key], source[key] || {});
                } else {
                    result[key] = target[key];
                }
            }
        }

        // Sobrescribir/agregar propiedades del source
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    // Si es objeto y ya existe en result, hacer merge
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
     * Configura el framework con configuración de usuario
     * @param {Object} config - Configuración personalizada
     * @returns {Object} Configuración actualizada
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
     * Obtiene la configuración actual completa
     * @returns {Object} Configuración actual
     */
    function getConfig() {
        return currentConfig;
    }

    /**
     * Obtiene un valor específico de la configuración
     * @param {String} path - Ruta separada por puntos (ej: "auth.clientId")
     * @returns {*} Valor de configuración o null
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
     * Establece un valor específico en la configuración
     * @param {String} path - Ruta separada por puntos
     * @param {*} value - Valor a establecer
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
     * Valida que la configuración de autenticación esté completa
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
     * Obtiene configuración de autenticación
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
     * Obtiene configuración de conexión
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
     * Reset a configuración por defecto
     */
    function reset() {
        userConfig = {};
        currentConfig = mergeConfig(defaultConfig, {});
    }

    // API pública
    return {
        configure: configure,
        getConfig: getConfig,
        get: get,
        set: set,
        validateAuthConfig: validateAuthConfig,
        getAuthConfig: getAuthConfig,
        getConnectionConfig: getConnectionConfig,
        reset: reset
    };
}

</script>
