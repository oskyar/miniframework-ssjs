# Referencia Rápida: Estrategia de Versionado

## 🎯 Decisión Rápida: ¿Qué hacer con mi cambio?

### Pregunta 1: ¿Rompe código existente?

❓ **¿Los usuarios tendrán que modificar su código para usar esta versión?**

- ✅ **SÍ** → Es un **BREAKING CHANGE** → Ir a [Sección MAJOR](#major-breaking-changes)
- ❌ **NO** → Ir a Pregunta 2

---

### Pregunta 2: ¿Es nueva funcionalidad?

❓ **¿Añades algo nuevo que los usuarios pueden usar (opcional)?**

- ✅ **SÍ** (ej: nuevo método, nueva opción) → Es un **FEATURE** → Ir a [Sección MINOR](#minor-new-features)
- ❌ **NO** (solo arreglas bug o mejoras internas) → Es un **BUGFIX** → Ir a [Sección PATCH](#patch-bugfixes)

---

## PATCH: Bugfixes

**Cambio de versión:** `1.1.0` → `1.1.1`

### ¿Cuándo usar PATCH?

- ✅ Arreglar un bug
- ✅ Optimizar código sin cambiar API
- ✅ Mejorar mensajes de error
- ✅ Corregir documentación
- ✅ Mejorar validaciones
- ✅ Fix de seguridad que no cambia API

### ❌ NO usar PATCH si:

- Añades un nuevo método (usa MINOR)
- Cambias comportamiento esperado (usa MAJOR)
- Añades un nuevo parámetro requerido (usa MAJOR)

### Proceso:

```bash
# 1. Hacer los cambios
# 2. Ejecutar script de bump
./scripts/bump-version.sh patch

# 3. Actualizar Content Blocks en SFMC (mismo nombre)
# - OMG_FW_EmailHandler_v1 (actualizar in-place)

# 4. Push
git push origin <branch>
git push origin v1.1.1
```

### Ejemplos:

```javascript
// ANTES (v1.1.0) - Bug: validación incorrecta
EmailHandler.prototype.send = function(emailId, recipients) {
    if (!emailId) {  // ❌ Bug: no valida recipients
        return this._error("EMAIL_ID_REQUIRED");
    }
    // ...
};

// DESPUÉS (v1.1.1) - PATCH: Arregla validación
EmailHandler.prototype.send = function(emailId, recipients) {
    if (!emailId) {
        return this._error("EMAIL_ID_REQUIRED");
    }
    if (!recipients || recipients.length === 0) {  // ✅ Fix
        return this._error("RECIPIENTS_REQUIRED");
    }
    // ...
};
```

**Impacto:** Usuarios no necesitan cambiar nada, solo obtienen bugfix automáticamente.

---

## MINOR: New Features

**Cambio de versión:** `1.1.0` → `1.2.0`

### ¿Cuándo usar MINOR?

- ✅ Añadir nuevo método (opcional)
- ✅ Añadir nuevo parámetro opcional
- ✅ Añadir nueva opción de configuración (opcional)
- ✅ Añadir nuevo handler
- ✅ Mejorar respuesta con campos adicionales (sin romper existentes)
- ✅ Deprecar algo (pero no eliminarlo todavía)

### ❌ NO usar MINOR si:

- Eliminas un método (usa MAJOR)
- Cambias tipo de retorno (usa MAJOR)
- Haces un parámetro opcional ahora requerido (usa MAJOR)
- Renombras función pública (usa MAJOR)

### Proceso:

```bash
# 1. Hacer los cambios
# 2. Ejecutar script de bump
./scripts/bump-version.sh minor

# 3. Actualizar Content Blocks en SFMC (mismo nombre)
# - OMG_FW_EmailHandler_v1 (actualizar in-place)

# 4. Push
git push origin <branch>
git push origin v1.2.0
```

### Ejemplos:

```javascript
// ANTES (v1.1.0)
EmailHandler.prototype.list = function() {
    // solo retorna lista
};

// DESPUÉS (v1.2.0) - MINOR: Añade método nuevo
EmailHandler.prototype.list = function() {
    // mismo comportamiento
};

// ✅ NUEVO método (opcional, backward compatible)
EmailHandler.prototype.archive = function(emailId) {
    // nueva funcionalidad
};

// Los usuarios que NO usan .archive() siguen funcionando igual
```

```javascript
// ANTES (v1.1.0)
EmailHandler.prototype.send = function(emailId, recipients) {
    // ...
};

// DESPUÉS (v1.2.0) - MINOR: Añade parámetro opcional
EmailHandler.prototype.send = function(emailId, recipients, options) {
    options = options || {};  // ✅ Opcional, default value
    var sendDate = options.sendDate || new Date();
    // ...
};

// Código viejo sigue funcionando:
emailHandler.send("123", ["email@example.com"]);  // ✅ OK

// Código nuevo puede usar nueva feature:
emailHandler.send("123", ["email@example.com"], {sendDate: futureDate});  // ✅ OK
```

**Impacto:** Usuarios obtienen nueva funcionalidad, pero no están obligados a usarla.

---

## MAJOR: Breaking Changes

**Cambio de versión:** `1.2.0` → `2.0.0`

### ¿Cuándo usar MAJOR?

- ✅ Cambiar firma de función (parámetros diferentes)
- ✅ Renombrar función pública
- ✅ Eliminar función pública
- ✅ Cambiar tipo de retorno (incompatible)
- ✅ Cambiar estructura de response
- ✅ Hacer parámetro opcional ahora requerido
- ✅ Refactorización arquitectural
- ✅ Cambiar comportamiento esperado

### Proceso:

```bash
# 1. Crear NUEVOS archivos versionados
cp src/Core.ssjs src/Core_v2.ssjs
cp src/EmailHandler.ssjs src/EmailHandler_v2.ssjs
# etc.

# 2. Hacer cambios en archivos v2
# 3. Actualizar referencias a versión 2
# 4. Ejecutar script de bump
./scripts/bump-version.sh major

# 5. Crear NUEVOS Content Blocks en SFMC
# - OMG_FW_Core_v2 (NUEVO)
# - OMG_FW_EmailHandler_v2 (NUEVO)

# 6. MANTENER Content Blocks v1 sin cambios
# - OMG_FW_Core_v1 (sin tocar)
# - OMG_FW_EmailHandler_v1 (sin tocar)

# 7. Crear guía de migración
# docs/MIGRATION_v1_to_v2.md

# 8. Push
git push origin <branch>
git push origin v2.0.0
```

### Ejemplos:

```javascript
// ANTES (v1.2.0)
EmailHandler.prototype.send = function(emailId, recipients) {
    // parámetros posicionales
};

// DESPUÉS (v2.0.0) - MAJOR: Cambia firma (objeto de opciones)
EmailHandler.prototype.send = function(options) {  // ❌ BREAKING!
    var emailId = options.emailId;
    var recipients = options.recipients;
    // ...
};

// Código viejo se rompe:
emailHandler.send("123", ["email@example.com"]);  // ❌ Error!

// Código nuevo requerido:
emailHandler.send({
    emailId: "123",
    recipients: ["email@example.com"]
});  // ✅ OK
```

```javascript
// ANTES (v1.2.0)
result = {
    success: true,
    data: {...}  // objeto directo
};

// DESPUÉS (v2.0.0) - MAJOR: Cambia estructura de response
result = {
    success: true,
    data: {
        items: [...],  // ❌ BREAKING! Ahora es array dentro
        metadata: {...}
    }
};

// Código viejo se rompe:
var item = result.data.item;  // ❌ undefined!

// Código nuevo requerido:
var items = result.data.items;  // ✅ OK
```

**Impacto:** Usuarios DEBEN modificar su código para actualizar a v2.

### Estrategia de migración:

**Opción A: Soporte dual (recomendado)**

```javascript
// src/Core_v1.ssjs
var FRAMEWORK_VERSION_MAJOR = 1;

// src/Core_v2.ssjs
var FRAMEWORK_VERSION_MAJOR = 2;

// Ambos existen en SFMC:
// - OMG_FW_Core_v1 (usuarios legacy)
// - OMG_FW_Core_v2 (usuarios nuevos)
```

**Opción B: Actualizar alias (avanzado)**

```javascript
// Content Block: OMG_FW_Core (alias)
// Antes: apuntaba a v1
%%=ContentBlockByKey("OMG_FW_Core_v1")=%%

// Después de 6 meses: actualizar a v2
%%=ContentBlockByKey("OMG_FW_Core_v2")=%%
```

---

## 📊 Tabla de Decisión Rápida

| Cambio | Tipo | Versión | Acción en SFMC |
|--------|------|---------|----------------|
| Arreglar bug de validación | PATCH | 1.1.0 → 1.1.1 | Actualizar CB in-place |
| Optimizar código interno | PATCH | 1.1.0 → 1.1.1 | Actualizar CB in-place |
| Añadir método `.archive()` | MINOR | 1.1.0 → 1.2.0 | Actualizar CB in-place |
| Añadir parámetro opcional `options` | MINOR | 1.1.0 → 1.2.0 | Actualizar CB in-place |
| Deprecar método `.old()` | MINOR | 1.1.0 → 1.2.0 | Actualizar CB in-place |
| Renombrar `.send()` → `.sendEmail()` | MAJOR | 1.2.0 → 2.0.0 | Crear nuevos CB _v2 |
| Cambiar `send(id, to)` → `send(options)` | MAJOR | 1.2.0 → 2.0.0 | Crear nuevos CB _v2 |
| Eliminar método `.legacy()` | MAJOR | 1.2.0 → 2.0.0 | Crear nuevos CB _v2 |
| Cambiar estructura de response | MAJOR | 1.2.0 → 2.0.0 | Crear nuevos CB _v2 |
| Refactorizar arquitectura | MAJOR | 1.2.0 → 2.0.0 | Crear nuevos CB _v2 |

---

## 🚀 Comandos Rápidos

### Actualización PATCH (bugfix)

```bash
# 1. Fix bug in code
# 2. Bump version
./scripts/bump-version.sh patch

# 3. Update CHANGELOG.md
# 4. Commit & tag (automatic)
# 5. Update same Content Blocks in SFMC
```

### Actualización MINOR (feature)

```bash
# 1. Add new feature
# 2. Bump version
./scripts/bump-version.sh minor

# 3. Update CHANGELOG.md
# 4. Commit & tag (automatic)
# 5. Update same Content Blocks in SFMC
```

### Actualización MAJOR (breaking)

```bash
# 1. Create v2 files
cp src/Core.ssjs src/Core_v2.ssjs
# ... etc

# 2. Make breaking changes in v2 files
# 3. Bump version
./scripts/bump-version.sh major

# 4. Update CHANGELOG.md (breaking changes section!)
# 5. Create migration guide
# 6. Commit & tag (automatic)
# 7. Create NEW Content Blocks _v2 in SFMC
# 8. Keep OLD Content Blocks _v1 unchanged
```

---

## 📝 Checklist Pre-Release

### Para PATCH:
- [ ] Bug arreglado y testeado
- [ ] Version bumped: `./scripts/bump-version.sh patch`
- [ ] CHANGELOG.md actualizado
- [ ] Content Blocks actualizados en SFMC
- [ ] Commit & tag creados
- [ ] Push a GitHub

### Para MINOR:
- [ ] Nueva feature implementada y testeada
- [ ] Documentación actualizada (README, ejemplos)
- [ ] Version bumped: `./scripts/bump-version.sh minor`
- [ ] CHANGELOG.md actualizado
- [ ] Content Blocks actualizados en SFMC
- [ ] Commit & tag creados
- [ ] Push a GitHub

### Para MAJOR:
- [ ] Cambios breaking implementados
- [ ] Nuevos archivos _v2 creados
- [ ] Guía de migración creada (`MIGRATION_v1_to_v2.md`)
- [ ] Version bumped: `./scripts/bump-version.sh major`
- [ ] CHANGELOG.md actualizado (sección Breaking Changes!)
- [ ] NUEVOS Content Blocks _v2 creados en SFMC
- [ ] Content Blocks _v1 mantenidos sin cambios
- [ ] Anuncio preparado para usuarios
- [ ] Commit & tag creados
- [ ] Push a GitHub
- [ ] Comunicar breaking changes a usuarios

---

## 🎓 Regla de Oro

> **Si no estás 100% seguro de que es backward compatible, usa MAJOR.**

Es mejor ser conservador y crear una nueva versión major que romper código de usuarios en producción.

---

## 📚 Referencias

- **Estrategia completa:** Ver `VERSIONING_STRATEGY.md`
- **Semantic Versioning:** https://semver.org/
- **CHANGELOG:** Ver `CHANGELOG.md`
- **Versión actual:** Ver `config/version.json`
