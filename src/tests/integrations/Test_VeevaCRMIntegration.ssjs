<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_VeevaCRMIntegration - Test file for Veeva CRM integration
 *
 * Tests Veeva CRM API integration with OAuth2 authentication
 * Uses OmegaFramework.create() pattern for instantiation
 *
 * @version 3.0.0
 */

// Load OmegaFramework
Platform.Function.ContentBlockByKey("OMG_FW_OmegaFramework");

// Load required dependencies
Platform.Function.ContentBlockByKey("OMG_FW_ResponseWrapper");
Platform.Function.ContentBlockByKey("OMG_FW_ConnectionHandler");
Platform.Function.ContentBlockByKey("OMG_FW_DataExtensionTokenCache");
Platform.Function.ContentBlockByKey("OMG_FW_BaseIntegration");
Platform.Function.ContentBlockByKey("OMG_FW_VeevaCRMIntegration");
</script>

<h2>VeevaCRMIntegration Test Suite v3.0</h2>
<p>Testing Veeva CRM Integration with OmegaFramework patterns</p>

<form method="POST" style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h3>Veeva CRM OAuth2 Credentials</h3>
    <p style="color: #666; font-size: 0.9em;">Veeva CRM uses Salesforce OAuth2 password grant authentication</p>

    <div style="margin-bottom: 15px;">
        <label><strong>Instance URL:</strong></label><br>
        <input type="text" name="baseUrl" value="%%=RequestParameter('baseUrl')=%%"
               placeholder="https://your-instance.my.salesforce.com" style="width: 400px; padding: 8px;">
        <br><small style="color: #666;">e.g., https://mycompany.my.salesforce.com</small>
    </div>

    <div style="margin-bottom: 15px;">
        <label><strong>Auth Base URL:</strong></label><br>
        <input type="text" name="authBaseUrl" value="%%=RequestParameter('authBaseUrl')=%%"
               placeholder="https://login.salesforce.com" style="width: 400px; padding: 8px;">
        <br><small style="color: #666;">Usually https://login.salesforce.com or https://test.salesforce.com</small>
    </div>

    <div style="margin-bottom: 15px;">
        <label><strong>API Version:</strong></label><br>
        <input type="text" name="apiVersion" value="%%=RequestParameter('apiVersion')=%%"
               placeholder="v60.0" style="width: 150px; padding: 8px;">
    </div>

    <div style="margin-bottom: 15px;">
        <label><strong>Client ID:</strong></label><br>
        <input type="text" name="clientId" value="%%=RequestParameter('clientId')=%%"
               placeholder="Connected App Consumer Key" style="width: 400px; padding: 8px;">
    </div>

    <div style="margin-bottom: 15px;">
        <label><strong>Client Secret:</strong></label><br>
        <input type="password" name="clientSecret" value="%%=RequestParameter('clientSecret')=%%"
               placeholder="Connected App Consumer Secret" style="width: 400px; padding: 8px;">
    </div>

    <div style="margin-bottom: 15px;">
        <label><strong>Username:</strong></label><br>
        <input type="text" name="username" value="%%=RequestParameter('username')=%%"
               placeholder="user@company.com" style="width: 400px; padding: 8px;">
    </div>

    <div style="margin-bottom: 15px;">
        <label><strong>Password:</strong></label><br>
        <input type="password" name="password" value="%%=RequestParameter('password')=%%"
               placeholder="Your password" style="width: 400px; padding: 8px;">
    </div>

    <div style="margin-bottom: 15px;">
        <label><strong>Security Token (optional):</strong></label><br>
        <input type="password" name="securityToken" value="%%=RequestParameter('securityToken')=%%"
               placeholder="Salesforce Security Token" style="width: 400px; padding: 8px;">
        <br><small style="color: #666;">Required if IP not whitelisted in Salesforce</small>
    </div>

    <button type="submit" style="background-color: #0176d3; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">
        Run Tests
    </button>
</form>

<script runat="server">
// Get credentials from form
var baseUrl = Request.GetFormField('baseUrl') || Request.GetQueryStringParameter('baseUrl');
var authBaseUrl = Request.GetFormField('authBaseUrl') || Request.GetQueryStringParameter('authBaseUrl') || 'https://login.salesforce.com';
var apiVersion = Request.GetFormField('apiVersion') || Request.GetQueryStringParameter('apiVersion') || 'v60.0';
var clientId = Request.GetFormField('clientId') || Request.GetQueryStringParameter('clientId');
var clientSecret = Request.GetFormField('clientSecret') || Request.GetQueryStringParameter('clientSecret');
var username = Request.GetFormField('username') || Request.GetQueryStringParameter('username');
var password = Request.GetFormField('password') || Request.GetQueryStringParameter('password');
var securityToken = Request.GetFormField('securityToken') || Request.GetQueryStringParameter('securityToken');

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

Write('<hr>');
Write('<h3>Test Results</h3>');

// ============================================================================
// UNIT TESTS (No credentials required)
// ============================================================================

Write('<h4>Unit Tests (No API calls)</h4>');

// Test 1: OmegaFramework availability
Write('<h5>Test 1: OmegaFramework Availability</h5>');
try {
    var frameworkAvailable = typeof OmegaFramework !== 'undefined' &&
                             typeof OmegaFramework.create === 'function';

    logTest('OmegaFramework should be available', frameworkAvailable,
        'OmegaFramework.create: ' + (typeof OmegaFramework !== 'undefined' ? typeof OmegaFramework.create : 'undefined'));
} catch (ex) {
    logTest('OmegaFramework should be available', false, ex.message || ex.toString());
}

// Test 2: VeevaCRMIntegration registration
Write('<h5>Test 2: VeevaCRMIntegration Registration</h5>');
try {
    var isRegistered = typeof OmegaFramework !== 'undefined' &&
                       OmegaFramework.isRegistered &&
                       OmegaFramework.isRegistered('VeevaCRMIntegration');

    logTest('VeevaCRMIntegration should be registered', isRegistered,
        'Registered: ' + isRegistered);
} catch (ex) {
    logTest('VeevaCRMIntegration should be registered', false, ex.message || ex.toString());
}

// Test 3: Create instance with OmegaFramework.create()
Write('<h5>Test 3: Instance Creation via OmegaFramework</h5>');
var veevaCRM = null;
try {
    var testConfig = {
        baseUrl: 'https://test.my.salesforce.com',
        authBaseUrl: 'https://test.salesforce.com',
        apiVersion: 'v60.0',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        username: 'test@example.com',
        password: 'testpassword123'
    };

    veevaCRM = OmegaFramework.create('VeevaCRMIntegration', testConfig);
    var instanceCreated = veevaCRM && typeof veevaCRM === 'object';

    logTest('Should create instance via OmegaFramework.create()', instanceCreated,
        'Instance type: ' + typeof veevaCRM);
} catch (ex) {
    logTest('Should create instance via OmegaFramework.create()', false, ex.message || ex.toString());
}

// Test 4: Method existence - query
Write('<h5>Test 4: Method Existence - query</h5>');
try {
    var hasQuery = veevaCRM && typeof veevaCRM.query === 'function';
    logTest('Should have query method', hasQuery, 'Method exists: ' + hasQuery);
} catch (ex) {
    logTest('Should have query method', false, ex.message || ex.toString());
}

// Test 5: Method existence - getAccount
Write('<h5>Test 5: Method Existence - getAccount</h5>');
try {
    var hasGetAccount = veevaCRM && typeof veevaCRM.getAccount === 'function';
    logTest('Should have getAccount method', hasGetAccount, 'Method exists: ' + hasGetAccount);
} catch (ex) {
    logTest('Should have getAccount method', false, ex.message || ex.toString());
}

// Test 6: Method existence - createAccount
Write('<h5>Test 6: Method Existence - createAccount</h5>');
try {
    var hasCreateAccount = veevaCRM && typeof veevaCRM.createAccount === 'function';
    logTest('Should have createAccount method', hasCreateAccount, 'Method exists: ' + hasCreateAccount);
} catch (ex) {
    logTest('Should have createAccount method', false, ex.message || ex.toString());
}

// Test 7: Method existence - getToken
Write('<h5>Test 7: Method Existence - getToken</h5>');
try {
    var hasGetToken = veevaCRM && typeof veevaCRM.getToken === 'function';
    logTest('Should have getToken method', hasGetToken, 'Method exists: ' + hasGetToken);
} catch (ex) {
    logTest('Should have getToken method', false, ex.message || ex.toString());
}

// Test 8: Method existence - Veeva-specific methods
Write('<h5>Test 8: Veeva CRM Specific Methods</h5>');
try {
    var hasCreateCall = veevaCRM && typeof veevaCRM.createCall === 'function';
    var hasGetCall = veevaCRM && typeof veevaCRM.getCall === 'function';
    var hasCreateSampleOrder = veevaCRM && typeof veevaCRM.createSampleOrder === 'function';

    var allVeevaMethods = hasCreateCall && hasGetCall && hasCreateSampleOrder;
    logTest('Should have Veeva CRM specific methods', allVeevaMethods,
        'createCall: ' + hasCreateCall + ', getCall: ' + hasGetCall + ', createSampleOrder: ' + hasCreateSampleOrder);
} catch (ex) {
    logTest('Should have Veeva CRM specific methods', false, ex.message || ex.toString());
}

// Test 9: Validation - Missing SOQL query
Write('<h5>Test 9: Validation - Missing SOQL Query</h5>');
try {
    var queryResult = veevaCRM.query(null);
    var validationPassed = !queryResult.success && queryResult.error && queryResult.error.code === 'VALIDATION_ERROR';

    logTest('Should fail without SOQL query', validationPassed,
        queryResult.error ? queryResult.error.message : 'No error returned');
} catch (ex) {
    logTest('Should fail without SOQL query', false, ex.message || ex.toString());
}

// Test 10: Validation - Missing account ID
Write('<h5>Test 10: Validation - Missing Account ID</h5>');
try {
    var accountResult = veevaCRM.getAccount(null);
    var accountValidation = !accountResult.success && accountResult.error && accountResult.error.code === 'VALIDATION_ERROR';

    logTest('Should fail without account ID', accountValidation,
        accountResult.error ? accountResult.error.message : 'No error returned');
} catch (ex) {
    logTest('Should fail without account ID', false, ex.message || ex.toString());
}

// Test 11: Validation - Missing account name for create
Write('<h5>Test 11: Validation - Missing Account Name</h5>');
try {
    var createResult = veevaCRM.createAccount({});
    var createValidation = !createResult.success && createResult.error && createResult.error.code === 'VALIDATION_ERROR';

    logTest('Should fail without account name', createValidation,
        createResult.error ? createResult.error.message : 'No error returned');
} catch (ex) {
    logTest('Should fail without account name', false, ex.message || ex.toString());
}

// Test 12: Validation - Custom object methods
Write('<h5>Test 12: Validation - Custom Object Methods</h5>');
try {
    var customObjResult = veevaCRM.getCustomObject(null, null);
    var customValidation = !customObjResult.success && customObjResult.error && customObjResult.error.code === 'VALIDATION_ERROR';

    logTest('Should validate custom object parameters', customValidation,
        customObjResult.error ? customObjResult.error.message : 'No error returned');
} catch (ex) {
    logTest('Should validate custom object parameters', false, ex.message || ex.toString());
}

// ============================================================================
// INTEGRATION TESTS (Requires credentials)
// ============================================================================

Write('<hr>');
Write('<h4>Integration Tests (Requires valid credentials)</h4>');

if (baseUrl && clientId && clientSecret && username && password) {

    // Create real instance with provided credentials
    var realConfig = {
        baseUrl: baseUrl,
        authBaseUrl: authBaseUrl,
        apiVersion: apiVersion,
        clientId: clientId,
        clientSecret: clientSecret,
        username: username,
        password: password,
        securityToken: securityToken || ''
    };

    var realVeevaCRM = null;

    // Test 13: Create instance with real credentials
    Write('<h5>Test 13: Instance Creation with Real Credentials</h5>');
    try {
        realVeevaCRM = OmegaFramework.create('VeevaCRMIntegration', realConfig);
        var realInstanceCreated = realVeevaCRM && typeof realVeevaCRM === 'object';

        logTest('Should create instance with real credentials', realInstanceCreated,
            'Instance created: ' + realInstanceCreated);
    } catch (ex) {
        logTest('Should create instance with real credentials', false, ex.message || ex.toString());
    }

    // Test 14: OAuth2 Authentication
    Write('<h5>Test 14: OAuth2 Password Grant Authentication</h5>');
    var tokenResult = null;
    try {
        if (realVeevaCRM) {
            tokenResult = realVeevaCRM.getToken();
            var authPassed = tokenResult.success && tokenResult.data && tokenResult.data.accessToken;

            logTest('Should authenticate successfully', authPassed,
                authPassed ? 'Token obtained, instance URL: ' + (tokenResult.data.instanceUrl || 'N/A') :
                            (tokenResult.error ? tokenResult.error.message : 'Unknown error'));
        } else {
            logTest('Should authenticate successfully', false, 'Instance not created');
        }
    } catch (ex) {
        logTest('Should authenticate successfully', false, ex.message || ex.toString());
    }

    // Test 15: SOQL Query
    Write('<h5>Test 15: SOQL Query Execution</h5>');
    try {
        if (realVeevaCRM && tokenResult && tokenResult.success) {
            var soqlResult = realVeevaCRM.query('SELECT Id, Name FROM Account LIMIT 5');
            var queryPassed = soqlResult.success;

            var queryDetails = queryPassed ?
                'Records found: ' + (soqlResult.data && soqlResult.data.parsedContent ?
                    soqlResult.data.parsedContent.totalSize : 'N/A') :
                (soqlResult.error ? soqlResult.error.message : 'Unknown error');

            logTest('Should execute SOQL query', queryPassed, queryDetails);
        } else {
            logTest('Should execute SOQL query', false, 'Authentication failed or instance not created');
        }
    } catch (ex) {
        logTest('Should execute SOQL query', false, ex.message || ex.toString());
    }

    // Test 16: Token Refresh
    Write('<h5>Test 16: Token Refresh</h5>');
    try {
        if (realVeevaCRM && tokenResult && tokenResult.success) {
            var refreshResult = realVeevaCRM.refreshToken();
            var refreshPassed = refreshResult.success && refreshResult.data && refreshResult.data.accessToken;

            logTest('Should refresh token', refreshPassed,
                refreshPassed ? 'New token obtained' :
                               (refreshResult.error ? refreshResult.error.message : 'Unknown error'));
        } else {
            logTest('Should refresh token', false, 'Authentication failed or instance not created');
        }
    } catch (ex) {
        logTest('Should refresh token', false, ex.message || ex.toString());
    }

    // Test 17: Clear Token Cache
    Write('<h5>Test 17: Clear Token Cache</h5>');
    try {
        if (realVeevaCRM) {
            var clearResult = realVeevaCRM.clearTokenCache();
            var clearPassed = clearResult.success;

            logTest('Should clear token cache', clearPassed,
                clearPassed ? 'Cache cleared successfully' :
                             (clearResult.error ? clearResult.error.message : 'Unknown error'));
        } else {
            logTest('Should clear token cache', false, 'Instance not created');
        }
    } catch (ex) {
        logTest('Should clear token cache', false, ex.message || ex.toString());
    }

} else {
    Write('<div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 10px 0;">');
    Write('<strong>⚠️ Credentials Required</strong><br>');
    Write('Please provide Veeva CRM/Salesforce credentials above to run integration tests.');
    Write('</div>');
}

// ============================================================================
// SUMMARY
// ============================================================================

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
Write('<div style="background-color: #e7f3ff; padding: 15px; border-left: 4px solid #0176d3; margin: 10px 0;">');
Write('<strong>📋 Veeva CRM Integration Details</strong><br><br>');
Write('<ul>');
Write('<li><strong>Authentication:</strong> OAuth2 Password Grant (Salesforce-based)</li>');
Write('<li><strong>API:</strong> Salesforce REST API with Veeva custom objects</li>');
Write('<li><strong>Common Objects:</strong> Call2_vod__c, Sample_Order_vod__c, Account, Contact</li>');
Write('</ul>');
Write('</div>');

Write('<div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 10px 0;">');
Write('<strong>⚠️ Prerequisites for Integration Tests</strong><br><br>');
Write('<ol>');
Write('<li>A Veeva CRM instance (built on Salesforce)</li>');
Write('<li>Connected App configured in Salesforce Setup</li>');
Write('<li>Valid OAuth2 credentials (Client ID, Client Secret)</li>');
Write('<li>Username + Password + Security Token (if IP not whitelisted)</li>');
Write('<li>API access enabled for your Salesforce user</li>');
Write('</ol>');
Write('</div>');

</script>
