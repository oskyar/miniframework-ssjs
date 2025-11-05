<script runat="server">

Platform.Load("core", "1.1.1");

/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║                     OMEGAFRAMEWORK CORE v1.1.0                    ║
 * ╠═══════════════════════════════════════════════════════════════════╣
 * ║                                                                   ║
 * ║  Framework modular para Salesforce Marketing Cloud               ║
 * ║  Inspirado en ssjs-lib de EMAIL360                               ║
 * ║                                                                   ║
 * ║  IMPORTANTE:                                                      ║
 * ║  Este archivo carga automáticamente los módulos base y           ║
 * ║  proporciona funciones para cargar handlers específicos          ║
 * ║  solo cuando son necesarios.                                     ║
 * ║                                                                   ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

// ============================================================================
// PASO 1: CARGAR MÓDULOS BASE (Siempre necesarios)
// ============================================================================

%%=TreatAsContent(ContentBlockByKey("OMG_FW_ResponseWrapper"))=%%
%%=TreatAsContent(ContentBlockByKey("OMG_FW_Settings"))=%%
%%=TreatAsContent(ContentBlockByKey("OMG_FW_AuthHandler"))=%%
%%=TreatAsContent(ContentBlockByKey("OMG_FW_ConnectionHandler"))=%%
%%=TreatAsContent(ContentBlockByKey("OMG_FW_BaseHandler"))=%%

// ============================================================================
// PASO 2: INICIALIZAR EL FRAMEWORK
// ============================================================================

var OmegaFramework = (function() {

    // Variables privadas
    var _initialized = false;
    var _settings = null;
    var _authInstance = null;
    var _connectionInstance = null;
    var _loadedHandlers = {};

    /**
     * Configurar el framework
     *
     * @param {Object} config - Configuración del framework
     * @example
     * OmegaFramework.configure({
     *   auth: {
     *     clientId: "xxx",
     *     clientSecret: "yyy",
     *     authBaseUrl: "https://..."
     *   }
     * });
     */
    function configure(config) {
        try {
            if (!_settings) {
                _settings = new OmegaFrameworkSettings();
            }

            _settings.configure(config);

            // Si se configura auth, recrear instancia de auth
            if (config.auth) {
                _authInstance = null;
                _connectionInstance = null;
            }

            _initialized = true;

            return {
                success: true,
                message: "OmegaFramework configured successfully"
            };

        } catch (ex) {
            return {
                success: false,
                error: ex.message || ex.toString()
            };
        }
    }

    /**
     * Obtener configuración actual
     */
    function getConfig() {
        if (!_settings) {
            _settings = new OmegaFrameworkSettings();
        }
        return _settings.getConfig();
    }

    /**
     * Obtener instancia singleton de AuthHandler
     */
    function getAuth() {
        if (!_authInstance) {
            if (!_settings) {
                _settings = new OmegaFrameworkSettings();
            }
            var authConfig = _settings.getAuthConfig();
            _authInstance = getAuthHandlerInstance(authConfig);
        }
        return _authInstance;
    }

    /**
     * Obtener instancia singleton de ConnectionHandler
     */
    function getConnection() {
        if (!_connectionInstance) {
            if (!_settings) {
                _settings = new OmegaFrameworkSettings();
            }
            var connectionConfig = _settings.getConnectionConfig();
            _connectionInstance = getConnectionHandlerInstance(connectionConfig);
        }
        return _connectionInstance;
    }

    /**
     * Cargar un handler específico
     *
     * @param {String} handlerName - Nombre del handler (EmailHandler, DataExtensionHandler, etc.)
     * @example
     * OmegaFramework.load("EmailHandler");
     * var email = new EmailHandler();
     */
    function load(handlerName) {
        try {
            // Evitar cargar el mismo handler múltiples veces
            if (_loadedHandlers[handlerName]) {
                return {
                    success: true,
                    message: handlerName + " already loaded",
                    cached: true
                };
            }

            // Determinar el key del Content Block
            var contentBlockKey = "OMG_FW_" + handlerName;

            // Cargar el handler
            try {
                Platform.Function.ContentBlockByKey(contentBlockKey);
                _loadedHandlers[handlerName] = true;

                return {
                    success: true,
                    message: handlerName + " loaded successfully",
                    cached: false
                };
            } catch (loadEx) {
                return {
                    success: false,
                    error: "Failed to load " + handlerName + ": " + loadEx.message
                };
            }

        } catch (ex) {
            return {
                success: false,
                error: ex.message || ex.toString()
            };
        }
    }

    /**
     * Cargar múltiples handlers
     *
     * @param {Array} handlerNames - Array de nombres de handlers
     * @example
     * OmegaFramework.loadMultiple(["EmailHandler", "DataExtensionHandler"]);
     */
    function loadMultiple(handlerNames) {
        var results = [];
        for (var i = 0; i < handlerNames.length; i++) {
            results.push(load(handlerNames[i]));
        }
        return results;
    }

    /**
     * Crear instancia de un handler con las instancias compartidas
     *
     * @param {String} handlerName - Nombre del handler
     * @param {Object} customConfig - Configuración personalizada (opcional)
     * @example
     * var email = OmegaFramework.createHandler("EmailHandler");
     */
    function createHandler(handlerName, customConfig) {
        try {
            // Asegurar que el handler está cargado
            var loadResult = load(handlerName);
            if (!loadResult.success) {
                return null;
            }

            // Obtener configuración
            var config = customConfig;
            if (!config && _settings) {
                config = _settings.getAuthConfig();
            }

            // Obtener instancias singleton
            var auth = getAuth();
            var connection = getConnection();

            // Crear instancia del handler
            switch (handlerName) {
                case "EmailHandler":
                    return new EmailHandler(config, auth, connection);
                case "DataExtensionHandler":
                    return new DataExtensionHandler(config, auth, connection);
                case "AssetHandler":
                    return new AssetHandler(config, auth, connection);
                case "FolderHandler":
                    return new FolderHandler(config, auth, connection);
                case "LogHandler":
                    // LogHandler necesita configuración adicional de logging
                    var logConfig = _settings ? _settings.get('logging') : {};
                    return new LogHandler(config, logConfig, auth, connection);
                case "AssetCreator":
                    return new AssetCreator(config, auth, connection);
                case "JourneyCreator":
                    return new JourneyCreator(config, auth, connection);
                default:
                    return null;
            }

        } catch (ex) {
            return null;
        }
    }

    /**
     * Verificar si el framework está inicializado
     */
    function isInitialized() {
        return _initialized;
    }

    /**
     * Obtener información del framework
     */
    function getInfo() {
        return {
            name: "OmegaFramework",
            version: "1.1.0",
            initialized: _initialized,
            loadedHandlers: Object.keys(_loadedHandlers)
        };
    }

    /**
     * Reset del framework (útil para testing)
     */
    function reset() {
        _initialized = false;
        _settings = null;
        _authInstance = null;
        _connectionInstance = null;
        _loadedHandlers = {};
    }

    // API Pública
    return {
        configure: configure,
        getConfig: getConfig,
        load: load,
        loadMultiple: loadMultiple,
        createHandler: createHandler,
        getAuth: getAuth,
        getConnection: getConnection,
        isInitialized: isInitialized,
        getInfo: getInfo,
        reset: reset,

        // Alias para compatibilidad
        config: configure,
        init: configure
    };

})();

// ============================================================================
// PASO 3: FUNCIONES DE CARGA ESPECÍFICAS (Para usuarios avanzados)
// ============================================================================

/**
 * Cargar EmailHandler
 * @returns {Boolean} true si se cargó exitosamente
 */
function loadEmailHandler() {
    var result = OmegaFramework.load("EmailHandler");
    return result.success;
}

/**
 * Cargar DataExtensionHandler
 * @returns {Boolean} true si se cargó exitosamente
 */
function loadDataExtensionHandler() {
    var result = OmegaFramework.load("DataExtensionHandler");
    return result.success;
}

/**
 * Cargar AssetHandler
 * @returns {Boolean} true si se cargó exitosamente
 */
function loadAssetHandler() {
    var result = OmegaFramework.load("AssetHandler");
    return result.success;
}

/**
 * Cargar FolderHandler
 * @returns {Boolean} true si se cargó exitosamente
 */
function loadFolderHandler() {
    var result = OmegaFramework.load("FolderHandler");
    return result.success;
}

/**
 * Cargar LogHandler
 * @returns {Boolean} true si se cargó exitosamente
 */
function loadLogHandler() {
    var result = OmegaFramework.load("LogHandler");
    return result.success;
}

/**
 * Cargar AssetCreator
 * @returns {Boolean} true si se cargó exitosamente
 */
function loadAssetCreator() {
    var result = OmegaFramework.load("AssetCreator");
    return result.success;
}

/**
 * Cargar JourneyCreator
 * @returns {Boolean} true si se cargó exitosamente
 */
function loadJourneyCreator() {
    var result = OmegaFramework.load("JourneyCreator");
    return result.success;
}

// ============================================================================
// PASO 4: AUTO-INFORMACIÓN (Opcional - comentar en producción)
// ============================================================================

// Descomentar para ver información del framework al cargar
// Write("<div style='background:#f0f0f0; padding:10px; margin:10px 0; border-left:4px solid #0176d3;'>");
// Write("<strong>✅ OmegaFramework Core v1.1.0 loaded successfully</strong><br>");
// Write("Use <code>OmegaFramework.configure({...})</code> to setup<br>");
// Write("Use <code>OmegaFramework.load('HandlerName')</code> to load handlers<br>");
// Write("Use <code>OmegaFramework.createHandler('HandlerName')</code> to create instances");
// Write("</div>");

</script>
