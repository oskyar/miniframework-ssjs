# Estructura del Proyecto MiniFramework

## 📁 Estructura completa organizada

```
miniframework/
├── .gitignore                          # Archivos a ignorar en Git
├── README.md                           # Documentación principal del proyecto
├── PROJECT_STRUCTURE.md               # Este archivo
├── GitRepository-Structure.md          # Estructura para repositorio Git
│
├── src/                               # 📦 CÓDIGO FUENTE DEL FRAMEWORK
│   ├── ResponseWrapper.ssjs            # Sistema de respuestas estándar
│   ├── AuthHandler.ssjs               # Gestión de autenticación REST API
│   ├── ConnectionHandler.ssjs         # HTTP requests con retry logic
│   ├── DataExtensionHandler.ssjs      # Gestión de Data Extensions (CRUD)
│   ├── EmailHandler.ssjs              # Gestión de emails (CRUD)
│   ├── AssetHandler.ssjs              # Gestión de assets Content Builder
│   ├── FolderHandler.ssjs             # Gestión de folders
│   ├── LogHandler.ssjs                # Sistema de logging multi-destino
│   ├── AssetCreator.ssjs              # Creación automática de assets
│   └── JourneyCreator.ssjs            # Journey Builder para alertas
│
├── install/                           # 🚀 INSTALADORES AUTOMÁTICOS
│   ├── GitInstaller.html              # Instalador desde Git (RECOMENDADO)
│   ├── Installer.ssjs                 # Instalador con código embebido
│   ├── EnhancedInstaller.html         # Instalador completo con UI
│   ├── SimpleInstaller.html           # Instalador paso a paso
│   └── StandaloneInstaller.html       # Instalador completamente autónomo
│
├── examples/                          # 📚 EJEMPLOS DE USO
│   ├── TestExample.ssjs               # Ejemplo de testing completo
│   └── Setup.html                     # Configuración manual paso a paso
│
├── docs/                              # 📖 DOCUMENTACIÓN
│   ├── Documentation.html             # Documentación visual completa
│   └── CLAUDE.md                      # Contexto técnico para desarrolladores
│
├── config/                            # ⚙️ CONFIGURACIÓN Y VERSIONING
│   ├── framework.json                 # Configuración del framework
│   ├── version.json                   # Control de versiones
│   └── Updater.ssjs                   # Sistema de actualizaciones
│
└── [archivos ocultos]                 # 🔧 ARCHIVOS DE CONFIGURACIÓN
    ├── .claude/                       # Configuración de Claude
    └── .vscode/                       # Configuración de VSCode
```

## 🎯 Archivos principales por carpeta

### `/src/` - Código fuente del framework
- **ResponseWrapper.ssjs**: Base para todas las respuestas del framework
- **AuthHandler.ssjs**: Manejo de autenticación y tokens REST API
- **ConnectionHandler.ssjs**: HTTP requests con retry logic inteligente
- **DataExtensionHandler.ssjs**: CRUD para Data Extensions (SSJS + REST)
- **EmailHandler.ssjs**: CRUD para emails y templates
- **AssetHandler.ssjs**: Gestión de assets en Content Builder
- **FolderHandler.ssjs**: Organización de folders y categorías
- **LogHandler.ssjs**: Logging multi-destino (console, DE, email)
- **AssetCreator.ssjs**: Creación automática de DEs, templates, triggered sends
- **JourneyCreator.ssjs**: Journey Builder para alertas avanzadas (opcional)

### `/install/` - Instaladores automáticos
- **GitInstaller.html**: 🌟 **RECOMENDADO** - Descarga desde Git y crea Content Blocks
- **Installer.ssjs**: Instalador con código embebido como fallback
- **EnhancedInstaller.html**: Instalador completo con interfaz visual
- **SimpleInstaller.html**: Instalador paso a paso estilo ssjs-lib
- **StandaloneInstaller.html**: Instalador completamente autónomo

### `/examples/` - Ejemplos de uso
- **TestExample.ssjs**: Ejemplo completo de testing de todos los handlers
- **Setup.html**: Configuración manual paso a paso para testing

### `/docs/` - Documentación
- **Documentation.html**: Documentación visual completa con ejemplos
- **CLAUDE.md**: Contexto técnico detallado para desarrolladores

### `/config/` - Configuración
- **framework.json**: Configuración general del framework
- **version.json**: Control de versiones para actualizaciones
- **Updater.ssjs**: Sistema de actualizaciones automáticas

## 🚀 Flujo de instalación recomendado

1. **Crear repositorio Git** con esta estructura
2. **Subir a GitHub** (público para testing)
3. **Usar GitInstaller.html** como CloudPage en SFMC
4. **Configurar credenciales** de API
5. **Instalación automática** de todos los Content Blocks

## 📋 URLs de Git para instalación

Para usar GitInstaller.html, las URLs serán:
```
https://raw.githubusercontent.com/YOUR_USERNAME/miniframework/main/src/ResponseWrapper.ssjs
https://raw.githubusercontent.com/YOUR_USERNAME/miniframework/main/src/AuthHandler.ssjs
https://raw.githubusercontent.com/YOUR_USERNAME/miniframework/main/src/ConnectionHandler.ssjs
...etc
```

## 🔧 Configuración para desarrollo

1. **Clonar repositorio**
2. **Configurar IDE** con archivos de `.vscode/`
3. **Usar Claude** con configuración de `.claude/`
4. **Testing** con `examples/TestExample.ssjs`

## 📝 Próximos pasos

1. **Crear repositorio Git** con esta estructura
2. **Probar GitInstaller.html** en SFMC
3. **Validar instalación** con TestExample.ssjs
4. **Usar framework** en proyectos reales

---

**Estructura creada por**: Claude (Anthropic)  
**Fecha**: Enero 2025  
**Versión**: 1.0.0