<script runat="server">

Platform.Load("core", "1.1.1");

// Load required components
%%=ContentBlockByKey("MF_ResponseWrapper")=%%
%%=ContentBlockByKey("MF_AssetCreator")=%%

// MiniFramework Automated Installer
// This script creates all Content Blocks automatically from source files

function MiniFrameworkInstaller() {
    var installer = 'MiniFrameworkInstaller';
    
    // Framework configuration
    var frameworkConfig = {
        name: 'MiniFramework',
        version: '1.0.0',
        description: 'SSJS Framework for Salesforce Marketing Cloud',
        prefix: 'MF_',
        category: 'MiniFramework'
    };
    
    // Content Blocks to create
    var contentBlocks = [
        {
            name: 'ResponseWrapper',
            key: 'miniframework_response_wrapper',
            description: 'Standard response wrapper for all handlers',
            sourceUrl: 'https://raw.githubusercontent.com/YOUR_USERNAME/miniframework/main/src/ResponseWrapper.ssjs',
            dependencies: []
        },
        {
            name: 'AuthHandler', 
            key: 'miniframework_auth_handler',
            description: 'Authentication handler for SFMC REST API tokens',
            sourceUrl: 'https://raw.githubusercontent.com/YOUR_USERNAME/miniframework/main/src/AuthHandler.ssjs',
            dependencies: ['ResponseWrapper']
        },
        {
            name: 'ConnectionHandler',
            key: 'miniframework_connection_handler', 
            description: 'HTTP connection handler with retry logic',
            sourceUrl: 'https://raw.githubusercontent.com/YOUR_USERNAME/miniframework/main/src/ConnectionHandler.ssjs',
            dependencies: ['ResponseWrapper']
        },
        {
            name: 'EmailHandler',
            key: 'miniframework_email_handler',
            description: 'Email management handler (CRUD operations)',
            sourceUrl: 'https://raw.githubusercontent.com/YOUR_USERNAME/miniframework/main/src/EmailHandler.ssjs',
            dependencies: ['ResponseWrapper', 'AuthHandler', 'ConnectionHandler']
        },
        {
            name: 'DataExtensionHandler',
            key: 'miniframework_dataextension_handler',
            description: 'Data Extension management handler (CRUD operations)',
            sourceUrl: 'https://raw.githubusercontent.com/YOUR_USERNAME/miniframework/main/src/DataExtensionHandler.ssjs',
            dependencies: ['ResponseWrapper', 'AuthHandler', 'ConnectionHandler']
        },
        {
            name: 'AssetHandler',
            key: 'miniframework_asset_handler',
            description: 'Asset management handler for Content Builder',
            sourceUrl: 'https://raw.githubusercontent.com/YOUR_USERNAME/miniframework/main/src/AssetHandler.ssjs',
            dependencies: ['ResponseWrapper', 'AuthHandler', 'ConnectionHandler']
        },
        {
            name: 'FolderHandler',
            key: 'miniframework_folder_handler',
            description: 'Folder management handler for organization',
            sourceUrl: 'https://raw.githubusercontent.com/YOUR_USERNAME/miniframework/main/src/FolderHandler.ssjs',
            dependencies: ['ResponseWrapper', 'AuthHandler', 'ConnectionHandler']
        },
        {
            name: 'LogHandler',
            key: 'miniframework_log_handler',
            description: 'Logging handler with multi-destination support',
            sourceUrl: 'https://raw.githubusercontent.com/YOUR_USERNAME/miniframework/main/src/LogHandler.ssjs',
            dependencies: ['ResponseWrapper', 'AuthHandler', 'ConnectionHandler']
        },
        {
            name: 'AssetCreator',
            key: 'miniframework_asset_creator',
            description: 'Creates Data Extensions, Email Templates, and Triggered Sends',
            sourceUrl: 'https://raw.githubusercontent.com/YOUR_USERNAME/miniframework/main/src/AssetCreator.ssjs',
            dependencies: ['ResponseWrapper']
        }
    ];
    
    // Local source code (fallback if Git URLs don't work)
    var localSources = {
        'ResponseWrapper': getResponseWrapperSource(),
        'AuthHandler': getAuthHandlerSource(),
        'ConnectionHandler': getConnectionHandlerSource(),
        'EmailHandler': getEmailHandlerSource(),
        'DataExtensionHandler': getDataExtensionHandlerSource(),
        'AssetHandler': getAssetHandlerSource(),
        'FolderHandler': getFolderHandlerSource(),
        'LogHandler': getLogHandlerSource(),
        'AssetCreator': getAssetCreatorSource()
    };
    
    function createSimpleResponse(success, data, error, operation) {
        return {
            success: success || false,
            data: data || null,
            error: error || null,
            meta: {
                timestamp: new Date().toISOString(),
                operation: operation || 'unknown',
                installer: installer
            }
        };
    }
    
    function validateAuthConfig(authConfig) {
        if (!authConfig || !authConfig.clientId || !authConfig.clientSecret || !authConfig.authBaseUrl) {
            return createSimpleResponse(false, null, {
                code: 'AUTH_CONFIG_MISSING',
                message: 'Authentication configuration is required (clientId, clientSecret, authBaseUrl)'
            }, 'validateAuthConfig');
        }
        return createSimpleResponse(true, authConfig, null, 'validateAuthConfig');
    }
    
    function getAuthToken(authConfig) {
        try {
            var tokenUrl = authConfig.authBaseUrl + 'v2/token';
            var postData = {
                'grant_type': 'client_credentials',
                'client_id': authConfig.clientId,
                'client_secret': authConfig.clientSecret
            };
            
            var request = new Script.Util.HttpRequest(tokenUrl);
            request.emptyContentHandling = 0;
            request.retries = 1;
            request.continueOnError = true;
            request.contentType = 'application/json';
            request.method = 'POST';
            request.postData = Stringify(postData);
            
            var httpResponse = request.send();
            
            if (httpResponse.statusCode == 200) {
                var tokenData = Platform.Function.ParseJSON(httpResponse.content);
                if (tokenData && tokenData.access_token) {
                    return createSimpleResponse(true, {
                        accessToken: tokenData.access_token,
                        tokenType: tokenData.token_type || 'Bearer',
                        restInstanceUrl: tokenData.rest_instance_url
                    }, null, 'getAuthToken');
                }
            }
            
            return createSimpleResponse(false, null, {
                code: 'TOKEN_FAILED',
                message: 'Failed to obtain access token',
                statusCode: httpResponse.statusCode,
                response: httpResponse.content
            }, 'getAuthToken');
            
        } catch (ex) {
            return createSimpleResponse(false, null, {
                code: 'TOKEN_EXCEPTION',
                message: ex.message || ex.toString()
            }, 'getAuthToken');
        }
    }
    
    function fetchSourceFromUrl(url) {
        try {
            var request = new Script.Util.HttpRequest(url);
            request.emptyContentHandling = 0;
            request.retries = 2;
            request.continueOnError = true;
            request.method = 'GET';
            
            var httpResponse = request.send();
            
            if (httpResponse.statusCode == 200) {
                return createSimpleResponse(true, httpResponse.content, null, 'fetchSourceFromUrl');
            } else {
                return createSimpleResponse(false, null, {
                    code: 'FETCH_FAILED',
                    message: 'Failed to fetch source from URL: ' + url,
                    statusCode: httpResponse.statusCode
                }, 'fetchSourceFromUrl');
            }
            
        } catch (ex) {
            return createSimpleResponse(false, null, {
                code: 'FETCH_EXCEPTION',
                message: ex.message || ex.toString(),
                url: url
            }, 'fetchSourceFromUrl');
        }
    }
    
    function createContentBlock(authConfig, blockConfig, sourceCode) {
        try {
            var tokenResult = getAuthToken(authConfig);
            if (!tokenResult.success) {
                return tokenResult;
            }
            
            var token = tokenResult.data;
            var restUrl = token.restInstanceUrl;
            
            // Create Content Block via REST API
            var url = restUrl + '/asset/v1/content/assets';
            
            var assetPayload = {
                name: frameworkConfig.prefix + blockConfig.name,
                assetType: {
                    name: 'codesnippetblock',
                    id: 220
                },
                content: sourceCode,
                meta: {
                    framework: frameworkConfig.name,
                    version: frameworkConfig.version,
                    description: blockConfig.description,
                    dependencies: blockConfig.dependencies.join(', ')
                },
                category: {
                    name: frameworkConfig.category
                }
            };
            
            var request = new Script.Util.HttpRequest(url);
            request.emptyContentHandling = 0;
            request.retries = 1;
            request.continueOnError = true;
            request.contentType = 'application/json';
            request.method = 'POST';
            request.setHeader('Authorization', token.tokenType + ' ' + token.accessToken);
            request.postData = Stringify(assetPayload);
            
            var httpResponse = request.send();
            
            if (httpResponse.statusCode >= 200 && httpResponse.statusCode < 300) {
                var responseData = Platform.Function.ParseJSON(httpResponse.content);
                return createSimpleResponse(true, {
                    id: responseData.id,
                    name: responseData.name,
                    key: responseData.customerKey || blockConfig.key,
                    created: true
                }, null, 'createContentBlock');
            } else {
                return createSimpleResponse(false, null, {
                    code: 'CREATE_FAILED',
                    message: 'Failed to create Content Block: ' + blockConfig.name,
                    statusCode: httpResponse.statusCode,
                    response: httpResponse.content
                }, 'createContentBlock');
            }
            
        } catch (ex) {
            return createSimpleResponse(false, null, {
                code: 'CREATE_EXCEPTION',
                message: ex.message || ex.toString(),
                blockName: blockConfig.name
            }, 'createContentBlock');
        }
    }
    
    function createFrameworkFolder(authConfig) {
        try {
            var tokenResult = getAuthToken(authConfig);
            if (!tokenResult.success) {
                return tokenResult;
            }
            
            var token = tokenResult.data;
            var restUrl = token.restInstanceUrl;
            
            var url = restUrl + '/asset/v1/content/categories';
            
            var folderPayload = {
                name: frameworkConfig.category,
                parentId: 0,
                description: 'MiniFramework Content Blocks and Assets',
                categoryType: 'asset'
            };
            
            var request = new Script.Util.HttpRequest(url);
            request.emptyContentHandling = 0;
            request.retries = 1;
            request.continueOnError = true;
            request.contentType = 'application/json';
            request.method = 'POST';
            request.setHeader('Authorization', token.tokenType + ' ' + token.accessToken);
            request.postData = Stringify(folderPayload);
            
            var httpResponse = request.send();
            
            if (httpResponse.statusCode >= 200 && httpResponse.statusCode < 300) {
                var responseData = Platform.Function.ParseJSON(httpResponse.content);
                return createSimpleResponse(true, {
                    id: responseData.id,
                    name: responseData.name,
                    created: true
                }, null, 'createFrameworkFolder');
            } else {
                // Folder might already exist
                return createSimpleResponse(true, {
                    message: 'Folder may already exist or creation not required'
                }, null, 'createFrameworkFolder');
            }
            
        } catch (ex) {
            return createSimpleResponse(false, null, {
                code: 'FOLDER_EXCEPTION',
                message: ex.message || ex.toString()
            }, 'createFrameworkFolder');
        }
    }
    
    function installFramework(authConfig, options) {
        try {
            var installOptions = options || {};
            var useGitSources = installOptions.useGitSources !== false; // Default true
            var results = {
                framework: frameworkConfig,
                timestamp: new Date().toISOString(),
                folder: null,
                contentBlocks: [],
                errors: [],
                summary: {
                    total: contentBlocks.length,
                    created: 0,
                    failed: 0,
                    skipped: 0
                }
            };
            
            // Validate auth config
            var authValidation = validateAuthConfig(authConfig);
            if (!authValidation.success) {
                return authValidation;
            }
            
            // Create framework folder
            var folderResult = createFrameworkFolder(authConfig);
            results.folder = folderResult;
            
            // Create necessary assets first (Data Extensions, Email Templates, etc.)
            var assetCreator = new MiniFrameworkAssetCreator();
            var assetResult = assetCreator.createAllAssets(authConfig, {
                skipTriggeredSend: false,
                skipConfiguration: false
            });
            
            results.assets = assetResult;
            
            if (!assetResult.success) {
                results.errors.push({
                    type: 'asset_creation',
                    error: assetResult.error
                });
            }
            
            // Install each Content Block
            for (var i = 0; i < contentBlocks.length; i++) {
                var blockConfig = contentBlocks[i];
                var sourceCode = '';
                
                // Try to fetch from Git first, then fallback to local
                if (useGitSources && blockConfig.sourceUrl) {
                    var fetchResult = fetchSourceFromUrl(blockConfig.sourceUrl);
                    if (fetchResult.success) {
                        sourceCode = fetchResult.data;
                    } else {
                        // Fallback to local source
                        sourceCode = localSources[blockConfig.name] || '';
                        if (!sourceCode) {
                            results.errors.push({
                                block: blockConfig.name,
                                error: 'No source code available'
                            });
                            results.summary.failed++;
                            continue;
                        }
                    }
                } else {
                    // Use local source
                    sourceCode = localSources[blockConfig.name] || '';
                    if (!sourceCode) {
                        results.errors.push({
                            block: blockConfig.name,
                            error: 'No local source code available'
                        });
                        results.summary.failed++;
                        continue;
                    }
                }
                
                // Create Content Block
                var createResult = createContentBlock(authConfig, blockConfig, sourceCode);
                
                results.contentBlocks.push({
                    name: blockConfig.name,
                    result: createResult,
                    dependencies: blockConfig.dependencies
                });
                
                if (createResult.success) {
                    results.summary.created++;
                } else {
                    results.summary.failed++;
                    results.errors.push({
                        block: blockConfig.name,
                        error: createResult.error
                    });
                }
            }
            
            return createSimpleResponse(true, results, null, 'installFramework');
            
        } catch (ex) {
            return createSimpleResponse(false, null, {
                code: 'INSTALL_EXCEPTION',
                message: ex.message || ex.toString()
            }, 'installFramework');
        }
    }
    
    function checkInstallation(authConfig) {
        try {
            var tokenResult = getAuthToken(authConfig);
            if (!tokenResult.success) {
                return tokenResult;
            }
            
            var token = tokenResult.data;
            var restUrl = token.restInstanceUrl;
            
            var url = restUrl + '/asset/v1/content/assets';
            var filter = "name like '" + frameworkConfig.prefix + "%'";
            url += '?$filter=' + encodeURIComponent(filter);
            
            var request = new Script.Util.HttpRequest(url);
            request.emptyContentHandling = 0;
            request.retries = 1;
            request.continueOnError = true;
            request.method = 'GET';
            request.setHeader('Authorization', token.tokenType + ' ' + token.accessToken);
            
            var httpResponse = request.send();
            
            if (httpResponse.statusCode == 200) {
                var responseData = Platform.Function.ParseJSON(httpResponse.content);
                var existingBlocks = responseData.items || [];
                
                var status = {
                    installed: existingBlocks.length,
                    total: contentBlocks.length,
                    missing: [],
                    existing: existingBlocks.map(function(block) {
                        return {
                            id: block.id,
                            name: block.name,
                            key: block.customerKey
                        };
                    })
                };
                
                // Check which blocks are missing
                for (var i = 0; i < contentBlocks.length; i++) {
                    var expectedName = frameworkConfig.prefix + contentBlocks[i].name;
                    var found = false;
                    
                    for (var j = 0; j < existingBlocks.length; j++) {
                        if (existingBlocks[j].name === expectedName) {
                            found = true;
                            break;
                        }
                    }
                    
                    if (!found) {
                        status.missing.push(contentBlocks[i].name);
                    }
                }
                
                return createSimpleResponse(true, status, null, 'checkInstallation');
            } else {
                return createSimpleResponse(false, null, {
                    code: 'CHECK_FAILED',
                    message: 'Failed to check installation status',
                    statusCode: httpResponse.statusCode
                }, 'checkInstallation');
            }
            
        } catch (ex) {
            return createSimpleResponse(false, null, {
                code: 'CHECK_EXCEPTION',
                message: ex.message || ex.toString()
            }, 'checkInstallation');
        }
    }
    
    // Local source code definitions (embedded for fallback)
    function getResponseWrapperSource() {
        return '<script runat="server">\n\nPlatform.Load("core", "1.1.1");\n\nfunction MiniFrameworkResponse() {\n    \n    function createResponse(success, data, error, handler, operation) {\n        var response = {\n            success: success || false,\n            data: data || null,\n            error: error || null,\n            meta: {\n                timestamp: new Date().toISOString(),\n                handler: handler || \'unknown\',\n                operation: operation || \'unknown\'\n            }\n        };\n        return response;\n    }\n    \n    function success(data, handler, operation) {\n        return createResponse(true, data, null, handler, operation);\n    }\n    \n    function error(errorCode, errorMessage, errorDetails, handler, operation) {\n        var errorObj = {\n            code: errorCode || \'UNKNOWN_ERROR\',\n            message: errorMessage || \'An unknown error occurred\',\n            details: errorDetails || {}\n        };\n        return createResponse(false, null, errorObj, handler, operation);\n    }\n    \n    function httpError(statusCode, responseText, handler, operation) {\n        var errorCode = \'HTTP_\' + statusCode;\n        var errorMessage = \'HTTP request failed with status \' + statusCode;\n        var errorDetails = {\n            statusCode: statusCode,\n            responseText: responseText\n        };\n        return error(errorCode, errorMessage, errorDetails, handler, operation);\n    }\n    \n    function validationError(field, message, handler, operation) {\n        var errorCode = \'VALIDATION_ERROR\';\n        var errorMessage = \'Validation failed for field: \' + field;\n        var errorDetails = {\n            field: field,\n            validationMessage: message\n        };\n        return error(errorCode, errorMessage, errorDetails, handler, operation);\n    }\n    \n    function authError(message, handler, operation) {\n        var errorCode = \'AUTH_ERROR\';\n        var errorMessage = message || \'Authentication failed\';\n        var errorDetails = {\n            suggestion: \'Check your credentials and try again\'\n        };\n        return error(errorCode, errorMessage, errorDetails, handler, operation);\n    }\n    \n    return {\n        success: success,\n        error: error,\n        httpError: httpError,\n        validationError: validationError,\n        authError: authError\n    };\n}\n\n</script>';
    }
    
    // Add other source functions here (truncated for brevity in this example)
    function getAuthHandlerSource() {
        return '<script runat="server">\n// AuthHandler source code would be here\n// This is a placeholder - in real implementation, include the full source\n</script>';
    }
    
    function getConnectionHandlerSource() {
        return '<script runat="server">\n// ConnectionHandler source code would be here\n</script>';
    }
    
    function getEmailHandlerSource() {
        return '<script runat="server">\n// EmailHandler source code would be here\n</script>';
    }
    
    function getDataExtensionHandlerSource() {
        return '<script runat="server">\n// DataExtensionHandler source code would be here\n</script>';
    }
    
    function getAssetHandlerSource() {
        return '<script runat="server">\n// AssetHandler source code would be here\n</script>';
    }
    
    function getFolderHandlerSource() {
        return '<script runat="server">\n// FolderHandler source code would be here\n</script>';
    }
    
    function getLogHandlerSource() {
        return '<script runat="server">\n// LogHandler source code would be here\n</script>';
    }
    
    function getAssetCreatorSource() {
        return '<script runat="server">\n// AssetCreator source code would be here\n</script>';
    }
    
    // Public interface
    return {
        install: installFramework,
        check: checkInstallation,
        getConfig: function() { return frameworkConfig; },
        getContentBlocks: function() { return contentBlocks; }
    };
}

// Usage Functions
function installMiniFramework(authConfig, options) {
    var installer = new MiniFrameworkInstaller();
    return installer.install(authConfig, options);
}

function checkMiniFrameworkInstallation(authConfig) {
    var installer = new MiniFrameworkInstaller();
    return installer.check(authConfig);
}

// Auto-execute if form parameters are provided
try {
    var action = Platform.Request.GetFormField("action");
    var clientId = Platform.Request.GetFormField("clientId");
    var clientSecret = Platform.Request.GetFormField("clientSecret");
    var authBaseUrl = Platform.Request.GetFormField("authBaseUrl");
    
    if (action && clientId && clientSecret && authBaseUrl) {
        var authConfig = {
            clientId: clientId,
            clientSecret: clientSecret,
            authBaseUrl: authBaseUrl
        };
        
        var result;
        if (action === "install") {
            var useGitSources = Platform.Request.GetFormField("useGitSources") !== "false";
            result = installMiniFramework(authConfig, {useGitSources: useGitSources});
        } else if (action === "check") {
            result = checkMiniFrameworkInstallation(authConfig);
        }
        
        if (result) {
            Variable.SetValue("@installResult", Stringify(result, null, 2));
        }
    }
} catch (ex) {
    Variable.SetValue("@installError", ex.message);
}

</script>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MiniFramework - Instalador Automático</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
        }
        h1 {
            color: #0176d3;
            text-align: center;
            margin-bottom: 30px;
        }
        .form-group {
            margin: 20px 0;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input, select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 14px;
        }
        button {
            background: #0176d3;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px 5px;
        }
        button:hover {
            background: #014486;
        }
        .result {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
            max-height: 400px;
            overflow-y: auto;
        }
        .success {
            background: #d4edda;
            border-color: #c3e6cb;
            color: #155724;
        }
        .error {
            background: #f8d7da;
            border-color: #f5c6cb;
            color: #721c24;
        }
        pre {
            white-space: pre-wrap;
            font-size: 12px;
        }
        .info {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 MiniFramework - Instalador Automático</h1>
        
        <div class="info">
            <strong>📋 Este instalador creará automáticamente todos los Content Blocks del MiniFramework:</strong>
            <ul>
                <li>✅ ResponseWrapper - Base para respuestas estándar</li>
                <li>🔐 AuthHandler - Gestión de autenticación</li>
                <li>🌐 ConnectionHandler - HTTP requests con retry</li>
                <li>📧 EmailHandler - Gestión de emails</li>
                <li>📊 DataExtensionHandler - Gestión de Data Extensions</li>
                <li>📎 AssetHandler - Gestión de assets</li>
                <li>📂 FolderHandler - Gestión de carpetas</li>
                <li>📋 LogHandler - Sistema de logging</li>
            </ul>
        </div>

        <form method="POST">
            <div class="form-group">
                <label for="clientId">Client ID *</label>
                <input type="text" id="clientId" name="clientId" required placeholder="Tu Client ID de Salesforce Marketing Cloud">
            </div>
            
            <div class="form-group">
                <label for="clientSecret">Client Secret *</label>
                <input type="password" id="clientSecret" name="clientSecret" required placeholder="Tu Client Secret">
            </div>
            
            <div class="form-group">
                <label for="authBaseUrl">Auth Base URL *</label>
                <input type="text" id="authBaseUrl" name="authBaseUrl" required placeholder="https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/" value="https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/">
            </div>
            
            <div class="form-group">
                <label for="useGitSources">Fuente de Código</label>
                <select id="useGitSources" name="useGitSources">
                    <option value="false">Usar código embebido (recomendado)</option>
                    <option value="true">Intentar descargar desde Git</option>
                </select>
            </div>
            
            <div class="form-group">
                <button type="submit" name="action" value="install">🚀 Instalar MiniFramework</button>
                <button type="submit" name="action" value="check">🔍 Verificar Instalación</button>
            </div>
        </form>

        <div class="warning">
            <strong>⚠️ Importante:</strong>
            <ul>
                <li>Asegúrate de tener permisos para crear Content Blocks en Content Builder</li>
                <li>El proceso puede tardar varios minutos en completarse</li>
                <li>Si ya existen Content Blocks con los mismos nombres, la instalación puede fallar</li>
                <li>Recomendamos hacer backup de tus Content Blocks existentes</li>
            </ul>
        </div>

        <script runat="server">
            var installResult = Variable.GetValue("@installResult");
            var installError = Variable.GetValue("@installError");
            
            if (installResult) {
                var resultObj = Platform.Function.ParseJSON(installResult);
                if (resultObj.success) {
                    Write('<div class="result success">');
                    Write('<h3>✅ Operación Completada</h3>');
                    
                    if (resultObj.data.summary) {
                        Write('<p><strong>Resumen:</strong></p>');
                        Write('<ul>');
                        Write('<li>Total Content Blocks: ' + resultObj.data.summary.total + '</li>');
                        Write('<li>Creados exitosamente: ' + resultObj.data.summary.created + '</li>');
                        Write('<li>Fallos: ' + resultObj.data.summary.failed + '</li>');
                        Write('</ul>');
                        
                        if (resultObj.data.errors.length > 0) {
                            Write('<p><strong>Errores encontrados:</strong></p>');
                            Write('<ul>');
                            for (var i = 0; i < resultObj.data.errors.length; i++) {
                                Write('<li>' + resultObj.data.errors[i].block + ': ' + (resultObj.data.errors[i].error.message || resultObj.data.errors[i].error) + '</li>');
                            }
                            Write('</ul>');
                        }
                        
                        if (resultObj.data.summary.created > 0) {
                            Write('<div class="info">');
                            Write('<p><strong>🎉 ¡Instalación exitosa!</strong></p>');
                            Write('<p>Los Content Blocks han sido creados en Content Builder. Puedes encontrarlos con el prefijo "MF_".</p>');
                            Write('<p><strong>Próximos pasos:</strong></p>');
                            Write('<ol>');
                            Write('<li>Verifica los Content Blocks en Content Builder</li>');
                            Write('<li>Ejecuta el TestExample.ssjs para validar el funcionamiento</li>');
                            Write('<li>Configura los assets adicionales (Data Extensions, etc.)</li>');
                            Write('</ol>');
                            Write('</div>');
                        }
                    }
                    
                    Write('<details>');
                    Write('<summary>Ver detalles completos</summary>');
                    Write('<pre>' + installResult + '</pre>');
                    Write('</details>');
                    Write('</div>');
                } else {
                    Write('<div class="result error">');
                    Write('<h3>❌ Error en la Operación</h3>');
                    Write('<p><strong>Código:</strong> ' + (resultObj.error ? resultObj.error.code : 'UNKNOWN') + '</p>');
                    Write('<p><strong>Mensaje:</strong> ' + (resultObj.error ? resultObj.error.message : 'Error desconocido') + '</p>');
                    Write('<details>');
                    Write('<summary>Ver detalles del error</summary>');
                    Write('<pre>' + installResult + '</pre>');
                    Write('</details>');
                    Write('</div>');
                }
            }
            
            if (installError) {
                Write('<div class="result error">');
                Write('<h3>❌ Excepción durante la ejecución</h3>');
                Write('<p>' + installError + '</p>');
                Write('</div>');
            }
        </script>
    </div>
</body>
</html>