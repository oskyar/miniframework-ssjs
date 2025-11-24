# Gemini Code Assistant Context

## Project Overview

This project is the **OmegaFramework v2.0**, a Server-Side JavaScript (SSJS) framework for **Salesforce Marketing Cloud (SFMC)**. It is a "clean architecture" redesign, built from the ground up to be modular, maintainable, and performant.

The framework provides a structured and robust way to interact with SFMC and other external APIs by applying modern development principles like SOLID and design patterns within the constraints of the SSJS environment.

### Key Architectural Principles

*   **Layered Architecture:** The framework is divided into distinct layers:
    *   **Core:** Foundational components for HTTP requests, response standardization, and the key token caching mechanism.
    *   **Auth:** A set of authentication strategies (OAuth2, Basic, Bearer) that can be plugged into any integration, following the Strategy pattern.
    *   **Integrations:** Connectors to external systems (like SFMC, Veeva, Data Cloud), built upon a consistent `BaseIntegration` class (Template Method pattern).
    *   **Handlers:** High-level, SFMC-specific wrappers that provide a simplified API for common operations (e.g., managing Assets, Data Extensions).
*   **Dependency Injection:** Components are designed to receive their dependencies (like `ConnectionHandler`) upon instantiation, making the system flexible and easy to test.
*   **Data Extension Token Caching:** This is the cornerstone of the framework's performance strategy. It solves the stateless nature of SFMC script executions by persisting OAuth2 tokens in a Data Extension (`OMG_FW_TokenCache`). This dramatically reduces the number of expensive authentication API calls, preventing rate-limiting and speeding up automations.

## Building and Running

This is an SSJS library, so there is no local "build" or "run" command. The code is meant to be deployed and executed entirely within the Salesforce Marketing Cloud platform.

### Deployment Process

The framework is deployed by creating a series of **Content Blocks** in SFMC's Content Builder.

1.  **Create the Token Cache Data Extension:** Before using the framework, a Data Extension, typically named `OMG_FW_TokenCache`, must be created. The `install/CreateTokenCacheDE.ssjs` script can be used to automate this. The required schema is detailed in `docs/README.md`.

2.  **Deploy Core & Auth Files:** The files from `core/` and `auth/` must be copied into their own "Code Snippet" Content Blocks. A standard naming convention is `OMG_<FileName>`, for example:
    *   `OMG_ResponseWrapper`
    *   `OMG_ConnectionHandler`
    *   `OMG_DataExtensionTokenCache`
    *   `OMG_OAuth2AuthStrategy`

3.  **Deploy Integration Files:** The `integrations/BaseIntegration.ssjs` file and any specific integration files (like `integrations/SFMCIntegration.ssjs`) are deployed as Content Blocks.
    *   `OMG_BaseIntegration`
    *   `OMG_SFMCIntegration`

4.  **Deploy Handler Files (Optional):** If using the high-level handlers, deploy the files from `handlers/` as Content Blocks.
    *   `OMG_AssetHandler`
    *   `OMG_DataExtensionHandler`

### Running (Usage in an SFMC Script Activity or CloudPage)

To use the framework, the necessary Content Blocks are loaded at the beginning of a script using `ContentBlockByKey()`.

**Example: Retrieving assets from SFMC**
```javascript
// 1. Load all framework dependencies from Content Builder
%%=ContentBlockByKey("OMG_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_DataExtensionTokenCache")=%%
%%=ContentBlockByKey("OMG_OAuth2AuthStrategy")=%%
%%=ContentBlockByKey("OMG_BaseIntegration")=%%
%%=ContentBlockByKey("OMG_SFMCIntegration")=%%

<script runat="server">
Platform.Load("core", "1.1.1");

try {
    // 2. Configure the SFMC Integration with credentials
    var sfmcConfig = {
        clientId: "YOUR_CLIENT_ID",
        clientSecret: "YOUR_CLIENT_SECRET",
        authBaseUrl: "https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/"
    };

    // 3. Instantiate the integration.
    // The framework will automatically handle token acquisition and caching.
    var sfmc = new SFMCIntegration(sfmcConfig);

    // 4. Use the integration to make API calls.
    var result = sfmc.listAssets({ pageSize: 10 });

    if (result.success) {
        Write("Successfully retrieved " + result.data.items.length + " assets.");
    } else {
        Write("Error: " + Stringify(result.error));
    }

} catch (e) {
    Write("A critical error occurred: " + Stringify(e));
}
</script>
```

## Development Conventions

*   **Modularity:** Each file and "class" has a single, well-defined responsibility.
*   **Error Handling:** All public methods return a standardized `ResponseWrapper` object (`{ success: boolean, data: any, error: object }`). This forces developers to handle potential failures explicitly.
*   **No Global Scope Pollution:** All logic is encapsulated within constructor functions, which act as classes.
*   **SSJS Core Library Only:** The code correctly relies on the standard `Platform.Load("core", "1.1.1")` functions and avoids using browser-specific or non-existent APIs.
*   **Testing:** The project includes a comprehensive `tests/` directory where each component is tested in isolation. These tests use **mock objects** for dependencies, allowing for validation of business logic without making real API calls. Tests are designed to be run in CloudPages.
*   **Documentation:** The code is well-documented with JSDoc-style comments, and the project includes extensive Markdown documentation explaining the architecture, deployment, and usage patterns.
