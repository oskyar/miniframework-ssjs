<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: ConnectionHandler with OmegaFramework
// ============================================================================

Write('<h2>Testing ConnectionHandler (OmegaFramework v1.0)</h2>');

try {
    // Load OmegaFramework
    Platform.Function.ContentBlockByName("OMG_FW_OmegaFramework");

    if (typeof OmegaFramework === 'undefined') {
        throw new Error('OmegaFramework not loaded');
    }

    Write('<p>✅ OmegaFramework loaded</p>');

    // Test 1: Create ConnectionHandler with default config
    Write('<h3>Test 1: Create ConnectionHandler Instance</h3>');
    var connection = OmegaFramework.require('ConnectionHandler', {});
    Write('<p>✅ ConnectionHandler instance created successfully</p>');
    Write('<p>Status: ' + (typeof connection === 'object' ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 2: Create ConnectionHandler with custom config
    Write('<h3>Test 2: Create ConnectionHandler with Custom Config</h3>');
    var customConnection = OmegaFramework.require('ConnectionHandler', {
        maxRetries: 5,
        retryDelay: 2000,
        timeout: 45000
    });
    Write('<p>✅ ConnectionHandler with custom config created</p>');
    Write('<p>Status: ' + (typeof customConnection === 'object' ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 3: Test GET request (public API)
    Write('<h3>Test 3: GET Request (Public API)</h3>');
    Write('<p>Making request to JSONPlaceholder API...</p>');
    var getResult = connection.get('https://jsonplaceholder.typicode.com/posts/1', {});

    if (getResult.success) {
        Write('<p>✅ GET request successful</p>');
        Write('<p>Status Code: ' + getResult.data.statusCode + '</p>');
        if (getResult.data.parsedContent) {
            Write('<p>Post ID: ' + getResult.data.parsedContent.id + '</p>');
            Write('<p>Post Title: ' + getResult.data.parsedContent.title + '</p>');
        }
        Write('<p>Status: ✅ PASS</p>');
    } else {
        Write('<p>❌ GET request failed</p>');
        Write('<pre>' + Stringify(getResult.error, null, 2) + '</pre>');
        Write('<p>Status: ❌ FAIL</p>');
    }

    // Test 4: Test POST request
    Write('<h3>Test 4: POST Request (Public API)</h3>');
    Write('<p>Making POST request to JSONPlaceholder API...</p>');
    var postData = {
        title: 'OmegaFramework Test',
        body: 'Testing POST request functionality',
        userId: 1
    };
    var postResult = connection.post('https://jsonplaceholder.typicode.com/posts', postData, {});

    if (postResult.success) {
        Write('<p>✅ POST request successful</p>');
        Write('<p>Status Code: ' + postResult.data.statusCode + '</p>');
        if (postResult.data.parsedContent) {
            Write('<p>Created Post ID: ' + postResult.data.parsedContent.id + '</p>');
            Write('<p>Posted Title: ' + postResult.data.parsedContent.title + '</p>');
        }
        Write('<p>Status: ✅ PASS</p>');
    } else {
        Write('<p>❌ POST request failed</p>');
        Write('<pre>' + Stringify(postResult.error, null, 2) + '</pre>');
        Write('<p>Status: ❌ FAIL</p>');
    }

    // Test 5: Test custom request with headers
    Write('<h3>Test 5: Custom Request with Headers</h3>');
    var customResult = connection.customRequest({
        url: 'https://jsonplaceholder.typicode.com/users/1',
        method: 'GET',
        headers: {
            'User-Agent': 'OmegaFramework/3.0.0',
            'X-Custom-Header': 'TestValue'
        }
    });

    if (customResult.success) {
        Write('<p>✅ Custom request successful</p>');
        Write('<p>Status Code: ' + customResult.data.statusCode + '</p>');
        if (customResult.data.parsedContent) {
            Write('<p>User Name: ' + customResult.data.parsedContent.name + '</p>');
            Write('<p>User Email: ' + customResult.data.parsedContent.email + '</p>');
        }
        Write('<p>Status: ✅ PASS</p>');
    } else {
        Write('<p>❌ Custom request failed</p>');
        Write('<pre>' + Stringify(customResult.error, null, 2) + '</pre>');
        Write('<p>Status: ❌ FAIL</p>');
    }

    // Test 6: Test request with invalid URL (error handling)
    Write('<h3>Test 6: Error Handling - Invalid URL</h3>');
    var errorResult = connection.get('https://this-domain-does-not-exist-12345.com/test', {});

    if (!errorResult.success) {
        Write('<p>✅ Error properly handled</p>');
        Write('<p>Error: ' + errorResult.error.message + '</p>');
        Write('<p>Status: ✅ PASS</p>');
    } else {
        Write('<p>❌ Expected error but request succeeded</p>');
        Write('<p>Status: ❌ FAIL</p>');
    }

    // Test 7: Test method existence
    Write('<h3>Test 7: Verify Public Methods</h3>');
    var methods = ['get', 'post', 'put', 'patch', 'remove', 'del', 'customRequest', 'request'];
    var allMethodsExist = true;
    for (var i = 0; i < methods.length; i++) {
        if (typeof connection[methods[i]] !== 'function') {
            allMethodsExist = false;
            Write('<p>❌ Missing method: ' + methods[i] + '</p>');
        }
    }
    if (allMethodsExist) {
        Write('<p>✅ All public methods exist</p>');
        Write('<p>Methods: ' + methods.join(', ') + '</p>');
        Write('<p>Status: ✅ PASS</p>');
    } else {
        Write('<p>Status: ❌ FAIL</p>');
    }

    Write('<hr><h3>✅ All ConnectionHandler tests completed</h3>');

} catch (ex) {
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
