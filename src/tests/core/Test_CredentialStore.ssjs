<script runat="server">
    Platform.Load("core", "1.1.1");
    /**
     * Test_CredentialStore - Comprehensive integration test suite for CredentialStore
     *
     * This test assumes that the 'encrypt' and 'decrypt' methods on CredentialStore
     * have been made public for testing and utility purposes.
     *
     * PREREQUISITES:
     * - A Data Extension named 'OMG_FW_Credentials' must exist.
     * - Platform Variables must be saved in SFMC Key Management for encryption:
     *   - Sym_Cred (Password/Key)
     *   - Salt_Cred (Salt)
     *   - IV_Cred (Initialization Vector)
     */

try{
    // Load OmegaFramework
    Platform.Function.ContentBlockByName("OMG_FW_OmegaFramework");

    if (typeof OmegaFramework === 'undefined') {
        throw new Error('OmegaFramework not loaded');
    }

    Write('<h2>CredentialStore Integration Test Suite (OmegaFramework v1.0)</h2>');
    Write('<p>✅ OmegaFramework loaded</p>');
    Write('<p><em>Using public encrypt/decrypt methods from CredentialStore.</em></p>');
    Write('<hr>');

    // --- Test Runner Setup ---
    var testResults = [];
    var totalTests = 0;
    var passedTests = 0;
    var dataExtensionName = 'OMG_FW_Credentials';

    function logTest(testName, passed, details) {
        totalTests++;
        if (passed) passedTests++;

        var status = passed ? '✓ PASS' : '✗ FAIL';
        var color = passed ? 'green' : 'red';
        Write('<div style="color: ' + color + '; margin-bottom: 5px;">');
        Write('<strong>' + status + '</strong>: ' + testName);
        if (details) {
            Write('<br><span style="margin-left: 25px; font-size: 0.9em; word-break: break-all;">' + details + '</span>');
        }
        Write('</div>');
    }

    // --- Helper Functions for DE Interaction ---

    function insertTestCredential(testRecord) {
        try {
            var de = DataExtension.Init(dataExtensionName);

            // Try to remove existing record first (may fail if doesn't exist, that's ok)
            try {
                de.Rows.Remove(['Name'], [testRecord.Name]);
            } catch (removeEx) {
                // Ignore removal errors
            }

            // Try to add the record
            var res = de.Rows.Add(testRecord);

            return true;
        } catch (ex) {
            Write('<p style="color: red;"><strong>Error inserting test credential ' + testRecord.Name + ':</strong></p>');
            Write('<p style="color: red;">Message: ' + (ex.message || 'undefined') + '</p>');
            Write('<p style="color: red;">Description: ' + (ex.description || 'undefined') + '</p>');
            Write('<p style="color: red;">Type: ' + (typeof ex) + '</p>');
            Write('<pre>' + Stringify(ex, null, 2) + '</pre>');
            return false;
        }
    }

    function cleanupTestCredential(name) {
        try {
            DataExtension.Init(dataExtensionName).Rows.Remove(['Name'], [name]);
        } catch (ex) {
            // Suppress cleanup errors
        }
    }

    // --- Test Data Definition ---
    var testCases = {
        "OAuth2": { name: 'TEST_OAuth2_Integration', clientId: 'test-client-id-456', clientSecret: 'another-secret-oauth2-value', authUrl: 'https://auth.example.com' },
        "Basic": { name: 'TEST_Basic_Integration', username: 'test-user-2', password: 'another-secret-password' },
        "Bearer": { name: 'TEST_Bearer_Integration', staticToken: 'new-long-static-bearer-token-value' },
        "ApiKey": { name: 'TEST_ApiKey_Integration', apiKey: 'new-api-key-456', apiSecret: 'new-api-secret-789' },
        "Inactive": { name: 'TEST_Inactive_Integration', username: 'inactive-user-2', password: 'inactive-password-2' }
    };

    // ============================================================================
    // MAIN TEST EXECUTION
    // ============================================================================

    try {
        // Create a single helper instance to access the public encrypt/decrypt methods
        Write('<div class="progress-item info">');
        Write('<strong>🔍 Loading CredentialStore module...</strong>');
        Write('</div>');

        var cryptoHelper = OmegaFramework.require('CredentialStore', {
            integrationName: 'crypto_helper_instance'
        });

        Write('<div class="progress-item success">');
        Write('<strong>✅ CredentialStore loaded successfully</strong>');
        Write('</div>');

        // --- Test 0: Direct Encryption/Decryption Test ---
        Write('<h3>0. Direct Encryption/Decryption Test</h3>');
        var originalText = "Testing public methods!";
        var encryptedText = cryptoHelper.encrypt(originalText);
        logTest('encrypt() method should return an encrypted string', encryptedText && encryptedText !== originalText, 'Encrypted length: ' + (encryptedText ? encryptedText.length : 0));
        if(encryptedText) {
            var decryptedText = cryptoHelper.decrypt(encryptedText);
            logTest('decrypt() method should return the original string', decryptedText === originalText, 'Expected: ' + originalText + ', Got: ' + decryptedText);
        }

        // --- Test 1: OAuth2 Credential Lifecycle ---
        Write('<h3>1. OAuth2 Credential Test</h3>');
        var oauthData = testCases.OAuth2;
        var oauthRecord = { Name: oauthData.name, AuthType: 'OAuth2', IsActive: true, ClientId: cryptoHelper.encrypt(oauthData.clientId), ClientSecret: cryptoHelper.encrypt(oauthData.clientSecret), AuthUrl: oauthData.authUrl };
        if (insertTestCredential(oauthRecord)) {
            Write('<p style="color: blue;">✓ Credential inserted successfully, now retrieving...</p>');

            var store = OmegaFramework.require('CredentialStore', {
                integrationName: oauthData.name
            });

            var result = store.getCredentials();
            logTest('getCredentials() for OAuth2 should succeed', result.success, !result.success ? Stringify(result) : undefined);
            if (result.success) {
                logTest('Decrypted clientId should match original', result.data.clientId === oauthData.clientId, 'Expected: ' + oauthData.clientId + ', Got: ' + result.data.clientId);
                logTest('Decrypted clientSecret should match original', result.data.clientSecret === oauthData.clientSecret, 'Secret matching: ' + (result.data.clientSecret === oauthData.clientSecret));
            }
            cleanupTestCredential(oauthData.name);
        } else {
            Write('<p style="color: orange;">⚠️ Failed to insert OAuth2 test credential</p>');
        }

        // --- Test 2: Basic Auth Credential Lifecycle ---
        Write('<h3>2. Basic Auth Credential Test</h3>');
        var basicData = testCases.Basic;
        var basicRecord = { Name: basicData.name, AuthType: 'Basic', IsActive: true, Username: cryptoHelper.encrypt(basicData.username), Password: cryptoHelper.encrypt(basicData.password) };
        if (insertTestCredential(basicRecord)) {
            var store = OmegaFramework.require('CredentialStore', {
                integrationName: basicData.name
            });
            var result = store.getCredentials();
            logTest('getCredentials() for Basic Auth should succeed', result.success, !result.success ? Stringify(result) : undefined);
            if (result.success) {
                logTest('Decrypted username should match original', result.data.username === basicData.username, 'Expected: ' + basicData.username + ', Got: ' + result.data.username);
                logTest('Decrypted password should match original', result.data.password === basicData.password, 'Password matching: ' + (result.data.password === basicData.password));
            }
            cleanupTestCredential(basicData.name);
        } else {
            Write('<p style="color: orange;">⚠️ Failed to insert Basic Auth test credential</p>');
        }

        // --- Test 3: Bearer Token, ApiKey, Helpers, and Errors (condensed) ---
        Write('<h3>3. Bearer, ApiKey, Helpers & Errors</h3>');

        // Bearer
        var bearerData = testCases.Bearer;
        var bearerRecord = { Name: bearerData.name, AuthType: 'Bearer', IsActive: true, StaticToken: cryptoHelper.encrypt(bearerData.staticToken) };
        insertTestCredential(bearerRecord);
        var bearerStore = OmegaFramework.require('CredentialStore', {
            integrationName: bearerData.name
        });
        var bearerResult = bearerStore.getCredentials();
        logTest('Bearer getCredentials() succeeds', bearerResult.success);
        logTest('Bearer decrypted token matches', bearerResult.success && bearerResult.data.staticToken === bearerData.staticToken);
        cleanupTestCredential(bearerData.name);

        // ApiKey
        var apiKeyData = testCases.ApiKey;
        var apiKeyRecord = { Name: apiKeyData.name, AuthType: 'ApiKey', IsActive: true, ApiKey: cryptoHelper.encrypt(apiKeyData.apiKey), ApiSecret: cryptoHelper.encrypt(apiKeyData.apiSecret) };
        insertTestCredential(apiKeyRecord);
        var apiKeyStore = OmegaFramework.require('CredentialStore', {
            integrationName: apiKeyData.name
        });
        var apiKeyResult = apiKeyStore.getCredentials();
        logTest('ApiKey getCredentials() succeeds', apiKeyResult.success);
        logTest('ApiKey decrypted key matches', apiKeyResult.success && apiKeyResult.data.apiKey === apiKeyData.apiKey);
        cleanupTestCredential(apiKeyData.name);

        // Helper methods and error cases
        var listResult = cryptoHelper.listIntegrations();
        Write('<p style="color: blue;">listIntegrations() result:</p>');
        Write('<pre>' + Stringify(listResult, null, 2) + '</pre>');
        logTest('listIntegrations() should succeed and return an array', listResult.success && typeof listResult.data.length === 'number');

        var nonexistentStore = OmegaFramework.require('CredentialStore', {
            integrationName: 'NON_EXISTENT_CRED_456'
        });
        logTest('hasCredentials() returns false for non-existent credential', nonexistentStore.hasCredentials() === false);
        logTest('getRawCredentials() fails for non-existent credential', nonexistentStore.getRawCredentials().success === false);

        // Inactive
        var inactiveData = testCases.Inactive;
        var inactiveRecord = { Name: inactiveData.name, AuthType: 'Basic', IsActive: false, Username: cryptoHelper.encrypt(inactiveData.username), Password: cryptoHelper.encrypt(inactiveData.password) };
        insertTestCredential(inactiveRecord);
        var inactiveStore = OmegaFramework.require('CredentialStore', {
            integrationName: inactiveData.name
        });
        var inactiveResult = inactiveStore.getCredentials();
        logTest('getCredentials() fails for inactive credential', inactiveResult.success === false);
        cleanupTestCredential(inactiveData.name);


    } catch (e) {
        Write('<h2>A CRITICAL ERROR OCCURRED</h2>');
        Write('<p style="color: red;"><strong>Message:</strong> ' + (e.message || String(e) || e.toString() || 'Unknown error') + '</p>');
        Write('<p><strong>Error type:</strong> ' + (typeof e) + '</p>');
        Write('<p><strong>Error details:</strong></p>');
        Write('<pre>' + Stringify(e, null, 2) + '</pre>');
        if (e.stack) {
            Write('<p><strong>Stack trace:</strong></p>');
            Write('<pre>' + e.stack + '</pre>');
        }
    }


    // --- Test Summary ---
    Write('<hr><h3>Test Summary</h3>');
    var successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    Write('<div style="padding: 15px; background-color: #f5f5f5; border-radius: 5px;">');
    Write('<strong>Total Tests:</strong> ' + totalTests + '<br>');
    Write('<strong>Passed:</strong> <span style="color: green;">' + passedTests + '</span><br>');
    Write('<strong>Failed:</strong> <span style="color: red;">' + (totalTests - passedTests) + '</span><br>');
    Write('<strong>Success Rate:</strong> ' + successRate + '%');
    Write('</div>');

    if (totalTests > 0 && passedTests === totalTests) {
        Write('<h2 style="color: green;">✓ All Integration Tests Passed</h2>');
    } else {
        Write('<h2 style="color: red;">✗ Some Integration Tests Failed</h2>');
    }

}catch(ex){
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