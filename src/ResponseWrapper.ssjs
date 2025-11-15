<script runat="server">
Platform.Load("core", "1.1.1");

function OmegaFrameworkResponse() {

    var createResponse = function(success, data, error, handler, operation) {
        var response = {
            success: success || false,
            data: data || null,
            error: error || null,
            meta: {
                timestamp: new Date(),
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

</script>