<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: AssetHandler with OmegaFramework
// Tests both Simple Query (GET) and Advanced Query (POST) methods
// ============================================================================

Write('<h2>Testing AssetHandler (OmegaFramework v1.0)</h2>');

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
    var testResults = {
        passed: 0,
        failed: 0,
        tests: []
    };

    function logTest(testName, success, details) {
        testResults.tests.push({
            name: testName,
            success: success,
            details: details
        });
        if (success) {
            testResults.passed++;
        } else {
            testResults.failed++;
        }
    }

    try {
        // Load OmegaFramework
        Platform.Function.ContentBlockByName("OMG_FW_OmegaFramework");

        if (typeof OmegaFramework === 'undefined') {
            throw new Error('OmegaFramework not loaded');
        }

        Write('<p>✅ OmegaFramework loaded</p>');

        // Load all required dependencies
        Platform.Function.ContentBlockByName("OMG_FW_ResponseWrapper");
        Platform.Function.ContentBlockByName("OMG_FW_ConnectionHandler");
        Platform.Function.ContentBlockByName("OMG_FW_DataExtensionTokenCache");
        Platform.Function.ContentBlockByName("OMG_FW_BaseIntegration");
        Platform.Function.ContentBlockByName("OMG_FW_SFMCIntegration");
        Platform.Function.ContentBlockByName("OMG_FW_AssetHandler");

        Write('<p>✅ All dependencies loaded</p>');

        // Initialize AssetHandler using OmegaFramework.create()
        var assetHandler = OmegaFramework.create('AssetHandler', {
            clientId: clientId,
            clientSecret: clientSecret,
            authBaseUrl: authBaseUrl
        });
        Write('<p>✅ AssetHandler created with OmegaFramework.create()</p>');

        // Store first asset for subsequent tests
        var firstAsset = null;

        // ====================================================================
        // TEST 1: Simple List (GET method)
        // ====================================================================
        Write('<h3>Test 1: Simple List (GET with $pageSize)</h3>');
        var listResult = assetHandler.list({ pageSize: 3 });

        if (listResult.success && listResult.data) {
            var count = listResult.data.count || 0;
            var items = listResult.data.items || [];

            Write('<p>✅ List successful</p>');
            Write('<p>Total count: ' + count + '</p>');
            Write('<p>Items returned: ' + items.length + '</p>');

            if (items.length > 0) {
                firstAsset = items[0];
                Write('<p>First asset: ' + firstAsset.name + ' (ID: ' + firstAsset.id + ')</p>');
            }

            logTest('Simple List', true, 'Retrieved ' + items.length + ' assets');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ List failed</p>');
            var errorMsg = listResult.error ? listResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Simple List', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 2: Get Asset by ID
        // ====================================================================
        if (firstAsset) {
            Write('<h3>Test 2: Get Asset by ID</h3>');
            var getResult = assetHandler.get(firstAsset.id);

            if (getResult.success && getResult.data) {
                Write('<p>✅ Get asset successful</p>');
                Write('<p>Asset Name: ' + getResult.data.name + '</p>');
                Write('<p>Asset Type: ' + (getResult.data.assetType ? getResult.data.assetType.name : 'N/A') + '</p>');
                Write('<p>Status: ' + (getResult.data.status ? getResult.data.status.name : 'N/A') + '</p>');
                logTest('Get Asset by ID', true, 'Retrieved asset: ' + getResult.data.name);
                Write('<p>Status: ✅ PASS</p>');
            } else {
                Write('<p>❌ Get asset failed</p>');
                var errorMsg = getResult.error ? getResult.error.message : 'Unknown error';
                Write('<p>Error: ' + errorMsg + '</p>');
                logTest('Get Asset by ID', false, errorMsg);
                Write('<p>Status: ❌ FAIL</p>');
            }
        }

        // ====================================================================
        // TEST 3: Simple Search (GET with $filter)
        // ====================================================================
        Write('<h3>Test 3: Simple Search (GET with $filter)</h3>');
        var simpleSearchResult = assetHandler.simpleSearch('test', {
            pageSize: 5,
            orderBy: 'modifiedDate DESC'
        });

        if (simpleSearchResult.success && simpleSearchResult.data) {
            var count = simpleSearchResult.data.count || 0;
            var items = simpleSearchResult.data.items || [];

            Write('<p>✅ Simple search successful</p>');
            Write('<p>Results found: ' + count + '</p>');
            Write('<p>Items returned: ' + items.length + '</p>');
            logTest('Simple Search', true, 'Found ' + count + ' assets');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Simple search failed</p>');
            var errorMsg = simpleSearchResult.error ? simpleSearchResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Simple Search', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 4: Advanced Search (POST query)
        // ====================================================================
        Write('<h3>Test 4: Advanced Search (POST query)</h3>');
        var advSearchResult = assetHandler.search('Omega', {
            operator: 'contains',
            pageSize: 5,
            sortBy: 'modifiedDate',
            sortDirection: 'DESC'
        });

        if (advSearchResult.success && advSearchResult.data) {
            var count = advSearchResult.data.count || 0;
            var items = advSearchResult.data.items || [];

            Write('<p>✅ Advanced search successful</p>');
            Write('<p>Results found: ' + count + '</p>');
            Write('<p>Items returned: ' + items.length + '</p>');

            if (items.length > 0) {
                Write('<p>First result: ' + items[0].name + '</p>');
            }

            logTest('Advanced Search', true, 'Found ' + count + ' assets');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Advanced search failed</p>');
            var errorMsg = advSearchResult.error ? advSearchResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Advanced Search', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 5: Search with Multiple Conditions (AND)
        // ====================================================================
        Write('<h3>Test 5: Search with Multiple Conditions (AND)</h3>');
        var multiCondResult = assetHandler.searchWithConditions([
            { property: 'name', operator: 'like', value: 'test' },
            { property: 'status.name', operator: 'equal', value: 'Draft' }
        ], {
            pageSize: 5
        });

        if (multiCondResult.success && multiCondResult.data) {
            var count = multiCondResult.data.count || 0;
            var items = multiCondResult.data.items || [];

            Write('<p>✅ Multi-condition search successful</p>');
            Write('<p>Results found: ' + count + '</p>');
            Write('<p>Items returned: ' + items.length + '</p>');
            logTest('Multi-Condition Search', true, 'Found ' + count + ' draft assets with "test" in name');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Multi-condition search failed</p>');
            var errorMsg = multiCondResult.error ? multiCondResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Multi-Condition Search', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 6: Get Recent Assets
        // ====================================================================
        Write('<h3>Test 6: Get Recent Assets</h3>');
        var recentResult = assetHandler.getRecent({ pageSize: 5 });

        if (recentResult.success && recentResult.data) {
            var items = recentResult.data.items || [];

            Write('<p>✅ Get recent assets successful</p>');
            Write('<p>Items returned: ' + items.length + '</p>');

            if (items.length > 0) {
                Write('<p>Most recent: ' + items[0].name + '</p>');
                if (items[0].modifiedDate) {
                    Write('<p>Modified: ' + items[0].modifiedDate + '</p>');
                }
            }

            logTest('Get Recent Assets', true, 'Retrieved ' + items.length + ' recent assets');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Get recent assets failed</p>');
            var errorMsg = recentResult.error ? recentResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Get Recent Assets', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 7: Get Assets by Status
        // ====================================================================
        Write('<h3>Test 7: Get Assets by Status (Published)</h3>');
        var statusResult = assetHandler.getByStatus('Published', { pageSize: 5 });

        if (statusResult.success && statusResult.data) {
            var count = statusResult.data.count || 0;
            var items = statusResult.data.items || [];

            Write('<p>✅ Get by status successful</p>');
            Write('<p>Published assets found: ' + count + '</p>');
            Write('<p>Items returned: ' + items.length + '</p>');
            logTest('Get Assets by Status', true, 'Found ' + count + ' published assets');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Get by status failed</p>');
            var errorMsg = statusResult.error ? statusResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Get Assets by Status', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 8: Get Assets by Type
        // ====================================================================
        Write('<h3>Test 8: Get Assets by Type (Code Snippets)</h3>');
        var typeResult = assetHandler.getByType(assetHandler.ASSET_TYPES.CODE_SNIPPET, { pageSize: 5 });

        if (typeResult.success && typeResult.data) {
            var count = typeResult.data.count || 0;
            var items = typeResult.data.items || [];

            Write('<p>✅ Get by type successful</p>');
            Write('<p>Code snippets found: ' + count + '</p>');
            Write('<p>Items returned: ' + items.length + '</p>');
            logTest('Get Assets by Type', true, 'Found ' + count + ' code snippets');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Get by type failed</p>');
            var errorMsg = typeResult.error ? typeResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Get Assets by Type', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 9: Advanced Search with Raw Query
        // ====================================================================
        Write('<h3>Test 9: Advanced Search with Raw Query</h3>');
        var rawQueryResult = assetHandler.advancedSearch({
            query: {
                leftOperand: {
                    property: 'assetType.id',
                    simpleOperator: 'equal',
                    value: 220  // Code snippet
                },
                logicalOperator: 'AND',
                rightOperand: {
                    property: 'status.name',
                    simpleOperator: 'equal',
                    value: 'Draft'
                }
            },
            page: { page: 1, pageSize: 5 },
            sort: [{ property: 'name', direction: 'ASC' }],
            fields: ['id', 'name', 'assetType', 'status', 'modifiedDate']
        });

        if (rawQueryResult.success && rawQueryResult.data) {
            var count = rawQueryResult.data.count || 0;
            var items = rawQueryResult.data.items || [];

            Write('<p>✅ Raw advanced query successful</p>');
            Write('<p>Results found: ' + count + '</p>');
            Write('<p>Items returned: ' + items.length + '</p>');
            logTest('Raw Advanced Query', true, 'Found ' + count + ' draft code snippets');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Raw advanced query failed</p>');
            var errorMsg = rawQueryResult.error ? rawQueryResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Raw Advanced Query', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 10: Verify ASSET_TYPES constants
        // ====================================================================
        Write('<h3>Test 10: Verify ASSET_TYPES Constants</h3>');
        var hasConstants = assetHandler.ASSET_TYPES &&
                          assetHandler.ASSET_TYPES.HTML_EMAIL === 208 &&
                          assetHandler.ASSET_TYPES.CODE_SNIPPET === 220;

        if (hasConstants) {
            Write('<p>✅ ASSET_TYPES constants available</p>');
            Write('<p>HTML_EMAIL: ' + assetHandler.ASSET_TYPES.HTML_EMAIL + '</p>');
            Write('<p>CODE_SNIPPET: ' + assetHandler.ASSET_TYPES.CODE_SNIPPET + '</p>');
            Write('<p>PNG: ' + assetHandler.ASSET_TYPES.PNG + '</p>');
            logTest('ASSET_TYPES Constants', true, 'All constants verified');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ ASSET_TYPES constants missing or incorrect</p>');
            logTest('ASSET_TYPES Constants', false, 'Constants not properly defined');
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST SUMMARY
        // ====================================================================
        Write('<hr>');
        Write('<h3>Test Summary</h3>');
        Write('<p><strong>Passed:</strong> ' + testResults.passed + '</p>');
        Write('<p><strong>Failed:</strong> ' + testResults.failed + '</p>');
        Write('<p><strong>Total:</strong> ' + (testResults.passed + testResults.failed) + '</p>');

        if (testResults.failed === 0) {
            Write('<h3 style="color:green;">✅ All AssetHandler tests passed!</h3>');
        } else {
            Write('<h3 style="color:orange;">⚠️ Some tests failed</h3>');
        }

        Write('<h4>Test Details:</h4>');
        Write('<ul>');
        for (var i = 0; i < testResults.tests.length; i++) {
            var test = testResults.tests[i];
            var icon = test.success ? '✅' : '❌';
            Write('<li>' + icon + ' <strong>' + test.name + '</strong>: ' + test.details + '</li>');
        }
        Write('</ul>');

        Write('<p><strong>Note:</strong> SFMCIntegration handles OAuth2 authentication internally. No separate auth strategy required.</p>');
        Write('<p><a href="?">Test with different credentials</a></p>');

    } catch (ex) {
        Write('<p style="color:red;">❌ ERROR: ' + (ex.message || String(ex) || 'Unknown error') + '</p>');
        if (ex.description) {
            Write('<p><strong>Description:</strong> ' + ex.description + '</p>');
        }
    }
}

</script>
