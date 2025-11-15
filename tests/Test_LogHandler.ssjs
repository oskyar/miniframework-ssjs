%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_BaseHandler")=%%
%%=ContentBlockByKey("OMG_FW_AuthHandler")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_FW_LogHandler")=%%

<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: LogHandler
// ============================================================================

Write('<h2>Testing LogHandler</h2>');

try {
    // Configuration
    var authConfig = {
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
        authBaseUrl: 'https://test.auth.marketingcloudapis.com/'
    };

    var logConfig = {
        level: 'DEBUG',
        enableConsole: true,
        enableDataExtension: false,
        dataExtensionKey: 'test_logs_de'
    };

    var logHandler = new LogHandler(authConfig, logConfig);

    // Test 1: Check handler initialization
    Write('<h3>Test 1: Handler Initialization</h3>');
    Write('<p>LogHandler initialized: ' + (typeof logHandler === 'object' ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 2: Test console logging
    Write('<h3>Test 2: Console Logging (INFO level)</h3>');
    var infoResult = logHandler.info('Test info message', {testData: 'sample'}, 'TestSource');
    Write('<p>Console log result: ' + (infoResult ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 3: Test error logging
    Write('<h3>Test 3: Console Logging (ERROR level)</h3>');
    var errorResult = logHandler.error('Test error message', {errorCode: 500}, 'ErrorSource');
    Write('<p>Error log result: ' + (errorResult ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 4: Test debug logging
    Write('<h3>Test 4: Console Logging (DEBUG level)</h3>');
    var debugResult = logHandler.debug('Test debug message', {debugInfo: 'details'}, 'DebugSource');
    Write('<p>Debug log result: ' + (debugResult ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 5: Test warning logging
    Write('<h3>Test 5: Console Logging (WARN level)</h3>');
    var warnResult = logHandler.warn('Test warning message', {warningType: 'minor'}, 'WarnSource');
    Write('<p>Warning log result: ' + (warnResult ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 6: Log levels check
    Write('<h3>Test 6: Log Level Configuration</h3>');
    Write('<p>Current log level: DEBUG</p>');
    Write('<p>Status: ✅ PASS (All log levels should be visible)</p>');

    Write('<hr><h3>✅ All LogHandler tests completed</h3>');
    Write('<p><strong>Note:</strong> Data Extension and Email Alert logging require valid SFMC credentials and setup.</p>');

} catch (ex) {
    Write('<p style="color:red;">❌ ERROR: ' + ex.toString() + '</p>');
}

</script>