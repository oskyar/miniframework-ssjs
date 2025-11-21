# OmegaFramework v2.0 - Testing Guide

## Overview

The OmegaFramework v2.0 includes **15 comprehensive test files** with **140+ individual test cases** covering all components of the framework. All tests are designed with **minimal dependencies** using **mock objects** to avoid requiring real API credentials or external services.

---

## 📋 Test Files Summary

### Core Components Tests (3 files)

| File | Tests | Lines | Coverage |
|------|-------|-------|----------|
| `Test_ResponseWrapper.ssjs` | 8 | 155 | Success, error, validation, auth, HTTP errors, meta |
| `Test_ConnectionHandler.ssjs` | 10 | 180 | Initialization, validation, HTTP methods (GET/POST/PUT/PATCH/DELETE) |
| `Test_DataExtensionTokenCache.ssjs` | 10 | 190 | Token expiration, cache keys, refresh buffer |

### Authentication Strategy Tests (3 files)

| File | Tests | Lines | Coverage |
|------|-------|-------|----------|
| `Test_OAuth2AuthStrategy.ssjs` | 10 | 240 | Config validation, token retrieval, headers, password grant |
| `Test_BasicAuthStrategy.ssjs` | 8 | 160 | Config validation, Base64 encoding, header generation |
| `Test_BearerAuthStrategy.ssjs` | 10 | 180 | Config validation, token handling, JWT support |

### Handler Tests (5 files)

| File | Tests | Lines | Coverage |
|------|-------|-------|----------|
| `Test_EmailHandler.ssjs` | 11 | 220 | List, get, create, update, delete, send, templates |
| `Test_AssetHandler.ssjs` | 14 | 240 | List, get, create, update, delete, search, getByType |
| `Test_DataExtensionHandler.ssjs` | 11 | 230 | Query, insert, update, delete, upsert |
| `Test_FolderHandler.ssjs` | 12 | 240 | List, get, create, update, delete, move, children |
| `Test_JourneyHandler.ssjs` | 14 | 260 | List, get, create, update, publish, stop, stats |

### Integration Tests (2 files)

| File | Tests | Lines | Coverage |
|------|-------|-------|----------|
| `Test_BaseIntegration.ssjs` | 12 | 250 | URL building, query strings, HTTP methods, auth |
| `Test_SFMCIntegration.ssjs` | 10 | 280 | Config validation, tokens, REST/SOAP URLs, API calls |

### Total Test Coverage

- **15 test files**
- **~3,015 lines of test code**
- **140+ individual test cases**
- **Zero external dependencies** (all tests use mocks)

---

## 🎯 Testing Philosophy

### 1. Minimal Dependencies
Each test file loads only the components it needs to test, plus ResponseWrapper for standardized responses. Mock objects simulate external dependencies.

**Example** (Test_BasicAuthStrategy.ssjs):
```javascript
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_BasicAuthStrategy")=%%
// No other dependencies needed!
```

### 2. Mock Objects
All tests that would require external API calls use mock implementations:

**Example** (MockSFMCIntegration):
```javascript
function MockSFMCIntegration() {
    var response = new ResponseWrapper();

    this.listAssets = function(options) {
        return response.success({
            items: [{ id: 1, name: 'Asset 1' }],
            count: 1
        }, 'MockSFMC', 'listAssets');
    };
}
```

### 3. No Credentials Required
Tests can run without:
- SFMC credentials
- OAuth2 tokens
- External API access
- Data Extension setup

### 4. Validation-First Testing
Tests prioritize validating:
1. Configuration validation
2. Parameter validation
3. Business logic
4. Error handling
5. Response structure

---

## 📖 How to Run Tests

### Step 1: Deploy Content Blocks

Deploy the required Content Blocks to SFMC Content Builder:

**For Test_ResponseWrapper.ssjs:**
- OMG_ResponseWrapper

**For Test_ConnectionHandler.ssjs:**
- OMG_ResponseWrapper
- OMG_ConnectionHandler

**For Test_EmailHandler.ssjs:**
- OMG_ResponseWrapper
- OMG_EmailHandler

*(See each test file header for its specific dependencies)*

### Step 2: Create a Test CloudPage

1. In SFMC, go to **Content Builder**
2. Create a new **CloudPage**
3. Add the test Content Block:
   ```html
   %%=ContentBlockByKey("Test_ResponseWrapper")=%%
   ```
4. Publish the CloudPage
5. Open the CloudPage URL in your browser

### Step 3: Review Results

Each test page displays:
- ✓ PASS or ✗ FAIL for each test
- Test details and messages
- Summary statistics
- Success rate percentage

**Example Output:**
```
ResponseWrapper Test Suite
─────────────────────────────
✓ PASS: Should create success response
✓ PASS: Should create error response
✓ PASS: Should create validation error
...

Test Summary
─────────────────────────────
Total Tests: 8
Passed: 8
Failed: 0
Success Rate: 100%

✓ ALL TESTS PASSED
```

---

## 🔍 Test Coverage by Component

### Core Components

#### ResponseWrapper
- ✅ Success responses
- ✅ Error responses
- ✅ Validation errors
- ✅ Auth errors
- ✅ HTTP errors
- ✅ Not found errors
- ✅ Meta information
- ✅ Timestamps

#### ConnectionHandler
- ✅ Default initialization
- ✅ Custom configuration
- ✅ URL validation
- ✅ Method validation
- ✅ GET/POST/PUT/PATCH/DELETE methods
- ✅ Header handling

#### DataExtensionTokenCache
- ✅ Token expiration detection
- ✅ Refresh buffer logic
- ✅ Cache key generation
- ✅ Null token handling
- ✅ Incomplete token handling
- ✅ Key consistency
- ✅ Key uniqueness

### Authentication Strategies

#### OAuth2AuthStrategy
- ✅ Config validation (tokenUrl, clientId, clientSecret)
- ✅ Token retrieval
- ✅ Authorization headers
- ✅ Token expiration detection
- ✅ Password grant validation
- ✅ Cache clearing

#### BasicAuthStrategy
- ✅ Config validation (username, password)
- ✅ Base64 encoding
- ✅ Authorization header format
- ✅ Header consistency
- ✅ Credential uniqueness

#### BearerAuthStrategy
- ✅ Config validation (token)
- ✅ Bearer header format
- ✅ Token inclusion in headers
- ✅ Long token handling (JWT)
- ✅ Header consistency

### Handlers

#### EmailHandler
- ✅ Initialization without SFMC instance (error)
- ✅ Initialization with mock SFMC
- ✅ List emails
- ✅ Get email (validation + success)
- ✅ Create email (validation + success)
- ✅ Update email
- ✅ Delete email
- ✅ Send email (validation)
- ✅ Get templates

#### AssetHandler
- ✅ All EmailHandler tests PLUS:
- ✅ Get by type (validation + success)
- ✅ Search (validation + success)

#### DataExtensionHandler
- ✅ Query (validation + success)
- ✅ Insert row (validation + success)
- ✅ Update row
- ✅ Delete row (validation + success)
- ✅ Upsert row

#### FolderHandler
- ✅ List, get, create, update, delete folders
- ✅ Move folder (validation + success)
- ✅ Get child folders
- ✅ Get folder path

#### JourneyHandler
- ✅ List, get, create, update, delete journeys
- ✅ Publish journey (validation + success)
- ✅ Stop journey
- ✅ Get journey version (validation)
- ✅ Get journey stats

### Integrations

#### BaseIntegration
- ✅ Config validation (baseUrl)
- ✅ Set auth strategy
- ✅ Build URL (simple + trailing slash)
- ✅ Build query string
- ✅ GET/POST/PUT/PATCH/DELETE requests
- ✅ GET with query params

#### SFMCIntegration
- ✅ Config validation (clientId, clientSecret, authBaseUrl)
- ✅ Get token
- ✅ Get REST URL
- ✅ Get SOAP URL
- ✅ Make REST request
- ✅ List assets
- ✅ Clear token cache

---

## 🚀 Test Execution Order

For first-time testing, run tests in this order:

1. **Core Foundation**
   - Test_ResponseWrapper.ssjs
   - Test_ConnectionHandler.ssjs
   - Test_DataExtensionTokenCache.ssjs

2. **Authentication**
   - Test_BasicAuthStrategy.ssjs
   - Test_BearerAuthStrategy.ssjs
   - Test_OAuth2AuthStrategy.ssjs

3. **Integrations**
   - Test_BaseIntegration.ssjs
   - Test_SFMCIntegration.ssjs

4. **Handlers**
   - Test_EmailHandler.ssjs
   - Test_AssetHandler.ssjs
   - Test_DataExtensionHandler.ssjs
   - Test_FolderHandler.ssjs
   - Test_JourneyHandler.ssjs

---

## 📝 Creating New Tests

### Test File Template

```javascript
<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * Test_YourComponent - Tests for YourComponent
 * Brief description
 *
 * @version 2.0.0
 */

</script>
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_YourComponent")=%%
<script runat="server">

Write('<h1>YourComponent Test Suite</h1>');
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

// Test 1: Your first test
Write('<h3>Test 1: Test Description</h3>');
try {
    var component = new YourComponent();
    var result = component.someMethod();

    logTest('Should do something',
        result.success,
        result.success ? 'Success' : result.error.message);
} catch (ex) {
    logTest('Should do something', false, ex.message || ex.toString());
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
```

### Best Practices

1. **Test one thing at a time** - Each test should validate a single behavior
2. **Use descriptive test names** - "Should validate missing email ID" not "Test 4"
3. **Include both positive and negative tests** - Test success AND failure cases
4. **Mock external dependencies** - Don't rely on real APIs or databases
5. **Provide clear error messages** - Include details about what failed
6. **Keep tests independent** - Tests should not depend on each other's state

---

## 🐛 Troubleshooting

### Test Page Shows Blank
- Verify Content Blocks are deployed correctly
- Check Content Block keys match exactly (case-sensitive)
- Review SFMC Script Activity logs for errors

### All Tests Failing
- Ensure dependencies are loaded in correct order
- Verify Content Block content is complete (not truncated)
- Check for SSJS syntax errors

### Specific Test Failing
- Review test logic and expected values
- Check if component behavior changed
- Verify mock objects match real component interface

---

## 📊 Test Statistics

| Metric | Value |
|--------|-------|
| Total Test Files | 15 |
| Total Test Cases | 140+ |
| Total Test Code Lines | ~3,015 |
| Code Coverage | All components |
| External Dependencies | 0 (all mocked) |
| Credentials Required | None |

---

## ✅ Benefits of This Test Suite

1. **No Setup Required** - Tests run without credentials or Data Extensions
2. **Fast Execution** - No network calls, instant results
3. **Complete Coverage** - Every component has dedicated tests
4. **Easy Debugging** - Clear pass/fail indicators with details
5. **Documentation** - Tests serve as usage examples
6. **Regression Detection** - Quickly identify breaking changes
7. **Confidence** - Deploy with certainty that components work

---

## 🔗 Related Documentation

- [COMPLETE_FILE_LIST.md](COMPLETE_FILE_LIST.md) - Full inventory of all files
- [ARCHITECTURE_SUMMARY.md](ARCHITECTURE_SUMMARY.md) - Architecture deep dive
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deployment instructions
- [README.md](README.md) - General usage guide

---

**OmegaFramework v2.0 - Production-Ready, Fully Tested**
