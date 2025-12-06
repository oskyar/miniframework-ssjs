<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: AssetHandler with OmegaFramework
// ============================================================================

Write('<h2>Testing AssetHandler (OmegaFramework v3.0)</h2>');

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

        // Load all required dependencies (SFMCIntegration handles authentication internally)
        Platform.Function.ContentBlockByKey("OMG_FW_ResponseWrapper");
        Platform.Function.ContentBlockByKey("OMG_FW_ConnectionHandler");
        Platform.Function.ContentBlockByKey("OMG_FW_DataExtensionTokenCache");
        Platform.Function.ContentBlockByKey("OMG_FW_BaseIntegration");
        Platform.Function.ContentBlockByKey("OMG_FW_SFMCIntegration");
        Platform.Function.ContentBlockByKey("OMG_FW_AssetHandler");

        Write('<p>✅ All dependencies loaded</p>');

        // Initialize AssetHandler using OmegaFramework.create()
        // The config is passed to all dependencies, including SFMCIntegration
        var assetHandler = OmegaFramework.create('AssetHandler', {
            clientId: clientId,
            clientSecret: clientSecret,
            authBaseUrl: authBaseUrl
        });
        Write('<p>✅ AssetHandler created with OmegaFramework.create()</p>');

        // Approach 2: Full OmegaFramework require (will work when SFMCIntegration is adapted)
        // var assetHandler = OmegaFramework.require('AssetHandler', {
        //     sfmcConfig: {
        //         clientId: clientId,
        //         clientSecret: clientSecret,
        //         authBaseUrl: authBaseUrl
        //     }
        // });

        // Test 1: List assets
        Write('<h3>Test 1: List Assets (first 5)</h3>');
        var listResult = assetHandler.list({ pageSize: 5 });
        if (listResult.success) {
            Write('<p>✅ List successful</p>');
            Write('<p>Count: ' + listResult.data.count + '</p>');
            if (listResult.data.items && listResult.data.items.length > 0) {
                Write('<p>First asset: ' + listResult.data.items[0].name + '</p>');
                Write('<p>Asset ID: ' + listResult.data.items[0].id + '</p>');
            }
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ List failed</p>');
            Write('<pre>' + Stringify(listResult.error, null, 2) + '</pre>');
            Write('<p>Status: ❌ FAIL</p>');
        }

        // Test 2: Get specific asset (if we have one from list)
        if (listResult.success && listResult.data.items && listResult.data.items.length > 0) {
            Write('<h3>Test 2: Get Specific Asset</h3>');
            var assetId = listResult.data.items[0].id;
            var getResult = assetHandler.get(assetId);

            if (getResult.success) {
                Write('<p>✅ Get asset successful</p>');
                Write('<p>Asset Name: ' + getResult.data.name + '</p>');
                Write('<p>Asset Type: ' + getResult.data.assetType.name + '</p>');
                Write('<p>Status: ✅ PASS</p>');
            } else {
                Write('<p>❌ Get asset failed</p>');
                Write('<pre>' + Stringify(getResult.error, null, 2) + '</pre>');
                Write('<p>Status: ❌ FAIL</p>');
            }
        }

        // Test 3: Search assets
        if (listResult.success && listResult.data.items && listResult.data.items.length > 0) {
            Write('<h3>Test 3: Search Assets</h3>');
            var searchTerm = listResult.data.items[0].name.substring(0, 5);
            var searchResult = assetHandler.search(searchTerm);

            if (searchResult.success) {
                Write('<p>✅ Search successful</p>');
                Write('<p>Search term: ' + searchTerm + '</p>');
                Write('<p>Results: ' + searchResult.data.count + '</p>');
                Write('<p>Status: ✅ PASS</p>');
            } else {
                Write('<p>❌ Search failed</p>');
                Write('<pre>' + Stringify(searchResult.error, null, 2) + '</pre>');
                Write('<p>Status: ❌ FAIL</p>');
            }
        }

        Write('<hr><h3>✅ All AssetHandler tests completed</h3>');
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
