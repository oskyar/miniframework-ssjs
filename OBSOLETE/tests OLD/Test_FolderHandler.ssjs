<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_FolderHandler - Tests for FolderHandler
 * Uses mock SFMC integration to avoid external dependencies
 *
 * @version 2.0.0
 */

</script>
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FolderHandler")=%%
<script runat="server">

Write('<h1>FolderHandler Test Suite</h1>');
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

    this.makeRestRequest = function(method, endpoint, data, options) {
        if (method === 'GET' && endpoint.indexOf('/asset/v1/content/categories') > -1) {
            return response.success({
                parsedContent: {
                    items: [
                        { id: 1, name: 'Folder 1', parentId: 0 },
                        { id: 2, name: 'Folder 2', parentId: 1 }
                    ],
                    count: 2
                }
            }, 'MockSFMC', 'makeRestRequest');
        }

        if (method === 'POST') {
            return response.success({
                parsedContent: { id: 999, name: data.name, parentId: data.parentId }
            }, 'MockSFMC', 'makeRestRequest');
        }

        if (method === 'PUT' || method === 'PATCH') {
            return response.success({
                parsedContent: { updated: true }
            }, 'MockSFMC', 'makeRestRequest');
        }

        if (method === 'DELETE') {
            return response.success({
                parsedContent: { deleted: true }
            }, 'MockSFMC', 'makeRestRequest');
        }

        return response.success({ parsedContent: {} }, 'MockSFMC', 'makeRestRequest');
    };
}

// Test 1: Initialization without SFMC instance
Write('<h3>Test 1: Initialization Without SFMC Instance</h3>');
try {
    var handler1 = new FolderHandler(null);
    var result1 = handler1.list();

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
    var handler2 = new FolderHandler(mockSFMC);

    logTest('Should initialize successfully', !!handler2, 'Handler created');
} catch (ex) {
    logTest('Should initialize successfully', false, ex.message || ex.toString());
}

// Test 3: List folders
Write('<h3>Test 3: List Folders</h3>');
try {
    var mockSFMC3 = new MockSFMCIntegration();
    var handler3 = new FolderHandler(mockSFMC3);
    var result3 = handler3.list();

    logTest('Should list folders successfully',
        result3.success && result3.data.parsedContent.items,
        'Returned ' + (result3.data && result3.data.parsedContent ? result3.data.parsedContent.items.length : 0) + ' folders');
} catch (ex) {
    logTest('Should list folders successfully', false, ex.message || ex.toString());
}

// Test 4: Get folder - missing ID validation
Write('<h3>Test 4: Get Folder - Missing ID Validation</h3>');
try {
    var mockSFMC4 = new MockSFMCIntegration();
    var handler4 = new FolderHandler(mockSFMC4);
    var result4 = handler4.get(null);

    logTest('Should validate folder ID',
        !result4.success && result4.error.code === 'VALIDATION_ERROR',
        result4.error ? result4.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate folder ID', false, ex.message || ex.toString());
}

// Test 5: Get folder - success
Write('<h3>Test 5: Get Folder - Success</h3>');
try {
    var mockSFMC5 = new MockSFMCIntegration();
    var handler5 = new FolderHandler(mockSFMC5);
    var result5 = handler5.get(123);

    logTest('Should get folder successfully',
        result5.success,
        result5.success ? 'Folder retrieved' : result5.error.message);
} catch (ex) {
    logTest('Should get folder successfully', false, ex.message || ex.toString());
}

// Test 6: Create folder - missing name validation
Write('<h3>Test 6: Create Folder - Missing Name Validation</h3>');
try {
    var mockSFMC6 = new MockSFMCIntegration();
    var handler6 = new FolderHandler(mockSFMC6);
    var result6 = handler6.create({ parentId: 0 });

    logTest('Should validate folder name',
        !result6.success && result6.error.code === 'VALIDATION_ERROR',
        result6.error ? result6.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate folder name', false, ex.message || ex.toString());
}

// Test 7: Create folder - success
Write('<h3>Test 7: Create Folder - Success</h3>');
try {
    var mockSFMC7 = new MockSFMCIntegration();
    var handler7 = new FolderHandler(mockSFMC7);
    var result7 = handler7.create({ name: 'Test Folder', parentId: 0 });

    logTest('Should create folder successfully',
        result7.success && result7.data.parsedContent.id === 999,
        result7.success ? 'Folder created with ID: ' + result7.data.parsedContent.id : result7.error.message);
} catch (ex) {
    logTest('Should create folder successfully', false, ex.message || ex.toString());
}

// Test 8: Update folder
Write('<h3>Test 8: Update Folder</h3>');
try {
    var mockSFMC8 = new MockSFMCIntegration();
    var handler8 = new FolderHandler(mockSFMC8);
    var result8 = handler8.update(123, { name: 'Updated Folder' });

    logTest('Should update folder successfully',
        result8.success,
        result8.success ? 'Folder updated' : result8.error.message);
} catch (ex) {
    logTest('Should update folder successfully', false, ex.message || ex.toString());
}

// Test 9: Delete folder
Write('<h3>Test 9: Delete Folder</h3>');
try {
    var mockSFMC9 = new MockSFMCIntegration();
    var handler9 = new FolderHandler(mockSFMC9);
    var result9 = handler9.delete(123);

    logTest('Should delete folder successfully',
        result9.success,
        result9.success ? 'Folder deleted' : result9.error.message);
} catch (ex) {
    logTest('Should delete folder successfully', false, ex.message || ex.toString());
}

// Test 10: Move folder - validation
Write('<h3>Test 10: Move Folder - Missing Folder ID Validation</h3>');
try {
    var mockSFMC10 = new MockSFMCIntegration();
    var handler10 = new FolderHandler(mockSFMC10);
    var result10 = handler10.move(null, 456);

    logTest('Should validate folder ID',
        !result10.success && result10.error.code === 'VALIDATION_ERROR',
        result10.error ? result10.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate folder ID', false, ex.message || ex.toString());
}

// Test 11: Move folder - success
Write('<h3>Test 11: Move Folder - Success</h3>');
try {
    var mockSFMC11 = new MockSFMCIntegration();
    var handler11 = new FolderHandler(mockSFMC11);
    var result11 = handler11.move(123, 456);

    logTest('Should move folder successfully',
        result11.success,
        result11.success ? 'Folder moved' : result11.error.message);
} catch (ex) {
    logTest('Should move folder successfully', false, ex.message || ex.toString());
}

// Test 12: Get child folders
Write('<h3>Test 12: Get Child Folders</h3>');
try {
    var mockSFMC12 = new MockSFMCIntegration();
    var handler12 = new FolderHandler(mockSFMC12);
    var result12 = handler12.getChildFolders(123);

    logTest('Should get child folders successfully',
        result12.success,
        result12.success ? 'Child folders retrieved' : result12.error.message);
} catch (ex) {
    logTest('Should get child folders successfully', false, ex.message || ex.toString());
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

</script>
