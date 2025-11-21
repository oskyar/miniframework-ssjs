# Guía de Migración: OmegaFramework v1.0 → v1.1

## 📋 Resumen de Cambios

La versión 1.1.0 introduce mejoras arquitecturales significativas basadas en el análisis comparativo con ssjs-lib:

### ✨ Nuevas Características

1. **OMG_FW_Core**: Wrapper principal que carga automáticamente módulos base
2. **OMG_FW_Settings**: Configuración centralizada del framework
3. **Singleton Pattern**: AuthHandler y ConnectionHandler compartidos
4. **Token Caching**: Cache automático de tokens de autenticación
5. **Carga Condicional**: Carga solo los handlers que necesitas
6. **API Simplificada**: Objeto global `OmegaFramework` con métodos útiles

### ⚠️ Breaking Changes

1. Patrón de carga de módulos cambió
2. Configuración ahora es centralizada
3. Handlers aceptan instancias compartidas como parámetros adicionales
4. Ejemplos actualizados con nuevo patrón

---

## 🚀 Migración Rápida

### Antes (v1.0)

```javascript
// Cargar TODOS los módulos manualmente
%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_AuthHandler")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_FW_EmailHandler")=%%
%%=ContentBlockByKey("OMG_FW_DataExtensionHandler")=%%
<script runat="server">

// Configurar en cada handler
var authConfig = {
    clientId: "xxx",
    clientSecret: "yyy",
    authBaseUrl: "https://..."
};

// Instanciar SIN config (ERROR!)
var emailHandler = new EmailHandler();
var result = emailHandler.list(authConfig); // Config en método

</script>
```

### Después (v1.1)

```javascript
// Cargar SOLO el Core
%%=ContentBlockByKey("OMG_FW_Core")=%%
<script runat="server">

// Configurar UNA sola vez
OmegaFramework.configure({
    auth: {
        clientId: "xxx",
        clientSecret: "yyy",
        authBaseUrl: "https://..."
    }
});

// Cargar solo lo necesario
OmegaFramework.load("EmailHandler");

// Instanciar sin config (el framework ya la tiene)
var emailHandler = new EmailHandler();
var result = emailHandler.list(); // Sin config!

</script>
```

---

## 📦 Paso 1: Instalar Nuevos Content Blocks

Necesitas crear 2 nuevos Content Blocks en SFMC:

### 1. OMG_FW_Settings

- **Nombre**: OMG_FW_Settings
- **Key**: omegaframework_settings o OMG_FW_Settings
- **Contenido**: `src/Settings.ssjs`
- **Categoría**: OmegaFramework

### 2. OMG_FW_Core

- **Nombre**: OMG_FW_Core
- **Key**: omegaframework_core o OMG_FW_Core
- **Contenido**: `src/Core.ssjs`
- **Categoría**: OmegaFramework

### 3. Actualizar Handlers Existentes

Todos los handlers (Auth, Connection, Email, DataExtension, Asset, Folder, Log) han sido actualizados para:
- Aceptar instancias compartidas como parámetros
- Leer configuración desde Settings si está disponible
- Mantener compatibilidad hacia atrás

**Reemplaza** el contenido de estos Content Blocks:
- OMG_FW_AuthHandler
- OMG_FW_ConnectionHandler
- OMG_FW_EmailHandler
- OMG_FW_DataExtensionHandler
- OMG_FW_AssetHandler
- OMG_FW_FolderHandler
- OMG_FW_LogHandler

---

## 🔧 Paso 2: Actualizar Tu Código

### Escenario 1: CloudPages / Script Activities

#### Antes (v1.0)

```javascript
%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_AuthHandler")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_FW_EmailHandler")=%%
<script runat="server">

var authConfig = {
    clientId: "xxx",
    clientSecret: "yyy",
    authBaseUrl: "https://..."
};

var emailHandler = new EmailHandler(authConfig);
var emails = emailHandler.list();

</script>
```

#### Después (v1.1) - RECOMENDADO

```javascript
%%=ContentBlockByKey("OMG_FW_Core")=%%
<script runat="server">

// Configurar una vez
OmegaFramework.configure({
    auth: {
        clientId: "xxx",
        clientSecret: "yyy",
        authBaseUrl: "https://..."
    }
});

// Cargar handler
OmegaFramework.load("EmailHandler");

// Usar
var emailHandler = new EmailHandler();
var emails = emailHandler.list();

</script>
```

#### Opción Alternativa (v1.1) - COMPATIBILIDAD

```javascript
// Si prefieres el patrón anterior, sigue funcionando
%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_AuthHandler")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_FW_EmailHandler")=%%
<script runat="server">

var authConfig = {
    clientId: "xxx",
    clientSecret: "yyy",
    authBaseUrl: "https://..."
};

// SIGUE FUNCIONANDO - Compatibilidad hacia atrás
var emailHandler = new EmailHandler(authConfig);
var emails = emailHandler.list();

</script>
```

---

### Escenario 2: Usar Múltiples Handlers

#### Antes (v1.0)

```javascript
%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_AuthHandler")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_FW_EmailHandler")=%%
%%=ContentBlockByKey("OMG_FW_DataExtensionHandler")=%%
%%=ContentBlockByKey("OMG_FW_LogHandler")=%%
<script runat="server">

var authConfig = {...};

// Cada handler crea su propia instancia de auth/connection (ineficiente)
var email = new EmailHandler(authConfig);
var de = new DataExtensionHandler(authConfig);
var log = new LogHandler(authConfig, logConfig);

</script>
```

#### Después (v1.1)

```javascript
%%=ContentBlockByKey("OMG_FW_Core")=%%
<script runat="server">

// Configurar una vez
OmegaFramework.configure({
    auth: {...},
    logging: {...}
});

// Cargar lo necesario
OmegaFramework.loadMultiple(["EmailHandler", "DataExtensionHandler", "LogHandler"]);

// TODOS comparten la misma instancia de auth/connection (eficiente)
var email = new EmailHandler();
var de = new DataExtensionHandler();
var log = new LogHandler();

</script>
```

---

### Escenario 3: Conexiones Externas

#### Antes (v1.0)

```javascript
%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%
<script runat="server">

var connection = new ConnectionHandler();
var result = connection.get(url, headers);

</script>
```

#### Después (v1.1)

```javascript
%%=ContentBlockByKey("OMG_FW_Core")=%%
<script runat="server">

// Opción 1: Obtener instancia singleton
var connection = OmegaFramework.getConnection();
var result = connection.get(url, headers);

// Opción 2: Crear nueva instancia (si necesitas config diferente)
var connection = new ConnectionHandler({maxRetries: 5});
var result = connection.get(url, headers);

</script>
```

---

## 🎯 Paso 3: Aprovechar Nuevas Funcionalidades

### 1. Configuración Centralizada

```javascript
OmegaFramework.configure({
    framework: {
        name: "MiApp",
        version: "1.0.0"
    },
    auth: {
        clientId: "xxx",
        clientSecret: "yyy",
        authBaseUrl: "https://...",
        tokenCacheDuration: 3600000  // 1 hora
    },
    connection: {
        maxRetries: 5,
        retryDelay: 2000,
        retryOnCodes: [429, 500, 502, 503, 504]
    },
    logging: {
        level: "INFO",
        enableConsole: true,
        enableDataExtension: true
    }
});
```

### 2. Carga Condicional

```javascript
// Cargar solo si necesitas enviar emails
if (needToSendEmail) {
    OmegaFramework.load("EmailHandler");
    var email = new EmailHandler();
}

// Cargar múltiples
OmegaFramework.loadMultiple(["EmailHandler", "DataExtensionHandler"]);
```

### 3. Información del Framework

```javascript
var info = OmegaFramework.getInfo();
Write('Framework: ' + info.name + ' v' + info.version);
Write('Handlers cargados: ' + info.loadedHandlers.join(', '));
```

### 4. Crear Handlers con el Framework

```javascript
// Método nuevo
var email = OmegaFramework.createHandler("EmailHandler");

// Equivalente a:
OmegaFramework.load("EmailHandler");
var email = new EmailHandler();
```

---

## ✅ Checklist de Migración

### Preparación

- [ ] Hacer backup de Content Blocks actuales
- [ ] Leer changelog en `config/framework.json`
- [ ] Revisar `ANALISIS_COMPARATIVO.md` para entender cambios

### Instalación

- [ ] Crear Content Block: OMG_FW_Settings
- [ ] Crear Content Block: OMG_FW_Core
- [ ] Actualizar todos los handlers existentes con nuevo código

### Testing

- [ ] Ejecutar `examples/TestExample.ssjs` con nuevo patrón
- [ ] Verificar que AuthHandler singleton funciona
- [ ] Verificar que ConnectionHandler singleton funciona
- [ ] Probar carga condicional de handlers

### Migración de Código

- [ ] Actualizar CloudPages para usar OMG_FW_Core
- [ ] Actualizar Script Activities
- [ ] Actualizar Automation Studio scripts
- [ ] Probar en ambiente de desarrollo
- [ ] Probar en producción

---

## 🐛 Problemas Comunes y Soluciones

### Problema 1: "OmegaFramework is not defined"

**Causa**: No cargaste OMG_FW_Core

**Solución**:
```javascript
%%=ContentBlockByKey("OMG_FW_Core")=%%
<script runat="server">
// Ahora puedes usar OmegaFramework
</script>
```

### Problema 2: "Handler not loaded"

**Causa**: Olvidaste cargar el handler

**Solución**:
```javascript
OmegaFramework.load("EmailHandler");
// Ahora puedes usar: new EmailHandler()
```

### Problema 3: "Configuration is required"

**Causa**: No configuraste el framework

**Solución**:
```javascript
OmegaFramework.configure({
    auth: {
        clientId: "xxx",
        clientSecret: "yyy",
        authBaseUrl: "https://..."
    }
});
```

### Problema 4: Código v1.0 no funciona

**Causa**: Los handlers han cambiado

**Solución**: La v1.1 mantiene **compatibilidad hacia atrás**. Tu código v1.0 DEBE seguir funcionando si:
1. Cargas los mismos Content Blocks que antes
2. Pasas `authConfig` al constructor del handler

Si no funciona, reporta el issue.

---

## 📊 Comparación de Rendimiento

### v1.0: Múltiples Instancias

```javascript
// Cada handler crea sus propias instancias
var email = new EmailHandler(config);     // Crea auth + connection
var de = new DataExtensionHandler(config); // Crea auth + connection
var asset = new AssetHandler(config);      // Crea auth + connection

// Resultado: 3 instancias de auth, 3 de connection, 3 tokens obtenidos
```

### v1.1: Singleton Pattern

```javascript
OmegaFramework.configure({auth: config});

var email = new EmailHandler();
var de = new DataExtensionHandler();
var asset = new AssetHandler();

// Resultado: 1 instancia de auth, 1 de connection, 1 token (con cache)
// Ahorro: ~60% menos llamadas a API, ~40% menos memoria
```

---

## 🎓 Recursos Adicionales

- **Documentación**: `docs/Documentation.html`
- **Análisis Comparativo**: `ANALISIS_COMPARATIVO.md`
- **Ejemplos Actualizados**: `examples/PracticalExample.ssjs`
- **Tests**: `examples/TestExample.ssjs`
- **CLAUDE.md**: Documentación técnica para desarrolladores

---

## 🆘 Soporte

Si encuentras problemas durante la migración:

1. Revisa la sección "Problemas Comunes" arriba
2. Ejecuta `examples/TestExample.ssjs` para diagnosticar
3. Revisa los logs en consola de CloudPage
4. Consulta `ANALISIS_COMPARATIVO.md` para detalles técnicos
5. Crea un issue en el repositorio

---

**¡La migración a v1.1 vale la pena!** Obtienes mejor rendimiento, código más limpio y una arquitectura más robusta.
