<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_VeevaVaultIntegration - Test file for Veeva Vault integration
 *
 * Tests Veeva Vault API integration using CredentialStore
 *
 * ⚠️ IMPORTANT: Before running this test, you MUST:
 * 1. Create a credential in EncryptCredentials.html with name: "VeevaVaultTestAmerHP"
 * 2. Platform: VeevaVault
 * 3. AuthType: Basic
 * 4. Fill in your test Veeva Vault credentials (username/password)
 * 5. Token Endpoint: https://YOUR_VAULT.veevavault.com/api/v24.1/auth
 * 6. Base URL: https://YOUR_VAULT.veevavault.com
 *
 * @version 3.0.1
 * @framework OmegaFramework v3.0
 */

// ===========================
// Load OmegaFramework Modules
// ===========================

Write('<h1>VeevaVaultIntegration Test Suite</h1>');
Write('<div style="background: #fff3cd; padding: 15px; margin: 10px 0; border-left: 4px solid #ffc107;">');
Write('<strong>⚠️ CONFIGURATION REQUIRED</strong><br>');
Write('This test requires a credential named <strong>"VeevaVaultTestAmerHP"</strong> in OMG_FW_Credentials.<br>');
Write('If you haven\'t created it yet, go to EncryptCredentials.html and create it with:<br>');
Write('<ul style="margin: 10px 0 0 20px;">');
Write('<li>Integration Name: <code>VeevaVaultTestAmerHP</code></li>');
Write('<li>Platform: <code>VeevaVault</code></li>');
Write('<li>Auth Type: <code>Basic</code></li>');
Write('<li>Username/Password: Your Veeva test credentials</li>');
Write('<li>Token Endpoint: Your Veeva Vault auth URL (e.g., https://YOUR_VAULT.veevavault.com/api/v24.1/auth)</li>');
Write('<li>Base URL: Your Veeva Vault base URL (e.g., https://YOUR_VAULT.veevavault.com)</li>');
Write('</ul>');
Write('</div>');
Write('<hr>');

var CREDENTIAL_NAME = 'VeevaVaultTestAmerHP';

try {
    // Load OmegaFramework core
    Platform.Function.ContentBlockByKey("OMG_FW_OmegaFramework");

    if (typeof OmegaFramework === 'undefined') {
        throw new Error('OmegaFramework not loaded');
    }

    Write('<div style="background: #d4edda; padding: 15px; margin: 10px 0; border-left: 4px solid #28a745;">');
    Write('<strong>✅ OmegaFramework v3.0 loaded successfully</strong>');
    Write('</div>');

    Write('<div style="background: #d1ecf1; padding: 15px; margin: 10px 0; border-left: 4px solid #0c5460;">');
    Write('<strong>ℹ️ Using OmegaFramework.create() pattern for VeevaVaultIntegration</strong><br>');
    Write('Each test will create a new instance using: <code>OmegaFramework.create(\'VeevaVaultIntegration\', { integrationName: \'' + CREDENTIAL_NAME + '\' })</code>');
    Write('</div>');

} catch (ex) {
    Write('<div style="background: #f8d7da; padding: 15px; margin: 10px 0; border-left: 4px solid #dc3545;">');
    Write('<strong>❌ Error loading OmegaFramework:</strong> ' + ex.message);
    Write('<pre>' + Stringify(ex) + '</pre>');
    Write('</div>');
    throw ex;
}

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

// ===========================
// Test 1: Load credentials from CredentialStore
// ===========================
Write('<h3>Test 1: Load Credentials from CredentialStore</h3>');
try {
    var vault = OmegaFramework.create('VeevaVaultIntegration', {
        integrationName: CREDENTIAL_NAME
    });

    var passed1 = vault && typeof vault === 'object';

    logTest('Should create instance from CredentialStore', passed1,
        'Instance created using OmegaFramework.create() with credential: ' + CREDENTIAL_NAME);
} catch (ex) {
    logTest('Should create instance from CredentialStore', false,
        'Error: ' + (ex.message || ex.toString()) +
        '<br>Make sure credential "' + CREDENTIAL_NAME + '" exists in OMG_FW_Credentials');

    Write('<div style="background: #f8d7da; padding: 15px; margin: 10px 0; border-left: 4px solid #dc3545;">');
    Write('<strong>❌ Credential not found or invalid</strong><br>');
    Write('Please create the credential <code>' + CREDENTIAL_NAME + '</code> before running this test.');
    Write('</div>');
}

// ===========================
// Test 2: Authenticate with Veeva Vault
// ===========================
Write('<h3>Test 2: Authenticate with Veeva Vault (Real API Call)</h3>');
try {
    var vault2 = OmegaFramework.create('VeevaVaultIntegration', {
        integrationName: CREDENTIAL_NAME
    });

    // Attempt to get session token
    var authResult = vault2.authenticate();

    var passed2 = authResult && authResult.success === true;

    logTest('Should authenticate successfully', passed2,
        passed2
            ? 'Session token obtained: ' + (authResult.data.sessionId ? 'Yes' : 'No')
            : 'Authentication failed: ' + (authResult.error ? authResult.error.message : 'Unknown error'));

    if (passed2) {
        Write('<div style="background: #d4edda; padding: 10px; margin: 10px 0; border-left: 3px solid #28a745;">');
        Write('<strong>Session Info:</strong><br>');
        Write('User ID: ' + (authResult.data.userId || 'N/A') + '<br>');
        Write('Vault ID: ' + (authResult.data.vaultId || 'N/A') + '<br>');
        Write('Session obtained at: ' + new Date().toISOString());
        Write('</div>');
    }
} catch (ex) {
    logTest('Should authenticate successfully', false,
        'Exception: ' + (ex.message || ex.toString()));
}

// ===========================
// Test 3: Get Vault Metadata
// ===========================
Write('<h3>Test 3: Get Vault Metadata (Real API Call)</h3>');
try {
    var vault3 = OmegaFramework.create('VeevaVaultIntegration', {
        integrationName: CREDENTIAL_NAME
    });

    var metadataResult = vault3.getVaultMetadata();

    var passed3 = metadataResult && metadataResult.success === true;

    logTest('Should retrieve vault metadata', passed3,
        passed3
            ? 'Metadata retrieved successfully'
            : 'Failed: ' + (metadataResult.error ? metadataResult.error.message : 'Unknown error'));

    if (passed3 && metadataResult.data) {
        Write('<div style="background: #d1ecf1; padding: 10px; margin: 10px 0; border-left: 3px solid #0c5460;">');
        Write('<strong>Vault Metadata:</strong><br>');
        Write('<pre>' + Stringify(metadataResult.data, null, 2).substring(0, 500) + '...</pre>');
        Write('</div>');
    }
} catch (ex) {
    logTest('Should retrieve vault metadata', false,
        'Exception: ' + (ex.message || ex.toString()));
}

// ===========================
// Test 4: Validation Tests (No API Calls)
// ===========================
Write('<h3>Test 4: Validation - Missing Document ID</h3>');
try {
    var vault4 = OmegaFramework.create('VeevaVaultIntegration', {
        integrationName: CREDENTIAL_NAME
    });

    var docResult = vault4.getDocument(null);
    var passed4 = !docResult.success && docResult.error && docResult.error.code === 'VALIDATION_ERROR';

    logTest('Should fail without document ID', passed4,
        docResult.error ? docResult.error.message : 'No error returned');
} catch (ex) {
    logTest('Should fail without document ID', false, ex.message || ex.toString());
}

// ===========================
// Test 5: Validation - Missing Document Name for Create
// ===========================
Write('<h3>Test 5: Validation - Missing Document Name</h3>');
try {
    var vault5 = OmegaFramework.create('VeevaVaultIntegration', {
        integrationName: CREDENTIAL_NAME
    });

    var createResult = vault5.createDocument({ type__v: 'test_type' });
    var passed5 = !createResult.success && createResult.error && createResult.error.code === 'VALIDATION_ERROR';

    logTest('Should fail without document name', passed5,
        createResult.error ? createResult.error.message : 'No error returned');
} catch (ex) {
    logTest('Should fail without document name', false, ex.message || ex.toString());
}

// ===========================
// Test 6: Check Method Existence
// ===========================
Write('<h3>Test 6: Method Existence Checks</h3>');
try {
    var vault6 = OmegaFramework.create('VeevaVaultIntegration', {
        integrationName: CREDENTIAL_NAME
    });

    var hasGetDocument = typeof vault6.getDocument === 'function';
    var hasCreateDocument = typeof vault6.createDocument === 'function';
    var hasAuthenticate = typeof vault6.authenticate === 'function';
    var hasGetVaultMetadata = typeof vault6.getVaultMetadata === 'function';

    logTest('Should have getDocument method', hasGetDocument, 'Method exists: ' + hasGetDocument);
    logTest('Should have createDocument method', hasCreateDocument, 'Method exists: ' + hasCreateDocument);
    logTest('Should have authenticate method', hasAuthenticate, 'Method exists: ' + hasAuthenticate);
    logTest('Should have getVaultMetadata method', hasGetVaultMetadata, 'Method exists: ' + hasGetVaultMetadata);
} catch (ex) {
    logTest('Method existence checks', false, ex.message || ex.toString());
}

// ===========================
// Test Summary
// ===========================
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

// ===========================
// Important Notes
// ===========================
Write('<hr>');
Write('<h3>Important Notes</h3>');
Write('<div style="background-color: #d1ecf1; padding: 15px; border-left: 4px solid #0c5460; margin: 10px 0;">');
Write('<strong>ℹ️ About This Test</strong><br>');
Write('This test suite validates VeevaVaultIntegration using <strong>real credentials</strong> from CredentialStore.<br><br>');
Write('<strong>Tests performed:</strong><br>');
Write('<ol>');
Write('<li><strong>Credential Loading:</strong> Validates that the credential exists and can be loaded</li>');
Write('<li><strong>Authentication:</strong> Makes a real API call to Veeva Vault to obtain a session token</li>');
Write('<li><strong>Metadata Retrieval:</strong> Tests retrieving vault metadata (requires valid session)</li>');
Write('<li><strong>Validation Logic:</strong> Tests input validation without making API calls</li>');
Write('<li><strong>Method Existence:</strong> Verifies all expected methods are present</li>');
Write('</ol>');
Write('</div>');

Write('<div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 10px 0;">');
Write('<strong>⚠️ Troubleshooting</strong><br>');
Write('If tests fail, check the following:<br>');
Write('<ol>');
Write('<li><strong>Credential exists:</strong> Verify "' + CREDENTIAL_NAME + '" exists in OMG_FW_Credentials DE</li>');
Write('<li><strong>Credentials are valid:</strong> Username/password are correct for your Veeva Vault instance</li>');
Write('<li><strong>URLs are correct:</strong> Token Endpoint and Base URL match your vault</li>');
Write('<li><strong>Network access:</strong> SFMC can reach your Veeva Vault instance</li>');
Write('<li><strong>Permissions:</strong> The user has proper permissions in Veeva Vault</li>');
Write('</ol>');
Write('</div>');

Write('<div style="background-color: #e7f3ff; padding: 15px; border-left: 4px solid #2196F3; margin: 10px 0;">');
Write('<strong>📝 Next Steps</strong><br>');
Write('To test document operations (create, update, delete):<br>');
Write('<ol>');
Write('<li>Ensure you have a valid session (Test 2 should pass)</li>');
Write('<li>Use the <code>createDocument()</code>, <code>updateDocument()</code>, and <code>deleteDocument()</code> methods</li>');
Write('<li>Check the <strong>VeevaVaultIntegration.ssjs</strong> source for available methods</li>');
Write('</ol>');
Write('</div>');

</script>
