<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: BasicAuthStrategy with OmegaFramework
// ============================================================================

Write('<h2>Testing BasicAuthStrategy (OmegaFramework v3.0)</h2>');

try {
    // Load OmegaFramework
    Platform.Function.ContentBlockByKey("OMG_FW_OmegaFramework");

    if (typeof OmegaFramework === 'undefined') {
        throw new Error('OmegaFramework not loaded');
    }

    Write('<p>✅ OmegaFramework loaded</p>');

    // Load dependencies
    Platform.Function.ContentBlockByKey("OMG_FW_ResponseWrapper");
    Platform.Function.ContentBlockByKey("OMG_FW_BasicAuthStrategy");

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
    Write('<h3>Test 1: Create BasicAuthStrategy using OmegaFramework</h3>');
    try {
        var auth1 = OmegaFramework.require('BasicAuthStrategy', {
            username: 'testuser',
            password: 'testpass123'
        });

        var passed1 = typeof auth1.getHeaders === 'function' &&
                      typeof auth1.validateConfig === 'function';

        logTest('Should create BasicAuthStrategy via OmegaFramework.require', passed1,
            'Instance created with required methods');
    } catch (ex) {
        logTest('Should create BasicAuthStrategy via OmegaFramework.require', false, ex.message || ex.toString());
    }

    // Test 2: Validation - Missing username
    Write('<h3>Test 2: Validation - Missing Username</h3>');
    try {
        var auth2 = OmegaFramework.require('BasicAuthStrategy', {
            password: 'test-password'
            // Missing username
        });

        var validation = auth2.validateConfig();
        var passed = validation && !validation.success && validation.error.code === 'VALIDATION_ERROR';

        logTest('Should return validation error for missing username', passed,
            validation ? validation.error.message : 'No error returned');
    } catch (ex) {
        logTest('Should return validation error for missing username', false, ex.message || ex.toString());
    }

    // Test 3: Validation - Missing password
    Write('<h3>Test 3: Validation - Missing Password</h3>');
    try {
        var auth3 = OmegaFramework.require('BasicAuthStrategy', {
            username: 'test-user'
            // Missing password
        });

        var validation3 = auth3.validateConfig();
        var passed3 = validation3 && !validation3.success && validation3.error.code === 'VALIDATION_ERROR';

        logTest('Should return validation error for missing password', passed3,
            validation3 ? validation3.error.message : 'No error returned');
    } catch (ex) {
        logTest('Should return validation error for missing password', false, ex.message || ex.toString());
    }

    // Test 4: Valid configuration
    Write('<h3>Test 4: Valid Configuration</h3>');
    try {
        var auth4 = OmegaFramework.require('BasicAuthStrategy', {
            username: 'test-user',
            password: 'test-password'
        });

        var validation4 = auth4.validateConfig();
        var passed4 = validation4 === null;

        logTest('Should pass validation with complete config', passed4,
            validation4 ? 'Validation failed: ' + validation4.error.message : 'Config is valid');
    } catch (ex) {
        logTest('Should pass validation with complete config', false, ex.message || ex.toString());
    }

    // Test 5: Header generation with valid config
    Write('<h3>Test 5: Header Generation</h3>');
    try {
        var auth5 = OmegaFramework.require('BasicAuthStrategy', {
            username: 'testuser',
            password: 'testpass123'
        });

        var headersResult = auth5.getHeaders();
        var passed5 = headersResult.success &&
                      headersResult.data &&
                      headersResult.data.hasOwnProperty('Authorization') &&
                      headersResult.data.Authorization.indexOf('Basic ') === 0;

        var authHeader = headersResult.success ? headersResult.data.Authorization : 'N/A';

        logTest('Should generate Basic Auth header', passed5,
            'Authorization header: ' + authHeader.substring(0, 20) + '...');
    } catch (ex) {
        logTest('Should generate Basic Auth header', false, ex.message || ex.toString());
    }

    // Test 6: Header includes Content-Type
    Write('<h3>Test 6: Content-Type Header</h3>');
    try {
        var auth6 = OmegaFramework.require('BasicAuthStrategy', {
            username: 'testuser',
            password: 'testpass123'
        });

        var headersResult6 = auth6.getHeaders();
        var passed6 = headersResult6.success &&
                      headersResult6.data &&
                      headersResult6.data['Content-Type'] === 'application/json';

        logTest('Should include Content-Type header', passed6,
            'Content-Type: ' + (headersResult6.data ? headersResult6.data['Content-Type'] : 'N/A'));
    } catch (ex) {
        logTest('Should include Content-Type header', false, ex.message || ex.toString());
    }

    // Test 7: Header generation fails without validation
    Write('<h3>Test 7: Header Generation Without Valid Config</h3>');
    try {
        var auth7 = OmegaFramework.require('BasicAuthStrategy', {
            username: 'testuser'
            // Missing password
        });

        var headersResult7 = auth7.getHeaders();
        var passed7 = !headersResult7.success && headersResult7.error;

        logTest('Should fail to generate headers with invalid config', passed7,
            headersResult7.error ? headersResult7.error.message : 'Headers generated unexpectedly');
    } catch (ex) {
        logTest('Should fail to generate headers with invalid config', false, ex.message || ex.toString());
    }

    // Test 8: Base64 encoding verification
    Write('<h3>Test 8: Base64 Encoding Verification</h3>');
    try {
        var auth8 = OmegaFramework.require('BasicAuthStrategy', {
            username: 'admin',
            password: 'password123'
        });

        function isValidBase64(str) {
            if (!str || str == '') return false;

            if (str.length % 4 !== 0) {
                return false;
            }

            var strictRegex = /^[A-Za-z0-9\+\/]+={0,2}$/;

            return strictRegex.test(str);
        }

        var headersResult8 = auth8.getHeaders();

        if (headersResult8.success) {
            var authHeader8 = headersResult8.data.Authorization;
            var base64Part = authHeader8.replace('Basic ', '');

            // Verify it's a valid base64 string (basic check)
            var isBase64 = isValidBase64(base64Part);

            logTest('Should generate valid Base64 encoded credentials', isBase64,
                'Base64 format valid: ' + isBase64);
        } else {
            logTest('Should generate valid Base64 encoded credentials', false,
                'Failed to generate headers');
        }
    } catch (ex) {
        logTest('Should generate valid Base64 encoded credentials', false, ex.message || ex.toString());
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
    Write('<p><em>These tests validate Basic Auth header generation and Base64 encoding using OmegaFramework v3.0 dependency injection. ');
    Write('To test actual API authentication, use the integration test files with valid credentials.</em></p>');

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
