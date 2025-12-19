# OmegaFramework v1.0 - Best Practices & Complete Reference

Este documento establece las mejores prácticas definitivas para trabajar con OmegaFramework en Salesforce Marketing Cloud (SFMC). Usar este archivo como contexto garantiza implementaciones consistentes y correctas.

---

## 1. RESTRICCIONES SSJS/ES3 (CRÍTICO)

SFMC usa **Jint** (motor ES3). El código moderno NO funciona.

### Prohibido (causará errores):
```javascript
// ❌ NUNCA usar:
const x = 1;                    // usar: var x = 1;
let y = 2;                      // usar: var y = 2;
() => {}                        // usar: function() {}
`template ${var}`               // usar: 'string ' + var
class MyClass {}                // usar: function MyClass() {}
{ a, b } = obj                  // usar: var a = obj.a;
[...array]                      // usar: bucle manual
array.find()                    // usar: bucle for
array.includes()                // usar: indexOf !== -1
array.map()                     // usar: bucle for
array.filter()                  // usar: bucle for
async/await                     // usar: callbacks sincronos
```

### Obligatorio:
```javascript
// ✅ SIEMPRE usar:
<script runat="server">
Platform.Load("core", "1.1.1");

function MiModulo(config) {
    var self = this;
    var handler = 'MiModulo';

    // Funciones privadas
    function funcionPrivada() { }

    // Métodos públicos
    this.metodoPublico = function() {
        return funcionPrivada();
    };
}
</script>
```

---

## 2. CARGA DE DEPENDENCIAS

### ❌ INCORRECTO - Cargar todas las dependencias manualmente:
```javascript
Platform.Function.ContentBlockByName("OMG_FW_OmegaFramework");
Platform.Function.ContentBlockByName("OMG_FW_ResponseWrapper");
Platform.Function.ContentBlockByName("OMG_FW_ConnectionHandler");
Platform.Function.ContentBlockByName("OMG_FW_CredentialStore");
Platform.Function.ContentBlockByName("OMG_FW_SFMCIntegration");
// ¡NO! OmegaFramework gestiona las dependencias automáticamente
```

### ✅ CORRECTO - Solo cargar OmegaFramework:
```javascript
<script runat="server">
Platform.Load("core", "1.1.1");

// SOLO cargar OmegaFramework - él gestiona todo lo demás
Platform.Function.ContentBlockByName("OMG_FW_OmegaFramework");

// Las dependencias se cargan automáticamente via blockKey
var sfmc = OmegaFramework.create('SFMCIntegration', { integrationName: 'SFMC_Production' });
</script>
```

---

## 3. PATRÓN DE INSTANCIACIÓN

### `.require()` vs `.create()`

| Método | Comportamiento | Usar para |
|--------|---------------|-----------|
| `.require()` | Singleton (cacheado) | Utilidades stateless: ResponseWrapper, ConnectionHandler |
| `.create()` | Factory (nueva instancia) | Componentes stateful: Integraciones, Handlers |

### Ejemplo:
```javascript
// ResponseWrapper es stateless - usar require (singleton)
var response = OmegaFramework.require('ResponseWrapper', {});

// SFMCIntegration mantiene estado (token) - usar create (nueva instancia)
var sfmc = OmegaFramework.create('SFMCIntegration', { integrationName: 'SFMC_Production' });

// DataExtensionHandler mantiene estado - usar create
var deHandler = OmegaFramework.create('DataExtensionHandler', {});
```

---

## 4. MODOS DE INICIALIZACIÓN

### Modo 1: CredentialStore (Producción - Recomendado)
```javascript
// Pasar nombre de integración como STRING
var sfmc = OmegaFramework.create('SFMCIntegration', {
    integrationName: 'SFMC_Production'  // Alias en OMG_FW_Credentials DE
});

var vault = OmegaFramework.create('VeevaVaultIntegration', {
    integrationName: 'VeevaVaultTestAmerHP'
});
```

### Modo 2: Configuración Directa (Desarrollo/Testing)
```javascript
// Pasar objeto de configuración completo
var sfmc = OmegaFramework.create('SFMCIntegration', {
    clientId: 'tu-client-id',
    clientSecret: 'tu-client-secret',
    authBaseUrl: 'https://TU_SUBDOMAIN.auth.marketingcloudapis.com/'
});

var vault = OmegaFramework.create('VeevaVaultIntegration', {
    username: 'usuario@empresa.com',
    password: 'contraseña',
    baseUrl: 'https://tu-vault.veevavault.com',
    authUrl: 'https://tu-vault.veevavault.com/api/v24.1/auth'
});
```

---

## 5. FORMATO DE RESPUESTA ESTÁNDAR

Todas las operaciones devuelven ResponseWrapper:

```javascript
{
    success: true/false,
    data: { ... },           // null si error
    error: {                 // null si success
        code: 'ERROR' | 'VALIDATION_ERROR' | 'AUTH_ERROR' | 'HTTP_ERROR' | 'NOT_FOUND',
        message: 'Descripción del error',
        details: { ... }
    },
    meta: {
        datetime: 1702732800000,
        handler: 'SFMCIntegration',
        operation: 'getToken'
    }
}
```

### Manejo correcto de respuestas:
```javascript
var result = sfmc.listAssets({ pageSize: 50 });

if (result.success) {
    var assets = result.data.items;
    for (var i = 0; i < assets.length; i++) {
        Write(assets[i].name + '\n');
    }
} else {
    Write('Error [' + result.error.code + ']: ' + result.error.message);

    // Manejo específico por tipo de error
    if (result.error.code === 'AUTH_ERROR') {
        // Credenciales inválidas
    } else if (result.error.code === 'HTTP_ERROR') {
        Write('Status: ' + result.error.details.statusCode);
    }
}
```

---

## 6. CATÁLOGO DE MÓDULOS

### Core (Fundación)

| Módulo | blockKey | Descripción |
|--------|----------|-------------|
| **OmegaFramework** | `OMG_FW_OmegaFramework` | Loader principal con DI |
| **ResponseWrapper** | `OMG_FW_ResponseWrapper` | Formato de respuesta estándar |
| **ConnectionHandler** | `OMG_FW_ConnectionHandler` | HTTP con retry automático |
| **CredentialStore** | `OMG_FW_CredentialStore` | Credenciales encriptadas |
| **DataExtensionTokenCache** | `OMG_FW_DataExtensionTokenCache` | Cache de tokens en DE |
| **WSProxyWrapper** | `OMG_FW_WSProxyWrapper` | Wrapper para SOAP API |

### Integraciones

| Módulo | AuthType | blockKey | Descripción |
|--------|----------|----------|-------------|
| **BaseIntegration** | - | `OMG_FW_BaseIntegration` | Plantilla para integraciones |
| **SFMCIntegration** | OAuth2 | `OMG_FW_SFMCIntegration` | SFMC REST API |
| **VeevaVaultIntegration** | Basic* | `OMG_FW_VeevaVaultIntegration` | Veeva Vault API |
| **VeevaCRMIntegration** | OAuth2 (password) | `OMG_FW_VeevaCRMIntegration` | Veeva CRM (Salesforce) |
| **DataCloudIntegration** | OAuth2 | `OMG_FW_DataCloudIntegration` | Salesforce Data Cloud |

*VeevaVault usa Basic auth con `application/x-www-form-urlencoded`

### Handlers

| Módulo | Dependencias | blockKey | Descripción |
|--------|--------------|----------|-------------|
| **AssetHandler** | SFMCIntegration | `OMG_FW_AssetHandler` | Content Builder assets |
| **DataExtensionHandler** | WSProxyWrapper | `OMG_FW_DataExtensionHandler` | Operaciones DE |
| **EmailHandler** | SFMCIntegration | `OMG_FW_EmailHandler` | Gestión de emails |
| **FolderHandler** | SFMCIntegration | `OMG_FW_FolderHandler` | Carpetas |
| **JourneyHandler** | SFMCIntegration | `OMG_FW_JourneyHandler` | Journeys |

---

## 7. EJEMPLOS DE USO POR MÓDULO

### SFMCIntegration
```javascript
var sfmc = OmegaFramework.create('SFMCIntegration', { integrationName: 'SFMC_Production' });

// Token
var tokenResult = sfmc.getToken();

// Assets
var assets = sfmc.listAssets({ pageSize: 50 });
var asset = sfmc.getAsset(12345);
sfmc.createAsset({ name: 'Mi Asset', assetType: { id: 208 }, views: { html: { content: '<h1>Hola</h1>' }}});
sfmc.updateAsset(12345, { name: 'Nuevo nombre' });

// Query avanzada de assets
sfmc.advancedAssetQuery({
    query: {
        property: 'customerKey',
        simpleOperator: 'equals',
        value: 'MiCustomerKey'
    }
});

// Data Extensions (via REST API)
sfmc.queryDataExtension('MiDE_Key');
sfmc.insertDataExtensionRow('MiDE_Key', { Email: 'test@test.com', Nombre: 'Juan' });

// Journeys
sfmc.getJourney('journey-id');
sfmc.publishJourney('journey-id');

// Email transaccional
sfmc.sendTransactionalEmail('welcome-email', {
    To: { Address: 'usuario@ejemplo.com', SubscriberKey: 'user-123' }
});
```

### VeevaVaultIntegration
```javascript
var vault = OmegaFramework.create('VeevaVaultIntegration', { integrationName: 'VeevaVaultTestAmerHP' });

// Autenticación (requerida antes de otras operaciones)
var authResult = vault.authenticate();

// Documentos
var doc = vault.getDocument('123');
vault.createDocument({ name__v: 'Mi Documento', type__v: 'Promotional Piece' });
vault.updateDocument('123', { name__v: 'Nuevo nombre' });

// VQL Query
vault.executeQuery("SELECT id, name__v, status__v FROM documents WHERE status__v = 'Approved'");

// Renditions
vault.getDocumentRenditions('123');
vault.downloadDocument('123', 'v1');

// Workflows
vault.initiateWorkflow('123', 'approve_workflow');
```

### DataExtensionHandler
```javascript
var deHandler = OmegaFramework.create('DataExtensionHandler', {});

// Metadata
var schema = deHandler.schema('MiDE');           // Schema completo
var exists = deHandler.exists('MiDE');           // Verificar existencia

// Lectura
var allRows = deHandler.get('MiDE');             // Todas las filas
var filtered = deHandler.get('MiDE', {           // Con filtro
    where: { property: 'Status', value: 'Active' }
});
var complex = deHandler.get('MiDE', {            // Filtro complejo
    where: {
        filters: [
            { property: 'Status', value: 'Active' },
            { property: 'Age', operator: 'greaterThan', value: 18 }
        ],
        logicalOperator: 'AND'
    }
});
var count = deHandler.count('MiDE');             // Contar filas

// Escritura
deHandler.insert('MiDE', { Id: '1', Name: 'Juan' });
deHandler.insert('MiDE', [{ Id: '1' }, { Id: '2' }]);  // Batch
deHandler.update('MiDE', { Id: '1', Name: 'Pedro' });
deHandler.remove('MiDE', { Id: '1' });
deHandler.upsert('MiDE', { Id: '1', Name: 'Juan' });   // Insert o Update
deHandler.clear('MiDE');                              // Borrar todo

// Cross-BU
deHandler.setBU(12345678);  // Cambiar Business Unit
```

### AssetHandler
```javascript
var assetHandler = OmegaFramework.create('AssetHandler', {});

// CRUD básico
assetHandler.list({ pageSize: 50 });
assetHandler.get(12345);
assetHandler.create({ name: 'Mi Asset', assetType: { id: 208 } });
assetHandler.update(12345, { name: 'Nuevo nombre' });
assetHandler.remove(12345);

// Búsquedas
assetHandler.search('test');                          // Por nombre
assetHandler.getByType(208);                          // Por tipo (208 = HTML Email)
assetHandler.getByCategory(51937);                    // Por carpeta
assetHandler.getByStatus('Published');                // Por estado
assetHandler.getRecent({ pageSize: 25 });             // Recientes

// Búsqueda avanzada con condiciones
assetHandler.searchWithConditions([
    { property: 'name', operator: 'like', value: 'test' },
    { property: 'assetType.id', operator: 'equal', value: 208 }
], { pageSize: 25 });

// Constantes de tipos
assetHandler.ASSET_TYPES.HTML_EMAIL;    // 208
assetHandler.ASSET_TYPES.HTML_BLOCK;    // 197
assetHandler.ASSET_TYPES.PNG;           // 28
```

---

## 8. REGISTRO DE MÓDULOS PERSONALIZADOS

Para crear un nuevo módulo compatible con OmegaFramework:

```javascript
<script runat="server">
Platform.Load("core", "1.1.1");

function MiModuloPersonalizado(responseWrapper, connectionHandler, config) {
    var handler = 'MiModuloPersonalizado';
    var response = responseWrapper;
    var connection = connectionHandler;

    // Implementación...
    function miFuncion() {
        return response.success({ resultado: 'ok' }, handler, 'miFuncion');
    }

    // API pública
    this.miFuncion = miFuncion;
}

// REGISTRO en OmegaFramework
if (typeof OmegaFramework !== 'undefined' && typeof OmegaFramework.register === 'function') {
    OmegaFramework.register('MiModuloPersonalizado', {
        dependencies: ['ResponseWrapper', 'ConnectionHandler'],  // Dependencias que necesita
        blockKey: 'OMG_FW_MiModuloPersonalizado',                // Key del Content Block
        factory: function(responseWrapper, connectionHandler, config) {
            return new MiModuloPersonalizado(responseWrapper, connectionHandler, config);
        }
    });
}
</script>
```

---

## 9. DATA EXTENSIONS REQUERIDAS

### OMG_FW_TokenCache (Cache de tokens OAuth2)

| Campo | Tipo | Longitud | PK | Descripción |
|-------|------|----------|----|----|
| CacheKey | Text | 200 | ✓ | clientId o identificador único |
| AccessToken | Text | 500 | | Token OAuth2 |
| TokenType | Text | 50 | | Bearer |
| ExpiresIn | Number | | | Segundos hasta expiración |
| ObtainedAt | Decimal | | | Timestamp obtención |
| ExpiresAt | Decimal | | | Timestamp expiración |
| Scope | Text | 500 | | Scope OAuth2 |
| RestInstanceUrl | Text | 200 | | URL REST instance |
| SoapInstanceUrl | Text | 200 | | URL SOAP instance |
| UpdatedAt | Date | | | Fecha actualización |

### OMG_FW_Credentials (Credenciales encriptadas)

| Campo | Tipo | Longitud | PK | Descripción |
|-------|------|----------|----|----|
| Name | Text | 100 | ✓ | Alias de integración |
| Description | Text | 500 | | Descripción |
| AuthType | Text | 50 | | OAuth2, Basic, Bearer, ApiKey |
| Platform | Text | 50 | | SFMC, VeevaVault, etc. |
| IsActive | Boolean | | | Activo/Inactivo |
| BaseUrl | Text | 500 | | URL base API |
| AuthUrl | Text | 500 | | URL autenticación |
| TokenEndpoint | Text | 500 | | Endpoint de token |
| ClientId | Text | 500 | | Client ID (encriptado) |
| ClientSecret | Text | 500 | | Client Secret (encriptado) |
| Username | Text | 500 | | Usuario (encriptado) |
| Password | Text | 500 | | Contraseña (encriptado) |
| StaticToken | Text | 500 | | Token estático (encriptado) |
| ApiKey | Text | 500 | | API Key (encriptado) |
| ApiSecret | Text | 500 | | API Secret (encriptado) |
| GrantType | Text | 50 | | client_credentials, password |
| Scope | Text | 200 | | Scope OAuth2 |
| MID | Text | 50 | | SFMC Business Unit MID |
| Domain | Text | 200 | | Dominio |
| CustomField1-3 | Text | 500 | | Campos extensibles |
| CreatedAt | Date | | | Fecha creación |
| UpdatedAt | Date | | | Fecha actualización |
| CreatedBy | Text | 100 | | Usuario creador |

---

## 10. AUTENTICACIÓN POR SISTEMA

### SFMC (OAuth2 client_credentials)
```
CredentialStore AuthType: OAuth2
Campos requeridos:
- ClientId (encriptado)
- ClientSecret (encriptado)
- AuthUrl → ej: https://SUBDOMAIN.auth.marketingcloudapis.com/
- MID (opcional, para cross-BU)
```

### Veeva Vault (Basic → form-urlencoded)
```
CredentialStore AuthType: Basic
Campos requeridos:
- Username (encriptado)
- Password (encriptado)
- BaseUrl → ej: https://tu-vault.veevavault.com
- TokenEndpoint → ej: https://tu-vault.veevavault.com/api/v24.1/auth

IMPORTANTE: La autenticación usa application/x-www-form-urlencoded, NO JSON
```

### Veeva CRM (OAuth2 password grant)
```
CredentialStore AuthType: OAuth2
Campos requeridos:
- ClientId (encriptado)
- ClientSecret (encriptado)
- Username (encriptado)
- Password (encriptado) + SecurityToken
- AuthUrl → https://login.salesforce.com/services/oauth2/token
- BaseUrl → https://instance.salesforce.com
- GrantType: password
```

---

## 11. PLANTILLA PARA TAREAS DE AUTOMATIZACIÓN

```javascript
<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * MiTareaAutomatizada - Descripción de la tarea
 *
 * Ejecutar en: Automation Studio > Script Activity
 *
 * @version 1.0.0
 */

// ============================================================================
// CONFIGURACIÓN
// ============================================================================
var CONFIG = {
    // Credenciales (alias en OMG_FW_Credentials)
    sfmcCredentialName: 'SFMC_Production',

    // Parámetros de la tarea
    parametro1: 'valor1',

    // Data Extensions
    dataExtensions: {
        log: 'MiTarea_Log',
        datos: 'MiTarea_Datos'
    },

    // Debug (true para testing, false en producción)
    debug: false
};

// ============================================================================
// CARGA DE OMEGAFRAMEWORK
// ============================================================================
Platform.Function.ContentBlockByName("OMG_FW_OmegaFramework");

// ============================================================================
// UTILIDADES
// ============================================================================
function debug(message) {
    if (CONFIG.debug) {
        Write(message + '\n');
    }
}

// ============================================================================
// EJECUCIÓN PRINCIPAL
// ============================================================================
try {
    var startTime = new Date().getTime();
    debug('Iniciando tarea: ' + new Date().toISOString());

    // Inicializar integraciones
    var sfmc = OmegaFramework.create('SFMCIntegration', {
        integrationName: CONFIG.sfmcCredentialName
    });

    // Verificar autenticación
    var tokenResult = sfmc.getToken();
    if (!tokenResult.success) {
        throw new Error('Autenticación fallida: ' + tokenResult.error.message);
    }
    debug('Autenticación exitosa');

    // ... lógica de la tarea ...

    // Resumen
    var duration = Math.round((new Date().getTime() - startTime) / 1000);
    debug('Tarea completada en ' + duration + ' segundos');

} catch (ex) {
    // Logging de error (en producción, guardar en DE)
    var errorMsg = ex.message || String(ex);
    debug('[ERROR] ' + errorMsg);
}
</script>
```

---

## 12. ERRORES COMUNES Y SOLUCIONES

| Error | Causa | Solución |
|-------|-------|----------|
| `Module not found` | Content Block no existe | Verificar blockKey y que esté desplegado |
| `Circular dependency` | A depende de B, B depende de A | Refactorizar dependencias |
| `Invalid AuthType` | AuthType incorrecto en CredentialStore | OAuth2 para SFMC, Basic para VeevaVault |
| `Token expired immediately` | Problema de timestamp | Verificar hora del servidor SFMC |
| `HTTP 401 Unauthorized` | Token inválido | `.refreshToken()` o verificar credenciales |
| `HTTP 429 Too Many Requests` | Rate limiting | ConnectionHandler reintenta automáticamente |
| `application/x-www-form-urlencoded` error | Veeva Vault requiere form-urlencoded | No enviar JSON a endpoint de auth de Vault |

---

## 13. CHECKLIST ANTES DE PRODUCCIÓN

- [ ] Credenciales en OMG_FW_Credentials (no hardcodeadas)
- [ ] CONFIG.debug = false
- [ ] Solo se carga OmegaFramework (no dependencias manuales)
- [ ] Usar `.create()` para integraciones y handlers
- [ ] Verificar AuthType correcto para cada integración
- [ ] Data Extensions de cache/log creadas
- [ ] Manejo de errores con try/catch
- [ ] Verificar `.success` antes de usar `.data`
- [ ] Sin código ES6+ (const, let, arrow functions, etc.)

---

*OmegaFramework v1.0 - Updated: December 2024*
