# OmegaFramework v2.0 - Deployment Guide

## Overview

This guide walks you through deploying OmegaFramework v2.0 to your Salesforce Marketing Cloud instance.

**Estimated Time:** 30-45 minutes

---

## Prerequisites

### 1. SFMC Access

You need:
- ✅ Admin access to SFMC
- ✅ Access to Content Builder
- ✅ Access to Contact Builder (Data Extensions)
- ✅ Permissions to create Installed Packages

### 2. Installed Package (for SFMC Integration)

If you plan to use `SFMCIntegration`:

1. Go to **Setup → Platform Tools → Apps → Installed Packages**
2. Click **New**
3. Name: `OmegaFramework`
4. Add Component: **API Integration**
5. Integration Type: **Server-to-Server**
6. Set permissions:
   - ✅ Email: Read, Write
   - ✅ Web: Read, Write
   - ✅ Data Extensions: Read, Write
   - ✅ Automation: Read, Write (if using Journey/Automation APIs)
7. Save and copy **Client ID** and **Client Secret**

---

## Deployment Steps

### Step 1: Create Token Cache Data Extension

This Data Extension is **REQUIRED** for token caching to work.

#### Option A: Automated Creation

1. Create a CloudPage in Content Builder
2. Add this AMPscript:
```
%%=ContentBlockByKey("OMG_CreateTokenCacheDE")=%%
```
3. Open the CloudPage URL
4. **IMPORTANT**: Edit the script and update these lines with your credentials:
```javascript
var config = {
    clientId: 'YOUR_CLIENT_ID',        // From Installed Package
    clientSecret: 'YOUR_CLIENT_SECRET', // From Installed Package
    authBaseUrl: 'https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/'
};
```
5. Refresh the page - Data Extension will be created

#### Option B: Manual Creation

1. Go to **Contact Builder → Data Extensions**
2. Click **Create → Standard Data Extension**
3. Set properties:
   - **Name**: `OMG_FW_TokenCache`
   - **External Key**: `OMG_FW_TokenCache`
   - **Description**: `OAuth2 token cache for OmegaFramework. DO NOT DELETE.`
4. Add fields:

| Field Name | Field Type | Length | Primary Key | Required | Default |
|------------|------------|--------|-------------|----------|---------|
| CacheKey | Text | 200 | ✓ | ✓ | |
| AccessToken | Text | 500 | | ✓ | |
| TokenType | Text | 50 | | | Bearer |
| ExpiresIn | Number | | | | 3600 |
| ObtainedAt | Number | | | ✓ | |
| Scope | Text | 500 | | | |
| RestInstanceUrl | Text | 200 | | | |
| SoapInstanceUrl | Text | 200 | | | |
| UpdatedAt | Date | | | | GETDATE() |

5. Click **Create**

**Verification**: Go to Data Extensions and confirm `OMG_FW_TokenCache` exists.

---

### Step 2: Deploy Core Components

These are required by **all** integrations.

#### 2.1: ResponseWrapper

1. Go to **Content Builder → Content Blocks**
2. Click **Create → Code Snippet**
3. Name: `OMG_ResponseWrapper`
4. Copy content from: `new-architecture/core/ResponseWrapper.ssjs`
5. Paste into Content Block
6. Save

#### 2.2: ConnectionHandler

1. Create Code Snippet: `OMG_ConnectionHandler`
2. Copy content from: `new-architecture/core/ConnectionHandler.ssjs`
3. Save

#### 2.3: DataExtensionTokenCache

1. Create Code Snippet: `OMG_DataExtensionTokenCache`
2. Copy content from: `new-architecture/core/DataExtensionTokenCache.ssjs`
3. Save

---

### Step 3: Deploy Authentication Strategies

Deploy the auth strategies you need for your integrations.

#### 3.1: OAuth2AuthStrategy (Required for SFMC, Data Cloud, Veeva CRM)

1. Create Code Snippet: `OMG_OAuth2AuthStrategy`
2. Copy content from: `new-architecture/auth/OAuth2AuthStrategy.ssjs`
3. Save

#### 3.2: BasicAuthStrategy (Optional - for Basic Auth APIs)

1. Create Code Snippet: `OMG_BasicAuthStrategy`
2. Copy content from: `new-architecture/auth/BasicAuthStrategy.ssjs`
3. Save

#### 3.3: BearerAuthStrategy (Optional - for Bearer token APIs)

1. Create Code Snippet: `OMG_BearerAuthStrategy`
2. Copy content from: `new-architecture/auth/BearerAuthStrategy.ssjs`
3. Save

---

### Step 4: Deploy BaseIntegration

This is the foundation for all integrations.

1. Create Code Snippet: `OMG_BaseIntegration`
2. Copy content from: `new-architecture/integrations/BaseIntegration.ssjs`
3. Save

---

### Step 5: Deploy Integrations

Deploy only the integrations you need.

#### 5.1: SFMCIntegration (for SFMC REST API)

1. Create Code Snippet: `OMG_SFMCIntegration`
2. Copy content from: `new-architecture/integrations/SFMCIntegration.ssjs`
3. Save

#### 5.2: DataCloudIntegration (Optional)

1. Create Code Snippet: `OMG_DataCloudIntegration`
2. Copy content from: `new-architecture/integrations/DataCloudIntegration.ssjs`
3. Save

#### 5.3: VeevaCRMIntegration (Optional)

1. Create Code Snippet: `OMG_VeevaCRMIntegration`
2. Copy content from: `new-architecture/integrations/VeevaCRMIntegration.ssjs`
3. Save

#### 5.4: VeevaVaultIntegration (Optional)

1. Create Code Snippet: `OMG_VeevaVaultIntegration`
2. Copy content from: `new-architecture/integrations/VeevaVaultIntegration.ssjs`
3. Save

---

### Step 6: Verify Deployment

Create a test CloudPage to verify everything works.

#### Test Script

```javascript
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_DataExtensionTokenCache")=%%
%%=ContentBlockByKey("OMG_OAuth2AuthStrategy")=%%
%%=ContentBlockByKey("OMG_BaseIntegration")=%%
%%=ContentBlockByKey("OMG_SFMCIntegration")=%%

<script runat="server">
Platform.Load("core", "1.1.1");

Write('<h1>OmegaFramework v2.0 - Deployment Test</h1>');
Write('<hr>');

// Test 1: ResponseWrapper
Write('<h2>Test 1: ResponseWrapper</h2>');
try {
    var response = new ResponseWrapper();
    var testResult = response.success({ test: 'data' }, 'TestHandler', 'testOperation');
    if (testResult.success) {
        Write('<p style="color: green;">✓ ResponseWrapper working</p>');
    }
} catch (ex) {
    Write('<p style="color: red;">✗ ResponseWrapper failed: ' + ex.message + '</p>');
}

// Test 2: ConnectionHandler
Write('<h2>Test 2: ConnectionHandler</h2>');
try {
    var connection = new ConnectionHandler();
    Write('<p style="color: green;">✓ ConnectionHandler initialized</p>');
} catch (ex) {
    Write('<p style="color: red;">✗ ConnectionHandler failed: ' + ex.message + '</p>');
}

// Test 3: DataExtensionTokenCache
Write('<h2>Test 3: DataExtensionTokenCache</h2>');
try {
    var tokenCache = new DataExtensionTokenCache();
    Write('<p style="color: green;">✓ DataExtensionTokenCache initialized</p>');

    // Check if DE exists
    var testGet = tokenCache.get('test_key');
    if (testGet.success) {
        Write('<p style="color: green;">✓ Token cache Data Extension accessible</p>');
    } else {
        if (testGet.error.message.indexOf('not found') > -1) {
            Write('<p style="color: red;">✗ Data Extension "OMG_FW_TokenCache" not found. Please create it!</p>');
        } else {
            Write('<p style="color: orange;">⚠️ Token cache warning: ' + testGet.error.message + '</p>');
        }
    }
} catch (ex) {
    Write('<p style="color: red;">✗ DataExtensionTokenCache failed: ' + ex.message + '</p>');
}

// Test 4: OAuth2AuthStrategy
Write('<h2>Test 4: OAuth2AuthStrategy</h2>');
try {
    var oauth2 = new OAuth2AuthStrategy({
        tokenUrl: 'https://test.com/token',
        clientId: 'test',
        clientSecret: 'test'
    });
    Write('<p style="color: green;">✓ OAuth2AuthStrategy initialized</p>');

    // Test validation
    var validation = oauth2.validateConfig();
    if (validation === null) {
        Write('<p style="color: green;">✓ OAuth2 validation working</p>');
    }
} catch (ex) {
    Write('<p style="color: red;">✗ OAuth2AuthStrategy failed: ' + ex.message + '</p>');
}

// Test 5: BaseIntegration
Write('<h2>Test 5: BaseIntegration</h2>');
try {
    var baseIntegration = new BaseIntegration('TestIntegration', {
        baseUrl: 'https://api.test.com'
    });
    Write('<p style="color: green;">✓ BaseIntegration initialized</p>');
} catch (ex) {
    Write('<p style="color: red;">✗ BaseIntegration failed: ' + ex.message + '</p>');
}

// Test 6: SFMCIntegration
Write('<h2>Test 6: SFMCIntegration</h2>');
try {
    // IMPORTANT: Replace with your actual credentials
    var sfmcConfig = {
        clientId: 'YOUR_CLIENT_ID',
        clientSecret: 'YOUR_CLIENT_SECRET',
        authBaseUrl: 'https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/'
    };

    var sfmc = new SFMCIntegration(sfmcConfig);
    Write('<p style="color: green;">✓ SFMCIntegration initialized</p>');

    // Uncomment to test actual token retrieval
    /*
    var tokenResult = sfmc.getToken();
    if (tokenResult.success) {
        Write('<p style="color: green;">✓ Token retrieved successfully</p>');
        Write('<pre>Token: ' + tokenResult.data.accessToken.substring(0, 20) + '...</pre>');
    } else {
        Write('<p style="color: red;">✗ Token retrieval failed: ' + tokenResult.error.message + '</p>');
    }
    */

} catch (ex) {
    Write('<p style="color: red;">✗ SFMCIntegration failed: ' + ex.message + '</p>');
}

Write('<hr>');
Write('<h2>Deployment Status</h2>');
Write('<p>If all tests show green checkmarks (✓), deployment was successful!</p>');
Write('<p>If any tests failed (✗), check the error messages and verify:</p>');
Write('<ul>');
Write('<li>All Content Blocks are created with correct names</li>');
Write('<li>Token Cache Data Extension exists</li>');
Write('<li>Code was copied correctly without errors</li>');
Write('</ul>');

</script>
```

#### Run Test

1. Create CloudPage in Content Builder
2. Paste the test script above
3. **Update credentials** in Test 6
4. Publish and open the CloudPage
5. Verify all tests pass (green checkmarks)

---

## Content Block Naming Convention

**IMPORTANT**: Content Block names MUST match exactly (case-sensitive):

| File | Content Block Key |
|------|-------------------|
| `core/ResponseWrapper.ssjs` | `OMG_ResponseWrapper` |
| `core/ConnectionHandler.ssjs` | `OMG_ConnectionHandler` |
| `core/DataExtensionTokenCache.ssjs` | `OMG_DataExtensionTokenCache` |
| `auth/OAuth2AuthStrategy.ssjs` | `OMG_OAuth2AuthStrategy` |
| `auth/BasicAuthStrategy.ssjs` | `OMG_BasicAuthStrategy` |
| `auth/BearerAuthStrategy.ssjs` | `OMG_BearerAuthStrategy` |
| `integrations/BaseIntegration.ssjs` | `OMG_BaseIntegration` |
| `integrations/SFMCIntegration.ssjs` | `OMG_SFMCIntegration` |
| `integrations/DataCloudIntegration.ssjs` | `OMG_DataCloudIntegration` |
| `integrations/VeevaCRMIntegration.ssjs` | `OMG_VeevaCRMIntegration` |
| `integrations/VeevaVaultIntegration.ssjs` | `OMG_VeevaVaultIntegration` |

---

## Credential Management

### Storing Credentials Securely

**DO NOT hardcode credentials in your scripts.** Use a Data Extension instead.

#### Create Credentials Data Extension

1. Go to **Contact Builder → Data Extensions**
2. Create new Data Extension: `OmegaFramework_Credentials`
3. Fields:

| Field Name | Field Type | Length | Primary Key | Required |
|------------|------------|--------|-------------|----------|
| SystemName | Text | 100 | ✓ | ✓ |
| ClientId | Text | 200 | | ✓ |
| ClientSecret | Text | 200 | | ✓ |
| AuthBaseUrl | Text | 300 | | ✓ |
| BaseUrl | Text | 300 | | |
| Scope | Text | 500 | | |

4. Add row for SFMC:

| SystemName | ClientId | ClientSecret | AuthBaseUrl |
|------------|----------|--------------|-------------|
| SFMC | your-client-id | your-client-secret | https://subdomain.auth.marketingcloudapis.com/ |

#### Load Credentials in Code

```javascript
// Load credentials from Data Extension
var credsDE = DataExtension.Init('OmegaFramework_Credentials');
var creds = credsDE.Rows.Lookup(['SystemName'], ['SFMC']);

// Use credentials
var config = {
    clientId: creds.ClientId,
    clientSecret: creds.ClientSecret,
    authBaseUrl: creds.AuthBaseUrl
};

var sfmc = new SFMCIntegration(config);
```

---

## Usage in Different SFMC Components

### CloudPages

```javascript
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_DataExtensionTokenCache")=%%
%%=ContentBlockByKey("OMG_OAuth2AuthStrategy")=%%
%%=ContentBlockByKey("OMG_BaseIntegration")=%%
%%=ContentBlockByKey("OMG_SFMCIntegration")=%%

<script runat="server">
Platform.Load("core", "1.1.1");

var sfmc = new SFMCIntegration(config);
var assets = sfmc.listAssets({ pageSize: 10 });

Write(Stringify(assets));
</script>
```

### Script Activities (Automation Studio)

1. Create Script Activity
2. Add Content Block loads at the top (same as CloudPages)
3. Add your logic
4. Run automation

### Email/Journey Code

```javascript
%%[
/* Load framework */
ContentBlockByKey("OMG_ResponseWrapper")
ContentBlockByKey("OMG_ConnectionHandler")
ContentBlockByKey("OMG_DataExtensionTokenCache")
ContentBlockByKey("OMG_OAuth2AuthStrategy")
ContentBlockByKey("OMG_BaseIntegration")
ContentBlockByKey("OMG_SFMCIntegration")

/* Your code */
SET @sfmc = CreateObject("SFMCIntegration", @config)
SET @result = InvokeMethod(@sfmc, "listAssets")
]%%
```

---

## Troubleshooting

### "Content Block not found"

**Cause**: Content Block name mismatch or not deployed

**Solution**:
1. Go to Content Builder → Content Blocks
2. Verify Content Block exists with exact name (e.g., `OMG_ResponseWrapper`)
3. Check for typos in AMPscript `ContentBlockByKey()` calls

### "Data Extension OMG_FW_TokenCache not found"

**Cause**: Token cache DE not created

**Solution**: Follow Step 1 to create the Data Extension

### "401 Unauthorized" when calling SFMC APIs

**Cause**: Invalid credentials

**Solution**:
1. Verify Client ID and Client Secret are correct
2. Check Installed Package has required permissions
3. Ensure Auth Base URL matches your SFMC instance

### "Token expired immediately"

**Cause**: Clock skew or incorrect `obtainedAt` timestamp

**Solution**:
1. Clear token cache: `sfmc.clearTokenCache()`
2. Retry request
3. Check SFMC server time matches expected timezone

### "Too many requests (429)"

**Cause**: Rate limiting

**Solution**: ConnectionHandler automatically retries with backoff. If persistent, reduce request frequency or contact SFMC support to increase rate limits.

---

## Post-Deployment Checklist

- [ ] Token Cache Data Extension created
- [ ] All core Content Blocks deployed (ResponseWrapper, ConnectionHandler, DataExtensionTokenCache)
- [ ] Auth strategies deployed (OAuth2, Basic, Bearer as needed)
- [ ] BaseIntegration deployed
- [ ] Required integrations deployed (SFMC, Data Cloud, etc.)
- [ ] Credentials stored in Data Extension (not hardcoded)
- [ ] Deployment test passed (all green checkmarks)
- [ ] Sample integration tested successfully
- [ ] Documentation reviewed by team
- [ ] Backup of old architecture (if migrating)

---

## Next Steps

After successful deployment:

1. **Review the README.md** for usage examples
2. **Test each integration** you deployed with real credentials
3. **Monitor token cache** - verify tokens are being cached and reused
4. **Integrate into your automations** - replace old code with new framework
5. **Monitor performance** - should see ~90% reduction in auth API calls

---

## Support

For questions, issues, or feature requests, contact the OmegaFramework development team or refer to the main documentation in `README.md`.

---

**OmegaFramework v2.0 - Built for Scale**
