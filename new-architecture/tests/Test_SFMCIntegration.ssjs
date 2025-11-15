<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_SFMCIntegration - Tests for SFMCIntegration
 * Uses mock dependencies to avoid real SFMC API calls
 *
 * @version 2.0.0
 */

</script>
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_DataExtensionTokenCache")=%%
%%=ContentBlockByKey("OMG_OAuth2AuthStrategy")=%%
%%=ContentBlockByKey("OMG_BaseIntegration")=%%
%%=ContentBlockByKey("OMG_SFMCIntegration")=%%
<script runat="server">

Write('<h1>SFMCIntegration Test Suite</h1>');
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
        // Mock OAuth2 token response
        if (url.indexOf('/v2/token') > -1) {
            return response.success({
                parsedContent: {
                    access_token: 'mock_token_12345',
                    token_type: 'Bearer',
                    expires_in: 3600,
                    rest_instance_url: 'https://mock.rest.marketingcloudapis.com/'
                }
            }, 'MockConnection', 'post');
        }

        // Mock generic POST response
        return response.success({
            parsedContent: { created: true }
        }, 'MockConnection', 'post');
    };

    this.get = function(url, headers) {
        return response.success({
            parsedContent: { items: [], count: 0 }
        }, 'MockConnection', 'get');
    };

    this.put = function(url, data, headers) {
        return response.success({
            parsedContent: { updated: true }
        }, 'MockConnection', 'put');
    };

    this.patch = function(url, data, headers) {
        return response.success({
            parsedContent: { updated: true }
        }, 'MockConnection', 'patch');
    };

    this.remove = function(url, headers) {
        return response.success({
            parsedContent: { deleted: true }
        }, 'MockConnection', 'remove');
    };

    this.request = function(method, url, contentType, payload, headers) {
        if (method === 'GET') return this.get(url, headers);
        if (method === 'POST') return this.post(url, payload, headers);
        if (method === 'PUT') return this.put(url, payload, headers);
        if (method === 'PATCH') return this.patch(url, payload, headers);
        if (method === 'DELETE') return this.remove(url, headers);
        return response.success({}, 'MockConnection', 'request');
    };
}

// Test 1: Initialization validation - missing clientId
Write('<h3>Test 1: Initialization Validation - Missing clientId</h3>');
try {
    var mockConn1 = new MockConnectionHandler();
    var sfmc1 = new SFMCIntegration({
        authBaseUrl: 'https://auth.example.com/',
        clientSecret: 'secret',
        restBaseUrl: 'https://rest.example.com/'
        // Missing clientId
    }, mockConn1);

    var validation = sfmc1.validateConfig();

    logTest('Should validate missing clientId',
        !validation.success && validation.error.code === 'VALIDATION_ERROR',
        validation.error ? validation.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate missing clientId', false, ex.message || ex.toString());
}

// Test 2: Initialization validation - missing clientSecret
Write('<h3>Test 2: Initialization Validation - Missing clientSecret</h3>');
try {
    var mockConn2 = new MockConnectionHandler();
    var sfmc2 = new SFMCIntegration({
        authBaseUrl: 'https://auth.example.com/',
        clientId: 'test_client',
        restBaseUrl: 'https://rest.example.com/'
        // Missing clientSecret
    }, mockConn2);

    var validation = sfmc2.validateConfig();

    logTest('Should validate missing clientSecret',
        !validation.success && validation.error.code === 'VALIDATION_ERROR',
        validation.error ? validation.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate missing clientSecret', false, ex.message || ex.toString());
}

// Test 3: Initialization validation - missing authBaseUrl
Write('<h3>Test 3: Initialization Validation - Missing authBaseUrl</h3>');
try {
    var mockConn3 = new MockConnectionHandler();
    var sfmc3 = new SFMCIntegration({
        clientId: 'test_client',
        clientSecret: 'secret',
        restBaseUrl: 'https://rest.example.com/'
        // Missing authBaseUrl
    }, mockConn3);

    var validation = sfmc3.validateConfig();

    logTest('Should validate missing authBaseUrl',
        !validation.success && validation.error.code === 'VALIDATION_ERROR',
        validation.error ? validation.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate missing authBaseUrl', false, ex.message || ex.toString());
}

// Test 4: Successful initialization
Write('<h3>Test 4: Successful Initialization</h3>');
try {
    var mockConn4 = new MockConnectionHandler();
    var sfmc4 = new SFMCIntegration({
        authBaseUrl: 'https://auth.example.com/',
        clientId: 'test_client',
        clientSecret: 'secret',
        restBaseUrl: 'https://rest.example.com/'
    }, mockConn4);

    var validation = sfmc4.validateConfig();

    logTest('Should initialize with valid config',
        validation.success,
        'SFMCIntegration initialized successfully');
} catch (ex) {
    logTest('Should initialize with valid config', false, ex.message || ex.toString());
}

// Test 5: Get token
Write('<h3>Test 5: Get Token</h3>');
try {
    var mockConn5 = new MockConnectionHandler();
    var sfmc5 = new SFMCIntegration({
        authBaseUrl: 'https://auth.example.com/',
        clientId: 'test_client',
        clientSecret: 'secret',
        restBaseUrl: 'https://rest.example.com/'
    }, mockConn5);

    var tokenResult = sfmc5.getToken();

    logTest('Should get token successfully',
        tokenResult.success && tokenResult.data && tokenResult.data.access_token,
        tokenResult.success ? 'Token obtained' : (tokenResult.error ? tokenResult.error.message : 'Unknown error'));
} catch (ex) {
    logTest('Should get token successfully', false, ex.message || ex.toString());
}

// Test 6: Get REST URL
Write('<h3>Test 6: Get REST URL</h3>');
try {
    var mockConn6 = new MockConnectionHandler();
    var sfmc6 = new SFMCIntegration({
        authBaseUrl: 'https://auth.example.com/',
        clientId: 'test_client',
        clientSecret: 'secret',
        restBaseUrl: 'https://rest.example.com/'
    }, mockConn6);

    var restUrl = sfmc6.getRestUrl();

    logTest('Should return REST URL',
        restUrl === 'https://rest.example.com/',
        'REST URL: ' + restUrl);
} catch (ex) {
    logTest('Should return REST URL', false, ex.message || ex.toString());
}

// Test 7: Get SOAP URL
Write('<h3>Test 7: Get SOAP URL</h3>');
try {
    var mockConn7 = new MockConnectionHandler();
    var sfmc7 = new SFMCIntegration({
        authBaseUrl: 'https://auth.example.com/',
        clientId: 'test_client',
        clientSecret: 'secret',
        restBaseUrl: 'https://rest.example.com/',
        soapBaseUrl: 'https://soap.example.com/'
    }, mockConn7);

    var soapUrl = sfmc7.getSoapUrl();

    logTest('Should return SOAP URL',
        soapUrl === 'https://soap.example.com/',
        'SOAP URL: ' + soapUrl);
} catch (ex) {
    logTest('Should return SOAP URL', false, ex.message || ex.toString());
}

// Test 8: Make REST request
Write('<h3>Test 8: Make REST Request</h3>');
try {
    var mockConn8 = new MockConnectionHandler();
    var sfmc8 = new SFMCIntegration({
        authBaseUrl: 'https://auth.example.com/',
        clientId: 'test_client',
        clientSecret: 'secret',
        restBaseUrl: 'https://rest.example.com/'
    }, mockConn8);

    var result = sfmc8.makeRestRequest('GET', '/asset/v1/content/assets', null, {});

    logTest('Should make REST request successfully',
        result.success,
        result.success ? 'Request completed' : (result.error ? result.error.message : 'Unknown error'));
} catch (ex) {
    logTest('Should make REST request successfully', false, ex.message || ex.toString());
}

// Test 9: List assets
Write('<h3>Test 9: List Assets</h3>');
try {
    var mockConn9 = new MockConnectionHandler();
    var sfmc9 = new SFMCIntegration({
        authBaseUrl: 'https://auth.example.com/',
        clientId: 'test_client',
        clientSecret: 'secret',
        restBaseUrl: 'https://rest.example.com/'
    }, mockConn9);

    var result = sfmc9.listAssets();

    logTest('Should list assets successfully',
        result.success,
        result.success ? 'Assets listed' : (result.error ? result.error.message : 'Unknown error'));
} catch (ex) {
    logTest('Should list assets successfully', false, ex.message || ex.toString());
}

// Test 10: Clear token cache
Write('<h3>Test 10: Clear Token Cache</h3>');
try {
    var mockConn10 = new MockConnectionHandler();
    var sfmc10 = new SFMCIntegration({
        authBaseUrl: 'https://auth.example.com/',
        clientId: 'test_client',
        clientSecret: 'secret',
        restBaseUrl: 'https://rest.example.com/'
    }, mockConn10);

    var result = sfmc10.clearTokenCache();

    logTest('Should clear token cache successfully',
        result.success,
        result.success ? 'Cache cleared' : (result.error ? result.error.message : 'Unknown error'));
} catch (ex) {
    logTest('Should clear token cache successfully', false, ex.message || ex.toString());
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
Write('<strong>Note:</strong> These tests use mock ConnectionHandler and avoid real SFMC API calls. ');
Write('Token caching requires OMG_FW_TokenCache Data Extension. ');
Write('Integration tests with real SFMC credentials validate actual API functionality.');
Write('</div>');

</script>
