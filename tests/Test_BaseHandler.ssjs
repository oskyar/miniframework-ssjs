%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_AuthHandler")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_FW_BaseHandler")=%%

<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: BaseHandler
// ============================================================================

Write('<h2>Testing BaseHandler</h2>');

try {
    // Configuration
    var authConfig = {
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
        authBaseUrl: 'https://test.auth.marketingcloudapis.com/'
    };

    // Test 1: Initialize BaseHandler
    Write('<h3>Test 1: BaseHandler Initialization</h3>');
    var baseHandler = new BaseHandler('TestHandler', authConfig);
    Write('<p>BaseHandler initialized: ' + (typeof baseHandler === 'object' ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 2: Check public properties
    Write('<h3>Test 2: Public Properties</h3>');
    Write('<p>Has handler property: ' + (typeof baseHandler.handler !== 'undefined' ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Handler name is "TestHandler": ' + (baseHandler.handler === 'TestHandler' ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Has response property: ' + (typeof baseHandler.response !== 'undefined' ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Has auth property: ' + (typeof baseHandler.auth !== 'undefined' ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Has connection property: ' + (typeof baseHandler.connection !== 'undefined' ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Has config property: ' + (typeof baseHandler.config !== 'undefined' ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 3: Check public methods
    Write('<h3>Test 3: Public Methods</h3>');
    Write('<p>Has getAuthHeaders method: ' + (typeof baseHandler.getAuthHeaders === 'function' ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Has getRestUrl method: ' + (typeof baseHandler.getRestUrl === 'function' ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Has buildQueryString method: ' + (typeof baseHandler.buildQueryString === 'function' ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 4: Test buildQueryString utility
    Write('<h3>Test 4: buildQueryString Utility</h3>');
    var queryOptions = {
        pageSize: 50,
        page: 1,
        filter: 'status=active'
    };
    var queryString = baseHandler.buildQueryString(queryOptions);
    Write('<p>Query string: ' + queryString + '</p>');
    Write('<p>Contains pageSize: ' + (queryString.indexOf('$pageSize=50') > -1 ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Contains page: ' + (queryString.indexOf('$page=1') > -1 ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Starts with "?": ' + (queryString.indexOf('?') === 0 ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 5: Empty query string
    Write('<h3>Test 5: Empty Query String</h3>');
    var emptyQuery = baseHandler.buildQueryString(null);
    Write('<p>Empty query result: "' + emptyQuery + '"</p>');
    Write('<p>Status: ' + (emptyQuery === '' ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 6: Test with shared instances (singleton pattern)
    Write('<h3>Test 6: Shared Instances (Singleton Pattern)</h3>');
    var sharedAuth = new AuthHandler(authConfig);
    var sharedConnection = new ConnectionHandler();
    var baseHandler2 = new BaseHandler('TestHandler2', authConfig, sharedAuth, sharedConnection);
    Write('<p>BaseHandler with shared instances initialized: ' + (typeof baseHandler2 === 'object' ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Handler name is "TestHandler2": ' + (baseHandler2.handler === 'TestHandler2' ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 7: Config validation
    Write('<h3>Test 7: Config Structure</h3>');
    Write('<p>Config has clientId: ' + (baseHandler.config.hasOwnProperty('clientId') ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Config has clientSecret: ' + (baseHandler.config.hasOwnProperty('clientSecret') ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Config has authBaseUrl: ' + (baseHandler.config.hasOwnProperty('authBaseUrl') ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 8: Response wrapper integration
    Write('<h3>Test 8: ResponseWrapper Integration</h3>');
    var testResponse = baseHandler.response.success({test: 'data'}, 'TestHandler', 'testOperation');
    Write('<pre>' + Stringify(testResponse, null, 2) + '</pre>');
    Write('<p>Response has success property: ' + (testResponse.hasOwnProperty('success') ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Response success is true: ' + (testResponse.success === true ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Response has data property: ' + (testResponse.hasOwnProperty('data') ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Response has meta property: ' + (testResponse.hasOwnProperty('meta') ? '✅ PASS' : '❌ FAIL') + '</p>');

    Write('<hr><h3>✅ All BaseHandler tests completed</h3>');
    Write('<p><strong>Note:</strong> BaseHandler is the foundation for all other handlers (Email, Asset, Folder, etc.)</p>');

} catch (ex) {
    Write('<p style="color:red;">❌ ERROR: ' + ex.toString() + '</p>');
}

</script>