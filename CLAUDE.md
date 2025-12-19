# CLAUDE.md

This file provides guidance when working with code in this repository.

## Overview

OmegaFramework v1.0 is a production-ready SSJS (Server-Side JavaScript) framework for Salesforce Marketing Cloud. It implements clean architecture with dependency injection, strategy pattern for authentication, and Data Extension token caching to solve SFMC's stateless execution challenge.

## Architecture

```
src/
├── core/                    # Foundation components
│   ├── OmegaFramework.ssjs             # Module loader with DI
│   ├── ResponseWrapper.ssjs            # Standardized response format
│   ├── ConnectionHandler.ssjs          # HTTP with retry logic
│   ├── DataExtensionTokenCache.ssjs    # Persistent token storage in DE
│   ├── CredentialStore.ssjs            # Encrypted credential management
│   └── WSProxyWrapper.ssjs             # SFMC SOAP API utilities
│
├── integrations/            # External system connectors
│   ├── BaseIntegration.ssjs            # Template for all integrations
│   ├── SFMCIntegration.ssjs            # SFMC REST API
│   ├── VeevaVaultIntegration.ssjs      # Veeva Vault (form-urlencoded auth)
│   ├── VeevaCRMIntegration.ssjs        # Veeva CRM (password grant)
│   └── DataCloudIntegration.ssjs       # Salesforce Data Cloud
│
├── handlers/                # High-level SFMC operations
│   ├── AssetHandler.ssjs               # Content Builder assets
│   ├── DataExtensionHandler.ssjs       # Data Extension CRUD
│   ├── EmailHandler.ssjs               # Email operations
│   ├── FolderHandler.ssjs              # Folder hierarchy
│   └── JourneyHandler.ssjs             # Journey management
│
├── tasks/                   # Automation scripts
└── tests/                   # CloudPage-based tests
```

## OmegaFramework Module Pattern

### Registration
```javascript
OmegaFramework.register('ModuleName', {
    dependencies: ['ResponseWrapper', 'ConnectionHandler'],
    blockKey: 'OMG_FW_ModuleName',  // Content Block key in SFMC
    factory: function(responseWrapper, connectionHandler, config) {
        return new ModuleName(responseWrapper, connectionHandler, config);
    }
});
```

### Usage
- `OmegaFramework.require(name, config)` - Singleton (cached instance)
- `OmegaFramework.create(name, config)` - Factory (new instance each call)

Use `.require()` for stateless utilities (ResponseWrapper), use `.create()` for stateful components (integrations, handlers).

### Loading Dependencies
Only load OmegaFramework - it auto-loads dependencies via `blockKey`:
```javascript
Platform.Function.ContentBlockByName("OMG_FW_OmegaFramework");

var sfmc = OmegaFramework.create('SFMCIntegration', { integrationName: 'SFMC_Production' });
```

## ES3/SSJS Constraints

SFMC SSJS uses ES3. Strictly avoid:
- Arrow functions (`=>`)
- Template literals (backticks)
- `const`/`let` (use `var` only)
- `class` keyword
- Destructuring, spread operator
- `async`/`await`
- Array methods: `.find()`, `.includes()`, `.map()`, `.filter()` (use manual loops)

Required patterns:
- `<script runat="server">` wrapper
- `Platform.Load("core", "1.1.1")` at start
- Function constructors with `this.method = function() {}`
- `Stringify()` instead of `JSON.stringify()`
- `Platform.Function.ParseJSON()` for JSON parsing

## ResponseWrapper Format

All operations return standardized responses:
```javascript
{
    success: boolean,
    data: any,
    error: {
        code: string,     // ERROR, VALIDATION_ERROR, AUTH_ERROR, HTTP_ERROR
        message: string,
        details: object
    },
    meta: { datetime, handler, operation }
}
```

## Key Integration Patterns

### CredentialStore
Stores encrypted credentials in `OMG_FW_Credentials` Data Extension:
```javascript
var sfmc = OmegaFramework.create('SFMCIntegration', { integrationName: 'SFMC_Production' });
```

### Direct Config
```javascript
var sfmc = OmegaFramework.create('SFMCIntegration', {
    clientId: 'xxx',
    clientSecret: 'yyy',
    authBaseUrl: 'https://subdomain.auth.marketingcloudapis.com/'
});
```

### Veeva Vault Authentication
Uses `application/x-www-form-urlencoded` (not JSON):
```javascript
var authPayload = 'username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password);
```

## Content Block Naming

All blocks use prefix `OMG_FW_`:
- `OMG_FW_OmegaFramework`
- `OMG_FW_ResponseWrapper`
- `OMG_FW_SFMCIntegration`
- etc.

## Testing

Tests are CloudPage-based (no Node.js). Each module has `Test_<ModuleName>.ssjs` in `src/tests/`.

Run tests by deploying as CloudPage and accessing via browser.

## Data Extensions Required

**OMG_FW_TokenCache** (OAuth2 token persistence):
- CacheKey (Text 200, PK)
- AccessToken (Text 500)
- ExpiresAt (Decimal)
- RestInstanceUrl (Text 200)

**OMG_FW_Credentials** (encrypted credentials):
- Name (Text, PK)
- AuthType (OAuth2/Basic/Bearer)
- ClientId, ClientSecret, Username, Password (encrypted)
- BaseUrl, AuthUrl, TokenEndpoint
