<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_BaseIntegration - Test file for BaseIntegration
 *
 * Tests base integration functionality including HTTP methods,
 * authentication strategy management, and URL building
 *
 * @version 2.0.0
 */

// Load dependencies
</script>
%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_FW_BasicAuthStrategy")=%%
%%=ContentBlockByKey("OMG_FW_BaseIntegration")=%%
<script runat="server">

Write('<h2>BaseIntegration Test Suite</h2>');
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

// Test 1: Configuration validation - Missing baseUrl
Write('<h3>Test 1: Configuration Validation - Missing Base URL</h3>');
try {
    var base1 = new BaseIntegration('TestIntegration', {
        // Missing baseUrl
    });

    var validation = base1.validateConfig();
    var passed = validation && !validation.success && validation.error.code === 'VALIDATION_ERROR';

    logTest('Should fail without baseUrl', passed,
        validation ? validation.error.message : 'No error returned');
} catch (ex) {
    logTest('Should fail without baseUrl', false, ex.message || ex.toString());
}

// Test 2: Valid configuration
Write('<h3>Test 2: Valid Configuration</h3>');
try {
    var base2 = new BaseIntegration('TestIntegration', {
        baseUrl: 'https://api.example.com'
    });

    var validation2 = base2.validateConfig();
    var passed2 = validation2 === null;

    logTest('Should pass validation with baseUrl', passed2,
        validation2 ? 'Validation failed: ' + validation2.error.message : 'Config is valid');
} catch (ex) {
    logTest('Should pass validation with baseUrl', false, ex.message || ex.toString());
}

// Test 3: Set authentication strategy
Write('<h3>Test 3: Set Authentication Strategy</h3>');
try {
    var base3 = new BaseIntegration('TestIntegration', {
        baseUrl: 'https://api.example.com'
    });

    var authStrategy = new BasicAuthStrategy({
        username: 'test',
        password: 'test123'
    });

    base3.setAuthStrategy(authStrategy);

    logTest('Should set authentication strategy', true, 'Auth strategy set successfully');
} catch (ex) {
    logTest('Should set authentication strategy', false, ex.message || ex.toString());
}

// Test 4: Get authentication headers
Write('<h3>Test 4: Get Authentication Headers</h3>');
try {
    var base4 = new BaseIntegration('TestIntegration', {
        baseUrl: 'https://api.example.com'
    });

    var authStrategy4 = new BasicAuthStrategy({
        username: 'testuser',
        password: 'testpass'
    });

    base4.setAuthStrategy(authStrategy4);
    var headersResult = base4.getAuthHeaders();

    var passed4 = headersResult.success && headersResult.data && headersResult.data.Authorization;

    logTest('Should get authentication headers', passed4,
        headersResult.success ? 'Headers retrieved successfully' : headersResult.error.message);
} catch (ex) {
    logTest('Should get authentication headers', false, ex.message || ex.toString());
}

// Test 5: Build URL
Write('<h3>Test 5: Build URL</h3>');
try {
    var base5 = new BaseIntegration('TestIntegration', {
        baseUrl: 'https://api.example.com'
    });

    var fullUrl = base5.buildUrl('/users/123');
    var passed5 = fullUrl === 'https://api.example.com/users/123';

    logTest('Should build correct URL', passed5, 'URL: ' + fullUrl);
} catch (ex) {
    logTest('Should build correct URL', false, ex.message || ex.toString());
}

// Test 6: Build URL with trailing slash handling
Write('<h3>Test 6: Build URL - Trailing Slash Handling</h3>');
try {
    var base6 = new BaseIntegration('TestIntegration', {
        baseUrl: 'https://api.example.com/'
    });

    var fullUrl6 = base6.buildUrl('/users/123');
    var passed6 = fullUrl6 === 'https://api.example.com/users/123';

    logTest('Should handle trailing slashes correctly', passed6, 'URL: ' + fullUrl6);
} catch (ex) {
    logTest('Should handle trailing slashes correctly', false, ex.message || ex.toString());
}

// Test 7: HTTP GET method (without actual request)
Write('<h3>Test 7: HTTP GET Method Exists</h3>');
try {
    var base7 = new BaseIntegration('TestIntegration', {
        baseUrl: 'https://api.example.com'
    });

    var hasGet = typeof base7.get === 'function';

    logTest('Should have GET method', hasGet, 'GET method exists: ' + hasGet);
} catch (ex) {
    logTest('Should have GET method', false, ex.message || ex.toString());
}

// Test 8: HTTP POST method exists
Write('<h3>Test 8: HTTP POST Method Exists</h3>');
try {
    var base8 = new BaseIntegration('TestIntegration', {
        baseUrl: 'https://api.example.com'
    });

    var hasPost = typeof base8.post === 'function';

    logTest('Should have POST method', hasPost, 'POST method exists: ' + hasPost);
} catch (ex) {
    logTest('Should have POST method', false, ex.message || ex.toString());
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
Write('<h3>Note</h3>');
Write('<p><em>These tests validate BaseIntegration configuration, authentication strategy management, and URL building. ');
Write('To test actual HTTP requests, use the specific integration test files (SFMC, Veeva, Data Cloud).</em></p>');

</script>
