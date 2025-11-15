<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_BearerAuthStrategy - Tests for BearerAuthStrategy
 * Minimal dependencies - tests Bearer Token authentication logic
 *
 * @version 2.0.0
 */

</script>
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_BearerAuthStrategy")=%%
<script runat="server">

Write('<h1>BearerAuthStrategy Test Suite</h1>');
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

// Test 1: Initialization validation - missing token
Write('<h3>Test 1: Initialization Validation - Missing Token</h3>');
try {
    var auth1 = new BearerAuthStrategy({
        // Missing token
    });

    var validation = auth1.validateConfig();

    logTest('Should validate missing token',
        !validation.success && validation.error.code === 'VALIDATION_ERROR',
        validation.error ? validation.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate missing token', false, ex.message || ex.toString());
}

// Test 2: Initialization validation - empty token
Write('<h3>Test 2: Initialization Validation - Empty Token</h3>');
try {
    var auth2 = new BearerAuthStrategy({
        token: ''
    });

    var validation = auth2.validateConfig();

    logTest('Should validate empty token',
        !validation.success && validation.error.code === 'VALIDATION_ERROR',
        validation.error ? validation.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate empty token', false, ex.message || ex.toString());
}

// Test 3: Successful initialization
Write('<h3>Test 3: Successful Initialization</h3>');
try {
    var auth3 = new BearerAuthStrategy({
        token: 'test_bearer_token_12345'
    });

    var validation = auth3.validateConfig();

    logTest('Should initialize with valid config',
        validation.success,
        'BearerAuth strategy initialized successfully');
} catch (ex) {
    logTest('Should initialize with valid config', false, ex.message || ex.toString());
}

// Test 4: Get headers - should return Authorization header
Write('<h3>Test 4: Get Headers - Authorization Header</h3>');
try {
    var auth4 = new BearerAuthStrategy({
        token: 'test_bearer_token_12345'
    });

    var headersResult = auth4.getHeaders();

    logTest('Should return authorization headers',
        headersResult.success && headersResult.data && headersResult.data.Authorization,
        headersResult.success ? 'Authorization header present' : (headersResult.error ? headersResult.error.message : 'Unknown error'));
} catch (ex) {
    logTest('Should return authorization headers', false, ex.message || ex.toString());
}

// Test 5: Authorization header format - should start with "Bearer "
Write('<h3>Test 5: Authorization Header Format</h3>');
try {
    var auth5 = new BearerAuthStrategy({
        token: 'test_bearer_token_12345'
    });

    var headersResult = auth5.getHeaders();
    var authHeader = headersResult.data ? headersResult.data.Authorization : '';

    logTest('Should have "Bearer " prefix',
        authHeader.indexOf('Bearer ') === 0,
        'Authorization header: ' + authHeader);
} catch (ex) {
    logTest('Should have "Bearer " prefix', false, ex.message || ex.toString());
}

// Test 6: Authorization header contains token
Write('<h3>Test 6: Authorization Header Contains Token</h3>');
try {
    var testToken = 'my_special_token_xyz';
    var auth6 = new BearerAuthStrategy({
        token: testToken
    });

    var headersResult = auth6.getHeaders();
    var authHeader = headersResult.data ? headersResult.data.Authorization : '';

    logTest('Should contain the provided token',
        authHeader.indexOf(testToken) > -1,
        'Token found in header: ' + (authHeader.indexOf(testToken) > -1));
} catch (ex) {
    logTest('Should contain the provided token', false, ex.message || ex.toString());
}

// Test 7: Content-Type header
Write('<h3>Test 7: Content-Type Header</h3>');
try {
    var auth7 = new BearerAuthStrategy({
        token: 'test_bearer_token_12345'
    });

    var headersResult = auth7.getHeaders();

    logTest('Should include Content-Type header',
        headersResult.success && headersResult.data && headersResult.data['Content-Type'] === 'application/json',
        'Content-Type: ' + (headersResult.data ? headersResult.data['Content-Type'] : 'N/A'));
} catch (ex) {
    logTest('Should include Content-Type header', false, ex.message || ex.toString());
}

// Test 8: Consistent header generation
Write('<h3>Test 8: Consistent Header Generation</h3>');
try {
    var auth8 = new BearerAuthStrategy({
        token: 'test_bearer_token_12345'
    });

    var headers1 = auth8.getHeaders();
    var headers2 = auth8.getHeaders();

    logTest('Should generate consistent headers',
        headers1.data.Authorization === headers2.data.Authorization,
        'Headers match: ' + (headers1.data.Authorization === headers2.data.Authorization));
} catch (ex) {
    logTest('Should generate consistent headers', false, ex.message || ex.toString());
}

// Test 9: Different tokens produce different headers
Write('<h3>Test 9: Different Tokens Produce Different Headers</h3>');
try {
    var auth9a = new BearerAuthStrategy({
        token: 'token_abc_123'
    });

    var auth9b = new BearerAuthStrategy({
        token: 'token_xyz_789'
    });

    var headers1 = auth9a.getHeaders();
    var headers2 = auth9b.getHeaders();

    logTest('Should generate different headers for different tokens',
        headers1.data.Authorization !== headers2.data.Authorization,
        'Headers differ: ' + (headers1.data.Authorization !== headers2.data.Authorization));
} catch (ex) {
    logTest('Should generate different headers for different tokens', false, ex.message || ex.toString());
}

// Test 10: Long token handling
Write('<h3>Test 10: Long Token Handling</h3>');
try {
    var longToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    var auth10 = new BearerAuthStrategy({
        token: longToken
    });

    var headersResult = auth10.getHeaders();
    var authHeader = headersResult.data ? headersResult.data.Authorization : '';

    logTest('Should handle long tokens (e.g., JWT)',
        authHeader.indexOf(longToken) > -1,
        'Long token length: ' + longToken.length + ' chars');
} catch (ex) {
    logTest('Should handle long tokens (e.g., JWT)', false, ex.message || ex.toString());
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

Write('<div style="margin-top: 20px; padding: 15px; background-color: #d1ecf1; border-left: 4px solid #0c5460;">');
Write('<strong>Info:</strong> BearerAuthStrategy is used for static bearer tokens (e.g., API keys, JWT tokens). ');
Write('Common use cases include Veeva Vault, webhooks, and services with pre-generated tokens. ');
Write('These tests validate configuration and header generation. No external dependencies required.');
Write('</div>');

</script>
