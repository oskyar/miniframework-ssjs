<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_BasicAuthStrategy - Tests for BasicAuthStrategy
 * Minimal dependencies - tests Basic Authentication logic
 *
 * @version 2.0.0
 */

</script>
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_BasicAuthStrategy")=%%
<script runat="server">

Write('<h1>BasicAuthStrategy Test Suite</h1>');
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

// Test 1: Initialization validation - missing username
Write('<h3>Test 1: Initialization Validation - Missing Username</h3>');
try {
    var auth1 = new BasicAuthStrategy({
        password: 'test_password'
        // Missing username
    });

    var validation = auth1.validateConfig();

    logTest('Should validate missing username',
        !validation.success && validation.error.code === 'VALIDATION_ERROR',
        validation.error ? validation.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate missing username', false, ex.message || ex.toString());
}

// Test 2: Initialization validation - missing password
Write('<h3>Test 2: Initialization Validation - Missing Password</h3>');
try {
    var auth2 = new BasicAuthStrategy({
        username: 'test_user'
        // Missing password
    });

    var validation = auth2.validateConfig();

    logTest('Should validate missing password',
        !validation.success && validation.error.code === 'VALIDATION_ERROR',
        validation.error ? validation.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate missing password', false, ex.message || ex.toString());
}

// Test 3: Successful initialization
Write('<h3>Test 3: Successful Initialization</h3>');
try {
    var auth3 = new BasicAuthStrategy({
        username: 'test_user',
        password: 'test_password'
    });

    var validation = auth3.validateConfig();

    logTest('Should initialize with valid config',
        validation.success,
        'BasicAuth strategy initialized successfully');
} catch (ex) {
    logTest('Should initialize with valid config', false, ex.message || ex.toString());
}

// Test 4: Get headers - should return Authorization header
Write('<h3>Test 4: Get Headers - Authorization Header</h3>');
try {
    var auth4 = new BasicAuthStrategy({
        username: 'test_user',
        password: 'test_password'
    });

    var headersResult = auth4.getHeaders();

    logTest('Should return authorization headers',
        headersResult.success && headersResult.data && headersResult.data.Authorization,
        headersResult.success ? 'Authorization header present' : (headersResult.error ? headersResult.error.message : 'Unknown error'));
} catch (ex) {
    logTest('Should return authorization headers', false, ex.message || ex.toString());
}

// Test 5: Authorization header format - should start with "Basic "
Write('<h3>Test 5: Authorization Header Format</h3>');
try {
    var auth5 = new BasicAuthStrategy({
        username: 'test_user',
        password: 'test_password'
    });

    var headersResult = auth5.getHeaders();
    var authHeader = headersResult.data ? headersResult.data.Authorization : '';

    logTest('Should have "Basic " prefix',
        authHeader.indexOf('Basic ') === 0,
        'Authorization header: ' + (authHeader.length > 50 ? authHeader.substring(0, 50) + '...' : authHeader));
} catch (ex) {
    logTest('Should have "Basic " prefix', false, ex.message || ex.toString());
}

// Test 6: Content-Type header
Write('<h3>Test 6: Content-Type Header</h3>');
try {
    var auth6 = new BasicAuthStrategy({
        username: 'test_user',
        password: 'test_password'
    });

    var headersResult = auth6.getHeaders();

    logTest('Should include Content-Type header',
        headersResult.success && headersResult.data && headersResult.data['Content-Type'] === 'application/json',
        'Content-Type: ' + (headersResult.data ? headersResult.data['Content-Type'] : 'N/A'));
} catch (ex) {
    logTest('Should include Content-Type header', false, ex.message || ex.toString());
}

// Test 7: Consistent header generation
Write('<h3>Test 7: Consistent Header Generation</h3>');
try {
    var auth7 = new BasicAuthStrategy({
        username: 'test_user',
        password: 'test_password'
    });

    var headers1 = auth7.getHeaders();
    var headers2 = auth7.getHeaders();

    logTest('Should generate consistent headers',
        headers1.data.Authorization === headers2.data.Authorization,
        'Headers match: ' + (headers1.data.Authorization === headers2.data.Authorization));
} catch (ex) {
    logTest('Should generate consistent headers', false, ex.message || ex.toString());
}

// Test 8: Different credentials produce different headers
Write('<h3>Test 8: Different Credentials Produce Different Headers</h3>');
try {
    var auth8a = new BasicAuthStrategy({
        username: 'user1',
        password: 'password1'
    });

    var auth8b = new BasicAuthStrategy({
        username: 'user2',
        password: 'password2'
    });

    var headers1 = auth8a.getHeaders();
    var headers2 = auth8b.getHeaders();

    logTest('Should generate different headers for different credentials',
        headers1.data.Authorization !== headers2.data.Authorization,
        'Headers differ: ' + (headers1.data.Authorization !== headers2.data.Authorization));
} catch (ex) {
    logTest('Should generate different headers for different credentials', false, ex.message || ex.toString());
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
Write('<strong>Info:</strong> BasicAuthStrategy is a simple authentication method that encodes username:password in Base64. ');
Write('These tests validate configuration, header generation, and consistency. No external dependencies required.');
Write('</div>');

</script>
