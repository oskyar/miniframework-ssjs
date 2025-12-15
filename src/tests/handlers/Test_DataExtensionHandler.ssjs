<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: DataExtensionHandler v2.0
// Comprehensive tests for the simplified DataExtensionHandler v2 API
//
// Test Flow:
// 1. Metadata tests (exists, schema)
// 2. INSERT test data (using auto single/batch detection)
// 3. READ tests (universal get function)
// 4. UPDATE tests (using auto single/batch detection)
// 5. UPSERT tests
// 6. DELETE tests (cleanup)
// 7. CLEAR test
// ============================================================================

Write('<h2>Testing DataExtensionHandler v2.0 - Simplified API</h2>');
Write('<p><strong>New in v2.0:</strong> Only 10 functions instead of 22, with auto single/batch detection</p>');

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
        for (var b = 0; b < 5; b++) {
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
        Write('<h3>Test 1: exists() - Check if Data Extension Exists</h3>');
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

        // TEST 2: Get Complete Schema (metadata + fields + primary keys in ONE call)
        Write('<h3>Test 2: schema() - Get Complete Metadata</h3>');
        Write('<p><strong>v2 Improvement:</strong> ONE function returns EVERYTHING (metadata + fields + primary keys)</p>');
        var schemaResult = deHandler.schema(TEST_DE_KEY);

        if (schemaResult.success) {
            Write('<p>DE Name: <strong>' + schemaResult.data.name + '</strong></p>');
            Write('<p>Customer Key: ' + schemaResult.data.customerKey + '</p>');
            Write('<p>Is Sendable: ' + schemaResult.data.isSendable + '</p>');
            Write('<p>Fields Count: <strong>' + schemaResult.data.fieldCount + '</strong></p>');
            Write('<p>Primary Keys: <strong>' + schemaResult.data.primaryKeys.join(', ') + '</strong></p>');

            Write('<h4>Fields:</h4>');
            Write('<table border="1" cellpadding="5">');
            Write('<tr><th>Name</th><th>Type</th><th>Max Length</th><th>Primary Key</th><th>Required</th></tr>');
            for (var i = 0; i < schemaResult.data.fields.length; i++) {
                var field = schemaResult.data.fields[i];
                Write('<tr>');
                Write('<td>' + field.name + '</td>');
                Write('<td>' + field.type + '</td>');
                Write('<td>' + (field.maxLength || '-') + '</td>');
                Write('<td>' + (field.isPrimaryKey ? 'Yes' : 'No') + '</td>');
                Write('<td>' + (field.isRequired ? 'Yes' : 'No') + '</td>');
                Write('</tr>');
            }
            Write('</table>');

            logTest('schema()', true, 'Complete schema retrieved in ONE call: ' + schemaResult.data.fieldCount + ' fields, ' + schemaResult.data.primaryKeys.length + ' PKs');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>schema() failed: ' + schemaResult.error.message + '</p>');
            logTest('schema()', false, schemaResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // ====================================================================
        // SECTION 2: INSERT TESTS (with auto single/batch detection)
        // ====================================================================
        Write('<h2 style="background:#eee;padding:10px;">SECTION 2: INSERT TESTS</h2>');
        Write('<p><strong>v2 Improvement:</strong> One insert() function auto-detects single vs batch</p>');

        // TEST 3: Insert Single Row (auto-detected)
        Write('<h3>Test 3: insert() - Single Row (Auto-Detected)</h3>');
        Write('<p>Inserting test row with Id: <strong>' + testId + '</strong></p>');
        var insertResult = deHandler.insert(TEST_DE_KEY, testRow);

        if (insertResult.success) {
            Write('<p>Row inserted successfully</p>');
            Write('<p>Batch detected: <strong>' + insertResult.data.batch + '</strong> (should be false)</p>');
            Write('<p>Rows inserted: <strong>' + insertResult.data.count + '</strong></p>');
            // Debug: Show WSProxy results if available
            if (insertResult.data.results) {
                Write('<p>WSProxy Results: ' + Stringify(insertResult.data.results) + '</p>');
            }
            logTest('insert() single', true, 'Single row inserted: ' + testId);
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>insert() failed: ' + insertResult.error.message + '</p>');
            // Debug: Show full error details
            if (insertResult.error.details) {
                Write('<p>Error details: ' + Stringify(insertResult.error.details) + '</p>');
            }
            logTest('insert() single', false, insertResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 4: Batch Insert (auto-detected)
        Write('<h3>Test 4: insert() - Batch Insert (Auto-Detected)</h3>');
        Write('<p>Inserting <strong>' + batchRows.length + '</strong> rows with prefix: BATCH_' + testId + '</p>');
        var batchInsertResult = deHandler.insert(TEST_DE_KEY, batchRows);

        if (batchInsertResult.success) {
            Write('<p>Batch insert successful</p>');
            Write('<p>Batch detected: <strong>' + batchInsertResult.data.batch + '</strong> (should be true)</p>');
            Write('<p>Rows inserted: <strong>' + batchInsertResult.data.count + '</strong></p>');
            logTest('insert() batch', true, 'Batch inserted: ' + batchInsertResult.data.count + ' rows');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>insert() failed: ' + batchInsertResult.error.message + '</p>');
            logTest('insert() batch', false, batchInsertResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // ====================================================================
        // SECTION 3: READ TESTS (Universal get() function)
        // ====================================================================
        Write('<h2 style="background:#eee;padding:10px;">SECTION 3: READ TESTS</h2>');
        Write('<p><strong>v2 Improvement:</strong> One get() function replaces 5 different read functions</p>');

        // TEST 5: get() - Single row by primary key
        Write('<h3>Test 5: get() - Single Row by Primary Key</h3>');
        Write('<p>Retrieving row with Id: ' + testId + '</p>');
        var getSingleResult = deHandler.get(TEST_DE_KEY, {
            where: {
                property: 'Id',
                value: testId
            }
        });

        // Debug: show full result
        Write('<p>Get result: success=' + getSingleResult.success + ', count=' + (getSingleResult.data ? getSingleResult.data.count : 'N/A') + '</p>');

        if (getSingleResult.success && getSingleResult.data.count > 0) {
            Write('<p>Row found!</p>');
            var row = getSingleResult.data.items[0];
            Write('<ul>');
            Write('<li>Name: ' + row.Name + '</li>');
            Write('<li>LastName: ' + row.LastName + '</li>');
            Write('<li>Email: ' + row.Email + '</li>');
            Write('</ul>');
            logTest('get() single row', true, 'Row retrieved: ' + row.Name);
            Write('<p style="color:green;">Status: PASS</p>');
        } else if (getSingleResult.success && getSingleResult.data.count === 0) {
            Write('<p>Row NOT found (insert may have failed)</p>');
            Write('<p>Searching for Id: ' + testId + '</p>');
            logTest('get() single row', false, 'Row not found after insert');
            Write('<p style="color:red;">Status: FAIL</p>');
        } else {
            Write('<p>get() failed: ' + (getSingleResult.error ? getSingleResult.error.message : 'Unknown error') + '</p>');
            logTest('get() single row', false, getSingleResult.error ? getSingleResult.error.message : 'Unknown error');
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 6: get() with specific fields
        Write('<h3>Test 6: get() - Specific Fields Only</h3>');
        Write('<p>Retrieving only Id and Name fields</p>');
        var getFieldsResult = deHandler.get(TEST_DE_KEY, {
            fields: ['Id', 'Name'],
            where: {
                property: 'Id',
                value: testId
            }
        });

        if (getFieldsResult.success && getFieldsResult.data.count > 0) {
            var fieldRow = getFieldsResult.data.items[0];
            var fieldNames = [];
            for (var fieldName in fieldRow) {
                if (fieldRow.hasOwnProperty(fieldName)) {
                    fieldNames.push(fieldName);
                }
            }

            Write('<p>Row retrieved with fields: ' + fieldNames.join(', ') + '</p>');
            logTest('get() with fields', true, 'Fields returned: ' + fieldNames.join(', '));
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>get() with fields failed</p>');
            logTest('get() with fields', false, 'Could not retrieve with specific fields');
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 7: get() - All rows (auto-pagination)
        Write('<h3>Test 7: get() - Get ALL Rows (Auto-Pagination)</h3>');
        Write('<p>Retrieving ALL rows from the DE</p>');
        var getAllResult = deHandler.get(TEST_DE_KEY);

        if (getAllResult.success) {
            Write('<p>Total rows retrieved: <strong>' + getAllResult.data.count + '</strong></p>');
            Write('<p>Has more rows: <strong>' + getAllResult.data.hasMoreRows + '</strong> (should be false after auto-pagination)</p>');
            Write('<p>(Should include our test rows: 1 single + ' + batchRows.length + ' batch)</p>');

            // Debug: Show first item structure
            if (getAllResult.data.items && getAllResult.data.items.length > 0) {
                Write('<p><strong>DEBUG - First row data:</strong> ' + Stringify(getAllResult.data.items[0]) + '</p>');
            }

            logTest('get() all rows', true, 'Retrieved ' + getAllResult.data.count + ' total rows');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>get() failed: ' + getAllResult.error.message + '</p>');
            logTest('get() all rows', false, getAllResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 8: get() with filter (EQUALS)
        Write('<h3>Test 8: get() with Filter (EQUALS)</h3>');
        Write('<p>Retrieving rows where LastName = "BatchLastName"</p>');
        var getFilterResult = deHandler.get(TEST_DE_KEY, {
            where: {
                property: 'LastName',
                operator: deHandler.OPERATORS.EQUALS,
                value: 'BatchLastName'
            }
        });

        if (getFilterResult.success) {
            Write('<p>Rows found: <strong>' + getFilterResult.data.count + '</strong></p>');
            if (getFilterResult.data.count >= batchRows.length) {
                Write('<p>Found batch rows as expected!</p>');
                logTest('get() with filter', true, 'Found ' + getFilterResult.data.count + ' rows');
            } else {
                logTest('get() with filter', false, 'Expected ' + batchRows.length + ' rows, found ' + getFilterResult.data.count);
            }
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>get() failed: ' + getFilterResult.error.message + '</p>');
            logTest('get() with filter', false, getFilterResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 9: get() with complex filter (AND)
        Write('<h3>Test 9: get() with Complex Filter (AND)</h3>');
        Write('<p>Retrieving rows where LastName = "BatchLastName" AND Name contains "User 0"</p>');
        var getComplexResult = deHandler.get(TEST_DE_KEY, {
            where: {
                filters: [
                    { property: 'LastName', operator: deHandler.OPERATORS.EQUALS, value: 'BatchLastName' },
                    { property: 'Name', operator: deHandler.OPERATORS.LIKE, value: '%User 0%' }
                ],
                logicalOperator: 'AND'
            }
        });

        if (getComplexResult.success) {
            Write('<p>Rows found: <strong>' + getComplexResult.data.count + '</strong></p>');
            if (getComplexResult.data.count > 0) {
                Write('<p>Complex filter working! Found: ' + getComplexResult.data.items[0].Name + '</p>');
                logTest('get() complex filter', true, 'Complex AND filter works: ' + getComplexResult.data.count + ' rows');
            } else {
                logTest('get() complex filter', false, 'Complex filter returned no results');
            }
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>get() failed: ' + getComplexResult.error.message + '</p>');
            logTest('get() complex filter', false, getComplexResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 10: count() - Count all rows
        Write('<h3>Test 10: count() - Count All Rows</h3>');
        var countAllResult = deHandler.count(TEST_DE_KEY);

        if (countAllResult.success) {
            Write('<p>Total rows in DE: <strong>' + countAllResult.data.count + '</strong></p>');
            logTest('count() all', true, 'Count: ' + countAllResult.data.count);
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>count() failed: ' + countAllResult.error.message + '</p>');
            logTest('count() all', false, countAllResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 11: count() with filter
        Write('<h3>Test 11: count() with Filter</h3>');
        var countFilterResult = deHandler.count(TEST_DE_KEY, {
            property: 'LastName',
            value: 'BatchLastName'
        });

        if (countFilterResult.success) {
            Write('<p>Rows with LastName="BatchLastName": <strong>' + countFilterResult.data.count + '</strong></p>');
            logTest('count() with filter', true, 'Filtered count: ' + countFilterResult.data.count);
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>count() failed: ' + countFilterResult.error.message + '</p>');
            logTest('count() with filter', false, countFilterResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // ====================================================================
        // SECTION 4: UPDATE TESTS (with auto single/batch detection)
        // ====================================================================
        Write('<h2 style="background:#eee;padding:10px;">SECTION 4: UPDATE TESTS</h2>');
        Write('<p><strong>v2 Improvement:</strong> One update() function auto-detects single vs batch</p>');

        // TEST 12: update() - Single Row (auto-detected)
        Write('<h3>Test 12: update() - Single Row (Auto-Detected)</h3>');
        var updateData = {
            Id: testId,
            LastName: 'UpdatedLastName',
            Name: 'Updated Name ' + testId
        };
        Write('<p>Updating row ' + testId + ' with new LastName: "UpdatedLastName"</p>');
        var updateResult = deHandler.update(TEST_DE_KEY, updateData);

        if (updateResult.success) {
            Write('<p>Row updated successfully</p>');
            Write('<p>Batch detected: <strong>' + updateResult.data.batch + '</strong> (should be false)</p>');
            logTest('update() single', true, 'Row updated');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>update() failed: ' + updateResult.error.message + '</p>');
            logTest('update() single', false, updateResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 13: Verify Update
        Write('<h3>Test 13: Verify Update with get()</h3>');
        var verifyUpdateResult = deHandler.get(TEST_DE_KEY, {
            where: { property: 'Id', value: testId }
        });

        if (verifyUpdateResult.success && verifyUpdateResult.data.count > 0) {
            var updatedRow = verifyUpdateResult.data.items[0];
            if (updatedRow.LastName == 'UpdatedLastName') {
                Write('<p>Update verified! LastName is now: <strong>' + updatedRow.LastName + '</strong></p>');
                logTest('Verify update()', true, 'LastName correctly updated');
                Write('<p style="color:green;">Status: PASS</p>');
            } else {
                Write('<p>Update NOT verified. LastName is: ' + updatedRow.LastName + '</p>');
                logTest('Verify update()', false, 'LastName not updated: ' + updatedRow.LastName);
                Write('<p style="color:red;">Status: FAIL</p>');
            }
        } else {
            Write('<p>Could not verify update</p>');
            logTest('Verify update()', false, 'Could not retrieve row');
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 14: update() - Batch (auto-detected)
        Write('<h3>Test 14: update() - Batch (Auto-Detected)</h3>');
        var batchUpdateRows = [];
        for (var u = 0; u < batchRows.length; u++) {
            batchUpdateRows.push({
                Id: 'BATCH_' + testId + '_' + u,
                LastName: 'BatchUpdatedLastName'
            });
        }
        var batchUpdateResult = deHandler.update(TEST_DE_KEY, batchUpdateRows);

        if (batchUpdateResult.success) {
            Write('<p>Batch update successful</p>');
            Write('<p>Batch detected: <strong>' + batchUpdateResult.data.batch + '</strong> (should be true)</p>');
            Write('<p>Rows updated: <strong>' + batchUpdateResult.data.count + '</strong></p>');
            logTest('update() batch', true, 'Updated ' + batchUpdateResult.data.count + ' rows');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>update() failed: ' + batchUpdateResult.error.message + '</p>');
            logTest('update() batch', false, batchUpdateResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 15: Verify Batch Update
        Write('<h3>Test 15: Verify Batch Update</h3>');
        var verifyBatchResult = deHandler.get(TEST_DE_KEY, {
            where: {
                property: 'LastName',
                value: 'BatchUpdatedLastName'
            }
        });

        if (verifyBatchResult.success && verifyBatchResult.data.count >= batchRows.length) {
            Write('<p>Batch update verified! Found <strong>' + verifyBatchResult.data.count + '</strong> rows with BatchUpdatedLastName</p>');
            logTest('Verify batch update()', true, 'Found ' + verifyBatchResult.data.count + ' updated rows');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>Batch update NOT fully verified. Found: ' + (verifyBatchResult.success ? verifyBatchResult.data.count : 0) + ' rows</p>');
            logTest('Verify batch update()', false, 'Expected ' + batchRows.length + ' rows, found ' + (verifyBatchResult.success ? verifyBatchResult.data.count : 0));
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // ====================================================================
        // SECTION 5: UPSERT TESTS
        // ====================================================================
        Write('<h2 style="background:#eee;padding:10px;">SECTION 5: UPSERT TESTS</h2>');

        // TEST 16: upsert() - Update existing (single)
        Write('<h3>Test 16: upsert() - Update Existing Row (Auto-Detected)</h3>');
        var upsertData = {
            Id: testId,
            LastName: 'UpsertedLastName',
            Name: 'Upserted Name ' + testId
        };
        var upsertResult = deHandler.upsert(TEST_DE_KEY, upsertData);

        if (upsertResult.success) {
            Write('<p>Upsert successful</p>');
            Write('<p>Batch detected: <strong>' + upsertResult.data.batch + '</strong> (should be false)</p>');
            logTest('upsert() single', true, 'Upsert successful');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>upsert() failed: ' + upsertResult.error.message + '</p>');
            logTest('upsert() single', false, upsertResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 17: upsert() - Insert new row
        Write('<h3>Test 17: upsert() - Insert New Row</h3>');
        var newUpsertId = 'UPSERT_' + testId;
        var newUpsertData = {
            Id: newUpsertId,
            Name: 'Upserted New',
            LastName: 'UpsertNewLastName',
            Mobile: '9999999999',
            Email: 'upsert@example.com'
        };
        var upsertNewResult = deHandler.upsert(TEST_DE_KEY, newUpsertData);

        if (upsertNewResult.success) {
            Write('<p>Upsert new row successful</p>');
            logTest('upsert() new row', true, 'New row upserted');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>upsert() failed: ' + upsertNewResult.error.message + '</p>');
            logTest('upsert() new row', false, upsertNewResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 18: upsert() - Batch (auto-detected)
        Write('<h3>Test 18: upsert() - Batch (Auto-Detected)</h3>');
        var batchUpsertRows = [];
        for (var up = 0; up < 3; up++) {
            batchUpsertRows.push({
                Id: 'BATCH_' + testId + '_' + up,
                Mobile: '8888888' + up + up + up
            });
        }
        var batchUpsertResult = deHandler.upsert(TEST_DE_KEY, batchUpsertRows);

        if (batchUpsertResult.success) {
            Write('<p>Batch upsert successful</p>');
            Write('<p>Batch detected: <strong>' + batchUpsertResult.data.batch + '</strong> (should be true)</p>');
            Write('<p>Rows upserted: <strong>' + batchUpsertResult.data.count + '</strong></p>');
            logTest('upsert() batch', true, 'Batch upserted: ' + batchUpsertResult.data.count + ' rows');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>upsert() failed: ' + batchUpsertResult.error.message + '</p>');
            logTest('upsert() batch', false, batchUpsertResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // ====================================================================
        // SECTION 6: DELETE TESTS (Cleanup)
        // ====================================================================
        Write('<h2 style="background:#eee;padding:10px;">SECTION 6: DELETE TESTS</h2>');
        Write('<p><strong>v2 Improvement:</strong> One remove() function auto-detects single vs batch</p>');

        // TEST 19: remove() - Single Row (auto-detected)
        Write('<h3>Test 19: remove() - Single Row (Auto-Detected)</h3>');
        Write('<p>Deleting row with Id: ' + testId + '</p>');
        var deleteResult = deHandler.remove(TEST_DE_KEY, { Id: testId });

        if (deleteResult.success) {
            Write('<p>Row deleted successfully</p>');
            Write('<p>Batch detected: <strong>' + deleteResult.data.batch + '</strong> (should be false)</p>');
            logTest('remove() single', true, 'Row deleted: ' + testId);
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>remove() failed: ' + deleteResult.error.message + '</p>');
            logTest('remove() single', false, deleteResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 20: Verify Delete
        Write('<h3>Test 20: Verify Delete</h3>');
        var verifyDeleteResult = deHandler.get(TEST_DE_KEY, {
            where: { property: 'Id', value: testId }
        });

        if (verifyDeleteResult.success && verifyDeleteResult.data.count === 0) {
            Write('<p>Delete verified! Row no longer exists.</p>');
            logTest('Verify remove()', true, 'Row confirmed deleted');
            Write('<p style="color:green;">Status: PASS</p>');
        } else if (verifyDeleteResult.success && verifyDeleteResult.data.count > 0) {
            Write('<p>Delete NOT verified - row still exists!</p>');
            logTest('Verify remove()', false, 'Row still exists after delete');
            Write('<p style="color:red;">Status: FAIL</p>');
        } else {
            Write('<p>Could not verify delete</p>');
            logTest('Verify remove()', false, 'Verification failed');
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 21: remove() - Batch (auto-detected)
        Write('<h3>Test 21: remove() - Batch (Auto-Detected)</h3>');
        var deleteKeys = [];
        for (var d = 0; d < batchRows.length; d++) {
            deleteKeys.push({ Id: 'BATCH_' + testId + '_' + d });
        }
        var batchDeleteResult = deHandler.remove(TEST_DE_KEY, deleteKeys);

        if (batchDeleteResult.success) {
            Write('<p>Batch delete successful</p>');
            Write('<p>Batch detected: <strong>' + batchDeleteResult.data.batch + '</strong> (should be true)</p>');
            Write('<p>Rows deleted: <strong>' + batchDeleteResult.data.count + '</strong></p>');
            logTest('remove() batch', true, 'Deleted ' + batchDeleteResult.data.count + ' rows');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>remove() failed: ' + batchDeleteResult.error.message + '</p>');
            logTest('remove() batch', false, batchDeleteResult.error.message);
            Write('<p style="color:red;">Status: FAIL</p>');
        }

        // TEST 22: Delete upserted row (cleanup)
        Write('<h3>Test 22: Cleanup - Delete Upserted Row</h3>');
        var cleanupResult = deHandler.remove(TEST_DE_KEY, { Id: newUpsertId });

        if (cleanupResult.success) {
            Write('<p>Cleanup successful</p>');
            logTest('Cleanup upsert', true, 'Upserted row cleaned up');
            Write('<p style="color:green;">Status: PASS</p>');
        } else {
            Write('<p>Cleanup failed (not critical): ' + cleanupResult.error.message + '</p>');
            logTest('Cleanup upsert', false, cleanupResult.error.message);
            Write('<p style="color:orange;">Status: SKIP</p>');
        }

        // ====================================================================
        // SECTION 7: CLEAR TEST
        // ====================================================================
        Write('<h2 style="background:#eee;padding:10px;">SECTION 7: CLEAR TEST (Optional)</h2>');

        // TEST 23: clear() - Optional (commented out by default for safety)
        Write('<h3>Test 23: clear() - Delete All Rows (SKIPPED)</h3>');
        Write('<p><strong>WARNING:</strong> This test is SKIPPED by default as it deletes ALL data from the DE.</p>');
        Write('<p>To enable, uncomment the code in the test file.</p>');
        logTest('clear()', false, 'Skipped for safety - would delete all rows', true);
        Write('<p style="color:gray;">Status: SKIPPED</p>');

        // Uncomment to test clear():
        /*
        var clearConfirm = Platform.Request.GetQueryStringParameter("confirmClear");
        if (clearConfirm == "YES") {
            var clearResult = deHandler.clear(TEST_DE_KEY);
            if (clearResult.success) {
                Write('<p>DE cleared! Rows deleted: ' + clearResult.data.rowsDeleted + '</p>');
                logTest('clear()', true, 'All rows deleted: ' + clearResult.data.rowsDeleted);
                Write('<p style="color:green;">Status: PASS</p>');
            } else {
                Write('<p>clear() failed: ' + clearResult.error.message + '</p>');
                logTest('clear()', false, clearResult.error.message);
                Write('<p style="color:red;">Status: FAIL</p>');
            }
        } else {
            Write('<p>Add ?confirmClear=YES to URL to test clear()</p>');
        }
        */

        // ====================================================================
        // SECTION 8: MISC TESTS
        // ====================================================================
        Write('<h2 style="background:#eee;padding:10px;">SECTION 8: MISC TESTS</h2>');

        // TEST 24: OPERATORS Constants
        Write('<h3>Test 24: Verify OPERATORS Constants</h3>');
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

        // TEST 25: Cross-BU Support
        Write('<h3>Test 25: Cross-BU Support (setBU)</h3>');
        if (TEST_CROSS_BU_MID) {
            var setBuResult = deHandler.setBU(parseInt(TEST_CROSS_BU_MID, 10));
            if (setBuResult.success) {
                Write('<p>setBU() successful - MID: ' + TEST_CROSS_BU_MID + '</p>');
                var resetResult = deHandler.setBU(null);
                if (resetResult.success) {
                    Write('<p>setBU(null) reset successful</p>');
                    logTest('Cross-BU Support', true, 'BU switch and reset successful');
                    Write('<p style="color:green;">Status: PASS</p>');
                } else {
                    logTest('Cross-BU Support', false, resetResult.error.message);
                    Write('<p style="color:red;">Status: FAIL</p>');
                }
            } else {
                Write('<p>setBU() failed: ' + setBuResult.error.message + '</p>');
                logTest('Cross-BU Support', false, setBuResult.error.message);
                Write('<p style="color:red;">Status: FAIL</p>');
            }
        } else {
            Write('<p>Cross-BU MID not provided - skipping test</p>');
            logTest('Cross-BU Support', false, 'Skipped - no MID provided', true);
            Write('<p style="color:gray;">Status: SKIPPED</p>');
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
        Write('<h2>DataExtensionHandler v2.0 API - Simplified from 22 to 10 Functions</h2>');

        Write('<h3>API Comparison:</h3>');
        Write('<table border="1" cellpadding="5" style="width:100%;">');
        Write('<tr style="background:#eee;">');
        Write('<th>Category</th>');
        Write('<th>v1 API (22 functions)</th>');
        Write('<th>v2 API (10 functions)</th>');
        Write('</tr>');

        Write('<tr>');
        Write('<td><strong>Metadata</strong></td>');
        Write('<td>getSchema(), getFields(), getPrimaryKeys()</td>');
        Write('<td><strong>schema()</strong> - Returns EVERYTHING in one call</td>');
        Write('</tr>');

        Write('<tr>');
        Write('<td><strong>Read</strong></td>');
        Write('<td>retrieve(), retrieveAll(), retrieveNext(), getRow(), query(), search()</td>');
        Write('<td><strong>get()</strong> - Universal function handles ALL scenarios<br><strong>count()</strong></td>');
        Write('</tr>');

        Write('<tr>');
        Write('<td><strong>Insert</strong></td>');
        Write('<td>insertRow(), insertBatch()</td>');
        Write('<td><strong>insert()</strong> - Auto-detects single vs batch</td>');
        Write('</tr>');

        Write('<tr>');
        Write('<td><strong>Update</strong></td>');
        Write('<td>updateRow(), updateBatch()</td>');
        Write('<td><strong>update()</strong> - Auto-detects single vs batch</td>');
        Write('</tr>');

        Write('<tr>');
        Write('<td><strong>Delete</strong></td>');
        Write('<td>deleteRow(), deleteBatch(), clearRows()</td>');
        Write('<td><strong>remove()</strong> - Auto-detects single vs batch<br><strong>clear()</strong></td>');
        Write('</tr>');

        Write('<tr>');
        Write('<td><strong>Upsert</strong></td>');
        Write('<td>upsertRow(), upsertBatch()</td>');
        Write('<td><strong>upsert()</strong> - Auto-detects single vs batch</td>');
        Write('</tr>');

        Write('<tr>');
        Write('<td><strong>Utility</strong></td>');
        Write('<td>exists(), count(), setBusinessUnit(), resetBusinessUnit(), getCurrentBusinessUnit()</td>');
        Write('<td><strong>exists()</strong><br><strong>setBU()</strong> - Pass null to reset</td>');
        Write('</tr>');
        Write('</table>');

        Write('<h3>v2.0 Complete API (10 functions):</h3>');
        Write('<ul>');
        Write('<li><strong>schema(deKey)</strong> - Get complete metadata (name, fields, PKs, everything)</li>');
        Write('<li><strong>exists(deKey)</strong> - Check if DE exists</li>');
        Write('<li><strong>get(deKey, options)</strong> - Universal read (single, multiple, all, with/without filters)</li>');
        Write('<li><strong>count(deKey, where)</strong> - Count rows</li>');
        Write('<li><strong>insert(deKey, data)</strong> - Insert single or batch (auto-detected)</li>');
        Write('<li><strong>update(deKey, data)</strong> - Update single or batch (auto-detected)</li>');
        Write('<li><strong>remove(deKey, keys)</strong> - Delete single or batch (auto-detected)</li>');
        Write('<li><strong>upsert(deKey, data)</strong> - Upsert single or batch (auto-detected)</li>');
        Write('<li><strong>clear(deKey)</strong> - Delete all rows</li>');
        Write('<li><strong>setBU(mid)</strong> - Set Business Unit (null to reset)</li>');
        Write('</ul>');

        Write('<h3>Usage Examples:</h3>');
        Write('<pre>');
        Write('// Get complete schema in ONE call\n');
        Write('var meta = deHandler.schema("MyDE");\n');
        Write('// Returns: { name, customerKey, fields: [...], primaryKeys: [...] }\n\n');

        Write('// Universal get() - handles ALL scenarios\n');
        Write('deHandler.get("MyDE"); // All rows with auto-pagination\n');
        Write('deHandler.get("MyDE", { where: { property: "Id", value: "123" } }); // Single row\n');
        Write('deHandler.get("MyDE", { fields: ["Id", "Name"] }); // Specific fields\n');
        Write('deHandler.get("MyDE", { where: {...}, limit: 100 }); // Limited results\n\n');

        Write('// Auto single/batch detection\n');
        Write('deHandler.insert("MyDE", { Id: "1", Name: "John" }); // Single (auto-detected)\n');
        Write('deHandler.insert("MyDE", [{...}, {...}]); // Batch (auto-detected)\n');
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
