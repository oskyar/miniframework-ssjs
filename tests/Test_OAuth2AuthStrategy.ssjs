<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_OAuth2AuthStrategy - Tests for OAuth2AuthStrategy
 * Uses mock dependencies to avoid external API calls
 *
 * @version 2.0.0
 */

</script>
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_DataExtensionTokenCache")=%%
%%=ContentBlockByKey("OMG_OAuth2AuthStrategy")=%%
<script runat="server">

Write('<h1>OAuth2AuthStrategy Test Suite</h1>');
Write('<hr>');

var totalTests = 0;
var passedTests = 0;

function logTest(testName, passed, details) {
    totalTests++;
    if (passed) passedTests++;

    var status = passed ? '✓ PASS' : '✗ FAIL';
    var color = passed ? 'green' : 'red';

    Write('<div style="color: ' + color + '; margin: 10px 0;">');
    Write('<strong>' + status + '</strong>: ' + testName);
    if (details) {
        Write('<br><span style="margin-left: 20px; font-size: 0.9em;">' + details + '</span>');
    }
    Write('</div>');
}

// Mock ConnectionHandler
function MockConnectionHandler() {
    var response = new ResponseWrapper();

    this.post = function(url, data, headers) {
        // Simulate successful OAuth2 token response
        return response.success({
            parsedContent: {
                access_token: 'mock_access_token_12345',
                token_type: 'Bearer',
                expires_in: 3600,
                scope: 'api'
            }
        }, 'MockConnection', 'post');
    };

    this.request = function(method, url, contentType, payload, headers) {
        return this.post(url, payload, headers);
    };
}

// Test 1: Initialization validation - missing tokenUrl
Write('<h3>Test 1: Initialization Validation - Missing tokenUrl</h3>');
try {
    var mockConn1 = new MockConnectionHandler();
    var auth1 = new OAuth2AuthStrategy({
        clientId: 'test_client',
        clientSecret: 'test_secret'
        // Missing tokenUrl
    }, mockConn1);

    var validation = auth1.validateConfig();

    logTest('Should validate missing tokenUrl',
        !validation.success && validation.error.code === 'VALIDATION_ERROR',
        validation.error ? validation.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate missing tokenUrl', false, ex.message || ex.toString());
}

// Test 2: Initialization validation - missing clientId
Write('<h3>Test 2: Initialization Validation - Missing clientId</h3>');
try {
    var mockConn2 = new MockConnectionHandler();
    var auth2 = new OAuth2AuthStrategy({
        tokenUrl: 'https://auth.example.com/token',
        clientSecret: 'test_secret'
        // Missing clientId
    }, mockConn2);

    var validation = auth2.validateConfig();

    logTest('Should validate missing clientId',
        !validation.success && validation.error.code === 'VALIDATION_ERROR',
        validation.error ? validation.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate missing clientId', false, ex.message || ex.toString());
}

// Test 3: Initialization validation - missing clientSecret
Write('<h3>Test 3: Initialization Validation - Missing clientSecret</h3>');
try {
    var mockConn3 = new MockConnectionHandler();
    var auth3 = new OAuth2AuthStrategy({
        tokenUrl: 'https://auth.example.com/token',
        clientId: 'test_client'
        // Missing clientSecret
    }, mockConn3);

    var validation = auth3.validateConfig();

    logTest('Should validate missing clientSecret',
        !validation.success && validation.error.code === 'VALIDATION_ERROR',
        validation.error ? validation.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate missing clientSecret', false, ex.message || ex.toString());
}

// Test 4: Successful initialization
Write('<h3>Test 4: Successful Initialization</h3>');
try {
    var mockConn4 = new MockConnectionHandler();
    var auth4 = new OAuth2AuthStrategy({
        tokenUrl: 'https://auth.example.com/token',
        clientId: 'test_client',
        clientSecret: 'test_secret',
        grantType: 'client_credentials'
    }, mockConn4);

    var validation = auth4.validateConfig();

    logTest('Should initialize with valid config',
        validation.success,
        'OAuth2 strategy initialized successfully');
} catch (ex) {
    logTest('Should initialize with valid config', false, ex.message || ex.toString());
}

// Test 5: Get headers - should return authorization header
Write('<h3>Test 5: Get Headers - Authorization Header</h3>');
try {
    var mockConn5 = new MockConnectionHandler();
    var auth5 = new OAuth2AuthStrategy({
        tokenUrl: 'https://auth.example.com/token',
        clientId: 'test_client',
        clientSecret: 'test_secret',
        grantType: 'client_credentials'
    }, mockConn5);

    var headersResult = auth5.getHeaders();

    logTest('Should return authorization headers',
        headersResult.success && headersResult.data && headersResult.data.Authorization,
        headersResult.success ? 'Authorization header present' : (headersResult.error ? headersResult.error.message : 'Unknown error'));
} catch (ex) {
    logTest('Should return authorization headers', false, ex.message || ex.toString());
}

// Test 6: Get token - first call (no cache)
Write('<h3>Test 6: Get Token - First Call (No Cache)</h3>');
try {
    var mockConn6 = new MockConnectionHandler();
    var auth6 = new OAuth2AuthStrategy({
        tokenUrl: 'https://auth.example.com/token',
        clientId: 'test_client',
        clientSecret: 'test_secret',
        grantType: 'client_credentials'
    }, mockConn6);

    var tokenResult = auth6.getToken();

    logTest('Should get token on first call',
        tokenResult.success && tokenResult.data && tokenResult.data.access_token,
        tokenResult.success ? 'Token: ' + tokenResult.data.access_token : (tokenResult.error ? tokenResult.error.message : 'Unknown error'));
} catch (ex) {
    logTest('Should get token on first call', false, ex.message || ex.toString());
}

// Test 7: isTokenExpired - null token
Write('<h3>Test 7: isTokenExpired - Null Token</h3>');
try {
    var mockConn7 = new MockConnectionHandler();
    var auth7 = new OAuth2AuthStrategy({
        tokenUrl: 'https://auth.example.com/token',
        clientId: 'test_client',
        clientSecret: 'test_secret',
        grantType: 'client_credentials'
    }, mockConn7);

    var isExpired = auth7.isTokenExpired(null);

    logTest('Should detect null token as expired',
        isExpired === true,
        'Null token expired: ' + isExpired);
} catch (ex) {
    logTest('Should detect null token as expired', false, ex.message || ex.toString());
}

// Test 8: isTokenExpired - valid token
Write('<h3>Test 8: isTokenExpired - Valid Token</h3>');
try {
    var mockConn8 = new MockConnectionHandler();
    var auth8 = new OAuth2AuthStrategy({
        tokenUrl: 'https://auth.example.com/token',
        clientId: 'test_client',
        clientSecret: 'test_secret',
        grantType: 'client_credentials',
        refreshBuffer: 300000 // 5 minutes
    }, mockConn8);

    var validToken = {
        access_token: 'test_token',
        expires_in: 3600,
        token_type: 'Bearer',
        retrieved_at: new Date().getTime() - 1000 // 1 second ago
    };

    var isExpired = auth8.isTokenExpired(validToken);

    logTest('Should detect valid token as not expired',
        isExpired === false,
        'Valid token expired: ' + isExpired);
} catch (ex) {
    logTest('Should detect valid token as not expired', false, ex.message || ex.toString());
}

// Test 9: Password grant type validation
Write('<h3>Test 9: Password Grant Type - Missing Username</h3>');
try {
    var mockConn9 = new MockConnectionHandler();
    var auth9 = new OAuth2AuthStrategy({
        tokenUrl: 'https://auth.example.com/token',
        clientId: 'test_client',
        clientSecret: 'test_secret',
        grantType: 'password',
        password: 'test_password'
        // Missing username
    }, mockConn9);

    var validation = auth9.validateConfig();

    logTest('Should validate missing username for password grant',
        !validation.success && validation.error.code === 'VALIDATION_ERROR',
        validation.error ? validation.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate missing username for password grant', false, ex.message || ex.toString());
}

// Test 10: Clear cache
Write('<h3>Test 10: Clear Cache</h3>');
try {
    var mockConn10 = new MockConnectionHandler();
    var auth10 = new OAuth2AuthStrategy({
        tokenUrl: 'https://auth.example.com/token',
        clientId: 'test_client',
        clientSecret: 'test_secret',
        grantType: 'client_credentials'
    }, mockConn10);

    var clearResult = auth10.clearCache();

    logTest('Should clear cache successfully',
        clearResult.success,
        clearResult.success ? 'Cache cleared' : (clearResult.error ? clearResult.error.message : 'Unknown error'));
} catch (ex) {
    logTest('Should clear cache successfully', false, ex.message || ex.toString());
}

// Summary
Write('<hr>');
Write('<h3>Test Summary</h3>');
Write('<div style="margin: 20px 0; padding: 15px; background-color: #f0f0f0; border-radius: 5px;">');
Write('<strong>Total Tests:</strong> ' + totalTests + '<br>');
Write('<strong>Passed:</strong> <span style="color: green;">' + passedTests + '</span><br>');
Write('<strong>Failed:</strong> <span style="color: red;">' + (totalTests - passedTests) + '</span><br>');
Write('<strong>Success Rate:</strong> ' + Math.round((passedTests / totalTests) * 100) + '%');
Write('</div>');

if (passedTests === totalTests) {
    Write('<div style="color: green; font-weight: bold; font-size: 1.2em;">✓ ALL TESTS PASSED</div>');
} else {
    Write('<div style="color: red; font-weight: bold; font-size: 1.2em;">✗ SOME TESTS FAILED</div>');
}

Write('<div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">');
Write('<strong>Note:</strong> These tests use a mock ConnectionHandler to avoid real OAuth2 API calls. ');
Write('Token caching functionality requires the OMG_FW_TokenCache Data Extension. ');
Write('Integration tests with real OAuth2 providers validate actual token acquisition and refresh.');
Write('</div>');

</script>
