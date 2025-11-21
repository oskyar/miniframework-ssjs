%%=ContentBlockByKey("OMG_FW_Core")=%%
<script runat="server">

Platform.Load("core", "1.1.1");

/**
 * ═══════════════════════════════════════════════════════════════
 * OMEGAFRAMEWORK TEST SUITE v1.1.0
 * ═══════════════════════════════════════════════════════════════
 *
 * Tests completos del framework con el NUEVO patrón
 *
 * CAMBIOS en v1.1.0:
 * - Solo cargas OMG_FW_Core
 * - Configuración centralizada
 * - Singleton de Auth/Connection
 * - Carga condicional de handlers
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

var testConfig = {
    auth: {
        clientId: 'YOUR_CLIENT_ID',
        clientSecret: 'YOUR_CLIENT_SECRET',
        authBaseUrl: 'https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/'
    },
    logging: {
        level: 'INFO',
        enableConsole: true
    }
};

Write('<html><head><title>OmegaFramework Test Suite v1.1.0</title>');
Write('<style>');
Write('body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }');
Write('h1 { color: #0176d3; border-bottom: 3px solid #0176d3; padding-bottom: 10px; }');
Write('h2 { color: #333; margin-top: 30px; background: #e8f4f8; padding: 10px; border-left: 4px solid #0176d3; }');
Write('.test { margin: 10px 0; padding: 10px; background: white; border-left: 3px solid #ccc; }');
Write('.success { border-left-color: #28a745; background: #f0f8f0; }');
Write('.error { border-left-color: #dc3545; background: #f8f0f0; }');
Write('.status { font-weight: bold; }');
Write('.status.ok { color: #28a745; }');
Write('.status.fail { color: #dc3545; }');
Write('.details { font-size: 0.9em; color: #666; margin-top: 5px; }');
Write('.summary { background: #fff; padding: 15px; border: 2px solid #0176d3; margin: 20px 0; }');
Write('</style></head><body>');

Write('<h1>🧪 OmegaFramework Test Suite v1.1.0</h1>');
Write('<p><strong>Fecha:</strong> ' + new Date().toISOString() + '</p>');

var testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(name, passed, details) {
    testResults.total++;
    if (passed) {
        testResults.passed++;
    } else {
        testResults.failed++;
    }
    testResults.tests.push({name: name, passed: passed, details: details});

    var cssClass = passed ? 'test success' : 'test error';
    var statusClass = passed ? 'status ok' : 'status fail';
    var statusText = passed ? '✅ PASS' : '❌ FAIL';

    Write('<div class="' + cssClass + '">');
    Write('<span class="' + statusClass + '">' + statusText + '</span> ' + name);
    if (details) {
        Write('<div class="details">' + details + '</div>');
    }
    Write('</div>');
}

// ═══════════════════════════════════════════════════════════════
// TEST 1: FRAMEWORK INITIALIZATION
// ═══════════════════════════════════════════════════════════════

Write('<h2>1️⃣ Framework Initialization</h2>');

try {
    var info = OmegaFramework.getInfo();
    logTest('OmegaFramework global object exists', true, 'Name: ' + info.name + ', Version: ' + info.version);
} catch (ex) {
    logTest('OmegaFramework global object exists', false, 'Error: ' + ex.message);
}

try {
    var configResult = OmegaFramework.configure(testConfig);
    logTest('Framework configuration', configResult.success, configResult.message || configResult.error);
} catch (ex) {
    logTest('Framework configuration', false, 'Exception: ' + ex.message);
}

try {
    var currentConfig = OmegaFramework.getConfig();
    logTest('Get framework config', currentConfig != null, 'Config retrieved successfully');
} catch (ex) {
    logTest('Get framework config', false, 'Error: ' + ex.message);
}

// ═══════════════════════════════════════════════════════════════
// TEST 2: SINGLETON INSTANCES
// ═══════════════════════════════════════════════════════════════

Write('<h2>2️⃣ Singleton Instances</h2>');

try {
    var auth1 = OmegaFramework.getAuth();
    var auth2 = OmegaFramework.getAuth();
    var isSingleton = (auth1 === auth2);
    logTest('AuthHandler singleton', isSingleton, 'Same instance returned: ' + isSingleton);
} catch (ex) {
    logTest('AuthHandler singleton', false, 'Error: ' + ex.message);
}

try {
    var conn1 = OmegaFramework.getConnection();
    var conn2 = OmegaFramework.getConnection();
    var isSingleton = (conn1 === conn2);
    logTest('ConnectionHandler singleton', isSingleton, 'Same instance returned: ' + isSingleton);
} catch (ex) {
    logTest('ConnectionHandler singleton', false, 'Error: ' + ex.message);
}

// ═══════════════════════════════════════════════════════════════
// TEST 3: HANDLER LOADING
// ═══════════════════════════════════════════════════════════════

Write('<h2>3️⃣ Handler Loading</h2>');

try {
    var loadResult = OmegaFramework.load('EmailHandler');
    logTest('Load EmailHandler', loadResult.success, loadResult.message);
} catch (ex) {
    logTest('Load EmailHandler', false, 'Error: ' + ex.message);
}

try {
    var loadResult = OmegaFramework.load('DataExtensionHandler');
    logTest('Load DataExtensionHandler', loadResult.success, loadResult.message);
} catch (ex) {
    logTest('Load DataExtensionHandler', false, 'Error: ' + ex.message);
}

try {
    var loadResult = OmegaFramework.load('AssetHandler');
    logTest('Load AssetHandler', loadResult.success, loadResult.message);
} catch (ex) {
    logTest('Load AssetHandler', false, 'Error: ' + ex.message);
}

try {
    var loadResult = OmegaFramework.load('LogHandler');
    logTest('Load LogHandler', loadResult.success, loadResult.message);
} catch (ex) {
    logTest('Load LogHandler', false, 'Error: ' + ex.message);
}

// ═══════════════════════════════════════════════════════════════
// TEST 4: HANDLER INSTANTIATION
// ═══════════════════════════════════════════════════════════════

Write('<h2>4️⃣ Handler Instantiation</h2>');

try {
    var emailHandler = new EmailHandler();
    logTest('Instantiate EmailHandler', emailHandler != null, 'Instance created without explicit config');
} catch (ex) {
    logTest('Instantiate EmailHandler', false, 'Error: ' + ex.message);
}

try {
    var deHandler = new DataExtensionHandler();
    logTest('Instantiate DataExtensionHandler', deHandler != null, 'Instance created without explicit config');
} catch (ex) {
    logTest('Instantiate DataExtensionHandler', false, 'Error: ' + ex.message);
}

try {
    var assetHandler = new AssetHandler();
    logTest('Instantiate AssetHandler', assetHandler != null, 'Instance created without explicit config');
} catch (ex) {
    logTest('Instantiate AssetHandler', false, 'Error: ' + ex.message);
}

try {
    var logHandler = new LogHandler();
    logTest('Instantiate LogHandler', logHandler != null, 'Instance created without explicit config');
} catch (ex) {
    logTest('Instantiate LogHandler', false, 'Error: ' + ex.message);
}

// ═══════════════════════════════════════════════════════════════
// TEST 5: AUTH HANDLER
// ═══════════════════════════════════════════════════════════════

Write('<h2>5️⃣ Authentication Handler</h2>');

try {
    var auth = OmegaFramework.getAuth();
    var tokenResult = auth.getToken();
    logTest('Get authentication token', tokenResult.success, tokenResult.success ? 'Token obtained' : tokenResult.error.message);

    if (tokenResult.success) {
        // Test token caching
        var cachedToken = auth.getCachedToken();
        logTest('Token caching', cachedToken != null, 'Token is cached: ' + (cachedToken != null));
    }
} catch (ex) {
    logTest('Get authentication token', false, 'Exception: ' + ex.message);
}

// ═══════════════════════════════════════════════════════════════
// TEST 6: CONNECTION HANDLER
// ═══════════════════════════════════════════════════════════════

Write('<h2>6️⃣ Connection Handler</h2>');

try {
    var connection = OmegaFramework.getConnection();
    var config = connection.getConfig();
    logTest('Get connection config', config != null, 'MaxRetries: ' + config.maxRetries + ', RetryDelay: ' + config.retryDelay);
} catch (ex) {
    logTest('Get connection config', false, 'Error: ' + ex.message);
}

// ═══════════════════════════════════════════════════════════════
// TEST 7: RESPONSE WRAPPER
// ═══════════════════════════════════════════════════════════════

Write('<h2>7️⃣ Response Wrapper</h2>');

try {
    var response = new OmegaFrameworkResponse();
    var successResp = response.success({test: 'data'}, 'TestHandler', 'testOp');
    logTest('Create success response', successResp.success === true && successResp.data.test === 'data', 'Response structure correct');
} catch (ex) {
    logTest('Create success response', false, 'Error: ' + ex.message);
}

try {
    var response = new OmegaFrameworkResponse();
    var errorResp = response.error('TEST_ERROR', 'Test error message', {}, 'TestHandler', 'testOp');
    logTest('Create error response', errorResp.success === false && errorResp.error.code === 'TEST_ERROR', 'Error structure correct');
} catch (ex) {
    logTest('Create error response', false, 'Error: ' + ex.message);
}

// ═══════════════════════════════════════════════════════════════
// TEST 8: FRAMEWORK INFO
// ═══════════════════════════════════════════════════════════════

Write('<h2>8️⃣ Framework Information</h2>');

try {
    var info = OmegaFramework.getInfo();
    logTest('Framework name', info.name === 'OmegaFramework', 'Name: ' + info.name);
    logTest('Framework version', info.version === '1.1.0', 'Version: ' + info.version);
    logTest('Framework initialized', info.initialized === true, 'Initialized: ' + info.initialized);
    logTest('Handlers loaded count', info.loadedHandlers.length > 0, 'Loaded: ' + info.loadedHandlers.length + ' handlers');
} catch (ex) {
    logTest('Framework info', false, 'Error: ' + ex.message);
}

// ═══════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════

Write('<div class="summary">');
Write('<h2>📊 Test Summary</h2>');
Write('<p><strong>Total Tests:</strong> ' + testResults.total + '</p>');
Write('<p><strong>Passed:</strong> <span style="color: #28a745;">' + testResults.passed + '</span></p>');
Write('<p><strong>Failed:</strong> <span style="color: #dc3545;">' + testResults.failed + '</span></p>');
Write('<p><strong>Success Rate:</strong> ' + ((testResults.passed / testResults.total) * 100).toFixed(2) + '%</p>');

if (testResults.failed === 0) {
    Write('<p style="color: #28a745; font-size: 1.2em; font-weight: bold;">✅ All tests passed!</p>');
} else {
    Write('<p style="color: #dc3545; font-size: 1.2em; font-weight: bold;">⚠️ Some tests failed. Review the details above.</p>');
}
Write('</div>');

Write('</body></html>');

</script>
