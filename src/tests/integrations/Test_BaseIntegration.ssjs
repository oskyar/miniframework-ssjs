<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: BaseIntegration with OmegaFramework
// ============================================================================

Write('<h2>Testing BaseIntegration (OmegaFramework v3.0)</h2>');

try {
    // Load OmegaFramework
    Platform.Function.ContentBlockByKey("OMG_FW_OmegaFramework");

    if (typeof OmegaFramework === 'undefined') {
        throw new Error('OmegaFramework not loaded');
    }

    Write('<p>✅ OmegaFramework loaded</p>');

    // Load dependencies
    Platform.Function.ContentBlockByKey("OMG_FW_ResponseWrapper");
    Platform.Function.ContentBlockByKey("OMG_FW_ConnectionHandler");
    Platform.Function.ContentBlockByKey("OMG_FW_BasicAuthStrategy");
    Platform.Function.ContentBlockByKey("OMG_FW_BaseIntegration");

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
    function createBaseIntegrationWithMocks(integrationConfig, authStrategy) {
        // Use OmegaFramework.create() to always get a NEW instance (not cached)
        // This is critical for tests - each test needs its own independent instance
        return OmegaFramework.create('BaseIntegration', {
            integrationName: 'TestIntegration',
            integrationConfig: integrationConfig,
            authStrategy: authStrategy
        });
    }

    // Helper function to create mock auth strategy
    function createMockAuthStrategy(shouldSucceed) {
        return {
            getHeaders: function() {
                if (shouldSucceed) {
                    var response = OmegaFramework.require('ResponseWrapper', {});
                    return response.success({
                        'Authorization': 'Bearer mock-token-123',
                        'Content-Type': 'application/json'
                    }, 'MockAuth', 'getHeaders');
                } else {
                    var response = OmegaFramework.require('ResponseWrapper', {});
                    return response.error('Auth failed', 'MockAuth', 'getHeaders');
                }
            },
            validateConfig: function() {
                return null; // Valid
            }
        };
    }

    // Test 1: Configuration validation - Missing baseUrl
    Write('<h3>Test 1: Configuration Validation - Missing Base URL</h3>');
    try {
        var base1 = createBaseIntegrationWithMocks({
            // Missing baseUrl
        }, null);

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
        }, null);

        var validation2 = base2.validateConfig();
        var passed2 = validation2 === null;

        logTest('Should pass validation with baseUrl', passed2,
            validation2 ? 'Validation failed: ' + validation2.error.message : 'Config is valid');
    } catch (ex) {
        logTest('Should pass validation with baseUrl', false, ex.message || ex.toString());
    }

    // Test 3: Set auth strategy
    Write('<h3>Test 3: Set Authentication Strategy</h3>');
    try {
        var base3 = createBaseIntegrationWithMocks({
            baseUrl: 'https://api.example.com'
        }, null);

        var mockAuth = createMockAuthStrategy(true);
        base3.setAuthStrategy(mockAuth);

        var headersResult = base3.getAuthHeaders();
        var passed3 = headersResult.success && headersResult.data.Authorization === 'Bearer mock-token-123';

        logTest('Should set and use authentication strategy', passed3,
            headersResult.success ? 'Auth headers retrieved successfully' : 'Failed to get headers');
    } catch (ex) {
        logTest('Should set and use authentication strategy', false, ex.message || ex.toString());
    }

    // Test 4: Get auth headers without strategy
    Write('<h3>Test 4: Get Auth Headers Without Strategy</h3>');
    try {
        var base4 = createBaseIntegrationWithMocks({
            baseUrl: 'https://api.example.com'
        }, null);

        var headersResult4 = base4.getAuthHeaders();
        var passed4 = !headersResult4.success && headersResult4.error;

        logTest('Should fail to get headers without auth strategy', passed4,
            headersResult4.error ? headersResult4.error.message : 'Unexpected success');
    } catch (ex) {
        logTest('Should fail to get headers without auth strategy', false, ex.message || ex.toString());
    }

    // Test 5: Build URL - Basic endpoint
    Write('<h3>Test 5: Build URL - Basic Endpoint</h3>');
    try {
        var base5 = createBaseIntegrationWithMocks({
            baseUrl: 'https://api.example.com'
        }, null);

        var url = base5.buildUrl('/users/123');
        var passed5 = url === 'https://api.example.com/users/123';

        logTest('Should build URL correctly', passed5,
            'Built URL: ' + url);
    } catch (ex) {
        logTest('Should build URL correctly', false, ex.message || ex.toString());
    }

    // Test 6: Build URL - Trailing slash handling
    Write('<h3>Test 6: Build URL - Trailing Slash Handling</h3>');
    try {
        var base6 = createBaseIntegrationWithMocks({
            baseUrl: 'https://api.example.com/'  // Trailing slash
        }, null);

        var url6 = base6.buildUrl('/users/123');
        var passed6 = url6 === 'https://api.example.com/users/123';

        logTest('Should handle trailing slash in baseUrl', passed6,
            'Built URL: ' + url6);
    } catch (ex) {
        logTest('Should handle trailing slash in baseUrl', false, ex.message || ex.toString());
    }

    // Test 7: Build URL - Missing leading slash
    Write('<h3>Test 7: Build URL - Missing Leading Slash</h3>');
    try {
        var base7 = createBaseIntegrationWithMocks({
            baseUrl: 'https://api.example.com'
        }, null);

        var url7 = base7.buildUrl('users/123');  // No leading slash
        var passed7 = url7 === 'https://api.example.com/users/123';

        logTest('Should handle missing leading slash in endpoint', passed7,
            'Built URL: ' + url7);
    } catch (ex) {
        logTest('Should handle missing leading slash in endpoint', false, ex.message || ex.toString());
    }

    // Test 8: Build query string
    Write('<h3>Test 8: Build Query String</h3>');
    try {
        var base8 = createBaseIntegrationWithMocks({
            baseUrl: 'https://api.example.com'
        }, null);

        var queryString = base8.buildQueryString({
            page: 1,
            limit: 10,
            filter: 'active'
        });

        var passed8 = queryString.indexOf('page=1') > -1 &&
                      queryString.indexOf('limit=10') > -1 &&
                      queryString.indexOf('filter=active') > -1 &&
                      queryString.charAt(0) === '?';

        logTest('Should build query string correctly', passed8,
            'Query string: ' + queryString);
    } catch (ex) {
        logTest('Should build query string correctly', false, ex.message || ex.toString());
    }

    // Test 9: HTTP methods exist
    Write('<h3>Test 9: HTTP Methods Exist</h3>');
    try {
        var base9 = createBaseIntegrationWithMocks({
            baseUrl: 'https://api.example.com'
        }, null);

        var hasGet = typeof base9.get === 'function';
        var hasPost = typeof base9.post === 'function';
        var hasPut = typeof base9.put === 'function';
        var hasPatch = typeof base9.patch === 'function';
        var hasRemove = typeof base9.remove === 'function';

        var passed9 = hasGet && hasPost && hasPut && hasPatch && hasRemove;

        logTest('Should have all HTTP methods', passed9,
            'Methods: GET=' + hasGet + ', POST=' + hasPost + ', PUT=' + hasPut + ', PATCH=' + hasPatch + ', DELETE=' + hasRemove);
    } catch (ex) {
        logTest('Should have all HTTP methods', false, ex.message || ex.toString());
    }

    // Test 10: Build headers with auth
    Write('<h3>Test 10: Build Headers With Auth</h3>');
    try {
        var mockAuth10 = createMockAuthStrategy(true);
        var base10 = createBaseIntegrationWithMocks({
            baseUrl: 'https://api.example.com'
        }, mockAuth10);

        var headersResult10 = base10.buildHeaders({ 'X-Custom-Header': 'custom-value' });
        var passed10 = headersResult10.success &&
                       headersResult10.data.Authorization === 'Bearer mock-token-123' &&
                       headersResult10.data['X-Custom-Header'] === 'custom-value';

        logTest('Should merge auth and custom headers', passed10,
            'Headers merged: ' + passed10);
    } catch (ex) {
        logTest('Should merge auth and custom headers', false, ex.message || ex.toString());
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
    Write('<p><em>These tests validate BaseIntegration configuration, authentication strategy management, and URL building using OmegaFramework v3.0. ');
    Write('To test actual HTTP requests, use the specific integration test files (SFMC, Veeva, Data Cloud).</em></p>');

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
