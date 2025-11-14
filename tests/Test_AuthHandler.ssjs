%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_Settings")=%%
%%=ContentBlockByKey("OMG_FW_AuthHandler")=%%

<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: AuthHandler
// ============================================================================

Write('<h2>Testing AuthHandler</h2>');
Write('<p><strong>Note:</strong> You need to provide valid credentials to test authentication.</p>');

// Get credentials from form
var clientId = Platform.Request.GetFormField("clientId");
var clientSecret = Platform.Request.GetFormField("clientSecret");
var authBaseUrl = Platform.Request.GetFormField("authBaseUrl");

if (!clientId || !clientSecret || !authBaseUrl) {
    // Show form
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
        var authConfig = {
            clientId: clientId,
            clientSecret: clientSecret,
            authBaseUrl: authBaseUrl
        };

        var auth = new AuthHandler(authConfig);

        // Test 1: Get token
        Write('<h3>Test 1: Get Valid Token</h3>');
        var tokenResult = auth.getValidToken(authConfig);
        Write('<p>Success: ' + tokenResult.success + '</p>');

        if (tokenResult.success) {
            Write('<p>✅ Token obtained successfully</p>');
            Write('<p>Token Type: ' + tokenResult.data.tokenType + '</p>');
            Write('<p>Expires In: ' + tokenResult.data.expiresIn + ' seconds</p>');
            Write('<p>REST Instance: ' + tokenResult.data.restInstanceUrl + '</p>');

            // Test 2: Create auth header
            Write('<h3>Test 2: Create Auth Header</h3>');
            var headerResult = auth.createAuthHeader(tokenResult.data);
            if (headerResult.success) {
                Write('<p>✅ Auth header created</p>');
                Write('<pre>' + Stringify(headerResult.data, null, 2) + '</pre>');
            } else {
                Write('<p>❌ Failed to create header</p>');
                Write('<pre>' + Stringify(headerResult.error, null, 2) + '</pre>');
            }

            // Test 3: Check if token is expired
            Write('<h3>Test 3: Check Token Expiration</h3>');
            var isExpired = auth.isTokenExpired(tokenResult.data);
            Write('<p>Is Expired: ' + isExpired + '</p>');
            Write('<p>Status: ' + (!isExpired ? '✅ PASS' : '❌ FAIL') + '</p>');

        } else {
            Write('<p>❌ Failed to get token</p>');
            Write('<p>Error: ' + (tokenResult.error ? tokenResult.error.message : 'Unknown error') + '</p>');
            Write('<pre>' + Stringify(tokenResult, null, 2) + '</pre>');
        }

        Write('<hr><h3>✅ All AuthHandler tests completed</h3>');
        Write('<p><a href="?">Test with different credentials</a></p>');

    } catch (ex) {
        Write('<p style="color:red;">❌ ERROR: ' + ex.toString() + '</p>');
    }
}

</script>
