%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_FW_BaseIntegration")=%%
%%=ContentBlockByKey("OMG_FW_OAuth2AuthStrategy")=%%
%%=ContentBlockByKey("OMG_FW_SFMCIntegration")=%%
%%=ContentBlockByKey("OMG_FW_DataExtensionHandler")=%%

<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: DataExtensionHandler
// ============================================================================

Write('<h2>Testing DataExtensionHandler</h2>');

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
        // Initialize SFMC Integration
        var sfmcConfig = {
            clientId: clientId,
            clientSecret: clientSecret,
            authBaseUrl: authBaseUrl
        };

        var sfmc = new SFMCIntegration(sfmcConfig);
        var deHandler = new DataExtensionHandler(sfmc);

        // Test 1: List Data Extensions
        Write('<h3>Test 1: List Data Extensions (first 5)</h3>');
        var listResult = deHandler.list({ $pageSize: 5 });

        if (listResult.success) {
            Write('<p>✅ List successful</p>');
            Write('<p>Count: ' + (listResult.data.items ? listResult.data.items.length : 0) + '</p>');
            if (listResult.data.items && listResult.data.items.length > 0) {
                Write('<p>First DE: ' + listResult.data.items[0].Name + '</p>');
                Write('<p>Customer Key: ' + listResult.data.items[0].CustomerKey + '</p>');
            }
        } else {
            Write('<p>❌ List failed</p>');
            Write('<pre>' + Stringify(listResult.error, null, 2) + '</pre>');
        }

        // Test 2: Get specific DE (if we have one from list)
        if (listResult.success && listResult.data.items && listResult.data.items.length > 0) {
            Write('<h3>Test 2: Get Specific Data Extension</h3>');
            var deKey = listResult.data.items[0].CustomerKey;
            var getResult = deHandler.get(deKey);

            if (getResult.success) {
                Write('<p>✅ Get DE successful</p>');
                Write('<p>DE Name: ' + getResult.data.Name + '</p>');
                Write('<p>Field Count: ' + (getResult.data.Fields ? getResult.data.Fields.length : 0) + '</p>');
            } else {
                Write('<p>❌ Get DE failed</p>');
                Write('<pre>' + Stringify(getResult.error, null, 2) + '</pre>');
            }
        }

        // Test 3: Get rows from a DE (if we have one from list)
        if (listResult.success && listResult.data.items && listResult.data.items.length > 0) {
            Write('<h3>Test 3: Get Rows from Data Extension</h3>');
            var deKey3 = listResult.data.items[0].CustomerKey;
            var rowsResult = deHandler.getRows(deKey3, { $pageSize: 5 });

            if (rowsResult.success) {
                Write('<p>✅ Get rows successful</p>');
                Write('<p>Rows retrieved: ' + (rowsResult.data.items ? rowsResult.data.items.length : 0) + '</p>');
            } else {
                Write('<p>❌ Get rows failed</p>');
                Write('<pre>' + Stringify(rowsResult.error, null, 2) + '</pre>');
            }
        }

        Write('<hr><h3>✅ All DataExtensionHandler tests completed</h3>');
        Write('<p><a href="?">Test with different credentials</a></p>');

    } catch (ex) {
        Write('<p style="color:red;">❌ ERROR: ' + ex.toString() + '</p>');
    }
}

</script>
