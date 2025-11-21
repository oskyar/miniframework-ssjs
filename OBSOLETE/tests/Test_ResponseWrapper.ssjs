%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%

<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: ResponseWrapper
// ============================================================================

Write('<h2>Testing ResponseWrapper</h2>');

try {
    var response = new OmegaFrameworkResponse();

    Write('<p><strong>Response object type:</strong> ' + (typeof response) + '</p>');
    Write('<p><strong>Response.success type:</strong> ' + (typeof response.success) + '</p>');
    // Test 1: Success response
    Write('<h3>Test 1: Success Response</h3>');
    var successResult = response.success({ message: 'Test data' }, 'TestHandler', 'testOperation');
    Write('<pre>' + Stringify(successResult, null, 2) + '</pre>');
    Write('<p>Status: ' + (successResult.success ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 2: Error response
    Write('<h3>Test 2: Error Response</h3>');
    var errorResult = response.error('TEST_ERROR', 'This is a test error', { detail: 'extra info' }, 'TestHandler', 'testOperation');
    Write('<pre>' + Stringify(errorResult, null, 2) + '</pre>');
    Write('<p>Status: ' + (!errorResult.success && errorResult.error ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 3: Validation error
    Write('<h3>Test 3: Validation Error</h3>');
    var validationResult = response.validationError('email', 'Invalid email format', 'TestHandler', 'testOperation');
    Write('<pre>' + Stringify(validationResult, null, 2) + '</pre>');
    Write('<p>Status: ' + (!validationResult.success && validationResult.error.code === 'VALIDATION_ERROR' ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 4: HTTP error
    Write('<h3>Test 4: HTTP Error</h3>');
    var httpResult = response.httpError(404, 'Not Found', 'TestHandler', 'testOperation');
    Write('<pre>' + Stringify(httpResult, null, 2) + '</pre>');
    Write('<p>Status: ' + (!httpResult.success && httpResult.error.code === 'HTTP_ERROR' ? '✅ PASS' : '❌ FAIL') + '</p>');

    Write('<hr><h3>✅ All ResponseWrapper tests completed</h3>');

} catch (ex) {
    Write('<p style="color:red;">❌ ERROR: ' + ex.toString() + '</p>');
}

</script>
