<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_VeevaVaultIntegration - Test file for Veeva Vault integration
 *
 * Tests Veeva Vault API integration with Bearer token authentication
 *
 * @version 2.0.0
 */

// Load dependencies
</script>
%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_FW_BaseIntegration")=%%
%%=ContentBlockByKey("OMG_FW_BearerAuthStrategy")=%%
%%=ContentBlockByKey("OMG_FW_VeevaVaultIntegration")=%%
<script runat="server">

Write('<h2>VeevaVaultIntegration Test Suite</h2>');
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

// Test 1: Configuration validation
Write('<h3>Test 1: Valid Configuration Structure</h3>');
try {
    var vault1 = new VeevaVaultIntegration({
        baseUrl: 'https://test.veevavault.com',
        auth: {
            token: 'test-bearer-token-12345'
        }
    });

    var passed1 = vault1 && typeof vault1 === 'object';

    logTest('Should create instance with valid config', passed1,
        'Instance created: ' + (!!vault1));
} catch (ex) {
    logTest('Should create instance with valid config', false, ex.message || ex.toString());
}

// Test 2: Validation - Missing document ID
Write('<h3>Test 2: Validation - Missing Document ID</h3>');
try {
    var vault2 = new VeevaVaultIntegration({
        baseUrl: 'https://test.veevavault.com',
        auth: {
            token: 'test-token'
        }
    });

    var docResult = vault2.getDocument(null);
    var passed2 = !docResult.success && docResult.error.code === 'VALIDATION_ERROR';

    logTest('Should fail without document ID', passed2,
        docResult.error ? docResult.error.message : 'No error returned');
} catch (ex) {
    logTest('Should fail without document ID', false, ex.message || ex.toString());
}

// Test 3: Validation - Missing document name for create
Write('<h3>Test 3: Validation - Missing Document Name</h3>');
try {
    var vault3 = new VeevaVaultIntegration({
        baseUrl: 'https://test.veevavault.com',
        auth: {
            token: 'test-token'
        }
    });

    var createResult = vault3.createDocument({ type__v: 'test_type' });
    var passed3 = !createResult.success && createResult.error.code === 'VALIDATION_ERROR';

    logTest('Should fail without document name', passed3,
        createResult.error ? createResult.error.message : 'No error returned');
} catch (ex) {
    logTest('Should fail without document name', false, ex.message || ex.toString());
}

// Test 4: Validation - Missing document type for create
Write('<h3>Test 4: Validation - Missing Document Type</h3>');
try {
    var vault4 = new VeevaVaultIntegration({
        baseUrl: 'https://test.veevavault.com',
        auth: {
            token: 'test-token'
        }
    });

    var createResult4 = vault4.createDocument({ name__v: 'Test Document' });
    var passed4 = !createResult4.success && createResult4.error.code === 'VALIDATION_ERROR';

    logTest('Should fail without document type', passed4,
        createResult4.error ? createResult4.error.message : 'No error returned');
} catch (ex) {
    logTest('Should fail without document type', false, ex.message || ex.toString());
}

// Test 5: Validation - Missing document ID for update
Write('<h3>Test 5: Validation - Missing Document ID for Update</h3>');
try {
    var vault5 = new VeevaVaultIntegration({
        baseUrl: 'https://test.veevavault.com',
        auth: {
            token: 'test-token'
        }
    });

    var updateResult = vault5.updateDocument(null, { name__v: 'Updated' });
    var passed5 = !updateResult.success && updateResult.error.code === 'VALIDATION_ERROR';

    logTest('Should fail without document ID for update', passed5,
        updateResult.error ? updateResult.error.message : 'No error returned');
} catch (ex) {
    logTest('Should fail without document ID for update', false, ex.message || ex.toString());
}

// Test 6: Check method existence - getDocument
Write('<h3>Test 6: Method Existence - getDocument</h3>');
try {
    var vault6 = new VeevaVaultIntegration({
        baseUrl: 'https://test.veevavault.com',
        auth: {
            token: 'test-token'
        }
    });

    var hasMethod = typeof vault6.getDocument === 'function';

    logTest('Should have getDocument method', hasMethod, 'Method exists: ' + hasMethod);
} catch (ex) {
    logTest('Should have getDocument method', false, ex.message || ex.toString());
}

// Test 7: Check method existence - createDocument
Write('<h3>Test 7: Method Existence - createDocument</h3>');
try {
    var vault7 = new VeevaVaultIntegration({
        baseUrl: 'https://test.veevavault.com',
        auth: {
            token: 'test-token'
        }
    });

    var hasMethod7 = typeof vault7.createDocument === 'function';

    logTest('Should have createDocument method', hasMethod7, 'Method exists: ' + hasMethod7);
} catch (ex) {
    logTest('Should have createDocument method', false, ex.message || ex.toString());
}

// Test 8: Check method existence - getVaultMetadata
Write('<h3>Test 8: Method Existence - getVaultMetadata</h3>');
try {
    var vault8 = new VeevaVaultIntegration({
        baseUrl: 'https://test.veevavault.com',
        auth: {
            token: 'test-token'
        }
    });

    var hasMethod8 = typeof vault8.getVaultMetadata === 'function';

    logTest('Should have getVaultMetadata method', hasMethod8, 'Method exists: ' + hasMethod8);
} catch (ex) {
    logTest('Should have getVaultMetadata method', false, ex.message || ex.toString());
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
Write('<h3>Important Notes</h3>');
Write('<div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 10px 0;">');
Write('<strong>⚠️ End-to-End Testing</strong><br>');
Write('These tests validate configuration and validation logic without making actual API calls. ');
Write('To test actual Veeva Vault API integration, you need:<br><br>');
Write('<ol>');
Write('<li>A Veeva Vault instance</li>');
Write('<li>Valid user credentials</li>');
Write('<li>A session token obtained via Vault authentication endpoint</li>');
Write('<li>Proper permissions to access documents and metadata</li>');
Write('</ol>');
Write('</div>');

</script>
