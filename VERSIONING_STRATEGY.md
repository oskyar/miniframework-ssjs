# Estrategia de Versionado para OmegaFramework en SFMC

## 📊 Contexto: Desafíos Únicos de SFMC

A diferencia de entornos tradicionales (Node.js con npm, Java con Maven, etc.), **SFMC no tiene gestión de dependencias**:

- ❌ No existe `package.json` ni control de versiones automático
- ❌ No hay "instalación" de paquetes con versiones específicas
- ❌ Los Content Blocks se actualizan **globalmente** sin versionado
- ❌ Código en producción puede romperse al actualizar un Content Block
- ✅ Los Content Blocks se cargan dinámicamente por nombre
- ✅ Puedes tener múltiples Content Blocks con diferentes nombres

**Implicaciones críticas:**
1. Una actualización "in-place" afecta TODAS las CloudPages/Automations que usen ese Content Block
2. No hay "rollback" automático si algo falla
3. No hay manera de que diferentes proyectos usen diferentes versiones del mismo módulo (sin estrategia)

---

## 🎯 Estrategias de Versionado: Comparativa

### Estrategia 1: Actualización In-Place (Sin Versionado)

**Cómo funciona:**
```javascript
// Siempre el mismo nombre
OMG_FW_Core
OMG_FW_EmailHandler
OMG_FW_AuthHandler
```

**Actualización:**
- Editas el Content Block existente directamente
- Todos los usuarios obtienen la nueva versión inmediatamente

**✅ Ventajas:**
- Simple de mantener
- No hay duplicación de código
- Los usuarios siempre tienen la última versión
- Menos Content Blocks que gestionar

**❌ Desventajas:**
- **BREAKING CHANGES pueden romper código en producción**
- No hay posibilidad de rollback rápido
- No puedes probar nuevas versiones en paralelo
- Diferentes proyectos no pueden usar diferentes versiones
- Difícil hacer testing de actualizaciones mayores

**📋 Cuándo usarla:**
- ✅ Para bugfixes menores sin breaking changes
- ✅ Para optimizaciones internas (sin cambios de API)
- ✅ Para añadir funcionalidades opcionales (backward compatible)
- ❌ NUNCA para breaking changes

---

### Estrategia 2: Versionado Semántico con Sufijos (Multi-Versión)

**Cómo funciona:**
```javascript
// Versión Major en el nombre
OMG_FW_Core_v1          // v1.0.0, v1.1.0, v1.2.0 (compatible)
OMG_FW_Core_v2          // v2.0.0 (breaking changes)
OMG_FW_EmailHandler_v1
OMG_FW_EmailHandler_v2
```

**Actualización:**
- Creas nuevos Content Blocks para versiones mayores (v2, v3, etc.)
- Mantienes versiones anteriores para compatibilidad
- Los usuarios migran explícitamente

**✅ Ventajas:**
- **Cero riesgo de romper código existente**
- Migración controlada y gradual
- Diferentes proyectos pueden usar diferentes versiones
- Puedes probar v2 en paralelo con v1
- Rollback es simplemente usar la versión anterior
- Ideal para frameworks empresariales

**❌ Desventajas:**
- Más Content Blocks que gestionar
- Duplicación de código (v1 y v2 coexisten)
- Necesitas documentación clara de cada versión
- Los usuarios deben actualizar referencias manualmente
- Costes de mantenimiento de múltiples versiones

**📋 Cuándo usarla:**
- ✅ Para breaking changes (v1 → v2)
- ✅ Para refactorizaciones arquitecturales
- ✅ Cuando múltiples proyectos necesitan estabilidad
- ✅ En entornos empresariales con múltiples equipos
- ❌ Para bugfixes o mejoras menores

---

### Estrategia 3: Versionado Híbrido (RECOMENDADO)

**Cómo funciona:**

Combina ambas estrategias usando **Semantic Versioning**:

```
MAJOR.MINOR.PATCH
  |     |     |
  |     |     └─ Bugfixes (actualización in-place)
  |     └─────── Features compatibles (actualización in-place)
  └───────────── Breaking changes (nuevo Content Block)
```

**Estructura:**
```javascript
// Core y Handlers Base (versión major en nombre)
OMG_FW_Core_v1              // v1.0.0, v1.1.0, v1.2.0 → actualización in-place
OMG_FW_Core_v2              // v2.0.0 → NUEVO Content Block

// Handlers (heredan versión del Core)
OMG_FW_EmailHandler_v1      // Compatible con Core_v1
OMG_FW_EmailHandler_v2      // Compatible con Core_v2

// Módulos base (versión major en nombre)
OMG_FW_ResponseWrapper_v1
OMG_FW_AuthHandler_v1
OMG_FW_Settings_v1
```

**Reglas de actualización:**

| Tipo de cambio | Versión | Estrategia | Ejemplo |
|----------------|---------|------------|---------|
| Bugfix | PATCH (1.0.0 → 1.0.1) | In-place | Arreglar error en validación |
| Nueva feature compatible | MINOR (1.0.0 → 1.1.0) | In-place | Añadir nuevo método opcional |
| Breaking change | MAJOR (1.0.0 → 2.0.0) | Nuevo CB | Cambiar firma de constructor |
| Optimización interna | PATCH (1.0.0 → 1.0.1) | In-place | Mejorar performance sin cambiar API |

**✅ Ventajas:**
- Balance entre simplicidad y seguridad
- Actualizaciones rápidas para bugfixes/features
- Seguridad para breaking changes
- Mantenimiento razonable

**❌ Desventajas:**
- Requiere disciplina en versionado semántico
- Necesitas documentación clara de CHANGELOG

---

## 🏗️ Implementación Recomendada para OmegaFramework

### Paso 1: Estructura de Content Blocks con Versionado

**Renombrar Content Blocks actuales (MAJOR v1):**

```
Actual                    →  Nueva nomenclatura
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OMG_FW_Core                  OMG_FW_Core_v1
OMG_FW_Settings              OMG_FW_Settings_v1
OMG_FW_ResponseWrapper       OMG_FW_ResponseWrapper_v1
OMG_FW_AuthHandler           OMG_FW_AuthHandler_v1
OMG_FW_ConnectionHandler     OMG_FW_ConnectionHandler_v1
OMG_FW_BaseHandler           OMG_FW_BaseHandler_v1
OMG_FW_EmailHandler          OMG_FW_EmailHandler_v1
OMG_FW_DataExtensionHandler  OMG_FW_DataExtensionHandler_v1
OMG_FW_AssetHandler          OMG_FW_AssetHandler_v1
OMG_FW_FolderHandler         OMG_FW_FolderHandler_v1
OMG_FW_LogHandler            OMG_FW_LogHandler_v1
```

**Crear alias sin versión (para compatibilidad):**

```javascript
// Content Block: OMG_FW_Core (alias)
%%=ContentBlockByKey("OMG_FW_Core_v1")=%%
```

**Ventaja:** Los usuarios existentes siguen funcionando, pero pueden elegir versión específica.

---

### Paso 2: Actualizar Core.ssjs para Cargar Versión Correcta

**Opción A: Versionado automático en Core**

```javascript
// src/Core_v1.ssjs
<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * OMEGAFRAMEWORK CORE v1.2.0
 */

// Define la versión major actual
var FRAMEWORK_VERSION_MAJOR = 1;
var FRAMEWORK_VERSION_FULL = "1.2.0";

// Función helper para cargar módulos versionados
function loadVersionedModule(moduleName) {
    var versionedName = "OMG_FW_" + moduleName + "_v" + FRAMEWORK_VERSION_MAJOR;
    return Platform.Function.TreatAsContent(
        Platform.Function.ContentBlockByKey(versionedName)
    );
}
</script>

%%=TreatAsContent(ContentBlockByKey("OMG_FW_ResponseWrapper_v1"))=%%
%%=TreatAsContent(ContentBlockByKey("OMG_FW_Settings_v1"))=%%
%%=TreatAsContent(ContentBlockByKey("OMG_FW_AuthHandler_v1"))=%%
%%=TreatAsContent(ContentBlockByKey("OMG_FW_ConnectionHandler_v1"))=%%
%%=TreatAsContent(ContentBlockByKey("OMG_FW_BaseHandler_v1"))=%%

<script runat="server">
// Actualizar OmegaFramework.load() para usar versionado
OmegaFramework.load = function(handlerName) {
    try {
        if (OmegaFramework._loadedHandlers[handlerName]) {
            return {
                success: true,
                message: handlerName + " already loaded",
                cached: true
            };
        }

        // Usar versión del framework
        var contentBlockKey = "OMG_FW_" + handlerName + "_v" + FRAMEWORK_VERSION_MAJOR;

        try {
            Platform.Function.ContentBlockByKey(contentBlockKey);
            OmegaFramework._loadedHandlers[handlerName] = true;

            return {
                success: true,
                message: handlerName + " loaded successfully (v" + FRAMEWORK_VERSION_MAJOR + ")",
                version: FRAMEWORK_VERSION_FULL,
                cached: false
            };
        } catch (loadEx) {
            return {
                success: false,
                error: "Failed to load " + handlerName + " v" + FRAMEWORK_VERSION_MAJOR + ": " + loadEx.message
            };
        }

    } catch (ex) {
        return {
            success: false,
            error: ex.message || ex.toString()
        };
    }
};

// Actualizar getInfo() para mostrar versión completa
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
        initialized: OmegaFramework._initialized,
        loadedHandlers: handlers
    };
};
</script>
```

**Opción B: Versionado explícito en código del usuario**

```javascript
// El usuario elige la versión explícitamente
%%=ContentBlockByKey("OMG_FW_Core_v1")=%%

<script runat="server">
// Usa v1.x.x automáticamente
var info = OmegaFramework.getInfo();
Write("Using version: " + info.version); // "1.2.0"
</script>
```

---

### Paso 3: Gestión de CHANGELOG y Releases

**Crear archivo de versión:**

```javascript
// config/version.json
{
  "major": 1,
  "minor": 2,
  "patch": 0,
  "full": "1.2.0",
  "releaseDate": "2025-11-17",
  "breakingChanges": []
}
```

**Crear CHANGELOG.md estructurado:**

```markdown
# Changelog

## [1.2.0] - 2025-11-17

### Added
- Nueva función `OmegaFramework.getVersion()` para obtener versión actual
- Soporte para versionado semántico en Content Blocks

### Changed
- Mejora de performance en AuthHandler (caché de tokens optimizado)

### Fixed
- Corregido error en ConnectionHandler al manejar timeouts

## [1.1.0] - 2025-10-15

### Added
- OMG_FW_Core con carga automática de módulos base
- OMG_FW_Settings para configuración centralizada
- Patrón Singleton para AuthHandler y ConnectionHandler

### Breaking Changes
- Cambio en patrón de carga de módulos (de manual a automático)
```

---

## 📝 Proceso de Actualización: Casos Prácticos

### Caso 1: Bugfix en EmailHandler (v1.1.0 → v1.1.1)

**Tipo:** PATCH (compatible, sin breaking changes)

**Proceso:**
1. ✅ Arreglar el bug en `src/EmailHandler.ssjs`
2. ✅ Actualizar versión en comentario del archivo: `v1.1.0` → `v1.1.1`
3. ✅ Actualizar CHANGELOG.md
4. ✅ **Actualizar DIRECTAMENTE** el Content Block `OMG_FW_EmailHandler_v1` en SFMC
5. ✅ Commit en Git: `git commit -m "fix: EmailHandler validation bug (v1.1.1)"`
6. ✅ Crear tag: `git tag v1.1.1`

**Resultado:**
- Todos los usuarios obtienen el bugfix automáticamente
- Sin necesidad de cambiar ningún código del usuario
- Sin crear nuevos Content Blocks

---

### Caso 2: Nueva Feature Compatible (v1.1.1 → v1.2.0)

**Tipo:** MINOR (nueva funcionalidad, backward compatible)

**Ejemplo:** Añadir método `emailHandler.archive(emailId)`

**Proceso:**
1. ✅ Añadir nueva función `archive()` en `src/EmailHandler.ssjs`
2. ✅ Actualizar versión: `v1.1.1` → `v1.2.0`
3. ✅ Actualizar documentación y CHANGELOG
4. ✅ **Actualizar DIRECTAMENTE** el Content Block `OMG_FW_EmailHandler_v1`
5. ✅ Actualizar versión en `Core_v1.ssjs`: `FRAMEWORK_VERSION_FULL = "1.2.0"`
6. ✅ Commit: `git commit -m "feat: add archive() method to EmailHandler (v1.2.0)"`
7. ✅ Tag: `git tag v1.2.0`

**Resultado:**
- Usuarios pueden usar `.archive()` si quieren
- Código antiguo sigue funcionando (no usarán `.archive()`)
- Sin breaking changes

---

### Caso 3: Breaking Change en Core (v1.2.0 → v2.0.0)

**Tipo:** MAJOR (breaking changes)

**Ejemplo:** Cambiar firma de `OmegaFramework.configure()` para usar async patterns

**Proceso:**

1. ✅ Crear **NUEVOS** archivos:
   - `src/Core_v2.ssjs`
   - `src/Settings_v2.ssjs`
   - `src/AuthHandler_v2.ssjs`
   - etc.

2. ✅ Actualizar versión interna:
   ```javascript
   var FRAMEWORK_VERSION_MAJOR = 2;
   var FRAMEWORK_VERSION_FULL = "2.0.0";
   ```

3. ✅ Crear **NUEVOS** Content Blocks en SFMC:
   - `OMG_FW_Core_v2`
   - `OMG_FW_Settings_v2`
   - `OMG_FW_AuthHandler_v2`
   - etc.

4. ✅ **MANTENER** Content Blocks v1 sin cambios:
   - `OMG_FW_Core_v1` (sigue funcionando para usuarios existentes)
   - `OMG_FW_AuthHandler_v1`
   - etc.

5. ✅ Actualizar documentación:
   - `MIGRATION_v1_to_v2.md` (guía de migración detallada)
   - `CHANGELOG.md` con sección `### Breaking Changes`

6. ✅ Crear alias opcional:
   ```javascript
   // Content Block: OMG_FW_Core (apunta a v2)
   %%=ContentBlockByKey("OMG_FW_Core_v2")=%%
   ```

7. ✅ Commit: `git commit -m "feat!: OmegaFramework v2.0.0 with async support (BREAKING)"`
8. ✅ Tag: `git tag v2.0.0`

**Migración del Usuario:**

```javascript
// ANTES (v1.x.x) - sigue funcionando
%%=ContentBlockByKey("OMG_FW_Core_v1")=%%
<script runat="server">
OmegaFramework.configure({auth: {...}});
var email = OmegaFramework.createHandler("EmailHandler");
</script>

// DESPUÉS (v2.x.x) - nuevo código
%%=ContentBlockByKey("OMG_FW_Core_v2")=%%
<script runat="server">
// Nueva API con async patterns
OmegaFramework.configureAsync({auth: {...}}, function(result) {
    if (result.success) {
        var email = OmegaFramework.createHandler("EmailHandler");
    }
});
</script>
```

**Resultado:**
- v1 sigue funcionando para usuarios existentes
- v2 disponible para nuevos proyectos
- Migración gradual y controlada

---

## 🚀 Automatización del Versionado

### Script de Bumping de Versión

```bash
# scripts/bump-version.sh

#!/bin/bash

VERSION_TYPE=$1  # patch, minor, major

# Leer versión actual
CURRENT_VERSION=$(cat config/version.json | jq -r '.full')

# Calcular nueva versión
if [ "$VERSION_TYPE" == "patch" ]; then
    NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$NF = $NF + 1;} 1' | sed 's/ /./g')
elif [ "$VERSION_TYPE" == "minor" ]; then
    NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$2 = $2 + 1; $3 = 0;} 1' | sed 's/ /./g')
elif [ "$VERSION_TYPE" == "major" ]; then
    NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$1 = $1 + 1; $2 = 0; $3 = 0;} 1' | sed 's/ /./g')
fi

echo "Bumping version: $CURRENT_VERSION → $NEW_VERSION"

# Actualizar version.json
# Actualizar todos los archivos src/*.ssjs
# Generar CHANGELOG automático
# Crear commit y tag

git commit -am "chore: bump version to $NEW_VERSION"
git tag v$NEW_VERSION
```

### Instalador que Detecta Versión

```javascript
// install/VersionedInstaller.html

// Detectar versión a instalar
var version = getFrameworkVersion(); // Lee de version.json

// Crear Content Blocks con sufijo de versión
createContentBlock("OMG_FW_Core_v" + version.major, coreCode);
createContentBlock("OMG_FW_EmailHandler_v" + version.major, emailCode);
```

---

## 📊 Matriz de Decisión

| Escenario | Tipo de cambio | Acción recomendada |
|-----------|----------------|-------------------|
| Arreglar bug crítico | PATCH | Actualización in-place |
| Optimizar código interno | PATCH | Actualización in-place |
| Añadir método opcional | MINOR | Actualización in-place |
| Añadir parámetro opcional | MINOR | Actualización in-place |
| Cambiar firma de función | MAJOR | Nuevo Content Block (v2) |
| Renombrar función pública | MAJOR | Nuevo Content Block (v2) |
| Cambiar estructura de response | MAJOR | Nuevo Content Block (v2) |
| Eliminar método deprecado | MAJOR | Nuevo Content Block (v2) |
| Refactorización arquitectural | MAJOR | Nuevo Content Block (v2) |

---

## ✅ Recomendación Final

### Para OmegaFramework, sugiero:

1. **Adoptar Versionado Híbrido** (Estrategia 3)

2. **Renombrar Content Blocks actuales a v1:**
   - `OMG_FW_Core` → `OMG_FW_Core_v1`
   - `OMG_FW_EmailHandler` → `OMG_FW_EmailHandler_v1`
   - Etc.

3. **Crear alias sin versión para compatibilidad:**
   ```javascript
   // OMG_FW_Core (alias)
   %%=ContentBlockByKey("OMG_FW_Core_v1")=%%
   ```

4. **Usar Semantic Versioning:**
   - **PATCH** (1.1.0 → 1.1.1): Actualización in-place
   - **MINOR** (1.1.0 → 1.2.0): Actualización in-place
   - **MAJOR** (1.2.0 → 2.0.0): Nuevos Content Blocks

5. **Documentar todo cambio en CHANGELOG.md**

6. **Usar Git tags** para cada release: `v1.2.0`, `v2.0.0`

7. **Mantener soporte para v1 durante mínimo 6 meses** después de lanzar v2

---

## 📚 Referencias y Recursos

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [SFMC Content Blocks Best Practices](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/contentblocks.html)

---

## 🔄 Siguiente Pasos

1. [ ] Decidir: ¿Adoptar versionado ahora o en próxima versión major?
2. [ ] Renombrar Content Blocks en SFMC (si se adopta)
3. [ ] Actualizar documentación y ejemplos
4. [ ] Crear guía de migración para usuarios
5. [ ] Actualizar instaladores para soportar versionado
6. [ ] Configurar CI/CD para automatizar bumping de versión
