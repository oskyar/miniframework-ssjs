<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: SFMCIntegration with OmegaFramework
// Tests SFMC REST API integration with OAuth2 authentication
// Based on official SFMC documentation:
// @see https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/access-token-s2s.html
// ============================================================================

Write('<h2>Testing SFMCIntegration (OmegaFramework v1.0)</h2>');

var clientId = Platform.Request.GetFormField("clientId");
var clientSecret = Platform.Request.GetFormField("clientSecret");
var authBaseUrl = Platform.Request.GetFormField("authBaseUrl");

if (!clientId || !clientSecret || !authBaseUrl) {
    Write('<p>This test requires SFMC credentials to run.</p>');
    Write('<form method="POST">');
    Write('<div style="margin: 10px 0;">');
    Write('<label>Client ID:</label><br>');
    Write('<input type="text" name="clientId" style="width: 400px;" required>');
    Write('</div>');
    Write('<div style="margin: 10px 0;">');
    Write('<label>Client Secret:</label><br>');
    Write('<input type="password" name="clientSecret" style="width: 400px;" required>');
    Write('</div>');
    Write('<div style="margin: 10px 0;">');
    Write('<label>Auth Base URL:</label><br>');
    Write('<input type="text" name="authBaseUrl" value="https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/" style="width: 400px;" required>');
    Write('</div>');
    Write('<button type="submit">Run Tests</button>');
    Write('</form>');
} else {
    var testResults = {
        passed: 0,
        failed: 0,
        tests: []
    };

    function logTest(testName, success, details) {
        testResults.tests.push({
            name: testName,
            success: success,
            details: details
        });
        if (success) {
            testResults.passed++;
        } else {
            testResults.failed++;
        }
    }

    try {
        // Load OmegaFramework
        Platform.Function.ContentBlockByName("OMG_FW_OmegaFramework");

        if (typeof OmegaFramework === 'undefined') {
            throw new Error('OmegaFramework not loaded');
        }

        Write('<p>✅ OmegaFramework loaded</p>');

        // Load all required dependencies
        Platform.Function.ContentBlockByName("OMG_FW_ResponseWrapper");
        Platform.Function.ContentBlockByName("OMG_FW_ConnectionHandler");
        Platform.Function.ContentBlockByName("OMG_FW_DataExtensionTokenCache");
        Platform.Function.ContentBlockByName("OMG_FW_BaseIntegration");
        Platform.Function.ContentBlockByName("OMG_FW_SFMCIntegration");

        Write('<p>✅ All dependencies loaded</p>');

        // Initialize SFMCIntegration using OmegaFramework.create()
        var sfmcIntegration = OmegaFramework.create('SFMCIntegration', {
            clientId: clientId,
            clientSecret: clientSecret,
            authBaseUrl: authBaseUrl
        });
        Write('<p>✅ SFMCIntegration created with OmegaFramework.create()</p>');

        // ====================================================================
        // TEST 1: Get OAuth2 Token
        // ====================================================================
        Write('<h3>Test 1: Get OAuth2 Token</h3>');
        var tokenResult = sfmcIntegration.getToken();

        if (tokenResult.success && tokenResult.data) {
            Write('<p>✅ Token obtained successfully</p>');
            Write('<p>Token Type: ' + (tokenResult.data.tokenType || 'N/A') + '</p>');
            Write('<p>Expires In: ' + (tokenResult.data.expiresIn || 'N/A') + ' seconds</p>');
            Write('<p>REST Instance URL: ' + (tokenResult.data.restInstanceUrl || 'N/A') + '</p>');
            Write('<p>SOAP Instance URL: ' + (tokenResult.data.soapInstanceUrl || 'N/A') + '</p>');
            Write('<p>Access Token: ' + (tokenResult.data.accessToken ? tokenResult.data.accessToken.substring(0, 20) + '...' : 'N/A') + '</p>');
            logTest('Get OAuth2 Token', true, 'Token obtained with ' + tokenResult.data.expiresIn + 's expiry');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Token request failed</p>');
            var errorMsg = tokenResult.error ? tokenResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Get OAuth2 Token', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 2: Get REST URL
        // ====================================================================
        Write('<h3>Test 2: Get REST Instance URL</h3>');
        var restUrlResult = sfmcIntegration.getRestUrl();

        if (restUrlResult.success && restUrlResult.data) {
            Write('<p>✅ REST URL retrieved</p>');
            Write('<p>URL: ' + restUrlResult.data + '</p>');
            logTest('Get REST URL', true, 'REST URL: ' + restUrlResult.data);
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ REST URL retrieval failed</p>');
            var errorMsg = restUrlResult.error ? restUrlResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Get REST URL', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 3: Get SOAP URL
        // ====================================================================
        Write('<h3>Test 3: Get SOAP Instance URL</h3>');
        var soapUrlResult = sfmcIntegration.getSoapUrl();

        if (soapUrlResult.success && soapUrlResult.data) {
            Write('<p>✅ SOAP URL retrieved</p>');
            Write('<p>URL: ' + soapUrlResult.data + '</p>');
            logTest('Get SOAP URL', true, 'SOAP URL: ' + soapUrlResult.data);
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ SOAP URL retrieval failed</p>');
            var errorMsg = soapUrlResult.error ? soapUrlResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Get SOAP URL', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 4: Token Expiration Check
        // ====================================================================
        Write('<h3>Test 4: Token Expiration Check</h3>');
        var tokenForCheck = sfmcIntegration.getToken();

        if (tokenForCheck.success && tokenForCheck.data) {
            var isExpired = sfmcIntegration.isTokenExpired(tokenForCheck.data);
            Write('<p>✅ Token expiration check completed</p>');
            Write('<p>Is Expired: ' + isExpired + '</p>');
            Write('<p>Expires At: ' + new Date(tokenForCheck.data.expiresAt).toISOString() + '</p>');
            logTest('Token Expiration Check', !isExpired, 'Token is ' + (isExpired ? 'expired' : 'valid'));
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Token expiration check failed</p>');
            logTest('Token Expiration Check', false, 'Could not get token');
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 5: Make REST Request - List Assets
        // GET /asset/v1/content/assets
        // ====================================================================
        Write('<h3>Test 5: Make REST Request - List Assets</h3>');
        var assetsResult = sfmcIntegration.listAssets({ pageSize: 3 });

        if (assetsResult.success && assetsResult.data) {
            var count = assetsResult.data.count || 0;
            var items = assetsResult.data.items || [];

            Write('<p>✅ Assets request successful</p>');
            Write('<p>Total count: ' + count + '</p>');
            Write('<p>Items returned: ' + items.length + '</p>');

            if (items.length > 0) {
                Write('<p>First asset: ' + items[0].name + ' (ID: ' + items[0].id + ')</p>');
            }

            logTest('List Assets', true, 'Retrieved ' + items.length + ' assets');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Assets request failed</p>');
            var errorMsg = assetsResult.error ? assetsResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('List Assets', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 6: Make Generic REST Request
        // GET /platform/v1/tokenContext
        // ====================================================================
        Write('<h3>Test 6: Make Generic REST Request - Token Context</h3>');
        var tokenContextResult = sfmcIntegration.makeRestRequest('GET', '/platform/v1/tokenContext');

        if (tokenContextResult.success && tokenContextResult.data) {
            Write('<p>✅ Token context retrieved</p>');
            Write('<p>Organization ID: ' + (tokenContextResult.data.organization ? tokenContextResult.data.organization.id : 'N/A') + '</p>');
            Write('<p>Enterprise ID: ' + (tokenContextResult.data.organization ? tokenContextResult.data.organization.enterprise_id : 'N/A') + '</p>');
            logTest('Token Context', true, 'Token context retrieved');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Token context request failed</p>');
            var errorMsg = tokenContextResult.error ? tokenContextResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Token Context', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 7: Clear Token Cache
        // ====================================================================
        Write('<h3>Test 7: Clear Token Cache</h3>');
        try {
            var clearResult = sfmcIntegration.clearTokenCache();
            Write('<p>✅ Token cache cleared</p>');
            logTest('Clear Token Cache', true, 'Cache cleared successfully');
            Write('<p>Status: ✅ PASS</p>');
        } catch (clearEx) {
            Write('<p>❌ Clear cache failed</p>');
            Write('<p>Error: ' + (clearEx.message || String(clearEx)) + '</p>');
            logTest('Clear Token Cache', false, clearEx.message || String(clearEx));
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 8: Refresh Token (after clearing cache)
        // ====================================================================
        Write('<h3>Test 8: Refresh Token</h3>');
        var refreshResult = sfmcIntegration.refreshToken();

        if (refreshResult.success && refreshResult.data) {
            Write('<p>✅ Token refreshed successfully</p>');
            Write('<p>New Token Type: ' + (refreshResult.data.tokenType || 'N/A') + '</p>');
            Write('<p>New Expires In: ' + (refreshResult.data.expiresIn || 'N/A') + ' seconds</p>');
            logTest('Refresh Token', true, 'Token refreshed');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Token refresh failed</p>');
            var errorMsg = refreshResult.error ? refreshResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Refresh Token', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 9: Advanced Asset Query (POST method)
        // ====================================================================
        Write('<h3>Test 9: Advanced Asset Query (POST)</h3>');
        var advancedQueryResult = sfmcIntegration.advancedAssetQuery({
            page: { page: 1, pageSize: 3 },
            sort: [{ property: 'modifiedDate', direction: 'DESC' }],
            fields: ['id', 'name', 'assetType', 'modifiedDate']
        });

        if (advancedQueryResult.success && advancedQueryResult.data) {
            var count = advancedQueryResult.data.count || 0;
            var items = advancedQueryResult.data.items || [];

            Write('<p>✅ Advanced query successful</p>');
            Write('<p>Total count: ' + count + '</p>');
            Write('<p>Items returned: ' + items.length + '</p>');
            logTest('Advanced Asset Query', true, 'Retrieved ' + items.length + ' assets');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Advanced query failed</p>');
            var errorMsg = advancedQueryResult.error ? advancedQueryResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Advanced Asset Query', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 10: Verify Public API Methods
        // ====================================================================
        Write('<h3>Test 10: Verify Public API Methods</h3>');
        var hasMethods = sfmcIntegration &&
                        typeof sfmcIntegration.getToken === 'function' &&
                        typeof sfmcIntegration.getRestUrl === 'function' &&
                        typeof sfmcIntegration.getSoapUrl === 'function' &&
                        typeof sfmcIntegration.makeRestRequest === 'function' &&
                        typeof sfmcIntegration.isTokenExpired === 'function' &&
                        typeof sfmcIntegration.clearTokenCache === 'function' &&
                        typeof sfmcIntegration.refreshToken === 'function' &&
                        typeof sfmcIntegration.listAssets === 'function' &&
                        typeof sfmcIntegration.getAsset === 'function' &&
                        typeof sfmcIntegration.createAsset === 'function' &&
                        typeof sfmcIntegration.updateAsset === 'function' &&
                        typeof sfmcIntegration.deleteAsset === 'function' &&
                        typeof sfmcIntegration.advancedAssetQuery === 'function' &&
                        typeof sfmcIntegration.queryDataExtension === 'function' &&
                        typeof sfmcIntegration.getJourney === 'function' &&
                        typeof sfmcIntegration.publishJourney === 'function' &&
                        typeof sfmcIntegration.stopJourney === 'function' &&
                        typeof sfmcIntegration.sendTransactionalEmail === 'function';

        if (hasMethods) {
            Write('<p>✅ All public API methods available</p>');
            Write('<ul>');
            Write('<li>Token Management: getToken, getRestUrl, getSoapUrl, isTokenExpired, clearTokenCache, refreshToken</li>');
            Write('<li>REST Requests: makeRestRequest</li>');
            Write('<li>Assets: listAssets, getAsset, createAsset, updateAsset, deleteAsset, advancedAssetQuery</li>');
            Write('<li>Data Extensions: queryDataExtension, insertDataExtensionRow, updateDataExtensionRow, deleteDataExtensionRow</li>');
            Write('<li>Journeys: getJourney, publishJourney, stopJourney</li>');
            Write('<li>Messaging: sendTransactionalEmail</li>');
            Write('</ul>');
            logTest('Public API Methods', true, 'All methods available');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Some public API methods missing</p>');
            logTest('Public API Methods', false, 'Missing methods');
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST SUMMARY
        // ====================================================================
        Write('<hr>');
        Write('<h3>Test Summary</h3>');
        Write('<p><strong>Passed:</strong> ' + testResults.passed + '</p>');
        Write('<p><strong>Failed:</strong> ' + testResults.failed + '</p>');
        Write('<p><strong>Total:</strong> ' + (testResults.passed + testResults.failed) + '</p>');

        if (testResults.failed === 0) {
            Write('<h3 style="color:green;">✅ All SFMCIntegration tests passed!</h3>');
        } else {
            Write('<h3 style="color:orange;">⚠️ Some tests failed</h3>');
        }

        Write('<h4>Test Details:</h4>');
        Write('<ul>');
        for (var i = 0; i < testResults.tests.length; i++) {
            var test = testResults.tests[i];
            var icon = test.success ? '✅' : '❌';
            Write('<li>' + icon + ' <strong>' + test.name + '</strong>: ' + test.details + '</li>');
        }
        Write('</ul>');

        Write('<h4>SFMCIntegration Features:</h4>');
        Write('<ul>');
        Write('<li><strong>OAuth2 Authentication</strong>: Automatic token management with Data Extension caching</li>');
        Write('<li><strong>Token Refresh</strong>: Automatic refresh before expiration (5 min buffer)</li>');
        Write('<li><strong>REST Instance URL</strong>: Automatically discovered from token response</li>');
        Write('<li><strong>Asset API</strong>: Full CRUD operations with simple and advanced query support</li>');
        Write('<li><strong>Data Extension API</strong>: Query, insert, update, delete rows</li>');
        Write('<li><strong>Journey API</strong>: Get, publish, stop journeys</li>');
        Write('<li><strong>Transactional Messaging</strong>: Send triggered emails</li>');
        Write('</ul>');

        Write('<p><strong>Note:</strong> SFMCIntegration handles OAuth2 authentication internally with Data Extension token caching.</p>');
        Write('<p><a href="?">Test with different credentials</a></p>');

    } catch (ex) {
        Write('<p style="color:red;">❌ ERROR: ' + (ex.message || String(ex) || 'Unknown error') + '</p>');
        if (ex.description) {
            Write('<p><strong>Description:</strong> ' + ex.description + '</p>');
        }
    }
}

</script>
