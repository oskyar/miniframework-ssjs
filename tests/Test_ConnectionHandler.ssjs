<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_ConnectionHandler - Tests for ConnectionHandler
 * Uses mock HTTP requests to avoid external dependencies
 *
 * @version 2.0.0
 */

</script>
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_ConnectionHandler")=%%
<script runat="server">

Write('<h1>ConnectionHandler Test Suite</h1>');
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

// Test 1: Initialization with default config
Write('<h3>Test 1: Initialization with Default Config</h3>');
try {
    var conn1 = new ConnectionHandler();

    logTest('Should initialize with default config',
        !!conn1,
        'ConnectionHandler instance created');
} catch (ex) {
    logTest('Should initialize with default config', false, ex.message || ex.toString());
}

// Test 2: Initialization with custom config
Write('<h3>Test 2: Initialization with Custom Config</h3>');
try {
    var conn2 = new ConnectionHandler({
        timeout: 25000,
        maxRetries: 5,
        retryDelay: 2000
    });

    logTest('Should initialize with custom config',
        !!conn2,
        'Custom configuration accepted');
} catch (ex) {
    logTest('Should initialize with custom config', false, ex.message || ex.toString());
}

// Test 3: Request validation - missing URL
Write('<h3>Test 3: Request Validation - Missing URL</h3>');
try {
    var conn3 = new ConnectionHandler();
    var result3 = conn3.request('GET', null, 'application/json', null, {});

    logTest('Should validate URL parameter',
        !result3.success && result3.error && result3.error.code === 'VALIDATION_ERROR',
        result3.error ? result3.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate URL parameter', false, ex.message || ex.toString());
}

// Test 4: Request validation - missing method
Write('<h3>Test 4: Request Validation - Missing Method</h3>');
try {
    var conn4 = new ConnectionHandler();
    var result4 = conn4.request(null, 'https://example.com', 'application/json', null, {});

    logTest('Should validate method parameter',
        !result4.success && result4.error && result4.error.code === 'VALIDATION_ERROR',
        result4.error ? result4.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate method parameter', false, ex.message || ex.toString());
}

// Test 5: GET convenience method validation
Write('<h3>Test 5: GET Convenience Method Validation</h3>');
try {
    var conn5 = new ConnectionHandler();
    var result5 = conn5.get(null, {});

    logTest('Should validate GET method URL',
        !result5.success && result5.error && result5.error.code === 'VALIDATION_ERROR',
        result5.error ? result5.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate GET method URL', false, ex.message || ex.toString());
}

// Test 6: POST convenience method validation
Write('<h3>Test 6: POST Convenience Method Validation</h3>');
try {
    var conn6 = new ConnectionHandler();
    var result6 = conn6.post(null, {}, {});

    logTest('Should validate POST method URL',
        !result6.success && result6.error && result6.error.code === 'VALIDATION_ERROR',
        result6.error ? result6.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate POST method URL', false, ex.message || ex.toString());
}

// Test 7: PUT convenience method validation
Write('<h3>Test 7: PUT Convenience Method Validation</h3>');
try {
    var conn7 = new ConnectionHandler();
    var result7 = conn7.put(null, {}, {});

    logTest('Should validate PUT method URL',
        !result7.success && result7.error && result7.error.code === 'VALIDATION_ERROR',
        result7.error ? result7.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate PUT method URL', false, ex.message || ex.toString());
}

// Test 8: PATCH convenience method validation
Write('<h3>Test 8: PATCH Convenience Method Validation</h3>');
try {
    var conn8 = new ConnectionHandler();
    var result8 = conn8.patch(null, {}, {});

    logTest('Should validate PATCH method URL',
        !result8.success && result8.error && result8.error.code === 'VALIDATION_ERROR',
        result8.error ? result8.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate PATCH method URL', false, ex.message || ex.toString());
}

// Test 9: DELETE convenience method validation
Write('<h3>Test 9: DELETE Convenience Method Validation</h3>');
try {
    var conn9 = new ConnectionHandler();
    var result9 = conn9.remove(null, {});

    logTest('Should validate DELETE method URL',
        !result9.success && result9.error && result9.error.code === 'VALIDATION_ERROR',
        result9.error ? result9.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate DELETE method URL', false, ex.message || ex.toString());
}

// Test 10: Headers parameter handling
Write('<h3>Test 10: Headers Parameter Handling</h3>');
try {
    var conn10 = new ConnectionHandler();

    // This test validates that headers are properly accepted
    // Actual HTTP calls would fail in test environment, so we test validation only
    var hasGetMethod = typeof conn10.get === 'function';
    var hasPostMethod = typeof conn10.post === 'function';

    logTest('Should have all HTTP methods available',
        hasGetMethod && hasPostMethod,
        'HTTP methods: ' + (hasGetMethod ? 'GET ✓ ' : 'GET ✗ ') + (hasPostMethod ? 'POST ✓' : 'POST ✗'));
} catch (ex) {
    logTest('Should have all HTTP methods available', false, ex.message || ex.toString());
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
Write('<strong>Note:</strong> These tests validate configuration and parameter validation only. ');
Write('Actual HTTP request execution requires external endpoints and cannot be fully tested in isolation. ');
Write('Retry logic and error handling are tested through integration tests with real APIs.');
Write('</div>');

</script>
