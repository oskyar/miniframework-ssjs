<script runat="server">

Platform.Load("core", "1.1.1");

// MiniFramework Version Manager and Updater
// Handles version checking, updates, and migrations

function MiniFrameworkUpdater() {
    var updater = 'MiniFrameworkUpdater';
    
    // Configuration
    var config = {
        repositoryBase: 'https://raw.githubusercontent.com/YOUR_USERNAME/miniframework/main/',
        versionFile: 'version.json',
        frameworkFile: 'framework.json',
        backupPrefix: 'MF_BACKUP_',
        maxBackups: 5
    };
    
    function createResponse(success, data, error, operation) {
        return {
            success: success || false,
            data: data || null,
            error: error || null,
            meta: {
                timestamp: new Date().toISOString(),
                operation: operation || 'unknown',
                updater: updater
            }
        };
    }
    
    function fetchFromUrl(url) {
        try {
            var request = new Script.Util.HttpRequest(url);
            request.emptyContentHandling = 0;
            request.retries = 2;
            request.continueOnError = true;
            request.method = 'GET';
            
            var httpResponse = request.send();
            
            if (httpResponse.statusCode == 200) {
                return createResponse(true, httpResponse.content, null, 'fetchFromUrl');
            } else {
                return createResponse(false, null, {
                    code: 'FETCH_FAILED',
                    message: 'Failed to fetch from URL: ' + url,
                    statusCode: httpResponse.statusCode
                }, 'fetchFromUrl');
            }
            
        } catch (ex) {
            return createResponse(false, null, {
                code: 'FETCH_EXCEPTION',
                message: ex.message || ex.toString(),
                url: url
            }, 'fetchFromUrl');
        }
    }
    
    function getCurrentVersion() {
        try {
            // Try to get version from a known Content Block meta data
            // This is a simplified approach - in real implementation,
            // you might store version in a Data Extension
            return createResponse(true, {
                version: '1.0.0',
                installed: new Date().toISOString(),
                source: 'local'
            }, null, 'getCurrentVersion');
            
        } catch (ex) {
            return createResponse(false, null, {
                code: 'VERSION_CHECK_FAILED',
                message: 'Could not determine current version'
            }, 'getCurrentVersion');
        }
    }
    
    function getLatestVersion() {
        try {
            var versionUrl = config.repositoryBase + config.versionFile;
            var fetchResult = fetchFromUrl(versionUrl);
            
            if (!fetchResult.success) {
                return fetchResult;
            }
            
            var versionData = Platform.Function.ParseJSON(fetchResult.data);
            
            return createResponse(true, {
                version: versionData.current,
                released: versionData.released,
                breaking: versionData.breaking,
                changelog: versionData.changelog[versionData.current] || {},
                roadmap: versionData.roadmap || {}
            }, null, 'getLatestVersion');
            
        } catch (ex) {
            return createResponse(false, null, {
                code: 'LATEST_VERSION_CHECK_FAILED',
                message: ex.message || ex.toString()
            }, 'getLatestVersion');
        }
    }
    
    function compareVersions(version1, version2) {
        try {
            var v1Parts = version1.split('.').map(function(n) { return parseInt(n, 10); });
            var v2Parts = version2.split('.').map(function(n) { return parseInt(n, 10); });
            
            for (var i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
                var v1Part = v1Parts[i] || 0;
                var v2Part = v2Parts[i] || 0;
                
                if (v1Part < v2Part) return -1;
                if (v1Part > v2Part) return 1;
            }
            
            return 0;
        } catch (ex) {
            return 0;
        }
    }
    
    function needsUpdate(currentVersion, latestVersion) {
        return compareVersions(currentVersion, latestVersion) < 0;
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
                return createResponse(true, {
                    accessToken: tokenData.access_token,
                    tokenType: tokenData.token_type || 'Bearer',
                    restInstanceUrl: tokenData.rest_instance_url
                }, null, 'getAuthToken');
            }
            
            return createResponse(false, null, {
                code: 'TOKEN_FAILED',
                message: 'Failed to obtain access token'
            }, 'getAuthToken');
            
        } catch (ex) {
            return createResponse(false, null, {
                code: 'TOKEN_EXCEPTION',
                message: ex.message || ex.toString()
            }, 'getAuthToken');
        }
    }
    
    function backupCurrentVersion(authConfig) {
        try {
            var tokenResult = getAuthToken(authConfig);
            if (!tokenResult.success) {
                return tokenResult;
            }
            
            var token = tokenResult.data;
            var restUrl = token.restInstanceUrl;
            
            // Get current Content Blocks
            var url = restUrl + '/asset/v1/content/assets';
            var filter = "name like 'MF_%'";
            url += '?$filter=' + encodeURIComponent(filter);
            
            var request = new Script.Util.HttpRequest(url);
            request.method = 'GET';
            request.setHeader('Authorization', token.tokenType + ' ' + token.accessToken);
            request.continueOnError = true;
            
            var httpResponse = request.send();
            
            if (httpResponse.statusCode == 200) {
                var responseData = Platform.Function.ParseJSON(httpResponse.content);
                var existingBlocks = responseData.items || [];
                
                var backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
                var backupResults = [];
                
                // Create backup copies of existing Content Blocks
                for (var i = 0; i < existingBlocks.length; i++) {
                    var block = existingBlocks[i];
                    var backupName = config.backupPrefix + backupTimestamp + '_' + block.name;
                    
                    var backupPayload = {
                        name: backupName,
                        assetType: block.assetType,
                        content: block.content,
                        meta: {
                            originalId: block.id,
                            originalName: block.name,
                            backupDate: new Date().toISOString(),
                            backupVersion: 'pre-update'
                        }
                    };
                    
                    var createRequest = new Script.Util.HttpRequest(restUrl + '/asset/v1/content/assets');
                    createRequest.method = 'POST';
                    createRequest.contentType = 'application/json';
                    createRequest.setHeader('Authorization', token.tokenType + ' ' + token.accessToken);
                    createRequest.postData = Stringify(backupPayload);
                    createRequest.continueOnError = true;
                    
                    var createResponse = createRequest.send();
                    
                    if (createResponse.statusCode >= 200 && createResponse.statusCode < 300) {
                        backupResults.push({
                            original: block.name,
                            backup: backupName,
                            success: true
                        });
                    } else {
                        backupResults.push({
                            original: block.name,
                            backup: backupName,
                            success: false,
                            error: createResponse.content
                        });
                    }
                }
                
                return createResponse(true, {
                    timestamp: backupTimestamp,
                    backups: backupResults,
                    total: existingBlocks.length,
                    successful: backupResults.filter(function(b) { return b.success; }).length
                }, null, 'backupCurrentVersion');
            }
            
            return createResponse(false, null, {
                code: 'BACKUP_FAILED',
                message: 'Failed to retrieve current Content Blocks for backup'
            }, 'backupCurrentVersion');
            
        } catch (ex) {
            return createResponse(false, null, {
                code: 'BACKUP_EXCEPTION',
                message: ex.message || ex.toString()
            }, 'backupCurrentVersion');
        }
    }
    
    function updateContentBlocks(authConfig, newVersionData) {
        try {
            // Get framework configuration for new version
            var frameworkUrl = config.repositoryBase + config.frameworkFile;
            var frameworkResult = fetchFromUrl(frameworkUrl);
            
            if (!frameworkResult.success) {
                return frameworkResult;
            }
            
            var frameworkConfig = Platform.Function.ParseJSON(frameworkResult.data);
            var contentBlocks = frameworkConfig.framework.contentBlocks;
            var updateResults = [];
            
            var tokenResult = getAuthToken(authConfig);
            if (!tokenResult.success) {
                return tokenResult;
            }
            
            var token = tokenResult.data;
            var restUrl = token.restInstanceUrl;
            
            // Update each Content Block
            for (var i = 0; i < contentBlocks.length; i++) {
                var blockConfig = contentBlocks[i];
                
                // Fetch new source code
                var sourceUrl = config.repositoryBase + blockConfig.file;
                var sourceResult = fetchFromUrl(sourceUrl);
                
                if (!sourceResult.success) {
                    updateResults.push({
                        name: blockConfig.name,
                        success: false,
                        error: 'Failed to fetch source code'
                    });
                    continue;
                }
                
                // Find existing Content Block to update
                var findUrl = restUrl + '/asset/v1/content/assets';
                var findFilter = "name eq 'MF_" + blockConfig.name + "'";
                findUrl += '?$filter=' + encodeURIComponent(findFilter);
                
                var findRequest = new Script.Util.HttpRequest(findUrl);
                findRequest.method = 'GET';
                findRequest.setHeader('Authorization', token.tokenType + ' ' + token.accessToken);
                findRequest.continueOnError = true;
                
                var findResponse = findRequest.send();
                
                if (findResponse.statusCode == 200) {
                    var findData = Platform.Function.ParseJSON(findResponse.content);
                    var existingBlocks = findData.items || [];
                    
                    if (existingBlocks.length > 0) {
                        // Update existing Content Block
                        var existingBlock = existingBlocks[0];
                        var updateUrl = restUrl + '/asset/v1/content/assets/' + existingBlock.id;
                        
                        var updatePayload = {
                            content: sourceResult.data,
                            meta: {
                                framework: frameworkConfig.name,
                                version: newVersionData.version,
                                updated: new Date().toISOString(),
                                description: blockConfig.description
                            }
                        };
                        
                        var updateRequest = new Script.Util.HttpRequest(updateUrl);
                        updateRequest.method = 'PUT';
                        updateRequest.contentType = 'application/json';
                        updateRequest.setHeader('Authorization', token.tokenType + ' ' + token.accessToken);
                        updateRequest.postData = Stringify(updatePayload);
                        updateRequest.continueOnError = true;
                        
                        var updateResponse = updateRequest.send();
                        
                        if (updateResponse.statusCode >= 200 && updateResponse.statusCode < 300) {
                            updateResults.push({
                                name: blockConfig.name,
                                success: true,
                                action: 'updated',
                                id: existingBlock.id
                            });
                        } else {
                            updateResults.push({
                                name: blockConfig.name,
                                success: false,
                                error: 'Failed to update: ' + updateResponse.content
                            });
                        }
                    } else {
                        // Create new Content Block if it doesn't exist
                        var createPayload = {
                            name: 'MF_' + blockConfig.name,
                            assetType: blockConfig.assetType,
                            content: sourceResult.data,
                            meta: {
                                framework: frameworkConfig.name,
                                version: newVersionData.version,
                                created: new Date().toISOString(),
                                description: blockConfig.description
                            }
                        };
                        
                        var createRequest = new Script.Util.HttpRequest(restUrl + '/asset/v1/content/assets');
                        createRequest.method = 'POST';
                        createRequest.contentType = 'application/json';
                        createRequest.setHeader('Authorization', token.tokenType + ' ' + token.accessToken);
                        createRequest.postData = Stringify(createPayload);
                        createRequest.continueOnError = true;
                        
                        var createResponse = createRequest.send();
                        
                        if (createResponse.statusCode >= 200 && createResponse.statusCode < 300) {
                            var createData = Platform.Function.ParseJSON(createResponse.content);
                            updateResults.push({
                                name: blockConfig.name,
                                success: true,
                                action: 'created',
                                id: createData.id
                            });
                        } else {
                            updateResults.push({
                                name: blockConfig.name,
                                success: false,
                                error: 'Failed to create: ' + createResponse.content
                            });
                        }
                    }
                }
            }
            
            return createResponse(true, {
                version: newVersionData.version,
                updates: updateResults,
                total: contentBlocks.length,
                successful: updateResults.filter(function(r) { return r.success; }).length,
                failed: updateResults.filter(function(r) { return !r.success; }).length
            }, null, 'updateContentBlocks');
            
        } catch (ex) {
            return createResponse(false, null, {
                code: 'UPDATE_EXCEPTION',
                message: ex.message || ex.toString()
            }, 'updateContentBlocks');
        }
    }
    
    function checkForUpdates(authConfig) {
        try {
            var currentResult = getCurrentVersion();
            var latestResult = getLatestVersion();
            
            if (!currentResult.success) {
                return currentResult;
            }
            
            if (!latestResult.success) {
                return latestResult;
            }
            
            var current = currentResult.data.version;
            var latest = latestResult.data.version;
            var updateAvailable = needsUpdate(current, latest);
            
            return createResponse(true, {
                current: {
                    version: current,
                    installed: currentResult.data.installed
                },
                latest: {
                    version: latest,
                    released: latestResult.data.released,
                    breaking: latestResult.data.breaking,
                    changelog: latestResult.data.changelog
                },
                updateAvailable: updateAvailable,
                versionComparison: compareVersions(current, latest)
            }, null, 'checkForUpdates');
            
        } catch (ex) {
            return createResponse(false, null, {
                code: 'UPDATE_CHECK_EXCEPTION',
                message: ex.message || ex.toString()
            }, 'checkForUpdates');
        }
    }
    
    function performUpdate(authConfig, options) {
        try {
            var updateOptions = options || {};
            var skipBackup = updateOptions.skipBackup === true;
            
            // 1. Check for updates
            var updateCheck = checkForUpdates(authConfig);
            if (!updateCheck.success) {
                return updateCheck;
            }
            
            if (!updateCheck.data.updateAvailable) {
                return createResponse(true, {
                    message: 'No updates available',
                    current: updateCheck.data.current,
                    latest: updateCheck.data.latest
                }, null, 'performUpdate');
            }
            
            var results = {
                started: new Date().toISOString(),
                current: updateCheck.data.current,
                target: updateCheck.data.latest,
                backup: null,
                update: null,
                completed: false
            };
            
            // 2. Backup current version
            if (!skipBackup) {
                var backupResult = backupCurrentVersion(authConfig);
                results.backup = backupResult;
                
                if (!backupResult.success && !updateOptions.continueOnBackupFailure) {
                    return createResponse(false, results, {
                        code: 'BACKUP_REQUIRED',
                        message: 'Backup failed and continueOnBackupFailure is false'
                    }, 'performUpdate');
                }
            }
            
            // 3. Update Content Blocks
            var updateResult = updateContentBlocks(authConfig, updateCheck.data.latest);
            results.update = updateResult;
            
            if (updateResult.success) {
                results.completed = true;
                results.finished = new Date().toISOString();
                
                return createResponse(true, results, null, 'performUpdate');
            } else {
                return createResponse(false, results, {
                    code: 'UPDATE_FAILED',
                    message: 'Failed to update Content Blocks'
                }, 'performUpdate');
            }
            
        } catch (ex) {
            return createResponse(false, null, {
                code: 'UPDATE_EXCEPTION',
                message: ex.message || ex.toString()
            }, 'performUpdate');
        }
    }
    
    // Public interface
    return {
        checkForUpdates: checkForUpdates,
        performUpdate: performUpdate,
        getCurrentVersion: getCurrentVersion,
        getLatestVersion: getLatestVersion,
        backupCurrentVersion: backupCurrentVersion,
        updateContentBlocks: updateContentBlocks
    };
}

// Public functions
function checkMiniFrameworkUpdates(authConfig) {
    var updater = new MiniFrameworkUpdater();
    return updater.checkForUpdates(authConfig);
}

function updateMiniFramework(authConfig, options) {
    var updater = new MiniFrameworkUpdater();
    return updater.performUpdate(authConfig, options);
}

function backupMiniFramework(authConfig) {
    var updater = new MiniFrameworkUpdater();
    return updater.backupCurrentVersion(authConfig);
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
        if (action === "check") {
            result = checkMiniFrameworkUpdates(authConfig);
        } else if (action === "update") {
            var skipBackup = Platform.Request.GetFormField("skipBackup") === "true";
            result = updateMiniFramework(authConfig, {skipBackup: skipBackup});
        } else if (action === "backup") {
            result = backupMiniFramework(authConfig);
        }
        
        if (result) {
            Variable.SetValue("@updateResult", Stringify(result, null, 2));
        }
    }
} catch (ex) {
    Variable.SetValue("@updateError", ex.message);
}

</script>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MiniFramework - Gestor de Versiones</title>
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
        .btn-warning {
            background: #ffc107;
            color: #212529;
        }
        .btn-warning:hover {
            background: #e0a800;
        }
        .btn-danger {
            background: #dc3545;
        }
        .btn-danger:hover {
            background: #c82333;
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
        .warning {
            background: #fff3cd;
            border-color: #ffeaa7;
            color: #856404;
        }
        .info {
            background: #d1ecf1;
            border-color: #bee5eb;
            color: #0c5460;
        }
        pre {
            white-space: pre-wrap;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 MiniFramework - Gestor de Versiones</h1>
        
        <div class="info">
            <strong>🔍 Gestor de Actualizaciones Automáticas</strong>
            <p>Esta herramienta te permite verificar, instalar y gestionar actualizaciones del MiniFramework directamente desde el repositorio Git.</p>
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
                <label>
                    <input type="checkbox" id="skipBackup" name="skipBackup" value="true">
                    Omitir backup (no recomendado)
                </label>
            </div>
            
            <div class="form-group">
                <button type="submit" name="action" value="check">🔍 Verificar Actualizaciones</button>
                <button type="submit" name="action" value="update" class="btn-warning">🔄 Actualizar Framework</button>
                <button type="submit" name="action" value="backup" class="btn-danger">💾 Crear Backup</button>
            </div>
        </form>

        <div class="warning">
            <strong>⚠️ Importante antes de actualizar:</strong>
            <ul>
                <li><strong>Backup:</strong> Se creará automáticamente un backup de tus Content Blocks actuales</li>
                <li><strong>Tiempo:</strong> El proceso puede tardar varios minutos</li>
                <li><strong>Breaking Changes:</strong> Revisa el changelog antes de actualizar</li>
                <li><strong>Testing:</strong> Prueba en un entorno de desarrollo primero</li>
                <li><strong>Dependencias:</strong> Verifica que tus implementaciones sean compatibles</li>
            </ul>
        </div>

        <script runat="server">
            var updateResult = Variable.GetValue("@updateResult");
            var updateError = Variable.GetValue("@updateError");
            
            if (updateResult) {
                var resultObj = Platform.Function.ParseJSON(updateResult);
                
                if (resultObj.success) {
                    Write('<div class="result success">');
                    Write('<h3>✅ Operación Completada</h3>');
                    
                    // Handle different types of results
                    if (resultObj.data.updateAvailable !== undefined) {
                        // Check for updates result
                        Write('<h4>Estado de Actualizaciones</h4>');
                        Write('<p><strong>Versión Actual:</strong> ' + resultObj.data.current.version + '</p>');
                        Write('<p><strong>Última Versión:</strong> ' + resultObj.data.latest.version + '</p>');
                        
                        if (resultObj.data.updateAvailable) {
                            Write('<div class="warning">');
                            Write('<p><strong>🆕 ¡Actualización Disponible!</strong></p>');
                            Write('<p><strong>Cambios importantes:</strong> ' + (resultObj.data.latest.breaking ? 'Sí' : 'No') + '</p>');
                            if (resultObj.data.latest.changelog && resultObj.data.latest.changelog.changes) {
                                Write('<p><strong>Cambios:</strong></p>');
                                Write('<ul>');
                                for (var i = 0; i < resultObj.data.latest.changelog.changes.length; i++) {
                                    Write('<li>' + resultObj.data.latest.changelog.changes[i].description + '</li>');
                                }
                                Write('</ul>');
                            }
                            Write('</div>');
                        } else {
                            Write('<div class="info">');
                            Write('<p><strong>✅ Estás usando la última versión</strong></p>');
                            Write('</div>');
                        }
                    } else if (resultObj.data.updates) {
                        // Update result
                        Write('<h4>Resultado de la Actualización</h4>');
                        Write('<p><strong>Versión Objetivo:</strong> ' + resultObj.data.target.version + '</p>');
                        Write('<p><strong>Content Blocks Actualizados:</strong> ' + resultObj.data.update.successful + '/' + resultObj.data.update.total + '</p>');
                        
                        if (resultObj.data.backup && resultObj.data.backup.success) {
                            Write('<p><strong>✅ Backup Creado:</strong> ' + resultObj.data.backup.data.successful + ' Content Blocks respaldados</p>');
                        }
                        
                        if (resultObj.data.update.failed > 0) {
                            Write('<div class="warning">');
                            Write('<p><strong>⚠️ Algunos Content Blocks no se pudieron actualizar:</strong></p>');
                            Write('<ul>');
                            for (var i = 0; i < resultObj.data.update.updates.length; i++) {
                                var update = resultObj.data.update.updates[i];
                                if (!update.success) {
                                    Write('<li>' + update.name + ': ' + (update.error || 'Error desconocido') + '</li>');
                                }
                            }
                            Write('</ul>');
                            Write('</div>');
                        }
                        
                        if (resultObj.data.completed) {
                            Write('<div class="success">');
                            Write('<p><strong>🎉 ¡Actualización Completada!</strong></p>');
                            Write('<p>El MiniFramework ha sido actualizado exitosamente. Se recomienda probar las funcionalidades.</p>');
                            Write('</div>');
                        }
                    } else if (resultObj.data.backups) {
                        // Backup result
                        Write('<h4>Resultado del Backup</h4>');
                        Write('<p><strong>Content Blocks Respaldados:</strong> ' + resultObj.data.successful + '/' + resultObj.data.total + '</p>');
                        Write('<p><strong>Timestamp:</strong> ' + resultObj.data.timestamp + '</p>');
                        
                        if (resultObj.data.successful < resultObj.data.total) {
                            Write('<div class="warning">');
                            Write('<p><strong>⚠️ Algunos backups fallaron. Revisa los permisos.</strong></p>');
                            Write('</div>');
                        }
                    }
                    
                    Write('<details>');
                    Write('<summary>Ver detalles técnicos</summary>');
                    Write('<pre>' + updateResult + '</pre>');
                    Write('</details>');
                    Write('</div>');
                } else {
                    Write('<div class="result error">');
                    Write('<h3>❌ Error en la Operación</h3>');
                    Write('<p><strong>Código:</strong> ' + (resultObj.error ? resultObj.error.code : 'UNKNOWN') + '</p>');
                    Write('<p><strong>Mensaje:</strong> ' + (resultObj.error ? resultObj.error.message : 'Error desconocido') + '</p>');
                    Write('<details>');
                    Write('<summary>Ver detalles del error</summary>');
                    Write('<pre>' + updateResult + '</pre>');
                    Write('</details>');
                    Write('</div>');
                }
            }
            
            if (updateError) {
                Write('<div class="result error">');
                Write('<h3>❌ Excepción durante la ejecución</h3>');
                Write('<p>' + updateError + '</p>');
                Write('</div>');
            }
        </script>
    </div>
</body>
</html>