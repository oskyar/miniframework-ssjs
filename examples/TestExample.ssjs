<script runat="server">

Platform.Load("core", "1.1.1");

// Load OmegaFramework handlers
%%=ContentBlockByKey("ResponseWrapper")=%%
%%=ContentBlockByKey("AuthHandler")=%%
%%=ContentBlockByKey("ConnectionHandler")=%%
%%=ContentBlockByKey("EmailHandler")=%%
%%=ContentBlockByKey("DataExtensionHandler")=%%
%%=ContentBlockByKey("AssetHandler")=%%
%%=ContentBlockByKey("FolderHandler")=%%
%%=ContentBlockByKey("LogHandler")=%%

// Configure authentication
var authConfig = {
    clientId: 'YOUR_CLIENT_ID',
    clientSecret: 'YOUR_CLIENT_SECRET',
    authBaseUrl: 'https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/'
};

// Configure logging
var logConfig = {
    level: 2, // INFO level
    enableConsole: true,
    enableDataExtension: true,
    enableEmailAlerts: false,
    dataExtensionKey: 'omegaframework_logs'
};

// Initialize logger
var logger = new LogHandler(authConfig, logConfig);

function testOmegaFramework() {
    try {
        Write('<h2>🧪 OmegaFramework Test Results</h2>');
        
        // Test 1: Authentication
        Write('<h3>1. Testing Authentication</h3>');
        var auth = new AuthHandler();
        var tokenResult = auth.getToken(authConfig);
        
        if (tokenResult.success) {
            Write('<div style="color: green;">✅ Authentication successful</div>');
            logger.info('Authentication test passed', {}, 'TestExample');
        } else {
            Write('<div style="color: red;">❌ Authentication failed: ' + tokenResult.error.message + '</div>');
            logger.error('Authentication test failed', tokenResult.error, 'TestExample');
            return;
        }
        
        // Test 2: Email Handler
        Write('<h3>2. Testing Email Handler</h3>');
        var email = new EmailHandler(authConfig);
        
        var emailListResult = email.list({pageSize: 5});
        if (emailListResult.success) {
            Write('<div style="color: green;">✅ Email list retrieved successfully</div>');
            logger.info('Email handler test passed', {count: emailListResult.data.length || 0}, 'TestExample');
        } else {
            Write('<div style="color: orange;">⚠️ Email list failed: ' + emailListResult.error.message + '</div>');
            logger.warn('Email handler test failed', emailListResult.error, 'TestExample');
        }
        
        // Test 3: Data Extension Handler
        Write('<h3>3. Testing Data Extension Handler</h3>');
        var de = new DataExtensionHandler(authConfig);
        
        var deListResult = de.list({pageSize: 5});
        if (deListResult.success) {
            Write('<div style="color: green;">✅ Data Extension list retrieved successfully</div>');
            logger.info('Data Extension handler test passed', {count: deListResult.data.length || 0}, 'TestExample');
        } else {
            Write('<div style="color: orange;">⚠️ Data Extension list failed: ' + deListResult.error.message + '</div>');
            logger.warn('Data Extension handler test failed', deListResult.error, 'TestExample');
        }
        
        // Test 4: Asset Handler
        Write('<h3>4. Testing Asset Handler</h3>');
        var asset = new AssetHandler(authConfig);
        
        var assetListResult = asset.list({pageSize: 5});
        if (assetListResult.success) {
            Write('<div style="color: green;">✅ Asset list retrieved successfully</div>');
            logger.info('Asset handler test passed', {count: assetListResult.data.length || 0}, 'TestExample');
        } else {
            Write('<div style="color: orange;">⚠️ Asset list failed: ' + assetListResult.error.message + '</div>');
            logger.warn('Asset handler test failed', assetListResult.error, 'TestExample');
        }
        
        // Test 5: Folder Handler
        Write('<h3>5. Testing Folder Handler</h3>');
        var folder = new FolderHandler(authConfig);
        
        var folderListResult = folder.list({pageSize: 5});
        if (folderListResult.success) {
            Write('<div style="color: green;">✅ Folder list retrieved successfully</div>');
            logger.info('Folder handler test passed', {count: folderListResult.data.length || 0}, 'TestExample');
        } else {
            Write('<div style="color: orange;">⚠️ Folder list failed: ' + folderListResult.error.message + '</div>');
            logger.warn('Folder handler test failed', folderListResult.error, 'TestExample');
        }
        
        // Test 6: Connection Handler
        Write('<h3>6. Testing Connection Handler</h3>');
        var connection = new ConnectionHandler();
        
        var authResult = auth.createAuthHeader(tokenResult.data);
        if (authResult.success) {
            var testUrl = tokenResult.data.restInstanceUrl + '/asset/v1/content/categories';
            var connectionResult = connection.get(testUrl, authResult.data);
            
            if (connectionResult.success) {
                Write('<div style="color: green;">✅ Connection handler test successful</div>');
                logger.info('Connection handler test passed', {}, 'TestExample');
            } else {
                Write('<div style="color: orange;">⚠️ Connection handler test failed: ' + connectionResult.error.message + '</div>');
                logger.warn('Connection handler test failed', connectionResult.error, 'TestExample');
            }
        }
        
        // Test 7: Response Wrapper
        Write('<h3>7. Testing Response Wrapper</h3>');
        var response = new OmegaFrameworkResponse();
        
        var successResponse = response.success({test: 'data'}, 'TestHandler', 'testOperation');
        var errorResponse = response.error('TEST_ERROR', 'Test error message', {detail: 'test'}, 'TestHandler', 'testOperation');
        
        if (successResponse.success && !errorResponse.success) {
            Write('<div style="color: green;">✅ Response Wrapper working correctly</div>');
            logger.info('Response wrapper test passed', {}, 'TestExample');
        } else {
            Write('<div style="color: red;">❌ Response Wrapper test failed</div>');
            logger.error('Response wrapper test failed', {}, 'TestExample');
        }
        
        // Test Summary
        Write('<h3>📊 Test Summary</h3>');
        Write('<p>All core OmegaFramework components have been tested. Check the individual results above for details.</p>');
        
        // Log completion
        logger.info('OmegaFramework test suite completed', {
            timestamp: new Date().toISOString(),
            testsRun: 7
        }, 'TestExample');
        
    } catch (ex) {
        Write('<div style="color: red;">❌ Test failed with exception: ' + ex.message + '</div>');
        logger.error('Test suite failed with exception', {
            exception: ex.message,
            stack: ex.stack
        }, 'TestExample');
    }
}

// Execute tests
testOmegaFramework();

</script>

<!-- Example Usage Scenarios -->
<hr>
<h2>💡 Usage Examples</h2>

<h3>Example 1: Create and Send Email</h3>
<script runat="server">
try {
    Write('<h4>Creating and sending a test email...</h4>');
    
    var email = new EmailHandler(authConfig);
    
    // Create email
    var emailData = {
        name: 'OmegaFramework Test Email ' + new Date().getTime(),
        subject: 'Test Email from OmegaFramework',
        content: '<html><body><h1>Hello from OmegaFramework!</h1><p>This email was created using the OmegaFramework.</p></body></html>',
        preheader: 'OmegaFramework test email'
    };
    
    var createResult = email.create(emailData);
    
    if (createResult.success) {
        Write('<div style="color: green;">✅ Email created successfully with ID: ' + createResult.data.id + '</div>');
        logger.info('Test email created', {emailId: createResult.data.id}, 'ExampleUsage');
    } else {
        Write('<div style="color: red;">❌ Failed to create email: ' + createResult.error.message + '</div>');
        logger.error('Failed to create test email', createResult.error, 'ExampleUsage');
    }
    
} catch (ex) {
    Write('<div style="color: red;">Exception: ' + ex.message + '</div>');
}
</script>

<h3>Example 2: Data Extension Operations</h3>
<script runat="server">
try {
    Write('<h4>Working with Data Extensions...</h4>');
    
    var de = new DataExtensionHandler(authConfig);
    
    // Try to query a test DE (will fail if it doesn't exist, which is expected)
    var queryResult = de.query('test_de', ['Email', 'FirstName'], 'FirstName = "Test"');
    
    if (queryResult.success) {
        Write('<div style="color: green;">✅ Data Extension query successful. Records found: ' + (queryResult.data.records ? queryResult.data.records.length : 0) + '</div>');
        logger.info('DE query test passed', {recordCount: queryResult.data.records ? queryResult.data.records.length : 0}, 'ExampleUsage');
    } else {
        Write('<div style="color: orange;">⚠️ Data Extension query failed (expected if DE doesn\'t exist): ' + queryResult.error.message + '</div>');
        logger.warn('DE query test failed', queryResult.error, 'ExampleUsage');
    }
    
} catch (ex) {
    Write('<div style="color: red;">Exception: ' + ex.message + '</div>');
}
</script>

<h3>Example 3: Asset Management</h3>
<script runat="server">
try {
    Write('<h4>Managing Content Builder Assets...</h4>');
    
    var asset = new AssetHandler(authConfig);
    
    // Search for email assets
    var searchResult = asset.search('email', {pageSize: 5});
    
    if (searchResult.success) {
        Write('<div style="color: green;">✅ Asset search successful. Assets found: ' + (searchResult.data.items ? searchResult.data.items.length : 0) + '</div>');
        logger.info('Asset search test passed', {assetCount: searchResult.data.items ? searchResult.data.items.length : 0}, 'ExampleUsage');
    } else {
        Write('<div style="color: orange;">⚠️ Asset search failed: ' + searchResult.error.message + '</div>');
        logger.warn('Asset search test failed', searchResult.error, 'ExampleUsage');
    }
    
} catch (ex) {
    Write('<div style="color: red;">Exception: ' + ex.message + '</div>');
}
</script>

<style>
h2, h3, h4 { color: #0176d3; }
div { margin: 10px 0; padding: 8px; }
hr { margin: 30px 0; border: 1px solid #ccc; }
</style>