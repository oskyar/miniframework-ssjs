# OmegaFramework

Framework simplificado para Salesforce Marketing Cloud basado en ssjs-lib de EMAIL360.

## 📁 Estructura del Proyecto

```
omegaframework/
├── README.md                    # Este archivo
├── src/                         # Código fuente del framework
│   ├── ResponseWrapper.ssjs     # Sistema de respuestas estándar
│   ├── AuthHandler.ssjs         # Gestión de autenticación
│   ├── ConnectionHandler.ssjs   # HTTP requests con retry logic
│   ├── DataExtensionHandler.ssjs # Gestión de Data Extensions
│   ├── EmailHandler.ssjs        # Gestión de emails
│   ├── AssetHandler.ssjs        # Gestión de assets
│   ├── FolderHandler.ssjs       # Gestión de folders
│   ├── LogHandler.ssjs          # Sistema de logging
│   ├── AssetCreator.ssjs        # Creación automática de assets
│   └── JourneyCreator.ssjs      # Journey Builder (opcional)
├── install/                     # Instaladores automáticos
│   ├── GitInstaller.html        # Instalador desde Git (recomendado)
│   ├── Installer.ssjs           # Instalador con código embebido
│   ├── EnhancedInstaller.html   # Instalador completo con UI
│   ├── SimpleInstaller.html     # Instalador paso a paso
│   └── StandaloneInstaller.html # Instalador completamente autónomo
├── examples/                    # Ejemplos de uso
│   ├── TestExample.ssjs         # Ejemplo de testing completo
│   └── Setup.html               # Configuración manual paso a paso
├── docs/                        # Documentación
│   ├── Documentation.html       # Documentación visual completa
│   └── CLAUDE.md               # Contexto técnico para desarrolladores
└── config/                      # Configuración y versioning
    ├── framework.json           # Configuración del framework
    ├── version.json             # Control de versiones
    └── Updater.ssjs             # Sistema de actualizaciones
```

## 🚀 Instalación Rápida

### Opción 1: Desde Git (Recomendado)

1. Sube este repositorio a GitHub (público para testing)
2. Sube `install/GitInstaller.html` como CloudPage en SFMC
3. Configura tus credenciales de API
4. ¡Instalación automática!

### Opción 2: Manual

1. Copia cada archivo de `src/` como Content Block en SFMC
2. Usa el prefijo `OMG_FW_` para cada bloque
3. Ejecuta `examples/TestExample.ssjs` para validar

## 📋 Componentes Principales

### Core Handlers (src/)
- **ResponseWrapper**: Base para todas las respuestas
- **AuthHandler**: Autenticación REST API con refresh automático
- **ConnectionHandler**: HTTP requests con retry logic inteligente
- **DataExtensionHandler**: CRUD para Data Extensions (SSJS + REST)
- **EmailHandler**: CRUD para emails y templates
- **AssetHandler**: Gestión de assets en Content Builder
- **FolderHandler**: Organización de folders
- **LogHandler**: Multi-destination logging (console, DE, email)

### Utilidades
- **AssetCreator**: Crea automáticamente DEs, templates y triggered sends
- **JourneyCreator**: Journey Builder para alertas avanzadas (opcional)

## 🔧 Configuración

### Credenciales requeridas
```json
{
  "clientId": "tu_client_id",
  "clientSecret": "tu_client_secret", 
  "authBaseUrl": "https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/"
}
```

### Permisos necesarios
- Email: Read, Write
- Web: Read, Write
- Documents and Images: Read, Write
- Data Extensions: Read, Write

## 📖 Uso Básico

```javascript
// Cargar handlers necesarios
%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_AuthHandler")=%%
%%=ContentBlockByKey("OMG_FW_EmailHandler")=%%

// Configurar autenticación
var authConfig = {
    clientId: "tu_client_id",
    clientSecret: "tu_client_secret",
    authBaseUrl: "https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/"
};

// Usar el framework
var emailHandler = new OmegaFrameworkEmailHandler(authConfig);
var result = emailHandler.list();

if (result.success) {
    Write("Emails encontrados: " + result.data.length);
} else {
    Write("Error: " + result.error.message);
}
```

## 🧪 Testing

Ejecuta `examples/TestExample.ssjs` para validar que todos los componentes funcionan correctamente.

## 📚 Documentación

- **Documentación visual**: `docs/Documentation.html`
- **Contexto técnico**: `docs/CLAUDE.md`
- **Ejemplos de uso**: `examples/`

## 🔄 Actualizaciones

El framework incluye un sistema de actualizaciones automáticas:

```javascript
%%=ContentBlockByKey("OMG_FW_Updater")=%%

var updater = new OmegaFrameworkUpdater();
var updateResult = updater.checkForUpdates();
```

## 📝 Versión

**Versión actual**: 1.0.0  
**Última actualización**: Enero 2025

## 🤝 Contribuir

Este framework está basado en los patrones de [ssjs-lib](https://github.com/email360/ssjs-lib) y sigue sus mejores prácticas.

## ⚠️ Limitaciones

- Timeout SSJS: 30 segundos por ejecución
- Enterprise DEs: Limitaciones en SSJS functions
- Rate limits: APIs de SFMC tienen límites por minuto
- Memory constraints: SSJS tiene limitaciones de memoria

## 🆘 Soporte

- Revisa `docs/Documentation.html` para guías completas
- Usa `examples/TestExample.ssjs` para diagnosticar problemas
- Consulta `docs/CLAUDE.md` para detalles técnicos

---

**Desarrollado por**: Claude (Anthropic)  
**Inspirado en**: ssjs-lib de EMAIL360  
**Licencia**: MIT