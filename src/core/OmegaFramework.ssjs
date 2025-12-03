<script runat="server">
/**
 * OmegaFramework - Module Loader with Declarative Registration
 *
 * This is the core module loader that replaces OmegaFrameworkFactory.ssjs with a modern
 * architecture based on declarative module registration and automatic dependency injection.
 *
 * Key Features:
 * - Eliminates eval() - uses factory functions for clean stack traces
 * - Auto-dependency resolution with topological sort
 * - Configuration presets (production, sandbox, test)
 * - Transparent caching to prevent duplicate loads
 * - Support for both credentialAlias and credential objects
 *
 * @version 3.0.0
 * @author OmegaFramework - Agente Desarrollador
 * @date 2025-12-02
 */

Platform.Load("core", "1.1.1");

if (typeof OmegaFramework === 'undefined') {

    OmegaFramework = {

        // ========================================================================
        // CONFIGURATION PRESETS
        // ========================================================================
        _presets: {
            'production': {
                credentialAlias: 'SFMC_Production',
                tokenCacheDEKey: 'OMG_FW_TokenCache'
            },
            'sandbox': {
                credentialAlias: 'SFMC_Sandbox',
                tokenCacheDEKey: 'OMG_FW_TokenCache_Sandbox'
            },
            'test': {
                credentialAlias: 'SFMC_Test',
                tokenCacheDEKey: 'OMG_FW_TokenCache_Test'
            }
        },

        // ========================================================================
        // MODULE REGISTRY
        // ========================================================================
        _registry: {},

        // ========================================================================
        // INSTANCE CACHE (per-execution, not persistent)
        // ========================================================================
        _cache: {},

        // ========================================================================
        // LOADING STACK (for circular dependency detection)
        // ========================================================================
        _loadingStack: [],

        // ========================================================================
        // GLOBAL LOADED TRACKER (sync with __OmegaFramework.loaded)
        // ========================================================================
        _initGlobalTracker: function() {
            if (typeof __OmegaFramework === 'undefined') {
                __OmegaFramework = { loaded: {} };
            }
            return __OmegaFramework;
        },

        // ========================================================================
        // PUBLIC API: REGISTER MODULE
        // ========================================================================
        /**
         * Registers a module with the framework
         * @param {string} moduleName - Unique name for the module
         * @param {Object} metadata - Module metadata
         * @param {string[]} metadata.dependencies - Array of dependency module names
         * @param {Function} metadata.factory - Factory function that returns module instance
         * @param {string} [metadata.blockKey] - Content Block key (defaults to 'OMG_' + moduleName)
         * @returns {Object} OmegaFramework instance for chaining
         */
        register: function(moduleName, metadata) {
            // Validaciones
            if (!moduleName || typeof moduleName !== 'string') {
                throw new Error('OmegaFramework.register: moduleName must be a non-empty string');
            }
            if (!metadata || typeof metadata !== 'object') {
                throw new Error('OmegaFramework.register: metadata must be an object');
            }
            if (!metadata.factory || typeof metadata.factory !== 'function') {
                throw new Error('OmegaFramework.register: metadata.factory must be a function');
            }

            // Defaults
            metadata.dependencies = metadata.dependencies || [];
            metadata.blockKey = metadata.blockKey || ('OMG_FW_' + moduleName);

            // Validar que dependencies sea array
            if (Object.prototype.toString.call(metadata.dependencies) !== '[object Array]') {
                throw new Error('OmegaFramework.register: metadata.dependencies must be an array');
            }

            // Store in registry
            this._registry[moduleName] = {
                blockKey: metadata.blockKey,
                dependencies: metadata.dependencies,
                factory: metadata.factory,
                loaded: false
            };

            // Mark as registered globally
            var globalTracker = this._initGlobalTracker();
            globalTracker.loaded[moduleName] = 'registered';

            return this; // Chainable
        },

        // ========================================================================
        // PUBLIC API: REQUIRE MODULE
        // ========================================================================
        /**
         * Loads and returns a module instance
         * @param {string} moduleName - Name of module to load
         * @param {string|Object} config - Preset name ('production', 'sandbox', 'test') or config object
         * @returns {*} Module instance
         */
        require: function(moduleName, config) {
            // Resolve config (preset or manual)
            var resolvedConfig = this._resolveConfig(config);

            // Generate cache key based on module name + unique config properties
            var cacheKey = this._generateCacheKey(moduleName, resolvedConfig);

            // Check cache first
            if (this._cache[cacheKey]) {
                return this._cache[cacheKey];
            }

            // Load module and dependencies
            var instance = this._loadModule(moduleName, resolvedConfig, cacheKey);

            return instance;
        },

        // ========================================================================
        // INTERNAL: RESOLVE CONFIG
        // ========================================================================
        _resolveConfig: function(config) {
            if (!config) {
                throw new Error('OmegaFramework: config is required (use preset name or config object)');
            }

            // If config is a string, treat as preset name
            if (typeof config === 'string') {
                var preset = this._presets[config];
                if (!preset) {
                    throw new Error('OmegaFramework: Unknown preset "' + config + '". Available: production, sandbox, test');
                }
                return preset;
            }

            // Otherwise, use config object directly
            return config;
        },

        // ========================================================================
        // INTERNAL: LOAD MODULE (recursive dependency resolution)
        // ========================================================================
        _loadModule: function(moduleName, config, cacheKey) {
            // Check cache using cacheKey
            if (this._cache[cacheKey]) {
                return this._cache[cacheKey];
            }

            // Circular dependency detection
            if (this._indexOf(this._loadingStack, moduleName) !== -1) {
                var cycle = this._loadingStack.concat([moduleName]).join(' → ');
                throw new Error('OmegaFramework: Circular dependency detected: ' + cycle);
            }

            // Add to loading stack
            this._loadingStack.push(moduleName);

            try {
                // Get metadata from registry
                var metadata = this._registry[moduleName];

                // If not registered, load the content block to trigger registration
                if (!metadata) {
                    var blockKey = 'OMG_FW_' + moduleName;

                    try {
                        var content = Platform.Function.ContentBlockByKey(blockKey);

                        // After loading, metadata should exist
                        metadata = this._registry[moduleName];

                        if (!metadata) {
                            throw new Error('OmegaFramework: Module "' + moduleName + '" not found. Content block "' + blockKey + '" did not register the module.');
                        }
                    } catch (loadError) {
                        throw new Error('OmegaFramework: Failed to load content block "' + blockKey + '": ' + loadError.message);
                    }
                }

                // Load dependencies recursively (dependencies share same cacheKey base)
                var resolvedDeps = [];
                for (var i = 0; i < metadata.dependencies.length; i++) {
                    var depName = metadata.dependencies[i];
                    var depCacheKey = this._generateCacheKey(depName, config);
                    var depInstance = this._loadModule(depName, config, depCacheKey);
                    resolvedDeps.push(depInstance);
                }

                // Execute factory function with resolved dependencies
                var instance;

                try {
                    // ES3 doesn't have Function.prototype.apply with array spread
                    // Handle different number of dependencies
                    if (resolvedDeps.length === 0) {
                        instance = metadata.factory(config);
                    } else if (resolvedDeps.length === 1) {
                        instance = metadata.factory(resolvedDeps[0], config);
                    } else if (resolvedDeps.length === 2) {
                        instance = metadata.factory(resolvedDeps[0], resolvedDeps[1], config);
                    } else if (resolvedDeps.length === 3) {
                        instance = metadata.factory(resolvedDeps[0], resolvedDeps[1], resolvedDeps[2], config);
                    } else if (resolvedDeps.length === 4) {
                        instance = metadata.factory(resolvedDeps[0], resolvedDeps[1], resolvedDeps[2], resolvedDeps[3], config);
                    } else {
                        // For more than 4 deps, pass as array
                        instance = metadata.factory(resolvedDeps, config);
                    }
                } catch (factoryError) {
                    throw new Error('OmegaFramework: Factory for "' + moduleName + '" failed: ' + factoryError.message);
                }

                // Cache instance using cacheKey
                this._cache[cacheKey] = instance;

                // Mark as loaded globally
                var globalTracker = this._initGlobalTracker();
                globalTracker.loaded[moduleName] = true;

                metadata.loaded = true;

                // Remove from loading stack
                this._loadingStack.pop();

                return instance;

            } catch (error) {
                // Remove from loading stack on error
                this._loadingStack.pop();
                throw error;
            }
        },

        // ========================================================================
        // INTERNAL: GENERATE CACHE KEY
        // ========================================================================
        /**
         * Generates a unique cache key based on module name and config
         * @param {string} moduleName - Name of the module
         * @param {Object} config - Configuration object
         * @returns {string} Unique cache key
         * @private
         */
        _generateCacheKey: function(moduleName, config) {
            // Start with module name
            var key = moduleName;

            // Add unique config properties that distinguish instances
            // Common properties that should create different instances:
            var uniqueProps = ['integrationName', 'cacheKey', 'credentialAlias', 'tokenCacheDEKey'];

            for (var i = 0; i < uniqueProps.length; i++) {
                var prop = uniqueProps[i];
                if (config && config[prop]) {
                    key += ':' + prop + '=' + config[prop];
                }
            }

            return key;
        },

        // ========================================================================
        // UTILITIES
        // ========================================================================

        /**
         * Returns list of registered modules
         * @returns {string[]} Array of module names
         */
        getRegisteredModules: function() {
            var modules = [];
            for (var key in this._registry) {
                if (this._registry.hasOwnProperty(key)) {
                    modules.push(key);
                }
            }
            return modules;
        },

        /**
         * Returns list of loaded (cached) modules in current execution
         * @returns {string[]} Array of loaded module names
         */
        getLoadedModules: function() {
            var modules = [];
            for (var key in this._cache) {
                if (this._cache.hasOwnProperty(key)) {
                    modules.push(key);
                }
            }
            return modules;
        },

        /**
         * Clears instance cache (useful for testing, not recommended in production)
         */
        clearCache: function() {
            this._cache = {};
            if (typeof __OmegaFramework !== 'undefined') {
                __OmegaFramework.loaded = {};
            }
        },

        // ========================================================================
        // POLYFILLS (ES3 compatibility)
        // ========================================================================

        /**
         * ES3-compatible indexOf for arrays
         * @private
         */
        _indexOf: function(array, item) {
            for (var i = 0; i < array.length; i++) {
                if (array[i] === item) {
                    return i;
                }
            }
            return -1;
        }
    };

    // Initialize global tracker
    OmegaFramework._initGlobalTracker();
}

</script>

<!--
============================================================================
USAGE EXAMPLE
============================================================================

<script runat="server">
Platform.Load("core", "1.1.1");

// Load the framework
Platform.Function.ContentBlockByKey("OMG_FW_OmegaFramework");

// Option 1: Use preset (simplest - recommended)
var assetHandler = OmegaFramework.require('AssetHandler', 'production');

// Option 2: Manual config with credentialAlias
var customHandler = OmegaFramework.require('AssetHandler', {
    credentialAlias: 'MyCustomCredential',
    tokenCacheDEKey: 'My_TokenCache'
});

// Option 3: Manual config with credentials object (for non-DE scenarios)
var directHandler = OmegaFramework.require('AssetHandler', {
    credentials: {
        authType: 'OAuth2',
        authUrl: 'https://auth.example.com',
        tokenEndpoint: '/v2/token',
        baseUrl: 'https://api.example.com',
        clientId: 'my_client_id',
        clientSecret: 'my_secret'
    },
    tokenCacheDEKey: 'Custom_TokenCache'
});

// Use the handler
var result = assetHandler.createAsset({
    name: 'MyAsset',
    assetType: 'htmlblock',
    content: '<h1>Hello World</h1>'
});

if (result.success) {
    Write('Asset created: ' + result.data.id);
} else {
    Write('Error: ' + result.error.message);
}

// Debug: See what's loaded
Write('Registered modules: ' + OmegaFramework.getRegisteredModules().join(', '));
Write('Loaded modules: ' + OmegaFramework.getLoadedModules().join(', '));
</script>

============================================================================
TESTING SCENARIOS
============================================================================

1. Test module registration
   - Register a simple module with no dependencies
   - Verify it appears in getRegisteredModules()

2. Test dependency resolution
   - Register modules with dependencies: A -> B -> C
   - Require module A
   - Verify B and C are loaded automatically

3. Test circular dependency detection
   - Register modules with circular deps: A -> B -> A
   - Attempt to require module A
   - Should throw error with clear message

4. Test preset resolution
   - Use 'production', 'sandbox', 'test' presets
   - Verify correct config is resolved

5. Test cache behavior
   - Require same module twice
   - Verify second call returns cached instance (no reload)

6. Test error handling
   - Try to load non-existent module
   - Try to use invalid preset
   - Verify clear error messages

7. Test credentialAlias vs credentials object
   - Use credentialAlias with preset
   - Use credentials object directly
   - Both should work

8. Test clearCache
   - Load modules
   - Call clearCache()
   - Require again - should reload

============================================================================
-->
