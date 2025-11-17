# Índice: Documentación de Versionado

## 📚 Guías Disponibles

### 1. Referencia Rápida (START HERE!)
**Archivo:** `VERSIONING_QUICK_REFERENCE.md`

**Para:** Decisiones rápidas del día a día

**Cuándo usar:**
- ✅ "Acabo de hacer un cambio, ¿qué tipo de versión es?"
- ✅ "¿Esto es PATCH, MINOR o MAJOR?"
- ✅ "¿Actualizo in-place o creo nuevo Content Block?"

**Contenido:**
- Árbol de decisión simple
- Tabla de referencia rápida
- Comandos para ejecutar
- Checklist pre-release

---

### 2. Estrategia Completa
**Archivo:** `VERSIONING_STRATEGY.md`

**Para:** Entender la estrategia a fondo

**Cuándo usar:**
- ✅ Primera vez implementando versionado
- ✅ Necesitas entender el "por qué"
- ✅ Planificando arquitectura de versiones
- ✅ Tomando decisiones estratégicas

**Contenido:**
- Comparativa de 3 estrategias de versionado
- Pros y contras de cada una
- Recomendación para OmegaFramework
- Casos prácticos detallados
- Matriz de decisión

---

### 3. Guía de Implementación
**Archivo:** `IMPLEMENTING_VERSIONING.md`

**Para:** Pasos concretos para implementar versionado

**Cuándo usar:**
- ✅ Vas a implementar versionado por primera vez
- ✅ Necesitas renombrar Content Blocks
- ✅ Vas a crear versión v2
- ✅ Necesitas checklist paso a paso

**Contenido:**
- Plan de implementación en fases
- Scripts para renombrar Content Blocks
- Ejemplos de código actualizado
- Testing paso a paso
- Checklist completo

---

### 4. Historial de Cambios
**Archivo:** `CHANGELOG.md`

**Para:** Ver qué cambió en cada versión

**Cuándo usar:**
- ✅ ¿Qué hay de nuevo en v1.2.0?
- ✅ ¿Cuándo se añadió esta feature?
- ✅ ¿Hay breaking changes?
- ✅ Comunicar cambios a usuarios

**Contenido:**
- Historial de todas las versiones
- Added / Changed / Fixed / Breaking Changes
- Fechas de release
- Links a documentación de migración

---

### 5. Configuración de Versión
**Archivo:** `config/version.json`

**Para:** Source of truth de la versión actual

**Cuándo usar:**
- ✅ Automatización de CI/CD
- ✅ Scripts que necesitan versión actual
- ✅ Verificar versión instalada

**Contenido:**
```json
{
  "major": 1,
  "minor": 1,
  "patch": 0,
  "full": "1.1.0",
  "releaseDate": "2025-11-17",
  "breakingChanges": [...]
}
```

---

### 6. Script de Bump
**Archivo:** `scripts/bump-version.sh`

**Para:** Automatizar cambios de versión

**Cuándo usar:**
- ✅ Cada vez que hagas un release
- ✅ Automatizar actualización de versión

**Uso:**
```bash
./scripts/bump-version.sh patch   # 1.1.0 → 1.1.1
./scripts/bump-version.sh minor   # 1.1.0 → 1.2.0
./scripts/bump-version.sh major   # 1.1.0 → 2.0.0
```

**Qué hace:**
- Lee versión actual de `config/version.json`
- Calcula nueva versión
- Actualiza todos los archivos relevantes
- Crea commit y tag automáticamente
- Te recuerda actualizar CHANGELOG.md

---

## 🎯 Flujo de Trabajo Recomendado

### Escenario 1: Arreglar un Bug

1. **Identificar tipo:** Ver `VERSIONING_QUICK_REFERENCE.md` → PATCH
2. **Hacer el fix** en código
3. **Bump versión:** `./scripts/bump-version.sh patch`
4. **Actualizar CHANGELOG.md** (sección Fixed)
5. **Actualizar Content Block** en SFMC (mismo nombre `_v1`)
6. **Push:** `git push origin <branch> && git push origin v1.1.1`

---

### Escenario 2: Añadir Nueva Feature Compatible

1. **Identificar tipo:** Ver `VERSIONING_QUICK_REFERENCE.md` → MINOR
2. **Implementar feature** (asegurar backward compatibility)
3. **Actualizar tests** y documentación
4. **Bump versión:** `./scripts/bump-version.sh minor`
5. **Actualizar CHANGELOG.md** (sección Added)
6. **Actualizar Content Block** en SFMC (mismo nombre `_v1`)
7. **Push:** `git push origin <branch> && git push origin v1.2.0`

---

### Escenario 3: Breaking Change (v2.0.0)

1. **Identificar tipo:** Ver `VERSIONING_QUICK_REFERENCE.md` → MAJOR
2. **Leer:** `IMPLEMENTING_VERSIONING.md` (sección Preparar v2.0.0)
3. **Crear estructura v2:**
   ```bash
   mkdir src/v2
   cp -r src/v1/* src/v2/
   ```
4. **Hacer breaking changes** en src/v2/
5. **Actualizar constantes de versión** en v2
6. **Bump versión:** `./scripts/bump-version.sh major`
7. **Crear guía migración:** `MIGRATION_v1_to_v2.md`
8. **Actualizar CHANGELOG.md** (sección Breaking Changes!)
9. **Crear NUEVOS Content Blocks** en SFMC con sufijo `_v2`
10. **Mantener v1** sin cambios
11. **Push:** `git push origin <branch> && git push origin v2.0.0`

---

## 📖 Lectura por Roles

### Para Desarrolladores del Framework

**Lectura obligatoria:**
1. `VERSIONING_STRATEGY.md` (entender estrategia)
2. `IMPLEMENTING_VERSIONING.md` (implementación técnica)
3. `VERSIONING_QUICK_REFERENCE.md` (día a día)

**Herramientas:**
- `scripts/bump-version.sh` (usar en cada release)
- `config/version.json` (actualizar automáticamente)
- `CHANGELOG.md` (actualizar manualmente)

---

### Para Usuarios del Framework

**Lectura obligatoria:**
1. `CHANGELOG.md` (¿qué cambió?)
2. `VERSIONING_QUICK_REFERENCE.md` (entender versiones)

**Si migras de v1 a v2:**
- `MIGRATION_v1_to_v2.md` (cuando exista)

---

### Para DevOps / CI/CD

**Lectura obligatoria:**
1. `config/version.json` (source of truth)
2. `scripts/bump-version.sh` (automatización)

**Integración:**
```yaml
# .github/workflows/release.yml
- name: Bump version
  run: ./scripts/bump-version.sh ${{ github.event.inputs.version_type }}
```

---

## 🔗 Links Externos de Referencia

- [Semantic Versioning 2.0.0](https://semver.org/) - Especificación oficial
- [Keep a Changelog](https://keepachangelog.com/) - Formato de CHANGELOG
- [SFMC Content Blocks](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/contentblocks.html) - Documentación SFMC

---

## ❓ FAQ

### ¿Por qué versionado semántico?

Porque SFMC no tiene gestión de paquetes como npm. Sin versionado explícito:
- ❌ Actualizaciones pueden romper código en producción
- ❌ No hay rollback fácil
- ❌ Diferentes proyectos no pueden usar diferentes versiones

Con versionado:
- ✅ Actualizaciones seguras (PATCH/MINOR in-place)
- ✅ Breaking changes controlados (MAJOR nuevo CB)
- ✅ Coexistencia de versiones (v1 y v2)

### ¿Cuándo crear v2?

Solo cuando tengas **breaking changes** inevitables:
- Refactorización arquitectural
- Cambio de firma de funciones
- Eliminación de API deprecada
- Cambio de estructura de response

Para todo lo demás, usa MINOR (features) o PATCH (bugfixes).

### ¿Cuánto tiempo soportar v1 después de lanzar v2?

**Recomendado:** Mínimo 6 meses

- Durante 6 meses: Bugfixes en v1 y v2
- Después de 6 meses: Solo bugfixes críticos en v1
- Después de 1 año: Solo v2

### ¿Qué pasa si no estoy seguro del tipo de cambio?

**Regla de oro:** Si dudas, usa MAJOR.

Es mejor ser conservador que romper código de usuarios.

### ¿Puedo saltarme versiones?

- ✅ PATCH: Sí (1.1.0 → 1.1.2 está bien si 1.1.1 no se publicó)
- ✅ MINOR: Sí (1.1.0 → 1.3.0 está bien)
- ❌ MAJOR: No recomendado (1.0.0 → 3.0.0 confunde a usuarios)

---

## 📞 Necesitas Ayuda?

1. **Decisión rápida:** `VERSIONING_QUICK_REFERENCE.md`
2. **Entender estrategia:** `VERSIONING_STRATEGY.md`
3. **Implementar:** `IMPLEMENTING_VERSIONING.md`
4. **Ver cambios:** `CHANGELOG.md`
5. **Versión actual:** `config/version.json`

---

**Última actualización:** 2025-11-17
**Versión de esta documentación:** 1.0.0
