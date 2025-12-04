<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: OAuth2AuthStrategy with OmegaFramework
// ============================================================================

Write('<h2>Testing OAuth2AuthStrategy (OmegaFramework v3.0)</h2>');
Write('<p><strong>Note:</strong> OAuth2AuthStrategy is complex and depends on: ResponseWrapper, ConnectionHandler, CredentialStore, and DataExtensionTokenCache.</p>');
Write('<p>These tests validate configuration and token expiration logic without making actual OAuth2 calls.</p>');

try {
    // Load OmegaFramework
    Platform.Function.ContentBlockByKey("OMG_FW_OmegaFramework");

    if (typeof OmegaFramework === 'undefined') {
        throw new Error('OmegaFramework not loaded');
    }

    Write('<p>✅ OmegaFramework loaded</p>');

    // Load dependencies - OAuth2AuthStrategy needs all of these
    Platform.Function.ContentBlockByKey("OMG_FW_ResponseWrapper");
    Platform.Function.ContentBlockByKey("OMG_FW_ConnectionHandler");
    Platform.Function.ContentBlockByKey("OMG_FW_DataExtensionTokenCache");
    Platform.Function.ContentBlockByKey("OMG_FW_CredentialStore");
    Platform.Function.ContentBlockByKey("OMG_FW_OAuth2AuthStrategy");

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

    // Test 1: Validation - Missing token URL
    Write('<h3>Test 1: Validation - Missing Token URL</h3>');
    try {
        var response1 = OmegaFramework.require('ResponseWrapper', {});
        var connection1 = OmegaFramework.require('ConnectionHandler', {});

        // Create a mock token cache constructor
        var mockTokenCacheConstructor = function(key, config) {
            return {
                get: function() { return { success: false }; },
                set: function() { return { success: true }; },
                isExpired: function() { return false; },
                clear: function() { return { success: true }; }
            };
        };

        var auth1 = new OAuth2AuthStrategy(
            response1,
            connection1,
            null, // No credential store needed for manual config
            mockTokenCacheConstructor,
            {
                clientId: 'test-client',
                clientSecret: 'test-secret'
                // Missing tokenUrl
            }
        );

        var validation = auth1.validateConfig();
        var passed = validation && !validation.success && validation.error.code === 'VALIDATION_ERROR';

        logTest('Should return validation error for missing tokenUrl', passed,
            validation ? validation.error.message : 'No error returned');
    } catch (ex) {
        logTest('Should return validation error for missing tokenUrl', false, ex.message || ex.toString());
    }

    // Test 2: Validation - Missing client ID
    Write('<h3>Test 2: Validation - Missing Client ID</h3>');
    try {
        var response2 = OmegaFramework.require('ResponseWrapper', {});
        var connection2 = OmegaFramework.require('ConnectionHandler', {});

        var mockTokenCacheConstructor2 = function(key, config) {
            return {
                get: function() { return { success: false }; },
                set: function() { return { success: true }; },
                isExpired: function() { return false; },
                clear: function() { return { success: true }; }
            };
        };

        var auth2 = new OAuth2AuthStrategy(
            response2,
            connection2,
            null,
            mockTokenCacheConstructor2,
            {
                tokenUrl: 'https://example.com/token',
                clientSecret: 'test-secret'
                // Missing clientId
            }
        );

        var validation2 = auth2.validateConfig();
        var passed2 = validation2 && !validation2.success && validation2.error.code === 'VALIDATION_ERROR';

        logTest('Should return validation error for missing clientId', passed2,
            validation2 ? validation2.error.message : 'No error returned');
    } catch (ex) {
        logTest('Should return validation error for missing clientId', false, ex.message || ex.toString());
    }

    // Test 3: Validation - Missing client secret
    Write('<h3>Test 3: Validation - Missing Client Secret</h3>');
    try {
        var response3 = OmegaFramework.require('ResponseWrapper', {});
        var connection3 = OmegaFramework.require('ConnectionHandler', {});

        var mockTokenCacheConstructor3 = function(key, config) {
            return {
                get: function() { return { success: false }; },
                set: function() { return { success: true }; },
                isExpired: function() { return false; },
                clear: function() { return { success: true }; }
            };
        };

        var auth3 = new OAuth2AuthStrategy(
            response3,
            connection3,
            null,
            mockTokenCacheConstructor3,
            {
                tokenUrl: 'https://example.com/token',
                clientId: 'test-client'
                // Missing clientSecret
            }
        );

        var validation3 = auth3.validateConfig();
        var passed3 = validation3 && !validation3.success && validation3.error.code === 'VALIDATION_ERROR';

        logTest('Should return validation error for missing clientSecret', passed3,
            validation3 ? validation3.error.message : 'No error returned');
    } catch (ex) {
        logTest('Should return validation error for missing clientSecret', false, ex.message || ex.toString());
    }

    // Test 4: Valid configuration
    Write('<h3>Test 4: Valid Configuration</h3>');
    try {
        var response4 = OmegaFramework.require('ResponseWrapper', {});
        var connection4 = OmegaFramework.require('ConnectionHandler', {});

        var mockTokenCacheConstructor4 = function(key, config) {
            return {
                get: function() { return { success: false }; },
                set: function() { return { success: true }; },
                isExpired: function() { return false; },
                clear: function() { return { success: true }; }
            };
        };

        var auth4 = new OAuth2AuthStrategy(
            response4,
            connection4,
            null,
            mockTokenCacheConstructor4,
            {
                tokenUrl: 'https://example.com/token',
                clientId: 'test-client',
                clientSecret: 'test-secret',
                grantType: 'client_credentials'
            }
        );

        var validation4 = auth4.validateConfig();
        var passed4 = validation4 === null;

        logTest('Should pass validation with complete config', passed4,
            validation4 ? 'Validation failed: ' + validation4.error.message : 'Config is valid');
    } catch (ex) {
        logTest('Should pass validation with complete config', false, ex.message || ex.toString());
    }

    // Test 5: Token expiration check
    Write('<h3>Test 5: Token Expiration Check</h3>');
    try {
        var response5 = OmegaFramework.require('ResponseWrapper', {});
        var connection5 = OmegaFramework.require('ConnectionHandler', {});

        var mockTokenCacheConstructor5 = function(key, config) {
            return {
                get: function() { return { success: false }; },
                set: function() { return { success: true }; },
                isExpired: function(tokenInfo) {
                    // Check if token is expired (2 hours ago with 1 hour expiry)
                    var now = new Date().getTime();
                    var expiresAt = tokenInfo.obtainedAt + (tokenInfo.expiresIn * 1000);
                    return now >= expiresAt;
                },
                clear: function() { return { success: true }; }
            };
        };

        var auth5 = new OAuth2AuthStrategy(
            response5,
            connection5,
            null,
            mockTokenCacheConstructor5,
            {
                tokenUrl: 'https://example.com/token',
                clientId: 'test-client',
                clientSecret: 'test-secret'
            }
        );

        // Create an expired token
        var expiredToken = {
            accessToken: 'expired-token',
            expiresIn: 3600,
            obtainedAt: new Date().getTime() - 7200000 // 2 hours ago
        };

        var isExpired = auth5.isTokenExpired(expiredToken);

        logTest('Should detect expired token', isExpired === true,
            'Token expired: ' + isExpired);
    } catch (ex) {
        logTest('Should detect expired token', false, ex.message || ex.toString());
    }

    // Test 6: Token validity check (not expired)
    Write('<h3>Test 6: Token Validity Check</h3>');
    try {
        var response6 = OmegaFramework.require('ResponseWrapper', {});
        var connection6 = OmegaFramework.require('ConnectionHandler', {});

        var mockTokenCacheConstructor6 = function(key, config) {
            return {
                get: function() { return { success: false }; },
                set: function() { return { success: true }; },
                isExpired: function(tokenInfo) {
                    var now = new Date().getTime();
                    var expiresAt = tokenInfo.obtainedAt + (tokenInfo.expiresIn * 1000);
                    return now >= expiresAt;
                },
                clear: function() { return { success: true }; }
            };
        };

        var auth6 = new OAuth2AuthStrategy(
            response6,
            connection6,
            null,
            mockTokenCacheConstructor6,
            {
                tokenUrl: 'https://example.com/token',
                clientId: 'test-client',
                clientSecret: 'test-secret',
                refreshBuffer: 300000 // 5 minutes buffer
            }
        );

        // Create a valid token (obtained 10 minutes ago, expires in 1 hour)
        var validToken = {
            accessToken: 'valid-token',
            expiresIn: 3600,
            obtainedAt: new Date().getTime() - 600000 // 10 minutes ago
        };

        var isExpired6 = auth6.isTokenExpired(validToken);

        logTest('Should detect valid token', isExpired6 === false,
            'Token expired: ' + isExpired6);
    } catch (ex) {
        logTest('Should detect valid token', false, ex.message || ex.toString());
    }

    // Test 7: Clear cache functionality
    Write('<h3>Test 7: Clear Cache Functionality</h3>');
    try {
        var response7 = OmegaFramework.require('ResponseWrapper', {});
        var connection7 = OmegaFramework.require('ConnectionHandler', {});

        var clearCalled = false;
        var mockTokenCacheConstructor7 = function(key, config) {
            return {
                get: function() { return { success: false }; },
                set: function() { return { success: true }; },
                isExpired: function() { return false; },
                clear: function() {
                    clearCalled = true;
                    return { success: true };
                }
            };
        };

        var auth7 = new OAuth2AuthStrategy(
            response7,
            connection7,
            null,
            mockTokenCacheConstructor7,
            {
                tokenUrl: 'https://example.com/token',
                clientId: 'test-client',
                clientSecret: 'test-secret'
            }
        );

        // Clear cache should not throw error and should call the cache's clear method
        auth7.clearCache();

        logTest('Should clear cache without errors', clearCalled === true,
            'Cache clear was called: ' + clearCalled);
    } catch (ex) {
        logTest('Should clear cache without errors', false, ex.message || ex.toString());
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
    Write('<p><em>These tests validate OAuth2 configuration, token expiration logic, and cache management using OmegaFramework v3.0 dependency injection. ');
    Write('To test actual OAuth2 token retrieval, you need valid credentials and a real token endpoint. ');
    Write('See integration test files for end-to-end testing.</em></p>');

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
