# 📁 Estructura del Repositorio Git para OmegaFramework

## 🚀 Repositorio Recomendado

```
omegaframework/
├── README.md                          # Documentación principal
├── LICENSE                            # Licencia MIT
├── .gitignore                         # Archivos a ignorar
├── framework.json                     # Configuración del framework
├── version.json                       # Control de versiones
│
├── src/                              # 📦 Código fuente de handlers
│   ├── ResponseWrapper.ssjs          # Wrapper de respuestas estándar
│   ├── AuthHandler.ssjs              # Gestión de autenticación
│   ├── ConnectionHandler.ssjs        # HTTP con retry logic
│   ├── EmailHandler.ssjs             # Gestión de emails
│   ├── DataExtensionHandler.ssjs     # Gestión de Data Extensions
│   ├── AssetHandler.ssjs             # Gestión de assets
│   ├── FolderHandler.ssjs            # Gestión de carpetas
│   └── LogHandler.ssjs               # Sistema de logging
│
├── setup/                            # ⚙️ Instalación y configuración
│   ├── Installer.ssjs                # Script de instalación automática
│   ├── Setup.html                    # CloudPage de configuración
│   └── TestExample.ssjs              # Validación y ejemplos
│
├── docs/                             # 📚 Documentación
│   ├── Documentation.html            # Documentación visual completa
│   ├── CLAUDE.md                     # Contexto de desarrollo
│   ├── API.md                        # Referencia de API
│   └── examples/                     # Ejemplos de uso
│       ├── basic-usage.ssjs          # Uso básico
│       ├── advanced-patterns.ssjs    # Patrones avanzados
│       └── error-handling.ssjs       # Manejo de errores
│
├── config/                           # ⚙️ Configuraciones
│   ├── development.json              # Config para desarrollo
│   ├── production.json               # Config para producción
│   └── templates/                    # Templates de configuración
│       ├── installed-package.json    # Template para Installed Package
│       └── data-extensions.json      # Templates para DEs necesarias
│
├── tools/                            # 🔧 Herramientas de desarrollo
│   ├── validator.ssjs                # Validador de instalación
│   ├── updater.ssjs                  # Actualizador de versiones
│   └── backup.ssjs                   # Sistema de backup
│
└── .github/                          # 🤖 GitHub Actions y workflows
    ├── workflows/
    │   ├── validate.yml              # Validación de código
    │   └── release.yml               # Proceso de release
    └── ISSUE_TEMPLATE/
        ├── bug_report.md             # Template para bugs
        └── feature_request.md        # Template para features
```

## 📋 Archivos Principales del Repositorio

### 🔧 Configuración Principal

**framework.json** - Configuración central del framework
```json
{
  "name": "OmegaFramework",
  "version": "1.0.0",
  "description": "SSJS Framework para Salesforce Marketing Cloud",
  "repository": "https://github.com/YOUR_USERNAME/omegaframework",
  "installer": {
    "baseUrl": "https://raw.githubusercontent.com/YOUR_USERNAME/omegaframework/main/",
    "autoDetection": true
  }
}
```

**version.json** - Control de versiones
```json
{
  "current": "1.0.0",
  "released": "2025-01-13T00:00:00Z",
  "previous": null,
  "breaking": false,
  "migration": null
}
```

### 📝 README.md Principal
```markdown
# 🚀 OmegaFramework para Salesforce Marketing Cloud

Framework SSJS simplificado inspirado en EMAIL360.

## 🚀 Instalación Rápida

### Opción 1: Instalación Automática (Recomendada)
1. Crear CloudPage con el contenido de `setup/Installer.ssjs`
2. Ejecutar con tus credenciales de SFMC
3. ¡Listo! Todos los Content Blocks se crearán automáticamente

### Opción 2: Instalación Manual
1. Descargar archivos de `src/`
2. Crear Content Blocks en SFMC manualmente
3. Copiar código de cada archivo

## 📚 Documentación
- [Documentación Visual Completa](docs/Documentation.html)
- [Guía de API](docs/API.md)
- [Ejemplos de Uso](docs/examples/)

## 🧪 Testing
```javascript
// Carga el TestExample.ssjs como CloudPage para validar
```

## 🤝 Contribuir
Ver [CONTRIBUTING.md](CONTRIBUTING.md) para guidelines.

## 📄 Licencia
MIT License - ver [LICENSE](LICENSE)
```

### 🚫 .gitignore
```
# Credentials y configuraciones sensibles
config/credentials.json
config/production-secrets.json
*.secret

# Logs y temporales
logs/
temp/
*.log

# Backups
backups/
*.backup

# IDE y editores
.vscode/
.idea/
*.swp
*.swo

# OS específicos
.DS_Store
Thumbs.db

# Node.js (si usas herramientas de build)
node_modules/
npm-debug.log*
```

## 🔄 Estrategia de Deployment Automático

### 📦 URLs de Acceso Directo

Los archivos en el repositorio serán accesibles vía URLs como:

```
https://raw.githubusercontent.com/YOUR_USERNAME/omegaframework/main/src/ResponseWrapper.ssjs
https://raw.githubusercontent.com/YOUR_USERNAME/omegaframework/main/src/AuthHandler.ssjs
https://raw.githubusercontent.com/YOUR_USERNAME/omegaframework/main/setup/Installer.ssjs
```

### 🤖 Script de Instalación Automática

El `Installer.ssjs` podrá:

1. **Leer configuración desde Git:**
```javascript
var configUrl = 'https://raw.githubusercontent.com/YOUR_USERNAME/omegaframework/main/framework.json';
var config = fetchFromUrl(configUrl);
```

2. **Descargar código fuente:**
```javascript
for (var i = 0; i < contentBlocks.length; i++) {
    var sourceUrl = baseUrl + contentBlocks[i].file;
    var sourceCode = fetchFromUrl(sourceUrl);
    createContentBlock(contentBlocks[i], sourceCode);
}
```

3. **Crear Content Blocks automáticamente:**
```javascript
var assetPayload = {
    name: frameworkConfig.prefix + blockConfig.name,
    assetType: { name: 'codesnippetblock', id: 220 },
    content: sourceCode,
    category: { name: frameworkConfig.category }
};
```

### 🔄 Sistema de Actualizaciones

**updater.ssjs** - Para actualizaciones automáticas:
```javascript
function updateFramework(authConfig) {
    // 1. Verificar versión actual
    var currentVersion = getCurrentVersion();
    
    // 2. Obtener última versión desde Git
    var latestVersion = getLatestVersion();
    
    // 3. Si hay actualización disponible
    if (needsUpdate(currentVersion, latestVersion)) {
        // 4. Backup de versión actual
        backupCurrentVersion();
        
        // 5. Descargar nueva versión
        downloadNewVersion();
        
        // 6. Actualizar Content Blocks
        updateContentBlocks();
        
        // 7. Ejecutar migraciones si es necesario
        runMigrations();
    }
}
```

## 🛡️ Consideraciones de Seguridad

### 🔒 Repositorio Público vs Privado

**Opción 1: Repositorio Público**
- ✅ Fácil acceso vía URLs directas
- ✅ No necesita autenticación
- ⚠️ Código visible públicamente
- ✅ Ideal para frameworks open source

**Opción 2: Repositorio Privado**
- 🔐 Código protegido
- ❌ Necesita tokens de acceso
- ❌ Más complejo para deployment automático
- ✅ Ideal para desarrollos propietarios

### 🔑 Manejo de Credenciales

```javascript
// ❌ NUNCA hacer esto
var authConfig = {
    clientId: 'hardcoded_client_id',
    clientSecret: 'hardcoded_secret'
};

// ✅ SIEMPRE hacer esto
var authConfig = {
    clientId: Platform.Request.GetFormField('clientId'),
    clientSecret: Platform.Request.GetFormField('clientSecret')
};
```

## 🚀 Workflow de Release

### 📝 Proceso de Release
1. **Desarrollo local** → Crear nuevas features
2. **Testing** → Validar con TestExample.ssjs
3. **Version bump** → Actualizar version.json
4. **Git commit** → Commit cambios
5. **Git tag** → Crear tag de versión
6. **GitHub release** → Crear release oficial
7. **Notificación** → Avisar a usuarios de nueva versión

### 🏷️ Versionado Semántico
- **1.0.0** → Release inicial
- **1.0.1** → Bug fixes
- **1.1.0** → Nuevas features (backward compatible)
- **2.0.0** → Breaking changes

### 📦 GitHub Releases
Cada release incluirá:
- Changelog detallado
- Archivos compilados/preparados
- Instrucciones de migración
- Compatibilidad backward

## 🤝 Colaboración y Contribuciones

### 🔀 Workflow de Contribuciones
1. **Fork** del repositorio
2. **Feature branch** para desarrollo
3. **Pull Request** con descripción detallada
4. **Code review** por maintainers
5. **Merge** después de aprobación

### 📋 Issue Templates
```markdown
## Bug Report
**Versión:** 
**Handler afectado:**
**Descripción:**
**Pasos para reproducir:**
**Comportamiento esperado:**
**Screenshots/Logs:**

## Feature Request
**Funcionalidad solicitada:**
**Justificación:**
**Propuesta de implementación:**
**Impacto en compatibilidad:**
```

## 🎯 Roadmap de Desarrollo

### 📅 v1.1 (Q2 2025)
- [ ] Automated installer completo
- [ ] Sistema de updates automático
- [ ] Handlers adicionales (Journey, Automation)
- [ ] Metrics y monitoring

### 📅 v1.2 (Q3 2025)
- [ ] Multi-environment support
- [ ] Advanced error recovery
- [ ] Performance optimizations
- [ ] Extended logging capabilities

### 📅 v2.0 (Q4 2025)
- [ ] Rewrite con TypeScript
- [ ] Web-based installer
- [ ] Real-time monitoring dashboard
- [ ] Enterprise features

---

**✅ RESPUESTA A TU PREGUNTA:**

**¿Es viable crear un sistema como EMAIL360 con deployment automático desde Git?**

**¡SÍ, es completamente viable!** 

**Razones:**
1. **SFMC REST API** permite crear Content Blocks programáticamente
2. **Script.Util.HttpRequest** puede leer archivos desde Git público
3. **El Installer.ssjs** puede automatizar todo el proceso
4. **GitHub raw URLs** proporcionan acceso directo a archivos
5. **Version management** es posible vía metadata

**¿Me veo capaz de ayudarte a gestionar esto con un solo script?**

**¡Absolutamente!** El `Installer.ssjs` que he creado ya incluye:
- ✅ Descarga automática desde Git
- ✅ Creación automática de Content Blocks
- ✅ Fallback a código embebido
- ✅ Validación y reportes de estado
- ✅ Manejo de errores robusto

**El siguiente paso sería:**
1. Crear el repositorio Git con esta estructura
2. Actualizar las URLs en el Installer.ssjs
3. ¡Ejecutar y ver la magia! 🎉