<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: DataExtensionHandler with OmegaFramework
// ============================================================================

Write('<h2>Testing DataExtensionHandler (OmegaFramework v3.0)</h2>');

var clientId = Platform.Request.GetFormField("clientId");
var clientSecret = Platform.Request.GetFormField("clientSecret");
var authBaseUrl = Platform.Request.GetFormField("authBaseUrl");

if (!clientId || !clientSecret || !authBaseUrl) {
    Write('<p>This test requires SFMC credentials to run.</p>');
    Write('<form method="POST">');
    Write('<div style="margin: 10px 0;">');
    Write('<label>Client ID:</label><br>');
    Write('<input type="text" name="clientId" style="width: 400px;" required>');
    Write('</div>');
    Write('<div style="margin: 10px 0;">');
    Write('<label>Client Secret:</label><br>');
    Write('<input type="password" name="clientSecret" style="width: 400px;" required>');
    Write('</div>');
    Write('<div style="margin: 10px 0;">');
    Write('<label>Auth Base URL:</label><br>');
    Write('<input type="text" name="authBaseUrl" value="https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/" style="width: 400px;" required>');
    Write('</div>');
    Write('<button type="submit">Run Tests</button>');
    Write('</form>');
} else {
    try {
        // Load OmegaFramework
        Platform.Function.ContentBlockByKey("OMG_FW_OmegaFramework");

        if (typeof OmegaFramework === 'undefined') {
            throw new Error('OmegaFramework not loaded');
        }

        Write('<p>✅ OmegaFramework loaded</p>');

        // Load dependencies (SFMCIntegration handles authentication internally)
        Platform.Function.ContentBlockByKey("OMG_FW_ResponseWrapper");
        Platform.Function.ContentBlockByKey("OMG_FW_ConnectionHandler");
        Platform.Function.ContentBlockByKey("OMG_FW_DataExtensionTokenCache");
        Platform.Function.ContentBlockByKey("OMG_FW_BaseIntegration");
        Platform.Function.ContentBlockByKey("OMG_FW_SFMCIntegration");
        Platform.Function.ContentBlockByKey("OMG_FW_DataExtensionHandler");

        // Initialize SFMC Integration
        var sfmcConfig = {
            clientId: clientId,
            clientSecret: clientSecret,
            authBaseUrl: authBaseUrl
        };

        var sfmc = new SFMCIntegration(sfmcConfig);
        Write('<p>✅ SFMCIntegration initialized</p>');

        // Initialize DataExtensionHandler using OmegaFramework for ResponseWrapper
        var response = OmegaFramework.require('ResponseWrapper', {});
        var deHandler = new DataExtensionHandler(response, sfmc);
        Write('<p>✅ DataExtensionHandler created</p>');

        // Test 1: Query Data Extension (using SSJS)
        Write('<h3>Test 1: Query Data Extension (SSJS)</h3>');
        Write('<p>Attempting to query OMG_FW_Credentials DE...</p>');
        var queryResult = deHandler.query('OMG_FW_Credentials', {});

        if (queryResult.success) {
            Write('<p>✅ Query successful</p>');
            Write('<p>Rows found: ' + queryResult.data.count + '</p>');
            if (queryResult.data.items && queryResult.data.items.length > 0) {
                Write('<p>First credential name: ' + queryResult.data.items[0].Name + '</p>');
            }
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Query failed</p>');
            Write('<pre>' + Stringify(queryResult.error, null, 2) + '</pre>');
            Write('<p>Status: ❌ FAIL</p>');
        }

        // Test 2: Insert Row (using test DE if exists)
        Write('<h3>Test 2: Insert Row</h3>');
        var testRow = {
            Name: 'TEST_HANDLER_' + new Date().getTime(),
            AuthType: 'Basic',
            IsActive: false,
            Username: 'test_user',
            Password: 'test_pass'
        };

        var insertResult = deHandler.insertRow('OMG_FW_Credentials', testRow);

        if (insertResult.success) {
            Write('<p>✅ Insert successful</p>');
            Write('<p>Status: ✅ PASS</p>');

            // Test 3: Delete the inserted row (cleanup)
            Write('<h3>Test 3: Delete Row (Cleanup)</h3>');
            var deleteResult = deHandler.deleteRow('OMG_FW_Credentials', { Name: testRow.Name });

            if (deleteResult.success) {
                Write('<p>✅ Delete successful</p>');
                Write('<p>Status: ✅ PASS</p>');
            } else {
                Write('<p>❌ Delete failed</p>');
                Write('<pre>' + Stringify(deleteResult.error, null, 2) + '</pre>');
                Write('<p>Status: ❌ FAIL</p>');
            }
        } else {
            Write('<p>❌ Insert failed</p>');
            Write('<pre>' + Stringify(insertResult.error, null, 2) + '</pre>');
            Write('<p>Status: ❌ FAIL</p>');
        }

        // Test 4: Get Structure
        Write('<h3>Test 4: Get Data Extension Structure</h3>');
        var structureResult = deHandler.getStructure('OMG_FW_Credentials');

        if (structureResult.success) {
            Write('<p>✅ Get structure successful</p>');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Get structure failed</p>');
            Write('<pre>' + Stringify(structureResult.error, null, 2) + '</pre>');
            Write('<p>Status: ❌ FAIL</p>');
        }

        Write('<hr><h3>✅ All DataExtensionHandler tests completed</h3>');
        Write('<p><strong>Note:</strong> SFMCIntegration handles OAuth2 authentication internally. No separate auth strategy required.</p>');
        Write('<p><a href="?">Test with different credentials</a></p>');

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
}

</script>
