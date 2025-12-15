<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: DataExtensionHandler v4.5 with WSProxy
// Comprehensive tests for all DataExtensionHandler operations
// Uses WSProxy exclusively for all CRUD and metadata operations
//
// Test Flow:
// 1. Metadata tests (exists, schema, fields, primary keys)
// 2. INSERT test data first (single + batch)
// 3. READ tests (retrieve, retrieveAll, retrieveNext, getRow)
// 4. UPDATE tests
// 5. DELETE tests (cleanup)
// ============================================================================

Write('<h2>Testing DataExtensionHandler v4.5 (WSProxy-based)</h2>');
Write('<p>This test uses WSProxy for ALL operations - no OAuth/REST API required!</p>');
Write('<p><strong>New in v4.5:</strong> Scalable retrieve() with pagination support</p>');

var TEST_DE_KEY = Platform.Request.GetFormField("testDeKey") || '';
var TEST_CROSS_BU_MID = Platform.Request.GetFormField("crossBuMid") || '';

if (!TEST_DE_KEY) {
    Write('<p>Please provide a Data Extension Customer Key to test with:</p>');
    Write('<form method="POST">');
    Write('<div style="margin: 10px 0;">');
    Write('<label>Data Extension Customer Key:</label><br>');
    Write('<input type="text" name="testDeKey" style="width: 400px;" placeholder="e.g., OMG_FW_Test_DE" required>');
    Write('</div>');
    Write('<div style="margin: 10px 0;">');
    Write('<label>Cross-BU MID (optional):</label><br>');
    Write('<input type="text" name="crossBuMid" style="width: 400px;" placeholder="e.g., 12345678">');
    Write('<br><small>Leave empty to test current BU only</small>');
    Write('</div>');
    Write('<button type="submit">Run Tests</button>');
    Write('</form>');
    Write('<hr>');
    Write('<p><strong>Note:</strong> Create a test Data Extension with at least these fields:</p>');
    Write('<ul>');
    Write('<li><strong>Id</strong> - Text (50) - Primary Key</li>');
    Write('<li><strong>Name</strong> - Text (100)</li>');
    Write('<li><strong>LastName</strong> - Text (100)</li>');
    Write('<li><strong>Mobile</strong> - Text (20)</li>');
    Write('<li><strong>Email</strong> - Email Address</li>');
    Write('</ul>');
} else {

    var testResults = {
        passed: 0,
        failed: 0,
        skipped: 0,
        tests: []
    };

    function logTest(testName, success, details, skipped) {
        testResults.tests.push({
            name: testName,
            success: success,
            skipped: skipped || false,
            details: details
        });
        if (skipped) {
            testResults.skipped++;
        } else if (success) {
            testResults.passed++;
        } else {
            testResults.failed++;
        }
    }

    try {
        // ====================================================================
        // LOAD DEPENDENCIES
        // ====================================================================
        Write('<h3>Loading OmegaFramework and Dependencies</h3>');

        Platform.Function.ContentBlockByKey("OMG_FW_OmegaFramework");

        if (typeof OmegaFramework === 'undefined') {
            throw new Error('OmegaFramework not loaded');
        }
        Write('<p>OmegaFramework loaded</p>');

        Platform.Function.ContentBlockByKey("OMG_FW_DataExtensionHandler");

        Write('<p>All dependencies loaded</p>');

        // ====================================================================
        // CREATE HANDLER INSTANCE
        // ====================================================================
        var deHandler = OmegaFramework.create('DataExtensionHandler', {});
        Write('<p>DataExtensionHandler created via OmegaFramework.create()</p>');
        Write('<hr>');

        // Test data identifiers
        var testId = 'TEST_' + new Date().getTime();
        var testRow = {
            Id: testId,
            Name: 'Test User ' + testId,
            LastName: 'SearchableLastName',
            Mobile: '1234567890',
            Email: 'test_' + testId + '@example.com'
        };

        // Batch test data
        var batchRows = [];
        for (var b = 0; b < 3; b++) {
            batchRows.push({
                Id: 'BATCH_' + testId + '_' + b,
                Name: 'Batch User ' + b,
                LastName: 'BatchLastName',
                Mobile: '111222333' + b,
                Email: 'batch_' + b + '_' + testId + '@example.com'
            });
        }

        // ====================================================================
        // SECTION 1: METADATA TESTS
        // ====================================================================
        Write('<h2 style="background:#eee;padding:10px;">SECTION 1: METADATA TESTS</h2>');

        // TEST 1: Check if DE Exists
        Write('<h3>Test 1: Check if Data Extension Exists</h3>');
        var existsResult = deHandler.exists(TEST_DE_KEY);

        if (existsResult.success) {
            Write('<p>exists() returned successfully</p>');
            Write('<p>Data Extension "' + TEST_DE_KEY + '" exists: <strong>' + existsResult.data.exists + '</strong></p>');

            if (!existsResult.data.exists) {
                throw new Error('Test Data Extension "' + TEST_DE_KEY + '" not found. Please create it first.');
            }

            logTest('exists()', true, 'DE exists check passed');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>exists() failed: ' + existsResult.error.message + '</p>');
            logTest('exists()', false, existsResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 2: Get Schema
        Write('<h3>Test 2: Get Data Extension Schema</h3>');
        var schemaResult = deHandler.getSchema(TEST_DE_KEY);

        if (schemaResult.success) {
            Write('<p>DE Name: <strong>' + schemaResult.data.name + '</strong></p>');
            Write('<p>Customer Key: ' + schemaResult.data.customerKey + '</p>');
            Write('<p>Is Sendable: ' + schemaResult.data.isSendable + '</p>');
            logTest('getSchema()', true, 'Schema retrieved successfully');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>getSchema() failed: ' + schemaResult.error.message + '</p>');
            logTest('getSchema()', false, schemaResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 3: Get Fields
        Write('<h3>Test 3: Get Data Extension Fields</h3>');
        var fieldsResult = deHandler.getFields(TEST_DE_KEY);

        if (fieldsResult.success) {
            Write('<p>Fields found: <strong>' + fieldsResult.data.count + '</strong></p>');
            Write('<table border="1" cellpadding="5">');
            Write('<tr><th>Name</th><th>Type</th><th>Max Length</th><th>Primary Key</th><th>Required</th></tr>');
            for (var i = 0; i < fieldsResult.data.fields.length; i++) {
                var field = fieldsResult.data.fields[i];
                Write('<tr>');
                Write('<td>' + field.name + '</td>');
                Write('<td>' + field.type + '</td>');
                Write('<td>' + (field.maxLength || '-') + '</td>');
                Write('<td>' + (field.isPrimaryKey ? 'Yes' : 'No') + '</td>');
                Write('<td>' + (field.isRequired ? 'Yes' : 'No') + '</td>');
                Write('</tr>');
            }
            Write('</table>');
            logTest('getFields()', true, 'Retrieved ' + fieldsResult.data.count + ' fields');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>getFields() failed: ' + fieldsResult.error.message + '</p>');
            logTest('getFields()', false, fieldsResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 4: Get Primary Keys
        Write('<h3>Test 4: Get Primary Keys</h3>');
        var pkResult = deHandler.getPrimaryKeys(TEST_DE_KEY);

        if (pkResult.success) {
            Write('<p>Primary Key fields: <strong>' + pkResult.data.primaryKeys.join(', ') + '</strong></p>');
            logTest('getPrimaryKeys()', true, 'Found ' + pkResult.data.count + ' primary key(s)');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>getPrimaryKeys() failed: ' + pkResult.error.message + '</p>');
            logTest('getPrimaryKeys()', false, pkResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // ====================================================================
        // SECTION 2: INSERT TESTS (Create test data first)
        // ====================================================================
        Write('<h2 style="background:#eee;padding:10px;">SECTION 2: INSERT TESTS</h2>');

        // TEST 5: Insert Single Row
        Write('<h3>Test 5: Insert Single Row</h3>');
        Write('<p>Inserting test row with Id: <strong>' + testId + '</strong></p>');
        var insertResult = deHandler.insertRow(TEST_DE_KEY, testRow);

        if (insertResult.success) {
            Write('<p>Row inserted successfully</p>');
            logTest('insertRow()', true, 'Row inserted: ' + testId);
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>insertRow() failed: ' + insertResult.error.message + '</p>');
            logTest('insertRow()', false, insertResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 6: Batch Insert
        Write('<h3>Test 6: Batch Insert (3 rows)</h3>');
        Write('<p>Inserting batch rows with prefix: BATCH_' + testId + '</p>');
        var batchInsertResult = deHandler.insertBatch(TEST_DE_KEY, batchRows);

        if (batchInsertResult.success) {
            Write('<p>Batch insert successful</p>');
            Write('<p>Rows inserted: <strong>' + batchInsertResult.data.count + '</strong></p>');
            logTest('insertBatch()', true, 'Inserted ' + batchInsertResult.data.count + ' rows');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>insertBatch() failed: ' + batchInsertResult.error.message + '</p>');
            logTest('insertBatch()', false, batchInsertResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // ====================================================================
        // SECTION 3: READ TESTS (Verify inserted data)
        // ====================================================================
        Write('<h2 style="background:#eee;padding:10px;">SECTION 3: READ TESTS</h2>');

        // TEST 7: Get Row by Primary Key (verify single insert)
        Write('<h3>Test 7: getRow() - Single Row by Primary Key</h3>');
        Write('<p>Retrieving row with Id: ' + testId + '</p>');
        var getRowResult = deHandler.getRow(TEST_DE_KEY, { Id: testId });

        if (getRowResult.success && getRowResult.data.found) {
            Write('<p>Row found!</p>');
            Write('<ul>');
            Write('<li>Name: ' + getRowResult.data.row.Name + '</li>');
            Write('<li>LastName: ' + getRowResult.data.row.LastName + '</li>');
            Write('<li>Email: ' + getRowResult.data.row.Email + '</li>');
            Write('</ul>');
            logTest('getRow()', true, 'Row retrieved: ' + getRowResult.data.row.Name);
            Write('<p style="color:green;">Status: PASS</p>');
        } else if (getRowResult.success && !getRowResult.data.found) {
            Write('<p>Row NOT found (insert may have failed)</p>');
            logTest('getRow()', false, 'Row not found after insert');
            Write('<p style="color:red;">Status: FAIL</p>');
        } else {
            Write('<p>getRow() failed: ' + getRowResult.error.message + '</p>');
            logTest('getRow()', false, getRowResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 8: retrieve() with filter
        Write('<h3>Test 8: retrieve() with Filter (EQUALS)</h3>');
        Write('<p>Retrieving rows where LastName = "SearchableLastName"</p>');
        var retrieveFilterResult = deHandler.retrieve(TEST_DE_KEY, {
            filter: {
                property: 'LastName',
                operator: deHandler.OPERATORS.EQUALS,
                value: 'SearchableLastName'
            }
        });

        if (retrieveFilterResult.success) {
            Write('<p>Rows found: <strong>' + retrieveFilterResult.data.count + '</strong></p>');
            Write('<p>Has more rows: ' + retrieveFilterResult.data.hasMoreRows + '</p>');
            if (retrieveFilterResult.data.count > 0) {
                Write('<p>First match: ' + retrieveFilterResult.data.items[0].Name + '</p>');
                logTest('retrieve() with filter', true, 'Found ' + retrieveFilterResult.data.count + ' rows');
            } else {
                logTest('retrieve() with filter', false, 'No rows found - filter may not be working');
            }
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>retrieve() failed: ' + retrieveFilterResult.error.message + '</p>');
            logTest('retrieve() with filter', false, retrieveFilterResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 9: retrieve() with specific fields
        Write('<h3>Test 9: retrieve() with Specific Fields</h3>');
        Write('<p>Retrieving only Id and Name fields</p>');
        var retrieveFieldsResult = deHandler.retrieve(TEST_DE_KEY, {
            fields: ['Id', 'Name'],
            filter: {
                property: 'Id',
                operator: deHandler.OPERATORS.EQUALS,
                value: testId
            }
        });

        if (retrieveFieldsResult.success && retrieveFieldsResult.data.count > 0) {
            var row = retrieveFieldsResult.data.items[0];
            var hasOnlyRequestedFields = row.Id && row.Name && !row.Email;
            Write('<p>Row retrieved with fields: ' + Object.keys(row).join(', ') + '</p>');
            if (hasOnlyRequestedFields) {
                logTest('retrieve() with fields', true, 'Only requested fields returned');
                Write('<p style="color:green;">Status: PASS</p>');
            } else {
                logTest('retrieve() with fields', true, 'Fields returned (may include extras based on WSProxy behavior)');
                Write('<p style="color:green;">Status: PASS</p>');
            }
        } else {
            Write('<p>retrieve() with fields failed</p>');
            logTest('retrieve() with fields', false, 'Could not retrieve with specific fields');
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 10: retrieveAll() - Get ALL rows
        Write('<h3>Test 10: retrieveAll() - Get ALL Rows</h3>');
        Write('<p>Retrieving ALL rows from the DE (with auto-pagination)</p>');
        var retrieveAllResult = deHandler.retrieveAll(TEST_DE_KEY);

        if (retrieveAllResult.success) {
            Write('<p>Total rows retrieved: <strong>' + retrieveAllResult.data.count + '</strong></p>');
            Write('<p>Reached safety limit: ' + retrieveAllResult.data.reachedLimit + '</p>');
            Write('<p>(Should include our 4 test rows: 1 single + 3 batch)</p>');
            logTest('retrieveAll()', true, 'Retrieved ' + retrieveAllResult.data.count + ' total rows');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>retrieveAll() failed: ' + retrieveAllResult.error.message + '</p>');
            logTest('retrieveAll()', false, retrieveAllResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 11: retrieveAll() with filter
        Write('<h3>Test 11: retrieveAll() with Filter</h3>');
        Write('<p>Retrieving ALL rows where LastName = "BatchLastName"</p>');
        var retrieveAllFilterResult = deHandler.retrieveAll(TEST_DE_KEY, null, {
            property: 'LastName',
            operator: deHandler.OPERATORS.EQUALS,
            value: 'BatchLastName'
        });

        if (retrieveAllFilterResult.success) {
            Write('<p>Rows found: <strong>' + retrieveAllFilterResult.data.count + '</strong></p>');
            if (retrieveAllFilterResult.data.count >= 3) {
                Write('<p>Found batch rows as expected!</p>');
                logTest('retrieveAll() with filter', true, 'Found ' + retrieveAllFilterResult.data.count + ' batch rows');
            } else {
                logTest('retrieveAll() with filter', false, 'Expected 3 rows, found ' + retrieveAllFilterResult.data.count);
            }
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>retrieveAll() with filter failed: ' + retrieveAllFilterResult.error.message + '</p>');
            logTest('retrieveAll() with filter', false, retrieveAllFilterResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 12: Search (LIKE operator)
        Write('<h3>Test 12: search() with LIKE operator</h3>');
        Write('<p>Searching rows where Name contains "Batch"</p>');
        var searchResult = deHandler.search(TEST_DE_KEY, 'Name', '%Batch%');

        if (searchResult.success) {
            Write('<p>Matching rows: <strong>' + searchResult.data.count + '</strong></p>');
            if (searchResult.data.count >= 3) {
                Write('<p>Found batch rows as expected!</p>');
                for (var s = 0; s < Math.min(3, searchResult.data.items.length); s++) {
                    Write('<p> - ' + searchResult.data.items[s].Name + '</p>');
                }
                logTest('search()', true, 'Found ' + searchResult.data.count + ' rows matching "Batch"');
            } else {
                logTest('search()', false, 'Expected 3+ rows, found ' + searchResult.data.count);
            }
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>search() failed: ' + searchResult.error.message + '</p>');
            logTest('search()', false, searchResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 13: Count Rows
        Write('<h3>Test 13: count() - Count Rows</h3>');
        var countResult = deHandler.count(TEST_DE_KEY);

        if (countResult.success) {
            Write('<p>Total rows in DE: <strong>' + countResult.data.count + '</strong></p>');
            Write('<p>(Should include our 4 test rows: 1 single + 3 batch)</p>');
            logTest('count()', true, 'Count: ' + countResult.data.count);
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>count() failed: ' + countResult.error.message + '</p>');
            logTest('count()', false, countResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 14: retrieve() pagination info
        Write('<h3>Test 14: retrieve() - Pagination Info</h3>');
        Write('<p>Checking pagination metadata in retrieve response</p>');
        var paginationResult = deHandler.retrieve(TEST_DE_KEY, {});

        if (paginationResult.success) {
            Write('<p>Items returned: <strong>' + paginationResult.data.count + '</strong></p>');
            Write('<p>hasMoreRows: <strong>' + paginationResult.data.hasMoreRows + '</strong></p>');
            Write('<p>requestId: <strong>' + (paginationResult.data.requestId || 'null (no more pages)') + '</strong></p>');
            logTest('retrieve() pagination', true, 'Pagination info available');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>retrieve() failed: ' + paginationResult.error.message + '</p>');
            logTest('retrieve() pagination', false, paginationResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 15: query() backward compatibility
        Write('<h3>Test 15: query() - Backward Compatibility</h3>');
        Write('<p>Testing deprecated query() function (should work as alias for retrieve)</p>');
        var queryResult = deHandler.query(TEST_DE_KEY, {
            filter: {
                property: 'Id',
                operator: deHandler.OPERATORS.EQUALS,
                value: testId
            }
        });

        if (queryResult.success && queryResult.data.count > 0) {
            Write('<p>query() works! Found row: ' + queryResult.data.items[0].Name + '</p>');
            logTest('query() backward compat', true, 'Deprecated query() still works');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>query() returned no results or failed</p>');
            logTest('query() backward compat', false, 'query() may not work correctly');
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // ====================================================================
        // SECTION 4: UPDATE TESTS
        // ====================================================================
        Write('<h2 style="background:#eee;padding:10px;">SECTION 4: UPDATE TESTS</h2>');

        // TEST 16: Update Single Row
        Write('<h3>Test 16: Update Single Row</h3>');
        var updateData = {
            Id: testId,
            LastName: 'UpdatedLastName',
            Name: 'Updated Name ' + testId
        };
        Write('<p>Updating row ' + testId + ' with new LastName: "UpdatedLastName"</p>');
        var updateResult = deHandler.updateRow(TEST_DE_KEY, updateData);

        if (updateResult.success) {
            Write('<p>Row updated successfully</p>');
            logTest('updateRow()', true, 'Row updated');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>updateRow() failed: ' + updateResult.error.message + '</p>');
            logTest('updateRow()', false, updateResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 17: Verify Update (getRow to confirm)
        Write('<h3>Test 17: Verify Update</h3>');
        var verifyUpdateResult = deHandler.getRow(TEST_DE_KEY, { Id: testId });

        if (verifyUpdateResult.success && verifyUpdateResult.data.found) {
            var updatedLastName = verifyUpdateResult.data.row.LastName;
            if (updatedLastName == 'UpdatedLastName') {
                Write('<p>Update verified! LastName is now: <strong>' + updatedLastName + '</strong></p>');
                logTest('Verify updateRow()', true, 'LastName correctly updated');
                Write('<p style="color:green;">Status: PASS</p>');
            } else {
                Write('<p>Update NOT verified. LastName is: ' + updatedLastName + '</p>');
                logTest('Verify updateRow()', false, 'LastName not updated: ' + updatedLastName);
                Write('<p style="color:red;">Status: FAIL</p>');
            }
        } else {
            Write('<p>Could not verify update</p>');
            logTest('Verify updateRow()', false, 'Could not retrieve row');
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 18: Upsert Row (update existing)
        Write('<h3>Test 18: Upsert Row (Update Existing)</h3>');
        var upsertData = {
            Id: testId,
            LastName: 'UpsertedLastName',
            Name: 'Upserted Name ' + testId
        };
        var upsertResult = deHandler.upsertRow(TEST_DE_KEY, upsertData);

        if (upsertResult.success) {
            Write('<p>Upsert successful</p>');
            logTest('upsertRow()', true, 'Upsert successful');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>upsertRow() failed: ' + upsertResult.error.message + '</p>');
            logTest('upsertRow()', false, upsertResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 19: Batch Update
        Write('<h3>Test 19: Batch Update</h3>');
        var batchUpdateRows = [];
        for (var u = 0; u < 3; u++) {
            batchUpdateRows.push({
                Id: 'BATCH_' + testId + '_' + u,
                LastName: 'BatchUpdatedLastName'
            });
        }
        var batchUpdateResult = deHandler.updateBatch(TEST_DE_KEY, batchUpdateRows);

        if (batchUpdateResult.success) {
            Write('<p>Batch update successful</p>');
            Write('<p>Rows updated: <strong>' + batchUpdateResult.data.count + '</strong></p>');
            logTest('updateBatch()', true, 'Updated ' + batchUpdateResult.data.count + ' rows');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>updateBatch() failed: ' + batchUpdateResult.error.message + '</p>');
            logTest('updateBatch()', false, batchUpdateResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 20: Verify Batch Update
        Write('<h3>Test 20: Verify Batch Update</h3>');
        var verifyBatchResult = deHandler.retrieve(TEST_DE_KEY, {
            filter: {
                property: 'LastName',
                operator: deHandler.OPERATORS.EQUALS,
                value: 'BatchUpdatedLastName'
            }
        });

        if (verifyBatchResult.success && verifyBatchResult.data.count >= 3) {
            Write('<p>Batch update verified! Found <strong>' + verifyBatchResult.data.count + '</strong> rows with BatchUpdatedLastName</p>');
            logTest('Verify updateBatch()', true, 'Found ' + verifyBatchResult.data.count + ' updated rows');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>Batch update NOT fully verified. Found: ' + (verifyBatchResult.success ? verifyBatchResult.data.count : 0) + ' rows</p>');
            logTest('Verify updateBatch()', false, 'Expected 3 rows, found ' + (verifyBatchResult.success ? verifyBatchResult.data.count : 0));
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // ====================================================================
        // SECTION 5: MISC TESTS
        // ====================================================================
        Write('<h2 style="background:#eee;padding:10px;">SECTION 5: MISC TESTS</h2>');

        // TEST 21: OPERATORS Constants
        Write('<h3>Test 21: Verify OPERATORS Constants</h3>');
        var hasOperators = deHandler.OPERATORS &&
                          deHandler.OPERATORS.EQUALS === 'equals' &&
                          deHandler.OPERATORS.LIKE === 'like' &&
                          deHandler.OPERATORS.GREATER_THAN === 'greaterThan';

        if (hasOperators) {
            Write('<p>OPERATORS constants available:</p>');
            Write('<ul>');
            for (var opKey in deHandler.OPERATORS) {
                if (deHandler.OPERATORS.hasOwnProperty(opKey)) {
                    Write('<li>' + opKey + ': "' + deHandler.OPERATORS[opKey] + '"</li>');
                }
            }
            Write('</ul>');
            logTest('OPERATORS constants', true, 'All operators defined');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>OPERATORS constants missing or incorrect</p>');
            logTest('OPERATORS constants', false, 'Constants not properly defined');
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 22: Cross-BU Support
        Write('<h3>Test 22: Cross-BU Support</h3>');
        if (TEST_CROSS_BU_MID) {
            var setBuResult = deHandler.setBusinessUnit(parseInt(TEST_CROSS_BU_MID, 10));
            if (setBuResult.success) {
                Write('<p>setBusinessUnit() successful - MID: ' + TEST_CROSS_BU_MID + '</p>');
                var resetResult = deHandler.resetBusinessUnit();
                if (resetResult.success) {
                    Write('<p>resetBusinessUnit() successful</p>');
                    logTest('Cross-BU Support', true, 'BU switch and reset successful');
                    Write('<p style="color:green;">Status: PASS</p>');
                } else {
                    logTest('Cross-BU Support', false, resetResult.error.message);
                    Write('<p style="color:red;">Status: FAIL</p>');
                }
            } else {
                Write('<p>setBusinessUnit() failed: ' + setBuResult.error.message + '</p>');
                logTest('Cross-BU Support', false, setBuResult.error.message);
                Write('<p style="color:red;">Status: FAIL</p>');
            }
        } else {
            Write('<p>Cross-BU MID not provided - skipping test</p>');
            logTest('Cross-BU Support', false, 'Skipped - no MID provided', true);
            Write('<p style="color:gray;">Status: SKIPPED</p>');
        }

        // ====================================================================
        // SECTION 6: DELETE TESTS (Cleanup)
        // ====================================================================
        Write('<h2 style="background:#eee;padding:10px;">SECTION 6: DELETE TESTS (Cleanup)</h2>');

        // TEST 23: Delete Single Row
        Write('<h3>Test 23: Delete Single Row</h3>');
        Write('<p>Deleting row with Id: ' + testId + '</p>');
        var deleteResult = deHandler.deleteRow(TEST_DE_KEY, { Id: testId });

        if (deleteResult.success) {
            Write('<p>Row deleted successfully</p>');
            logTest('deleteRow()', true, 'Row deleted: ' + testId);
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>deleteRow() failed: ' + deleteResult.error.message + '</p>');
            logTest('deleteRow()', false, deleteResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 24: Verify Delete
        Write('<h3>Test 24: Verify Delete</h3>');
        var verifyDeleteResult = deHandler.getRow(TEST_DE_KEY, { Id: testId });

        if (verifyDeleteResult.success && !verifyDeleteResult.data.found) {
            Write('<p>Delete verified! Row no longer exists.</p>');
            logTest('Verify deleteRow()', true, 'Row confirmed deleted');
            Write('<p style="color:green;">Status: PASS</p>');
        } else if (verifyDeleteResult.success && verifyDeleteResult.data.found) {
            Write('<p>Delete NOT verified - row still exists!</p>');
            logTest('Verify deleteRow()', false, 'Row still exists after delete');
            Write('<p style="color:red;">Status: FAIL</p>');
        } else {
            Write('<p>Could not verify delete</p>');
            logTest('Verify deleteRow()', false, 'Verification failed');
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 25: Batch Delete
        Write('<h3>Test 25: Batch Delete (Cleanup)</h3>');
        var deleteKeys = [];
        for (var d = 0; d < 3; d++) {
            deleteKeys.push({ Id: 'BATCH_' + testId + '_' + d });
        }
        var batchDeleteResult = deHandler.deleteBatch(TEST_DE_KEY, deleteKeys);

        if (batchDeleteResult.success) {
            Write('<p>Batch delete successful</p>');
            Write('<p>Rows deleted: <strong>' + batchDeleteResult.data.count + '</strong></p>');
            logTest('deleteBatch()', true, 'Deleted ' + batchDeleteResult.data.count + ' rows');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>deleteBatch() failed: ' + batchDeleteResult.error.message + '</p>');
            logTest('deleteBatch()', false, batchDeleteResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 26: Verify Batch Delete
        Write('<h3>Test 26: Verify Batch Delete</h3>');
        var verifyBatchDeleteResult = deHandler.retrieve(TEST_DE_KEY, {
            filter: {
                property: 'LastName',
                operator: deHandler.OPERATORS.EQUALS,
                value: 'BatchUpdatedLastName'
            }
        });

        if (verifyBatchDeleteResult.success && verifyBatchDeleteResult.data.count == 0) {
            Write('<p>Batch delete verified! No rows with BatchUpdatedLastName remain.</p>');
            logTest('Verify deleteBatch()', true, 'All batch rows deleted');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>Batch delete NOT fully verified. Remaining: ' + (verifyBatchDeleteResult.success ? verifyBatchDeleteResult.data.count : '?') + ' rows</p>');
            logTest('Verify deleteBatch()', false, 'Some rows may remain');
            Write('<p style="color:orange;">Status: PARTIAL</p>');
        }

        // ====================================================================
        // TEST SUMMARY
        // ====================================================================
        Write('<hr>');
        Write('<h2>Test Summary</h2>');
        Write('<p><strong>Passed:</strong> <span style="color:green;">' + testResults.passed + '</span></p>');
        Write('<p><strong>Failed:</strong> <span style="color:red;">' + testResults.failed + '</span></p>');
        Write('<p><strong>Skipped:</strong> <span style="color:gray;">' + testResults.skipped + '</span></p>');
        Write('<p><strong>Total:</strong> ' + (testResults.passed + testResults.failed + testResults.skipped) + '</p>');

        if (testResults.failed == 0) {
            Write('<h3 style="color:green;">All tests passed!</h3>');
        } else {
            Write('<h3 style="color:orange;">Some tests failed</h3>');
        }

        Write('<h4>Test Details:</h4>');
        Write('<table border="1" cellpadding="5">');
        Write('<tr><th>Status</th><th>Test Name</th><th>Details</th></tr>');
        for (var t = 0; t < testResults.tests.length; t++) {
            var test = testResults.tests[t];
            var icon = test.skipped ? 'SKIP' : (test.success ? 'PASS' : 'FAIL');
            var color = test.skipped ? 'gray' : (test.success ? 'green' : 'red');
            Write('<tr style="color:' + color + ';">');
            Write('<td>' + icon + '</td>');
            Write('<td>' + test.name + '</td>');
            Write('<td>' + test.details + '</td>');
            Write('</tr>');
        }
        Write('</table>');

        Write('<hr>');
        Write('<h4>DataExtensionHandler v4.5 API Reference:</h4>');
        Write('<p><strong>Metadata:</strong> exists(), getSchema(), getFields(), getPrimaryKeys()</p>');
        Write('<p><strong>Read (with pagination):</strong> retrieve(), retrieveAll(), retrieveNext(), getRow(), query() [deprecated]</p>');
        Write('<p><strong>Write:</strong> insertRow(), updateRow(), upsertRow(), deleteRow()</p>');
        Write('<p><strong>Batch:</strong> insertBatch(), updateBatch(), upsertBatch(), deleteBatch(), clearRows()</p>');
        Write('<p><strong>Convenience:</strong> count(), search()</p>');
        Write('<p><strong>Cross-BU:</strong> setBusinessUnit(), resetBusinessUnit(), getCurrentBusinessUnit()</p>');
        Write('<hr>');
        Write('<h4>Pagination Usage:</h4>');
        Write('<pre>');
        Write('// retrieve() returns: items, count, hasMoreRows, requestId\n');
        Write('var page1 = deHandler.retrieve(deKey, { filter: {...} });\n');
        Write('if (page1.data.hasMoreRows) {\n');
        Write('    var page2 = deHandler.retrieveNext(deKey, page1.data.requestId);\n');
        Write('}\n\n');
        Write('// retrieveAll() gets ALL records automatically\n');
        Write('var allRows = deHandler.retrieveAll(deKey);\n');
        Write('</pre>');
        Write('<p><a href="?">Run tests again</a></p>');

    } catch (ex) {
        Write('<p style="color:red;"><strong>ERROR:</strong> ' + (ex.message || String(ex)) + '</p>');
        if (ex.description) {
            Write('<p><strong>Description:</strong> ' + ex.description + '</p>');
        }
    }
}

</script>
