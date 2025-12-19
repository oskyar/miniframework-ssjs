# OmegaFramework Tests

Este directorio contiene todos los tests del framework organizados por categoría.

## Estructura de Tests

```
tests/
├── core/              # Tests para módulos principales
│   ├── Test_ResponseWrapper.ssjs
│   ├── Test_ConnectionHandler.ssjs
│   └── Test_DataExtensionTokenCache.ssjs
│
├── auth/              # Tests para estrategias de autenticación
│   ├── Test_BasicAuthStrategy.ssjs
│   ├── Test_BearerAuthStrategy.ssjs
│   └── Test_OAuth2AuthStrategy.ssjs
│
├── handlers/          # Tests para handlers de SFMC
│   ├── Test_AssetHandler.ssjs
│   ├── Test_DataExtensionHandler.ssjs
│   ├── Test_EmailHandler.ssjs
│   ├── Test_FolderHandler.ssjs
│   └── Test_JourneyHandler.ssjs
│
└── integrations/      # Tests para integraciones externas
    ├── Test_BaseIntegration.ssjs
    ├── Test_SFMCIntegration.ssjs
    ├── Test_DataCloudIntegration.ssjs
    ├── Test_VeevaCRMIntegration.ssjs
    └── Test_VeevaVaultIntegration.ssjs
```

## Tipos de Tests

### Tests de Core (`core/`)
Tests para componentes fundamentales del framework:
- **ResponseWrapper**: Envoltorio de respuestas estandarizado
- **ConnectionHandler**: Manejador HTTP con reintentos
- **DataExtensionTokenCache**: Cache de tokens en Data Extensions

### Tests de Auth (`auth/`)
Tests para estrategias de autenticación:
- **BasicAuthStrategy**: Autenticación HTTP Basic
- **BearerAuthStrategy**: Autenticación Bearer Token
- **OAuth2AuthStrategy**: Autenticación OAuth2 con cache

### Tests de Handlers (`handlers/`)
Tests para handlers de SFMC que utilizan SFMCIntegration:
- **AssetHandler**: Gestión de assets en Content Builder
- **DataExtensionHandler**: Operaciones en Data Extensions
- **EmailHandler**: Gestión de emails
- **FolderHandler**: Gestión de carpetas
- **JourneyHandler**: Operaciones en Journey Builder

**Nota**: Todos los handlers reciben una instancia de `SFMCIntegration` en su constructor.

### Tests de Integrations (`integrations/`)
Tests para integraciones con sistemas externos:
- **BaseIntegration**: Clase base para todas las integraciones
- **SFMCIntegration**: Integración con Salesforce Marketing Cloud
- **DataCloudIntegration**: Integración con Salesforce Data Cloud
- **VeevaCRMIntegration**: Integración con Veeva CRM
- **VeevaVaultIntegration**: Integración con Veeva Vault

## Cómo Ejecutar los Tests

### 1. Tests de Core y Auth
Estos tests se pueden ejecutar sin credenciales ya que prueban la lógica interna:
- Accede a la URL de la página de CloudPage donde esté el test
- Los resultados se mostrarán directamente en el navegador

### 2. Tests de Handlers
Estos tests requieren credenciales de SFMC:
1. Accede a la URL del test
2. Ingresa tus credenciales:
   - Client ID
   - Client Secret
   - Auth Base URL (e.g., `https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/`)
3. Envía el formulario para ejecutar los tests

### 3. Tests de Integrations
- **SFMCIntegration**: Requiere credenciales OAuth2 de SFMC
- **DataCloudIntegration**: Requiere credenciales de Data Cloud
- **VeevaCRMIntegration**: Requiere credenciales de Veeva CRM (Salesforce)
- **VeevaVaultIntegration**: Requiere token de sesión de Veeva Vault

## Requisitos Previos

### Para Tests de SFMC
1. Crear un Installed Package en SFMC Setup
2. Configurar permisos de API REST
3. Obtener Client ID y Client Secret

### Para Tests de Data Cloud
1. Instancia de Salesforce Data Cloud
2. Connected App con acceso API
3. Credenciales OAuth2

### Para Tests de Veeva
1. Instancia de Veeva CRM o Vault
2. Credenciales válidas
3. Permisos de API habilitados

## Content Blocks Requeridos

Cada test carga sus dependencias mediante `ContentBlockByName`. Asegúrate de tener estos Content Blocks configurados en SFMC:

### Core
- `OMG_FW_ResponseWrapper`
- `OMG_FW_ConnectionHandler`
- `OMG_FW_DataExtensionTokenCache`

### Auth
- `OMG_FW_BasicAuthStrategy`
- `OMG_FW_BearerAuthStrategy`
- `OMG_FW_OAuth2AuthStrategy`

### Handlers
- `OMG_FW_AssetHandler`
- `OMG_FW_DataExtensionHandler`
- `OMG_FW_EmailHandler`
- `OMG_FW_FolderHandler`
- `OMG_FW_JourneyHandler`

### Integrations
- `OMG_FW_BaseIntegration`
- `OMG_FW_SFMCIntegration`
- `OMG_FW_DataCloudIntegration`
- `OMG_FW_VeevaCRMIntegration`
- `OMG_FW_VeevaVaultIntegration`

## Interpretación de Resultados

Los tests muestran resultados con el siguiente formato:
- ✅ **PASS**: El test pasó correctamente
- ❌ **FAIL**: El test falló
- ⚠️ **SKIP**: El test fue omitido (usualmente por falta de datos)

Al final de cada test se muestra un resumen:
- Total de tests ejecutados
- Tests que pasaron
- Tests que fallaron
- Porcentaje de éxito

## Notas Importantes

1. **Arquitectura Actualizada**: Los handlers ahora reciben una instancia de `SFMCIntegration` en lugar de configuración directa
2. **Referencias Corregidas**: Se eliminaron referencias a módulos obsoletos (AuthHandler, BaseHandler, LogHandler, Settings)
3. **Nueva Estructura**: Los tests están organizados para reflejar la estructura del código fuente
4. **Cobertura Completa**: Todos los módulos principales ahora tienen tests

## Versionado

**Versión**: 2.0.0
**Fecha**: 2025
**Autor**: OmegaFramework

## Soporte

Para reportar problemas o sugerencias con los tests, contacta al equipo de desarrollo
