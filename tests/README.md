# OmegaFramework - Individual Module Tests

This folder contains independent test files for each module of the OmegaFramework.

## Test Files

### Basic Modules (No Authentication Required)

1. **Test_ResponseWrapper.ssjs**
   - Tests response formatting
   - Success/error/validation responses
   - No credentials needed

2. **Test_Settings.ssjs**
   - Tests configuration management
   - Get/set configuration values
   - No credentials needed

3. **Test_ConnectionHandler.ssjs**
   - Tests HTTP connection handling
   - Public API requests (httpbin.org)
   - No SFMC credentials needed

### Authenticated Modules (SFMC Credentials Required)

4. **Test_AuthHandler.ssjs**
   - Tests OAuth token management
   - Requires: Client ID, Client Secret, Auth Base URL

5. **Test_EmailHandler.ssjs**
   - Tests email/template operations
   - Requires SFMC credentials

6. **Test_DataExtensionHandler.ssjs**
   - Tests Data Extension operations
   - Requires SFMC credentials

7. **Test_AssetHandler.ssjs**
   - Tests Content Builder asset operations
   - Requires SFMC credentials

## How to Use

### Setup

1. Upload each test file as a **Content Block** in SFMC Content Builder
   - Type: Freeform Code Block
   - Name: `Test_[ModuleName]`

2. Create a **CloudPage** for each test
   - Insert the corresponding Content Block
   - Publish the page

### Running Tests

#### For modules without authentication:
1. Open the CloudPage URL
2. Tests run automatically
3. View results on the page

#### For modules with authentication:
1. Open the CloudPage URL
2. Fill in the form with your credentials:
   - Client ID
   - Client Secret
   - Auth Base URL (e.g., `https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/`)
3. Click "Run Tests"
4. View results

### Test Order Recommendation

Test in this order to verify dependencies:

1. ✅ ResponseWrapper (foundation)
2. ✅ Settings (configuration)
3. ✅ ConnectionHandler (HTTP layer)
4. ✅ AuthHandler (authentication)
5. ✅ EmailHandler (uses all above)
6. ✅ DataExtensionHandler (uses all above)
7. ✅ AssetHandler (uses all above)

## Expected Results

Each test will show:
- ✅ PASS - Test succeeded
- ❌ FAIL - Test failed
- Error messages if something goes wrong

## Notes

- Tests are **read-only** - they don't modify your SFMC data
- Each test is **independent** - no need to run all tests
- Tests use **small page sizes** (3-5 items) to avoid timeouts
- You can test with **different credentials** by refreshing the page

## Troubleshooting

### "Content Block not found" error
- Make sure all required Content Blocks are uploaded
- Check Content Block key names match exactly

### Authentication errors
- Verify credentials are correct
- Check Installed Package permissions
- Ensure Auth Base URL is correct for your instance

### Timeout errors
- SFMC has a 30-second execution limit
- Tests are designed to complete quickly
- If timeout occurs, test modules individually

## Required SFMC Permissions

Your Installed Package needs these permissions:
- Email: Read
- Web: Read
- Documents and Images: Read
- Data Extensions: Read
