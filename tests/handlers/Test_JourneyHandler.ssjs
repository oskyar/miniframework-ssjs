%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_FW_BaseIntegration")=%%
%%=ContentBlockByKey("OMG_FW_OAuth2AuthStrategy")=%%
%%=ContentBlockByKey("OMG_FW_SFMCIntegration")=%%
%%=ContentBlockByKey("OMG_FW_JourneyHandler")=%%

<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: JourneyHandler
// ============================================================================

Write('<h2>Testing JourneyHandler</h2>');

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
        var journeyHandler = new JourneyHandler(sfmc);

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
        } else {
            Write('<p>❌ List failed</p>');
            Write('<pre>' + Stringify(listResult.error, null, 2) + '</pre>');
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
            } else {
                Write('<p>❌ Get journey failed</p>');
                Write('<pre>' + Stringify(getResult.error, null, 2) + '</pre>');
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
            } else {
                Write('<p>❌ Get journey version failed</p>');
                Write('<pre>' + Stringify(versionResult.error, null, 2) + '</pre>');
            }
        }

        Write('<hr><h3>✅ All JourneyHandler tests completed</h3>');
        Write('<p><a href="?">Test with different credentials</a></p>');

    } catch (ex) {
        Write('<p style="color:red;">❌ ERROR: ' + ex.toString() + '</p>');
    }
}

</script>
