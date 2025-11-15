<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_AssetHandler - Tests for AssetHandler
 * Uses mock SFMC integration to avoid external dependencies
 *
 * @version 2.0.0
 */

</script>
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_AssetHandler")=%%
<script runat="server">

Write('<h1>AssetHandler Test Suite</h1>');
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

    this.listAssets = function(options) {
        return response.success({
            items: [
                { id: 1, name: 'Asset 1', assetType: { name: 'htmlblock' } },
                { id: 2, name: 'Asset 2', assetType: { name: 'image' } }
            ],
            count: 2
        }, 'MockSFMC', 'listAssets');
    };

    this.getAsset = function(assetId) {
        return response.success({
            id: assetId,
            name: 'Test Asset',
            assetType: { name: 'htmlblock' }
        }, 'MockSFMC', 'getAsset');
    };

    this.createAsset = function(assetData) {
        return response.success({
            id: 999,
            name: assetData.name,
            assetType: assetData.assetType
        }, 'MockSFMC', 'createAsset');
    };

    this.updateAsset = function(assetId, assetData) {
        return response.success({ id: assetId, updated: true }, 'MockSFMC', 'updateAsset');
    };

    this.deleteAsset = function(assetId) {
        return response.success({ deleted: true }, 'MockSFMC', 'deleteAsset');
    };
}

// Test 1: Initialization without SFMC instance
Write('<h3>Test 1: Initialization Without SFMC Instance</h3>');
try {
    var handler1 = new AssetHandler(null);
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
    var handler2 = new AssetHandler(mockSFMC);

    logTest('Should initialize successfully', !!handler2, 'Handler created');
} catch (ex) {
    logTest('Should initialize successfully', false, ex.message || ex.toString());
}

// Test 3: List assets
Write('<h3>Test 3: List Assets</h3>');
try {
    var mockSFMC3 = new MockSFMCIntegration();
    var handler3 = new AssetHandler(mockSFMC3);
    var result3 = handler3.list();

    logTest('Should list assets successfully',
        result3.success && result3.data.items && result3.data.items.length === 2,
        'Returned ' + (result3.data ? result3.data.items.length : 0) + ' assets');
} catch (ex) {
    logTest('Should list assets successfully', false, ex.message || ex.toString());
}

// Test 4: Get asset - missing ID validation
Write('<h3>Test 4: Get Asset - Missing ID Validation</h3>');
try {
    var mockSFMC4 = new MockSFMCIntegration();
    var handler4 = new AssetHandler(mockSFMC4);
    var result4 = handler4.get(null);

    logTest('Should validate asset ID',
        !result4.success && result4.error.code === 'VALIDATION_ERROR',
        result4.error ? result4.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate asset ID', false, ex.message || ex.toString());
}

// Test 5: Get asset - success
Write('<h3>Test 5: Get Asset - Success</h3>');
try {
    var mockSFMC5 = new MockSFMCIntegration();
    var handler5 = new AssetHandler(mockSFMC5);
    var result5 = handler5.get(123);

    logTest('Should get asset successfully',
        result5.success && result5.data.id === 123,
        'Asset ID: ' + (result5.data ? result5.data.id : 'N/A'));
} catch (ex) {
    logTest('Should get asset successfully', false, ex.message || ex.toString());
}

// Test 6: Create asset - missing name validation
Write('<h3>Test 6: Create Asset - Missing Name Validation</h3>');
try {
    var mockSFMC6 = new MockSFMCIntegration();
    var handler6 = new AssetHandler(mockSFMC6);
    var result6 = handler6.create({ assetType: 'htmlblock' });

    logTest('Should validate asset name',
        !result6.success && result6.error.code === 'VALIDATION_ERROR',
        result6.error ? result6.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate asset name', false, ex.message || ex.toString());
}

// Test 7: Create asset - missing assetType validation
Write('<h3>Test 7: Create Asset - Missing AssetType Validation</h3>');
try {
    var mockSFMC7 = new MockSFMCIntegration();
    var handler7 = new AssetHandler(mockSFMC7);
    var result7 = handler7.create({ name: 'Test Asset' });

    logTest('Should validate asset type',
        !result7.success && result7.error.code === 'VALIDATION_ERROR',
        result7.error ? result7.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate asset type', false, ex.message || ex.toString());
}

// Test 8: Create asset - success
Write('<h3>Test 8: Create Asset - Success</h3>');
try {
    var mockSFMC8 = new MockSFMCIntegration();
    var handler8 = new AssetHandler(mockSFMC8);
    var result8 = handler8.create({
        name: 'Test Asset',
        assetType: { name: 'htmlblock' }
    });

    logTest('Should create asset successfully',
        result8.success && result8.data.id === 999,
        result8.success ? 'Asset created with ID: ' + result8.data.id : result8.error.message);
} catch (ex) {
    logTest('Should create asset successfully', false, ex.message || ex.toString());
}

// Test 9: Update asset
Write('<h3>Test 9: Update Asset</h3>');
try {
    var mockSFMC9 = new MockSFMCIntegration();
    var handler9 = new AssetHandler(mockSFMC9);
    var result9 = handler9.update(123, { name: 'Updated Asset' });

    logTest('Should update asset successfully',
        result9.success,
        result9.success ? 'Asset updated' : result9.error.message);
} catch (ex) {
    logTest('Should update asset successfully', false, ex.message || ex.toString());
}

// Test 10: Delete asset
Write('<h3>Test 10: Delete Asset</h3>');
try {
    var mockSFMC10 = new MockSFMCIntegration();
    var handler10 = new AssetHandler(mockSFMC10);
    var result10 = handler10.delete(123);

    logTest('Should delete asset successfully',
        result10.success,
        result10.success ? 'Asset deleted' : result10.error.message);
} catch (ex) {
    logTest('Should delete asset successfully', false, ex.message || ex.toString());
}

// Test 11: Get by type - validation
Write('<h3>Test 11: Get By Type - Missing AssetType Validation</h3>');
try {
    var mockSFMC11 = new MockSFMCIntegration();
    var handler11 = new AssetHandler(mockSFMC11);
    var result11 = handler11.getByType(null);

    logTest('Should validate asset type',
        !result11.success && result11.error.code === 'VALIDATION_ERROR',
        result11.error ? result11.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate asset type', false, ex.message || ex.toString());
}

// Test 12: Get by type - success
Write('<h3>Test 12: Get By Type - Success</h3>');
try {
    var mockSFMC12 = new MockSFMCIntegration();
    var handler12 = new AssetHandler(mockSFMC12);
    var result12 = handler12.getByType('htmlblock');

    logTest('Should get assets by type successfully',
        result12.success,
        result12.success ? 'Assets retrieved by type' : result12.error.message);
} catch (ex) {
    logTest('Should get assets by type successfully', false, ex.message || ex.toString());
}

// Test 13: Search - validation
Write('<h3>Test 13: Search - Missing Search Term Validation</h3>');
try {
    var mockSFMC13 = new MockSFMCIntegration();
    var handler13 = new AssetHandler(mockSFMC13);
    var result13 = handler13.search(null);

    logTest('Should validate search term',
        !result13.success && result13.error.code === 'VALIDATION_ERROR',
        result13.error ? result13.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate search term', false, ex.message || ex.toString());
}

// Test 14: Search - success
Write('<h3>Test 14: Search - Success</h3>');
try {
    var mockSFMC14 = new MockSFMCIntegration();
    var handler14 = new AssetHandler(mockSFMC14);
    var result14 = handler14.search('Test');

    logTest('Should search assets successfully',
        result14.success,
        result14.success ? 'Search completed' : result14.error.message);
} catch (ex) {
    logTest('Should search assets successfully', false, ex.message || ex.toString());
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
