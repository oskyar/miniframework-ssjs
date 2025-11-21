<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_SFMCIntegration - Test file for Salesforce Marketing Cloud integration
 *
 * Tests SFMC REST API integration with OAuth2 authentication
 *
 * @version 1.0.0
 */

// Load dependencies
</script>
%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_FW_BaseIntegration")=%%
%%=ContentBlockByKey("OMG_FW_OAuth2AuthStrategy")=%%
%%=ContentBlockByKey("OMG_FW_SFMCIntegration")=%%
<script runat="server">

Write('<h2>SFMCIntegration Test Suite</h2>');
Write('<hr>');

var testResults = [];
var totalTests = 0;
var passedTests = 0;

/**
 * Helper function to log test results
 */
function logTest(testName, passed, details) {
    totalTests++;
    if (passed) {
        passedTests++;
    }

    testResults.push({
        name: testName,
        passed: passed,
        details: details
    });

    var status = passed ? '✓ PASS' : '✗ FAIL';
    var color = passed ? 'green' : 'red';

    Write('<div style="color: ' + color + '; margin: 10px 0;">');
    Write('<strong>' + status + '</strong>: ' + testName);
    if (details) {
        Write('<br><span style="margin-left: 20px; font-size: 0.9em;">' + details + '</span>');
    }
    Write('</div>');
}

// Test 1: Configuration validation - Missing authBaseUrl
Write('<h3>Test 1: Configuration Validation - Missing Auth Base URL</h3>');
try {
    var sfmc1 = new SFMCIntegration({
        clientId: 'test-client',
        clientSecret: 'test-secret'
        // Missing authBaseUrl
    });

    // Try to get token - should fail validation
    var tokenResult = sfmc1.getToken();
    var passed = !tokenResult.success && tokenResult.error;

    logTest('Should fail without authBaseUrl', passed,
        tokenResult.error ? tokenResult.error.message : 'No error returned');
} catch (ex) {
    logTest('Should fail without authBaseUrl', false, ex.message || ex.toString());
}

// Test 2: Configuration validation - Missing clientId
Write('<h3>Test 2: Configuration Validation - Missing Client ID</h3>');
try {
    var sfmc2 = new SFMCIntegration({
        authBaseUrl: 'https://test.auth.marketingcloudapis.com/',
        clientSecret: 'test-secret'
        // Missing clientId
    });

    var tokenResult2 = sfmc2.getToken();
    var passed2 = !tokenResult2.success && tokenResult2.error;

    logTest('Should fail without clientId', passed2,
        tokenResult2.error ? tokenResult2.error.message : 'No error returned');
} catch (ex) {
    logTest('Should fail without clientId', false, ex.message || ex.toString());
}

// Test 3: Valid configuration structure
Write('<h3>Test 3: Valid Configuration Structure</h3>');
try {
    var sfmc3 = new SFMCIntegration({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        authBaseUrl: 'https://test.auth.marketingcloudapis.com/',
        restBaseUrl: 'https://test.rest.marketingcloudapis.com/'
    });

    // Check if instance was created
    var passed3 = sfmc3 && typeof sfmc3 === 'object';

    logTest('Should create instance with valid config', passed3,
        'Instance created: ' + (!!sfmc3));
} catch (ex) {
    logTest('Should create instance with valid config', false, ex.message || ex.toString());
}

// Test 4: Check token expired status (initially should be true)
Write('<h3>Test 4: Token Expired Status (No Token)</h3>');
try {
    var sfmc4 = new SFMCIntegration({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        authBaseUrl: 'https://test.auth.marketingcloudapis.com/'
    });

    var isExpired = sfmc4.isTokenExpired();
    var passed4 = isExpired === true;

    logTest('Should report token as expired when no token exists', passed4,
        'Token expired: ' + isExpired);
} catch (ex) {
    logTest('Should report token as expired when no token exists', false, ex.message || ex.toString());
}

// Test 5: Clear token cache
Write('<h3>Test 5: Clear Token Cache</h3>');
try {
    var sfmc5 = new SFMCIntegration({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        authBaseUrl: 'https://test.auth.marketingcloudapis.com/'
    });

    // Clear cache should not throw error
    sfmc5.clearTokenCache();

    logTest('Should clear token cache without errors', true,
        'Cache cleared successfully');
} catch (ex) {
    logTest('Should clear token cache without errors', false, ex.message || ex.toString());
}

// Test 6: REST URL retrieval (should fail without valid token)
Write('<h3>Test 6: REST URL Retrieval</h3>');
try {
    var sfmc6 = new SFMCIntegration({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        authBaseUrl: 'https://test.auth.marketingcloudapis.com/',
        restBaseUrl: 'https://test.rest.marketingcloudapis.com/'
    });

    var restUrl = sfmc6.getRestUrl();

    // Without valid authentication, should use configured restBaseUrl or fail
    var passed6 = typeof restUrl === 'string' ||
                  (typeof restUrl === 'object' && !restUrl.success);

    logTest('Should handle REST URL retrieval', passed6,
        'REST URL type: ' + typeof restUrl);
} catch (ex) {
    logTest('Should handle REST URL retrieval', false, ex.message || ex.toString());
}

// Test 7: SOAP URL retrieval
Write('<h3>Test 7: SOAP URL Retrieval</h3>');
try {
    var sfmc7 = new SFMCIntegration({
        clientId: 'test-client',
        clientSecret: 'test-secret',
        authBaseUrl: 'https://test.auth.marketingcloudapis.com/',
        soapBaseUrl: 'https://test.soap.marketingcloudapis.com/'
    });

    var soapUrl = sfmc7.getSoapUrl();

    var passed7 = typeof soapUrl === 'string' ||
                  (typeof soapUrl === 'object' && !soapUrl.success);

    logTest('Should handle SOAP URL retrieval', passed7,
        'SOAP URL type: ' + typeof soapUrl);
} catch (ex) {
    logTest('Should handle SOAP URL retrieval', false, ex.message || ex.toString());
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

Write('<hr>');
Write('<h3>Important Notes</h3>');
Write('<div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 10px 0;">');
Write('<strong>⚠️ End-to-End Testing</strong><br>');
Write('These tests validate configuration and methods without making actual API calls. ');
Write('To test actual SFMC REST API integration:<br><br>');
Write('<ol>');
Write('<li>Create an Installed Package in SFMC Setup with REST API permissions</li>');
Write('<li>Get your Client ID and Client Secret</li>');
Write('<li>Update the configuration below with your real credentials</li>');
Write('<li>Uncomment and run the E2E test</li>');
Write('</ol>');
Write('</div>');

Write('<h3>Example End-to-End Test (Commented)</h3>');
Write('<pre style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto;">');
Write('/*\n');
Write('// Uncomment this section and add your real SFMC credentials\n');
Write('var realConfig = {\n');
Write('    clientId: "YOUR_CLIENT_ID",\n');
Write('    clientSecret: "YOUR_CLIENT_SECRET",\n');
Write('    authBaseUrl: "https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/"\n');
Write('};\n\n');
Write('var sfmcReal = new SFMCIntegration(realConfig);\n\n');
Write('// Test 1: Get OAuth token\n');
Write('var tokenResult = sfmcReal.getToken();\n');
Write('Write("Token Result: " + Stringify(tokenResult));\n\n');
Write('// Test 2: Make a REST API request\n');
Write('var assetsResult = sfmcReal.makeRestRequest("GET", "/asset/v1/content/assets");\n');
Write('Write("Assets Result: " + Stringify(assetsResult));\n');
Write('*/\n');
Write('</pre>');

</script>
