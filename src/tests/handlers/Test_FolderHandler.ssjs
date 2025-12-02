%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_FW_BaseIntegration")=%%
%%=ContentBlockByKey("OMG_FW_OAuth2AuthStrategy")=%%
%%=ContentBlockByKey("OMG_FW_SFMCIntegration")=%%
%%=ContentBlockByKey("OMG_FW_FolderHandler")=%%

<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: FolderHandler
// ============================================================================

Write('<h2>Testing FolderHandler</h2>');

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
        var folderHandler = new FolderHandler(sfmc);

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
        } else {
            Write('<p>❌ List failed</p>');
            Write('<pre>' + Stringify(listResult.error, null, 2) + '</pre>');
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
            } else {
                Write('<p>❌ Get folder failed</p>');
                Write('<pre>' + Stringify(getResult.error, null, 2) + '</pre>');
            }
        }

        Write('<hr><h3>✅ All FolderHandler tests completed</h3>');
        Write('<p><a href="?">Test with different credentials</a></p>');

    } catch (ex) {
        Write('<p style="color:red;">❌ ERROR: ' + ex.toString() + '</p>');
    }
}

</script>
