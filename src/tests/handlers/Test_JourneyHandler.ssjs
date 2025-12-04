<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: JourneyHandler with OmegaFramework
// ============================================================================

Write('<h2>Testing JourneyHandler (OmegaFramework v3.0)</h2>');

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
        Platform.Function.ContentBlockByKey("OMG_FW_JourneyHandler");

        // Initialize SFMC Integration
        var sfmcConfig = {
            clientId: clientId,
            clientSecret: clientSecret,
            authBaseUrl: authBaseUrl
        };

        var sfmc = new SFMCIntegration(sfmcConfig);
        Write('<p>✅ SFMCIntegration initialized</p>');

        // Initialize JourneyHandler using OmegaFramework
        var response = OmegaFramework.require('ResponseWrapper', {});
        var journeyHandler = new JourneyHandler(response, sfmc);
        Write('<p>✅ JourneyHandler created</p>');

        // Test 1: List journeys
        Write('<h3>Test 1: List Journeys (first 10)</h3>');
        var listResult = journeyHandler.list({ $pageSize: 10 });

        if (listResult.success) {
            Write('<p>✅ List successful</p>');
            Write('<p>Count: ' + (listResult.data.count || 0) + '</p>');
            if (listResult.data.items && listResult.data.items.length > 0) {
                Write('<p>First journey: ' + listResult.data.items[0].name + '</p>');
                Write('<p>Journey ID: ' + listResult.data.items[0].id + '</p>');
                Write('<p>Status: ' + listResult.data.items[0].status + '</p>');
            }
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ List failed</p>');
            Write('<pre>' + Stringify(listResult.error, null, 2) + '</pre>');
            Write('<p>Status: ❌ FAIL</p>');
        }

        // Test 2: Get specific journey (if we have one from list)
        if (listResult.success && listResult.data.items && listResult.data.items.length > 0) {
            Write('<h3>Test 2: Get Specific Journey</h3>');
            var journeyId = listResult.data.items[0].id;
            var getResult = journeyHandler.get(journeyId);

            if (getResult.success) {
                Write('<p>✅ Get journey successful</p>');
                Write('<p>Journey Name: ' + getResult.data.name + '</p>');
                Write('<p>Version: ' + (getResult.data.version || 'N/A') + '</p>');
                Write('<p>Status: ' + getResult.data.status + '</p>');
                Write('<p>Status: ✅ PASS</p>');
            } else {
                Write('<p>❌ Get journey failed</p>');
                Write('<pre>' + Stringify(getResult.error, null, 2) + '</pre>');
                Write('<p>Status: ❌ FAIL</p>');
            }
        }

        // Test 3: Get journey version (if we have a journey)
        if (listResult.success && listResult.data.items && listResult.data.items.length > 0) {
            Write('<h3>Test 3: Get Journey Version</h3>');
            var journeyId3 = listResult.data.items[0].id;
            var version = listResult.data.items[0].version || 1;
            var versionResult = journeyHandler.getVersion(journeyId3, version);

            if (versionResult.success) {
                Write('<p>✅ Get journey version successful</p>');
                Write('<p>Journey Name: ' + versionResult.data.name + '</p>');
                Write('<p>Version: ' + versionResult.data.version + '</p>');
                Write('<p>Status: ✅ PASS</p>');
            } else {
                Write('<p>❌ Get journey version failed</p>');
                Write('<pre>' + Stringify(versionResult.error, null, 2) + '</pre>');
                Write('<p>Status: ❌ FAIL</p>');
            }
        }

        Write('<hr><h3>✅ All JourneyHandler tests completed</h3>');
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
