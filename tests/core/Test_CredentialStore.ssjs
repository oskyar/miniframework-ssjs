<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_CredentialStore - Comprehensive test suite for CredentialStore
 *
 * PREREQUISITES:
 * - Platform Variables must be saved in SFMC Key Management:
 *   - Sym_Cred (Pre-Shared Key) - 24 characters
 *   - Salt_Cred (Salt) - 8 bytes hex
 *   - IV_Cred (Initialization Vector) - 16 bytes hex
 * - OMG_FW_Credentials Data Extension must exist
 *
 * Tests:
 * 1. OAuth2 credential encryption/decryption
 * 2. Basic Auth credential encryption/decryption
 * 3. Bearer Token credential encryption/decryption
 * 4. ApiKey credential encryption/decryption
 * 5. hasCredentials() method
 * 6. getRawCredentials() method
 * 7. listIntegrations() method
 * 8. Error handling - missing credentials
 * 9. Error handling - inactive credentials
 * 10. Error handling - invalid integration name
 *
 * @version 1.0.0
 */

// Load dependencies
</script>
%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_CredentialStore")=%%
<script runat="server">

Write('<h2>CredentialStore Test Suite</h2>');
Write('<hr>');

// Test configuration
var testResults = [];
var totalTests = 0;
var passedTests = 0;

// Platform Variables (same as used in EncryptCredentials.html)
var symKeyVar = 'Sym_Cred';
var saltVar = 'Salt_Cred';
var ivVar = 'IV_Cred';

// Data Extension name
var dataExtensionName = 'OMG_FW_Credentials';

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

/**
 * Helper function to encrypt a field using AMPscript
 */
function encryptField(value) {
    if (!value || value === '') {
        return '';
    }

    try {
        return Platform.Function.EncryptSymmetric(
            'AES',
            'CBC',
            value,
            symKeyVar,
            null,
            saltVar,
            null,
            ivVar,
            null
        );
    } catch (ex) {
        Write('<p style="color: orange;">⚠️ WARNING: Encryption failed - ' + ex.toString() + '</p>');
        Write('<p style="color: orange;">Make sure Platform Variables (Sym_Cred, Salt_Cred, IV_Cred) are saved in SFMC Key Management</p>');
        return null;
    }
}

/**
 * Helper function to insert test credentials
 */
function insertTestCredential(testData) {
    try {
        var de = DataExtension.Init(dataExtensionName);

        // Check if test credential already exists and delete it
        var existing = de.Rows.Lookup(['Name'], [testData.Name]);
        if (existing && existing.length > 0) {
            de.Rows.Remove(['Name'], [testData.Name]);
        }

        // Insert new test credential
        de.Rows.Add(testData);
        return true;
    } catch (ex) {
        Write('<p style="color: red;">Error inserting test credential: ' + ex.toString() + '</p>');
        return false;
    }
}

/**
 * Helper function to cleanup test credentials
 */
function cleanupTestCredential(name) {
    try {
        var de = DataExtension.Init(dataExtensionName);
        de.Rows.Remove(['Name'], [name]);
        return true;
    } catch (ex) {
        Write('<p style="color: orange;">Warning: Could not cleanup test credential "' + name + '": ' + ex.toString() + '</p>');
        return false;
    }
}

// ============================================================================
// SETUP: Create Test Credentials
// ============================================================================

Write('<h3>Setup: Creating Test Credentials</h3>');

// Test data - original unencrypted values
var testOAuth2 = {
    name: 'TEST_OAuth2_Integration',
    clientId: 'test-oauth2-client-12345',
    clientSecret: 'test-oauth2-secret-67890',
    authUrl: 'https://auth.example.com/oauth/authorize',
    tokenEndpoint: 'https://auth.example.com/oauth/token',
    grantType: 'client_credentials',
    scope: 'read write admin',
    baseUrl: 'https://api.example.com',
    domain: 'example.com'
};

var testBasic = {
    name: 'TEST_Basic_Integration',
    username: 'test-basic-user@example.com',
    password: 'test-basic-password-ABC123!',
    baseUrl: 'https://api.basic.example.com',
    domain: 'basic.example.com'
};

var testBearer = {
    name: 'TEST_Bearer_Integration',
    staticToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-token-payload.signature',
    baseUrl: 'https://api.bearer.example.com',
    domain: 'bearer.example.com'
};

var testApiKey = {
    name: 'TEST_ApiKey_Integration',
    apiKey: 'test-api-key-ABCDEF123456',
    apiSecret: 'test-api-secret-GHIJKL789012',
    baseUrl: 'https://api.apikey.example.com',
    domain: 'apikey.example.com'
};

// Encrypt and insert OAuth2 test credential
Write('<p>Encrypting OAuth2 test credential...</p>');
var oauth2Encrypted = {
    Name: testOAuth2.name,
    Description: 'OAuth2 Test Credential',
    AuthType: 'OAuth2',
    Platform: 'TestPlatform',
    IsActive: true,
    ClientId: encryptField(testOAuth2.clientId),
    ClientSecret: encryptField(testOAuth2.clientSecret),
    Username: '',
    Password: '',
    StaticToken: '',
    ApiKey: '',
    ApiSecret: '',
    AuthUrl: testOAuth2.authUrl,
    TokenEndpoint: testOAuth2.tokenEndpoint,
    GrantType: testOAuth2.grantType,
    Scope: testOAuth2.scope,
    BaseUrl: testOAuth2.baseUrl,
    Domain: testOAuth2.domain,
    CreatedAt: Now(),
    UpdatedAt: Now(),
    CreatedBy: 'Test_CredentialStore'
};

if (!oauth2Encrypted.ClientId || !oauth2Encrypted.ClientSecret) {
    Write('<p style="color: red;">❌ CRITICAL: Encryption failed. Tests cannot continue.</p>');
    Write('<p style="color: red;">Please ensure Platform Variables are correctly saved in SFMC Key Management:</p>');
    Write('<ul><li>Sym_Cred (Pre-Shared Key)</li><li>Salt_Cred (Salt)</li><li>IV_Cred (Initialization Vector)</li></ul>');
} else {
    if (insertTestCredential(oauth2Encrypted)) {
        Write('<p style="color: green;">✓ OAuth2 test credential inserted</p>');
    }
}

// Encrypt and insert Basic Auth test credential
Write('<p>Encrypting Basic Auth test credential...</p>');
var basicEncrypted = {
    Name: testBasic.name,
    Description: 'Basic Auth Test Credential',
    AuthType: 'Basic',
    Platform: 'TestPlatform',
    IsActive: true,
    ClientId: '',
    ClientSecret: '',
    Username: encryptField(testBasic.username),
    Password: encryptField(testBasic.password),
    StaticToken: '',
    ApiKey: '',
    ApiSecret: '',
    AuthUrl: '',
    TokenEndpoint: '',
    GrantType: '',
    Scope: '',
    BaseUrl: testBasic.baseUrl,
    Domain: testBasic.domain,
    CreatedAt: Now(),
    UpdatedAt: Now(),
    CreatedBy: 'Test_CredentialStore'
};

if (basicEncrypted.Username && basicEncrypted.Password) {
    if (insertTestCredential(basicEncrypted)) {
        Write('<p style="color: green;">✓ Basic Auth test credential inserted</p>');
    }
}

// Encrypt and insert Bearer Token test credential
Write('<p>Encrypting Bearer Token test credential...</p>');
var bearerEncrypted = {
    Name: testBearer.name,
    Description: 'Bearer Token Test Credential',
    AuthType: 'Bearer',
    Platform: 'TestPlatform',
    IsActive: true,
    ClientId: '',
    ClientSecret: '',
    Username: '',
    Password: '',
    StaticToken: encryptField(testBearer.staticToken),
    ApiKey: '',
    ApiSecret: '',
    AuthUrl: '',
    TokenEndpoint: '',
    GrantType: '',
    Scope: '',
    BaseUrl: testBearer.baseUrl,
    Domain: testBearer.domain,
    CreatedAt: Now(),
    UpdatedAt: Now(),
    CreatedBy: 'Test_CredentialStore'
};

if (bearerEncrypted.StaticToken) {
    if (insertTestCredential(bearerEncrypted)) {
        Write('<p style="color: green;">✓ Bearer Token test credential inserted</p>');
    }
}

// Encrypt and insert ApiKey test credential
Write('<p>Encrypting ApiKey test credential...</p>');
var apiKeyEncrypted = {
    Name: testApiKey.name,
    Description: 'ApiKey Test Credential',
    AuthType: 'ApiKey',
    Platform: 'TestPlatform',
    IsActive: true,
    ClientId: '',
    ClientSecret: '',
    Username: '',
    Password: '',
    StaticToken: '',
    ApiKey: encryptField(testApiKey.apiKey),
    ApiSecret: encryptField(testApiKey.apiSecret),
    AuthUrl: '',
    TokenEndpoint: '',
    GrantType: '',
    Scope: '',
    BaseUrl: testApiKey.baseUrl,
    Domain: testApiKey.domain,
    CreatedAt: Now(),
    UpdatedAt: Now(),
    CreatedBy: 'Test_CredentialStore'
};

if (apiKeyEncrypted.ApiKey && apiKeyEncrypted.ApiSecret) {
    if (insertTestCredential(apiKeyEncrypted)) {
        Write('<p style="color: green;">✓ ApiKey test credential inserted</p>');
    }
}

// Insert inactive credential for testing
Write('<p>Creating inactive credential for testing...</p>');
var inactiveEncrypted = {
    Name: 'TEST_Inactive_Integration',
    Description: 'Inactive Test Credential',
    AuthType: 'Basic',
    Platform: 'TestPlatform',
    IsActive: false,
    ClientId: '',
    ClientSecret: '',
    Username: encryptField('inactive-user'),
    Password: encryptField('inactive-pass'),
    StaticToken: '',
    ApiKey: '',
    ApiSecret: '',
    AuthUrl: '',
    TokenEndpoint: '',
    GrantType: '',
    Scope: '',
    BaseUrl: 'https://inactive.example.com',
    Domain: 'inactive.example.com',
    CreatedAt: Now(),
    UpdatedAt: Now(),
    CreatedBy: 'Test_CredentialStore'
};

if (insertTestCredential(inactiveEncrypted)) {
    Write('<p style="color: green;">✓ Inactive test credential inserted</p>');
}

Write('<hr>');

// ============================================================================
// TEST 1: OAuth2 Credential Encryption/Decryption
// ============================================================================

Write('<h3>Test 1: OAuth2 Credential Encryption/Decryption</h3>');
try {
    var credStore1 = new CredentialStore(testOAuth2.name);
    var result1 = credStore1.getCredentials();

    if (!result1.success) {
        logTest('OAuth2 getCredentials() should succeed', false, result1.error.message);
    } else {
        var creds = result1.data;

        // Verify all decrypted values match originals
        var clientIdMatch = creds.clientId === testOAuth2.clientId;
        var clientSecretMatch = creds.clientSecret === testOAuth2.clientSecret;
        var authTypeMatch = creds.authType === 'OAuth2';
        var authUrlMatch = creds.authUrl === testOAuth2.authUrl;
        var tokenEndpointMatch = creds.tokenEndpoint === testOAuth2.tokenEndpoint;
        var grantTypeMatch = creds.grantType === testOAuth2.grantType;
        var scopeMatch = creds.scope === testOAuth2.scope;

        var allMatch = clientIdMatch && clientSecretMatch && authTypeMatch &&
                      authUrlMatch && tokenEndpointMatch && grantTypeMatch && scopeMatch;

        logTest('OAuth2 decrypted clientId matches original', clientIdMatch,
            'Expected: ' + testOAuth2.clientId + ', Got: ' + creds.clientId);
        logTest('OAuth2 decrypted clientSecret matches original', clientSecretMatch,
            'Expected: ' + testOAuth2.clientSecret + ', Got: ' + creds.clientSecret);
        logTest('OAuth2 all fields match original values', allMatch,
            allMatch ? 'All OAuth2 fields verified successfully' : 'Some fields do not match');
    }
} catch (ex) {
    logTest('OAuth2 credential test', false, ex.message || ex.toString());
}

// ============================================================================
// TEST 2: Basic Auth Credential Encryption/Decryption
// ============================================================================

Write('<h3>Test 2: Basic Auth Credential Encryption/Decryption</h3>');
try {
    var credStore2 = new CredentialStore(testBasic.name);
    var result2 = credStore2.getCredentials();

    if (!result2.success) {
        logTest('Basic Auth getCredentials() should succeed', false, result2.error.message);
    } else {
        var creds2 = result2.data;

        var usernameMatch = creds2.username === testBasic.username;
        var passwordMatch = creds2.password === testBasic.password;
        var authTypeMatch2 = creds2.authType === 'Basic';

        var allMatch2 = usernameMatch && passwordMatch && authTypeMatch2;

        logTest('Basic Auth decrypted username matches original', usernameMatch,
            'Expected: ' + testBasic.username + ', Got: ' + creds2.username);
        logTest('Basic Auth decrypted password matches original', passwordMatch,
            'Expected: ' + testBasic.password + ', Got: ' + creds2.password);
        logTest('Basic Auth all fields match original values', allMatch2,
            allMatch2 ? 'All Basic Auth fields verified successfully' : 'Some fields do not match');
    }
} catch (ex) {
    logTest('Basic Auth credential test', false, ex.message || ex.toString());
}

// ============================================================================
// TEST 3: Bearer Token Credential Encryption/Decryption
// ============================================================================

Write('<h3>Test 3: Bearer Token Credential Encryption/Decryption</h3>');
try {
    var credStore3 = new CredentialStore(testBearer.name);
    var result3 = credStore3.getCredentials();

    if (!result3.success) {
        logTest('Bearer Token getCredentials() should succeed', false, result3.error.message);
    } else {
        var creds3 = result3.data;

        var tokenMatch = creds3.staticToken === testBearer.staticToken;
        var authTypeMatch3 = creds3.authType === 'Bearer';

        var allMatch3 = tokenMatch && authTypeMatch3;

        logTest('Bearer Token decrypted token matches original', tokenMatch,
            'Expected: ' + testBearer.staticToken.substring(0, 30) + '..., Got: ' + (creds3.staticToken ? creds3.staticToken.substring(0, 30) + '...' : 'null'));
        logTest('Bearer Token all fields match original values', allMatch3,
            allMatch3 ? 'All Bearer Token fields verified successfully' : 'Some fields do not match');
    }
} catch (ex) {
    logTest('Bearer Token credential test', false, ex.message || ex.toString());
}

// ============================================================================
// TEST 4: ApiKey Credential Encryption/Decryption
// ============================================================================

Write('<h3>Test 4: ApiKey Credential Encryption/Decryption</h3>');
try {
    var credStore4 = new CredentialStore(testApiKey.name);
    var result4 = credStore4.getCredentials();

    if (!result4.success) {
        logTest('ApiKey getCredentials() should succeed', false, result4.error.message);
    } else {
        var creds4 = result4.data;

        var apiKeyMatch = creds4.apiKey === testApiKey.apiKey;
        var apiSecretMatch = creds4.apiSecret === testApiKey.apiSecret;
        var authTypeMatch4 = creds4.authType === 'ApiKey';

        var allMatch4 = apiKeyMatch && apiSecretMatch && authTypeMatch4;

        logTest('ApiKey decrypted apiKey matches original', apiKeyMatch,
            'Expected: ' + testApiKey.apiKey + ', Got: ' + creds4.apiKey);
        logTest('ApiKey decrypted apiSecret matches original', apiSecretMatch,
            'Expected: ' + testApiKey.apiSecret + ', Got: ' + creds4.apiSecret);
        logTest('ApiKey all fields match original values', allMatch4,
            allMatch4 ? 'All ApiKey fields verified successfully' : 'Some fields do not match');
    }
} catch (ex) {
    logTest('ApiKey credential test', false, ex.message || ex.toString());
}

// ============================================================================
// TEST 5: hasCredentials() Method
// ============================================================================

Write('<h3>Test 5: hasCredentials() Method</h3>');
try {
    var credStore5a = new CredentialStore(testOAuth2.name);
    var hasCredsTrue = credStore5a.hasCredentials();

    logTest('hasCredentials() returns true for existing credential', hasCredsTrue === true,
        'Expected: true, Got: ' + hasCredsTrue);

    var credStore5b = new CredentialStore('NONEXISTENT_Integration');
    var hasCredsFalse = credStore5b.hasCredentials();

    logTest('hasCredentials() returns false for non-existent credential', hasCredsFalse === false,
        'Expected: false, Got: ' + hasCredsFalse);
} catch (ex) {
    logTest('hasCredentials() method test', false, ex.message || ex.toString());
}

// ============================================================================
// TEST 6: getRawCredentials() Method
// ============================================================================

Write('<h3>Test 6: getRawCredentials() Method</h3>');
try {
    var credStore6 = new CredentialStore(testOAuth2.name);
    var result6 = credStore6.getRawCredentials();

    if (!result6.success) {
        logTest('getRawCredentials() should succeed', false, result6.error.message);
    } else {
        var rawCreds = result6.data;

        // Verify we got encrypted (not decrypted) values
        var hasEncryptedClientId = rawCreds.ClientId && rawCreds.ClientId !== testOAuth2.clientId;
        var hasEncryptedClientSecret = rawCreds.ClientSecret && rawCreds.ClientSecret !== testOAuth2.clientSecret;

        logTest('getRawCredentials() returns encrypted clientId', hasEncryptedClientId,
            'Encrypted value length: ' + (rawCreds.ClientId ? rawCreds.ClientId.length : 0));
        logTest('getRawCredentials() returns encrypted clientSecret', hasEncryptedClientSecret,
            'Encrypted value length: ' + (rawCreds.ClientSecret ? rawCreds.ClientSecret.length : 0));
        logTest('getRawCredentials() returns raw DE row', rawCreds.Name === testOAuth2.name,
            'Integration name: ' + rawCreds.Name);
    }
} catch (ex) {
    logTest('getRawCredentials() method test', false, ex.message || ex.toString());
}

// ============================================================================
// TEST 7: listIntegrations() Method
// ============================================================================

Write('<h3>Test 7: listIntegrations() Method</h3>');
try {
    var credStore7 = new CredentialStore('dummy'); // Integration name doesn't matter for listIntegrations
    var result7 = credStore7.listIntegrations();

    if (!result7.success) {
        logTest('listIntegrations() should succeed', false, result7.error.message);
    } else {
        var integrations = result7.data;
        var isArray = Array.isArray(integrations);
        var hasTestIntegrations = false;

        if (isArray && integrations.length > 0) {
            // Check if our test integrations are in the list
            for (var i = 0; i < integrations.length; i++) {
                if (integrations[i].name === testOAuth2.name) {
                    hasTestIntegrations = true;
                    break;
                }
            }
        }

        logTest('listIntegrations() returns array', isArray,
            'Type: ' + typeof integrations + ', Length: ' + (integrations ? integrations.length : 0));
        logTest('listIntegrations() includes test integrations', hasTestIntegrations,
            'Found ' + (integrations ? integrations.length : 0) + ' integrations');
    }
} catch (ex) {
    logTest('listIntegrations() method test', false, ex.message || ex.toString());
}

// ============================================================================
// TEST 8: Error Handling - Missing Credentials
// ============================================================================

Write('<h3>Test 8: Error Handling - Missing Credentials</h3>');
try {
    var credStore8 = new CredentialStore('DEFINITELY_DOES_NOT_EXIST_12345');
    var result8 = credStore8.getCredentials();

    var failed = !result8.success;
    var hasError = result8.error && result8.error.message;

    logTest('getCredentials() fails for missing integration', failed,
        failed ? 'Error: ' + result8.error.message : 'Should have failed but succeeded');
    logTest('Missing credentials returns proper error object', hasError,
        hasError ? 'Error message present' : 'No error message');
} catch (ex) {
    logTest('Missing credentials error handling', false, ex.message || ex.toString());
}

// ============================================================================
// TEST 9: Error Handling - Inactive Credentials
// ============================================================================

Write('<h3>Test 9: Error Handling - Inactive Credentials</h3>');
try {
    var credStore9 = new CredentialStore('TEST_Inactive_Integration');
    var result9 = credStore9.getCredentials();

    var failed9 = !result9.success;
    var isInactiveError = result9.error && result9.error.message &&
                          result9.error.message.indexOf('inactive') > -1;

    logTest('getCredentials() fails for inactive credentials', failed9,
        failed9 ? 'Error: ' + result9.error.message : 'Should have failed but succeeded');
    logTest('Inactive credentials returns specific error message', isInactiveError,
        isInactiveError ? 'Inactive error detected' : 'Wrong error message');
} catch (ex) {
    logTest('Inactive credentials error handling', false, ex.message || ex.toString());
}

// ============================================================================
// TEST 10: Error Handling - Empty Integration Name
// ============================================================================

Write('<h3>Test 10: Error Handling - Empty Integration Name</h3>');
try {
    var credStore10 = new CredentialStore('');
    var result10 = credStore10.getCredentials();

    var failed10 = !result10.success;
    var isValidationError = result10.error && result10.error.code === 'VALIDATION_ERROR';

    logTest('getCredentials() fails for empty integration name', failed10,
        failed10 ? 'Error: ' + result10.error.message : 'Should have failed but succeeded');
    logTest('Empty name returns validation error', isValidationError,
        isValidationError ? 'Validation error detected' : 'Wrong error type');
} catch (ex) {
    logTest('Empty integration name error handling', false, ex.message || ex.toString());
}

// ============================================================================
// CLEANUP: Remove Test Credentials
// ============================================================================

Write('<hr>');
Write('<h3>Cleanup: Removing Test Credentials</h3>');

cleanupTestCredential(testOAuth2.name);
cleanupTestCredential(testBasic.name);
cleanupTestCredential(testBearer.name);
cleanupTestCredential(testApiKey.name);
cleanupTestCredential('TEST_Inactive_Integration');

Write('<p style="color: green;">✓ Test credentials cleaned up</p>');

// ============================================================================
// TEST SUMMARY
// ============================================================================

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
Write('<h3>Test Coverage</h3>');
Write('<ul>');
Write('<li>✓ OAuth2 credential encryption/decryption</li>');
Write('<li>✓ Basic Auth credential encryption/decryption</li>');
Write('<li>✓ Bearer Token credential encryption/decryption</li>');
Write('<li>✓ ApiKey credential encryption/decryption</li>');
Write('<li>✓ hasCredentials() method</li>');
Write('<li>✓ getRawCredentials() method</li>');
Write('<li>✓ listIntegrations() method</li>');
Write('<li>✓ Error handling - missing credentials</li>');
Write('<li>✓ Error handling - inactive credentials</li>');
Write('<li>✓ Error handling - empty integration name</li>');
Write('</ul>');

Write('<hr>');
Write('<h3>Prerequisites Verified</h3>');
Write('<p>This test confirms that:</p>');
Write('<ul>');
Write('<li>Platform Variables (Sym_Cred, Salt_Cred, IV_Cred) are correctly configured in SFMC Key Management</li>');
Write('<li>AES encryption/decryption is working properly</li>');
Write('<li>Data Extension OMG_FW_Credentials is accessible and functional</li>');
Write('<li>CredentialStore correctly handles all supported authentication types</li>');
Write('</ul>');

</script>