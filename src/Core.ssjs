<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║                     OMEGAFRAMEWORK CORE v1.1.0                    ║
 * ╠═══════════════════════════════════════════════════════════════════╣
 * ║                                                                   ║
 * ║  Modular framework for Salesforce Marketing Cloud                ║
 * ║  Inspired by ssjs-lib from EMAIL360                              ║
 * ║                                                                   ║
 * ║  IMPORTANT:                                                       ║
 * ║  This file automatically loads base modules and                  ║
 * ║  provides functions to load specific handlers                    ║
 * ║  only when needed.                                               ║
 * ║                                                                   ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */


/* ============================================================================
   STEP 1: LOAD BASE MODULES (Always required)
   ============================================================================ */
</script>

%%=TreatAsContent(ContentBlockByKey("OMG_FW_ResponseWrapper"))=%%
%%=TreatAsContent(ContentBlockByKey("OMG_FW_Settings"))=%%
%%=TreatAsContent(ContentBlockByKey("OMG_FW_AuthHandler"))=%%
%%=TreatAsContent(ContentBlockByKey("OMG_FW_ConnectionHandler"))=%%
%%=TreatAsContent(ContentBlockByKey("OMG_FW_BaseHandler"))=%%

<script runat="server">

// ============================================================================
// STEP 2: INITIALIZE THE FRAMEWORK
// ============================================================================

// Initialize OmegaFramework object
var OmegaFramework = {};

// Private variables
OmegaFramework._initialized = false;
OmegaFramework._settings = null;
OmegaFramework._authInstance = null;
OmegaFramework._connectionInstance = null;
OmegaFramework._loadedHandlers = {};

/**
 * Configure the framework
 *
 * @param {Object} config - Framework configuration
 * @example
 * OmegaFramework.configure({
 *   auth: {
 *     clientId: "xxx",
 *     clientSecret: "yyy",
 *     authBaseUrl: "https://..."
 *   }
 * });
 */
OmegaFramework.configure = function(config) {
    try {
        if (!OmegaFramework._settings) {
            OmegaFramework._settings = new OmegaFrameworkSettings();
        }

        OmegaFramework._settings.configure(config);

        // If auth is configured, recreate auth instance
        if (config.auth) {
            OmegaFramework._authInstance = null;
            OmegaFramework._connectionInstance = null;
        }

        OmegaFramework._initialized = true;

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
};

/**
 * Get current configuration
 */
OmegaFramework.getConfig = function() {
    if (!OmegaFramework._settings) {
        OmegaFramework._settings = new OmegaFrameworkSettings();
    }
    return OmegaFramework._settings.getConfig();
};

/**
 * Get singleton instance of AuthHandler
 */
OmegaFramework.getAuth = function() {
    if (!OmegaFramework._authInstance) {
        if (!OmegaFramework._settings) {
            OmegaFramework._settings = new OmegaFrameworkSettings();
        }
        var authConfig = OmegaFramework._settings.getAuthConfig();
        OmegaFramework._authInstance = getAuthHandlerInstance(authConfig);
    }
    return OmegaFramework._authInstance;
};

/**
 * Get singleton instance of ConnectionHandler
 */
OmegaFramework.getConnection = function() {
    if (!OmegaFramework._connectionInstance) {
        if (!OmegaFramework._settings) {
            OmegaFramework._settings = new OmegaFrameworkSettings();
        }
        var connectionConfig = OmegaFramework._settings.getConnectionConfig();
        OmegaFramework._connectionInstance = getConnectionHandlerInstance(connectionConfig);
    }
    return OmegaFramework._connectionInstance;
};

/**
 * Load a specific handler
 *
 * @param {String} handlerName - Handler name (EmailHandler, DataExtensionHandler, etc.)
 * @example
 * OmegaFramework.load("EmailHandler");
 * var email = new EmailHandler();
 */
OmegaFramework.load = function(handlerName) {
    try {
        // Avoid loading the same handler multiple times
        if (OmegaFramework._loadedHandlers[handlerName]) {
            return {
                success: true,
                message: handlerName + " already loaded",
                cached: true
            };
        }

        // Determine the Content Block key
        var contentBlockKey = "OMG_FW_" + handlerName;

        // Load the handler
        try {
            Platform.Function.ContentBlockByKey(contentBlockKey);
            OmegaFramework._loadedHandlers[handlerName] = true;

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
};

/**
 * Load multiple handlers
 *
 * @param {Array} handlerNames - Array of handler names
 * @example
 * OmegaFramework.loadMultiple(["EmailHandler", "DataExtensionHandler"]);
 */
OmegaFramework.loadMultiple = function(handlerNames) {
    var results = [];
    for (var i = 0; i < handlerNames.length; i++) {
        results.push(OmegaFramework.load(handlerNames[i]));
    }
    return results;
};

/**
 * Create handler instance with shared instances
 *
 * @param {String} handlerName - Handler name
 * @param {Object} customConfig - Custom configuration (optional)
 * @example
 * var email = OmegaFramework.createHandler("EmailHandler");
 */
OmegaFramework.createHandler = function(handlerName, customConfig) {
    try {
        // Ensure the handler is loaded
        var loadResult = OmegaFramework.load(handlerName);
        if (!loadResult.success) {
            return null;
        }

        // Get configuration
        var config = customConfig;
        if (!config && OmegaFramework._settings) {
            config = OmegaFramework._settings.getAuthConfig();
        }

        // Get singleton instances
        var auth = OmegaFramework.getAuth();
        var connection = OmegaFramework.getConnection();

        // Create handler instance
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
                // LogHandler needs additional logging configuration
                var logConfig = OmegaFramework._settings ? OmegaFramework._settings.get('logging') : {};
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
};

/**
 * Check if framework is initialized
 */
OmegaFramework.isInitialized = function() {
    return OmegaFramework._initialized;
};

/**
 * Get framework information
 */
OmegaFramework.getInfo = function() {
    var handlers = [];
    for (var key in OmegaFramework._loadedHandlers) {
        if (OmegaFramework._loadedHandlers.hasOwnProperty(key)) {
            handlers.push(key);
        }
    }

    return {
        name: "OmegaFramework",
        version: "1.1.0",
        initialized: OmegaFramework._initialized,
        loadedHandlers: handlers
    };
};

/**
 * Reset framework (useful for testing)
 */
OmegaFramework.reset = function() {
    OmegaFramework._initialized = false;
    OmegaFramework._settings = null;
    OmegaFramework._authInstance = null;
    OmegaFramework._connectionInstance = null;
    OmegaFramework._loadedHandlers = {};
};

// Aliases for compatibility
OmegaFramework.config = OmegaFramework.configure;
OmegaFramework.init = OmegaFramework.configure;

// ============================================================================
// STEP 3: SPECIFIC LOAD FUNCTIONS (For advanced users)
// ============================================================================

/**
 * Load EmailHandler
 * @returns {Boolean} true if loaded successfully
 */
function loadEmailHandler() {
    var result = OmegaFramework.load("EmailHandler");
    return result.success;
}

/**
 * Load DataExtensionHandler
 * @returns {Boolean} true if loaded successfully
 */
function loadDataExtensionHandler() {
    var result = OmegaFramework.load("DataExtensionHandler");
    return result.success;
}

/**
 * Load AssetHandler
 * @returns {Boolean} true if loaded successfully
 */
function loadAssetHandler() {
    var result = OmegaFramework.load("AssetHandler");
    return result.success;
}

/**
 * Load FolderHandler
 * @returns {Boolean} true if loaded successfully
 */
function loadFolderHandler() {
    var result = OmegaFramework.load("FolderHandler");
    return result.success;
}

/**
 * Load LogHandler
 * @returns {Boolean} true if loaded successfully
 */
function loadLogHandler() {
    var result = OmegaFramework.load("LogHandler");
    return result.success;
}

/**
 * Load AssetCreator
 * @returns {Boolean} true if loaded successfully
 */
function loadAssetCreator() {
    var result = OmegaFramework.load("AssetCreator");
    return result.success;
}

/**
 * Load JourneyCreator
 * @returns {Boolean} true if loaded successfully
 */
function loadJourneyCreator() {
    var result = OmegaFramework.load("JourneyCreator");
    return result.success;
}

// ============================================================================
// STEP 4: AUTO-INFO (Optional - comment out in production)
// ============================================================================

// Uncomment to see framework information when loading
// Write("<div style='background:#f0f0f0; padding:10px; margin:10px 0; border-left:4px solid #0176d3;'>");
// Write("<strong>✅ OmegaFramework Core v1.1.0 loaded successfully</strong><br>");
// Write("Use <code>OmegaFramework.configure({...})</code> to setup<br>");
// Write("Use <code>OmegaFramework.load('HandlerName')</code> to load handlers<br>");
// Write("Use <code>OmegaFramework.createHandler('HandlerName')</code> to create instances");
// Write("</div>");

</script>
