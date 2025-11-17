# Guía de Implementación: Versionado en OmegaFramework

## 🎯 Objetivo

Implementar versionado semántico en OmegaFramework para permitir actualizaciones seguras y coexistencia de múltiples versiones.

---

## 📋 Plan de Implementación

### Fase 1: Preparación (Sin impacto en usuarios)

**Objetivo:** Renombrar Content Blocks actuales para incluir sufijo `_v1`

#### Paso 1.1: Renombrar Content Blocks en SFMC

**Opción A: Manual (SFMC UI)**

1. Login a SFMC → Content Builder
2. Para cada Content Block, hacer clic en el menú ⋮
3. Seleccionar "Rename"
4. Añadir sufijo `_v1`:

```
OMG_FW_Core                  → OMG_FW_Core_v1
OMG_FW_Settings              → OMG_FW_Settings_v1
OMG_FW_ResponseWrapper       → OMG_FW_ResponseWrapper_v1
OMG_FW_AuthHandler           → OMG_FW_AuthHandler_v1
OMG_FW_ConnectionHandler     → OMG_FW_ConnectionHandler_v1
OMG_FW_BaseHandler           → OMG_FW_BaseHandler_v1
OMG_FW_EmailHandler          → OMG_FW_EmailHandler_v1
OMG_FW_DataExtensionHandler  → OMG_FW_DataExtensionHandler_v1
OMG_FW_AssetHandler          → OMG_FW_AssetHandler_v1
OMG_FW_FolderHandler         → OMG_FW_FolderHandler_v1
OMG_FW_LogHandler            → OMG_FW_LogHandler_v1
OMG_FW_AssetCreator          → OMG_FW_AssetCreator_v1
OMG_FW_JourneyCreator        → OMG_FW_JourneyCreator_v1
```

**Opción B: Via REST API (Programático)**

```javascript
// Usar install/ContentBlockRenamer.html
<script runat="server">
Platform.Load("core", "1.1.1");

var renameMap = {
    "OMG_FW_Core": "OMG_FW_Core_v1",
    "OMG_FW_Settings": "OMG_FW_Settings_v1",
    "OMG_FW_ResponseWrapper": "OMG_FW_ResponseWrapper_v1",
    "OMG_FW_AuthHandler": "OMG_FW_AuthHandler_v1",
    "OMG_FW_ConnectionHandler": "OMG_FW_ConnectionHandler_v1",
    "OMG_FW_BaseHandler": "OMG_FW_BaseHandler_v1",
    "OMG_FW_EmailHandler": "OMG_FW_EmailHandler_v1",
    "OMG_FW_DataExtensionHandler": "OMG_FW_DataExtensionHandler_v1",
    "OMG_FW_AssetHandler": "OMG_FW_AssetHandler_v1",
    "OMG_FW_FolderHandler": "OMG_FW_FolderHandler_v1",
    "OMG_FW_LogHandler": "OMG_FW_LogHandler_v1",
    "OMG_FW_AssetCreator": "OMG_FW_AssetCreator_v1",
    "OMG_FW_JourneyCreator": "OMG_FW_JourneyCreator_v1"
};

// Function to rename via REST API
function renameContentBlock(oldName, newName) {
    // 1. Search for Content Block by name
    // 2. Get customerKey/id
    // 3. Update with new name
    // Implementation depends on SFMC REST API
}

// Execute renames
for (var oldName in renameMap) {
    var newName = renameMap[oldName];
    Write("Renaming: " + oldName + " → " + newName + "<br>");
    renameContentBlock(oldName, newName);
}
</script>
```

#### Paso 1.2: Crear Content Blocks Alias (Retrocompatibilidad)

Para que código existente siga funcionando, crear nuevos Content Blocks con nombres originales que apunten a `_v1`:

**Crear estos Content Blocks:**

**Content Block: `OMG_FW_Core`** (alias)
```javascript
%%=ContentBlockByKey("OMG_FW_Core_v1")=%%
```

**Content Block: `OMG_FW_EmailHandler`** (alias)
```javascript
%%=ContentBlockByKey("OMG_FW_EmailHandler_v1")=%%
```

**Content Block: `OMG_FW_DataExtensionHandler`** (alias)
```javascript
%%=ContentBlockByKey("OMG_FW_DataExtensionHandler_v1")=%%
```

**... y así para todos los handlers principales**

**Resultado:**
- Código viejo que usa `%%=ContentBlockByKey("OMG_FW_Core")=%%` sigue funcionando
- Código nuevo puede usar `%%=ContentBlockByKey("OMG_FW_Core_v1")=%%` explícitamente

---

### Fase 2: Actualizar Código Fuente

#### Paso 2.1: Actualizar src/Core.ssjs

Añadir constantes de versión:

```javascript
// src/Core.ssjs
<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║                     OMEGAFRAMEWORK CORE v1.1.0                    ║
 * ╠═══════════════════════════════════════════════════════════════════╣
 * ║  Version Major: 1                                                 ║
 * ║  Supports: Semantic Versioning                                    ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

// ============================================================================
// VERSION CONSTANTS
// ============================================================================

var FRAMEWORK_VERSION_MAJOR = 1;
var FRAMEWORK_VERSION_MINOR = 1;
var FRAMEWORK_VERSION_PATCH = 0;
var FRAMEWORK_VERSION_FULL = FRAMEWORK_VERSION_MAJOR + "." +
                             FRAMEWORK_VERSION_MINOR + "." +
                             FRAMEWORK_VERSION_PATCH;

</script>

<!-- Load base modules with versioned names -->
%%=TreatAsContent(ContentBlockByKey("OMG_FW_ResponseWrapper_v1"))=%%
%%=TreatAsContent(ContentBlockByKey("OMG_FW_Settings_v1"))=%%
%%=TreatAsContent(ContentBlockByKey("OMG_FW_AuthHandler_v1"))=%%
%%=TreatAsContent(ContentBlockByKey("OMG_FW_ConnectionHandler_v1"))=%%
%%=TreatAsContent(ContentBlockByKey("OMG_FW_BaseHandler_v1"))=%%

<script runat="server">

// ... (resto del código existente)

/**
 * Load handler with version support
 */
OmegaFramework.load = function(handlerName) {
    try {
        // Avoid loading the same handler multiple times
        if (OmegaFramework._loadedHandlers[handlerName]) {
            return {
                success: true,
                message: handlerName + " already loaded",
                cached: true,
                version: FRAMEWORK_VERSION_FULL
            };
        }

        // Determine the Content Block key with version suffix
        var contentBlockKey = "OMG_FW_" + handlerName + "_v" + FRAMEWORK_VERSION_MAJOR;

        // Load the handler
        try {
            Platform.Function.ContentBlockByKey(contentBlockKey);
            OmegaFramework._loadedHandlers[handlerName] = true;

            return {
                success: true,
                message: handlerName + " loaded successfully",
                cached: false,
                version: FRAMEWORK_VERSION_FULL,
                contentBlock: contentBlockKey
            };
        } catch (loadEx) {
            return {
                success: false,
                error: "Failed to load " + handlerName + " (v" + FRAMEWORK_VERSION_MAJOR + "): " + loadEx.message,
                contentBlock: contentBlockKey
            };
        }

    } catch (ex) {
        return {
            success: false,
            error: ex.message || ex.toString()
        };
    }
};

/**
 * Get framework version information
 */
OmegaFramework.getVersion = function() {
    return {
        major: FRAMEWORK_VERSION_MAJOR,
        minor: FRAMEWORK_VERSION_MINOR,
        patch: FRAMEWORK_VERSION_PATCH,
        full: FRAMEWORK_VERSION_FULL,
        name: "OmegaFramework"
    };
};

/**
 * Get framework information (updated with version details)
 */
OmegaFramework.getInfo = function() {
    var handlers = [];
    for (var key in OmegaFramework._loadedHandlers) {
        if (OmegaFramework._loadedHandlers.hasOwnProperty(key)) {
            handlers.push(key);
        }
    }

    return {
        name: "OmegaFramework",
        version: FRAMEWORK_VERSION_FULL,
        versionMajor: FRAMEWORK_VERSION_MAJOR,
        versionMinor: FRAMEWORK_VERSION_MINOR,
        versionPatch: FRAMEWORK_VERSION_PATCH,
        initialized: OmegaFramework._initialized,
        loadedHandlers: handlers,
        contentBlockPrefix: "OMG_FW_",
        contentBlockSuffix: "_v" + FRAMEWORK_VERSION_MAJOR
    };
};

// Alias
OmegaFramework.version = OmegaFramework.getVersion;

</script>
```

#### Paso 2.2: Actualizar Comentarios en Handlers

Añadir información de versión en cada handler:

```javascript
// src/EmailHandler.ssjs
<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * ═══════════════════════════════════════════════════════════════════
 * EMAIL HANDLER v1.1.0
 * ═══════════════════════════════════════════════════════════════════
 * Part of: OmegaFramework v1.x
 * Compatible with: OMG_FW_Core_v1
 * ═══════════════════════════════════════════════════════════════════
 */

function EmailHandler(config, authHandlerInstance, connectionHandlerInstance) {
    // ...
}

// Internal version (for debugging)
EmailHandler.VERSION = "1.1.0";
EmailHandler.FRAMEWORK_VERSION_MAJOR = 1;

// ...
</script>
```

---

### Fase 3: Testing

#### Paso 3.1: Test con Alias (Retrocompatibilidad)

```javascript
// CloudPage de prueba
%%=ContentBlockByKey("OMG_FW_Core")=%%  <!-- Usa alias, apunta a _v1 -->

<script runat="server">
// Código viejo - debe seguir funcionando
OmegaFramework.configure({
    auth: {
        clientId: "xxx",
        clientSecret: "yyy",
        authBaseUrl: "https://..."
    }
});

var info = OmegaFramework.getInfo();
Write("Version: " + info.version + "<br>");  // "1.1.0"
Write("Major: " + info.versionMajor + "<br>");  // 1

var versionInfo = OmegaFramework.getVersion();
Write("Full version: " + versionInfo.full + "<br>");  // "1.1.0"

OmegaFramework.load("EmailHandler");
var email = new EmailHandler();
Write("EmailHandler version: " + EmailHandler.VERSION + "<br>");  // "1.1.0"
</script>
```

#### Paso 3.2: Test con Versión Explícita

```javascript
// CloudPage de prueba
%%=ContentBlockByKey("OMG_FW_Core_v1")=%%  <!-- Versión explícita -->

<script runat="server">
// Código nuevo - versión explícita
OmegaFramework.configure({
    auth: {
        clientId: "xxx",
        clientSecret: "yyy",
        authBaseUrl: "https://..."
    }
});

var version = OmegaFramework.getVersion();
Write("Using OmegaFramework v" + version.full + "<br>");

// Verificar que carga handlers versionados
var loadResult = OmegaFramework.load("EmailHandler");
Write("Loaded: " + loadResult.contentBlock + "<br>");
// "OMG_FW_EmailHandler_v1"
</script>
```

---

### Fase 4: Documentación

#### Paso 4.1: Actualizar README.md

```markdown
## Installation

### Quick Start (v1.x)

Load the framework:

\`\`\`javascript
%%=ContentBlockByKey("OMG_FW_Core")=%%
<!-- OR explicitly: -->
%%=ContentBlockByKey("OMG_FW_Core_v1")=%%

<script runat="server">
var info = OmegaFramework.getVersion();
Write("Using OmegaFramework v" + info.full);
</script>
\`\`\`

### Version Information

Current stable version: **v1.1.0**

- To use v1.x (current): `%%=ContentBlockByKey("OMG_FW_Core_v1")=%%`
- To use latest (alias): `%%=ContentBlockByKey("OMG_FW_Core")=%%` (currently points to v1)

See [VERSIONING_STRATEGY.md](VERSIONING_STRATEGY.md) for details.
```

#### Paso 4.2: Actualizar CLAUDE.md

Añadir sección de versionado:

```markdown
## Versioning

OmegaFramework follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (1.X.0): New features (backward compatible)
- **PATCH** (1.1.X): Bugfixes (backward compatible)

### Current Version: v1.1.0

Content Blocks use version suffix for major versions:
- `OMG_FW_Core_v1` (v1.x.x)
- `OMG_FW_EmailHandler_v1` (v1.x.x)

When v2 is released:
- `OMG_FW_Core_v2` (v2.x.x) - new major version
- `OMG_FW_Core_v1` (v1.x.x) - legacy, still supported

See [VERSIONING_STRATEGY.md](VERSIONING_STRATEGY.md) for complete strategy.
```

---

## 🚀 Próximos Pasos: Preparar v2.0.0

Cuando llegue el momento de crear una versión v2 con breaking changes:

### Estructura de Carpetas Propuesta

```
src/
├── v1/                      # Legacy (mantener para soporte)
│   ├── Core.ssjs
│   ├── EmailHandler.ssjs
│   └── ...
│
├── v2/                      # Nueva versión
│   ├── Core.ssjs            # Con breaking changes
│   ├── EmailHandler.ssjs    # Con breaking changes
│   └── ...
│
└── (archivos actuales sin versión apuntan a v1)
```

### Proceso de Creación de v2

1. **Duplicar archivos:**
   ```bash
   mkdir src/v1
   cp src/Core.ssjs src/v1/Core.ssjs
   # ... copiar todos los handlers a v1/

   mkdir src/v2
   cp src/v1/Core.ssjs src/v2/Core.ssjs
   # ... copiar todos los handlers a v2/
   ```

2. **Actualizar constantes en v2:**
   ```javascript
   // src/v2/Core.ssjs
   var FRAMEWORK_VERSION_MAJOR = 2;
   var FRAMEWORK_VERSION_MINOR = 0;
   var FRAMEWORK_VERSION_PATCH = 0;
   ```

3. **Hacer breaking changes en v2:**
   - Refactorizar arquitectura
   - Cambiar firmas de funciones
   - Eliminar código deprecado

4. **Crear nuevos Content Blocks en SFMC:**
   - `OMG_FW_Core_v2` (código de src/v2/Core.ssjs)
   - `OMG_FW_EmailHandler_v2` (código de src/v2/EmailHandler.ssjs)
   - etc.

5. **Mantener Content Blocks v1:**
   - `OMG_FW_Core_v1` (sin cambios)
   - `OMG_FW_EmailHandler_v1` (sin cambios)

6. **Documentar migración:**
   - Crear `MIGRATION_v1_to_v2.md`
   - Actualizar CHANGELOG.md con breaking changes

---

## ✅ Checklist de Implementación

### Fase 1: Preparación
- [ ] Backup de todos los Content Blocks actuales
- [ ] Renombrar Content Blocks en SFMC (añadir `_v1`)
- [ ] Crear Content Blocks alias (sin sufijo)
- [ ] Verificar que código existente sigue funcionando

### Fase 2: Código
- [ ] Actualizar `src/Core.ssjs` con constantes de versión
- [ ] Actualizar `OmegaFramework.load()` para usar versiones
- [ ] Añadir `OmegaFramework.getVersion()`
- [ ] Actualizar comentarios en todos los handlers
- [ ] Añadir propiedades `.VERSION` en handlers

### Fase 3: Configuración
- [ ] Crear `config/version.json`
- [ ] Crear `CHANGELOG.md`
- [ ] Crear `scripts/bump-version.sh`
- [ ] Hacer script ejecutable

### Fase 4: Documentación
- [ ] Crear `VERSIONING_STRATEGY.md`
- [ ] Crear `VERSIONING_QUICK_REFERENCE.md`
- [ ] Actualizar `README.md` con info de versión
- [ ] Actualizar `CLAUDE.md` con sección de versionado

### Fase 5: Testing
- [ ] Test con alias (retrocompatibilidad)
- [ ] Test con versión explícita
- [ ] Verificar `OmegaFramework.getVersion()`
- [ ] Verificar `OmegaFramework.getInfo()`

### Fase 6: Release
- [ ] Commit todos los cambios
- [ ] Tag v1.1.0
- [ ] Push a GitHub
- [ ] Comunicar cambios a usuarios

---

## 📊 Resultado Final

Después de implementar el versionado:

### Content Blocks en SFMC

```
Versionados:
├── OMG_FW_Core_v1
├── OMG_FW_Settings_v1
├── OMG_FW_ResponseWrapper_v1
├── OMG_FW_AuthHandler_v1
├── OMG_FW_ConnectionHandler_v1
├── OMG_FW_BaseHandler_v1
├── OMG_FW_EmailHandler_v1
├── OMG_FW_DataExtensionHandler_v1
├── OMG_FW_AssetHandler_v1
├── OMG_FW_FolderHandler_v1
└── OMG_FW_LogHandler_v1

Aliases (retrocompatibilidad):
├── OMG_FW_Core → apunta a OMG_FW_Core_v1
├── OMG_FW_EmailHandler → apunta a OMG_FW_EmailHandler_v1
└── ... (para handlers principales)
```

### Código de Usuario

```javascript
// Opción 1: Usar alias (recomendado para código legacy)
%%=ContentBlockByKey("OMG_FW_Core")=%%

// Opción 2: Versión explícita (recomendado para código nuevo)
%%=ContentBlockByKey("OMG_FW_Core_v1")=%%

// Opción 3: Cuando exista v2 (futuro)
%%=ContentBlockByKey("OMG_FW_Core_v2")=%%
```

---

## 🎯 Beneficios Obtenidos

✅ **Actualizaciones seguras**: Bugfixes y features se pueden desplegar sin romper código
✅ **Migración controlada**: Breaking changes requieren opt-in explícito
✅ **Múltiples versiones**: Proyectos diferentes pueden usar v1 o v2
✅ **Rollback fácil**: Volver a versión anterior = cambiar sufijo
✅ **Testing en paralelo**: Probar v2 sin afectar producción (v1)
✅ **Documentación clara**: Usuarios saben exactamente qué versión usan
✅ **CI/CD ready**: Script automático para bump de versión

---

## 📞 Soporte

Si tienes dudas sobre el versionado:

1. Ver `VERSIONING_QUICK_REFERENCE.md` para decisiones rápidas
2. Ver `VERSIONING_STRATEGY.md` para estrategia completa
3. Ver `CHANGELOG.md` para historial de cambios
4. Ver `config/version.json` para versión actual
