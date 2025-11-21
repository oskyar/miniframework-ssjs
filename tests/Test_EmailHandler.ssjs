<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_EmailHandler - Minimal dependency tests for EmailHandler
 *
 * Tests EmailHandler functionality with a mock SFMC integration
 * to avoid requiring actual SFMC credentials.
 *
 * @version 2.0.0
 */

</script>
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_EmailHandler")=%%
<script runat="server">

Write('<h1>EmailHandler Test Suite</h1>');
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
        return response.success({
            parsedContent: { id: 123, name: 'Test Email' }
        }, 'MockSFMC', 'makeRestRequest');
    };

    this.listAssets = function(options) {
        return response.success({
            items: [{ id: 1, name: 'Email 1' }, { id: 2, name: 'Email 2' }],
            count: 2
        }, 'MockSFMC', 'listAssets');
    };

    this.sendTransactionalEmail = function(key, data) {
        return response.success({ sent: true }, 'MockSFMC', 'sendTransactionalEmail');
    };
}

// Test 1: Handler initialization without SFMC instance
Write('<h3>Test 1: Initialization Without SFMC Instance</h3>');
try {
    var handler1 = new EmailHandler(null);
    var result1 = handler1.list();

    logTest('Should return error when no SFMC instance', !result1.success && result1.error.message.indexOf('required') > -1,
        result1.error ? result1.error.message : 'No error');
} catch (ex) {
    logTest('Should return error when no SFMC instance', false, ex.message || ex.toString());
}

// Test 2: Handler initialization with mock SFMC
Write('<h3>Test 2: Initialization With Mock SFMC</h3>');
try {
    var mockSFMC = new MockSFMCIntegration();
    var handler2 = new EmailHandler(mockSFMC);

    logTest('Should initialize successfully', !!handler2, 'Handler created');
} catch (ex) {
    logTest('Should initialize successfully', false, ex.message || ex.toString());
}

// Test 3: List emails
Write('<h3>Test 3: List Emails</h3>');
try {
    var mockSFMC3 = new MockSFMCIntegration();
    var handler3 = new EmailHandler(mockSFMC3);
    var result3 = handler3.list();

    logTest('Should list emails successfully', result3.success && result3.data.items,
        'Returned ' + (result3.data ? result3.data.items.length : 0) + ' emails');
} catch (ex) {
    logTest('Should list emails successfully', false, ex.message || ex.toString());
}

// Test 4: Get email - validation
Write('<h3>Test 4: Get Email - Missing ID Validation</h3>');
try {
    var mockSFMC4 = new MockSFMCIntegration();
    var handler4 = new EmailHandler(mockSFMC4);
    var result4 = handler4.get(null);

    logTest('Should validate email ID', !result4.success && result4.error.code === 'VALIDATION_ERROR',
        result4.error ? result4.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate email ID', false, ex.message || ex.toString());
}

// Test 5: Get email - success
Write('<h3>Test 5: Get Email - Success</h3>');
try {
    var mockSFMC5 = new MockSFMCIntegration();
    var handler5 = new EmailHandler(mockSFMC5);
    var result5 = handler5.get(123);

    logTest('Should get email successfully', result5.success && result5.data.parsedContent.id === 123,
        'Email ID: ' + (result5.data ? result5.data.parsedContent.id : 'N/A'));
} catch (ex) {
    logTest('Should get email successfully', false, ex.message || ex.toString());
}

// Test 6: Create email - validation
Write('<h3>Test 6: Create Email - Missing Name Validation</h3>');
try {
    var mockSFMC6 = new MockSFMCIntegration();
    var handler6 = new EmailHandler(mockSFMC6);
    var result6 = handler6.create({});

    logTest('Should validate email name', !result6.success && result6.error.code === 'VALIDATION_ERROR',
        result6.error ? result6.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate email name', false, ex.message || ex.toString());
}

// Test 7: Create email - success
Write('<h3>Test 7: Create Email - Success</h3>');
try {
    var mockSFMC7 = new MockSFMCIntegration();
    var handler7 = new EmailHandler(mockSFMC7);
    var result7 = handler7.create({ name: 'Test Email', content: 'Test' });

    logTest('Should create email successfully', result7.success,
        result7.success ? 'Email created' : result7.error.message);
} catch (ex) {
    logTest('Should create email successfully', false, ex.message || ex.toString());
}

// Test 8: Update email
Write('<h3>Test 8: Update Email</h3>');
try {
    var mockSFMC8 = new MockSFMCIntegration();
    var handler8 = new EmailHandler(mockSFMC8);
    var result8 = handler8.update(123, { name: 'Updated Email' });

    logTest('Should update email successfully', result8.success,
        result8.success ? 'Email updated' : result8.error.message);
} catch (ex) {
    logTest('Should update email successfully', false, ex.message || ex.toString());
}

// Test 9: Delete email
Write('<h3>Test 9: Delete Email</h3>');
try {
    var mockSFMC9 = new MockSFMCIntegration();
    var handler9 = new EmailHandler(mockSFMC9);
    var result9 = handler9.delete(123);

    logTest('Should delete email successfully', result9.success,
        result9.success ? 'Email deleted' : result9.error.message);
} catch (ex) {
    logTest('Should delete email successfully', false, ex.message || ex.toString());
}

// Test 10: Send email - validation
Write('<h3>Test 10: Send Email - Missing Key Validation</h3>');
try {
    var mockSFMC10 = new MockSFMCIntegration();
    var handler10 = new EmailHandler(mockSFMC10);
    var result10 = handler10.send(null, {});

    logTest('Should validate triggered send key', !result10.success && result10.error.code === 'VALIDATION_ERROR',
        result10.error ? result10.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate triggered send key', false, ex.message || ex.toString());
}

// Test 11: Get templates
Write('<h3>Test 11: Get Templates</h3>');
try {
    var mockSFMC11 = new MockSFMCIntegration();
    var handler11 = new EmailHandler(mockSFMC11);
    var result11 = handler11.getTemplates();

    logTest('Should get templates successfully', result11.success,
        result11.success ? 'Templates retrieved' : result11.error.message);
} catch (ex) {
    logTest('Should get templates successfully', false, ex.message || ex.toString());
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
