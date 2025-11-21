<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_DataExtensionHandler - Tests for DataExtensionHandler
 * Uses mock SFMC integration to avoid external dependencies
 *
 * @version 2.0.0
 */

</script>
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_DataExtensionHandler")=%%
<script runat="server">

Write('<h1>DataExtensionHandler Test Suite</h1>');
Write('<hr>');

var totalTests = 0;
var passedTests = 0;

function logTest(testName, passed, details) {
    totalTests++;
    if (passed) passedTests++;

    var status = passed ? '✓ PASS' : '✗ FAIL';
    var color = passed ? 'green' : 'red';

    Write('<div style="color: ' + color + '; margin: 10px 0;">');
    Write('<strong>' + status + '</strong>: ' + testName);
    if (details) {
        Write('<br><span style="margin-left: 20px; font-size: 0.9em;">' + details + '</span>');
    }
    Write('</div>');
}

// Mock SFMC Integration
function MockSFMCIntegration() {
    var response = new ResponseWrapper();

    this.queryDataExtension = function(deKey, options) {
        return response.success({
            items: [
                { EmailAddress: 'test1@example.com', FirstName: 'John' },
                { EmailAddress: 'test2@example.com', FirstName: 'Jane' }
            ],
            count: 2
        }, 'MockSFMC', 'queryDataExtension');
    };

    this.insertDataExtensionRow = function(deKey, rowData) {
        return response.success({ inserted: true }, 'MockSFMC', 'insertDataExtensionRow');
    };

    this.updateDataExtensionRow = function(deKey, rowData) {
        return response.success({ updated: true }, 'MockSFMC', 'updateDataExtensionRow');
    };

    this.deleteDataExtensionRow = function(deKey, primaryKeyValues) {
        return response.success({ deleted: true }, 'MockSFMC', 'deleteDataExtensionRow');
    };
}

// Test 1: Initialization without SFMC instance
Write('<h3>Test 1: Initialization Without SFMC Instance</h3>');
try {
    var handler1 = new DataExtensionHandler(null);
    var result1 = handler1.query('TestDE');

    logTest('Should return error when no SFMC instance',
        !result1.success && result1.error.message.indexOf('required') > -1,
        result1.error ? result1.error.message : 'No error');
} catch (ex) {
    logTest('Should return error when no SFMC instance', false, ex.message || ex.toString());
}

// Test 2: Initialization with mock SFMC
Write('<h3>Test 2: Initialization With Mock SFMC</h3>');
try {
    var mockSFMC = new MockSFMCIntegration();
    var handler2 = new DataExtensionHandler(mockSFMC);

    logTest('Should initialize successfully', !!handler2, 'Handler created');
} catch (ex) {
    logTest('Should initialize successfully', false, ex.message || ex.toString());
}

// Test 3: Query - missing DE key validation
Write('<h3>Test 3: Query - Missing DE Key Validation</h3>');
try {
    var mockSFMC3 = new MockSFMCIntegration();
    var handler3 = new DataExtensionHandler(mockSFMC3);
    var result3 = handler3.query(null);

    logTest('Should validate data extension key',
        !result3.success && result3.error.code === 'VALIDATION_ERROR',
        result3.error ? result3.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate data extension key', false, ex.message || ex.toString());
}

// Test 4: Query - success
Write('<h3>Test 4: Query - Success</h3>');
try {
    var mockSFMC4 = new MockSFMCIntegration();
    var handler4 = new DataExtensionHandler(mockSFMC4);
    var result4 = handler4.query('TestDE');

    logTest('Should query data extension successfully',
        result4.success && result4.data.items && result4.data.items.length === 2,
        'Returned ' + (result4.data ? result4.data.items.length : 0) + ' rows');
} catch (ex) {
    logTest('Should query data extension successfully', false, ex.message || ex.toString());
}

// Test 5: Insert row - missing DE key validation
Write('<h3>Test 5: Insert Row - Missing DE Key Validation</h3>');
try {
    var mockSFMC5 = new MockSFMCIntegration();
    var handler5 = new DataExtensionHandler(mockSFMC5);
    var result5 = handler5.insertRow(null, { EmailAddress: 'test@example.com' });

    logTest('Should validate data extension key',
        !result5.success && result5.error.code === 'VALIDATION_ERROR',
        result5.error ? result5.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate data extension key', false, ex.message || ex.toString());
}

// Test 6: Insert row - missing row data validation
Write('<h3>Test 6: Insert Row - Missing Row Data Validation</h3>');
try {
    var mockSFMC6 = new MockSFMCIntegration();
    var handler6 = new DataExtensionHandler(mockSFMC6);
    var result6 = handler6.insertRow('TestDE', null);

    logTest('Should validate row data',
        !result6.success && result6.error.code === 'VALIDATION_ERROR',
        result6.error ? result6.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate row data', false, ex.message || ex.toString());
}

// Test 7: Insert row - success
Write('<h3>Test 7: Insert Row - Success</h3>');
try {
    var mockSFMC7 = new MockSFMCIntegration();
    var handler7 = new DataExtensionHandler(mockSFMC7);
    var result7 = handler7.insertRow('TestDE', { EmailAddress: 'test@example.com', FirstName: 'John' });

    logTest('Should insert row successfully',
        result7.success,
        result7.success ? 'Row inserted' : result7.error.message);
} catch (ex) {
    logTest('Should insert row successfully', false, ex.message || ex.toString());
}

// Test 8: Update row
Write('<h3>Test 8: Update Row</h3>');
try {
    var mockSFMC8 = new MockSFMCIntegration();
    var handler8 = new DataExtensionHandler(mockSFMC8);
    var result8 = handler8.updateRow('TestDE', { EmailAddress: 'test@example.com', FirstName: 'Jane' });

    logTest('Should update row successfully',
        result8.success,
        result8.success ? 'Row updated' : result8.error.message);
} catch (ex) {
    logTest('Should update row successfully', false, ex.message || ex.toString());
}

// Test 9: Delete row - missing DE key validation
Write('<h3>Test 9: Delete Row - Missing DE Key Validation</h3>');
try {
    var mockSFMC9 = new MockSFMCIntegration();
    var handler9 = new DataExtensionHandler(mockSFMC9);
    var result9 = handler9.deleteRow(null, { EmailAddress: 'test@example.com' });

    logTest('Should validate data extension key',
        !result9.success && result9.error.code === 'VALIDATION_ERROR',
        result9.error ? result9.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate data extension key', false, ex.message || ex.toString());
}

// Test 10: Delete row - success
Write('<h3>Test 10: Delete Row - Success</h3>');
try {
    var mockSFMC10 = new MockSFMCIntegration();
    var handler10 = new DataExtensionHandler(mockSFMC10);
    var result10 = handler10.deleteRow('TestDE', { EmailAddress: 'test@example.com' });

    logTest('Should delete row successfully',
        result10.success,
        result10.success ? 'Row deleted' : result10.error.message);
} catch (ex) {
    logTest('Should delete row successfully', false, ex.message || ex.toString());
}

// Test 11: Upsert row
Write('<h3>Test 11: Upsert Row</h3>');
try {
    var mockSFMC11 = new MockSFMCIntegration();
    var handler11 = new DataExtensionHandler(mockSFMC11);
    var result11 = handler11.upsertRow('TestDE', { EmailAddress: 'test@example.com', FirstName: 'John' });

    logTest('Should upsert row successfully',
        result11.success,
        result11.success ? 'Row upserted' : result11.error.message);
} catch (ex) {
    logTest('Should upsert row successfully', false, ex.message || ex.toString());
}

// Summary
Write('<hr>');
Write('<h3>Test Summary</h3>');
Write('<div style="margin: 20px 0; padding: 15px; background-color: #f0f0f0; border-radius: 5px;">');
Write('<strong>Total Tests:</strong> ' + totalTests + '<br>');
Write('<strong>Passed:</strong> <span style="color: green;">' + passedTests + '</span><br>');
Write('<strong>Failed:</strong> <span style="color: red;">' + (totalTests - passedTests) + '</span><br>');
Write('<strong>Success Rate:</strong> ' + Math.round((passedTests / totalTests) * 100) + '%');
Write('</div>');

if (passedTests === totalTests) {
    Write('<div style="color: green; font-weight: bold; font-size: 1.2em;">✓ ALL TESTS PASSED</div>');
} else {
    Write('<div style="color: red; font-weight: bold; font-size: 1.2em;">✗ SOME TESTS FAILED</div>');
}

Write('<div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">');
Write('<strong>Note:</strong> These tests use a mock SFMC integration. The actual DataExtensionHandler ');
Write('attempts to use native SSJS functions first (faster) and falls back to REST API if needed. ');
Write('Real integration tests validate both code paths.');
Write('</div>');

</script>
