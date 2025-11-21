%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%

<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: ConnectionHandler
// ============================================================================

Write('<h2>Testing ConnectionHandler</h2>');

try {
    var connection = new ConnectionHandler();

    // Test 1: Get config
    Write('<h3>Test 1: Get Configuration</h3>');
    var config = connection.getConfig();
    Write('<pre>' + Stringify(config, null, 2) + '</pre>');
    Write('<p>Status: ' + (config.maxRetries === 3 ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 2: Set config
    Write('<h3>Test 2: Update Configuration</h3>');
    connection.setConfig({ maxRetries: 5 });
    var updatedConfig = connection.getConfig();
    Write('<p>Max Retries: ' + updatedConfig.maxRetries + '</p>');
    Write('<p>Status: ' + (updatedConfig.maxRetries === 5 ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 3: Test GET request (public API)
    Write('<h3>Test 3: GET Request (Public API)</h3>');
    Write('<p>Making request to httpbin.org...</p>');
    var getResult = connection.get('https://httpbin.org/get', {}, { parseJSON: true });

    if (getResult.success) {
        Write('<p>✅ GET request successful</p>');
        Write('<p>Status Code: ' + getResult.data.statusCode + '</p>');
        if (getResult.data.parsedContent) {
            Write('<p>Response URL: ' + getResult.data.parsedContent.url + '</p>');
        }
    } else {
        Write('<p>❌ GET request failed</p>');
        Write('<pre>' + Stringify(getResult.error, null, 2) + '</pre>');
    }

    // Test 4: Custom request config
    Write('<h3>Test 4: Custom Request</h3>');
    var customResult = connection.request({
        url: 'https://httpbin.org/user-agent',
        method: 'GET',
        headers: {
            'User-Agent': 'OmegaFramework/2.0.0'
        },
        parseJSON: true
    });

    if (customResult.success) {
        Write('<p>✅ Custom request successful</p>');
        Write('<pre>' + Stringify(customResult.data.parsedContent, null, 2) + '</pre>');
    } else {
        Write('<p>❌ Custom request failed</p>');
        Write('<pre>' + Stringify(customResult.error, null, 2) + '</pre>');
    }

    Write('<hr><h3>✅ All ConnectionHandler tests completed</h3>');

} catch (ex) {
    Write('<p style="color:red;">❌ ERROR: ' + ex.toString() + '</p>');
}

</script>
