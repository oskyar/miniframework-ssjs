%%=ContentBlockByKey("OMG_FW_Core")=%%

<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// OMEGAFRAMEWORK - COMPREHENSIVE TEST PAGE
// ============================================================================

var testResults = {
    framework: {
        name: "OmegaFramework Test Suite",
        version: "1.1.0",
        timestamp: Format(Now(), "yyyy-MM-dd HH:mm:ss")
    },
    configuration: null,
    tests: []
};

// ============================================================================
// STEP 1: GET CONFIGURATION FROM FORM OR USE DEFAULTS
// ============================================================================

function getConfiguration() {
    var clientId = Platform.Request.GetFormField("clientId");
    var clientSecret = Platform.Request.GetFormField("clientSecret");
    var authBaseUrl = Platform.Request.GetFormField("authBaseUrl");
    var runTests = Platform.Request.GetFormField("runTests");

    if (clientId && clientSecret && authBaseUrl && runTests === "true") {
        return {
            shouldRun: true,
            config: {
                auth: {
                    clientId: clientId,
                    clientSecret: clientSecret,
                    authBaseUrl: authBaseUrl
                }
            }
        };
    }

    return { shouldRun: false };
}

// ============================================================================
// STEP 2: HELPER FUNCTIONS
// ============================================================================

function addTestResult(handlerName, operation, result) {
    testResults.tests.push({
        handler: handlerName,
        operation: operation,
        success: result.success || false,
        data: result.data || null,
        error: result.error || null,
        timestamp: Format(Now(), "yyyy-MM-dd HH:mm:ss")
    });
}

// ============================================================================
// STEP 3: TEST FUNCTIONS FOR EACH HANDLER
// ============================================================================

function testAuthHandler(config) {
    try {
        var auth = OmegaFramework.getAuth();
        var tokenResult = auth.getValidToken(config.auth);

        addTestResult('AuthHandler', 'getValidToken', tokenResult);

        if (tokenResult.success) {
            // Test createAuthHeader
            var headerResult = auth.createAuthHeader(tokenResult.data);
            addTestResult('AuthHandler', 'createAuthHeader', headerResult);
        }

        return tokenResult.success;
    } catch (ex) {
        addTestResult('AuthHandler', 'exception', {
            success: false,
            error: { message: ex.toString() }
        });
        return false;
    }
}

function testConnectionHandler(config) {
    try {
        OmegaFramework.load("ConnectionHandler");
        var connection = OmegaFramework.getConnection();

        // Test basic config retrieval
        var configResult = connection.getConfig();

        addTestResult('ConnectionHandler', 'getConfig', {
            success: true,
            data: configResult
        });

        return true;
    } catch (ex) {
        addTestResult('ConnectionHandler', 'exception', {
            success: false,
            error: { message: ex.toString() }
        });
        return false;
    }
}

function testEmailHandler(config) {
    try {
        OmegaFramework.load("EmailHandler");
        var emailHandler = new EmailHandler(config.auth);

        // Test list emails (with limit to avoid timeout)
        var listResult = emailHandler.list({ pageSize: 5, page: 1 });

        addTestResult('EmailHandler', 'list', listResult);

        // Test getTemplates
        if (listResult.success) {
            var templatesResult = emailHandler.getTemplates({ pageSize: 3 });
            addTestResult('EmailHandler', 'getTemplates', templatesResult);
        }

        return listResult.success;
    } catch (ex) {
        addTestResult('EmailHandler', 'exception', {
            success: false,
            error: { message: ex.toString() }
        });
        return false;
    }
}

function testDataExtensionHandler(config) {
    try {
        OmegaFramework.load("DataExtensionHandler");
        var deHandler = new DataExtensionHandler(config.auth);

        // Test list Data Extensions
        var listResult = deHandler.list({ pageSize: 5 });

        addTestResult('DataExtensionHandler', 'list', listResult);

        return listResult.success;
    } catch (ex) {
        addTestResult('DataExtensionHandler', 'exception', {
            success: false,
            error: { message: ex.toString() }
        });
        return false;
    }
}

function testAssetHandler(config) {
    try {
        OmegaFramework.load("AssetHandler");
        var assetHandler = new AssetHandler(config.auth);

        // Test list assets
        var listResult = assetHandler.list({ pageSize: 5 });

        addTestResult('AssetHandler', 'list', listResult);

        // Test getAssetTypes
        if (listResult.success) {
            var typesResult = assetHandler.getAssetTypes();
            addTestResult('AssetHandler', 'getAssetTypes', typesResult);
        }

        return listResult.success;
    } catch (ex) {
        addTestResult('AssetHandler', 'exception', {
            success: false,
            error: { message: ex.toString() }
        });
        return false;
    }
}

function testFolderHandler(config) {
    try {
        OmegaFramework.load("FolderHandler");
        var folderHandler = new FolderHandler(config.auth);

        // Test list folders
        var listResult = folderHandler.list({ pageSize: 5 });

        addTestResult('FolderHandler', 'list', listResult);

        return listResult.success;
    } catch (ex) {
        addTestResult('FolderHandler', 'exception', {
            success: false,
            error: { message: ex.toString() }
        });
        return false;
    }
}

function testLogHandler(config) {
    try {
        OmegaFramework.load("LogHandler");
        var logConfig = {
            enableConsole: false, // Don't clutter output
            enableDataExtension: false,
            enableEmailAlerts: false
        };
        var logHandler = new LogHandler(config.auth, logConfig);

        // Test info log
        var infoResult = logHandler.info('Test info message from OmegaFramework test suite', { testData: 'sample' }, 'TestSuite');

        addTestResult('LogHandler', 'info', infoResult);

        // Test getLogSettings
        var settingsResult = logHandler.getLogSettings();
        addTestResult('LogHandler', 'getLogSettings', settingsResult);

        return infoResult.success;
    } catch (ex) {
        addTestResult('LogHandler', 'exception', {
            success: false,
            error: { message: ex.toString() }
        });
        return false;
    }
}

function testFrameworkInfo() {
    try {
        var info = OmegaFramework.getInfo();

        addTestResult('Framework', 'getInfo', {
            success: true,
            data: info
        });

        return true;
    } catch (ex) {
        addTestResult('Framework', 'exception', {
            success: false,
            error: { message: ex.toString() }
        });
        return false;
    }
}

// ============================================================================
// STEP 4: RUN ALL TESTS
// ============================================================================

function runAllTests(config) {
    // Configure framework
    var configResult = OmegaFramework.configure(config.config);
    testResults.configuration = configResult;

    if (!configResult.success) {
        return testResults;
    }

    // Test Framework Info
    testFrameworkInfo();

    // Test AuthHandler (prerequisite for others)
    var authSuccess = testAuthHandler(config.config);

    if (authSuccess) {
        // Test ConnectionHandler
        testConnectionHandler(config.config);

        // Test all other handlers
        testEmailHandler(config.config);
        testDataExtensionHandler(config.config);
        testAssetHandler(config.config);
        testFolderHandler(config.config);
        testLogHandler(config.config);
    }

    return testResults;
}

// ============================================================================
// STEP 5: MAIN EXECUTION
// ============================================================================

var config = getConfiguration();
var results = null;

if (config.shouldRun) {
    results = runAllTests(config);
}

</script>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OmegaFramework - Test Suite</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #0176d3 0%, #032d60 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }

        .header h1 {
            font-size: 36px;
            margin-bottom: 10px;
            font-weight: 700;
        }

        .header p {
            font-size: 16px;
            opacity: 0.9;
        }

        .content {
            padding: 40px;
        }

        .form-section {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #2c3e50;
            font-size: 14px;
        }

        .form-group input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e1e8ed;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.3s;
        }

        .form-group input:focus {
            outline: none;
            border-color: #0176d3;
            box-shadow: 0 0 0 3px rgba(1, 118, 211, 0.1);
        }

        .btn {
            background: linear-gradient(135deg, #0176d3 0%, #032d60 100%);
            color: white;
            padding: 14px 32px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            width: 100%;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(1, 118, 211, 0.3);
        }

        .btn:active {
            transform: translateY(0);
        }

        .info-box {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }

        .info-box h3 {
            color: #1976d2;
            margin-bottom: 10px;
            font-size: 18px;
        }

        .info-box p {
            color: #424242;
            line-height: 1.6;
        }

        .info-box ul {
            margin-top: 12px;
            margin-left: 20px;
            color: #424242;
        }

        .info-box li {
            margin: 6px 0;
        }

        .results-section {
            margin-top: 30px;
        }

        .summary-card {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 24px;
            border-radius: 12px;
            text-align: center;
        }

        .stat-card.success {
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
        }

        .stat-card.error {
            background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
        }

        .stat-card h3 {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .stat-card .value {
            font-size: 36px;
            font-weight: 700;
            color: #2c3e50;
        }

        .test-results {
            margin-top: 30px;
        }

        .test-item {
            background: white;
            border: 2px solid #e1e8ed;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            transition: all 0.3s;
        }

        .test-item:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }

        .test-item.success {
            border-left: 6px solid #28a745;
        }

        .test-item.failed {
            border-left: 6px solid #dc3545;
        }

        .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .test-title {
            font-size: 16px;
            font-weight: 600;
            color: #2c3e50;
        }

        .test-status {
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .test-status.success {
            background: #d4edda;
            color: #155724;
        }

        .test-status.failed {
            background: #f8d7da;
            color: #721c24;
        }

        .test-details {
            font-size: 14px;
            color: #666;
            line-height: 1.6;
        }

        .test-meta {
            display: flex;
            gap: 20px;
            margin-top: 12px;
            font-size: 13px;
            color: #888;
        }

        .test-data {
            background: #f8f9fa;
            padding: 16px;
            border-radius: 8px;
            margin-top: 12px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-height: 300px;
            overflow-y: auto;
        }

        .error-message {
            background: #fff5f5;
            border: 1px solid #feb2b2;
            padding: 16px;
            border-radius: 8px;
            margin-top: 12px;
            color: #c53030;
        }

        details {
            margin-top: 12px;
        }

        summary {
            cursor: pointer;
            font-weight: 600;
            color: #0176d3;
            padding: 8px;
            background: #f0f7ff;
            border-radius: 4px;
        }

        summary:hover {
            background: #e1f0ff;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            margin-right: 8px;
        }

        .badge.handler {
            background: #e3f2fd;
            color: #1976d2;
        }

        .badge.operation {
            background: #f3e5f5;
            color: #7b1fa2;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 OmegaFramework Test Suite</h1>
            <p>Comprehensive testing for all handlers and functionality</p>
        </div>

        <div class="content">
            <script runat="server">
                if (!config.shouldRun) {
            </script>

            <div class="info-box">
                <h3>📋 Test Configuration</h3>
                <p>Enter your Salesforce Marketing Cloud credentials to test all OmegaFramework handlers.</p>
                <ul>
                    <li><strong>AuthHandler:</strong> Token management and authentication</li>
                    <li><strong>ConnectionHandler:</strong> HTTP connection management</li>
                    <li><strong>EmailHandler:</strong> Email and template operations</li>
                    <li><strong>DataExtensionHandler:</strong> Data Extension operations</li>
                    <li><strong>AssetHandler:</strong> Content Builder asset management</li>
                    <li><strong>FolderHandler:</strong> Folder structure operations</li>
                    <li><strong>LogHandler:</strong> Logging functionality</li>
                </ul>
            </div>

            <form method="POST" class="form-section">
                <div class="form-group">
                    <label for="clientId">Client ID *</label>
                    <input type="text" id="clientId" name="clientId" required placeholder="Your SFMC Client ID">
                </div>

                <div class="form-group">
                    <label for="clientSecret">Client Secret *</label>
                    <input type="password" id="clientSecret" name="clientSecret" required placeholder="Your SFMC Client Secret">
                </div>

                <div class="form-group">
                    <label for="authBaseUrl">Auth Base URL *</label>
                    <input type="text" id="authBaseUrl" name="authBaseUrl" required
                           placeholder="https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/"
                           value="https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/">
                </div>

                <input type="hidden" name="runTests" value="true">
                <button type="submit" class="btn">🚀 Run All Tests</button>
            </form>

            <script runat="server">
                } else {
                    // Display results
                    Write('<div class="results-section">');
                    Write('<h2 style="margin-bottom: 24px; color: #2c3e50;">Test Results</h2>');

                    // Calculate summary statistics
                    var totalTests = results.tests.length;
                    var successTests = 0;
                    var failedTests = 0;

                    for (var i = 0; i < results.tests.length; i++) {
                        if (results.tests[i].success) {
                            successTests++;
                        } else {
                            failedTests++;
                        }
                    }

                    // Display summary cards
                    Write('<div class="summary-card">');
                    Write('<div class="stat-card">');
                    Write('<h3>Total Tests</h3>');
                    Write('<div class="value">' + totalTests + '</div>');
                    Write('</div>');

                    Write('<div class="stat-card success">');
                    Write('<h3>Passed</h3>');
                    Write('<div class="value">' + successTests + '</div>');
                    Write('</div>');

                    Write('<div class="stat-card error">');
                    Write('<h3>Failed</h3>');
                    Write('<div class="value">' + failedTests + '</div>');
                    Write('</div>');
                    Write('</div>');

                    // Display individual test results
                    Write('<div class="test-results">');

                    for (var i = 0; i < results.tests.length; i++) {
                        var test = results.tests[i];
                        var statusClass = test.success ? 'success' : 'failed';

                        Write('<div class="test-item ' + statusClass + '">');
                        Write('<div class="test-header">');
                        Write('<div class="test-title">');
                        Write('<span class="badge handler">' + test.handler + '</span>');
                        Write('<span class="badge operation">' + test.operation + '</span>');
                        Write('</div>');
                        Write('<span class="test-status ' + statusClass + '">' + (test.success ? '✓ PASSED' : '✗ FAILED') + '</span>');
                        Write('</div>');

                        Write('<div class="test-meta">');
                        Write('<span>🕐 Time: ' + test.timestamp + '</span>');
                        Write('</div>');

                        if (!test.success && test.error) {
                            Write('<div class="error-message">');
                            Write('<strong>Error:</strong> ' + (test.error.message || 'Unknown error'));
                            if (test.error.code) {
                                Write(' (Code: ' + test.error.code + ')');
                            }
                            Write('</div>');
                        }

                        if (test.data) {
                            Write('<details>');
                            Write('<summary>View Response Data</summary>');
                            Write('<div class="test-data">');
                            Write('<pre>' + Stringify(test.data, null, 2) + '</pre>');
                            Write('</div>');
                            Write('</details>');
                        }

                        Write('</div>');
                    }

                    Write('</div>'); // close test-results
                    Write('</div>'); // close results-section

                    // Add button to run tests again
                    Write('<form method="GET" style="margin-top: 30px;">');
                    Write('<button type="submit" class="btn">🔄 Run Tests Again</button>');
                    Write('</form>');
                }
            </script>
        </div>
    </div>
</body>
</html>
