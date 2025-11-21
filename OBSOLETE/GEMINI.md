# OmegaFramework: Gemini Code Companion

## Project Overview

This repository contains **OmegaFramework**, a lightweight Server-Side JavaScript (SSJS) framework for Salesforce Marketing Cloud (SFMC). It is inspired by the `ssjs-lib` library by EMAIL360 and is designed to simplify common development tasks on the SFMC platform.

A new, completely refactored, and production-ready architecture (v2.0) is available in the `new-architecture/` directory. This new architecture is designed with SOLID principles, zero code duplication, and a focus on performance and maintainability.

**Core Features (v2.0):**

*   **Data Extension Token Caching:** The most significant innovation is the use of a Data Extension to cache OAuth2 tokens, drastically reducing the number of authentication API calls.
*   **Strategy Pattern for Authentication:** Authentication is handled by a flexible strategy pattern, allowing for different authentication methods (OAuth2, Basic, Bearer) to be used with any integration.
*   **Modular and Extensible:** The framework is highly modular, with a clear separation of concerns between the core layer, authentication strategies, and integrations. A `BaseIntegration` class provides a template for creating new integrations.
*   **SOLID Principles:** The new architecture is designed from the ground up following SOLID principles, resulting in a more maintainable and robust codebase.
*   **Rich Set of Integrations:** The framework includes pre-built integrations for SFMC, Salesforce Data Cloud, Veeva CRM, and Veeva Vault.

**Key Technologies:**

*   **Server-Side JavaScript (SSJS):** The core language of the framework.
*   **Salesforce Marketing Cloud:** The target platform for this framework.
*   **JSON:** Used for configuration.

## Building and Running (v2.0)

The framework is a collection of SSJS files that are meant to be used within the Salesforce Marketing Cloud environment.

**Installation in SFMC:**

1.  **Create the Token Cache Data Extension:** Before using the framework, you must create the `OMG_FW_TokenCache` Data Extension. You can do this manually or by using the `new-architecture/install/CreateTokenCacheDE.ssjs` script.
2.  **Deploy Content Blocks:** Deploy the necessary files from the `new-architecture/` subdirectories (`core/`, `auth/`, `integrations/`) as Content Blocks in SFMC Content Builder.
3.  **Use in Your Code:** Load the required Content Blocks in your SSJS script and instantiate the desired integration.

**Testing:**

The `new-architecture/tests/` directory contains test files for each component of the framework. These can be used to validate the functionality of the framework in an SFMC environment.

## Development Conventions (v2.0)

*   **SOLID Principles:** The framework is designed with SOLID principles in mind.
*   **Design Patterns:** The framework makes extensive use of design patterns, including the Strategy pattern for authentication, the Template Method pattern for integrations, the Repository pattern for the token cache, and Dependency Injection.
*   **Modularity:** The framework is highly modular, with a clear separation of concerns.
*   **Error Handling:** The `ResponseWrapper` class provides a standardized approach to handling responses and errors.
*   **File Naming:** Files are organized into directories based on their functionality (`core`, `auth`, `integrations`).

## Key Files (v2.0)

*   `new-architecture/core/`: Contains the core components of the framework, including the `ConnectionHandler`, `DataExtensionTokenCache`, and `ResponseWrapper`.
*   `new-architecture/auth/`: Contains the authentication strategies (`OAuth2AuthStrategy`, `BasicAuthStrategy`, `BearerAuthStrategy`).
*   `new-architecture/integrations/`: Contains the integration classes (`BaseIntegration`, `SFMCIntegration`, `DataCloudIntegration`, etc.).
*   `new-architecture/install/`: Contains installation scripts.
*   `new-architecture/tests/`: Contains test files.
*   `new-architecture/README.md`: Provides a comprehensive overview of the new architecture.
*   `new-architecture/ARCHITECTURE_SUMMARY.md`: Provides a detailed breakdown of the new architecture.

## Old Architecture

The original version of the framework is located in the `src/` directory. While it is still functional, the new architecture in `new-architecture/` is recommended for all new projects due to its superior design and performance.