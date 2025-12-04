<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: BearerAuthStrategy with OmegaFramework
// ============================================================================

Write('<h2>Testing BearerAuthStrategy (OmegaFramework v3.0)</h2>');

try {
    // Load OmegaFramework
    Platform.Function.ContentBlockByKey("OMG_FW_OmegaFramework");

    if (typeof OmegaFramework === 'undefined') {
        throw new Error('OmegaFramework not loaded');
    }

    Write('<p>✅ OmegaFramework loaded</p>');

    // Load dependencies
    Platform.Function.ContentBlockByKey("OMG_FW_ResponseWrapper");
    Platform.Function.ContentBlockByKey("OMG_FW_BearerAuthStrategy");

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

    // Test 1: Create using OmegaFramework.require
    Write('<h3>Test 1: Create BearerAuthStrategy using OmegaFramework</h3>');
    try {
        var auth1 = OmegaFramework.require('BearerAuthStrategy', {
            token: 'test-token-123'
        });

        var passed1 = typeof auth1.getHeaders === 'function' &&
                      typeof auth1.validateConfig === 'function';

        logTest('Should create BearerAuthStrategy via OmegaFramework.require', passed1,
            'Instance created with required methods');
    } catch (ex) {
        logTest('Should create BearerAuthStrategy via OmegaFramework.require', false, ex.message || ex.toString());
    }

    // Test 2: Validation - Missing token
    Write('<h3>Test 2: Validation - Missing Token</h3>');
    try {
        var response2 = OmegaFramework.require('ResponseWrapper', {});
        var auth2 = new BearerAuthStrategy(response2, {
            // Missing token
        });

        var validation = auth2.validateConfig();
        var passed = validation && !validation.success && validation.error.code === 'VALIDATION_ERROR';

        logTest('Should return validation error for missing token', passed,
            validation ? validation.error.message : 'No error returned');
    } catch (ex) {
        logTest('Should return validation error for missing token', false, ex.message || ex.toString());
    }

    // Test 3: Valid configuration
    Write('<h3>Test 3: Valid Configuration</h3>');
    try {
        var auth3 = OmegaFramework.require('BearerAuthStrategy', {
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature'
        });

        var validation3 = auth3.validateConfig();
        var passed3 = validation3 === null;

        logTest('Should pass validation with token', passed3,
            validation3 ? 'Validation failed: ' + validation3.error.message : 'Config is valid');
    } catch (ex) {
        logTest('Should pass validation with token', false, ex.message || ex.toString());
    }

    // Test 4: Header generation with valid config
    Write('<h3>Test 4: Header Generation</h3>');
    try {
        var testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';

        var auth4 = OmegaFramework.require('BearerAuthStrategy', {
            token: testToken
        });

        var headersResult = auth4.getHeaders();
        var passed4 = headersResult.success &&
                      headersResult.data &&
                      headersResult.data.hasOwnProperty('Authorization') &&
                      headersResult.data.Authorization === 'Bearer ' + testToken;

        var authHeader = headersResult.success ? headersResult.data.Authorization : 'N/A';

        logTest('Should generate Bearer Auth header', passed4,
            'Authorization header: ' + authHeader.substring(0, 30) + '...');
    } catch (ex) {
        logTest('Should generate Bearer Auth header', false, ex.message || ex.toString());
    }

    // Test 5: Header includes Content-Type
    Write('<h3>Test 5: Content-Type Header</h3>');
    try {
        var auth5 = OmegaFramework.require('BearerAuthStrategy', {
            token: 'test-token-12345'
        });

        var headersResult5 = auth5.getHeaders();
        var passed5 = headersResult5.success &&
                      headersResult5.data &&
                      headersResult5.data['Content-Type'] === 'application/json';

        logTest('Should include Content-Type header', passed5,
            'Content-Type: ' + (headersResult5.data ? headersResult5.data['Content-Type'] : 'N/A'));
    } catch (ex) {
        logTest('Should include Content-Type header', false, ex.message || ex.toString());
    }

    // Test 6: Header generation fails without token
    Write('<h3>Test 6: Header Generation Without Token</h3>');
    try {
        var response6 = OmegaFramework.require('ResponseWrapper', {});
        var auth6 = new BearerAuthStrategy(response6, {
            // Missing token
        });

        var headersResult6 = auth6.getHeaders();
        var passed6 = !headersResult6.success && headersResult6.error;

        logTest('Should fail to generate headers without token', passed6,
            headersResult6.error ? headersResult6.error.message : 'Headers generated unexpectedly');
    } catch (ex) {
        logTest('Should fail to generate headers without token', false, ex.message || ex.toString());
    }

    // Test 7: JWT Token Format
    Write('<h3>Test 7: JWT Token Format</h3>');
    try {
        var jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

        var auth7 = OmegaFramework.require('BearerAuthStrategy', {
            token: jwtToken
        });

        var headersResult7 = auth7.getHeaders();
        var passed7 = headersResult7.success &&
                      headersResult7.data.Authorization === 'Bearer ' + jwtToken;

        logTest('Should handle JWT token format', passed7,
            'JWT token accepted: ' + passed7);
    } catch (ex) {
        logTest('Should handle JWT token format', false, ex.message || ex.toString());
    }

    // Test 8: Simple token format
    Write('<h3>Test 8: Simple Token Format</h3>');
    try {
        var simpleToken = 'sk-1234567890abcdef';

        var auth8 = OmegaFramework.require('BearerAuthStrategy', {
            token: simpleToken
        });

        var headersResult8 = auth8.getHeaders();
        var passed8 = headersResult8.success &&
                      headersResult8.data.Authorization === 'Bearer ' + simpleToken;

        logTest('Should handle simple token format', passed8,
            'Simple token accepted: ' + passed8);
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
    Write('<p><em>These tests validate Bearer token header generation with various token formats (JWT and simple tokens) using OmegaFramework v3.0. ');
    Write('To test actual API authentication, use the integration test files with valid bearer tokens from your API provider.</em></p>');

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
