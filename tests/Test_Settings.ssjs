%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_Settings")=%%

<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: Settings
// ============================================================================

Write('<h2>Testing OmegaFrameworkSettings</h2>');

try {
    var settings = new OmegaFrameworkSettings();

    // Test 1: Get default config
    Write('<h3>Test 1: Get Default Config</h3>');
    var defaultConfig = settings.getConfig();
    Write('<pre>' + Stringify(defaultConfig, null, 2) + '</pre>');
    Write('<p>Status: ' + (defaultConfig.framework.name === 'OmegaFramework' ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 2: Configure settings
    Write('<h3>Test 2: Configure Settings</h3>');
    var testConfig = {
        auth: {
            clientId: 'test_client_id',
            clientSecret: 'test_secret',
            authBaseUrl: 'https://test.auth.marketingcloudapis.com/'
        }
    };
    settings.configure(testConfig);
    var updatedConfig = settings.getConfig();
    Write('<pre>' + Stringify(updatedConfig.auth, null, 2) + '</pre>');
    Write('<p>Status: ' + (updatedConfig.auth.clientId === 'test_client_id' ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 3: Get specific value
    Write('<h3>Test 3: Get Specific Value</h3>');
    var clientId = settings.get('auth.clientId');
    Write('<p>auth.clientId = ' + clientId + '</p>');
    Write('<p>Status: ' + (clientId === 'test_client_id' ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 4: Set specific value
    Write('<h3>Test 4: Set Specific Value</h3>');
    settings.set('logging.level', 'DEBUG');
    var logLevel = settings.get('logging.level');
    Write('<p>logging.level = ' + logLevel + '</p>');
    Write('<p>Status: ' + (logLevel === 'DEBUG' ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 5: Validate auth config
    Write('<h3>Test 5: Validate Auth Config</h3>');
    var validation = settings.validateAuthConfig();
    Write('<pre>' + Stringify(validation, null, 2) + '</pre>');
    Write('<p>Status: ' + (validation.valid ? '✅ PASS' : '❌ FAIL') + '</p>');

    Write('<hr><h3>✅ All Settings tests completed</h3>');

} catch (ex) {
    Write('<p style="color:red;">❌ ERROR: ' + ex.toString() + '</p>');
}

</script>
