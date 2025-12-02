%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_DataExtensionTokenCache")=%%

<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: DataExtensionTokenCache
// ============================================================================

Write('<h2>Testing DataExtensionTokenCache</h2>');
Write('<p><strong>Note:</strong> This test requires the Data Extension "OMG_FW_TokenCache" to exist.</p>');

try {
    var cache = new DataExtensionTokenCache({
        cacheKey: 'test_client_id_123'
    });

    // Test 1: Generate cache key
    Write('<h3>Test 1: Generate Cache Key</h3>');
    var key1 = cache.generateCacheKey('test_client_id_123');
    var key2 = cache.generateCacheKey('another_client_id');
    Write('<p>Key 1: ' + key1 + '</p>');
    Write('<p>Key 2: ' + key2 + '</p>');
    Write('<p>Status: ' + (key1 !== key2 ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 2: Set token
    Write('<h3>Test 2: Set Token</h3>');
    var testToken = {
        accessToken: 'test_token_' + new Date().getTime(),
        tokenType: 'Bearer',
        expiresIn: 3600,
        obtainedAt: new Date().getTime(),
        scope: 'test_scope',
        restInstanceUrl: 'https://test.rest.marketingcloudapis.com',
        soapInstanceUrl: 'https://test.soap.marketingcloudapis.com'
    };

    var setResult = cache.set(testToken);
    Write('<pre>' + Stringify(setResult, null, 2) + '</pre>');
    Write('<p>Status: ' + (setResult.success ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 3: Get token
    Write('<h3>Test 3: Get Token</h3>');
    var getResult = cache.get();
    if (getResult.success && getResult.data) {
        Write('<p>✅ Token retrieved successfully</p>');
        Write('<p>Access Token: ' + getResult.data.accessToken.substring(0, 20) + '...</p>');
        Write('<p>Expires In: ' + getResult.data.expiresIn + ' seconds</p>');
        Write('<p>Status: ✅ PASS</p>');
    } else {
        Write('<p>❌ Token retrieval failed or returned null</p>');
        Write('<pre>' + Stringify(getResult, null, 2) + '</pre>');
        Write('<p>Status: ❌ FAIL</p>');
    }

    // Test 4: Check if token is expired
    Write('<h3>Test 4: Check Token Expiration</h3>');
    if (getResult.success && getResult.data) {
        var isExpired = cache.isExpired(getResult.data);
        Write('<p>Is Expired: ' + isExpired + '</p>');
        Write('<p>Status: ' + (!isExpired ? '✅ PASS' : '❌ FAIL') + '</p>');
    } else {
        Write('<p>⚠️ SKIP - No valid token to check</p>');
    }

    // Test 5: Has valid token
    Write('<h3>Test 5: Has Valid Token</h3>');
    var hasToken = cache.hasValidToken();
    Write('<p>Has Valid Token: ' + hasToken + '</p>');
    Write('<p>Status: ' + (hasToken ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 6: Test expired token
    Write('<h3>Test 6: Test Expired Token Detection</h3>');
    var expiredToken = {
        accessToken: 'expired_token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        obtainedAt: new Date().getTime() - 7200000, // 2 hours ago
        scope: 'test_scope'
    };
    var isExpiredOld = cache.isExpired(expiredToken);
    Write('<p>Is Old Token Expired: ' + isExpiredOld + '</p>');
    Write('<p>Status: ' + (isExpiredOld ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 7: Clear token
    Write('<h3>Test 7: Clear Token</h3>');
    var clearResult = cache.clear();
    Write('<pre>' + Stringify(clearResult, null, 2) + '</pre>');
    Write('<p>Status: ' + (clearResult.success ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 8: Verify token cleared
    Write('<h3>Test 8: Verify Token Cleared</h3>');
    var getAfterClear = cache.get();
    Write('<p>Token after clear: ' + (getAfterClear.data === null ? 'null (expected)' : 'still exists') + '</p>');
    Write('<p>Status: ' + (getAfterClear.success && getAfterClear.data === null ? '✅ PASS' : '❌ FAIL') + '</p>');

    Write('<hr><h3>✅ All DataExtensionTokenCache tests completed</h3>');

} catch (ex) {
    Write('<p style="color:red;">❌ ERROR: ' + ex.toString() + '</p>');
    Write('<p style="color:orange;">⚠️ Make sure the Data Extension "OMG_FW_TokenCache" exists with the correct structure.</p>');
}

</script>
