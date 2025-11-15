# OmegaFramework v2.0 - Handlers Usage Guide

## Overview

Handlers provide specialized functionality for SFMC-specific operations. All handlers follow the same pattern:

1. Require an `SFMCIntegration` instance (already authenticated)
2. Provide focused methods for specific operations
3. Return standardized responses
4. Include validation logic

---

## Handler Architecture

```
SFMCIntegration (authenticated)
    ↓
EmailHandler       → Email operations
AssetHandler       → Asset operations
DataExtensionHandler → DE operations
FolderHandler      → Folder operations
JourneyHandler     → Journey operations
```

---

## Common Usage Pattern

```javascript
// Load dependencies
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_DataExtensionTokenCache")=%%
%%=ContentBlockByKey("OMG_OAuth2AuthStrategy")=%%
%%=ContentBlockByKey("OMG_BaseIntegration")=%%
%%=ContentBlockByKey("OMG_SFMCIntegration")=%%
%%=ContentBlockByKey("OMG_EmailHandler")=%%  <!-- Load the handler you need -->

<script runat="server">
Platform.Load("core", "1.1.1");

// Step 1: Create SFMC Integration (handles auth automatically)
var sfmc = new SFMCIntegration({
    clientId: 'YOUR_CLIENT_ID',
    clientSecret: 'YOUR_CLIENT_SECRET',
    authBaseUrl: 'https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/'
});

// Step 2: Create Handler with SFMC instance
var emailHandler = new EmailHandler(sfmc);

// Step 3: Use handler methods
var result = emailHandler.list({ pageSize: 10 });

// Step 4: Check result
if (result.success) {
    Write('Success: ' + Stringify(result.data));
} else {
    Write('Error: ' + result.error.message);
}
</script>
```

---

## EmailHandler

### Purpose
Manage emails and templates in Content Builder.

### Dependencies
```javascript
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_SFMCIntegration")=%%
%%=ContentBlockByKey("OMG_EmailHandler")=%%
```

### Methods

#### `list(options)`
Lists all email assets.

```javascript
var emailHandler = new EmailHandler(sfmc);

// List all emails
var result = emailHandler.list();

// List with pagination
var result = emailHandler.list({
    pageSize: 50,
    page: 1
});

// List with filter
var result = emailHandler.list({
    filter: { name: 'Welcome Email' }
});
```

#### `get(emailId)`
Gets email by ID.

```javascript
var result = emailHandler.get(12345);
if (result.success) {
    Write('Email name: ' + result.data.parsedContent.name);
}
```

#### `create(emailData)`
Creates new email.

```javascript
var result = emailHandler.create({
    name: 'Welcome Email',
    assetType: { id: 208 },  // Email type
    content: '<html>...</html>',
    htmlContent: '<html>...</html>',
    textContent: 'Plain text version',
    subject: 'Welcome!',
    preheader: 'Thanks for joining'
});
```

#### `update(emailId, emailData)`
Updates existing email.

```javascript
var result = emailHandler.update(12345, {
    name: 'Updated Email Name',
    content: '<html>New content</html>'
});
```

#### `remove(emailId)` / `delete(emailId)`
Deletes email.

```javascript
var result = emailHandler.delete(12345);
```

#### `send(triggeredSendKey, sendData)`
Sends email via triggered send.

```javascript
var result = emailHandler.send('welcome-email-key', {
    to: { address: 'user@example.com' },
    subscriber: {
        emailAddress: 'user@example.com',
        attributes: {
            FirstName: 'John',
            LastName: 'Doe'
        }
    }
});
```

#### `getTemplates(options)`
Gets all email templates.

```javascript
var result = emailHandler.getTemplates({ pageSize: 20 });
```

---

## AssetHandler

### Purpose
Manage all Content Builder assets (images, documents, blocks, etc.).

### Dependencies
```javascript
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_SFMCIntegration")=%%
%%=ContentBlockByKey("OMG_AssetHandler")=%%
```

### Methods

#### `list(options)`
Lists assets with filtering.

```javascript
var assetHandler = new AssetHandler(sfmc);

// List all assets
var result = assetHandler.list();

// List by type
var result = assetHandler.list({
    assetType: 'htmlblock'
});
```

#### `get(assetId)`
Gets asset by ID.

```javascript
var result = assetHandler.get(67890);
```

#### `create(assetData)`
Creates new asset.

```javascript
var result = assetHandler.create({
    name: 'My Content Block',
    assetType: { id: 220 },  // Code snippet block
    content: '<h1>Hello World</h1>'
});
```

#### `update(assetId, assetData)`
Updates asset.

```javascript
var result = assetHandler.update(67890, {
    content: '<h1>Updated Content</h1>'
});
```

#### `getByType(assetType, options)`
Filters assets by type.

```javascript
// Get all HTML emails
var result = assetHandler.getByType('htmlemail');

// Get all templates
var result = assetHandler.getByType('template-email');
```

#### `search(searchTerm, options)`
Searches assets by name.

```javascript
var result = assetHandler.search('Welcome');
```

---

## DataExtensionHandler

### Purpose
CRUD operations on Data Extensions with dual strategy (SSJS + REST API).

### Dependencies
```javascript
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_SFMCIntegration")=%%
%%=ContentBlockByKey("OMG_DataExtensionHandler")=%%
```

### Dual Strategy
1. **Native SSJS** (tried first - faster for non-enterprise DEs)
2. **REST API** (fallback - works with all DEs)

### Methods

#### `query(dataExtensionKey, options)`
Queries Data Extension rows.

```javascript
var deHandler = new DataExtensionHandler(sfmc);

// Get all rows
var result = deHandler.query('MyDataExtension');

// Get with filter
var result = deHandler.query('MyDataExtension', {
    filter: {
        columns: ['EmailAddress'],
        values: ['user@example.com']
    }
});

// Get with pagination
var result = deHandler.query('MyDataExtension', {
    pageSize: 100,
    page: 1
});
```

#### `insertRow(dataExtensionKey, rowData)`
Inserts new row.

```javascript
var result = deHandler.insertRow('Subscribers', {
    EmailAddress: 'new@example.com',
    FirstName: 'Jane',
    LastName: 'Smith',
    SubscriberKey: 'new@example.com'
});
```

#### `updateRow(dataExtensionKey, rowData)`
Updates existing row.

```javascript
var result = deHandler.updateRow('Subscribers', {
    EmailAddress: 'user@example.com',  // Primary key
    FirstName: 'John Updated'
});
```

#### `deleteRow(dataExtensionKey, primaryKeyValues)`
Deletes row.

```javascript
var result = deHandler.deleteRow('Subscribers', {
    EmailAddress: 'user@example.com'
});
```

#### `upsertRow(dataExtensionKey, rowData)`
Inserts or updates (tries update first, then insert).

```javascript
var result = deHandler.upsertRow('Subscribers', {
    EmailAddress: 'user@example.com',
    FirstName: 'John',
    LastName: 'Doe'
});
```

#### `getStructure(dataExtensionKey)`
Gets Data Extension schema.

```javascript
var result = deHandler.getStructure('Subscribers');
if (result.success) {
    Write('Fields: ' + Stringify(result.data.parsedContent.fields));
}
```

#### `clearRows(dataExtensionKey)` ⚠️
Deletes ALL rows from Data Extension.

```javascript
// ⚠️ DANGEROUS - Deletes all data!
var result = deHandler.clearRows('TempDataExtension');
```

---

## FolderHandler

### Purpose
Manage Content Builder folder structure.

### Dependencies
```javascript
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_SFMCIntegration")=%%
%%=ContentBlockByKey("OMG_FolderHandler")=%%
```

### Methods

#### `list(options)`
Lists all folders.

```javascript
var folderHandler = new FolderHandler(sfmc);
var result = folderHandler.list();
```

#### `get(folderId)`
Gets folder by ID.

```javascript
var result = folderHandler.get(12345);
```

#### `create(folderData)`
Creates new folder.

```javascript
var result = folderHandler.create({
    name: 'Email Templates',
    parentId: 0  // 0 = root folder
});

// Create subfolder
var result = folderHandler.create({
    name: 'Welcome Series',
    parentId: 12345  // Parent folder ID
});
```

#### `update(folderId, folderData)`
Updates folder.

```javascript
var result = folderHandler.update(12345, {
    name: 'Renamed Folder'
});
```

#### `getChildFolders(parentFolderId)`
Gets child folders.

```javascript
// Get root folders
var result = folderHandler.getChildFolders(0);

// Get subfolders
var result = folderHandler.getChildFolders(12345);
```

#### `move(folderId, newParentId)`
Moves folder to different parent.

```javascript
// Move to root
var result = folderHandler.move(67890, 0);

// Move to another folder
var result = folderHandler.move(67890, 12345);
```

#### `getPath(folderId)`
Gets full path from root to folder.

```javascript
var result = folderHandler.getPath(67890);
if (result.success) {
    Write('Path: ' + result.data.path);
    // Output: /Email Templates/Welcome Series
}
```

---

## JourneyHandler

### Purpose
Manage Journey Builder journeys.

### Dependencies
```javascript
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_SFMCIntegration")=%%
%%=ContentBlockByKey("OMG_JourneyHandler")=%%
```

### Methods

#### `list(options)`
Lists all journeys.

```javascript
var journeyHandler = new JourneyHandler(sfmc);
var result = journeyHandler.list();
```

#### `get(journeyId)`
Gets journey by ID.

```javascript
var result = journeyHandler.get('journey-uuid-123');
```

#### `create(journeyData)`
Creates new journey.

```javascript
var result = journeyHandler.create({
    name: 'Welcome Journey',
    description: 'New subscriber onboarding',
    // ... journey configuration
});
```

#### `update(journeyId, journeyData)`
Updates journey.

```javascript
var result = journeyHandler.update('journey-uuid-123', {
    name: 'Updated Journey Name'
});
```

#### `publish(journeyId)`
Starts journey.

```javascript
var result = journeyHandler.publish('journey-uuid-123');
```

#### `stop(journeyId)`
Stops running journey.

```javascript
var result = journeyHandler.stop('journey-uuid-123');
```

#### `getVersion(journeyId, version)`
Gets specific journey version.

```javascript
var result = journeyHandler.getVersion('journey-uuid-123', 2);
```

#### `getStats(journeyId)`
Gets journey statistics.

```javascript
var result = journeyHandler.getStats('journey-uuid-123');
if (result.success) {
    Write('Total contacts: ' + result.data.parsedContent.totalContacts);
}
```

---

## Error Handling Best Practices

### Always Check Success

```javascript
var result = emailHandler.list();

if (result.success) {
    // Success path
    var items = result.data.items;
} else {
    // Error path
    Write('Error Code: ' + result.error.code);
    Write('Error Message: ' + result.error.message);
}
```

### Handle Specific Error Types

```javascript
if (!result.success) {
    switch (result.error.code) {
        case 'VALIDATION_ERROR':
            Write('Validation failed: ' + result.error.details.field);
            break;
        case 'AUTH_ERROR':
            Write('Authentication failed - check credentials');
            break;
        case 'HTTP_ERROR':
            Write('API error: ' + result.error.details.statusCode);
            break;
        default:
            Write('Unknown error: ' + result.error.message);
    }
}
```

---

## Complete Example: Email Workflow

```javascript
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_DataExtensionTokenCache")=%%
%%=ContentBlockByKey("OMG_OAuth2AuthStrategy")=%%
%%=ContentBlockByKey("OMG_BaseIntegration")=%%
%%=ContentBlockByKey("OMG_SFMCIntegration")=%%
%%=ContentBlockByKey("OMG_EmailHandler")=%%
%%=ContentBlockByKey("OMG_FolderHandler")=%%

<script runat="server">
Platform.Load("core", "1.1.1");

// Initialize SFMC integration
var sfmc = new SFMCIntegration({
    clientId: Variable.GetValue('@ClientId'),
    clientSecret: Variable.GetValue('@ClientSecret'),
    authBaseUrl: Variable.GetValue('@AuthBaseUrl')
});

// Create handlers
var emailHandler = new EmailHandler(sfmc);
var folderHandler = new FolderHandler(sfmc);

// Step 1: Create folder
Write('<h3>Creating Folder...</h3>');
var folderResult = folderHandler.create({
    name: 'Automated Emails',
    parentId: 0
});

if (!folderResult.success) {
    Write('Folder creation failed: ' + folderResult.error.message);
} else {
    var folderId = folderResult.data.parsedContent.id;
    Write('Folder created with ID: ' + folderId);

    // Step 2: Create email in that folder
    Write('<h3>Creating Email...</h3>');
    var emailResult = emailHandler.create({
        name: 'Welcome Email v1',
        category: { id: folderId },
        htmlContent: '<html><body><h1>Welcome!</h1></body></html>',
        subject: 'Welcome to our platform',
        preheader: 'Thanks for joining us'
    });

    if (!emailResult.success) {
        Write('Email creation failed: ' + emailResult.error.message);
    } else {
        var emailId = emailResult.data.parsedContent.id;
        Write('Email created with ID: ' + emailId);

        // Step 3: Update email
        Write('<h3>Updating Email...</h3>');
        var updateResult = emailHandler.update(emailId, {
            name: 'Welcome Email v2',
            htmlContent: '<html><body><h1>Welcome!</h1><p>Updated content</p></body></html>'
        });

        if (updateResult.success) {
            Write('Email updated successfully!');
        }
    }
}
</script>
```

---

## Testing Handlers

Use the test files to verify handlers work without real API calls:

```javascript
%%=ContentBlockByKey("OMG_Test_EmailHandler")=%%
```

This will run 11 unit tests validating:
- Initialization
- Validation logic
- Method signatures
- Error handling

---

## Performance Tips

### 1. Reuse SFMC Integration Instance

```javascript
// ✅ GOOD - One SFMC instance, multiple handlers
var sfmc = new SFMCIntegration(config);
var emailHandler = new EmailHandler(sfmc);
var assetHandler = new AssetHandler(sfmc);
var deHandler = new DataExtensionHandler(sfmc);

// ❌ BAD - Multiple SFMC instances
var emailHandler = new EmailHandler(new SFMCIntegration(config));
var assetHandler = new AssetHandler(new SFMCIntegration(config));
```

### 2. Token Caching Works Automatically

```javascript
// First call gets token from API (~500ms)
var result1 = emailHandler.list();

// Second call reuses cached token from DE (~10ms)
var result2 = assetHandler.list();

// No manual token management needed!
```

### 3. Use Batch Operations When Possible

```javascript
// ❌ BAD - Multiple individual inserts
for (var i = 0; i < 100; i++) {
    deHandler.insertRow('DE', { Email: 'user' + i + '@test.com' });
}

// ✅ GOOD - Use REST API bulk insert or SSJS batch
// (Implementation depends on use case)
```

---

## Troubleshooting

### "SFMCIntegration instance is required"

**Cause**: Handler created without SFMC integration

**Solution**:
```javascript
// Create SFMC integration first
var sfmc = new SFMCIntegration(config);

// Then pass to handler
var handler = new EmailHandler(sfmc);
```

### "Validation Error: X is required"

**Cause**: Missing required parameters

**Solution**: Check method documentation for required fields

### "Token expired"

**Cause**: Token cache expired or invalid

**Solution**:
```javascript
// Clear token cache
sfmc.clearTokenCache();

// Next call will get fresh token
var result = handler.list();
```

---

## Summary

Handlers provide:
- ✅ Focused, specialized functionality
- ✅ Consistent error handling
- ✅ Automatic authentication (via SFMCIntegration)
- ✅ Validation logic
- ✅ Standardized responses

**Pattern**: Create SFMC Integration → Create Handler → Use Methods → Check Results

**All handlers share same `sfmc` instance for optimal performance.**
