<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_BaseIntegration - Tests for BaseIntegration
 * Uses mock dependencies to test integration foundation
 *
 * @version 2.0.0
 */

</script>
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_BasicAuthStrategy")=%%
%%=ContentBlockByKey("OMG_BaseIntegration")=%%
<script runat="server">

Write('<h1>BaseIntegration Test Suite</h1>');
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

// Mock ConnectionHandler
function MockConnectionHandler() {
    var response = new ResponseWrapper();

    this.get = function(url, headers) {
        return response.success({ data: 'GET response' }, 'MockConnection', 'get');
    };

    this.post = function(url, data, headers) {
        return response.success({ data: 'POST response' }, 'MockConnection', 'post');
    };

    this.put = function(url, data, headers) {
        return response.success({ data: 'PUT response' }, 'MockConnection', 'put');
    };

    this.patch = function(url, data, headers) {
        return response.success({ data: 'PATCH response' }, 'MockConnection', 'patch');
    };

    this.remove = function(url, headers) {
        return response.success({ data: 'DELETE response' }, 'MockConnection', 'remove');
    };

    this.request = function(method, url, contentType, payload, headers) {
        return response.success({ data: 'Generic response' }, 'MockConnection', 'request');
    };
}

// Test 1: Initialization validation - missing baseUrl
Write('<h3>Test 1: Initialization Validation - Missing baseUrl</h3>');
try {
    var mockConn1 = new MockConnectionHandler();
    var integration1 = new BaseIntegration('TestIntegration', {
        // Missing baseUrl
    }, null, mockConn1);

    var validation = integration1.validateConfig();

    logTest('Should validate missing baseUrl',
        !validation.success && validation.error.code === 'VALIDATION_ERROR',
        validation.error ? validation.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate missing baseUrl', false, ex.message || ex.toString());
}

// Test 2: Successful initialization
Write('<h3>Test 2: Successful Initialization</h3>');
try {
    var mockConn2 = new MockConnectionHandler();
    var integration2 = new BaseIntegration('TestIntegration', {
        baseUrl: 'https://api.example.com'
    }, null, mockConn2);

    var validation = integration2.validateConfig();

    logTest('Should initialize with valid config',
        validation.success,
        'BaseIntegration initialized successfully');
} catch (ex) {
    logTest('Should initialize with valid config', false, ex.message || ex.toString());
}

// Test 3: Set auth strategy
Write('<h3>Test 3: Set Auth Strategy</h3>');
try {
    var mockConn3 = new MockConnectionHandler();
    var authStrategy = new BasicAuthStrategy({
        username: 'test_user',
        password: 'test_password'
    });

    var integration3 = new BaseIntegration('TestIntegration', {
        baseUrl: 'https://api.example.com'
    }, null, mockConn3);

    integration3.setAuthStrategy(authStrategy);

    logTest('Should set auth strategy successfully',
        true,
        'Auth strategy set');
} catch (ex) {
    logTest('Should set auth strategy successfully', false, ex.message || ex.toString());
}

// Test 4: Build URL - simple endpoint
Write('<h3>Test 4: Build URL - Simple Endpoint</h3>');
try {
    var mockConn4 = new MockConnectionHandler();
    var integration4 = new BaseIntegration('TestIntegration', {
        baseUrl: 'https://api.example.com'
    }, null, mockConn4);

    var url = integration4.buildUrl('/users');

    logTest('Should build URL correctly',
        url === 'https://api.example.com/users',
        'Built URL: ' + url);
} catch (ex) {
    logTest('Should build URL correctly', false, ex.message || ex.toString());
}

// Test 5: Build URL - with trailing slash
Write('<h3>Test 5: Build URL - With Trailing Slash</h3>');
try {
    var mockConn5 = new MockConnectionHandler();
    var integration5 = new BaseIntegration('TestIntegration', {
        baseUrl: 'https://api.example.com/'
    }, null, mockConn5);

    var url = integration5.buildUrl('/users');

    logTest('Should handle trailing slash',
        url === 'https://api.example.com/users',
        'Built URL: ' + url);
} catch (ex) {
    logTest('Should handle trailing slash', false, ex.message || ex.toString());
}

// Test 6: Build query string
Write('<h3>Test 6: Build Query String</h3>');
try {
    var mockConn6 = new MockConnectionHandler();
    var integration6 = new BaseIntegration('TestIntegration', {
        baseUrl: 'https://api.example.com'
    }, null, mockConn6);

    var queryString = integration6.buildQueryString({
        page: 1,
        pageSize: 50,
        filter: 'active'
    });

    logTest('Should build query string correctly',
        queryString.indexOf('page=1') > -1 && queryString.indexOf('pageSize=50') > -1,
        'Query string: ' + queryString);
} catch (ex) {
    logTest('Should build query string correctly', false, ex.message || ex.toString());
}

// Test 7: GET request
Write('<h3>Test 7: GET Request</h3>');
try {
    var mockConn7 = new MockConnectionHandler();
    var integration7 = new BaseIntegration('TestIntegration', {
        baseUrl: 'https://api.example.com'
    }, null, mockConn7);

    var result = integration7.get('/users');

    logTest('Should execute GET request successfully',
        result.success,
        result.success ? 'GET request completed' : (result.error ? result.error.message : 'Unknown error'));
} catch (ex) {
    logTest('Should execute GET request successfully', false, ex.message || ex.toString());
}

// Test 8: POST request
Write('<h3>Test 8: POST Request</h3>');
try {
    var mockConn8 = new MockConnectionHandler();
    var integration8 = new BaseIntegration('TestIntegration', {
        baseUrl: 'https://api.example.com'
    }, null, mockConn8);

    var result = integration8.post('/users', { name: 'John Doe' });

    logTest('Should execute POST request successfully',
        result.success,
        result.success ? 'POST request completed' : (result.error ? result.error.message : 'Unknown error'));
} catch (ex) {
    logTest('Should execute POST request successfully', false, ex.message || ex.toString());
}

// Test 9: PUT request
Write('<h3>Test 9: PUT Request</h3>');
try {
    var mockConn9 = new MockConnectionHandler();
    var integration9 = new BaseIntegration('TestIntegration', {
        baseUrl: 'https://api.example.com'
    }, null, mockConn9);

    var result = integration9.put('/users/1', { name: 'Jane Doe' });

    logTest('Should execute PUT request successfully',
        result.success,
        result.success ? 'PUT request completed' : (result.error ? result.error.message : 'Unknown error'));
} catch (ex) {
    logTest('Should execute PUT request successfully', false, ex.message || ex.toString());
}

// Test 10: PATCH request
Write('<h3>Test 10: PATCH Request</h3>');
try {
    var mockConn10 = new MockConnectionHandler();
    var integration10 = new BaseIntegration('TestIntegration', {
        baseUrl: 'https://api.example.com'
    }, null, mockConn10);

    var result = integration10.patch('/users/1', { status: 'active' });

    logTest('Should execute PATCH request successfully',
        result.success,
        result.success ? 'PATCH request completed' : (result.error ? result.error.message : 'Unknown error'));
} catch (ex) {
    logTest('Should execute PATCH request successfully', false, ex.message || ex.toString());
}

// Test 11: DELETE request
Write('<h3>Test 11: DELETE Request</h3>');
try {
    var mockConn11 = new MockConnectionHandler();
    var integration11 = new BaseIntegration('TestIntegration', {
        baseUrl: 'https://api.example.com'
    }, null, mockConn11);

    var result = integration11.remove('/users/1');

    logTest('Should execute DELETE request successfully',
        result.success,
        result.success ? 'DELETE request completed' : (result.error ? result.error.message : 'Unknown error'));
} catch (ex) {
    logTest('Should execute DELETE request successfully', false, ex.message || ex.toString());
}

// Test 12: GET request with query params
Write('<h3>Test 12: GET Request With Query Params</h3>');
try {
    var mockConn12 = new MockConnectionHandler();
    var integration12 = new BaseIntegration('TestIntegration', {
        baseUrl: 'https://api.example.com'
    }, null, mockConn12);

    var result = integration12.get('/users', {
        queryParams: { page: 1, pageSize: 50 }
    });

    logTest('Should execute GET with query params successfully',
        result.success,
        result.success ? 'GET with params completed' : (result.error ? result.error.message : 'Unknown error'));
} catch (ex) {
    logTest('Should execute GET with query params successfully', false, ex.message || ex.toString());
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

Write('<div style="margin-top: 20px; padding: 15px; background-color: #d1ecf1; border-left: 4px solid #0c5460;">');
Write('<strong>Info:</strong> BaseIntegration is the foundation for all external system integrations. ');
Write('These tests validate URL building, HTTP method wrappers, and auth strategy integration. ');
Write('All specific integrations (SFMC, DataCloud, Veeva, etc.) extend this base class.');
Write('</div>');

</script>
