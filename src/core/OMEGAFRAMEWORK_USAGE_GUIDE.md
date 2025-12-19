# OmegaFramework v1.0 - Usage Guide

## Two Ways to Get Module Instances

OmegaFramework provides two methods for obtaining module instances, each designed for different use cases:

### 1. `OmegaFramework.require()` - Singleton Pattern (Cached)

**Use for STATELESS modules** that can be safely shared across your application.

```javascript
// Always returns the SAME instance for the same config
var response1 = OmegaFramework.require('ResponseWrapper', {});
var response2 = OmegaFramework.require('ResponseWrapper', {});
// response1 === response2 → TRUE (same instance)
```

**When to use:**
- ✅ **ResponseWrapper** - Pure utility functions, no state
- ✅ **ConnectionHandler** - Can manage a connection pool internally
- ✅ Modules that don't hold configuration-specific state

**Advantages:**
- 🚀 Better performance (no re-instantiation)
- 💾 Lower memory usage
- 🔄 Consistency across application

**Disadvantages:**
- ⚠️ Cannot create multiple instances with different configs
- ⚠️ Config passed on subsequent calls is IGNORED

---

### 2. `OmegaFramework.create()` - Factory Pattern (Always New)

**Use for STATEFUL modules** that need different configurations.

```javascript
// Always returns a NEW instance
var auth1 = OmegaFramework.create('BasicAuthStrategy', {username: 'user1', password: 'pass1'});
var auth2 = OmegaFramework.create('BasicAuthStrategy', {username: 'user2', password: 'pass2'});
// auth1 !== auth2 → TRUE (different instances with different credentials)
```

**When to use:**
- ✅ **BasicAuthStrategy** - Different users/passwords
- ✅ **BearerAuthStrategy** - Different tokens
- ✅ **OAuth2AuthStrategy** - Different client credentials
- ✅ **BaseIntegration** - Different baseUrls and configs
- ✅ **SFMCIntegration** - Multiple SFMC instances
- ✅ **CredentialStore** - Different integration credentials
- ✅ **DataExtensionTokenCache** - Different cache keys
- ✅ **All Integration modules** (DataCloud, Veeva, etc.)

**Advantages:**
- 🎯 Complete flexibility - create unlimited instances
- 🧪 Perfect for testing - each test gets isolated instance
- 🔧 Each instance has independent configuration

**Disadvantages:**
- 🐌 Slightly slower (creates new instance each time)
- 💾 Higher memory usage if many instances created

---

## Complete Module Classification

### SINGLETON Modules (use `.require()`)
```javascript
var response = OmegaFramework.require('ResponseWrapper', {});
var connection = OmegaFramework.require('ConnectionHandler', {});
```

### FACTORY Modules (use `.create()`)

#### Authentication Strategies
```javascript
var basicAuth = OmegaFramework.create('BasicAuthStrategy', {
    username: 'myuser',
    password: 'mypass'
});

var bearerAuth = OmegaFramework.create('BearerAuthStrategy', {
    token: 'my-bearer-token-123'
});

var oauth2 = OmegaFramework.create('OAuth2AuthStrategy', {
    tokenUrl: 'https://auth.example.com/token',
    clientId: 'client123',
    clientSecret: 'secret456'
});
```

#### Integrations
```javascript
var sfmc = OmegaFramework.create('SFMCIntegration', {
    baseUrl: 'https://mc.s11.exacttarget.com',
    auth: {...}
});

var dataCloud = OmegaFramework.create('DataCloudIntegration', {
    baseUrl: 'https://api.salesforce.com',
    auth: {...}
});

var baseIntegration = OmegaFramework.create('BaseIntegration', {
    integrationName: 'MyAPI',
    integrationConfig: {
        baseUrl: 'https://api.example.com'
    },
    authStrategy: myAuthStrategy
});
```

#### Storage & Cache
```javascript
var credStore = OmegaFramework.create('CredentialStore', {
    integrationName: 'MyIntegration'
});

var tokenCache = OmegaFramework.create('DataExtensionTokenCache', {
    cacheKey: 'MyIntegration',
    refreshBuffer: 300000
});
```

---

## Testing Best Practices

### ✅ CORRECT - Use `.create()` in tests
```javascript
function createBaseIntegrationWithMocks(integrationConfig, authStrategy) {
    return OmegaFramework.create('BaseIntegration', {
        integrationName: 'TestIntegration',
        integrationConfig: integrationConfig,
        authStrategy: authStrategy
    });
}

// Test 1 - missing baseUrl
var base1 = createBaseIntegrationWithMocks({}, null);
var validation1 = base1.validateConfig();
// validation1.success = false ✓

// Test 2 - valid baseUrl
var base2 = createBaseIntegrationWithMocks({baseUrl: 'https://api.example.com'}, null);
var validation2 = base2.validateConfig();
// validation2 = null ✓ (valid)
```

### ❌ INCORRECT - Using `.require()` in tests
```javascript
function createBaseIntegrationWithMocks(integrationConfig, authStrategy) {
    return OmegaFramework.require('BaseIntegration', { // ❌ BAD
        integrationName: 'TestIntegration',
        integrationConfig: integrationConfig,
        authStrategy: authStrategy
    });
}

// Test 1 - missing baseUrl
var base1 = createBaseIntegrationWithMocks({}, null);
// Creates instance A with config {}

// Test 2 - valid baseUrl
var base2 = createBaseIntegrationWithMocks({baseUrl: 'https://api.example.com'}, null);
// Returns instance A (SAME as Test 1!) ❌
// Config with baseUrl is IGNORED!
```

---

## Production Usage Examples

### Example 1: Single SFMC Integration
```javascript
// Production code - use .require() for singleton
var sfmc = OmegaFramework.require('SFMCIntegration', 'production');

// All subsequent calls return the same instance
var sfmc2 = OmegaFramework.require('SFMCIntegration', 'production');
// sfmc === sfmc2 → TRUE
```

### Example 2: Multiple Different Integrations
```javascript
// Create different auth strategies for different APIs
var sfmcAuth = OmegaFramework.create('OAuth2AuthStrategy', {
    tokenUrl: 'https://auth.exacttarget.com/v2/token',
    clientId: 'sfmc-client',
    clientSecret: 'sfmc-secret'
});

var customApiAuth = OmegaFramework.create('BasicAuthStrategy', {
    username: 'api-user',
    password: 'api-pass'
});

// Create different integrations
var sfmc = OmegaFramework.create('SFMCIntegration', {
    baseUrl: 'https://mc.s11.exacttarget.com',
    auth: sfmcAuth
});

var customApi = OmegaFramework.create('BaseIntegration', {
    integrationName: 'CustomAPI',
    integrationConfig: {baseUrl: 'https://custom-api.com'},
    authStrategy: customApiAuth
});
```

---

## Migration Guide

If you have existing code using `.require()` for stateful modules:

### Before (Incorrect)
```javascript
var auth1 = OmegaFramework.require('BasicAuthStrategy', {
    username: 'user1',
    password: 'pass1'
});

var auth2 = OmegaFramework.require('BasicAuthStrategy', {
    username: 'user2', // ❌ This config is IGNORED
    password: 'pass2'  // ❌ Returns auth1 instance
});
```

### After (Correct)
```javascript
var auth1 = OmegaFramework.create('BasicAuthStrategy', {
    username: 'user1',
    password: 'pass1'
});

var auth2 = OmegaFramework.create('BasicAuthStrategy', {
    username: 'user2', // ✅ Creates NEW instance
    password: 'pass2'  // ✅ With different credentials
});
```

---

## Quick Reference Table

| Module Type | Method | Returns | Use Case |
|-------------|--------|---------|----------|
| **ResponseWrapper** | `.require()` | Singleton | Utility functions, no state |
| **ConnectionHandler** | `.require()` | Singleton | Connection pooling |
| **BasicAuthStrategy** | `.create()` | New instance | Different credentials |
| **BearerAuthStrategy** | `.create()` | New instance | Different tokens |
| **OAuth2AuthStrategy** | `.create()` | New instance | Different clients |
| **BaseIntegration** | `.create()` | New instance | Different APIs |
| **SFMCIntegration** | `.create()` | New instance | Multiple instances |
| **DataCloudIntegration** | `.create()` | New instance | Multiple instances |
| **VeevaCRMIntegration** | `.create()` | New instance | Multiple instances |
| **VeevaVaultIntegration** | `.create()` | New instance | Multiple instances |
| **CredentialStore** | `.create()` | New instance | Different integrations |
| **DataExtensionTokenCache** | `.create()` | New instance | Different cache keys |

---

## Performance Considerations

### Memory Usage
```javascript
// SINGLETON - Only 1 instance in memory
for (var i = 0; i < 100; i++) {
    var response = OmegaFramework.require('ResponseWrapper', {});
}
// Memory: 1 ResponseWrapper instance

// FACTORY - 100 instances in memory
for (var i = 0; i < 100; i++) {
    var auth = OmegaFramework.create('BasicAuthStrategy', {
        username: 'user' + i,
        password: 'pass' + i
    });
}
// Memory: 100 BasicAuthStrategy instances
```

### When to Optimize
- If creating thousands of instances → consider pooling or caching yourself
- If memory is constrained → prefer `.require()` when possible
- If testing → always use `.create()` for isolation

---

## Summary

**Golden Rule:**
- 🔹 **Stateless utilities** → `.require()` (singleton)
- 🔸 **Stateful modules with config** → `.create()` (factory)
- 🧪 **All tests** → `.create()` (isolation)

**Remember:**
- `.require()` caches and returns the SAME instance
- `.create()` always returns a NEW instance
- Choose based on whether the module holds state/config
