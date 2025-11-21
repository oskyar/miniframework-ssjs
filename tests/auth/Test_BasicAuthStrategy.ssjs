<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_BasicAuthStrategy - Test file for Basic authentication strategy
 *
 * Tests HTTP Basic Auth header generation
 *
 * @version 1.0.0
 */

// Load dependencies
</script>
%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_BasicAuthStrategy")=%%
<script runat="server">

Write('<h2>BasicAuthStrategy Test Suite</h2>');
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

// Test 1: Validation - Missing username
Write('<h3>Test 1: Validation - Missing Username</h3>');
try {
    var auth1 = new BasicAuthStrategy({
        password: 'test-password'
        // Missing username
    });

    var validation = auth1.validateConfig();
    var passed = validation && !validation.success && validation.error.code === 'VALIDATION_ERROR';

    logTest('Should return validation error for missing username', passed,
        validation ? validation.error.message : 'No error returned');
} catch (ex) {
    logTest('Should return validation error for missing username', false, ex.message || ex.toString());
}

// Test 2: Validation - Missing password
Write('<h3>Test 2: Validation - Missing Password</h3>');
try {
    var auth2 = new BasicAuthStrategy({
        username: 'test-user'
        // Missing password
    });

    var validation2 = auth2.validateConfig();
    var passed2 = validation2 && !validation2.success && validation2.error.code === 'VALIDATION_ERROR';

    logTest('Should return validation error for missing password', passed2,
        validation2 ? validation2.error.message : 'No error returned');
} catch (ex) {
    logTest('Should return validation error for missing password', false, ex.message || ex.toString());
}

// Test 3: Valid configuration
Write('<h3>Test 3: Valid Configuration</h3>');
try {
    var auth3 = new BasicAuthStrategy({
        username: 'test-user',
        password: 'test-password'
    });

    var validation3 = auth3.validateConfig();
    var passed3 = validation3 === null;

    logTest('Should pass validation with complete config', passed3,
        validation3 ? 'Validation failed: ' + validation3.error.message : 'Config is valid');
} catch (ex) {
    logTest('Should pass validation with complete config', false, ex.message || ex.toString());
}

// Test 4: Header generation with valid config
Write('<h3>Test 4: Header Generation</h3>');
try {
    var auth4 = new BasicAuthStrategy({
        username: 'testuser',
        password: 'testpass123'
    });

    var headersResult = auth4.getHeaders();
    var passed4 = headersResult.success &&
                  headersResult.data &&
                  headersResult.data.hasOwnProperty('Authorization') &&
                  headersResult.data.Authorization.indexOf('Basic ') === 0;

    var authHeader = headersResult.success ? headersResult.data.Authorization : 'N/A';

    logTest('Should generate Basic Auth header', passed4,
        'Authorization header: ' + authHeader.substring(0, 20) + '...');
} catch (ex) {
    logTest('Should generate Basic Auth header', false, ex.message || ex.toString());
}

// Test 5: Header includes Content-Type
Write('<h3>Test 5: Content-Type Header</h3>');
try {
    var auth5 = new BasicAuthStrategy({
        username: 'testuser',
        password: 'testpass123'
    });

    var headersResult5 = auth5.getHeaders();
    var passed5 = headersResult5.success &&
                  headersResult5.data &&
                  headersResult5.data['Content-Type'] === 'application/json';

    logTest('Should include Content-Type header', passed5,
        'Content-Type: ' + (headersResult5.data ? headersResult5.data['Content-Type'] : 'N/A'));
} catch (ex) {
    logTest('Should include Content-Type header', false, ex.message || ex.toString());
}

// Test 6: Header generation fails without validation
Write('<h3>Test 6: Header Generation Without Valid Config</h3>');
try {
    var auth6 = new BasicAuthStrategy({
        username: 'testuser'
        // Missing password
    });

    var headersResult6 = auth6.getHeaders();
    var passed6 = !headersResult6.success && headersResult6.error;

    logTest('Should fail to generate headers with invalid config', passed6,
        headersResult6.error ? headersResult6.error.message : 'Headers generated unexpectedly');
} catch (ex) {
    logTest('Should fail to generate headers with invalid config', false, ex.message || ex.toString());
}

// Test 7: Base64 encoding verification
Write('<h3>Test 7: Base64 Encoding Verification</h3>');
try {
    var auth7 = new BasicAuthStrategy({
        username: 'admin',
        password: 'password123'
    });

    var headersResult7 = auth7.getHeaders();

    if (headersResult7.success) {
        var authHeader7 = headersResult7.data.Authorization;
        var base64Part = authHeader7.replace('Basic ', '');

        // Verify it's a valid base64 string (basic check)
        var isBase64 = /^[A-Za-z0-9+/=]+$/.test(base64Part);

        logTest('Should generate valid Base64 encoded credentials', isBase64,
            'Base64 format valid: ' + isBase64);
    } else {
        logTest('Should generate valid Base64 encoded credentials', false,
            'Failed to generate headers');
    }
} catch (ex) {
    logTest('Should generate valid Base64 encoded credentials', false, ex.message || ex.toString());
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
Write('<p><em>These tests validate Basic Auth header generation and Base64 encoding. ');
Write('To test actual API authentication, use the integration test files with valid credentials.</em></p>');

</script>
