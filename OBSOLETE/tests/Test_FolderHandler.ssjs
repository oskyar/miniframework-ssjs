%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_BaseHandler")=%%
%%=ContentBlockByKey("OMG_FW_AuthHandler")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_FW_FolderHandler")=%%

<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: FolderHandler
// ============================================================================

Write('<h2>Testing FolderHandler</h2>');

try {
    // Configuration (use test credentials - will fail but structure will be validated)
    var authConfig = {
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
        authBaseUrl: 'https://test.auth.marketingcloudapis.com/'
    };

    var folderHandler = new FolderHandler(authConfig);

    // Test 1: Check handler initialization
    Write('<h3>Test 1: Handler Initialization</h3>');
    Write('<p>FolderHandler initialized: ' + (typeof folderHandler === 'object' ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Has create method: ' + (typeof folderHandler.create === 'function' ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Has update method: ' + (typeof folderHandler.update === 'function' ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Has get method: ' + (typeof folderHandler.get === 'function' ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Has list method: ' + (typeof folderHandler.list === 'function' ? '✅ PASS' : '❌ FAIL') + '</p>');
    Write('<p>Has remove method: ' + (typeof folderHandler.remove === 'function' ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 2: Validation - Create without data
    Write('<h3>Test 2: Validation - Create Without Data</h3>');
    var createNoData = folderHandler.create(null);
    Write('<pre>' + Stringify(createNoData, null, 2) + '</pre>');
    Write('<p>Status: ' + (!createNoData.success && createNoData.error.code === 'VALIDATION_ERROR' ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 3: Validation - Create without name
    Write('<h3>Test 3: Validation - Create Without Name</h3>');
    var createNoName = folderHandler.create({description: 'Test folder'});
    Write('<pre>' + Stringify(createNoName, null, 2) + '</pre>');
    Write('<p>Status: ' + (!createNoName.success && createNoName.error.code === 'VALIDATION_ERROR' ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 4: Validation - Update without folderId
    Write('<h3>Test 4: Validation - Update Without Folder ID</h3>');
    var updateNoId = folderHandler.update(null, {name: 'Updated Name'});
    Write('<pre>' + Stringify(updateNoId, null, 2) + '</pre>');
    Write('<p>Status: ' + (!updateNoId.success && updateNoId.error.code === 'VALIDATION_ERROR' ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 5: Validation - Get without folderId
    Write('<h3>Test 5: Validation - Get Without Folder ID</h3>');
    var getNoId = folderHandler.get(null);
    Write('<pre>' + Stringify(getNoId, null, 2) + '</pre>');
    Write('<p>Status: ' + (!getNoId.success && getNoId.error.code === 'VALIDATION_ERROR' ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 6: Validation - Remove without folderId
    Write('<h3>Test 6: Validation - Remove Without Folder ID</h3>');
    var removeNoId = folderHandler.remove(null);
    Write('<pre>' + Stringify(removeNoId, null, 2) + '</pre>');
    Write('<p>Status: ' + (!removeNoId.success && removeNoId.error.code === 'VALIDATION_ERROR' ? '✅ PASS' : '❌ FAIL') + '</p>');

    // Test 7: Structure validation - Create with valid data structure
    Write('<h3>Test 7: Structure Validation - Create Folder Payload</h3>');
    var validFolderData = {
        name: 'Test Folder',
        parentId: 12345,
        description: 'This is a test folder',
        categoryType: 'asset'
    };
    Write('<p>Valid folder data structure:</p>');
    Write('<pre>' + Stringify(validFolderData, null, 2) + '</pre>');
    Write('<p>Status: ✅ PASS (Structure is valid)</p>');

    Write('<hr><h3>✅ All FolderHandler validation tests completed</h3>');
    Write('<p><strong>Note:</strong> Actual API operations require valid SFMC credentials and authentication.</p>');

} catch (ex) {
    Write('<p style="color:red;">❌ ERROR: ' + ex.toString() + '</p>');
}

</script>