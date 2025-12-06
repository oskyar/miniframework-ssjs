<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: FolderHandler with OmegaFramework
// ============================================================================

Write('<h2>Testing FolderHandler (OmegaFramework v3.0)</h2>');

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
        Platform.Function.ContentBlockByKey("OMG_FW_FolderHandler");

        // Initialize SFMC Integration
        var sfmcConfig = {
            clientId: clientId,
            clientSecret: clientSecret,
            authBaseUrl: authBaseUrl
        };

        var sfmc = new SFMCIntegration(sfmcConfig);
        Write('<p>✅ SFMCIntegration initialized</p>');

        // Initialize FolderHandler using OmegaFramework
        var response = OmegaFramework.require('ResponseWrapper', {});
        var folderHandler = new FolderHandler(response, sfmc);
        Write('<p>✅ FolderHandler created</p>');

        // Test 1: List folders
        Write('<h3>Test 1: List Folders (first 10)</h3>');
        var listResult = folderHandler.list({ pageSize: 10 });

        if (listResult.success) {
            Write('<p>✅ List successful</p>');
            Write('<p>Count: ' + (listResult.data.count || 0) + '</p>');
            if (listResult.data.items && listResult.data.items.length > 0) {
                Write('<p>First folder: ' + listResult.data.items[0].name + '</p>');
                Write('<p>Folder ID: ' + listResult.data.items[0].id + '</p>');
            }
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ List failed</p>');
            Write('<pre>' + Stringify(listResult.error, null, 2) + '</pre>');
            Write('<p>Status: ❌ FAIL</p>');
        }

        // Test 2: Get specific folder (if we have one from list)
        if (listResult.success && listResult.data.items && listResult.data.items.length > 0) {
            Write('<h3>Test 2: Get Specific Folder</h3>');
            var folderId = listResult.data.items[0].id;
            var getResult = folderHandler.get(folderId);

            if (getResult.success) {
                Write('<p>✅ Get folder successful</p>');
                Write('<p>Folder Name: ' + getResult.data.name + '</p>');
                Write('<p>Folder Type: ' + (getResult.data.contentType || 'N/A') + '</p>');
                Write('<p>Status: ✅ PASS</p>');
            } else {
                Write('<p>❌ Get folder failed</p>');
                Write('<pre>' + Stringify(getResult.error, null, 2) + '</pre>');
                Write('<p>Status: ❌ FAIL</p>');
            }
        }

        Write('<hr><h3>✅ All FolderHandler tests completed</h3>');
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
