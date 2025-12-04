<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: EmailHandler with OmegaFramework
// ============================================================================

Write('<h2>Testing EmailHandler (OmegaFramework v3.0)</h2>');

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

        // Load dependencies manually (until SFMCIntegration is adapted)
        Platform.Function.ContentBlockByKey("OMG_FW_ResponseWrapper");
        Platform.Function.ContentBlockByKey("OMG_FW_ConnectionHandler");
        Platform.Function.ContentBlockByKey("OMG_FW_BaseIntegration");
        Platform.Function.ContentBlockByKey("OMG_FW_OAuth2AuthStrategy");
        Platform.Function.ContentBlockByKey("OMG_FW_SFMCIntegration");
        Platform.Function.ContentBlockByKey("OMG_FW_EmailHandler");

        // Initialize SFMC Integration
        var sfmcConfig = {
            clientId: clientId,
            clientSecret: clientSecret,
            authBaseUrl: authBaseUrl
        };

        var sfmc = new SFMCIntegration(sfmcConfig);
        Write('<p>✅ SFMCIntegration initialized</p>');

        // Initialize EmailHandler using OmegaFramework
        var response = OmegaFramework.require('ResponseWrapper', {});
        var emailHandler = new EmailHandler(response, sfmc);
        Write('<p>✅ EmailHandler created</p>');

        // Test 1: List emails
        Write('<h3>Test 1: List Email Assets (first 5)</h3>');
        var listResult = emailHandler.list({ pageSize: 5 });

        if (listResult.success) {
            Write('<p>✅ List successful</p>');
            Write('<p>Results: ' + (listResult.data.items ? listResult.data.items.length : 0) + '</p>');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ List failed</p>');
            Write('<pre>' + Stringify(listResult.error, null, 2) + '</pre>');
            Write('<p>Status: ❌ FAIL</p>');
        }

        // Test 2: Get templates
        Write('<h3>Test 2: Get Email Templates</h3>');
        var templatesResult = emailHandler.getTemplates();

        if (templatesResult.success) {
            Write('<p>✅ Get templates successful</p>');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Get templates failed</p>');
            Write('<pre>' + Stringify(templatesResult.error, null, 2) + '</pre>');
            Write('<p>Status: ❌ FAIL</p>');
        }

        Write('<hr><h3>✅ All EmailHandler tests completed</h3>');
        Write('<p><strong>Note:</strong> This test uses manual SFMCIntegration instantiation. Once SFMCIntegration is adapted to OmegaFramework, use the full OmegaFramework.require() approach.</p>');
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
