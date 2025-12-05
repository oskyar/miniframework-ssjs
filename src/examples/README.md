# OmegaFramework - Complete Examples

This directory contains comprehensive, production-ready examples demonstrating how to use the OmegaFramework to interact with Salesforce Marketing Cloud.

## 📚 Available Examples

### 1. Authentication Example
**File:** `Example_SFMC_Complete_Authentication.html`

**What it demonstrates:**
- Complete OAuth2 authentication with SFMC
- Token management and caching
- Token expiration checking
- REST API instance URL discovery
- Making authenticated API calls

**Use this when:** You need to understand how authentication works in the framework.

**Key learning points:**
- How to configure SFMC credentials
- How tokens are cached automatically
- How to check token status
- How to make custom REST API calls

---

### 2. Read Data Extension Example
**File:** `Example_SFMC_DataExtension_Read.html`

**What it demonstrates:**
- Querying all rows from a Data Extension
- Filtering data with specific criteria
- Understanding the response structure
- Dual-strategy approach (SSJS first, REST API fallback)

**Use this when:** You need to read data from SFMC Data Extensions.

**Key learning points:**
- How to query all rows: `deHandler.query(deKey)`
- How to filter data: `deHandler.query(deKey, { filter: {...} })`
- How to handle responses
- How to display results

---

### 3. Write Data Extension Example
**File:** `Example_SFMC_DataExtension_Write.html`

**What it demonstrates:**
- Inserting new rows
- Updating existing rows
- Upserting (insert or update)
- Deleting rows
- Batch operations
- Error handling best practices

**Use this when:** You need to write, update, or delete data in SFMC Data Extensions.

**Key learning points:**
- Insert: `deHandler.insertRow(deKey, rowData)`
- Update: `deHandler.updateRow(deKey, rowData)`
- Upsert: `deHandler.upsertRow(deKey, rowData)`
- Delete: `deHandler.deleteRow(deKey, primaryKeys)`
- Processing multiple rows in a loop

---

### 4. Complete Workflow Example
**File:** `Example_SFMC_Complete_Workflow.html`

**What it demonstrates:**
- End-to-end customer onboarding workflow
- Reading pending customers
- Processing and enriching data
- Writing to multiple Data Extensions
- Audit logging
- Error handling and recovery
- Results verification

**Use this when:** You need a complete, real-world example combining all operations.

**Key learning points:**
- Building production workflows
- Data enrichment patterns
- Multi-DE operations
- Comprehensive error handling
- Audit trail implementation
- Statistics and reporting

---

## 🚀 Quick Start

### Prerequisites

1. **Install the framework** using `AutomatedInstaller.html`
2. **Create test Data Extensions** (or use existing ones)
3. **Get SFMC credentials** from an Installed Package

### Basic Usage Pattern

All examples follow this simple 3-step pattern:

```javascript
// 1. Load only 3 Content Blocks (no duplicate dependencies!)
Platform.Function.ContentBlockByKey("OMG_FW_ResponseWrapper");
Platform.Function.ContentBlockByKey("OMG_FW_SFMCIntegration");
Platform.Function.ContentBlockByKey("OMG_FW_DataExtensionHandler");

// 2. Initialize
var sfmc = new SFMCIntegration({
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    authBaseUrl: 'https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/'
});

var deHandler = new DataExtensionHandler(sfmc);

// 3. Use it!
var result = deHandler.query('YourDE_Key');
if (result.success) {
    // Do something with result.data
}
```

---

## 🔧 Configuration

### Replace Mock Data

All examples use **mock data** that you need to replace:

#### SFMC Credentials
```javascript
var sfmcConfig = {
    clientId: 'your-client-id-here',           // ← Replace this
    clientSecret: 'your-client-secret-here',   // ← Replace this
    authBaseUrl: 'https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/'  // ← Replace this
};
```

**How to get credentials:**
1. Go to SFMC Setup → Apps → Installed Packages
2. Create or open an Installed Package
3. Add a Server-to-Server component
4. Copy the Client ID and Client Secret
5. Use your SFMC subdomain in the Auth Base URL

#### Data Extension Keys
```javascript
var dataExtensionKey = 'Customers_DE';  // ← Replace with your DE key
```

---

## 📋 Response Structure

All framework methods return a standardized response:

```javascript
{
    success: boolean,        // Operation success status
    data: any,              // Response data (null if error)
    error: {                // Error details (null if success)
        code: string,       // Error type identifier
        message: string,    // Human-readable error
        details: object     // Additional context
    },
    meta: {                 // Operation metadata
        datetime: date,     // Timestamp
        handler: string,    // Handler name
        operation: string   // Method name
    }
}
```

### Always Check Success

```javascript
var result = deHandler.insertRow(deKey, rowData);

if (result.success) {
    // Success path
    Write('Inserted: ' + Stringify(result.data));
} else {
    // Error path
    Write('Error: ' + result.error.message);
    Write('Code: ' + result.error.code);
}
```

---

## 🎯 Common Use Cases

### Read all customers
```javascript
var result = deHandler.query('Customers_DE');
if (result.success) {
    var customers = result.data.items;
    // Process customers
}
```

### Read with filter
```javascript
var result = deHandler.query('Customers_DE', {
    filter: {
        columns: ['Status'],
        values: ['Active']
    }
});
```

### Insert new customer
```javascript
var customer = {
    CustomerID: 'C001',
    FirstName: 'Juan',
    Email: 'juan@example.com'
};

var result = deHandler.insertRow('Customers_DE', customer);
```

### Update customer
```javascript
var customer = {
    CustomerID: 'C001',  // Primary key
    Status: 'Premium'
};

var result = deHandler.updateRow('Customers_DE', customer);
```

### Upsert (insert or update)
```javascript
var customer = {
    CustomerID: 'C001',
    FirstName: 'Juan',
    Status: 'Active'
};

var result = deHandler.upsertRow('Customers_DE', customer);
```

### Delete customer
```javascript
var result = deHandler.deleteRow('Customers_DE', {
    CustomerID: 'C001'
});
```

---

## 💡 Best Practices

### 1. Use CredentialStore in Production
Don't hardcode credentials:

```javascript
// Load OmegaFramework and CredentialStore
Platform.Function.ContentBlockByKey("OMG_FW_OmegaFramework");
Platform.Function.ContentBlockByKey("OMG_FW_CredentialStore");

// Get credentials securely using factory pattern
var credStore = OmegaFramework.create('CredentialStore', {
    integrationName: 'SFMC_Production'
});
var credResult = credStore.getCredentials();

if (credResult.success) {
    var sfmc = new SFMCIntegration({
        clientId: credResult.data.clientId,
        clientSecret: credResult.data.clientSecret,
        authBaseUrl: credResult.data.authUrl
    });
}
```

### 2. Always Handle Errors
```javascript
var result = deHandler.query('Customers_DE');

if (!result.success) {
    // Log error
    Write('Error: ' + result.error.message);

    // Could also:
    // - Send notification
    // - Write to error log DE
    // - Retry operation
    // - Gracefully degrade functionality

    return; // Exit gracefully
}

// Continue with success path
```

### 3. Use Filters to Reduce Data Transfer
```javascript
// Bad - reads all rows then filters in code
var allCustomers = deHandler.query('Customers_DE');
// ... then filter in JavaScript

// Good - filter at source
var activeCustomers = deHandler.query('Customers_DE', {
    filter: {
        columns: ['Status'],
        values: ['Active']
    }
});
```

### 4. Log Important Operations
```javascript
var logEntry = {
    LogID: 'LOG_' + new Date().getTime(),
    Action: 'CustomerActivated',
    Status: 'Success',
    Details: 'Customer C001 activated',
    ProcessedAt: new Date().toISOString()
};

deHandler.insertRow('ProcessingLog', logEntry);
```

### 5. Batch Operations Carefully
```javascript
var customers = [...]; // Array of customers
var stats = { success: 0, failed: 0 };

for (var i = 0; i < customers.length; i++) {
    var result = deHandler.insertRow('Customers_DE', customers[i]);

    if (result.success) {
        stats.success++;
    } else {
        stats.failed++;
        // Log specific error
    }

    // Optional: Add delay for rate limiting
    // Platform.Function.Sleep(100);
}
```

---

## 🛡️ Error Handling

### Common Error Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| `AUTH_ERROR` | Authentication failed | Invalid credentials, expired package |
| `HTTP_ERROR` | HTTP request failed | Network issues, invalid endpoint |
| `VALIDATION_ERROR` | Validation failed | Missing required fields |
| `NOT_FOUND` | Resource not found | DE doesn't exist, invalid key |
| `ERROR` | Generic error | Various causes, check message |

### Error Handling Template

```javascript
var result = deHandler.query('Customers_DE');

if (!result.success) {
    switch (result.error.code) {
        case 'AUTH_ERROR':
            // Handle authentication issues
            Write('Please check credentials');
            break;

        case 'NOT_FOUND':
            // Handle missing resources
            Write('Data Extension not found');
            break;

        case 'HTTP_ERROR':
            // Handle HTTP errors
            Write('API Error: ' + result.error.details.statusCode);
            break;

        default:
            // Generic error handling
            Write('Error: ' + result.error.message);
    }

    return; // Exit gracefully
}

// Success path
```

---

## 🧪 Testing Examples

### Option 1: CloudPage
1. Create a CloudPage in SFMC
2. Copy/paste example code
3. Replace mock data with your credentials
4. Publish and view

### Option 2: Code Resource
1. Create a Code Resource in SFMC
2. Copy/paste example code
3. Replace mock data with your credentials
4. Execute and view results

### Option 3: Automation Studio
1. Create a Script Activity
2. Use the code patterns from examples
3. Note: Some UI elements (HTML tables) won't display
4. Focus on the data operations

---

## 📖 Additional Resources

### Framework Documentation
- See `/docs` directory for complete API reference
- Review `/tests` directory for unit tests

### SFMC API Documentation
- [REST API Documentation](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/rest-api.html)
- [Data Extension REST API](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/data-extension-rest-api.html)
- [Asset REST API](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/asset-rest-api.html)

### Getting Help
1. Check the examples in this directory
2. Review test files in `/tests` directory
3. Read inline comments in framework source files
4. Consult SFMC Stack Exchange for SFMC-specific questions

---

## ✨ Key Benefits

### Why Use OmegaFramework?

✅ **No Duplicate Dependencies** - Load only 3 Content Blocks, framework handles the rest

✅ **Standardized Responses** - Consistent error handling across all operations

✅ **Automatic Token Management** - OAuth2 tokens cached and refreshed automatically

✅ **Dual-Strategy Approach** - SSJS first (fast), REST API fallback (compatible)

✅ **Production Ready** - Built-in error handling, logging, and best practices

✅ **Easy to Use** - Simple, intuitive API with comprehensive examples

✅ **Maintainable** - Modular architecture, easy to extend and customize

---

## 🎓 Learning Path

**Recommended order for learning:**

1. **Start with:** `Example_SFMC_Complete_Authentication.html`
   - Understand how authentication works
   - See token management in action

2. **Then try:** `Example_SFMC_DataExtension_Read.html`
   - Learn how to read data
   - Understand response structure

3. **Next:** `Example_SFMC_DataExtension_Write.html`
   - Learn all write operations
   - Practice error handling

4. **Finally:** `Example_SFMC_Complete_Workflow.html`
   - See everything working together
   - Learn production patterns

---

## 📝 Example Checklist

Before running any example:

- [ ] AutomatedInstaller has been run successfully
- [ ] All required Content Blocks exist in SFMC
- [ ] SFMC credentials are obtained from Installed Package
- [ ] Mock credentials are replaced with real ones
- [ ] Data Extension keys are updated to match your DEs
- [ ] Required Data Extensions exist in SFMC
- [ ] Test in a development/sandbox environment first

---

## 🆘 Troubleshooting

### "Authentication failed"
- Verify Client ID and Client Secret are correct
- Check Auth Base URL matches your subdomain
- Ensure Installed Package is active
- Check granted scopes include necessary permissions

### "Data Extension not found"
- Verify Data Extension key is correct (case-sensitive)
- Check Data Extension exists in your Business Unit
- Ensure you have permissions to access the DE

### "Token expired"
- Token should refresh automatically
- Try `sfmc.clearTokenCache()` and retry
- Check `OMG_FW_TokenCache` DE exists

### "Cannot find Content Block"
- Verify AutomatedInstaller ran successfully
- Check Content Block names match exactly
- Ensure Content Blocks are in correct folder

---

Made with ❤️ by OmegaFramework

For more information, visit the main project repository.
