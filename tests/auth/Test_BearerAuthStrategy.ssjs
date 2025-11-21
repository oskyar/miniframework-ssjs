<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_BearerAuthStrategy - Test file for Bearer token authentication strategy
 *
 * Tests Bearer token header generation
 *
 * @version 1.0.0
 */

// Load dependencies
</script>
%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_BearerAuthStrategy")=%%
<script runat="server">

Write('<h2>BearerAuthStrategy Test Suite</h2>');
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

// Test 1: Validation - Missing token
Write('<h3>Test 1: Validation - Missing Token</h3>');
try {
    var auth1 = new BearerAuthStrategy({
        // Missing token
    });

    var validation = auth1.validateConfig();
    var passed = validation && !validation.success && validation.error.code === 'VALIDATION_ERROR';

    logTest('Should return validation error for missing token', passed,
        validation ? validation.error.message : 'No error returned');
} catch (ex) {
    logTest('Should return validation error for missing token', false, ex.message || ex.toString());
}

// Test 2: Valid configuration
Write('<h3>Test 2: Valid Configuration</h3>');
try {
    var auth2 = new BearerAuthStrategy({
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature'
    });

    var validation2 = auth2.validateConfig();
    var passed2 = validation2 === null;

    logTest('Should pass validation with token', passed2,
        validation2 ? 'Validation failed: ' + validation2.error.message : 'Config is valid');
} catch (ex) {
    logTest('Should pass validation with token', false, ex.message || ex.toString());
}

// Test 3: Header generation with valid config
Write('<h3>Test 3: Header Generation</h3>');
try {
    var testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';

    var auth3 = new BearerAuthStrategy({
        token: testToken
    });

    var headersResult = auth3.getHeaders();
    var passed3 = headersResult.success &&
                  headersResult.data &&
                  headersResult.data.hasOwnProperty('Authorization') &&
                  headersResult.data.Authorization === 'Bearer ' + testToken;

    var authHeader = headersResult.success ? headersResult.data.Authorization : 'N/A';

    logTest('Should generate Bearer Auth header', passed3,
        'Authorization header: ' + authHeader.substring(0, 30) + '...');
} catch (ex) {
    logTest('Should generate Bearer Auth header', false, ex.message || ex.toString());
}

// Test 4: Header includes Content-Type
Write('<h3>Test 4: Content-Type Header</h3>');
try {
    var auth4 = new BearerAuthStrategy({
        token: 'test-token-12345'
    });

    var headersResult4 = auth4.getHeaders();
    var passed4 = headersResult4.success &&
                  headersResult4.data &&
                  headersResult4.data['Content-Type'] === 'application/json';

    logTest('Should include Content-Type header', passed4,
        'Content-Type: ' + (headersResult4.data ? headersResult4.data['Content-Type'] : 'N/A'));
} catch (ex) {
    logTest('Should include Content-Type header', false, ex.message || ex.toString());
}

// Test 5: Header generation fails without token
Write('<h3>Test 5: Header Generation Without Token</h3>');
try {
    var auth5 = new BearerAuthStrategy({
        // Missing token
    });

    var headersResult5 = auth5.getHeaders();
    var passed5 = !headersResult5.success && headersResult5.error;

    logTest('Should fail to generate headers without token', passed5,
        headersResult5.error ? headersResult5.error.message : 'Headers generated unexpectedly');
} catch (ex) {
    logTest('Should fail to generate headers without token', false, ex.message || ex.toString());
}

// Test 6: Token format verification (JWT-like)
Write('<h3>Test 6: JWT Token Format</h3>');
try {
    var jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    var auth6 = new BearerAuthStrategy({
        token: jwtToken
    });

    var headersResult6 = auth6.getHeaders();
    var passed6 = headersResult6.success &&
                  headersResult6.data.Authorization === 'Bearer ' + jwtToken;

    logTest('Should handle JWT token format', passed6,
        'JWT token accepted: ' + passed6);
} catch (ex) {
    logTest('Should handle JWT token format', false, ex.message || ex.toString());
}

// Test 7: Simple token format
Write('<h3>Test 7: Simple Token Format</h3>');
try {
    var simpleToken = 'sk-1234567890abcdef';

    var auth7 = new BearerAuthStrategy({
        token: simpleToken
    });

    var headersResult7 = auth7.getHeaders();
    var passed7 = headersResult7.success &&
                  headersResult7.data.Authorization === 'Bearer ' + simpleToken;

    logTest('Should handle simple token format', passed7,
        'Simple token accepted: ' + passed7);
} catch (ex) {
    logTest('Should handle simple token format', false, ex.message || ex.toString());
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
Write('<p><em>These tests validate Bearer token header generation with various token formats (JWT and simple tokens). ');
Write('To test actual API authentication, use the integration test files with valid bearer tokens from your API provider.</em></p>');

</script>
