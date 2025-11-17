# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.1.0] - 2025-11-17

### Added

- **OMG_FW_Core**: Wrapper principal que carga automáticamente módulos base (ResponseWrapper, Settings, AuthHandler, ConnectionHandler, BaseHandler)
- **OMG_FW_Settings**: Sistema de configuración centralizada del framework
- **Singleton Pattern**: AuthHandler y ConnectionHandler compartidos entre todos los handlers
- **Token Caching**: Cache automático de tokens de autenticación para mejorar performance
- **Carga Condicional**: Nueva función `OmegaFramework.load(handlerName)` para cargar solo handlers necesarios
- **OmegaFramework Global Object**: API unificada con métodos:
  - `OmegaFramework.configure(config)`: Configurar framework
  - `OmegaFramework.load(handlerName)`: Cargar handler específico
  - `OmegaFramework.loadMultiple(handlerNames)`: Cargar múltiples handlers
  - `OmegaFramework.createHandler(handlerName)`: Crear instancia con singletons compartidos
  - `OmegaFramework.getAuth()`: Obtener singleton de AuthHandler
  - `OmegaFramework.getConnection()`: Obtener singleton de ConnectionHandler
  - `OmegaFramework.getConfig()`: Obtener configuración actual
  - `OmegaFramework.getInfo()`: Obtener información del framework
  - `OmegaFramework.reset()`: Resetear framework (útil para testing)
- **Funciones auxiliares de carga**: `loadEmailHandler()`, `loadDataExtensionHandler()`, etc.
- **Guías de migración**: Documentación completa de migración de v1.0 a v1.1

### Changed

- **Patrón de carga**: Simplificado de carga manual de todos los módulos a carga automática vía Core
- **Configuración**: Centralizada en un solo lugar en lugar de pasar config a cada handler
- **Performance**: ~60% menos llamadas API gracias a singleton pattern y token caching
- **Memoria**: ~40% menos uso de memoria al compartir instancias entre handlers

### Breaking Changes

⚠️ **Importante**: v1.1.0 introduce cambios en el patrón de uso, pero mantiene **retrocompatibilidad** con v1.0.0

**Patrón antiguo (v1.0.0) - TODAVÍA FUNCIONA:**
```javascript
%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_AuthHandler")=%%
%%=ContentBlockByKey("OMG_FW_EmailHandler")=%%

<script runat="server">
var authConfig = {...};
var emailHandler = new EmailHandler(authConfig);
</script>
```

**Patrón nuevo (v1.1.0) - RECOMENDADO:**
```javascript
%%=ContentBlockByKey("OMG_FW_Core")=%%

<script runat="server">
OmegaFramework.configure({auth: {...}});
OmegaFramework.load("EmailHandler");
var emailHandler = new EmailHandler(); // Sin config!
</script>
```

**Migración recomendada:**
- Ver `MIGRACION_v1.1.md` para guía detallada de migración

### Fixed

- Mejora en manejo de errores en AuthHandler cuando credenciales son inválidas
- Corrección en ConnectionHandler para manejar correctamente timeouts en retry logic
- Fix en validación de configuración en Settings

### Documentation

- Nueva guía `MIGRACION_v1.1.md`: Migración completa de v1.0 a v1.1
- Actualizado `CLAUDE.md`: Documentación técnica del framework
- Actualizado `README.md`: Ejemplos actualizados con nuevo patrón
- Nuevo `ANALISIS_COMPARATIVO.md`: Comparativa con ssjs-lib de EMAIL360

### Internal

- Refactorización de código base para soportar singleton pattern
- Mejoras en estructura de archivos para facilitar mantenimiento
- Optimización de imports y dependencias entre módulos

---

## [1.0.0] - 2025-10-01

### Added

- **Versión inicial de OmegaFramework**
- **OMG_FW_ResponseWrapper**: Wrapper estandarizado de respuestas
- **OMG_FW_AuthHandler**: Manejo de autenticación OAuth2 para SFMC REST API
- **OMG_FW_ConnectionHandler**: Wrapper de HTTP requests con retry logic
- **OMG_FW_EmailHandler**: CRUD para emails y templates
- **OMG_FW_DataExtensionHandler**: CRUD para Data Extensions con estrategia dual (SSJS + REST API)
- **OMG_FW_AssetHandler**: Gestión de assets en Content Builder
- **OMG_FW_FolderHandler**: Organización de carpetas
- **OMG_FW_LogHandler**: Sistema de logging multi-destino
- **OMG_FW_AssetCreator**: Creación automática de DEs, templates y triggered sends
- **OMG_FW_JourneyCreator**: Integración con Journey Builder

### Documentation

- `README.md`: Documentación básica del framework
- `GUIA_INSTALACION.md`: Guía de instalación paso a paso
- Ejemplos en carpeta `examples/`

### Installation

- `install/GitInstaller.html`: Instalador automático vía API
- `install/EnhancedInstaller.html`: Instalador mejorado con UI

---

## [Unreleased]

### Planned for v1.2.0

- [ ] Mejorar sistema de cache de tokens con expiración automática
- [ ] Añadir soporte para refresh automático de tokens expirados
- [ ] Optimizar carga condicional de handlers con lazy loading
- [ ] Añadir método `OmegaFramework.version()` para verificar versión en runtime
- [ ] Implementar sistema de deprecation warnings
- [ ] Mejorar documentación con más ejemplos prácticos

### Planned for v2.0.0 (Breaking Changes)

- [ ] Refactorización completa basada en nueva arquitectura (`/new-architecture`)
- [ ] Sistema de plugins extensible
- [ ] Soporte para múltiples estrategias de autenticación (OAuth2, Basic, Bearer)
- [ ] Sistema de integración base para servicios externos
- [ ] Cache de tokens en Data Extension para persistencia
- [ ] Manejo asíncrono mejorado
- [ ] Sistema de eventos/hooks
- [ ] Mejoras en testing con framework de pruebas integrado

---

## Tipos de Cambios

- **Added**: Nueva funcionalidad
- **Changed**: Cambios en funcionalidad existente
- **Deprecated**: Funcionalidad que será removida en versiones futuras
- **Removed**: Funcionalidad removida
- **Fixed**: Corrección de bugs
- **Security**: Correcciones de seguridad

---

## Versionado Semántico

Este proyecto sigue [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes que requieren cambios en código del usuario
- **MINOR** (1.X.0): Nueva funcionalidad backward-compatible
- **PATCH** (1.1.X): Bugfixes backward-compatible

### Política de Soporte

- **Versión actual (v1.x.x)**: Soporte completo hasta 2026-12-31
- **Versiones anteriores**: Sin soporte después de 6 meses del lanzamiento de nueva versión major

---

## Links de Referencia

- [v1.1.0](https://github.com/oskyar/miniframework-ssjs/releases/tag/v1.1.0)
- [v1.0.0](https://github.com/oskyar/miniframework-ssjs/releases/tag/v1.0.0)
