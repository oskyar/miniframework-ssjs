<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * ═══════════════════════════════════════════════════════════════
 * OMEGAFRAMEWORK INSTALLATION LOGIC v1.1.0
 * ═══════════════════════════════════════════════════════════════
 *
 * Este archivo contiene toda la lógica de instalación.
 * Se integrará en QuickInstaller.html o puede usarse independientemente.
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

var FRAMEWORK_VERSION = "1.1.0";
var FRAMEWORK_PREFIX = "OMG_FW_";
var GITHUB_BASE_URL = "https://raw.githubusercontent.com/YOUR_USERNAME/omegaframework/main/";

// Content Blocks to install (in order)
var CONTENT_BLOCKS = [
    {
        name: "ResponseWrapper",
        key: FRAMEWORK_PREFIX + "ResponseWrapper",
        file: "src/ResponseWrapper.ssjs",
        description: "Standard response wrapper for all handlers",
        order: 1,
        required: true
    },
    {
        name: "Settings",
        key: FRAMEWORK_PREFIX + "Settings",
        file: "src/Settings.ssjs",
        description: "Centralized configuration management",
        order: 2,
        required: true
    },
    {
        name: "AuthHandler",
        key: FRAMEWORK_PREFIX + "AuthHandler",
        file: "src/AuthHandler.ssjs",
        description: "Authentication handler with singleton pattern",
        order: 3,
        required: true
    },
    {
        name: "ConnectionHandler",
        key: FRAMEWORK_PREFIX + "ConnectionHandler",
        file: "src/ConnectionHandler.ssjs",
        description: "HTTP connection handler with retry logic",
        order: 4,
        required: true
    },
    {
        name: "Core",
        key: FRAMEWORK_PREFIX + "Core",
        file: "src/Core.ssjs",
        description: "Main framework wrapper - loads base modules automatically",
        order: 5,
        required: true
    },
    {
        name: "EmailHandler",
        key: FRAMEWORK_PREFIX + "EmailHandler",
        file: "src/EmailHandler.ssjs",
        description: "Email management handler (CRUD operations)",
        order: 6,
        required: false
    },
    {
        name: "DataExtensionHandler",
        key: FRAMEWORK_PREFIX + "DataExtensionHandler",
        file: "src/DataExtensionHandler.ssjs",
        description: "Data Extension management handler (CRUD operations)",
        order: 7,
        required: false
    },
    {
        name: "AssetHandler",
        key: FRAMEWORK_PREFIX + "AssetHandler",
        file: "src/AssetHandler.ssjs",
        description: "Asset management handler for Content Builder",
        order: 8,
        required: false
    },
    {
        name: "FolderHandler",
        key: FRAMEWORK_PREFIX + "FolderHandler",
        file: "src/FolderHandler.ssjs",
        description: "Folder management handler",
        order: 9,
        required: false
    },
    {
        name: "LogHandler",
        key: FRAMEWORK_PREFIX + "LogHandler",
        file: "src/LogHandler.ssjs",
        description: "Logging handler with multi-destination support",
        order: 10,
        required: false
    },
    {
        name: "AssetCreator",
        key: FRAMEWORK_PREFIX + "AssetCreator",
        file: "src/AssetCreator.ssjs",
        description: "Utility for automatic asset creation",
        order: 11,
        required: false,
        optional: true
    },
    {
        name: "JourneyCreator",
        key: FRAMEWORK_PREFIX + "JourneyCreator",
        file: "src/JourneyCreator.ssjs",
        description: "Journey Builder integration for advanced alerts",
        order: 12,
        required: false,
        optional: true
    }
];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * HTTP Request helper
 */
function httpRequest(method, url, headers, payload) {
    try {
        var req = new Script.Util.HttpRequest(url);
        req.emptyContentHandling = 0;
        req.retries = 2;
        req.continueOnError = true;
        req.method = method;

        if (headers) {
            for (var key in headers) {
                if (headers.hasOwnProperty(key)) {
                    req.setHeader(key, headers[key]);
                }
            }
        }

        if (payload) {
            req.contentType = 'application/json';
            req.postData = Stringify(payload);
        }

        var response = req.send();

        return {
            success: (response.statusCode >= 200 && response.statusCode < 300),
            statusCode: response.statusCode,
            content: response.content,
            contentParsed: null
        };

    } catch (ex) {
        return {
            success: false,
            statusCode: 0,
            content: ex.message || ex.toString(),
            error: ex
        };
    }
}

/**
 * Get authentication token
 */
function getAuthToken(clientId, clientSecret, authBaseUrl) {
    var tokenUrl = authBaseUrl + 'v2/token';

    var payload = {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
    };

    var headers = {
        'Content-Type': 'application/json'
    };

    var response = httpRequest('POST', tokenUrl, headers, payload);

    if (response.success) {
        try {
            var tokenData = Platform.Function.ParseJSON(response.content);
            return {
                success: true,
                token: tokenData.access_token,
                restInstanceUrl: tokenData.rest_instance_url
            };
        } catch (ex) {
            return {
                success: false,
                error: 'Failed to parse token response: ' + ex.message
            };
        }
    } else {
        return {
            success: false,
            error: 'Failed to get auth token. Status: ' + response.statusCode
        };
    }
}

/**
 * Load file from GitHub or use embedded content
 */
function loadFileContent(fileUrl, embeddedContent) {
    // Try to load from GitHub first
    if (fileUrl && fileUrl !== "") {
        var response = httpRequest('GET', fileUrl, null, null);
        if (response.success && response.content) {
            return {
                success: true,
                content: response.content,
                source: 'github'
            };
        }
    }

    // Fallback to embedded content
    if (embeddedContent) {
        return {
            success: true,
            content: embeddedContent,
            source: 'embedded'
        };
    }

    return {
        success: false,
        error: 'No content available'
    };
}

/**
 * Find or create folder
 */
function findOrCreateFolder(folderName, parentFolderId, token, restUrl) {
    var categoryUrl = restUrl + '/asset/v1/content/categories';

    // First, try to find existing folder
    var searchUrl = categoryUrl + '?$filter=Name eq \'' + folderName + '\'';

    var headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };

    var searchResponse = httpRequest('GET', searchUrl, headers, null);

    if (searchResponse.success) {
        try {
            var data = Platform.Function.ParseJSON(searchResponse.content);
            if (data.items && data.items.length > 0) {
                return {
                    success: true,
                    folderId: data.items[0].id,
                    action: 'found'
                };
            }
        } catch (ex) {
            // Continue to create
        }
    }

    // Create new folder
    var folderPayload = {
        name: folderName,
        parentId: parentFolderId || 0
    };

    var createResponse = httpRequest('POST', categoryUrl, headers, folderPayload);

    if (createResponse.success) {
        try {
            var createData = Platform.Function.ParseJSON(createResponse.content);
            return {
                success: true,
                folderId: createData.id,
                action: 'created'
            };
        } catch (ex) {
            return {
                success: false,
                error: 'Failed to parse create folder response'
            };
        }
    }

    return {
        success: false,
        error: 'Failed to create folder. Status: ' + createResponse.statusCode
    };
}

/**
 * Create Content Block
 */
function createContentBlock(blockConfig, folderId, token, restUrl, githubBaseUrl) {
    var assetUrl = restUrl + '/asset/v1/content/assets';

    var headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };

    // Load file content
    var fileUrl = githubBaseUrl ? githubBaseUrl + blockConfig.file : null;
    var contentResult = loadFileContent(fileUrl, null);

    if (!contentResult.success) {
        return {
            success: false,
            error: 'Failed to load file content for ' + blockConfig.name
        };
    }

    // Create asset payload
    var assetPayload = {
        name: blockConfig.name,
        customerKey: blockConfig.key,
        assetType: {
            name: 'codesnippetblock',
            id: 220
        },
        content: contentResult.content,
        category: {
            id: folderId
        }
    };

    if (blockConfig.description) {
        assetPayload.description = blockConfig.description;
    }

    var createResponse = httpRequest('POST', assetUrl, headers, assetPayload);

    if (createResponse.success) {
        return {
            success: true,
            message: 'Content Block created: ' + blockConfig.name,
            source: contentResult.source
        };
    } else {
        // Check if it already exists
        if (createResponse.statusCode === 400 || createResponse.statusCode === 409) {
            return {
                success: true,
                message: 'Content Block already exists: ' + blockConfig.name,
                skipped: true
            };
        }

        return {
            success: false,
            error: 'Failed to create Content Block: ' + blockConfig.name + '. Status: ' + createResponse.statusCode,
            details: createResponse.content
        };
    }
}

/**
 * Main installation function
 */
function installFramework(config) {
    var results = {
        success: true,
        steps: [],
        errors: [],
        warnings: []
    };

    // Step 1: Validate configuration
    results.steps.push({ step: 'validate', message: 'Validating configuration...', status: 'running' });

    if (!config.clientId || !config.clientSecret || !config.authBaseUrl) {
        results.success = false;
        results.errors.push('Missing required configuration: clientId, clientSecret, or authBaseUrl');
        return results;
    }

    results.steps[0].status = 'success';

    // Step 2: Get authentication token
    results.steps.push({ step: 'auth', message: 'Obtaining authentication token...', status: 'running' });

    var authResult = getAuthToken(config.clientId, config.clientSecret, config.authBaseUrl);

    if (!authResult.success) {
        results.success = false;
        results.errors.push('Authentication failed: ' + authResult.error);
        results.steps[1].status = 'error';
        return results;
    }

    results.steps[1].status = 'success';
    results.steps[1].message += ' ✓';

    var token = authResult.token;
    var restUrl = authResult.restInstanceUrl;

    // Step 3: Create folder structure
    results.steps.push({ step: 'folders', message: 'Creating folder structure...', status: 'running' });

    var folderResult = findOrCreateFolder('OmegaFramework', 0, token, restUrl);

    if (!folderResult.success) {
        results.warnings.push('Failed to create folder: ' + folderResult.error);
        results.steps[2].status = 'warning';
        folderResult.folderId = 0; // Use root
    } else {
        results.steps[2].status = 'success';
        results.steps[2].message += ' (' + folderResult.action + ')';
    }

    var folderId = folderResult.folderId;

    // Step 4: Install Content Blocks
    results.steps.push({ step: 'install', message: 'Installing Content Blocks...', status: 'running' });

    var installedCount = 0;
    var skippedCount = 0;
    var errorCount = 0;

    for (var i = 0; i < CONTENT_BLOCKS.length; i++) {
        var block = CONTENT_BLOCKS[i];

        // Skip optional blocks if not requested
        if (block.optional && !config.installOptional) {
            skippedCount++;
            continue;
        }

        var blockResult = createContentBlock(block, folderId, token, restUrl, config.githubRepo);

        if (blockResult.success) {
            if (blockResult.skipped) {
                skippedCount++;
            } else {
                installedCount++;
            }
            results.steps.push({
                step: 'block_' + block.name,
                message: blockResult.message,
                status: 'success'
            });
        } else {
            errorCount++;
            results.errors.push(blockResult.error);
            results.steps.push({
                step: 'block_' + block.name,
                message: 'Error: ' + blockResult.error,
                status: 'error'
            });

            if (block.required) {
                results.success = false;
            }
        }
    }

    results.steps[3].status = errorCount > 0 ? 'warning' : 'success';
    results.steps[3].message += ' (Installed: ' + installedCount + ', Skipped: ' + skippedCount + ', Errors: ' + errorCount + ')';

    // Final summary
    results.summary = {
        totalBlocks: CONTENT_BLOCKS.length,
        installed: installedCount,
        skipped: skippedCount,
        errors: errorCount
    };

    return results;
}

// ═══════════════════════════════════════════════════════════════
// EXPORT (for use in QuickInstaller.html)
// ═══════════════════════════════════════════════════════════════

// This makes the function available to the main installer
if (typeof Variable !== 'undefined') {
    // Store in AMPscript variable for access
    Variable.SetValue("@InstallationLogicLoaded", "true");
}

</script>
