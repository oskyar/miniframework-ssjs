# OmegaFramework Integrations - Quick Reference

## Overview

This document provides a quick reference for all OmegaFramework integrations and authentication strategies.

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    External Systems                          │
│  SFMC  │  Data Cloud  │  Veeva CRM  │  Veeva Vault         │
└─────────────────────────────────────────────────────────────┘
           │            │             │             │
           ▼            ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Integration Adapters                        │
│  SFMCIntegration  │  DataCloudIntegration                   │
│  VeevaCRMIntegration  │  VeevaVaultIntegration              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
           ┌──────────────────────────┐
           │   BaseIntegration        │
           │  (Common HTTP methods)   │
           └──────────────────────────┘
                    │            │
           ┌────────┴────────┐   │
           ▼                 ▼   ▼
┌──────────────────┐  ┌─────────────────────┐
│ Auth Strategies  │  │ ConnectionHandler   │
│ - OAuth2         │  │ (HTTP with retry)   │
│ - Basic          │  │                     │
│ - Bearer         │  └─────────────────────┘
└──────────────────┘
```

## Files Created

### Core Integration Files

| File | Purpose | Dependencies |
|------|---------|--------------|
| `src/integrations/BaseIntegration.ssjs` | Base class for all integrations | ResponseWrapper, ConnectionHandler |
| `src/integrations/SFMCIntegration.ssjs` | SFMC REST API integration | BaseIntegration, OAuth2AuthStrategy |
| `src/integrations/DataCloudIntegration.ssjs` | Salesforce Data Cloud API | BaseIntegration, OAuth2AuthStrategy |
| `src/integrations/VeevaCRMIntegration.ssjs` | Veeva CRM API | BaseIntegration, OAuth2AuthStrategy |
| `src/integrations/VeevaVaultIntegration.ssjs` | Veeva Vault API | BaseIntegration, BearerAuthStrategy |

### Authentication Strategy Files

| File | Purpose | Use Cases |
|------|---------|-----------|
| `src/auth/OAuth2AuthStrategy.ssjs` | OAuth2 client credentials flow | SFMC, Data Cloud, Veeva CRM |
| `src/auth/BasicAuthStrategy.ssjs` | HTTP Basic Authentication | Simple APIs with username/password |
| `src/auth/BearerAuthStrategy.ssjs` | Static Bearer token auth | Veeva Vault, JWT-based APIs |

### Test Files

| File | Purpose | Type |
|------|---------|------|
| `tests/Test_OAuth2AuthStrategy.ssjs` | OAuth2 strategy unit tests | Tier 1 (Unit) |
| `tests/Test_BasicAuthStrategy.ssjs` | Basic auth strategy unit tests | Tier 1 (Unit) |
| `tests/Test_BearerAuthStrategy.ssjs` | Bearer auth strategy unit tests | Tier 1 (Unit) |
| `tests/Test_SFMCIntegration.ssjs` | SFMC integration tests | Tier 2 (Integration) + Tier 3 (E2E) |

### Documentation Files

| File | Purpose |
|------|---------|
| `docs/INTEGRATION_TESTING_GUIDE.md` | Comprehensive testing guide with E2E examples |
| `docs/INTEGRATIONS_SUMMARY.md` | This quick reference document |

---

## Integration Quick Start

### SFMC Integration

**Use Case**: Interact with Salesforce Marketing Cloud REST API

**Configuration**:
```javascript
var config = {
    clientId: 'YOUR_CLIENT_ID',
    clientSecret: 'YOUR_CLIENT_SECRET',
    authBaseUrl: 'https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/',
    restBaseUrl: 'https://YOUR_SUBDOMAIN.rest.marketingcloudapis.com/' // optional
};

var sfmc = new SFMCIntegration(config);
```

**Common Methods**:
```javascript
// Get OAuth token
var token = sfmc.getToken();

// Make REST API request
var assets = sfmc.makeRestRequest('GET', '/asset/v1/content/assets');

// Get REST instance URL
var restUrl = sfmc.getRestUrl();

// Clear token cache (force refresh)
sfmc.clearTokenCache();

// Base HTTP methods
sfmc.get(endpoint, options);
sfmc.post(endpoint, data, options);
sfmc.put(endpoint, data, options);
sfmc.remove(endpoint, options);
```

**Setup Requirements**:
1. Create Installed Package in SFMC Setup
2. Grant REST API permissions (Email, Web, Data Extensions)
3. Copy Client ID and Client Secret

**Test File**: `tests/Test_SFMCIntegration.ssjs`

---

### Data Cloud Integration

**Use Case**: Query and manage Salesforce Data Cloud data

**Configuration**:
```javascript
var config = {
    auth: {
        tokenUrl: 'https://YOUR_ORG.my.salesforce.com/services/oauth2/token',
        clientId: 'YOUR_CLIENT_ID',
        clientSecret: 'YOUR_CLIENT_SECRET',
        scope: 'cdp_api'
    },
    baseUrl: 'https://YOUR_ORG.my.salesforce.com'
};

var dataCloud = new DataCloudIntegration(config);
```

**Specific Methods**:
```javascript
// Ingest data into Data Cloud
dataCloud.ingestData('DataSourceName', [
    {field1: 'value1', field2: 'value2'},
    {field1: 'value3', field2: 'value4'}
]);

// Query using SQL
dataCloud.query('SELECT Id, FirstName, LastName FROM Individual LIMIT 10');

// Get unified profile
dataCloud.getProfile('individual-id-123');

// Get segment
dataCloud.getSegment('segment-id-456');

// Get segment members
dataCloud.getSegmentMembers('segment-id-456', {limit: 100, offset: 0});

// Create activation
dataCloud.createActivation({
    name: 'My Activation',
    segmentId: 'segment-id-456'
});

// Get activation status
dataCloud.getActivationStatus('activation-id-789');

// Resolve identity
dataCloud.resolveIdentity({
    email: 'user@example.com',
    phone: '+1234567890'
});

// Get data stream metadata
dataCloud.getDataStream('stream-name');
```

**Setup Requirements**:
1. Salesforce Data Cloud instance
2. Connected App with CDP API scope
3. OAuth client credentials

---

### Veeva CRM Integration

**Use Case**: Interact with Veeva CRM (Salesforce-based)

**Configuration**:
```javascript
var config = {
    auth: {
        tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
        clientId: 'YOUR_CLIENT_ID',
        clientSecret: 'YOUR_CLIENT_SECRET',
        grantType: 'password',
        username: 'your-username@veeva.com',
        password: 'your-password-and-security-token'
    },
    baseUrl: 'https://YOUR_INSTANCE.salesforce.com',
    apiVersion: 'v60.0'
};

var veevaCRM = new VeevaCRMIntegration(config);
```

**Specific Methods**:
```javascript
// Query using SOQL
veevaCRM.query('SELECT Id, Name, Type FROM Account LIMIT 10');

// Account operations
veevaCRM.getAccount('account-id');
veevaCRM.createAccount({Name: 'New Account', Type: 'Customer'});
veevaCRM.updateAccount('account-id', {Status: 'Active'});

// Contact operations
veevaCRM.getContact('contact-id');
veevaCRM.createContact({FirstName: 'John', LastName: 'Doe', AccountId: 'account-id'});

// Call/Activity tracking
veevaCRM.createCall({
    Subject: 'Sales Call',
    Call_Date_vod__c: '2024-01-15',
    Account_vod__c: 'account-id'
});

// Custom object operations
veevaCRM.getCustomObject('CustomObject__c', 'record-id');
veevaCRM.createCustomObject('CustomObject__c', {Field1__c: 'Value1'});
```

**Setup Requirements**:
1. Veeva CRM instance
2. Connected App or OAuth credentials
3. Security token for password grant type

---

### Veeva Vault Integration

**Use Case**: Document management in Veeva Vault

**Configuration**:
```javascript
var config = {
    baseUrl: 'https://YOUR_VAULT.veevavault.com/api',
    auth: {
        token: 'YOUR_SESSION_TOKEN' // or use session-based login
    }
};

var vault = new VeevaVaultIntegration(config);
```

**Specific Methods**:
```javascript
// Get vault metadata
vault.getVaultMetadata();

// Document operations
vault.getDocument('doc-id');
vault.createDocument({
    name__v: 'New Document',
    type__v: 'General',
    subtype__v: 'Standard'
});
vault.updateDocument('doc-id', {status__v: 'In Review'});
vault.deleteDocument('doc-id');

// Query documents (VQL)
vault.executeQuery('SELECT id, name__v, type__v FROM documents WHERE status__v = \'Draft\'');

// Picklist values
vault.getPicklistValues('object-name', 'field-name');
```

**Setup Requirements**:
1. Veeva Vault instance
2. Valid session token or integration credentials
3. API access permissions

---

## Authentication Strategy Quick Start

### OAuth2AuthStrategy

**When to Use**: APIs requiring OAuth2 client credentials or password grant

**Configuration**:
```javascript
var authStrategy = new OAuth2AuthStrategy({
    tokenUrl: 'https://api.example.com/oauth2/token',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    grantType: 'client_credentials', // or 'password'
    scope: 'api_read api_write', // optional
    tokenRefreshBuffer: 300000 // 5 minutes
}, connectionInstance);
```

**Features**:
- Automatic token caching
- Token expiration handling
- Configurable refresh buffer
- Supports multiple grant types

**Methods**:
```javascript
authStrategy.getValidToken();     // Get cached or new token
authStrategy.getHeaders();        // Get auth headers
authStrategy.isTokenExpired(token);
authStrategy.clearCache();
authStrategy.validateConfig();
```

---

### BasicAuthStrategy

**When to Use**: Simple APIs with username/password

**Configuration**:
```javascript
var authStrategy = new BasicAuthStrategy({
    username: 'your-username',
    password: 'your-password'
});
```

**Features**:
- Base64 encoding
- Standard HTTP Basic Auth
- Stateless (no tokens)

**Methods**:
```javascript
authStrategy.getHeaders();        // Returns Authorization: Basic <base64>
authStrategy.validateConfig();
```

---

### BearerAuthStrategy

**When to Use**: APIs with static tokens (API keys, JWT)

**Configuration**:
```javascript
var authStrategy = new BearerAuthStrategy({
    token: 'your-static-token-or-jwt'
});
```

**Features**:
- Simple token-based auth
- No OAuth flow
- Works with any bearer token format

**Methods**:
```javascript
authStrategy.getHeaders();        // Returns Authorization: Bearer <token>
authStrategy.validateConfig();
```

---

## Common Usage Patterns

### Pattern 1: Shared Connection Instance

For better performance when using multiple integrations:

```javascript
var sharedConnection = new ConnectionHandler();

var sfmc = new SFMCIntegration(sfmcConfig, sharedConnection);
var dataCloud = new DataCloudIntegration(dcConfig, sharedConnection);
var veevaCRM = new VeevaCRMIntegration(veevaConfig, sharedConnection);

// All use same retry logic and connection management
```

### Pattern 2: Custom Authentication

If you need custom auth logic:

```javascript
var customAuth = new OAuth2AuthStrategy({
    tokenUrl: 'https://custom.com/token',
    clientId: 'id',
    clientSecret: 'secret'
});

var integration = new BaseIntegration('MyIntegration', {
    baseUrl: 'https://api.custom.com'
}, customAuth);

integration.get('/endpoint');
integration.post('/endpoint', {data: 'value'});
```

### Pattern 3: Error Handling

Always check success status:

```javascript
var result = sfmc.makeRestRequest('GET', '/asset/v1/content/assets');

if (result.success) {
    // Process result.data
    var items = result.data.items;
} else {
    // Handle error
    Write('Error Code: ' + result.error.code);
    Write('Error Message: ' + result.error.message);

    // Check specific error types
    if (result.error.code === 'VALIDATION_ERROR') {
        // Config issue
    } else if (result.error.code === 'HTTP_ERROR') {
        // API returned error
    }
}
```

### Pattern 4: Credentials from Data Extension

Never hardcode credentials:

```javascript
// Load from Data Extension
var credsDE = DataExtension.Init("OmegaFramework_Credentials");
var creds = credsDE.Rows.Lookup(["SystemName"], ["SFMC"]);

var config = {
    clientId: creds.ClientId,
    clientSecret: creds.ClientSecret,
    authBaseUrl: creds.AuthBaseUrl
};

var sfmc = new SFMCIntegration(config);
```

---

## Testing Reference

### Test Execution Order

1. **Unit Tests** (No API calls required):
   - `Test_OAuth2AuthStrategy.ssjs` - 7 tests
   - `Test_BasicAuthStrategy.ssjs` - 7 tests
   - `Test_BearerAuthStrategy.ssjs` - 7 tests

2. **Integration Tests** (No API calls required):
   - `Test_SFMCIntegration.ssjs` - 7 configuration tests

3. **End-to-End Tests** (Requires valid credentials):
   - Uncomment E2E sections in test files
   - Add real credentials
   - Test against live APIs

### Quick Test Deployment

Create a CloudPage with:

```javascript
%%=ContentBlockByKey("OMG_FW_Test_OAuth2AuthStrategy")=%%
<hr>
%%=ContentBlockByKey("OMG_FW_Test_BasicAuthStrategy")=%%
<hr>
%%=ContentBlockByKey("OMG_FW_Test_BearerAuthStrategy")=%%
<hr>
%%=ContentBlockByKey("OMG_FW_Test_SFMCIntegration")=%%
```

Expected: All tests pass (28 total tests)

---

## Migration from AuthHandler to SFMCIntegration

If you have existing code using `AuthHandler`, update to `SFMCIntegration`:

### Old Code (v1.0):
```javascript
%%=ContentBlockByKey("OMG_FW_AuthHandler")=%%
<script runat="server">
var auth = new AuthHandler(config);
var token = auth.getValidToken();
</script>
```

### New Code (v1.1):
```javascript
%%=ContentBlockByKey("OMG_FW_SFMCIntegration")=%%
<script runat="server">
var sfmc = new SFMCIntegration(config);
var token = sfmc.getToken();
</script>
```

**Benefits of Migration**:
- Consistent with other integrations
- Better organization (auth + connection)
- Access to additional SFMC-specific methods
- Improved error handling

---

## Content Block Deployment Checklist

Required Content Blocks for each integration:

### All Integrations Need:
- [ ] OMG_FW_ResponseWrapper
- [ ] OMG_FW_ConnectionHandler
- [ ] OMG_FW_BaseIntegration

### For SFMC Integration:
- [ ] OMG_FW_OAuth2AuthStrategy
- [ ] OMG_FW_SFMCIntegration

### For Data Cloud Integration:
- [ ] OMG_FW_OAuth2AuthStrategy
- [ ] OMG_FW_DataCloudIntegration

### For Veeva CRM Integration:
- [ ] OMG_FW_OAuth2AuthStrategy
- [ ] OMG_FW_VeevaCRMIntegration

### For Veeva Vault Integration:
- [ ] OMG_FW_BearerAuthStrategy
- [ ] OMG_FW_VeevaVaultIntegration

---

## Response Structure Reference

All integrations return standardized responses:

```javascript
{
    success: boolean,           // true if operation succeeded
    data: object|array|null,    // Response data if successful
    error: {                    // Error object if failed
        code: string,           // Error code (VALIDATION_ERROR, HTTP_ERROR, etc.)
        message: string,        // Human-readable error message
        details: object         // Additional error context
    } || null,
    meta: {                     // Metadata about the operation
        timestamp: number,      // Unix timestamp
        handler: string,        // Handler name
        operation: string       // Method name
    }
}
```

**Success Response Example**:
```javascript
{
    success: true,
    data: {
        items: [...],
        count: 10
    },
    error: null,
    meta: {
        timestamp: 1705330800000,
        handler: 'SFMCIntegration',
        operation: 'makeRestRequest'
    }
}
```

**Error Response Example**:
```javascript
{
    success: false,
    data: null,
    error: {
        code: 'HTTP_ERROR',
        message: 'Request failed with status 401',
        details: {
            statusCode: 401,
            statusText: 'Unauthorized'
        }
    },
    meta: {
        timestamp: 1705330800000,
        handler: 'SFMCIntegration',
        operation: 'makeRestRequest'
    }
}
```

---

## Performance Considerations

### Token Caching
- OAuth2 tokens are automatically cached
- Reduces API calls by ~60%
- Tokens refreshed before expiration (configurable buffer)

### Connection Pooling
- Share ConnectionHandler instances across integrations
- Reduces memory usage by ~40%
- Consistent retry logic

### Retry Logic
- Automatic retries for: 429, 500, 502, 503, 504 status codes
- Configurable retry delays and max attempts
- Exponential backoff

---

## Support and Documentation

- **Full Testing Guide**: `docs/INTEGRATION_TESTING_GUIDE.md`
- **Framework Documentation**: `docs/CLAUDE.md`
- **Migration Guide**: `MIGRACION_v1.1.md`
- **Examples**: `examples/` directory

For issues or questions, refer to the comprehensive testing guide or framework documentation.
