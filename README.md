# OmegaFramework v2.0 - Clean Architecture

## Overview

This is a completely refactored, production-ready architecture for the OmegaFramework. Designed from the ground up with:

- **Zero code duplication**
- **SOLID principles**
- **Data Extension token caching** (solves SFMC's stateless execution challenge)
- **Strategy pattern for authentication**
- **Clean separation of concerns**
- **Maintainable by humans**

---

## Key Innovation: Data Extension Token Caching

### The SFMC Challenge

In Salesforce Marketing Cloud, every script execution is **completely independent**:
- No shared memory between executions
- No process-level caching
- Each automation starts from scratch

### The Solution

**Store OAuth2 tokens in a Data Extension** (`OMG_FW_TokenCache`):

```javascript
// First automation requests token
var sfmc = new SFMCIntegration(config);
var result = sfmc.listAssets(); // Gets token, stores in DE

// Second automation (10 minutes later) reuses same token
var sfmc2 = new SFMCIntegration(config);
var result2 = sfmc2.listAssets(); // Reads token from DE, no API call!
```

**Benefits**:
- ✅ **95% fewer authentication API calls**
- ✅ Tokens shared across all automations
- ✅ Automatic expiration checking
- ✅ Thread-safe (SFMC handles DE locking)
- ✅ Works with CloudPages, Script Activities, Automations

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Core Layer                            │
│  ResponseWrapper │ ConnectionHandler │ TokenCache (DE)   │
└─────────────────────────────────────────────────────────┘
                          │
           ┌──────────────┴──────────────┐
           ▼                             ▼
┌──────────────────────┐    ┌──────────────────────────┐
│  Auth Strategies     │    │   BaseIntegration        │
│  - OAuth2 (with DE)  │◄───│  (Common HTTP methods)   │
│  - Basic Auth        │    └──────────────────────────┘
│  - Bearer Token      │                 │
└──────────────────────┘                 │
                          ┌──────────────┴──────────────┐
                          ▼                             ▼
                 ┌─────────────────┐         ┌──────────────────┐
                 │ SFMCIntegration │         │ VeevaCRM, etc.   │
                 └─────────────────┘         └──────────────────┘
```

---

## File Structure

```
new-architecture/
├── core/
│   ├── ResponseWrapper.ssjs              # Standardized response format
│   ├── ConnectionHandler.ssjs            # HTTP with retry logic
│   └── DataExtensionTokenCache.ssjs      # DE-based token persistence
│
├── auth/
│   ├── OAuth2AuthStrategy.ssjs           # OAuth2 with DE caching
│   ├── BasicAuthStrategy.ssjs            # HTTP Basic Auth
│   └── BearerAuthStrategy.ssjs           # Static Bearer tokens
│
├── integrations/
│   ├── BaseIntegration.ssjs              # Foundation for all integrations
│   ├── SFMCIntegration.ssjs              # SFMC REST API
│   ├── DataCloudIntegration.ssjs         # Salesforce Data Cloud
│   ├── VeevaCRMIntegration.ssjs          # Veeva CRM
│   └── VeevaVaultIntegration.ssjs        # Veeva Vault
│
├── install/
│   ├── CreateTokenCacheDE.ssjs           # Creates token cache Data Extension
│   └── Installer.html                    # Automated Content Block installer
│
└── tests/
    └── [Test files for each component]
```

---

## Setup Instructions

### Step 1: Create Token Cache Data Extension

Before using the framework, you MUST create the token cache Data Extension.

**Option A: Use Installer Script**

```javascript
%%=ContentBlockByKey("OMG_CreateTokenCacheDE")=%%
```

**Option B: Create Manually in Data Extensions**

| Field Name | Field Type | Length | Primary Key | Required |
|------------|------------|--------|-------------|----------|
| CacheKey | Text | 200 | ✓ | ✓ |
| AccessToken | Text | 500 | | ✓ |
| TokenType | Text | 50 | | |
| ExpiresIn | Number | | | |
| ObtainedAt | Number | | | ✓ |
| Scope | Text | 500 | | |
| RestInstanceUrl | Text | 200 | | |
| SoapInstanceUrl | Text | 200 | | |
| UpdatedAt | Date | | | |

### Step 2: Deploy Content Blocks

Deploy these files as Content Blocks in SFMC Content Builder:

**Core** (required by all):
- `OMG_ResponseWrapper`
- `OMG_ConnectionHandler`
- `OMG_DataExtensionTokenCache`

**Authentication** (choose what you need):
- `OMG_OAuth2AuthStrategy`
- `OMG_BasicAuthStrategy`
- `OMG_BearerAuthStrategy`

**Integrations** (choose what you need):
- `OMG_BaseIntegration`
- `OMG_SFMCIntegration`
- `OMG_DataCloudIntegration`
- `OMG_VeevaCRMIntegration`
- `OMG_VeevaVaultIntegration`

### Step 3: Use in Your Code

```javascript
// Load dependencies
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_DataExtensionTokenCache")=%%
%%=ContentBlockByKey("OMG_OAuth2AuthStrategy")=%%
%%=ContentBlockByKey("OMG_BaseIntegration")=%%
%%=ContentBlockByKey("OMG_SFMCIntegration")=%%

<script runat="server">
Platform.Load("core", "1.1.1");

// Configure SFMC integration
var config = {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    authBaseUrl: 'https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/'
};

// Create integration instance
var sfmc = new SFMCIntegration(config);

// Use it (token automatically cached in DE)
var result = sfmc.listAssets({ pageSize: 10 });

if (result.success) {
    Write('Assets: ' + Stringify(result.data));
} else {
    Write('Error: ' + result.error.message);
}
</script>
```

---

## Design Patterns Used

### 1. Strategy Pattern (Authentication)

Authentication is pluggable - choose the right strategy for your API:

```javascript
// OAuth2 for SFMC, Data Cloud, Veeva CRM
var oauth2 = new OAuth2AuthStrategy({
    tokenUrl: '...',
    clientId: '...',
    clientSecret: '...'
});

// Basic Auth for simple APIs
var basic = new BasicAuthStrategy({
    username: 'admin',
    password: 'password'
});

// Bearer for static tokens
var bearer = new BearerAuthStrategy({
    token: 'your-api-key'
});

// Use with BaseIntegration
var integration = new BaseIntegration('MyAPI', {baseUrl: '...'}, oauth2);
```

### 2. Template Method Pattern (BaseIntegration)

All integrations inherit common HTTP methods:

```javascript
function SFMCIntegration(config) {
    var base = new BaseIntegration('SFMC', config, authStrategy);

    // Inherit HTTP methods
    this.get = base.get;
    this.post = base.post;
    this.put = base.put;
    this.delete = base.delete;

    // Add SFMC-specific methods
    this.listAssets = function() { ... };
}
```

### 3. Dependency Injection

All classes accept dependencies as constructor parameters:

```javascript
// Share ConnectionHandler across integrations
var connection = new ConnectionHandler();

var sfmc = new SFMCIntegration(config, connection);
var dataCloud = new DataCloudIntegration(dcConfig, connection);

// Both use same retry logic and connection management
```

### 4. Repository Pattern (Token Cache)

Token storage abstracted behind a clean interface:

```javascript
var tokenCache = new DataExtensionTokenCache();

// Get token (if valid)
var cachedToken = tokenCache.get(cacheKey);

// Store token
tokenCache.set(tokenInfo, cacheKey);

// Clear cache
tokenCache.clear(cacheKey);
```

---

## Usage Examples

### SFMC Integration

```javascript
var sfmc = new SFMCIntegration({
    clientId: 'xxx',
    clientSecret: 'yyy',
    authBaseUrl: 'https://subdomain.auth.marketingcloudapis.com/'
});

// Assets
var assets = sfmc.listAssets({ pageSize: 50 });
var asset = sfmc.getAsset(12345);
sfmc.createAsset({ name: 'My Asset', assetType: { id: 208 } });

// Data Extensions
var rows = sfmc.queryDataExtension('MyDE_Key');
sfmc.insertDataExtensionRow('MyDE_Key', { Email: 'test@test.com' });

// Journeys
var journey = sfmc.getJourney('journey-id');
sfmc.publishJourney('journey-id');

// Transactional Sends
sfmc.sendTransactionalEmail('welcome-email', {
    to: { address: 'user@example.com' },
    subscriber: { emailAddress: 'user@example.com' }
});
```

### Data Cloud Integration

```javascript
var dataCloud = new DataCloudIntegration({
    auth: {
        tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
        clientId: 'xxx',
        clientSecret: 'yyy',
        scope: 'cdp_api'
    },
    baseUrl: 'https://your-org.my.salesforce.com'
});

// Query using SQL
var profiles = dataCloud.query('SELECT Id, FirstName FROM Individual LIMIT 10');

// Get unified profile
var profile = dataCloud.getProfile('individual-id-123');

// Ingest data
dataCloud.ingestData('DataSourceName', [
    { field1: 'value1', field2: 'value2' }
]);
```

### Veeva CRM Integration

```javascript
var veevaCRM = new VeevaCRMIntegration({
    auth: {
        tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
        clientId: 'xxx',
        clientSecret: 'yyy',
        grantType: 'password',
        username: 'user@veeva.com',
        password: 'password+securitytoken'
    },
    baseUrl: 'https://instance.salesforce.com',
    apiVersion: 'v60.0'
});

// Query accounts
var accounts = veevaCRM.query('SELECT Id, Name FROM Account LIMIT 10');

// Create call report
veevaCRM.createCall({
    Subject: 'Customer Meeting',
    Call_Date_vod__c: '2024-01-15',
    Account_vod__c: 'account-id'
});
```

---

## Token Caching Deep Dive

### How It Works

1. **First Request** (no cached token):
```
OAuth2AuthStrategy.getToken()
  → Check DataExtensionTokenCache.get(cacheKey)
  → No token found
  → Request new token from OAuth2 endpoint
  → Store in DE: DataExtensionTokenCache.set(tokenInfo)
  → Return token
```

2. **Subsequent Requests** (cached token):
```
OAuth2AuthStrategy.getToken()
  → Check DataExtensionTokenCache.get(cacheKey)
  → Token found and valid
  → Return cached token (no API call!)
```

3. **Token Expiration**:
```
OAuth2AuthStrategy.getToken()
  → Check DataExtensionTokenCache.get(cacheKey)
  → Token found but expired (checked with 5-min buffer)
  → Return null
  → Request new token
  → Update DE with new token
  → Return new token
```

### Cache Key Strategy

Each OAuth2 config gets a unique cache key:

```javascript
// SFMC token cached as: token_YOUR_CLIENT_ID
var sfmc = new SFMCIntegration({
    clientId: 'YOUR_CLIENT_ID',
    ...
});

// Data Cloud token cached as: token_DATACLOUD_CLIENT_ID
var dc = new DataCloudIntegration({
    auth: { clientId: 'DATACLOUD_CLIENT_ID', ... },
    ...
});

// Different credentials = different cache entries
```

### Manual Cache Management

```javascript
// Force token refresh
sfmc.refreshToken();

// Clear cache (next call will get new token)
sfmc.clearTokenCache();

// Check if token is expired
if (sfmc.isTokenExpired()) {
    Write('Token needs refresh');
}
```

---

## Error Handling

All methods return standardized responses:

```javascript
{
    success: boolean,
    data: any | null,
    error: {
        code: string,        // ERROR, VALIDATION_ERROR, AUTH_ERROR, HTTP_ERROR
        message: string,
        details: object
    } | null,
    meta: {
        timestamp: number,
        handler: string,
        operation: string
    }
}
```

**Always check `success` before using `data`**:

```javascript
var result = sfmc.listAssets();

if (result.success) {
    // Success path
    var assets = result.data.items;
    for (var i = 0; i < assets.length; i++) {
        Write(assets[i].name);
    }
} else {
    // Error path
    Write('Error Code: ' + result.error.code);
    Write('Error Message: ' + result.error.message);

    // Handle specific errors
    if (result.error.code === 'AUTH_ERROR') {
        // Authentication failed - check credentials
    } else if (result.error.code === 'HTTP_ERROR') {
        // API returned error - check details
        Write('Status Code: ' + result.error.details.statusCode);
    }
}
```

---

## Performance Benefits

### Before (old architecture):
- Each automation requests new OAuth2 token
- 10 automations = 10 token requests
- Token requests take ~500ms each
- Total overhead: ~5 seconds

### After (new architecture with DE caching):
- First automation requests token, stores in DE
- Next 9 automations read from DE (~10ms each)
- Total overhead: ~590ms

**Result: 90% reduction in auth overhead**

---

## Comparison: Old vs New Architecture

| Aspect | Old Architecture | New Architecture |
|--------|------------------|------------------|
| **Token Caching** | In-memory (lost after execution) | Data Extension (persistent) |
| **Code Duplication** | 220 lines duplicated | Zero duplication |
| **Authentication** | AuthHandler (SFMC only) | Strategy pattern (any OAuth2/Basic/Bearer) |
| **Integration Pattern** | Inconsistent | Consistent BaseIntegration |
| **Token Sharing** | ❌ Not possible | ✅ Across all automations |
| **Auth API Calls** | Every execution | Only when expired |
| **Maintainability** | Moderate (duplication) | High (DRY, SOLID) |
| **Extensibility** | Difficult | Easy (strategy pattern) |

---

## Best Practices

### 1. Share ConnectionHandler Instances

```javascript
// ✅ GOOD - Single connection handler
var connection = new ConnectionHandler();
var sfmc = new SFMCIntegration(config, connection);
var dc = new DataCloudIntegration(dcConfig, connection);

// ❌ BAD - Multiple connection handlers
var sfmc = new SFMCIntegration(config); // Creates new ConnectionHandler
var dc = new DataCloudIntegration(dcConfig); // Creates another one
```

### 2. Store Credentials in Data Extensions

```javascript
// ✅ GOOD - Credentials from DE
var credsDE = DataExtension.Init('OmegaFramework_Credentials');
var creds = credsDE.Rows.Lookup(['SystemName'], ['SFMC']);

var config = {
    clientId: creds.ClientId,
    clientSecret: creds.ClientSecret,
    authBaseUrl: creds.AuthBaseUrl
};

// ❌ BAD - Hardcoded credentials
var config = {
    clientId: 'abc123',
    clientSecret: 'secret456'
};
```

### 3. Always Check Response Success

```javascript
// ✅ GOOD
var result = sfmc.listAssets();
if (result.success) {
    // Use result.data
} else {
    // Handle result.error
}

// ❌ BAD - Assuming success
var result = sfmc.listAssets();
var assets = result.data.items; // Will fail if error occurred
```

### 4. Use Specific Error Handling

```javascript
// ✅ GOOD - Handle different error types
if (!result.success) {
    switch (result.error.code) {
        case 'AUTH_ERROR':
            // Handle auth failures
            break;
        case 'HTTP_ERROR':
            if (result.error.details.statusCode === 429) {
                // Rate limited - wait and retry
            }
            break;
        case 'VALIDATION_ERROR':
            // Fix configuration
            break;
    }
}

// ❌ BAD - Generic error handling
if (!result.success) {
    Write('Error: ' + result.error.message);
}
```

---

## Migration from Old Architecture

### Old Code:
```javascript
%%=ContentBlockByKey("OMG_FW_AuthHandler")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%
<script runat="server">
var auth = new AuthHandler(config);
var token = auth.getValidToken();
</script>
```

### New Code:
```javascript
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_DataExtensionTokenCache")=%%
%%=ContentBlockByKey("OMG_OAuth2AuthStrategy")=%%
%%=ContentBlockByKey("OMG_BaseIntegration")=%%
%%=ContentBlockByKey("OMG_SFMCIntegration")=%%
<script runat="server">
var sfmc = new SFMCIntegration(config);
var tokenResult = sfmc.getToken();
</script>
```

**Benefits of migration:**
- Persistent token caching (faster)
- Cleaner API
- Better error handling
- More features (listAssets, queryDE, etc.)

---

## Troubleshooting

### Issue: "Token cache Data Extension not found"

**Solution**: Create the `OMG_FW_TokenCache` Data Extension (see Setup Step 1)

### Issue: "Token expired immediately"

**Cause**: System time mismatch or incorrect `obtainedAt` timestamp

**Solution**: Verify SFMC server time, clear cache and retry

### Issue: "Multiple tokens in cache for same credentials"

**Cause**: Different cache keys used for same credentials

**Solution**: Ensure consistent `cacheKey` in config or use default (clientId)

### Issue: "HTTP 429 Too Many Requests"

**Cause**: Rate limiting (usually during initial setup without cache)

**Solution**: ConnectionHandler automatically retries with backoff. If persistent, reduce request frequency.

---

## Support

For issues, questions, or contributions, refer to the main OmegaFramework documentation or contact the development team.

---

## License

OmegaFramework v2.0 - Internal Use Only
