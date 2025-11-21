<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_DataExtensionTokenCache - Tests for DataExtensionTokenCache
 * Tests token caching logic without requiring actual Data Extension
 *
 * @version 2.0.0
 */

</script>
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_DataExtensionTokenCache")=%%
<script runat="server">

Write('<h1>DataExtensionTokenCache Test Suite</h1>');
Write('<hr>');

var totalTests = 0;
var passedTests = 0;

function logTest(testName, passed, details) {
    totalTests++;
    if (passed) passedTests++;

    var status = passed ? '✓ PASS' : '✗ FAIL';
    var color = passed ? 'green' : 'red';

    Write('<div style="color: ' + color + '; margin: 10px 0;">');
    Write('<strong>' + status + '</strong>: ' + testName);
    if (details) {
        Write('<br><span style="margin-left: 20px; font-size: 0.9em;">' + details + '</span>');
    }
    Write('</div>');
}

// Test 1: Initialization with default config
Write('<h3>Test 1: Initialization with Default Config</h3>');
try {
    var cache1 = new DataExtensionTokenCache();

    logTest('Should initialize with default config',
        !!cache1,
        'DataExtensionTokenCache instance created');
} catch (ex) {
    logTest('Should initialize with default config', false, ex.message || ex.toString());
}

// Test 2: Initialization with custom config
Write('<h3>Test 2: Initialization with Custom Config</h3>');
try {
    var cache2 = new DataExtensionTokenCache({
        dataExtensionName: 'CustomTokenCache',
        refreshBuffer: 600000,
        cacheKey: 'test_key'
    });

    logTest('Should initialize with custom config',
        !!cache2,
        'Custom configuration accepted');
} catch (ex) {
    logTest('Should initialize with custom config', false, ex.message || ex.toString());
}

// Test 3: Generate cache key
Write('<h3>Test 3: Generate Cache Key</h3>');
try {
    var cache3 = new DataExtensionTokenCache();
    var cacheKey = cache3.generateCacheKey('test_client_id');

    logTest('Should generate cache key',
        typeof cacheKey === 'string' && cacheKey.length > 0,
        'Cache key: ' + cacheKey);
} catch (ex) {
    logTest('Should generate cache key', false, ex.message || ex.toString());
}

// Test 4: isExpired - expired token
Write('<h3>Test 4: isExpired - Expired Token</h3>');
try {
    var cache4 = new DataExtensionTokenCache({ refreshBuffer: 300000 }); // 5 minutes buffer

    var expiredToken = {
        access_token: 'test_token',
        expires_in: 3600,
        token_type: 'Bearer',
        retrieved_at: new Date().getTime() - 7200000 // 2 hours ago
    };

    var isExpired = cache4.isExpired(expiredToken);

    logTest('Should detect expired token',
        isExpired === true,
        'Token expired: ' + isExpired);
} catch (ex) {
    logTest('Should detect expired token', false, ex.message || ex.toString());
}

// Test 5: isExpired - valid token
Write('<h3>Test 5: isExpired - Valid Token</h3>');
try {
    var cache5 = new DataExtensionTokenCache({ refreshBuffer: 300000 }); // 5 minutes buffer

    var validToken = {
        access_token: 'test_token',
        expires_in: 3600,
        token_type: 'Bearer',
        retrieved_at: new Date().getTime() - 1000 // 1 second ago
    };

    var isExpired = cache5.isExpired(validToken);

    logTest('Should detect valid token',
        isExpired === false,
        'Token expired: ' + isExpired);
} catch (ex) {
    logTest('Should detect valid token', false, ex.message || ex.toString());
}

// Test 6: isExpired - token within refresh buffer
Write('<h3>Test 6: isExpired - Token Within Refresh Buffer</h3>');
try {
    var cache6 = new DataExtensionTokenCache({ refreshBuffer: 300000 }); // 5 minutes buffer

    var tokenNearExpiry = {
        access_token: 'test_token',
        expires_in: 3600, // 1 hour
        token_type: 'Bearer',
        retrieved_at: new Date().getTime() - 3300000 // 55 minutes ago (5 minutes before expiry)
    };

    var isExpired = cache6.isExpired(tokenNearExpiry);

    logTest('Should detect token within refresh buffer as expired',
        isExpired === true,
        'Token expired (within buffer): ' + isExpired);
} catch (ex) {
    logTest('Should detect token within refresh buffer as expired', false, ex.message || ex.toString());
}

// Test 7: isExpired - null token
Write('<h3>Test 7: isExpired - Null Token</h3>');
try {
    var cache7 = new DataExtensionTokenCache();
    var isExpired = cache7.isExpired(null);

    logTest('Should handle null token',
        isExpired === true,
        'Null token treated as expired: ' + isExpired);
} catch (ex) {
    logTest('Should handle null token', false, ex.message || ex.toString());
}

// Test 8: isExpired - token without required fields
Write('<h3>Test 8: isExpired - Token Without Required Fields</h3>');
try {
    var cache8 = new DataExtensionTokenCache();
    var invalidToken = { access_token: 'test' }; // Missing expires_in and retrieved_at

    var isExpired = cache8.isExpired(invalidToken);

    logTest('Should handle incomplete token',
        isExpired === true,
        'Incomplete token treated as expired: ' + isExpired);
} catch (ex) {
    logTest('Should handle incomplete token', false, ex.message || ex.toString());
}

// Test 9: Cache key generation consistency
Write('<h3>Test 9: Cache Key Generation Consistency</h3>');
try {
    var cache9 = new DataExtensionTokenCache();
    var key1 = cache9.generateCacheKey('test_id');
    var key2 = cache9.generateCacheKey('test_id');

    logTest('Should generate consistent cache keys',
        key1 === key2,
        'Key 1: ' + key1 + ', Key 2: ' + key2);
} catch (ex) {
    logTest('Should generate consistent cache keys', false, ex.message || ex.toString());
}

// Test 10: Cache key generation uniqueness
Write('<h3>Test 10: Cache Key Generation Uniqueness</h3>');
try {
    var cache10 = new DataExtensionTokenCache();
    var key1 = cache10.generateCacheKey('test_id_1');
    var key2 = cache10.generateCacheKey('test_id_2');

    logTest('Should generate unique cache keys for different identifiers',
        key1 !== key2,
        'Key 1: ' + key1 + ', Key 2: ' + key2);
} catch (ex) {
    logTest('Should generate unique cache keys for different identifiers', false, ex.message || ex.toString());
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

Write('<div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">');
Write('<strong>Note:</strong> These tests validate token expiration logic and cache key generation. ');
Write('Actual Data Extension read/write operations require the OMG_FW_TokenCache DE to exist ');
Write('and are tested through integration tests. Use CreateTokenCacheDE.ssjs to create the required Data Extension.');
Write('</div>');

</script>
