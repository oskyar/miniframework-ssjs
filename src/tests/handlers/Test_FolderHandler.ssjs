<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// TEST: FolderHandler with OmegaFramework (WSProxy Version)
// No credentials required - uses WSProxy/SOAP API
// ============================================================================

Write('<h2>Testing FolderHandler (OmegaFramework v1.0 - WSProxy)</h2>');
Write('<p><strong>Note:</strong> This handler uses WSProxy (SOAP API) - no OAuth credentials required!</p>');

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
    Platform.Function.ContentBlockByName("OMG_FW_WSProxyWrapper");
    Platform.Function.ContentBlockByName("OMG_FW_FolderHandler");

    Write('<p>✅ All dependencies loaded (ResponseWrapper, WSProxyWrapper, FolderHandler)</p>');

    // Initialize FolderHandler using OmegaFramework.create()
    var folderHandler = OmegaFramework.create('FolderHandler', {});
    Write('<p>✅ FolderHandler created with OmegaFramework.create()</p>');

    // Store test folder for subsequent tests
    var testFolderId = null;
    var firstFolder = null;

    // ====================================================================
    // TEST 1: List all Content Builder folders (asset type)
    // ====================================================================
    Write('<h3>Test 1: List Content Builder Folders</h3>');
    var listResult = folderHandler.list({ contentType: folderHandler.CONTENT_TYPES.CONTENTBUILDER });

    if (listResult.success && listResult.data) {
        var count = listResult.data.count || 0;
        var folders = listResult.data.folders || [];

        Write('<p>✅ List successful</p>');
        Write('<p>Total folders: ' + count + '</p>');

        if (folders.length > 0) {
            firstFolder = folders[0];
            Write('<p>First folder: ' + firstFolder.name + ' (ID: ' + firstFolder.id + ')</p>');
        }

        logTest('List Content Builder Folders', true, 'Found ' + count + ' folders');
        Write('<p>Status: ✅ PASS</p>');
    } else {
        Write('<p>❌ List failed</p>');
        var errorMsg = listResult.error ? listResult.error.message : 'Unknown error';
        Write('<p>Error: ' + errorMsg + '</p>');
        logTest('List Content Builder Folders', false, errorMsg);
        Write('<p>Status: ❌ FAIL</p>');
    }

    // ====================================================================
    // TEST 2: List Data Extension folders
    // ====================================================================
    Write('<h3>Test 2: List Data Extension Folders</h3>');
    var deListResult = folderHandler.list({ contentType: folderHandler.CONTENT_TYPES.DATAEXTENSIONS });

    if (deListResult.success && deListResult.data) {
        var deCount = deListResult.data.count || 0;
        Write('<p>✅ List successful</p>');
        Write('<p>Data Extension folders found: ' + deCount + '</p>');
        logTest('List Data Extension Folders', true, 'Found ' + deCount + ' DE folders');
        Write('<p>Status: ✅ PASS</p>');
    } else {
        Write('<p>❌ List failed</p>');
        var errorMsg = deListResult.error ? deListResult.error.message : 'Unknown error';
        Write('<p>Error: ' + errorMsg + '</p>');
        logTest('List Data Extension Folders', false, errorMsg);
        Write('<p>Status: ❌ FAIL</p>');
    }

    // ====================================================================
    // TEST 3: Get folder by ID
    // ====================================================================
    if (firstFolder) {
        Write('<h3>Test 3: Get Folder by ID</h3>');
        var getResult = folderHandler.get(firstFolder.id);

        if (getResult.success && getResult.data) {
            Write('<p>✅ Get folder successful</p>');
            Write('<p>Name: ' + getResult.data.name + '</p>');
            Write('<p>ContentType: ' + getResult.data.contentType + '</p>');
            Write('<p>ParentId: ' + getResult.data.parentId + '</p>');
            Write('<p>AllowChildren: ' + getResult.data.allowChildren + '</p>');
            logTest('Get Folder by ID', true, 'Retrieved: ' + getResult.data.name);
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Get folder failed</p>');
            var errorMsg = getResult.error ? getResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Get Folder by ID', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }
    }

    // ====================================================================
    // TEST 4: Get children of a folder
    // ====================================================================
    if (firstFolder) {
        Write('<h3>Test 4: Get Child Folders</h3>');
        var childrenResult = folderHandler.getChildren(firstFolder.id, folderHandler.CONTENT_TYPES.CONTENTBUILDER);

        if (childrenResult.success && childrenResult.data) {
            var childCount = childrenResult.data.count || 0;
            Write('<p>✅ Get children successful</p>');
            Write('<p>Child folders of "' + firstFolder.name + '": ' + childCount + '</p>');
            logTest('Get Child Folders', true, 'Found ' + childCount + ' children');
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Get children failed</p>');
            var errorMsg = childrenResult.error ? childrenResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Get Child Folders', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }
    }

    // ====================================================================
    // TEST 5: Get folder path
    // ====================================================================
    if (firstFolder) {
        Write('<h3>Test 5: Get Folder Path</h3>');
        var pathResult = folderHandler.getPath(firstFolder.id);

        if (pathResult.success && pathResult.data) {
            Write('<p>✅ Get path successful</p>');
            Write('<p>Full path: ' + pathResult.data.path + '</p>');
            Write('<p>Depth: ' + pathResult.data.depth + ' levels</p>');
            logTest('Get Folder Path', true, 'Path: ' + pathResult.data.path);
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Get path failed</p>');
            var errorMsg = pathResult.error ? pathResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Get Folder Path', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }
    }

    // ====================================================================
    // TEST 6: Check folder exists
    // ====================================================================
    if (firstFolder) {
        Write('<h3>Test 6: Check Folder Exists</h3>');
        var existsResult = folderHandler.exists(firstFolder.name, firstFolder.parentId, folderHandler.CONTENT_TYPES.CONTENTBUILDER);

        if (existsResult.success) {
            Write('<p>✅ Exists check successful</p>');
            Write('<p>Folder "' + firstFolder.name + '" exists: ' + existsResult.data.exists + '</p>');
            logTest('Check Folder Exists', true, 'Exists: ' + existsResult.data.exists);
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Exists check failed</p>');
            var errorMsg = existsResult.error ? existsResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Check Folder Exists', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }
    }

    // ====================================================================
    // TEST 7: Get Root Folder (Content Builder)
    // ====================================================================
    Write('<h3>Test 7: Get Root Folder (Content Builder)</h3>');
    var rootResult = folderHandler.getRootFolder(folderHandler.CONTENT_TYPES.CONTENTBUILDER);

    if (rootResult.success && rootResult.data) {
        Write('<p>✅ Get root folder successful</p>');
        Write('<p>Root folder name: ' + rootResult.data.name + '</p>');
        Write('<p>Root folder ID: ' + rootResult.data.id + '</p>');
        Write('<p>ContentType: ' + rootResult.data.contentType + '</p>');
        logTest('Get Root Folder', true, 'Root: ' + rootResult.data.name + ' (ID: ' + rootResult.data.id + ')');
        Write('<p>Status: ✅ PASS</p>');
    } else {
        Write('<p>❌ Get root folder failed</p>');
        var errorMsg = rootResult.error ? rootResult.error.message : 'Unknown error';
        Write('<p>Error: ' + errorMsg + '</p>');
        logTest('Get Root Folder', false, errorMsg);
        Write('<p>Status: ❌ FAIL</p>');
    }

    // ====================================================================
    // TEST 8: Create test folder (without parentId - should auto-detect root)
    // ====================================================================
    Write('<h3>Test 8: Create Test Folder (auto-detect root parent)</h3>');
    var testFolderName = 'OmegaFW_Test_' + new Date().getTime();
    var createResult = folderHandler.create({
        name: testFolderName,
        contentType: folderHandler.CONTENT_TYPES.CONTENTBUILDER,
        description: 'Test folder created by FolderHandler test',
        allowChildren: true
        // Note: no parentId specified - should auto-detect root folder
    });

    if (createResult.success && createResult.data) {
        testFolderId = createResult.data.id;
        Write('<p>✅ Create folder successful</p>');
        Write('<p>New folder ID: ' + testFolderId + '</p>');
        Write('<p>Name: ' + createResult.data.name + '</p>');
        Write('<p>Parent ID (auto-detected): ' + createResult.data.parentId + '</p>');
        logTest('Create Test Folder (auto root)', true, 'Created: ' + testFolderName + ' (ID: ' + testFolderId + ', Parent: ' + createResult.data.parentId + ')');
        Write('<p>Status: ✅ PASS</p>');
    } else {
        Write('<p>❌ Create folder failed</p>');
        var errorMsg = createResult.error ? createResult.error.message : 'Unknown error';
        Write('<p>Error: ' + errorMsg + '</p>');
        logTest('Create Test Folder (auto root)', false, errorMsg);
        Write('<p>Status: ❌ FAIL</p>');
    }

    // ====================================================================
    // TEST 9: Update folder name
    // ====================================================================
    if (testFolderId) {
        Write('<h3>Test 9: Update Folder Name</h3>');
        var newName = testFolderName + '_Updated';
        var updateResult = folderHandler.update(testFolderId, {
            name: newName,
            description: 'Updated description'
        });

        if (updateResult.success) {
            Write('<p>✅ Update folder successful</p>');
            Write('<p>New name: ' + newName + '</p>');
            logTest('Update Folder Name', true, 'Updated to: ' + newName);
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Update folder failed</p>');
            var errorMsg = updateResult.error ? updateResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('Update Folder Name', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }
    }

    // ====================================================================
    // TEST 10: CreateIfNotExists (should not create, folder exists)
    // ====================================================================
    if (testFolderId) {
        Write('<h3>Test 10: CreateIfNotExists (existing folder)</h3>');
        var updatedName = testFolderName + '_Updated';
        var createIfExistsResult = folderHandler.createIfNotExists({
            name: updatedName,
            contentType: folderHandler.CONTENT_TYPES.CONTENTBUILDER
        });

        if (createIfExistsResult.success) {
            Write('<p>✅ CreateIfNotExists successful</p>');
            Write('<p>Created new: ' + createIfExistsResult.data.created + '</p>');
            if (!createIfExistsResult.data.created) {
                Write('<p>Found existing folder ID: ' + createIfExistsResult.data.folder.id + '</p>');
            }
            logTest('CreateIfNotExists (existing)', true, 'Created: ' + createIfExistsResult.data.created);
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ CreateIfNotExists failed</p>');
            var errorMsg = createIfExistsResult.error ? createIfExistsResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            logTest('CreateIfNotExists (existing)', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }
    }

    // ====================================================================
    // TEST 11: Verify CONTENT_TYPES constants
    // ====================================================================
    Write('<h3>Test 11: Verify CONTENT_TYPES Constants</h3>');
    var hasConstants = folderHandler.CONTENT_TYPES &&
                      folderHandler.CONTENT_TYPES.CONTENTBUILDER === 'asset' &&
                      folderHandler.CONTENT_TYPES.DATAEXTENSIONS === 'dataextension' &&
                      folderHandler.CONTENT_TYPES.MYEMAILS === 'email';

    if (hasConstants) {
        Write('<p>✅ CONTENT_TYPES constants available</p>');
        Write('<p>CONTENTBUILDER: ' + folderHandler.CONTENT_TYPES.CONTENTBUILDER + '</p>');
        Write('<p>DATAEXTENSIONS: ' + folderHandler.CONTENT_TYPES.DATAEXTENSIONS + '</p>');
        Write('<p>MYEMAILS: ' + folderHandler.CONTENT_TYPES.MYEMAILS + '</p>');
        Write('<p>MYAUTOMATIONS: ' + folderHandler.CONTENT_TYPES.MYAUTOMATIONS + '</p>');
        logTest('CONTENT_TYPES Constants', true, 'All constants verified');
        Write('<p>Status: ✅ PASS</p>');
    } else {
        Write('<p>❌ CONTENT_TYPES constants missing or incorrect</p>');
        logTest('CONTENT_TYPES Constants', false, 'Constants not properly defined');
        Write('<p>Status: ❌ FAIL</p>');
    }

    // ====================================================================
    // TEST 12: Delete test folder (cleanup)
    // ====================================================================
    if (testFolderId) {
        Write('<h3>Test 12: Delete Test Folder (Cleanup)</h3>');
        var deleteResult = folderHandler.remove(testFolderId);

        if (deleteResult.success) {
            Write('<p>✅ Delete folder successful</p>');
            Write('<p>Deleted folder ID: ' + testFolderId + '</p>');
            logTest('Delete Test Folder', true, 'Deleted ID: ' + testFolderId);
            Write('<p>Status: ✅ PASS</p>');
        } else {
            Write('<p>❌ Delete folder failed</p>');
            var errorMsg = deleteResult.error ? deleteResult.error.message : 'Unknown error';
            Write('<p>Error: ' + errorMsg + '</p>');
            Write('<p><strong>Note:</strong> You may need to manually delete folder ID: ' + testFolderId + '</p>');
            logTest('Delete Test Folder', false, errorMsg);
            Write('<p>Status: ❌ FAIL</p>');
        }
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
        Write('<h3 style="color:green;">✅ All FolderHandler tests passed!</h3>');
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

    Write('<p><strong>Note:</strong> FolderHandler uses WSProxy (SOAP API) - no OAuth credentials required!</p>');
    Write('<p><a href="?">Run tests again</a></p>');

} catch (ex) {
    Write('<p style="color:red;">❌ ERROR: ' + (ex.message || String(ex) || 'Unknown error') + '</p>');
    if (ex.description) {
        Write('<p><strong>Description:</strong> ' + ex.description + '</p>');
    }
}

</script>
