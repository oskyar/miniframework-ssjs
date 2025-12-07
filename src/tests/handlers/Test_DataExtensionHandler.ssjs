<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: DataExtensionHandler v4.0 with WSProxy
// Comprehensive tests for all DataExtensionHandler operations
// ============================================================================

Write('<h2>Testing DataExtensionHandler v4.0 (WSProxy-based)</h2>');
Write('<p>This test uses WSProxy for native SOAP operations - no OAuth required!</p>');

// Test configuration - change this to an existing DE in your BU
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
    Write('<li><strong>Email</strong> - Email Address</li>');
    Write('<li><strong>Status</strong> - Text (20)</li>');
    Write('<li><strong>CreatedDate</strong> - Date</li>');
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

        Platform.Function.ContentBlockByKey("OMG_FW_ResponseWrapper");
        Platform.Function.ContentBlockByKey("OMG_FW_WSProxyWrapper");
        Platform.Function.ContentBlockByKey("OMG_FW_DataExtensionHandler");

        Write('<p>All dependencies loaded</p>');

        // ====================================================================
        // CREATE HANDLER INSTANCE
        // ====================================================================
        var deHandler = OmegaFramework.create('DataExtensionHandler', {});
        Write('<p>DataExtensionHandler created via OmegaFramework.create()</p>');
        Write('<hr>');

        // Test data
        var testId = 'TEST_' + new Date().getTime();
        var testRow = {
            Id: testId,
            Name: 'Test User ' + testId,
            Email: 'test_' + testId + '@example.com',
            Status: 'Active',
            CreatedDate: new Date().toISOString().split('T')[0]
        };

        // ====================================================================
        // TEST 1: Check if DE Exists
        // ====================================================================
        Write('<h3>Test 1: Check if Data Extension Exists</h3>');
        var existsResult = deHandler.exists(TEST_DE_KEY);

        if (existsResult.success) {
            Write('<p>exists() returned successfully</p>');
            Write('<p>Data Extension "' + TEST_DE_KEY + '" exists: <strong>' + existsResult.data.exists + '</strong></p>');

            if (!existsResult.data.exists) {
                throw new Error('Test Data Extension "' + TEST_DE_KEY + '" not found. Please create it first.');
            }

            logTest('exists()', true, 'DE exists check passed');
            Write('<p>Status: PASS</p>');
        } else {
            Write('<p>exists() failed</p>');
            Write('<p>Error: ' + existsResult.error.message + '</p>');
            logTest('exists()', false, existsResult.error.message);
            Write('<p>Status: FAIL</p>');
        }

        // ====================================================================
        // TEST 2: Get Schema
        // ====================================================================
        Write('<h3>Test 2: Get Data Extension Schema</h3>');
        var schemaResult = deHandler.getSchema(TEST_DE_KEY);

        if (schemaResult.success) {
            Write('<p>getSchema() returned successfully</p>');
            Write('<p>DE Name: <strong>' + schemaResult.data.name + '</strong></p>');
            Write('<p>Customer Key: ' + schemaResult.data.customerKey + '</p>');
            Write('<p>Is Sendable: ' + schemaResult.data.isSendable + '</p>');
            Write('<p>Category ID: ' + schemaResult.data.categoryId + '</p>');
            logTest('getSchema()', true, 'Schema retrieved successfully');
            Write('<p>Status: PASS</p>');
        } else {
            Write('<p>getSchema() failed</p>');
            Write('<p>Error: ' + schemaResult.error.message + '</p>');
            logTest('getSchema()', false, schemaResult.error.message);
            Write('<p>Status: FAIL</p>');
        }

        // ====================================================================
        // TEST 3: Get Fields
        // ====================================================================
        Write('<h3>Test 3: Get Data Extension Fields</h3>');
        var fieldsResult = deHandler.getFields(TEST_DE_KEY);

        if (fieldsResult.success) {
            Write('<p>getFields() returned successfully</p>');
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
            Write('<p>Status: PASS</p>');
        } else {
            Write('<p>getFields() failed</p>');
            Write('<p>Error: ' + fieldsResult.error.message + '</p>');
            logTest('getFields()', false, fieldsResult.error.message);
            Write('<p>Status: FAIL</p>');
        }

        // ====================================================================
        // TEST 4: Get Primary Keys
        // ====================================================================
        Write('<h3>Test 4: Get Primary Keys</h3>');
        var pkResult = deHandler.getPrimaryKeys(TEST_DE_KEY);

        if (pkResult.success) {
            Write('<p>getPrimaryKeys() returned successfully</p>');
            Write('<p>Primary Key fields: <strong>' + pkResult.data.primaryKeys.join(', ') + '</strong></p>');
            logTest('getPrimaryKeys()', true, 'Found ' + pkResult.data.count + ' primary key(s)');
            Write('<p>Status: PASS</p>');
        } else {
            Write('<p>getPrimaryKeys() failed</p>');
            Write('<p>Error: ' + pkResult.error.message + '</p>');
            logTest('getPrimaryKeys()', false, pkResult.error.message);
            Write('<p>Status: FAIL</p>');
        }

        // ====================================================================
        // TEST 5: Insert Row
        // ====================================================================
        Write('<h3>Test 5: Insert Row</h3>');
        Write('<p>Inserting test row with Id: ' + testId + '</p>');
        var insertResult = deHandler.insertRow(TEST_DE_KEY, testRow);

        if (insertResult.success) {
            Write('<p>insertRow() returned successfully</p>');
            Write('<p>Row inserted: ' + insertResult.data.inserted + '</p>');
            logTest('insertRow()', true, 'Row inserted successfully');
            Write('<p>Status: PASS</p>');
        } else {
            Write('<p>insertRow() failed</p>');
            Write('<p>Error: ' + insertResult.error.message + '</p>');
            logTest('insertRow()', false, insertResult.error.message);
            Write('<p>Status: FAIL</p>');
        }

        // ====================================================================
        // TEST 6: Query Rows
        // ====================================================================
        Write('<h3>Test 6: Query Rows</h3>');
        var queryResult = deHandler.query(TEST_DE_KEY, {});

        if (queryResult.success) {
            Write('<p>query() returned successfully</p>');
            Write('<p>Rows found: <strong>' + queryResult.data.count + '</strong></p>');
            if (queryResult.data.count > 0 && queryResult.data.items[0]) {
                Write('<p>First row Id: ' + (queryResult.data.items[0].Id || 'N/A') + '</p>');
            }
            logTest('query()', true, 'Retrieved ' + queryResult.data.count + ' rows');
            Write('<p>Status: PASS</p>');
        } else {
            Write('<p>query() failed</p>');
            Write('<p>Error: ' + queryResult.error.message + '</p>');
            logTest('query()', false, queryResult.error.message);
            Write('<p>Status: FAIL</p>');
        }

        // ====================================================================
        // TEST 7: Get Row by Primary Key
        // ====================================================================
        Write('<h3>Test 7: Get Row by Primary Key</h3>');
        var getRowResult = deHandler.getRow(TEST_DE_KEY, { Id: testId });

        if (getRowResult.success) {
            Write('<p>getRow() returned successfully</p>');
            Write('<p>Row found: <strong>' + getRowResult.data.found + '</strong></p>');
            if (getRowResult.data.found && getRowResult.data.row) {
                Write('<p>Name: ' + getRowResult.data.row.Name + '</p>');
                Write('<p>Email: ' + getRowResult.data.row.Email + '</p>');
            }
            logTest('getRow()', true, 'Row retrieved successfully');
            Write('<p>Status: PASS</p>');
        } else {
            Write('<p>getRow() failed</p>');
            Write('<p>Error: ' + getRowResult.error.message + '</p>');
            logTest('getRow()', false, getRowResult.error.message);
            Write('<p>Status: FAIL</p>');
        }

        // ====================================================================
        // TEST 8: Query with Filter
        // ====================================================================
        Write('<h3>Test 8: Query with Filter</h3>');
        var filterQueryResult = deHandler.query(TEST_DE_KEY, {
            filter: {
                property: 'Status',
                operator: deHandler.OPERATORS.EQUALS,
                value: 'Active'
            }
        });

        if (filterQueryResult.success) {
            Write('<p>query() with filter returned successfully</p>');
            Write('<p>Active rows found: <strong>' + filterQueryResult.data.count + '</strong></p>');
            logTest('query() with filter', true, 'Found ' + filterQueryResult.data.count + ' active rows');
            Write('<p>Status: PASS</p>');
        } else {
            Write('<p>query() with filter failed</p>');
            Write('<p>Error: ' + filterQueryResult.error.message + '</p>');
            logTest('query() with filter', false, filterQueryResult.error.message);
            Write('<p>Status: FAIL</p>');
        }

        // ====================================================================
        // TEST 9: Update Row
        // ====================================================================
        Write('<h3>Test 9: Update Row</h3>');
        var updateData = {
            Id: testId,
            Status: 'Updated',
            Name: 'Updated Name ' + testId
        };
        var updateResult = deHandler.updateRow(TEST_DE_KEY, updateData);

        if (updateResult.success) {
            Write('<p>updateRow() returned successfully</p>');
            Write('<p>Row updated: ' + updateResult.data.updated + '</p>');
            logTest('updateRow()', true, 'Row updated successfully');
            Write('<p>Status: PASS</p>');
        } else {
            Write('<p>updateRow() failed</p>');
            Write('<p>Error: ' + updateResult.error.message + '</p>');
            logTest('updateRow()', false, updateResult.error.message);
            Write('<p>Status: FAIL</p>');
        }

        // ====================================================================
        // TEST 10: Upsert Row (Update existing)
        // ====================================================================
        Write('<h3>Test 10: Upsert Row (Update Existing)</h3>');
        var upsertData = {
            Id: testId,
            Status: 'Upserted',
            Name: 'Upserted Name ' + testId
        };
        var upsertResult = deHandler.upsertRow(TEST_DE_KEY, upsertData);

        if (upsertResult.success) {
            Write('<p>upsertRow() returned successfully</p>');
            Write('<p>Operation: ' + (upsertResult.data.operation || 'N/A') + '</p>');
            logTest('upsertRow() update', true, 'Upsert (update) successful');
            Write('<p>Status: PASS</p>');
        } else {
            Write('<p>upsertRow() failed</p>');
            Write('<p>Error: ' + upsertResult.error.message + '</p>');
            logTest('upsertRow() update', false, upsertResult.error.message);
            Write('<p>Status: FAIL</p>');
        }

        // ====================================================================
        // TEST 11: Count Rows
        // ====================================================================
        Write('<h3>Test 11: Count Rows</h3>');
        var countResult = deHandler.count(TEST_DE_KEY);

        if (countResult.success) {
            Write('<p>count() returned successfully</p>');
            Write('<p>Total rows: <strong>' + countResult.data.count + '</strong></p>');
            logTest('count()', true, 'Count: ' + countResult.data.count);
            Write('<p>Status: PASS</p>');
        } else {
            Write('<p>count() failed</p>');
            Write('<p>Error: ' + countResult.error.message + '</p>');
            logTest('count()', false, countResult.error.message);
            Write('<p>Status: FAIL</p>');
        }

        // ====================================================================
        // TEST 12: Search Rows
        // ====================================================================
        Write('<h3>Test 12: Search Rows (LIKE operator)</h3>');
        var searchResult = deHandler.search(TEST_DE_KEY, 'Name', '%Test%');

        if (searchResult.success) {
            Write('<p>search() returned successfully</p>');
            Write('<p>Matching rows: <strong>' + searchResult.data.count + '</strong></p>');
            logTest('search()', true, 'Found ' + searchResult.data.count + ' matching rows');
            Write('<p>Status: PASS</p>');
        } else {
            Write('<p>search() failed</p>');
            Write('<p>Error: ' + searchResult.error.message + '</p>');
            logTest('search()', false, searchResult.error.message);
            Write('<p>Status: FAIL</p>');
        }

        // ====================================================================
        // TEST 13: Batch Insert
        // ====================================================================
        Write('<h3>Test 13: Batch Insert</h3>');
        var batchRows = [];
        for (var b = 0; b < 3; b++) {
            batchRows.push({
                Id: 'BATCH_' + testId + '_' + b,
                Name: 'Batch User ' + b,
                Email: 'batch_' + b + '_' + testId + '@example.com',
                Status: 'Batch',
                CreatedDate: new Date().toISOString().split('T')[0]
            });
        }
        var batchInsertResult = deHandler.insertBatch(TEST_DE_KEY, batchRows);

        if (batchInsertResult.success) {
            Write('<p>insertBatch() returned successfully</p>');
            Write('<p>Rows inserted: <strong>' + batchInsertResult.data.count + '</strong></p>');
            logTest('insertBatch()', true, 'Inserted ' + batchInsertResult.data.count + ' rows');
            Write('<p>Status: PASS</p>');
        } else {
            Write('<p>insertBatch() failed</p>');
            Write('<p>Error: ' + batchInsertResult.error.message + '</p>');
            logTest('insertBatch()', false, batchInsertResult.error.message);
            Write('<p>Status: FAIL</p>');
        }

        // ====================================================================
        // TEST 14: Batch Update
        // ====================================================================
        Write('<h3>Test 14: Batch Update</h3>');
        var batchUpdateRows = [];
        for (var u = 0; u < 3; u++) {
            batchUpdateRows.push({
                Id: 'BATCH_' + testId + '_' + u,
                Status: 'BatchUpdated'
            });
        }
        var batchUpdateResult = deHandler.updateBatch(TEST_DE_KEY, batchUpdateRows);

        if (batchUpdateResult.success) {
            Write('<p>updateBatch() returned successfully</p>');
            Write('<p>Rows updated: <strong>' + batchUpdateResult.data.count + '</strong></p>');
            logTest('updateBatch()', true, 'Updated ' + batchUpdateResult.data.count + ' rows');
            Write('<p>Status: PASS</p>');
        } else {
            Write('<p>updateBatch() failed</p>');
            Write('<p>Error: ' + batchUpdateResult.error.message + '</p>');
            logTest('updateBatch()', false, batchUpdateResult.error.message);
            Write('<p>Status: FAIL</p>');
        }

        // ====================================================================
        // TEST 15: Verify OPERATORS Constants
        // ====================================================================
        Write('<h3>Test 15: Verify OPERATORS Constants</h3>');
        var hasOperators = deHandler.OPERATORS &&
                          deHandler.OPERATORS.EQUALS === 'equals' &&
                          deHandler.OPERATORS.LIKE === 'like' &&
                          deHandler.OPERATORS.GREATER_THAN === 'greaterThan';

        if (hasOperators) {
            Write('<p>OPERATORS constants available</p>');
            Write('<ul>');
            for (var opKey in deHandler.OPERATORS) {
                if (deHandler.OPERATORS.hasOwnProperty(opKey)) {
                    Write('<li>' + opKey + ': "' + deHandler.OPERATORS[opKey] + '"</li>');
                }
            }
            Write('</ul>');
            logTest('OPERATORS constants', true, 'All operators defined');
            Write('<p>Status: PASS</p>');
        } else {
            Write('<p>OPERATORS constants missing or incorrect</p>');
            logTest('OPERATORS constants', false, 'Constants not properly defined');
            Write('<p>Status: FAIL</p>');
        }

        // ====================================================================
        // TEST 16: Cross-BU Support
        // ====================================================================
        Write('<h3>Test 16: Cross-BU Support</h3>');
        if (TEST_CROSS_BU_MID) {
            var setBuResult = deHandler.setBusinessUnit(parseInt(TEST_CROSS_BU_MID, 10));
            if (setBuResult.success) {
                Write('<p>setBusinessUnit() returned successfully</p>');
                Write('<p>MID set to: ' + TEST_CROSS_BU_MID + '</p>');

                // Reset to current BU
                var resetResult = deHandler.resetBusinessUnit();
                if (resetResult.success) {
                    Write('<p>resetBusinessUnit() returned successfully</p>');
                    logTest('Cross-BU Support', true, 'BU switch and reset successful');
                    Write('<p>Status: PASS</p>');
                } else {
                    logTest('Cross-BU Support', false, resetResult.error.message);
                    Write('<p>Status: FAIL</p>');
                }
            } else {
                Write('<p>setBusinessUnit() failed</p>');
                Write('<p>Error: ' + setBuResult.error.message + '</p>');
                logTest('Cross-BU Support', false, setBuResult.error.message);
                Write('<p>Status: FAIL</p>');
            }
        } else {
            Write('<p>Cross-BU MID not provided - skipping test</p>');
            logTest('Cross-BU Support', false, 'Skipped - no MID provided', true);
            Write('<p>Status: SKIPPED</p>');
        }

        // ====================================================================
        // TEST 17: Batch Delete (Cleanup)
        // ====================================================================
        Write('<h3>Test 17: Batch Delete (Cleanup)</h3>');
        var deleteKeys = [];
        for (var d = 0; d < 3; d++) {
            deleteKeys.push({ Id: 'BATCH_' + testId + '_' + d });
        }
        var batchDeleteResult = deHandler.deleteBatch(TEST_DE_KEY, deleteKeys);

        if (batchDeleteResult.success) {
            Write('<p>deleteBatch() returned successfully</p>');
            Write('<p>Rows deleted: <strong>' + batchDeleteResult.data.count + '</strong></p>');
            logTest('deleteBatch()', true, 'Deleted ' + batchDeleteResult.data.count + ' rows');
            Write('<p>Status: PASS</p>');
        } else {
            Write('<p>deleteBatch() failed</p>');
            Write('<p>Error: ' + batchDeleteResult.error.message + '</p>');
            logTest('deleteBatch()', false, batchDeleteResult.error.message);
            Write('<p>Status: FAIL</p>');
        }

        // ====================================================================
        // TEST 18: Delete Single Row (Final Cleanup)
        // ====================================================================
        Write('<h3>Test 18: Delete Row (Final Cleanup)</h3>');
        var deleteResult = deHandler.deleteRow(TEST_DE_KEY, { Id: testId });

        if (deleteResult.success) {
            Write('<p>deleteRow() returned successfully</p>');
            Write('<p>Row deleted: ' + deleteResult.data.deleted + '</p>');
            logTest('deleteRow()', true, 'Row deleted successfully');
            Write('<p>Status: PASS</p>');
        } else {
            Write('<p>deleteRow() failed</p>');
            Write('<p>Error: ' + deleteResult.error.message + '</p>');
            logTest('deleteRow()', false, deleteResult.error.message);
            Write('<p>Status: FAIL</p>');
        }

        // ====================================================================
        // TEST SUMMARY
        // ====================================================================
        Write('<hr>');
        Write('<h3>Test Summary</h3>');
        Write('<p><strong>Passed:</strong> ' + testResults.passed + '</p>');
        Write('<p><strong>Failed:</strong> ' + testResults.failed + '</p>');
        Write('<p><strong>Skipped:</strong> ' + testResults.skipped + '</p>');
        Write('<p><strong>Total:</strong> ' + (testResults.passed + testResults.failed + testResults.skipped) + '</p>');

        if (testResults.failed === 0) {
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
        Write('<h4>DataExtensionHandler v4.0 API Reference:</h4>');
        Write('<p><strong>Metadata Operations:</strong> exists(), getSchema(), getFields(), getPrimaryKeys()</p>');
        Write('<p><strong>CRUD Operations:</strong> query(), getRow(), insertRow(), updateRow(), upsertRow(), deleteRow()</p>');
        Write('<p><strong>Batch Operations:</strong> insertBatch(), updateBatch(), upsertBatch(), deleteBatch(), clearRows()</p>');
        Write('<p><strong>Convenience:</strong> count(), search()</p>');
        Write('<p><strong>Cross-BU:</strong> setBusinessUnit(), resetBusinessUnit(), getCurrentBusinessUnit()</p>');
        Write('<p><a href="?">Run tests again</a></p>');

    } catch (ex) {
        Write('<p style="color:red;">ERROR: ' + (ex.message || String(ex)) + '</p>');
        if (ex.description) {
            Write('<p><strong>Description:</strong> ' + ex.description + '</p>');
        }
    }
}

</script>
