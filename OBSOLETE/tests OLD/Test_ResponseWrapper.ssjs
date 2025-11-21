<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_ResponseWrapper - Tests for ResponseWrapper
 * No external dependencies needed
 */

</script>
%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
<script runat="server">

Write('<h1>ResponseWrapper Test Suite</h1>');
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

// Test 1: Success response
Write('<h3>Test 1: Success Response</h3>');
try {
    var rw = new ResponseWrapper();
Write(Stringify(rw));

    var result = rw.success({ test: 'data' }, 'TestHandler', 'testOp');

    logTest('Should create success response',
        result.success === true && result.data.test === 'data' && result.error === null,
        'Success: ' + result.success);
} catch (ex) {
    logTest('Should create success response', false, ex.message);
}

// Test 2: Error response
Write('<h3>Test 2: Error Response</h3>');
try {
    var rw2 = new ResponseWrapper();
    var result2 = rw2.error('Test error', 'TestHandler', 'testOp');

    logTest('Should create error response',
        result2.success === false && result2.error && result2.error.code === 'ERROR',
        'Error code: ' + (result2.error ? result2.error.code : 'N/A'));
} catch (ex) {
    logTest('Should create error response', false, ex.message);
}

// Test 3: Validation error
Write('<h3>Test 3: Validation Error</h3>');
try {
    var rw3 = new ResponseWrapper();
    var result3 = rw3.validationError('testField', 'Field is required', 'TestHandler', 'testOp');

    logTest('Should create validation error',
        result3.error && result3.error.code === 'VALIDATION_ERROR' && result3.error.details.field === 'testField',
        'Field: ' + (result3.error ? result3.error.details.field : 'N/A'));
} catch (ex) {
    logTest('Should create validation error', false, ex.message);
}

// Test 4: Auth error
Write('<h3>Test 4: Auth Error</h3>');
try {
    var rw4 = new ResponseWrapper();
    var result4 = rw4.authError('Auth failed', 'TestHandler', 'testOp');

    logTest('Should create auth error',
        result4.error && result4.error.code === 'AUTH_ERROR',
        'Error code: ' + (result4.error ? result4.error.code : 'N/A'));
} catch (ex) {
    logTest('Should create auth error', false, ex.message);
}

// Test 5: HTTP error
Write('<h3>Test 5: HTTP Error</h3>');
try {
    var rw5 = new ResponseWrapper();
    var result5 = rw5.httpError(404, 'Not Found', 'TestHandler', 'testOp', 'Response body');

    logTest('Should create HTTP error',
        result5.error && result5.error.code === 'HTTP_ERROR' && result5.error.details.statusCode === 404,
        'Status: ' + (result5.error ? result5.error.details.statusCode : 'N/A'));
} catch (ex) {
    logTest('Should create HTTP error', false, ex.message);
}

// Test 6: Not found error
Write('<h3>Test 6: Not Found Error</h3>');
try {
    var rw6 = new ResponseWrapper();
    var result6 = rw6.notFoundError('TestResource', 'TestHandler', 'testOp');

    logTest('Should create not found error',
        result6.error && result6.error.code === 'NOT_FOUND',
        'Resource: ' + (result6.error ? result6.error.details.resource : 'N/A'));
} catch (ex) {
    logTest('Should create not found error', false, ex.message);
}

// Test 7: Meta information
Write('<h3>Test 7: Meta Information</h3>');
try {
    var rw7 = new ResponseWrapper();
    var result7 = rw7.success({}, 'TestHandler', 'testOp');

    logTest('Should include meta information',
        result7.meta && result7.meta.handler === 'TestHandler' && result7.meta.operation === 'testOp',
        'Handler: ' + result7.meta.handler + ', Operation: ' + result7.meta.operation);
} catch (ex) {
    logTest('Should include meta information', false, ex.message);
}

// Test 8: Timestamp
Write('<h3>Test 8: Timestamp</h3>');
try {
    var rw8 = new ResponseWrapper();
    var result8 = rw8.success({}, 'TestHandler', 'testOp');

    logTest('Should include timestamp',
        result8.meta && result8.meta.datetime && typeof result8.meta.datetime == 'object',
        'datetime: ' + result8.meta.datetime);
} catch (ex) {
    logTest('Should include timestamp', false, ex.message);
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

</script>
