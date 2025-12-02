<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: ResponseWrapper with OmegaFramework
// ============================================================================

Write('<h2>Testing ResponseWrapper (OmegaFramework v3.0)</h2>');

try {
    // Load OmegaFramework
    Platform.Function.ContentBlockByKey("OMG_FW_OmegaFramework");

    if (typeof OmegaFramework === 'undefined') {
        throw new Error('OmegaFramework not loaded');
    }

    Write('<p>✅ OmegaFramework loaded</p>');

    // Require ResponseWrapper - OmegaFramework will load the Content Block automatically
    var response = OmegaFramework.require('ResponseWrapper', {});

    Write('<p><strong>Response object type:</strong> ' + (typeof response) + '</p>');
    Write('<p><strong>Response.success type:</strong> ' + (typeof response.success) + '</p>');

    // Test 1: Success response
    Write('<h3>Test 1: Success Response</h3>');
    var successResult = response.success({ message: 'Test data' }, 'TestHandler', 'testOperation');
    Write('<pre>' + Stringify(successResult, null, 2) + '</pre>');
    Write('<p>Status: ' + (successResult.success ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 2: Error response
    Write('<h3>Test 2: Error Response</h3>');
    var errorResult = response.error('This is a test error', 'TestHandler', 'testOperation', { detail: 'extra info' });
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
    Write('<p style="color:red;">❌ ERROR: ' + (ex.message || String(ex) || ex.toString() || 'Unknown error') + '</p>');
    Write('<p><strong>Error type:</strong> ' + (typeof ex) + '</p>');
    Write('<p><strong>Error object:</strong></p>');
    Write('<pre>' + Stringify(ex, null, 2) + '</pre>');
    if (ex.stack) {
        Write('<p><strong>Stack trace:</strong></p>');
        Write('<pre>' + ex.stack + '</pre>');
    }
}

</script>
