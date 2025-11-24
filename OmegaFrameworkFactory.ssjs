<script runat="server">
/**
 * OmegaFrameworkFactory - Single entry point for the Omega Framework.
 *
 * This factory uses a lazy-loading mechanism to load and instantiate framework components on demand.
 * It also dynamically generates "getter" methods for each component (e.g., getAssetHandler, getSFMCIntegration)
 * for a more intuitive developer experience.
 *
 * It avoids using IIFE (Immediately Invoked Function Expressions) to be compatible with stricter SSJS environments.
 * Internal properties and methods are denoted by a leading underscore _.
 *
 * @version 3.0.0
 * @author OmegaFramework
 */

if (typeof OmegaFramework === 'undefined') {

    var OmegaFramework = {

        // --- "Private" State ---
        _loadedBlocks: {},
        _singletons: {
            log: { info: function(msg) {}, error: function(msg) { Write("ERROR: " + msg); } },
            connection: null,
            credStore: null,
            tokenCache: null
        },

        // --- "Private" Mappings ---
        _blockKeyMap: {
            'ResponseWrapper': 'OMG_ResponseWrapper', 'CredentialStore': 'OMG_CredentialStore', 'ConnectionHandler': 'OMG_ConnectionHandler',
            'DataExtensionTokenCache': 'OMG_DataExtensionTokenCache', 'OAuth2AuthStrategy': 'OMG_OAuth2AuthStrategy',
            'BasicAuthStrategy': 'OMG_BasicAuthStrategy', 'BearerAuthStrategy': 'OMG_BearerAuthStrategy', 'BaseIntegration': 'OMG_BaseIntegration',
            'SFMCIntegration': 'OMG_SFMCIntegration', 'DataCloudIntegration': 'OMG_DataCloudIntegration',
            'VeevaCRMIntegration': 'OMG_VeevaCRMIntegration', 'VeevaVaultIntegration': 'OMG_VeevaVaultIntegration',
            'AssetHandler': 'OMG_AssetHandler', 'DataExtensionHandler': 'OMG_DataExtensionHandler', 'EmailHandler': 'OMG_EmailHandler',
            'FolderHandler': 'OMG_FolderHandler', 'JourneyHandler': 'OMG_JourneyHandler'
        },

        _dependencyMap: {
            'SFMCIntegration': ['BaseIntegration'], 'DataCloudIntegration': ['BaseIntegration'], 'VeevaCRMIntegration': ['BaseIntegration'], 'VeevaVaultIntegration': ['BaseIntegration'],
            'BaseIntegration': ['ResponseWrapper'],
            'OAuth2AuthStrategy': ['DataExtensionTokenCache', 'ConnectionHandler', 'ResponseWrapper'],
            'BasicAuthStrategy': ['ResponseWrapper'], 'BearerAuthStrategy': ['ResponseWrapper'],
            'AssetHandler': ['SFMCIntegration'], 'DataExtensionHandler': ['SFMCIntegration'], 'EmailHandler': ['SFMCIntegration'],
            'FolderHandler': ['SFMCIntegration'], 'JourneyHandler': ['SFMCIntegration'],
            'CredentialStore': ['ResponseWrapper'], 'ConnectionHandler': ['ResponseWrapper'], 'DataExtensionTokenCache': ['ResponseWrapper']
        },

        // --- "Private" Core Methods ---

        _loadAndEval: function(key) {
            if (this._loadedBlocks[key]) return true;
            var content = Platform.Function.ContentBlockByKey(key);
            if (content && content.length > 0) {
                try {
                    eval(content);
                    this._loadedBlocks[key] = true;
                    return true;
                } catch (e) {
                    this._singletons.log.error('OmegaFramework._loadAndEval failed for key ' + key + '. Error: ' + e.message);
                    return false;
                }
            }
            throw new Error("OmegaFramework: Failed to load Content Block with key '" + key + "'.");
        },

        _ensureLoaded: function(componentName) {
            var dependencies = this._dependencyMap[componentName] || [];
            for (var i = 0; i < dependencies.length; i++) {
                this._ensureLoaded(dependencies[i]);
            }
            var blockKey = this._blockKeyMap[componentName];
            if (blockKey) this._loadAndEval(blockKey);
        },

        // --- "Private" Singleton Getters ---
        _getConnection: function() {
            if (!this._singletons.connection) {
                this._ensureLoaded('ConnectionHandler');
                this._singletons.connection = new ConnectionHandler(this._singletons.log);
            }
            return this._singletons.connection;
        },

        _getCredentialStore: function(config) {
            // This factory is designed for the newer architecture, but we adapt for the older one.
            // In the older arch, CredentialStore is not a singleton and is instantiated with an alias.
            this._ensureLoaded('CredentialStore');
            return new CredentialStore((config && config.credentialAlias) || '');
        },

        _getTokenCache: function(config) {
            if (!this._singletons.tokenCache) {
                this._ensureLoaded('DataExtensionTokenCache');
                var deKey = (config && config.tokenCacheDEKey) ? config.tokenCacheDEKey : 'OMG_FW_TokenCache';
                this._singletons.tokenCache = new DataExtensionTokenCache(this._singletons.log, deKey);
            }
            return this._singletons.tokenCache;
        },
        
        // --- "Private" Dynamic Getter Attachment ---
        _attachDynamicGetters: function() {
            var self = this;
            for (var key in self._blockKeyMap) {
                if (Object.prototype.hasOwnProperty.call(self._blockKeyMap, key)) {
                    
                    (function(componentName) {
                        var getterName = 'get' + componentName; // e.g., getAssetHandler
                        
                        self[getterName] = function(config) {
                            if (componentName.indexOf('Handler') > -1 && componentName !== 'ConnectionHandler') {
                                var baseName = componentName.replace('Handler', '');
                                return self.getHandler(baseName, config);
                            } else if (componentName.indexOf('Integration') > -1) {
                                var baseName = componentName.replace('Integration', '');
                                return self.getIntegration(baseName, config);
                            } else {
                                // Dynamic getters for core components are not fully supported due to varied constructors.
                                // This provides a basic instantiation for simple cases like ResponseWrapper.
                                try {
                                    self._ensureLoaded(componentName);
                                    if(typeof this[componentName] === 'function') {
                                        return new ResponseWrapper().success(new this[componentName]());
                                    }
                                } catch(e) {
                                     return new ResponseWrapper().error(getterName, e.message);
                                }
                                return new ResponseWrapper().error(getterName, "This core component has a complex constructor and cannot be retrieved with a dynamic getter.");
                            }
                        };
                    })(key);
                }
            }
        },


        // --- Public Factory Methods ---

        getIntegration: function(integrationName, config) {
            this._ensureLoaded('ResponseWrapper');
            try {
                var fullIntegrationName = integrationName + 'Integration';
                this._ensureLoaded(fullIntegrationName);

                var credStore = this._getCredentialStore(config);
                var credsResponse = credStore.getCredentials();

                if (!credsResponse.success) {
                    return new ResponseWrapper().error('Factory:getIntegration', 'Failed to get credentials: ' + credsResponse.error);
                }
                var credentials = credsResponse.data;

                var authStrategy;
                var authType = credentials.authType;
                this._ensureLoaded(authType + 'AuthStrategy');
                
                // This part is tricky as it mixes DI and non-DI patterns.
                // It assumes AuthStrategy constructors take the credential object.
                if (authType === 'OAuth2') {
                    // This constructor needs to be verified based on the actual file content for this branch
                    authStrategy = new OAuth2AuthStrategy(credentials);
                } else if (authType === 'Basic') {
                    authStrategy = new BasicAuthStrategy(credentials);
                } else {
                    return new ResponseWrapper().error('Factory:getIntegration', 'Unsupported authentication type: ' + authType);
                }

                var integrationInstance;
                var integrationConfig = { auth: authStrategy, restBaseUrl: config.restBaseUrl };

                if (integrationName === 'SFMC') {
                    integrationInstance = new SFMCIntegration(integrationConfig);
                } else {
                    return new ResponseWrapper().error('Factory:getIntegration', 'Unknown integration name: ' + integrationName);
                }
                return new ResponseWrapper().success(integrationInstance);

            } catch (e) {
                return new ResponseWrapper().error('Factory:getIntegration', 'Error during instantiation: ' + e.message);
            }
        },

        getHandler: function(handlerName, config) {
            this._ensureLoaded('ResponseWrapper');
            try {
                var fullHandlerName = handlerName + 'Handler';
                this._ensureLoaded(fullHandlerName);
                
                var integrationResponse = this.getIntegration('SFMC', config);
                if (!integrationResponse.success) {
                    return integrationResponse;
                }
                var sfmcIntegration = integrationResponse.data;
                
                var handlerInstance;
                 if (handlerName === 'Asset') { handlerInstance = new AssetHandler(sfmcIntegration); }
                 else if (handlerName === 'DataExtension') { handlerInstance = new DataExtensionHandler(sfmcIntegration); }
                 else if (handlerName === 'Folder') { handlerInstance = new FolderHandler(sfmcIntegration); }
                 else if (handlerName === 'Email') { handlerInstance = new EmailHandler(sfmcIntegration); }
                 else if (handlerName === 'Journey') { handlerInstance = new JourneyHandler(sfmcIntegration); }
                 else { return new ResponseWrapper().error('Factory:getHandler', 'Unknown handler name: ' + handlerName); }

                return new ResponseWrapper().success(handlerInstance);

            } catch (e) {
                return new ResponseWrapper().error('Factory:getHandler', 'Error during instantiation: ' + e.message);
            }
        },
        
        /**
         * Initializes the factory, including attaching dynamic getter methods.
         */
        init: function() {
            this._attachDynamicGetters();
            // Since we removed the IIFE, we return 'this' to allow for potential chaining, though not required here.
            return this;
        }
    };
    
    // Initialize the factory to attach the dynamic methods.
    OmegaFramework.init();
}


</script>

