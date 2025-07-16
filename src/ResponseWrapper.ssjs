<script runat="server">

function OmegaFrameworkResponse() {
    
    function createResponse(success, data, error, handler, operation) {
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
    
    function success(data, handler, operation) {
        return createResponse(true, data, null, handler, operation);
    }
    
    function error(errorCode, errorMessage, errorDetails, handler, operation) {
        var errorObj = {
            code: errorCode || 'UNKNOWN_ERROR',
            message: errorMessage || 'An unknown error occurred',
            details: errorDetails || {}
        };
        return createResponse(false, null, errorObj, handler, operation);
    }
    
    function httpError(statusCode, responseText, handler, operation) {
        var errorCode = 'HTTP_' + statusCode;
        var errorMessage = 'HTTP request failed with status ' + statusCode;
        var errorDetails = {
            statusCode: statusCode,
            responseText: responseText
        };
        return error(errorCode, errorMessage, errorDetails, handler, operation);
    }
    
    function validationError(field, message, handler, operation) {
        var errorCode = 'VALIDATION_ERROR';
        var errorMessage = 'Validation failed for field: ' + field;
        var errorDetails = {
            field: field,
            validationMessage: message
        };
        return error(errorCode, errorMessage, errorDetails, handler, operation);
    }
    
    function authError(message, handler, operation) {
        var errorCode = 'AUTH_ERROR';
        var errorMessage = message || 'Authentication failed';
        var errorDetails = {
            suggestion: 'Check your credentials and try again'
        };
        return error(errorCode, errorMessage, errorDetails, handler, operation);
    }
    
    return {
        success: success,
        error: error,
        httpError: httpError,
        validationError: validationError,
        authError: authError
    };
}

</script>