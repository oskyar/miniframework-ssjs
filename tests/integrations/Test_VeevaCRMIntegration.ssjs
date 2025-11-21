<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_VeevaCRMIntegration - Test file for Veeva CRM integration
 *
 * Tests Veeva CRM API integration with OAuth2 authentication
 *
 * @version 2.0.0
 */

// Load dependencies
</script>
%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_FW_BaseIntegration")=%%
%%=ContentBlockByKey("OMG_FW_OAuth2AuthStrategy")=%%
%%=ContentBlockByKey("OMG_FW_VeevaCRMIntegration")=%%
<script runat="server">

Write('<h2>VeevaCRMIntegration Test Suite</h2>');
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
    var veeva1 = new VeevaCRMIntegration({
        baseUrl: 'https://test.my.salesforce.com',
        apiVersion: 'v60.0',
        auth: {
            tokenUrl: 'https://test.salesforce.com/services/oauth2/token',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            username: 'test@example.com',
            password: 'password123token'
        }
    });

    var passed1 = veeva1 && typeof veeva1 === 'object';

    logTest('Should create instance with valid config', passed1,
        'Instance created: ' + (!!veeva1));
} catch (ex) {
    logTest('Should create instance with valid config', false, ex.message || ex.toString());
}

// Test 2: Validation - Missing SOQL query
Write('<h3>Test 2: Validation - Missing SOQL Query</h3>');
try {
    var veeva2 = new VeevaCRMIntegration({
        baseUrl: 'https://test.my.salesforce.com',
        auth: {
            tokenUrl: 'https://test.salesforce.com/services/oauth2/token',
            clientId: 'test-client',
            clientSecret: 'test-secret',
            username: 'test@example.com',
            password: 'password123'
        }
    });

    var queryResult = veeva2.query(null);
    var passed2 = !queryResult.success && queryResult.error.code === 'VALIDATION_ERROR';

    logTest('Should fail without SOQL query', passed2,
        queryResult.error ? queryResult.error.message : 'No error returned');
} catch (ex) {
    logTest('Should fail without SOQL query', false, ex.message || ex.toString());
}

// Test 3: Validation - Missing account ID
Write('<h3>Test 3: Validation - Missing Account ID</h3>');
try {
    var veeva3 = new VeevaCRMIntegration({
        baseUrl: 'https://test.my.salesforce.com',
        auth: {
            tokenUrl: 'https://test.salesforce.com/services/oauth2/token',
            clientId: 'test-client',
            clientSecret: 'test-secret',
            username: 'test@example.com',
            password: 'password123'
        }
    });

    var accountResult = veeva3.getAccount(null);
    var passed3 = !accountResult.success && accountResult.error.code === 'VALIDATION_ERROR';

    logTest('Should fail without account ID', passed3,
        accountResult.error ? accountResult.error.message : 'No error returned');
} catch (ex) {
    logTest('Should fail without account ID', false, ex.message || ex.toString());
}

// Test 4: Validation - Missing account name for create
Write('<h3>Test 4: Validation - Missing Account Name</h3>');
try {
    var veeva4 = new VeevaCRMIntegration({
        baseUrl: 'https://test.my.salesforce.com',
        auth: {
            tokenUrl: 'https://test.salesforce.com/services/oauth2/token',
            clientId: 'test-client',
            clientSecret: 'test-secret',
            username: 'test@example.com',
            password: 'password123'
        }
    });

    var createResult = veeva4.createAccount({});
    var passed4 = !createResult.success && createResult.error.code === 'VALIDATION_ERROR';

    logTest('Should fail without account name', passed4,
        createResult.error ? createResult.error.message : 'No error returned');
} catch (ex) {
    logTest('Should fail without account name', false, ex.message || ex.toString());
}

// Test 5: Check method existence - query
Write('<h3>Test 5: Method Existence - query</h3>');
try {
    var veeva5 = new VeevaCRMIntegration({
        baseUrl: 'https://test.my.salesforce.com',
        auth: {
            tokenUrl: 'https://test.salesforce.com/services/oauth2/token',
            clientId: 'test-client',
            clientSecret: 'test-secret',
            username: 'test@example.com',
            password: 'password123'
        }
    });

    var hasMethod = typeof veeva5.query === 'function';

    logTest('Should have query method', hasMethod, 'Method exists: ' + hasMethod);
} catch (ex) {
    logTest('Should have query method', false, ex.message || ex.toString());
}

// Test 6: Check method existence - getAccount
Write('<h3>Test 6: Method Existence - getAccount</h3>');
try {
    var veeva6 = new VeevaCRMIntegration({
        baseUrl: 'https://test.my.salesforce.com',
        auth: {
            tokenUrl: 'https://test.salesforce.com/services/oauth2/token',
            clientId: 'test-client',
            clientSecret: 'test-secret',
            username: 'test@example.com',
            password: 'password123'
        }
    });

    var hasMethod6 = typeof veeva6.getAccount === 'function';

    logTest('Should have getAccount method', hasMethod6, 'Method exists: ' + hasMethod6);
} catch (ex) {
    logTest('Should have getAccount method', false, ex.message || ex.toString());
}

// Test 7: Check method existence - createAccount
Write('<h3>Test 7: Method Existence - createAccount</h3>');
try {
    var veeva7 = new VeevaCRMIntegration({
        baseUrl: 'https://test.my.salesforce.com',
        auth: {
            tokenUrl: 'https://test.salesforce.com/services/oauth2/token',
            clientId: 'test-client',
            clientSecret: 'test-secret',
            username: 'test@example.com',
            password: 'password123'
        }
    });

    var hasMethod7 = typeof veeva7.createAccount === 'function';

    logTest('Should have createAccount method', hasMethod7, 'Method exists: ' + hasMethod7);
} catch (ex) {
    logTest('Should have createAccount method', false, ex.message || ex.toString());
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
Write('To test actual Veeva CRM API integration, you need:<br><br>');
Write('<ol>');
Write('<li>A Veeva CRM instance (built on Salesforce)</li>');
Write('<li>Connected App configured in Salesforce</li>');
Write('<li>Valid OAuth2 credentials (username, password, security token)</li>');
Write('<li>API access enabled for your user</li>');
Write('</ol>');
Write('</div>');

</script>
