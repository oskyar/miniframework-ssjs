<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_JourneyHandler - Tests for JourneyHandler
 * Uses mock SFMC integration to avoid external dependencies
 *
 * @version 2.0.0
 */

</script>
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_JourneyHandler")=%%
<script runat="server">

Write('<h1>JourneyHandler Test Suite</h1>');
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
        if (method === 'GET' && endpoint.indexOf('/interaction/v1/interactions') > -1) {
            return response.success({
                parsedContent: {
                    items: [
                        { id: 'journey-1', name: 'Journey 1', status: 'Draft' },
                        { id: 'journey-2', name: 'Journey 2', status: 'Running' }
                    ],
                    count: 2
                }
            }, 'MockSFMC', 'makeRestRequest');
        }

        if (method === 'POST') {
            return response.success({
                parsedContent: { id: 'journey-999', name: data.name, status: 'Draft' }
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

    this.getJourney = function(journeyId) {
        return response.success({
            id: journeyId,
            name: 'Test Journey',
            status: 'Draft'
        }, 'MockSFMC', 'getJourney');
    };

    this.publishJourney = function(journeyId) {
        return response.success({ published: true }, 'MockSFMC', 'publishJourney');
    };

    this.stopJourney = function(journeyId) {
        return response.success({ stopped: true }, 'MockSFMC', 'stopJourney');
    };
}

// Test 1: Initialization without SFMC instance
Write('<h3>Test 1: Initialization Without SFMC Instance</h3>');
try {
    var handler1 = new JourneyHandler(null);
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
    var handler2 = new JourneyHandler(mockSFMC);

    logTest('Should initialize successfully', !!handler2, 'Handler created');
} catch (ex) {
    logTest('Should initialize successfully', false, ex.message || ex.toString());
}

// Test 3: List journeys
Write('<h3>Test 3: List Journeys</h3>');
try {
    var mockSFMC3 = new MockSFMCIntegration();
    var handler3 = new JourneyHandler(mockSFMC3);
    var result3 = handler3.list();

    logTest('Should list journeys successfully',
        result3.success && result3.data.parsedContent.items,
        'Returned ' + (result3.data && result3.data.parsedContent ? result3.data.parsedContent.items.length : 0) + ' journeys');
} catch (ex) {
    logTest('Should list journeys successfully', false, ex.message || ex.toString());
}

// Test 4: Get journey - missing ID validation
Write('<h3>Test 4: Get Journey - Missing ID Validation</h3>');
try {
    var mockSFMC4 = new MockSFMCIntegration();
    var handler4 = new JourneyHandler(mockSFMC4);
    var result4 = handler4.get(null);

    logTest('Should validate journey ID',
        !result4.success && result4.error.code === 'VALIDATION_ERROR',
        result4.error ? result4.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate journey ID', false, ex.message || ex.toString());
}

// Test 5: Get journey - success
Write('<h3>Test 5: Get Journey - Success</h3>');
try {
    var mockSFMC5 = new MockSFMCIntegration();
    var handler5 = new JourneyHandler(mockSFMC5);
    var result5 = handler5.get('journey-123');

    logTest('Should get journey successfully',
        result5.success && result5.data.id === 'journey-123',
        'Journey ID: ' + (result5.data ? result5.data.id : 'N/A'));
} catch (ex) {
    logTest('Should get journey successfully', false, ex.message || ex.toString());
}

// Test 6: Create journey - missing name validation
Write('<h3>Test 6: Create Journey - Missing Name Validation</h3>');
try {
    var mockSFMC6 = new MockSFMCIntegration();
    var handler6 = new JourneyHandler(mockSFMC6);
    var result6 = handler6.create({});

    logTest('Should validate journey name',
        !result6.success && result6.error.code === 'VALIDATION_ERROR',
        result6.error ? result6.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate journey name', false, ex.message || ex.toString());
}

// Test 7: Create journey - success
Write('<h3>Test 7: Create Journey - Success</h3>');
try {
    var mockSFMC7 = new MockSFMCIntegration();
    var handler7 = new JourneyHandler(mockSFMC7);
    var result7 = handler7.create({ name: 'Test Journey', description: 'Test' });

    logTest('Should create journey successfully',
        result7.success && result7.data.parsedContent.id === 'journey-999',
        result7.success ? 'Journey created with ID: ' + result7.data.parsedContent.id : result7.error.message);
} catch (ex) {
    logTest('Should create journey successfully', false, ex.message || ex.toString());
}

// Test 8: Update journey
Write('<h3>Test 8: Update Journey</h3>');
try {
    var mockSFMC8 = new MockSFMCIntegration();
    var handler8 = new JourneyHandler(mockSFMC8);
    var result8 = handler8.update('journey-123', { name: 'Updated Journey' });

    logTest('Should update journey successfully',
        result8.success,
        result8.success ? 'Journey updated' : result8.error.message);
} catch (ex) {
    logTest('Should update journey successfully', false, ex.message || ex.toString());
}

// Test 9: Delete journey
Write('<h3>Test 9: Delete Journey</h3>');
try {
    var mockSFMC9 = new MockSFMCIntegration();
    var handler9 = new JourneyHandler(mockSFMC9);
    var result9 = handler9.delete('journey-123');

    logTest('Should delete journey successfully',
        result9.success,
        result9.success ? 'Journey deleted' : result9.error.message);
} catch (ex) {
    logTest('Should delete journey successfully', false, ex.message || ex.toString());
}

// Test 10: Publish journey - validation
Write('<h3>Test 10: Publish Journey - Missing ID Validation</h3>');
try {
    var mockSFMC10 = new MockSFMCIntegration();
    var handler10 = new JourneyHandler(mockSFMC10);
    var result10 = handler10.publish(null);

    logTest('Should validate journey ID',
        !result10.success && result10.error.code === 'VALIDATION_ERROR',
        result10.error ? result10.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate journey ID', false, ex.message || ex.toString());
}

// Test 11: Publish journey - success
Write('<h3>Test 11: Publish Journey - Success</h3>');
try {
    var mockSFMC11 = new MockSFMCIntegration();
    var handler11 = new JourneyHandler(mockSFMC11);
    var result11 = handler11.publish('journey-123');

    logTest('Should publish journey successfully',
        result11.success,
        result11.success ? 'Journey published' : result11.error.message);
} catch (ex) {
    logTest('Should publish journey successfully', false, ex.message || ex.toString());
}

// Test 12: Stop journey - success
Write('<h3>Test 12: Stop Journey - Success</h3>');
try {
    var mockSFMC12 = new MockSFMCIntegration();
    var handler12 = new JourneyHandler(mockSFMC12);
    var result12 = handler12.stop('journey-123');

    logTest('Should stop journey successfully',
        result12.success,
        result12.success ? 'Journey stopped' : result12.error.message);
} catch (ex) {
    logTest('Should stop journey successfully', false, ex.message || ex.toString());
}

// Test 13: Get journey version - validation
Write('<h3>Test 13: Get Journey Version - Missing Version Validation</h3>');
try {
    var mockSFMC13 = new MockSFMCIntegration();
    var handler13 = new JourneyHandler(mockSFMC13);
    var result13 = handler13.getVersion('journey-123', null);

    logTest('Should validate version number',
        !result13.success && result13.error.code === 'VALIDATION_ERROR',
        result13.error ? result13.error.message : 'No validation error');
} catch (ex) {
    logTest('Should validate version number', false, ex.message || ex.toString());
}

// Test 14: Get journey stats
Write('<h3>Test 14: Get Journey Stats</h3>');
try {
    var mockSFMC14 = new MockSFMCIntegration();
    var handler14 = new JourneyHandler(mockSFMC14);
    var result14 = handler14.getStats('journey-123');

    logTest('Should get journey stats successfully',
        result14.success,
        result14.success ? 'Stats retrieved' : result14.error.message);
} catch (ex) {
    logTest('Should get journey stats successfully', false, ex.message || ex.toString());
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
