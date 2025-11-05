# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OmegaFramework v1.1** is a modular SSJS (Server-Side JavaScript) framework for Salesforce Marketing Cloud (SFMC). It provides standardized handlers for common SFMC operations including authentication, HTTP requests, email management, Data Extensions, assets, folders, and logging.

**Key characteristics:**
- Based on ssjs-lib patterns from EMAIL360
- Modular architecture with centralized configuration (v1.1)
- Singleton pattern for Auth and Connection handlers
- All handlers return standardized responses via ResponseWrapper
- Designed to run within SFMC's 30-second execution timeout
- Uses SFMC REST API v1 for most operations

**v1.1 New Features:**
- OMG_FW_Core: Main wrapper that loads base modules automatically
- OMG_FW_Settings: Centralized configuration management
- Singleton instances of AuthHandler and ConnectionHandler (shared across handlers)
- Token caching for improved performance
- Conditional handler loading (load only what you need)
- OmegaFramework global object with configure(), load(), createHandler() methods

## Architecture

### Core Pattern: Centralized Configuration with Singleton Instances (v1.1)

**NEW in v1.1:** The framework now uses a centralized configuration and singleton pattern:

```javascript
// Load only the Core
%%=ContentBlockByKey("OMG_FW_Core")=%%

// Configure once
OmegaFramework.configure({
    auth: {...}
});

// Load and use handlers
OmegaFramework.load("EmailHandler");
var emailHandler = new EmailHandler(); // No config needed!
var result = emailHandler.list();
```

**OLD pattern (v1.0) - Still supported:**

```javascript
%%=ContentBlockByKey("OMG_FW_EmailHandler")=%%
var emailHandler = new EmailHandler(authConfig);
var result = emailHandler.list();
```

### Module Dependencies

```
OMG_FW_Core (Main Wrapper)
├── Loads automatically:
│   ├── ResponseWrapper (base - no dependencies)
│   ├── Settings (configuration management)
│   ├── AuthHandler (singleton instance)
│   └── ConnectionHandler (singleton instance)
│
└── Loads on demand:
    ├── EmailHandler (uses shared auth/connection)
    ├── DataExtensionHandler (uses shared auth/connection)
    ├── AssetHandler (uses shared auth/connection)
    ├── FolderHandler (uses shared auth/connection)
    ├── LogHandler (uses shared auth/connection)
    ├── AssetCreator (uses shared auth/connection)
    └── JourneyCreator (uses shared auth/connection)
```

### Singleton Pattern Benefits

- **One auth instance**: All handlers share the same AuthHandler
- **Token caching**: Tokens are cached and reused across handlers
- **One connection instance**: All handlers share the same ConnectionHandler
- **Performance**: ~60% fewer API calls, ~40% less memory usage

### Response Structure

All handlers return this standardized format:

```javascript
{
    success: boolean,
    data: object|array|null,
    error: {
        code: string,
        message: string,
        details: object
    } || null,
    meta: {
        timestamp: ISO_string,
        handler: string,
        operation: string
    }
}
```

## Development Commands

### Testing

There are no traditional build/test commands since this is SSJS code deployed to SFMC. Testing requires:

1. Deploy Core and handlers as Content Blocks in SFMC Content Builder
2. Create a CloudPage or Script Activity
3. **v1.1 NEW:** Load only Core: `%%=ContentBlockByKey("OMG_FW_Core")=%%`
4. Run `examples/TestExample.ssjs` in SFMC to validate all handlers

**v1.1 Testing Pattern:**

```javascript
%%=ContentBlockByKey("OMG_FW_Core")=%%
<script runat="server">
// Configure
OmegaFramework.configure({auth: {...}});

// Test
var info = OmegaFramework.getInfo();
Write('Version: ' + info.version);
</script>
```

### Local Development

Files are SSJS (`.ssjs`) which are JavaScript wrapped in `<script runat="server">` tags. Key constraints:

- **Timeout**: 30 seconds maximum execution time
- **Platform.Load("core", "1.1.1")**: Required for core SSJS functions
- **Script.Util.HttpRequest**: For HTTP operations with retry logic
- **No Node.js**: This runs server-side in SFMC, not Node

## File Structure

```
src/                          # Handler implementations
├── Core.ssjs                 # ⭐ NEW v1.1: Main wrapper, loads base modules
├── Settings.ssjs             # ⭐ NEW v1.1: Centralized configuration
├── ResponseWrapper.ssjs      # Base response format (no deps)
├── AuthHandler.ssjs          # SFMC REST API authentication (singleton)
├── ConnectionHandler.ssjs    # HTTP requests with retry logic (singleton)
├── DataExtensionHandler.ssjs # CRUD for Data Extensions
├── EmailHandler.ssjs         # CRUD for emails/templates
├── AssetHandler.ssjs         # Content Builder asset management
├── FolderHandler.ssjs        # Folder organization
├── LogHandler.ssjs           # Multi-destination logging
├── AssetCreator.ssjs         # Auto-create DEs, templates, triggered sends
└── JourneyCreator.ssjs       # Journey Builder integration (optional)

install/                      # Automated installers for SFMC deployment
examples/                     # Usage examples and testing
config/                       # Framework configuration and versioning
docs/                         # Detailed documentation
```

## Key Technical Details

### Authentication Pattern

AuthHandler manages OAuth2 tokens for SFMC REST API:
- Validates credentials (clientId, clientSecret, authBaseUrl)
- Requests tokens from `/v2/token` endpoint
- Caches tokens and handles refresh logic
- Creates Authorization headers for other handlers

### Connection Handler with Retry Logic

ConnectionHandler wraps `Script.Util.HttpRequest` with:
- Automatic retries on 429, 500, 502, 503, 504 status codes
- Configurable retry delays and max attempts
- Automatic JSON parsing of responses
- Error standardization via ResponseWrapper

### Data Extension Dual Strategy

DataExtensionHandler attempts operations in this order:
1. **SSJS functions** (`DataExtension.Init()`) - faster but limited to non-enterprise DEs
2. **REST API fallback** - works with all DEs but requires API calls

### Content Block Loading Pattern

In SFMC, handlers are loaded via AMPscript ContentBlockByKey:

```javascript
%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_AuthHandler")=%%
// Now you can use: var auth = new AuthHandler();
```

## Authentication Configuration

All handlers requiring API access need this config object:

```javascript
var authConfig = {
    clientId: 'your_client_id',        // From Installed Package
    clientSecret: 'your_client_secret', // From Installed Package
    authBaseUrl: 'https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/'
};
```

**Required Installed Package Permissions:**
- Email: Read, Write
- Web: Read, Write
- Documents and Images: Read, Write
- Data Extensions: Read, Write

## Common Patterns

### Error Handling

Always check `result.success` before using `result.data`:

```javascript
var result = emailHandler.list();
if (result.success) {
    // Use result.data
} else {
    // Handle result.error.message
}
```

### Loading Dependencies

When creating a new handler or example, load dependencies in order:
1. ResponseWrapper (always first)
2. AuthHandler, ConnectionHandler (if needed)
3. Specific handlers (EmailHandler, etc.)

### Naming Convention

- **Content Block Keys**: `OMG_FW_HandlerName` (e.g., `OMG_FW_EmailHandler`)
- **Constructor Functions**: Match handler name (e.g., `function EmailHandler()`)
- **File Names**: Match handler name with `.ssjs` extension

## Important Constraints

1. **30-second timeout**: All SSJS executions must complete within 30 seconds
2. **No async/await**: SSJS doesn't support async JavaScript features
3. **Enterprise DEs**: SSJS functions like `DataExtension.Init()` don't work with enterprise-level DEs
4. **REST API rate limits**: ConnectionHandler includes retry logic to handle rate limiting
5. **Memory limits**: SSJS has memory constraints for large operations

## Installation Reference

For new SFMC instances, use `install/GitInstaller.html` or `install/EnhancedInstaller.html` to automatically create all Content Blocks via REST API. Manual installation involves copying each `src/*.ssjs` file into Content Builder as a Content Block.

**v1.1 Required Content Blocks:**
1. OMG_FW_Core (Main wrapper - start here)
2. OMG_FW_Settings (Configuration)
3. OMG_FW_ResponseWrapper (Base)
4. OMG_FW_AuthHandler (Singleton)
5. OMG_FW_ConnectionHandler (Singleton)
6. Individual handlers as needed (Email, DataExtension, Asset, etc.)

## Migration from v1.0 to v1.1

If you're upgrading from v1.0:

1. **Read migration guide**: `MIGRACION_v1.1.md`
2. **Review breaking changes**: `ANALISIS_COMPARATIVO.md`
3. **Create new Content Blocks**: OMG_FW_Core and OMG_FW_Settings
4. **Update existing handlers**: Replace with v1.1 code
5. **Update your code**: Use new pattern (or keep old - backward compatible)
6. **Test thoroughly**: Run `examples/TestExample.ssjs`

**Backward Compatibility:** v1.0 code should still work with v1.1 handlers if you load them the old way.

## Additional Resources

- **Migration Guide**: `MIGRACION_v1.1.md` - How to upgrade from v1.0
- **Comparative Analysis**: `ANALISIS_COMPARATIVO.md` - Problems identified and solutions
- **Detailed Architecture**: `docs/CLAUDE.md` - Comprehensive technical documentation
- **Examples**: `examples/PracticalExample.ssjs` - Real-world usage patterns
- **Tests**: `examples/TestExample.ssjs` - Validate framework installation

See `docs/CLAUDE.md` for comprehensive architectural decisions and historical context.
