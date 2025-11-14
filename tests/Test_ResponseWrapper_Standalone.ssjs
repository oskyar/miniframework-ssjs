<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// INLINE ResponseWrapper (sin necesidad de Content Block)
// ============================================================================

function OmegaFrameworkResponse() {

    var createResponse = function(success, data, error, handler, operation) {
        var response = {
            success: success || false,
            data: data || null,
            error: error || null,
            meta: {
                timestamp: new Date().toISOString(),
                handler: handler || 'unknown',
                operation: operation || 'unknown'
            }
        };
        return response;
    }

    this.success = function(data, handler, operation) {
        return createResponse(true, data, null, handler, operation);
    }

    this.error = function(errorCode, errorMessage, errorDetails, handler, operation) {
        var errorObj = {
            code: errorCode || 'UNKNOWN_ERROR',
            message: errorMessage || 'An unknown error occurred',
            details: errorDetails || {}
        };
        return createResponse(false, null, errorObj, handler, operation);
    }

    this.httpError = function(statusCode, responseText, handler, operation) {
        var errorCode = 'HTTP_ERROR';
        var errorMessage = 'HTTP request failed with status ' + statusCode;
        var errorDetails = {
            statusCode: statusCode,
            responseText: responseText
        };
        return this.error(errorCode, errorMessage, errorDetails, handler, operation);
    }

    this.validationError = function(field, message, handler, operation) {
        var errorCode = 'VALIDATION_ERROR';
        var errorMessage = 'Validation failed for field: ' + field;
        var errorDetails = {
            field: field,
            validationMessage: message
        };
        return this.error(errorCode, errorMessage, errorDetails, handler, operation);
    }

    this.authError = function(message, handler, operation) {
        var errorCode = 'AUTH_ERROR';
        var errorMessage = message || 'Authentication failed';
        var errorDetails = {
            suggestion: 'Check your credentials and try again'
        };
        return this.error(errorCode, errorMessage, errorDetails, handler, operation);
    }
}

// ============================================================================
// TEST: ResponseWrapper
// ============================================================================

Write('<h2>Testing ResponseWrapper (Standalone)</h2>');

try {
    var response = new OmegaFrameworkResponse();

    Write('<p>Response object created: ' + (typeof response) + '</p>');
    Write('<p>Response.success is: ' + (typeof response.success) + '</p>');

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
    Write('<pre>' + ex.stack + '</pre>');
}

</script>
