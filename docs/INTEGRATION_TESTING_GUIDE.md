# Integration Testing Guide

## Overview

This guide explains how to test the OmegaFramework integrations with external systems including Salesforce Marketing Cloud (SFMC), Veeva CRM, Veeva Vault, and Salesforce Data Cloud.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication Strategies](#authentication-strategies)
3. [Testing Approach](#testing-approach)
4. [Setup Instructions](#setup-instructions)
5. [Test Files Reference](#test-files-reference)
6. [End-to-End Testing](#end-to-end-testing)
7. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The integration architecture follows these design patterns:

### Strategy Pattern (Authentication)
Authentication is abstracted into interchangeable strategies:
- **OAuth2AuthStrategy**: Client credentials flow for SFMC, Data Cloud, Veeva CRM
- **BasicAuthStrategy**: Username/password for simple APIs
- **BearerAuthStrategy**: Static token authentication for Veeva Vault

### Adapter Pattern (Integrations)
Each external system has a dedicated integration adapter that:
- Extends `BaseIntegration` for common HTTP functionality
- Configures appropriate authentication strategy
- Provides platform-specific methods

```
BaseIntegration (foundation)
├── SFMCIntegration (SFMC REST API)
├── DataCloudIntegration (Data Cloud API)
├── VeevaCRMIntegration (Veeva CRM API)
└── VeevaVaultIntegration (Veeva Vault API)
```

### Dependency Injection
All integrations use dependency injection for:
- **ConnectionHandler**: Shared HTTP request handler with retry logic
- **AuthStrategy**: Pluggable authentication method

---

## Authentication Strategies

### OAuth2AuthStrategy

**Use Cases**: SFMC, Data Cloud, Veeva CRM (with username/password grant)

**Configuration**:
```javascript
var authStrategy = new OAuth2AuthStrategy({
    tokenUrl: 'https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/v2/token',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    grantType: 'client_credentials', // or 'password'
    scope: 'email_read email_write', // optional
    additionalParams: {  // optional, for password grant
        username: 'your-username',
        password: 'your-password'
    },
    tokenRefreshBuffer: 300000 // 5 minutes in milliseconds
});
```

**Features**:
- Token caching (avoids unnecessary API calls)
- Automatic token refresh based on expiration
- Configurable refresh buffer
- Supports multiple grant types

**Testing**: See `tests/Test_OAuth2AuthStrategy.ssjs`

---

### BasicAuthStrategy

**Use Cases**: Simple APIs requiring HTTP Basic Authentication

**Configuration**:
```javascript
var authStrategy = new BasicAuthStrategy({
    username: 'your-username',
    password: 'your-password'
});
```

**Features**:
- Base64 encoding of credentials
- Standard HTTP Basic Auth header generation
- No token management (stateless)

**Testing**: See `tests/Test_BasicAuthStrategy.ssjs`

---

### BearerAuthStrategy

**Use Cases**: Veeva Vault, APIs with static tokens

**Configuration**:
```javascript
var authStrategy = new BearerAuthStrategy({
    token: 'your-static-bearer-token'
});
```

**Features**:
- Simple token-based authentication
- No OAuth flow required
- Works with JWT or simple tokens

**Testing**: See `tests/Test_BearerAuthStrategy.ssjs`

---

## Testing Approach

### 3-Tier Testing Strategy

#### Tier 1: Unit Tests (Auth Strategies)
Test authentication strategies in isolation:
- Configuration validation
- Header generation
- Token expiration logic (OAuth2)
- Base64 encoding (Basic Auth)

**No API calls required** - these tests validate logic only.

#### Tier 2: Integration Tests (Configuration)
Test integration classes with mock configurations:
- Instance creation
- Method availability
- Configuration validation
- Error handling

**No API calls required** - validates structure and basic functionality.

#### Tier 3: End-to-End Tests (Live API)
Test against real APIs with valid credentials:
- Authentication flows
- API requests and responses
- Error handling with real errors
- Rate limiting and retries

**Requires valid credentials** - tests actual API connectivity.

---

## Setup Instructions

### 1. Deploy Content Blocks to SFMC

All integration files must be deployed as Content Blocks in SFMC Content Builder.

**Required Content Blocks**:

| Content Block Key | File Path | Purpose |
|------------------|-----------|---------|
| `OMG_FW_ResponseWrapper` | `src/ResponseWrapper.ssjs` | Standardized responses |
| `OMG_FW_ConnectionHandler` | `src/ConnectionHandler.ssjs` | HTTP request handling |
| `OMG_FW_BaseIntegration` | `src/integrations/BaseIntegration.ssjs` | Base integration class |
| `OMG_FW_OAuth2AuthStrategy` | `src/auth/OAuth2AuthStrategy.ssjs` | OAuth2 authentication |
| `OMG_FW_BasicAuthStrategy` | `src/auth/BasicAuthStrategy.ssjs` | Basic authentication |
| `OMG_FW_BearerAuthStrategy` | `src/auth/BearerAuthStrategy.ssjs` | Bearer token auth |
| `OMG_FW_SFMCIntegration` | `src/integrations/SFMCIntegration.ssjs` | SFMC REST API |
| `OMG_FW_DataCloudIntegration` | `src/integrations/DataCloudIntegration.ssjs` | Data Cloud API |
| `OMG_FW_VeevaCRMIntegration` | `src/integrations/VeevaCRMIntegration.ssjs` | Veeva CRM API |
| `OMG_FW_VeevaVaultIntegration` | `src/integrations/VeevaVaultIntegration.ssjs` | Veeva Vault API |

**Deployment Options**:
1. **Manual**: Copy each file into Content Builder as Content Block
2. **Automated**: Use `install/GitInstaller.html` or `install/EnhancedInstaller.html`

### 2. Create CloudPage for Testing

1. In SFMC Content Builder, create a new **CloudPage**
2. Load required test file content blocks
3. Access the CloudPage URL in your browser

**Example CloudPage Structure**:
```javascript
%%=ContentBlockByKey("OMG_FW_Test_OAuth2AuthStrategy")=%%
```

---

## Test Files Reference

### Authentication Strategy Tests

#### Test_OAuth2AuthStrategy.ssjs
**Location**: `tests/Test_OAuth2AuthStrategy.ssjs`

**Tests**:
- ✓ Validation: Missing token URL
- ✓ Validation: Missing client ID
- ✓ Validation: Missing client secret
- ✓ Valid configuration acceptance
- ✓ Token expiration detection
- ✓ Token validity check
- ✓ Cache clearing

**Expected Result**: 7/7 tests pass without API calls

**How to Run**:
1. Create CloudPage in SFMC
2. Add: `%%=ContentBlockByKey("OMG_FW_Test_OAuth2AuthStrategy")=%%`
3. Open CloudPage URL

---

#### Test_BasicAuthStrategy.ssjs
**Location**: `tests/Test_BasicAuthStrategy.ssjs`

**Tests**:
- ✓ Validation: Missing username
- ✓ Validation: Missing password
- ✓ Valid configuration acceptance
- ✓ Header generation
- ✓ Content-Type header inclusion
- ✓ Failure without valid config
- ✓ Base64 encoding verification

**Expected Result**: 7/7 tests pass without API calls

**How to Run**:
1. Create CloudPage in SFMC
2. Add: `%%=ContentBlockByKey("OMG_FW_Test_BasicAuthStrategy")=%%`
3. Open CloudPage URL

---

#### Test_BearerAuthStrategy.ssjs
**Location**: `tests/Test_BearerAuthStrategy.ssjs`

**Tests**:
- ✓ Validation: Missing token
- ✓ Valid configuration with token
- ✓ Header generation
- ✓ Content-Type header inclusion
- ✓ Failure without token
- ✓ JWT token format handling
- ✓ Simple token format handling

**Expected Result**: 7/7 tests pass without API calls

**How to Run**:
1. Create CloudPage in SFMC
2. Add: `%%=ContentBlockByKey("OMG_FW_Test_BearerAuthStrategy")=%%`
3. Open CloudPage URL

---

### Integration Tests

#### Test_SFMCIntegration.ssjs
**Location**: `tests/Test_SFMCIntegration.ssjs`

**Tier 2 Tests (Configuration Only)**:
- ✓ Missing authBaseUrl validation
- ✓ Missing clientId validation
- ✓ Valid configuration structure
- ✓ Token expired status check
- ✓ Clear token cache
- ✓ REST URL retrieval
- ✓ SOAP URL retrieval

**Expected Result**: 7/7 configuration tests pass

**Tier 3 Tests (E2E - Commented)**:
The file includes commented examples for end-to-end testing with real credentials.

**How to Run Tier 2**:
1. Create CloudPage in SFMC
2. Add: `%%=ContentBlockByKey("OMG_FW_Test_SFMCIntegration")=%%`
3. Open CloudPage URL

**How to Run Tier 3** (End-to-End):
1. In SFMC Setup, create an Installed Package with REST API permissions
2. Copy your Client ID and Client Secret
3. Edit the test file and uncomment the E2E test section
4. Replace placeholder credentials with real values:
```javascript
var realConfig = {
    clientId: "YOUR_REAL_CLIENT_ID",
    clientSecret: "YOUR_REAL_CLIENT_SECRET",
    authBaseUrl: "https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/"
};
```
5. Deploy updated test file to SFMC
6. Open CloudPage URL

---

## End-to-End Testing

### SFMC Integration E2E Test

**Prerequisites**:
- SFMC account with Admin access
- Installed Package with REST API permissions
- Client ID and Client Secret

**Step-by-Step**:

1. **Create Installed Package** (if not exists):
   - Setup → Platform Tools → Apps → Installed Packages
   - Click "New"
   - Name: "OmegaFramework Integration"
   - Add Component: API Integration
   - Set Server-to-Server integration type
   - Grant permissions: Email (Read, Write), Web (Read, Write), Data Extensions (Read, Write)
   - Save and copy Client ID and Client Secret

2. **Create Test CloudPage**:
```javascript
%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_FW_BaseIntegration")=%%
%%=ContentBlockByKey("OMG_FW_OAuth2AuthStrategy")=%%
%%=ContentBlockByKey("OMG_FW_SFMCIntegration")=%%
<script runat="server">
Platform.Load("core", "1.1.1");

var config = {
    clientId: "YOUR_CLIENT_ID",
    clientSecret: "YOUR_CLIENT_SECRET",
    authBaseUrl: "https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/"
};

var sfmc = new SFMCIntegration(config);

// Test 1: Get OAuth Token
Write('<h3>Test 1: Get OAuth Token</h3>');
var tokenResult = sfmc.getToken();
Write('<pre>' + Stringify(tokenResult) + '</pre>');

// Test 2: Make REST API Request (List Assets)
Write('<h3>Test 2: List Content Builder Assets</h3>');
var assetsResult = sfmc.makeRestRequest('GET', '/asset/v1/content/assets?$pageSize=5');
Write('<pre>' + Stringify(assetsResult) + '</pre>');

// Test 3: Get REST URL
Write('<h3>Test 3: Get REST Instance URL</h3>');
var restUrl = sfmc.getRestUrl();
Write('<p>REST URL: ' + restUrl + '</p>');
</script>
```

3. **Expected Results**:
   - Test 1: Returns `success: true` with access_token
   - Test 2: Returns `success: true` with list of assets
   - Test 3: Returns your SFMC REST instance URL

---

### Data Cloud Integration E2E Test

**Prerequisites**:
- Salesforce Data Cloud instance
- Connected App with OAuth credentials
- Data Cloud API access

**Example Test**:
```javascript
var config = {
    auth: {
        tokenUrl: 'https://YOUR_ORG.my.salesforce.com/services/oauth2/token',
        clientId: 'YOUR_CONNECTED_APP_CLIENT_ID',
        clientSecret: 'YOUR_CONNECTED_APP_SECRET',
        scope: 'cdp_api'
    },
    baseUrl: 'https://YOUR_ORG.my.salesforce.com'
};

var dc = new DataCloudIntegration(config);

// Test SQL Query
var queryResult = dc.query('SELECT Id, FirstName, LastName FROM Individual LIMIT 10');
Write(Stringify(queryResult));

// Test Profile Lookup
var profileResult = dc.getProfile('INDIVIDUAL_ID_HERE');
Write(Stringify(profileResult));
```

---

### Veeva Vault Integration E2E Test

**Prerequisites**:
- Veeva Vault instance
- Valid session token or integration credentials

**Example Test**:
```javascript
var config = {
    baseUrl: 'https://YOUR_VAULT.veevavault.com/api',
    auth: {
        token: 'YOUR_SESSION_TOKEN'
    }
};

var vault = new VeevaVaultIntegration(config);

// Test: Get Vault Metadata
var metadataResult = vault.getVaultMetadata();
Write(Stringify(metadataResult));

// Test: Query Documents
var queryResult = vault.executeQuery('SELECT id, name__v, type__v FROM documents WHERE status__v = \'Draft\'');
Write(Stringify(queryResult));
```

---

### Veeva CRM Integration E2E Test

**Prerequisites**:
- Veeva CRM instance (Salesforce-based)
- OAuth credentials or session ID

**Example Test**:
```javascript
var config = {
    auth: {
        tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
        clientId: 'YOUR_CLIENT_ID',
        clientSecret: 'YOUR_CLIENT_SECRET',
        grantType: 'password',
        username: 'your-username@veeva.com',
        password: 'your-password-with-security-token'
    },
    baseUrl: 'https://YOUR_INSTANCE.salesforce.com',
    apiVersion: 'v60.0'
};

var crm = new VeevaCRMIntegration(config);

// Test: Query Accounts
var accountsResult = crm.query('SELECT Id, Name FROM Account LIMIT 10');
Write(Stringify(accountsResult));

// Test: Get Account
var accountResult = crm.getAccount('ACCOUNT_ID_HERE');
Write(Stringify(accountResult));
```

---

## Troubleshooting

### Common Issues

#### Issue 1: "Unable to retrieve security descriptor for this frame"

**Cause**: Using incompatible JavaScript methods in SSJS (e.g., `toISOString()`, `Array.isArray()`)

**Solution**: All framework code uses SSJS-compatible methods. If you encounter this:
- Check custom code for modern JavaScript features
- Use `new Date().getTime()` instead of `toISOString()`
- Use custom `isArray()` helper instead of `Array.isArray()`

---

#### Issue 2: "VALIDATION_ERROR: Missing required configuration"

**Cause**: Integration or auth strategy initialized without required parameters

**Solution**: Check configuration object includes all required fields:
- OAuth2: `tokenUrl`, `clientId`, `clientSecret`
- Basic Auth: `username`, `password`
- Bearer: `token`
- All integrations: `baseUrl`

---

#### Issue 3: "NO_AUTH_STRATEGY: No authentication strategy configured"

**Cause**: Integration doesn't have auth strategy set

**Solution**: Ensure your integration config includes auth credentials. For SFMC:
```javascript
var config = {
    clientId: '...',
    clientSecret: '...',
    authBaseUrl: '...'  // This triggers OAuth2 setup
};
```

---

#### Issue 4: 401 Unauthorized from API

**Cause**: Invalid credentials or expired token

**Solutions**:
1. Verify credentials are correct
2. Check token hasn't expired (for Bearer tokens)
3. Clear token cache: `integration.clearTokenCache()`
4. Verify API permissions in Installed Package
5. Check OAuth scope matches required permissions

---

#### Issue 5: 429 Too Many Requests

**Cause**: API rate limiting

**Solution**: ConnectionHandler includes automatic retry logic. If persistent:
- Reduce request frequency
- Implement request batching
- Check API rate limits documentation

---

#### Issue 6: Content Block not found

**Cause**: Integration files not deployed to SFMC

**Solution**:
1. Verify all required Content Blocks exist in Content Builder
2. Check Content Block keys match exactly (case-sensitive)
3. Use `install/GitInstaller.html` for automated deployment

---

### Debug Mode

To enable detailed logging for troubleshooting:

```javascript
var sfmc = new SFMCIntegration(config);

// Make request
var result = sfmc.makeRestRequest('GET', '/asset/v1/content/assets');

// Log full response details
Write('<h3>Debug Output</h3>');
Write('<pre>');
Write('Success: ' + result.success + '\n');
Write('Error Code: ' + (result.error ? result.error.code : 'N/A') + '\n');
Write('Error Message: ' + (result.error ? result.error.message : 'N/A') + '\n');
Write('Response Data: ' + Stringify(result.data) + '\n');
Write('Meta: ' + Stringify(result.meta));
Write('</pre>');
```

---

## Best Practices

### 1. Credential Management

**Never hardcode credentials** in production code:

```javascript
// ❌ BAD - Hardcoded credentials
var config = {
    clientId: 'abc123',
    clientSecret: 'secret456'
};

// ✅ GOOD - Load from Data Extension
var credsDE = DataExtension.Init("OMG_Credentials");
var creds = credsDE.Rows.Lookup(["Key"], ["SFMC_OAuth"]);

var config = {
    clientId: creds.ClientId,
    clientSecret: creds.ClientSecret,
    authBaseUrl: creds.AuthBaseUrl
};
```

### 2. Error Handling

Always check `result.success` before using data:

```javascript
var result = sfmc.makeRestRequest('GET', '/asset/v1/content/assets');

if (result.success) {
    // Process result.data
    var assets = result.data.items;
    for (var i = 0; i < assets.length; i++) {
        Write(assets[i].name);
    }
} else {
    // Handle error
    Write('Error: ' + result.error.message);
    Write('Code: ' + result.error.code);
}
```

### 3. Token Caching

OAuth2 tokens are automatically cached. Don't manually manage tokens unless necessary:

```javascript
// ✅ GOOD - Automatic token management
var sfmc = new SFMCIntegration(config);
var result1 = sfmc.makeRestRequest('GET', '/endpoint1'); // Gets token
var result2 = sfmc.makeRestRequest('GET', '/endpoint2'); // Reuses cached token

// Only clear cache if you need to force refresh:
// sfmc.clearTokenCache();
```

### 4. Connection Instance Sharing

Share ConnectionHandler instance across integrations for better performance:

```javascript
var sharedConnection = new ConnectionHandler();

var sfmc = new SFMCIntegration(sfmcConfig, sharedConnection);
var dataCloud = new DataCloudIntegration(dcConfig, sharedConnection);
var veeva = new VeevaCRMIntegration(veevaConfig, sharedConnection);

// All integrations use same retry logic and connection management
```

---

## Additional Resources

- **SFMC REST API Documentation**: https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/mc-apis.html
- **Data Cloud API Documentation**: https://developer.salesforce.com/docs/atlas.en-us.c360a_api.meta/c360a_api/
- **Veeva Vault API Documentation**: https://developer.veeva.com/api/vault-api/
- **Veeva CRM API Documentation**: https://developer.veeva.com/api/crm-api/
- **SSJS Documentation**: Official Salesforce Marketing Cloud SSJS reference

---

## Summary

This testing guide provides a comprehensive approach to validating OmegaFramework integrations:

1. **Unit tests** validate authentication strategies without API calls
2. **Integration tests** validate configuration and structure
3. **End-to-end tests** validate actual API connectivity with real credentials

Follow the tier-by-tier approach to systematically validate each component before deploying to production.
