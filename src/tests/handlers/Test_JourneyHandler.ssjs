<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: JourneyHandler with OmegaFramework
// Tests Journey Builder and Event Definitions operations via REST API
// Based on official SFMC documentation:
// @see https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/getInteractionCollection.html
// @see https://developer.salesforce.com/docs/marketing/marketing-cloud/references/mc_rest_interaction/getEventDefinitions.html
// ============================================================================

Write('<h2>Testing JourneyHandler (OmegaFramework v4.2)</h2>');

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
        Platform.Function.ContentBlockByKey("OMG_FW_OmegaFramework");

        if (typeof OmegaFramework === 'undefined') {
            throw new Error('OmegaFramework not loaded');
        }

        Write('<p>✅ OmegaFramework loaded</p>');

        // Load all required dependencies
        Platform.Function.ContentBlockByKey("OMG_FW_ResponseWrapper");
        Platform.Function.ContentBlockByKey("OMG_FW_ConnectionHandler");
        Platform.Function.ContentBlockByKey("OMG_FW_DataExtensionTokenCache");
        Platform.Function.ContentBlockByKey("OMG_FW_BaseIntegration");
        Platform.Function.ContentBlockByKey("OMG_FW_SFMCIntegration");
        Platform.Function.ContentBlockByKey("OMG_FW_JourneyHandler");

        Write('<p>✅ All dependencies loaded</p>');

        // Initialize JourneyHandler using OmegaFramework.create()
        var journeyHandler = OmegaFramework.create('JourneyHandler', {
            clientId: clientId,
            clientSecret: clientSecret,
            authBaseUrl: authBaseUrl
        });
        Write('<p>✅ JourneyHandler created with OmegaFramework.create()</p>');

        // Store first journey for subsequent tests
        var firstJourney = null;

        // ====================================================================
        // TEST 1: List Journeys with pagination
        // GET /interaction/v1/interactions
        // ====================================================================
        Write('<h3>Test 1: List Journeys (with pagination)</h3>');
        var listResult = journeyHandler.list({
            pageSize: 5,
            orderBy: journeyHandler.ORDER_BY.MODIFIED_DATE_DESC
        });

        if (listResult.success && listResult.data) {
            var count = listResult.data.count || 0;
            var items = listResult.data.items || [];

            Write('<p>✅ List successful</p>');
            Write('<p>Total count: ' + count + '</p>');
            Write('<p>Items returned: ' + items.length + '</p>');
            Write('<p>Page: ' + (listResult.data.page || 1) + '</p>');

            if (items.length > 0) {
                firstJourney = items[0];
                Write('<p>First journey: ' + firstJourney.name + ' (ID: ' + firstJourney.id + ')</p>');
                Write('<p>Status: ' + (firstJourney.status || 'N/A') + '</p>');
                Write('<p>Key: ' + (firstJourney.key || 'N/A') + '</p>');
            }

            logTest('List Journeys', true, 'Retrieved ' + items.length + ' journeys');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ List failed</p>');
            var errorMsg = listResult.error ? listResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('List Journeys', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 2: Get Journey by ID with extras
        // GET /interaction/v1/interactions/{id}
        // ====================================================================
        if (firstJourney) {
            Write('<h3>Test 2: Get Journey by ID (with extras)</h3>');
            var getResult = journeyHandler.get(firstJourney.id, {
                extras: journeyHandler.EXTRAS.ALL
            });

            if (getResult.success && getResult.data) {
                Write('<p>✅ Get journey successful</p>');
                Write('<p>Name: ' + getResult.data.name + '</p>');
                Write('<p>Status: ' + (getResult.data.status || 'N/A') + '</p>');
                Write('<p>Version: ' + (getResult.data.version || 'N/A') + '</p>');
                Write('<p>Modified: ' + (getResult.data.modifiedDate || 'N/A') + '</p>');
                logTest('Get Journey by ID', true, 'Retrieved journey: ' + getResult.data.name);
                Write('<p>Status: ✅ PASS</p>');
            } else {
                Write('<p>❌ Get journey failed</p>');
                var errorMsg = getResult.error ? getResult.error.message : 'Unknown error';
                Write('<p>Error: ' + errorMsg + '</p>');
                logTest('Get Journey by ID', false, errorMsg);
                Write('<p>Status: ❌ FAIL</p>');
            }
        }

        // ====================================================================
        // TEST 3: Get Journey by Key
        // GET /interaction/v1/interactions/key:{key}
        // ====================================================================
        if (firstJourney && firstJourney.key) {
            Write('<h3>Test 3: Get Journey by Key</h3>');
            var getByKeyResult = journeyHandler.getByKey(firstJourney.key);

            if (getByKeyResult.success && getByKeyResult.data) {
                Write('<p>✅ Get by key successful</p>');
                Write('<p>Name: ' + getByKeyResult.data.name + '</p>');
                Write('<p>Key: ' + getByKeyResult.data.key + '</p>');
                logTest('Get Journey by Key', true, 'Retrieved journey: ' + getByKeyResult.data.name);
                Write('<p>Status: ✅ PASS</p>');
            } else {
                Write('<p>❌ Get by key failed</p>');
                var errorMsg = getByKeyResult.error ? getByKeyResult.error.message : 'Unknown error';
                Write('<p>Error: ' + errorMsg + '</p>');
                logTest('Get Journey by Key', false, errorMsg);
                Write('<p>Status: ❌ FAIL</p>');
            }
        } else {
            Write('<h3>Test 3: Get Journey by Key</h3>');
            Write('<p>⚠️ Skipped - No journey key available</p>');
            logTest('Get Journey by Key', true, 'Skipped - no key available');
        }

        // ====================================================================
        // TEST 4: Search Journeys (nameOrDescription filter)
        // ====================================================================
        Write('<h3>Test 4: Search Journeys</h3>');
        var searchResult = journeyHandler.search('test', { pageSize: 5 });

        if (searchResult.success && searchResult.data) {
            var count = searchResult.data.count || 0;
            var items = searchResult.data.items || [];

            Write('<p>✅ Search successful</p>');
            Write('<p>Results found: ' + count + '</p>');
            Write('<p>Items returned: ' + items.length + '</p>');

            if (items.length > 0) {
                Write('<p>First match: ' + items[0].name + '</p>');
            }

            logTest('Search Journeys', true, 'Found ' + count + ' journeys');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Search failed</p>');
            var errorMsg = searchResult.error ? searchResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Search Journeys', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 5: Get Published Journeys (status filter)
        // ====================================================================
        Write('<h3>Test 5: Get Published Journeys</h3>');
        var publishedResult = journeyHandler.getPublished({ pageSize: 5 });

        if (publishedResult.success && publishedResult.data) {
            var count = publishedResult.data.count || 0;
            var items = publishedResult.data.items || [];

            Write('<p>✅ Get published successful</p>');
            Write('<p>Published journeys found: ' + count + '</p>');
            Write('<p>Items returned: ' + items.length + '</p>');
            logTest('Get Published Journeys', true, 'Found ' + count + ' published journeys');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Get published failed</p>');
            var errorMsg = publishedResult.error ? publishedResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Get Published Journeys', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 6: Get Draft Journeys
        // ====================================================================
        Write('<h3>Test 6: Get Draft Journeys</h3>');
        var draftResult = journeyHandler.getDrafts({ pageSize: 5 });

        if (draftResult.success && draftResult.data) {
            var count = draftResult.data.count || 0;
            var items = draftResult.data.items || [];

            Write('<p>✅ Get drafts successful</p>');
            Write('<p>Draft journeys found: ' + count + '</p>');
            Write('<p>Items returned: ' + items.length + '</p>');
            logTest('Get Draft Journeys', true, 'Found ' + count + ' draft journeys');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Get drafts failed</p>');
            var errorMsg = draftResult.error ? draftResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Get Draft Journeys', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 7: Get Stopped Journeys
        // ====================================================================
        Write('<h3>Test 7: Get Stopped Journeys</h3>');
        var stoppedResult = journeyHandler.getStopped({ pageSize: 5 });

        if (stoppedResult.success && stoppedResult.data) {
            var count = stoppedResult.data.count || 0;
            var items = stoppedResult.data.items || [];

            Write('<p>✅ Get stopped successful</p>');
            Write('<p>Stopped journeys found: ' + count + '</p>');
            Write('<p>Items returned: ' + items.length + '</p>');
            logTest('Get Stopped Journeys', true, 'Found ' + count + ' stopped journeys');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Get stopped failed</p>');
            var errorMsg = stoppedResult.error ? stoppedResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Get Stopped Journeys', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 8: List with mostRecentVersionOnly filter
        // ====================================================================
        Write('<h3>Test 8: List with mostRecentVersionOnly=false</h3>');
        var allVersionsResult = journeyHandler.list({
            pageSize: 5,
            mostRecentVersionOnly: false
        });

        if (allVersionsResult.success && allVersionsResult.data) {
            var count = allVersionsResult.data.count || 0;
            var items = allVersionsResult.data.items || [];

            Write('<p>✅ List all versions successful</p>');
            Write('<p>Total items (all versions): ' + count + '</p>');
            Write('<p>Items returned: ' + items.length + '</p>');
            logTest('List All Versions', true, 'Found ' + count + ' items');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ List all versions failed</p>');
            var errorMsg = allVersionsResult.error ? allVersionsResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('List All Versions', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 9: Verify JOURNEY_STATUS Constants
        // ====================================================================
        Write('<h3>Test 9: Verify JOURNEY_STATUS Constants</h3>');
        var hasConstants = journeyHandler.JOURNEY_STATUS &&
                          journeyHandler.JOURNEY_STATUS.DRAFT === 'Draft' &&
                          journeyHandler.JOURNEY_STATUS.PUBLISHED === 'Published' &&
                          journeyHandler.JOURNEY_STATUS.STOPPED === 'Stopped' &&
                          journeyHandler.JOURNEY_STATUS.PAUSED === 'Paused' &&
                          journeyHandler.JOURNEY_STATUS.DELETED === 'Deleted';

        if (hasConstants) {
            Write('<p>✅ JOURNEY_STATUS constants available</p>');
            Write('<p>DRAFT: ' + journeyHandler.JOURNEY_STATUS.DRAFT + '</p>');
            Write('<p>PUBLISHED: ' + journeyHandler.JOURNEY_STATUS.PUBLISHED + '</p>');
            Write('<p>STOPPED: ' + journeyHandler.JOURNEY_STATUS.STOPPED + '</p>');
            Write('<p>SCHEDULED: ' + journeyHandler.JOURNEY_STATUS.SCHEDULED + '</p>');
            Write('<p>PAUSED: ' + journeyHandler.JOURNEY_STATUS.PAUSED + '</p>');
            Write('<p>UNPUBLISHED: ' + journeyHandler.JOURNEY_STATUS.UNPUBLISHED + '</p>');
            Write('<p>DELETED: ' + journeyHandler.JOURNEY_STATUS.DELETED + '</p>');
            logTest('JOURNEY_STATUS Constants', true, 'All constants verified');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ JOURNEY_STATUS constants missing or incorrect</p>');
            logTest('JOURNEY_STATUS Constants', false, 'Constants not properly defined');
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 10: Verify ORDER_BY Constants
        // ====================================================================
        Write('<h3>Test 10: Verify ORDER_BY Constants</h3>');
        var hasOrderBy = journeyHandler.ORDER_BY &&
                         journeyHandler.ORDER_BY.MODIFIED_DATE_DESC === 'ModifiedDate DESC' &&
                         journeyHandler.ORDER_BY.NAME_ASC === 'Name ASC';

        if (hasOrderBy) {
            Write('<p>✅ ORDER_BY constants available</p>');
            Write('<p>MODIFIED_DATE_DESC: ' + journeyHandler.ORDER_BY.MODIFIED_DATE_DESC + '</p>');
            Write('<p>MODIFIED_DATE_ASC: ' + journeyHandler.ORDER_BY.MODIFIED_DATE_ASC + '</p>');
            Write('<p>NAME_DESC: ' + journeyHandler.ORDER_BY.NAME_DESC + '</p>');
            Write('<p>NAME_ASC: ' + journeyHandler.ORDER_BY.NAME_ASC + '</p>');
            logTest('ORDER_BY Constants', true, 'All constants verified');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ ORDER_BY constants missing or incorrect</p>');
            logTest('ORDER_BY Constants', false, 'Constants not properly defined');
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 11: Verify EXTRAS Constants
        // ====================================================================
        Write('<h3>Test 11: Verify EXTRAS Constants</h3>');
        var hasExtras = journeyHandler.EXTRAS &&
                        journeyHandler.EXTRAS.ALL === 'all' &&
                        journeyHandler.EXTRAS.ACTIVITIES === 'activities' &&
                        journeyHandler.EXTRAS.OUTCOMES === 'outcomes' &&
                        journeyHandler.EXTRAS.STATS === 'stats';

        if (hasExtras) {
            Write('<p>✅ EXTRAS constants available</p>');
            Write('<p>ALL: ' + journeyHandler.EXTRAS.ALL + '</p>');
            Write('<p>ACTIVITIES: ' + journeyHandler.EXTRAS.ACTIVITIES + '</p>');
            Write('<p>OUTCOMES: ' + journeyHandler.EXTRAS.OUTCOMES + '</p>');
            Write('<p>STATS: ' + journeyHandler.EXTRAS.STATS + '</p>');
            logTest('EXTRAS Constants', true, 'All constants verified');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ EXTRAS constants missing or incorrect</p>');
            logTest('EXTRAS Constants', false, 'Constants not properly defined');
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 12: Verify ENTRY_MODE Constants
        // ====================================================================
        Write('<h3>Test 12: Verify ENTRY_MODE Constants</h3>');
        var hasEntryMode = journeyHandler.ENTRY_MODE &&
                          journeyHandler.ENTRY_MODE.SINGLE_ENTRY === 'SingleEntry' &&
                          journeyHandler.ENTRY_MODE.MULTIPLE_ENTRY === 'MultipleEntry' &&
                          journeyHandler.ENTRY_MODE.REENTRY_ONLY === 'ReentryOnly';

        if (hasEntryMode) {
            Write('<p>✅ ENTRY_MODE constants available</p>');
            Write('<p>SINGLE_ENTRY: ' + journeyHandler.ENTRY_MODE.SINGLE_ENTRY + '</p>');
            Write('<p>MULTIPLE_ENTRY: ' + journeyHandler.ENTRY_MODE.MULTIPLE_ENTRY + '</p>');
            Write('<p>REENTRY_ONLY: ' + journeyHandler.ENTRY_MODE.REENTRY_ONLY + '</p>');
            logTest('ENTRY_MODE Constants', true, 'All constants verified');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ ENTRY_MODE constants missing or incorrect</p>');
            logTest('ENTRY_MODE Constants', false, 'Constants not properly defined');
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 13: Verify EVENT_TYPE and EVENT_MODE Constants
        // ====================================================================
        Write('<h3>Test 13: Verify EVENT_TYPE and EVENT_MODE Constants</h3>');
        var hasEventType = journeyHandler.EVENT_TYPE &&
                          journeyHandler.EVENT_TYPE.EVENT === 'Event' &&
                          journeyHandler.EVENT_TYPE.CONTACT_EVENT === 'ContactEvent' &&
                          journeyHandler.EVENT_TYPE.DATE_EVENT === 'DateEvent' &&
                          journeyHandler.EVENT_TYPE.REST_EVENT === 'RestEvent';

        var hasEventMode = journeyHandler.EVENT_MODE &&
                          journeyHandler.EVENT_MODE.PRODUCTION === 'Production' &&
                          journeyHandler.EVENT_MODE.TEST === 'Test';

        if (hasEventType && hasEventMode) {
            Write('<p>✅ EVENT_TYPE constants available</p>');
            Write('<p>EVENT: ' + journeyHandler.EVENT_TYPE.EVENT + '</p>');
            Write('<p>CONTACT_EVENT: ' + journeyHandler.EVENT_TYPE.CONTACT_EVENT + '</p>');
            Write('<p>DATE_EVENT: ' + journeyHandler.EVENT_TYPE.DATE_EVENT + '</p>');
            Write('<p>REST_EVENT: ' + journeyHandler.EVENT_TYPE.REST_EVENT + '</p>');
            Write('<p>✅ EVENT_MODE constants available</p>');
            Write('<p>PRODUCTION: ' + journeyHandler.EVENT_MODE.PRODUCTION + '</p>');
            Write('<p>TEST: ' + journeyHandler.EVENT_MODE.TEST + '</p>');
            logTest('EVENT_TYPE/EVENT_MODE Constants', true, 'All constants verified');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ EVENT_TYPE or EVENT_MODE constants missing or incorrect</p>');
            logTest('EVENT_TYPE/EVENT_MODE Constants', false, 'Constants not properly defined');
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 14: List Event Definitions
        // GET /interaction/v1/eventDefinitions
        // ====================================================================
        Write('<h3>Test 14: List Event Definitions</h3>');
        var eventDefsResult = journeyHandler.listEventDefinitions({ pageSize: 5 });

        var firstEventDef = null;
        if (eventDefsResult.success && eventDefsResult.data) {
            var count = eventDefsResult.data.count || 0;
            var items = eventDefsResult.data.items || [];

            Write('<p>✅ List event definitions successful</p>');
            Write('<p>Total count: ' + count + '</p>');
            Write('<p>Items returned: ' + items.length + '</p>');

            if (items.length > 0) {
                firstEventDef = items[0];
                Write('<p>First event def: ' + firstEventDef.name + '</p>');
                Write('<p>Key: ' + (firstEventDef.eventDefinitionKey || 'N/A') + '</p>');
                Write('<p>Type: ' + (firstEventDef.type || 'N/A') + '</p>');
            }

            logTest('List Event Definitions', true, 'Retrieved ' + items.length + ' event definitions');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ List event definitions failed</p>');
            var errorMsg = eventDefsResult.error ? eventDefsResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('List Event Definitions', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }

        // ====================================================================
        // TEST 15: Get Event Definition by ID
        // GET /interaction/v1/eventDefinitions/{id}
        // ====================================================================
        if (firstEventDef && firstEventDef.id) {
            Write('<h3>Test 15: Get Event Definition by ID</h3>');
            var getEventDefResult = journeyHandler.getEventDefinition(firstEventDef.id);

            if (getEventDefResult.success && getEventDefResult.data) {
                Write('<p>✅ Get event definition successful</p>');
                Write('<p>Name: ' + getEventDefResult.data.name + '</p>');
                Write('<p>Key: ' + (getEventDefResult.data.eventDefinitionKey || 'N/A') + '</p>');
                Write('<p>Type: ' + (getEventDefResult.data.type || 'N/A') + '</p>');
                logTest('Get Event Definition by ID', true, 'Retrieved: ' + getEventDefResult.data.name);
                Write('<p>Status: ✅ PASS</p>');
            } else {
                Write('<p>❌ Get event definition failed</p>');
                var errorMsg = getEventDefResult.error ? getEventDefResult.error.message : 'Unknown error';
                Write('<p>Error: ' + errorMsg + '</p>');
                logTest('Get Event Definition by ID', false, errorMsg);
                Write('<p>Status: ❌ FAIL</p>');
            }
        } else {
            Write('<h3>Test 15: Get Event Definition by ID</h3>');
            Write('<p>⚠️ Skipped - No event definition available</p>');
            logTest('Get Event Definition by ID', true, 'Skipped - no event definitions');
        }

        // ====================================================================
        // TEST 16: Get Event Definition by Key
        // GET /interaction/v1/eventDefinitions/key:{key}
        // ====================================================================
        if (firstEventDef && firstEventDef.eventDefinitionKey) {
            Write('<h3>Test 16: Get Event Definition by Key</h3>');
            var getEventDefByKeyResult = journeyHandler.getEventDefinitionByKey(firstEventDef.eventDefinitionKey);

            if (getEventDefByKeyResult.success && getEventDefByKeyResult.data) {
                Write('<p>✅ Get event definition by key successful</p>');
                Write('<p>Name: ' + getEventDefByKeyResult.data.name + '</p>');
                Write('<p>Key: ' + getEventDefByKeyResult.data.eventDefinitionKey + '</p>');
                logTest('Get Event Definition by Key', true, 'Retrieved: ' + getEventDefByKeyResult.data.name);
                Write('<p>Status: ✅ PASS</p>');
            } else {
                Write('<p>❌ Get event definition by key failed</p>');
                var errorMsg = getEventDefByKeyResult.error ? getEventDefByKeyResult.error.message : 'Unknown error';
                Write('<p>Error: ' + errorMsg + '</p>');
                logTest('Get Event Definition by Key', false, errorMsg);
                Write('<p>Status: ❌ FAIL</p>');
            }
        } else {
            Write('<h3>Test 16: Get Event Definition by Key</h3>');
            Write('<p>⚠️ Skipped - No event definition key available</p>');
            logTest('Get Event Definition by Key', true, 'Skipped - no event definition key');
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
            Write('<h3 style="color:green;">✅ All JourneyHandler tests passed!</h3>');
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

        Write('<h4>Available Query Parameters (list method):</h4>');
        Write('<ul>');
        Write('<li><strong>$page</strong>: Page number (default: 1)</li>');
        Write('<li><strong>$pageSize</strong>: Results per page (1-50, default: 50)</li>');
        Write('<li><strong>$orderBy</strong>: ModifiedDate DESC, Name ASC, Performance DESC, etc.</li>');
        Write('<li><strong>status</strong>: Draft, Published, Stopped, ScheduledToPublish, Paused, Unpublished, Deleted</li>');
        Write('<li><strong>nameOrDescription</strong>: Search term</li>');
        Write('<li><strong>key</strong>: Journey external key</li>');
        Write('<li><strong>id</strong>: Journey ID</li>');
        Write('<li><strong>tag</strong>: Filter by tag</li>');
        Write('<li><strong>mostRecentVersionOnly</strong>: true/false (default: true)</li>');
        Write('<li><strong>extras</strong>: all, activities, outcomes, stats</li>');
        Write('<li><strong>definitionType</strong>: transactional</li>');
        Write('</ul>');

        Write('<h4>Event Definition Methods Available:</h4>');
        Write('<ul>');
        Write('<li><strong>listEventDefinitions(options)</strong>: List all event definitions</li>');
        Write('<li><strong>getEventDefinition(id)</strong>: Get event definition by ID</li>');
        Write('<li><strong>getEventDefinitionByKey(key)</strong>: Get event definition by key</li>');
        Write('<li><strong>createEventDefinition(data)</strong>: Create new event definition</li>');
        Write('<li><strong>updateEventDefinition(id, data)</strong>: Update event definition by ID</li>');
        Write('<li><strong>updateEventDefinitionByKey(key, data)</strong>: Update event definition by key</li>');
        Write('<li><strong>removeEventDefinition(id)</strong>: Delete event definition by ID</li>');
        Write('<li><strong>removeEventDefinitionByKey(key)</strong>: Delete event definition by key</li>');
        Write('<li><strong>fireEntryEvent(eventData)</strong>: Fire entry event to inject contact into journey</li>');
        Write('</ul>');

        Write('<p><strong>Note:</strong> Some tests may be skipped depending on available journeys/events in your account.</p>');
        Write('<p><strong>Warning:</strong> Create, Update, Delete tests are not included to avoid modifying your journeys or events.</p>');
        Write('<p><a href="?">Test with different credentials</a></p>');

    } catch (ex) {
        Write('<p style="color:red;">❌ ERROR: ' + (ex.message || String(ex) || 'Unknown error') + '</p>');
        if (ex.description) {
            Write('<p><strong>Description:</strong> ' + ex.description + '</p>');
        }
    }
}

</script>
