<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: BaseIntegration with OmegaFramework
// ============================================================================

Write('<h2>Testing BaseIntegration (OmegaFramework v1.0)</h2>');

try {
    // Load OmegaFramework
    Platform.Function.ContentBlockByName("OMG_FW_OmegaFramework");

    if (typeof OmegaFramework === 'undefined') {
        throw new Error('OmegaFramework not loaded');
    }

    Write('<p>✅ OmegaFramework loaded</p>');

    // Load dependencies
    Platform.Function.ContentBlockByName("OMG_FW_ResponseWrapper");
    Platform.Function.ContentBlockByName("OMG_FW_ConnectionHandler");
    Platform.Function.ContentBlockByName("OMG_FW_BaseIntegration");

    Write('<p>✅ All dependencies loaded</p>');
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

    // Helper function to create BaseIntegration with mocks
    function createBaseIntegrationWithMocks(integrationConfig) {
        // Use OmegaFramework.create() to always get a NEW instance (not cached)
        // This is critical for tests - each test needs its own independent instance
        return OmegaFramework.create('BaseIntegration', {
            integrationName: 'TestIntegration',
            integrationConfig: integrationConfig
        });
    }

    // Test 1: Configuration validation - Missing baseUrl
    Write('<h3>Test 1: Configuration Validation - Missing Base URL</h3>');
    try {
        var base1 = createBaseIntegrationWithMocks({
            // Missing baseUrl
        });

        var validation = base1.validateConfig();
        var passed = validation && !validation.success && validation.error.code === 'VALIDATION_ERROR';

        logTest('Should return validation error for missing baseUrl', passed,
            validation ? validation.error.message : 'No error returned');
    } catch (ex) {
        logTest('Should return validation error for missing baseUrl', false, ex.message || ex.toString());
    }

    // Test 2: Valid configuration
    Write('<h3>Test 2: Valid Configuration</h3>');
    try {
        var base2 = createBaseIntegrationWithMocks({
            baseUrl: 'https://api.example.com'
        });

        var validation2 = base2.validateConfig();
        var passed2 = validation2 === null;

        logTest('Should pass validation with baseUrl', passed2,
            validation2 ? 'Validation failed: ' + validation2.error.message : 'Config is valid');
    } catch (ex) {
        logTest('Should pass validation with baseUrl', false, ex.message || ex.toString());
    }

    // Test 3: Build URL - Basic endpoint
    Write('<h3>Test 3: Build URL - Basic Endpoint</h3>');
    try {
        var base3 = createBaseIntegrationWithMocks({
            baseUrl: 'https://api.example.com'
        });

        var url = base3.buildUrl('/users/123');
        var passed3 = url === 'https://api.example.com/users/123';

        logTest('Should build URL correctly', passed3,
            'Built URL: ' + url);
    } catch (ex) {
        logTest('Should build URL correctly', false, ex.message || ex.toString());
    }

    // Test 4: Build URL - Trailing slash handling
    Write('<h3>Test 4: Build URL - Trailing Slash Handling</h3>');
    try {
        var base4 = createBaseIntegrationWithMocks({
            baseUrl: 'https://api.example.com/'  // Trailing slash
        });

        var url4 = base4.buildUrl('/users/123');
        var passed4 = url4 === 'https://api.example.com/users/123';

        logTest('Should handle trailing slash in baseUrl', passed4,
            'Built URL: ' + url4);
    } catch (ex) {
        logTest('Should handle trailing slash in baseUrl', false, ex.message || ex.toString());
    }

    // Test 5: Build URL - Missing leading slash
    Write('<h3>Test 5: Build URL - Missing Leading Slash</h3>');
    try {
        var base5 = createBaseIntegrationWithMocks({
            baseUrl: 'https://api.example.com'
        });

        var url5 = base5.buildUrl('users/123');  // No leading slash
        var passed5 = url5 === 'https://api.example.com/users/123';

        logTest('Should handle missing leading slash in endpoint', passed5,
            'Built URL: ' + url5);
    } catch (ex) {
        logTest('Should handle missing leading slash in endpoint', false, ex.message || ex.toString());
    }

    // Test 6: Build query string
    Write('<h3>Test 6: Build Query String</h3>');
    try {
        var base6 = createBaseIntegrationWithMocks({
            baseUrl: 'https://api.example.com'
        });

        var queryString = base6.buildQueryString({
            page: 1,
            limit: 10,
            filter: 'active'
        });

        var passed6 = queryString.indexOf('page=1') > -1 &&
                      queryString.indexOf('limit=10') > -1 &&
                      queryString.indexOf('filter=active') > -1 &&
                      queryString.charAt(0) === '?';

        logTest('Should build query string correctly', passed6,
            'Query string: ' + queryString);
    } catch (ex) {
        logTest('Should build query string correctly', false, ex.message || ex.toString());
    }

    // Test 7: HTTP methods exist
    Write('<h3>Test 7: HTTP Methods Exist</h3>');
    try {
        var base7 = createBaseIntegrationWithMocks({
            baseUrl: 'https://api.example.com'
        });

        var hasGet = typeof base7.get === 'function';
        var hasPost = typeof base7.post === 'function';
        var hasPut = typeof base7.put === 'function';
        var hasPatch = typeof base7.patch === 'function';
        var hasRemove = typeof base7.remove === 'function';

        var passed7 = hasGet && hasPost && hasPut && hasPatch && hasRemove;

        logTest('Should have all HTTP methods', passed7,
            'Methods: GET=' + hasGet + ', POST=' + hasPost + ', PUT=' + hasPut + ', PATCH=' + hasPatch + ', DELETE=' + hasRemove);
    } catch (ex) {
        logTest('Should have all HTTP methods', false, ex.message || ex.toString());
    }

    // Test 8: Build headers with custom headers
    Write('<h3>Test 8: Build Headers With Custom Headers</h3>');
    try {
        var base8 = createBaseIntegrationWithMocks({
            baseUrl: 'https://api.example.com'
        });

        var headers8 = base8.buildHeaders({ 'X-Custom-Header': 'custom-value' });
        var passed8 = headers8['Content-Type'] === 'application/json' &&
                      headers8['X-Custom-Header'] === 'custom-value';

        logTest('Should merge default and custom headers', passed8,
            'Headers: Content-Type=' + headers8['Content-Type'] + ', X-Custom-Header=' + headers8['X-Custom-Header']);
    } catch (ex) {
        logTest('Should merge default and custom headers', false, ex.message || ex.toString());
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
    Write('<p><em>These tests validate BaseIntegration configuration, URL building, and HTTP method availability using OmegaFramework v1.0. ');
    Write('Authentication is now handled internally by each specific integration (SFMC, Veeva, Data Cloud). ');
    Write('To test actual HTTP requests, use the specific integration test files.</em></p>');

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
