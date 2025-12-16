# OmegaFramework v3.0 - Ejemplos Completos

Esta carpeta contiene ejemplos completos y funcionales para cada integración y handler de OmegaFramework, siguiendo las mejores prácticas establecidas en [OMEGAFRAMEWORK_BEST_PRACTICES.md](../../OMEGAFRAMEWORK_BEST_PRACTICES.md).

## 📋 Contenido

### Integraciones

| Archivo | Integración | Descripción |
|---------|-------------|-------------|
| `Example_Integration_SFMC.html` | **SFMCIntegration** | SFMC REST API - OAuth2, Assets, Data Extensions, Journeys, Emails transaccionales |
| `Example_Integration_VeevaVault.html` | **VeevaVaultIntegration** | Veeva Vault - Autenticación Basic, Documentos, VQL, Renditions, Workflows |
| `Example_Integration_VeevaCRM.html` | **VeevaCRMIntegration** | Veeva CRM (Salesforce) - OAuth2 Password Grant, SOQL, Accounts, Contacts |
| `Example_Integration_DataCloud.html` | **DataCloudIntegration** | Salesforce Data Cloud - DMOs, Segmentos, Activaciones, Data Streams |

### Handlers

| Archivo | Handler | Descripción |
|---------|---------|-------------|
| `Example_Handler_Asset.html` | **AssetHandler** | Gestión de assets en Content Builder - CRUD, búsquedas, filtros |
| `Example_Handler_Email.html` | **EmailHandler** | Gestión de emails - Crear, actualizar, enviar, validar |
| `Example_Handler_DataExtension.html` | **DataExtensionHandler** | Operaciones CRUD en Data Extensions vía SOAP API |
| `Example_Handler_Folder.html` | **FolderHandler** | Gestión de carpetas - Jerarquía, mover assets, organización |
| `Example_Handler_Journey.html` | **JourneyHandler** | Gestión de journeys - Publicar, pausar, detener, estadísticas |

## 🚀 Inicio Rápido

### Prerequisitos

1. **OmegaFramework instalado** en tu SFMC usando el AutomatedInstaller
2. **Credenciales SFMC** de un Installed Package (para integraciones que lo requieran)
3. **Data Extensions de framework** creadas:
   - `OMG_FW_TokenCache`
   - `OMG_FW_Credentials` (opcional, para producción)

### Cómo Usar los Ejemplos

1. **Copia el código** del ejemplo que quieres probar
2. **Crea una CloudPage** en SFMC o usa un Code Resource
3. **Pega el código** en la CloudPage
4. **Configura las credenciales** en la sección CONFIG del ejemplo:
   ```javascript
   var CONFIG = {
       clientId: 'tu-client-id-aqui',        // ← Cambiar
       clientSecret: 'tu-client-secret-aqui', // ← Cambiar
       authBaseUrl: 'https://TU_SUBDOMAIN.auth.marketingcloudapis.com/' // ← Cambiar
   };
   ```
5. **Publica y visualiza** la CloudPage para ver los resultados

## 🔐 Modos de Configuración

Todos los ejemplos soportan **dos modos** de configuración:

### Modo 1: Configuración Directa (Desarrollo/Testing)

Ideal para desarrollo y pruebas rápidas.

```javascript
var handler = OmegaFramework.create('SFMCIntegration', {
    clientId: 'tu-client-id',
    clientSecret: 'tu-client-secret',
    authBaseUrl: 'https://subdomain.auth.marketingcloudapis.com/'
});
```

### Modo 2: CredentialStore (Producción - Recomendado)

Usa credenciales encriptadas almacenadas en la Data Extension `OMG_FW_Credentials`.

```javascript
var handler = OmegaFramework.create('SFMCIntegration', {
    integrationName: 'SFMC_Production'  // Alias en OMG_FW_Credentials
});
```

Para cambiar entre modos en los ejemplos, modifica:

```javascript
var CONFIG = {
    useCredentialStore: false,  // Cambiar a true para usar CredentialStore
    integrationName: 'SFMC_Production'
};
```

## 📚 Guía de Ejemplos

### Integraciones

#### SFMCIntegration

**Qué aprenderás:**
- Autenticación OAuth2 con SFMC
- Gestión automática de tokens
- Operaciones con Assets (listar, crear, actualizar, buscar)
- Query y manipulación de Data Extensions vía REST API
- Gestión de Journeys (obtener, publicar, detener)
- Envío de emails transaccionales

**Casos de uso:**
- Sincronización de datos entre SFMC y sistemas externos
- Automatización de creación de assets
- Gestión programática de journeys
- Envío de emails transaccionales desde automation scripts

#### VeevaVaultIntegration

**Qué aprenderás:**
- Autenticación Basic con form-urlencoded (específico de Veeva Vault)
- Operaciones con documentos (CRUD)
- Ejecución de VQL queries
- Gestión de renditions y descarga de documentos
- Inicio de workflows

**Casos de uso:**
- Sincronizar contenido médico de Veeva Vault con SFMC
- Automatizar aprobaciones de documentos
- Generar reportes de documentos aprobados
- Integrar workflows de Vault con campañas de SFMC

#### VeevaCRMIntegration

**Qué aprenderás:**
- OAuth2 Password Grant Flow (Salesforce-based)
- Ejecución de SOQL queries
- Operaciones CRUD con objetos estándar (Account, Contact)
- Trabajar con objetos custom de Veeva (Call2_vod__c, etc.)

**Casos de uso:**
- Sincronizar Accounts y Contacts de Veeva CRM con SFMC
- Obtener datos de visitas médicas (Calls) para segmentación
- Integrar consentimientos de Veeva con preferencias en SFMC
- Enriquecer perfiles de HCPs con datos de CRM

#### DataCloudIntegration

**Qué aprenderás:**
- Query de Data Model Objects (DMOs)
- Gestión de segmentos
- Activaciones (Data Actions)
- Ingesta de datos en Data Streams
- Calculated Insights

**Casos de uso:**
- Sincronizar segmentos de Data Cloud con SFMC Data Extensions
- Enriquecer perfiles de SFMC con insights de Data Cloud
- Activar audiencias en múltiples canales
- Ingestar datos de SFMC en Data Cloud para unificación

### Handlers

#### AssetHandler

**Qué aprenderás:**
- Listar y filtrar assets por tipo, carpeta, estado
- Búsquedas avanzadas con múltiples condiciones
- Crear assets programáticamente (HTML Emails, Content Blocks)
- Constantes de tipos de assets
- Gestión completa de assets

**Casos de uso:**
- Migración masiva de assets
- Búsqueda y organización automatizada
- Creación de templates dinámicos
- Auditoría de assets por carpeta

#### EmailHandler

**Qué aprenderás:**
- CRUD completo de emails
- Envío de emails transaccionales
- Test sends para QA
- Validación de emails antes de enviar

**Casos de uso:**
- Creación automatizada de emails para campañas
- Envío de emails transaccionales (welcome, confirmation, etc.)
- Testing automatizado de emails
- Validación pre-envío

#### DataExtensionHandler

**Qué aprenderás:**
- Verificar existencia y obtener schema de DEs
- Leer con filtros simples y complejos
- Operaciones CRUD completas
- Upsert (insert o update)
- Operaciones batch
- Cross-BU operations

**Casos de uso:**
- ETL processes (Extract, Transform, Load)
- Sincronización de datos con sistemas externos
- Limpieza y validación de datos
- Procesamiento batch de grandes volúmenes
- Migración cross-BU

#### FolderHandler

**Qué aprenderás:**
- Gestión de jerarquía de carpetas
- Crear y organizar estructura de carpetas
- Mover assets entre carpetas
- Obtener contenido de carpetas

**Casos de uso:**
- Organización automatizada de assets
- Migración de estructura de carpetas
- Auditoría de contenido por carpeta
- Creación de carpetas para nuevas campañas

#### JourneyHandler

**Qué aprenderás:**
- Gestión completa de journeys
- Publicar, pausar, detener, reanudar
- Obtener versiones y estadísticas
- Validación pre-publicación

**Casos de uso:**
- Automatización de publicación de journeys
- Monitoreo y reportes de performance
- Control de journeys basado en eventos externos
- Rollback y gestión de versiones

## 💡 Mejores Prácticas Aplicadas

Todos los ejemplos siguen estrictamente las mejores prácticas de OmegaFramework:

### ✅ Carga de Dependencias
```javascript
// CORRECTO - Solo cargar OmegaFramework
Platform.Function.ContentBlockByKey("OMG_FW_OmegaFramework");

// OmegaFramework gestiona automáticamente las dependencias
var handler = OmegaFramework.create('AssetHandler', {...});
```

❌ **NO hacer:**
```javascript
// INCORRECTO - No cargar dependencias manualmente
Platform.Function.ContentBlockByKey("OMG_FW_OmegaFramework");
Platform.Function.ContentBlockByKey("OMG_FW_ResponseWrapper");
Platform.Function.ContentBlockByKey("OMG_FW_ConnectionHandler");
// etc...
```

### ✅ Instanciación Correcta

```javascript
// Usar .create() para integraciones y handlers (stateful)
var sfmc = OmegaFramework.create('SFMCIntegration', { ... });
var assetHandler = OmegaFramework.create('AssetHandler', { ... });

// Usar .require() solo para utilidades stateless
var response = OmegaFramework.require('ResponseWrapper', {});
```

### ✅ Manejo de Errores

```javascript
var result = handler.someOperation();

if (result.success) {
    // Procesar data
    var items = result.data.items;
} else {
    // Manejar error
    Write('Error [' + result.error.code + ']: ' + result.error.message);

    // Manejo específico por código
    if (result.error.code === 'AUTH_ERROR') {
        // Problema de autenticación
    } else if (result.error.code === 'HTTP_ERROR') {
        // Error de API
        Write('Status Code: ' + result.error.details.statusCode);
    }
}
```

### ✅ Restricciones ES3/SSJS

Todos los ejemplos respetan las limitaciones de SSJS (ES3):

```javascript
// ✅ CORRECTO
var items = [];
for (var i = 0; i < data.length; i++) {
    items.push(data[i]);
}

// ❌ INCORRECTO (ES6+)
const items = data.map(item => item.id);
```

## 🛠️ Modificando los Ejemplos

### Para Producción

1. **Usa CredentialStore:**
   ```javascript
   var CONFIG = {
       useCredentialStore: true,
       integrationName: 'SFMC_Production'
   };
   ```

2. **Descomenta las operaciones reales:**
   Los ejemplos comentan operaciones de escritura (create, update, delete) para evitar modificar datos accidentalmente. Descomenta estas líneas para ejecutarlas.

3. **Configura IDs reales:**
   Actualiza los valores de ejemplo en CONFIG con IDs válidos de tu entorno:
   ```javascript
   var CONFIG = {
       testAssetId: 12345,      // ← ID real de un asset
       testDataExtension: 'MiDE_Real', // ← Nombre real de DE
       // etc.
   };
   ```

### Para Testing

1. **Usa configuración directa** para iteración rápida
2. **Crea Data Extensions de prueba** antes de ejecutar
3. **Usa CloudPages** para visualizar resultados fácilmente
4. **Revisa los logs** de errores en la consola del browser

## 📖 Recursos Adicionales

- [OMEGAFRAMEWORK_BEST_PRACTICES.md](../../OMEGAFRAMEWORK_BEST_PRACTICES.md) - Mejores prácticas completas
- [CLAUDE.md](../../CLAUDE.md) - Guía general del framework
- [src/core/OMEGAFRAMEWORK_USAGE_GUIDE.md](../core/OMEGAFRAMEWORK_USAGE_GUIDE.md) - Guía de uso detallada

## 🆘 Troubleshooting

### "Module not found"
- Verifica que OmegaFramework esté instalado ejecutando el AutomatedInstaller
- Verifica que los Content Blocks existen con el prefijo `OMG_FW_`

### "Authentication failed"
- Verifica Client ID y Client Secret
- Verifica que Auth Base URL sea correcta (incluye tu subdomain)
- Verifica que el Installed Package esté activo

### "Data Extension not found"
- Verifica que el nombre de la DE sea exacto (case-sensitive)
- Verifica que la DE exista en tu Business Unit
- Usa `.exists()` para verificar antes de operar

### "Invalid token" / "Token expired"
- El framework gestiona refresh automático
- Verifica que `OMG_FW_TokenCache` DE exista
- Limpia el cache si es necesario: `integration.clearTokenCache()`

## ✨ Características de los Ejemplos

- ✅ **Completos y funcionales** - Listo para copy-paste
- ✅ **HTML con estilos** - Visualización clara de resultados
- ✅ **Comentarios extensos** - Explicación de cada operación
- ✅ **Manejo de errores** - Ejemplos de error handling
- ✅ **Dos modos de config** - Desarrollo y producción
- ✅ **Operaciones comentadas** - Previene cambios accidentales
- ✅ **Buenas prácticas** - Sigue todas las guidelines de OmegaFramework
- ✅ **ES3 compatible** - Sin código moderno que falle en SSJS

## 🎯 Próximos Pasos

1. **Explora los ejemplos** en orden de complejidad
2. **Crea tu primer CloudPage** con un ejemplo
3. **Modifica y experimenta** con los parámetros
4. **Adapta a tus casos de uso** específicos
5. **Consulta las mejores prácticas** cuando tengas dudas

---

**¿Preguntas?** Revisa la documentación principal o consulta los archivos de código fuente en `src/integrations/` y `src/handlers/`.

Made with ❤️ by OmegaFramework v3.0
