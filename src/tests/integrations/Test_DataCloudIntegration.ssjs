<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_DataCloudIntegration - Test file for Salesforce Data Cloud integration
 *
 * Tests Data Cloud API integration with OAuth2 authentication
 *
 * @version 1.0.0
 */

// Load dependencies (DataCloudIntegration handles OAuth2 internally)
</script>
%%=ContentBlockByName("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByName("OMG_FW_ConnectionHandler")=%%
%%=ContentBlockByName("OMG_FW_DataExtensionTokenCache")=%%
%%=ContentBlockByName("OMG_FW_BaseIntegration")=%%
%%=ContentBlockByName("OMG_FW_DataCloudIntegration")=%%
<script runat="server">

Write('<h2>DataCloudIntegration Test Suite</h2>');
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

// Test 1: Configuration validation
Write('<h3>Test 1: Valid Configuration Structure</h3>');
try {
    var dc1 = new DataCloudIntegration({
        baseUrl: 'https://api.example.datacloud.salesforce.com',
        auth: {
            tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            scope: 'cdp_api'
        }
    });

    var passed1 = dc1 && typeof dc1 === 'object';

    logTest('Should create instance with valid config', passed1,
        'Instance created: ' + (!!dc1));
} catch (ex) {
    logTest('Should create instance with valid config', false, ex.message || ex.toString());
}

// Test 2: Validation - Missing source name for ingest
Write('<h3>Test 2: Validation - Missing Source Name</h3>');
try {
    var dc2 = new DataCloudIntegration({
        baseUrl: 'https://api.example.datacloud.salesforce.com',
        auth: {
            tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
            clientId: 'test-client',
            clientSecret: 'test-secret'
        }
    });

    var ingestResult = dc2.ingestData(null, [{id: 1, name: 'test'}]);
    var passed2 = !ingestResult.success && ingestResult.error.code === 'VALIDATION_ERROR';

    logTest('Should fail without source name', passed2,
        ingestResult.error ? ingestResult.error.message : 'No error returned');
} catch (ex) {
    logTest('Should fail without source name', false, ex.message || ex.toString());
}

// Test 3: Validation - Missing records for ingest
Write('<h3>Test 3: Validation - Missing Records</h3>');
try {
    var dc3 = new DataCloudIntegration({
        baseUrl: 'https://api.example.datacloud.salesforce.com',
        auth: {
            tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
            clientId: 'test-client',
            clientSecret: 'test-secret'
        }
    });

    var ingestResult3 = dc3.ingestData('TestSource', []);
    var passed3 = !ingestResult3.success && ingestResult3.error.code === 'VALIDATION_ERROR';

    logTest('Should fail without records', passed3,
        ingestResult3.error ? ingestResult3.error.message : 'No error returned');
} catch (ex) {
    logTest('Should fail without records', false, ex.message || ex.toString());
}

// Test 4: Validation - Missing SQL query
Write('<h3>Test 4: Validation - Missing SQL Query</h3>');
try {
    var dc4 = new DataCloudIntegration({
        baseUrl: 'https://api.example.datacloud.salesforce.com',
        auth: {
            tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
            clientId: 'test-client',
            clientSecret: 'test-secret'
        }
    });

    var queryResult = dc4.query(null);
    var passed4 = !queryResult.success && queryResult.error.code === 'VALIDATION_ERROR';

    logTest('Should fail without SQL query', passed4,
        queryResult.error ? queryResult.error.message : 'No error returned');
} catch (ex) {
    logTest('Should fail without SQL query', false, ex.message || ex.toString());
}

// Test 5: Validation - Missing individual ID for profile
Write('<h3>Test 5: Validation - Missing Individual ID</h3>');
try {
    var dc5 = new DataCloudIntegration({
        baseUrl: 'https://api.example.datacloud.salesforce.com',
        auth: {
            tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
            clientId: 'test-client',
            clientSecret: 'test-secret'
        }
    });

    var profileResult = dc5.getProfile(null);
    var passed5 = !profileResult.success && profileResult.error.code === 'VALIDATION_ERROR';

    logTest('Should fail without individual ID', passed5,
        profileResult.error ? profileResult.error.message : 'No error returned');
} catch (ex) {
    logTest('Should fail without individual ID', false, ex.message || ex.toString());
}

// Test 6: Check method existence - ingestData
Write('<h3>Test 6: Method Existence - ingestData</h3>');
try {
    var dc6 = new DataCloudIntegration({
        baseUrl: 'https://api.example.datacloud.salesforce.com',
        auth: {
            tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
            clientId: 'test-client',
            clientSecret: 'test-secret'
        }
    });

    var hasMethod = typeof dc6.ingestData === 'function';

    logTest('Should have ingestData method', hasMethod, 'Method exists: ' + hasMethod);
} catch (ex) {
    logTest('Should have ingestData method', false, ex.message || ex.toString());
}

// Test 7: Check method existence - query
Write('<h3>Test 7: Method Existence - query</h3>');
try {
    var dc7 = new DataCloudIntegration({
        baseUrl: 'https://api.example.datacloud.salesforce.com',
        auth: {
            tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
            clientId: 'test-client',
            clientSecret: 'test-secret'
        }
    });

    var hasMethod7 = typeof dc7.query === 'function';

    logTest('Should have query method', hasMethod7, 'Method exists: ' + hasMethod7);
} catch (ex) {
    logTest('Should have query method', false, ex.message || ex.toString());
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
Write('These tests validate configuration and validation logic without making actual API calls. ');
Write('To test actual Data Cloud API integration, you need:<br><br>');
Write('<ol>');
Write('<li>A Salesforce Data Cloud instance</li>');
Write('<li>Connected App with API access</li>');
Write('<li>Valid OAuth2 credentials</li>');
Write('<li>Data sources configured in Data Cloud</li>');
Write('</ol>');
Write('</div>');

</script>
