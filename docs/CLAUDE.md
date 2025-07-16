# CLAUDE.md - Contexto de Desarrollo del OmegaFramework

## 📋 Información del Proyecto

**Proyecto:** OmegaFramework para Salesforce Marketing Cloud  
**Desarrollado por:** Claude (Anthropic)  
**Fecha:** Enero 2025  
**Versión:** 1.0  
**Inspiración:** [ssjs-lib de EMAIL360](https://github.com/email360/ssjs-lib)
**Estado:** Sistema Completo con Creación Automática de Assets

## 🎯 Objetivos del Proyecto

### Requerimientos Originales del Usuario

El usuario solicitó crear un framework simplificado basado en ssjs-lib con las siguientes características:

1. **Modularidad:** Content Blocks independientes para diferentes funcionalidades
2. **Gestión completa:** Conexión con sistemas externos, login, API REST de SFMC
3. **Operaciones CRUD:** Para emails, Data Extensions, Assets, y Folders
4. **Patrón unificado:** Acceso por instancias similar a EMAIL360 (`email.create()`)
5. **Response wrapper estándar:** Para todos los manejadores
6. **Sin dependencias:** Excepto LogHandler, cada bloque debe ser independiente
7. **Solo SSJS oficial:** Utilizar únicamente funciones documentadas de SFMC
8. **Logging avanzado:** Con capacidad de envío de emails y almacenamiento en DE
9. **Creación automática de assets:** Data Extensions, Email Templates, y Triggered Sends
10. **Journey Builder opcional:** Para alertas avanzadas con lógica compleja

### Restricciones Técnicas Identificadas

- **Timeout SSJS:** 30 segundos por ejecución
- **HTTP Methods:** GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS disponibles
- **Rate Limiting:** Necesidad de retry logic para APIs
- **Encoding:** UTF-8 y headers personalizables
- **CORS:** Limitaciones para acceso externo a recursos
- **Permisos:** Requiere installed package con permisos REST API

## 📊 Investigación y Análisis

### Análisis de ssjs-lib (EMAIL360)

**Arquitectura encontrada:**
- Estructura modular en directorios: core/, doc/, sample/, setup/
- Sistema de autenticación JWT con métodos encode/decode/verify
- WSProxy para interacciones con SFMC API
- Log4ssjs con múltiples appenders (console, json, html, DataExtension, HTTPRequest, TriggeredSend)
- Sistema de instalación con wizard dinámico
- Carga de librerías vía Platform.Load() y Content blocks
- Versionado para compatibilidad hacia atrás

**Patrones de implementación:**
- Instance-based access pattern
- Configuración por prefijos y versioning
- Setup automático vía CloudPage
- Manejo de errores centralizado

### Análisis de SSJS Documentation

**Capacidades identificadas:**
- **Platform Functions:** JSON y JavaScript para interacción con Marketing Cloud
- **Script.Util.HttpRequest:** HTTP requests con múltiples métodos, timeout 30s
- **Data Extension Functions:** Acceso a campos y filas (no enterprise-level)
- **WSProxy patterns:** Para operaciones SOAP cuando REST no está disponible

**Limitaciones encontradas:**
- Data Extension functions no soportan enterprise-level DEs
- Timeout fijo de 30 segundos para activities
- Headers host y content-length no modificables
- Caching deshabilitado con headers personalizados

### Análisis de Marketing Cloud REST API

**Capacidades confirmadas:**
- CRUD operations para contacts, assets, emails
- Journey Builder integration
- Triggered Sends programáticos
- Content Builder management
- Mobile Connect/MobilePush APIs
- Limits y guidelines aplicables

## 🏗️ Decisiones de Arquitectura

### 1. Estructura Modular Independiente

**Decisión:** Crear 10 Content Blocks separados (actualizado desde 8 originales)
**Justificación:** 
- Permite uso granular según necesidades del proyecto
- Evita cargar código innecesario
- Facilita mantenimiento y actualizaciones
- Cumple requerimiento de independencia
- Incluye creación automática de assets necesarios

**Implementación:**
```
ResponseWrapper.ssjs      # Base para todos los handlers
AuthHandler.ssjs          # Independiente + ResponseWrapper
ConnectionHandler.ssjs    # Independiente + ResponseWrapper  
EmailHandler.ssjs         # Auth + Connection + ResponseWrapper
DataExtensionHandler.ssjs # Auth + Connection + ResponseWrapper
AssetHandler.ssjs         # Auth + Connection + ResponseWrapper
FolderHandler.ssjs        # Auth + Connection + ResponseWrapper
LogHandler.ssjs           # Puede usar otros handlers opcionalmente
AssetCreator.ssjs         # ResponseWrapper + crea DEs, Templates, Triggered Sends automáticamente
JourneyCreator.ssjs       # ResponseWrapper + Journey Builder para alertas avanzadas (opcional)
```

### 2. Response Wrapper Estándar

**Decisión:** Crear estructura de respuesta unificada
**Justificación:**
- Consistencia en toda la aplicación
- Facilita debug y manejo de errores
- Permite chaining de operaciones
- Estándard para logs y reporting

**Estructura implementada:**
```javascript
{
    success: boolean,
    data: object|array|null,
    error: {
        code: string,
        message: string,
        details: object
    } || null,
    meta: {
        timestamp: ISO_string,
        handler: string,
        operation: string
    }
}
```

### 3. Patrón de Instancia Unificado

**Decisión:** Constructor functions con configuración por parámetro
**Justificación:**
- Familiar para usuarios de EMAIL360
- Permite configuración flexible
- Facilita testing y debugging
- Soporta múltiples instancias con diferentes configs

**Implementación:**
```javascript
function EmailHandler(authConfig) {
    // Configuración privada
    var config = authConfig || {};
    
    // Métodos públicos
    return {
        create: function(data) { /* ... */ },
        update: function(id, data) { /* ... */ }
        // ...
    };
}

// Uso
var email = new EmailHandler(authConfig);
var result = email.create(emailData);
```

### 4. Autenticación REST API

**Decisión:** Handler dedicado con refresh automático de tokens
**Justificación:**
- Centraliza lógica de autenticación
- Maneja expiración de tokens transparentemente
- Soporta múltiples configuraciones
- Reutilizable por todos los handlers

**Características implementadas:**
- Token validation con buffer de expiración
- Refresh automático cuando es necesario
- Headers de autorización estandarizados
- Validación de permisos y scopes

### 5. Connection Handler con Retry Logic

**Decisión:** Wrapper de Script.Util.HttpRequest con reintentos inteligentes
**Justificación:**
- Maneja rate limiting de APIs automáticamente
- Reintentos para errores temporales (429, 5xx)
- Timeout y delay configurables
- Parsing JSON automático opcional

**Lógica implementada:**
- Reintentos en códigos: 429, 500, 502, 503, 504
- Delay configurable entre reintentos
- Máximo de reintentos configurable
- Parsing de respuestas JSON automático

### 6. Dual Strategy para Data Extensions

**Decisión:** SSJS functions como primario, REST API como fallback
**Justificación:**
- SSJS functions más eficientes para operaciones simples
- REST API necesario para DEs enterprise y operaciones complejas
- Fallback automático aumenta compatibilidad
- Mantiene performance óptima

**Implementación:**
```javascript
try {
    // Intentar con SSJS functions primero
    var de = DataExtension.Init(deKey);
    var result = de.Rows.Add(recordData);
    return response.success(result);
} catch (ssjsEx) {
    // Fallback a REST API
    return restApiOperation();
}
```

### 7. Sistema de Logging Multi-destino

**Decisión:** LogHandler con múltiples outputs configurables
**Justificación:**
- Flexibilidad para diferentes entornos
- Debugging en desarrollo (consola)
- Persistencia en producción (Data Extension)
- Alertas críticas (email)

**Outputs implementados:**
- Console: Para debugging inmediato
- Data Extension: Para persistencia y análisis
- Email: Para alertas críticas automáticas
- Levels: ERROR, WARN, INFO, DEBUG

## 🔧 Implementación Técnica

### Manejo de Errores

**Estrategia:** Múltiples capas de error handling
1. **Validation errors:** Parámetros requeridos y formato
2. **HTTP errors:** Status codes y response handling  
3. **Exception handling:** Try-catch para errores inesperados
4. **API errors:** Parsing de errores específicos de SFMC

### Performance Optimizations

**Estrategias implementadas:**
1. **Lazy loading:** Solo cargar handlers necesarios
2. **Token caching:** Reutilizar tokens válidos
3. **Connection pooling:** Reutilizar configuraciones HTTP
4. **Retry backoff:** Delays incrementales en reintentos

### Security Considerations

**Medidas implementadas:**
1. **No hardcoding:** Credenciales por parámetro únicamente
2. **Token expiration:** Validación automática con buffer
3. **Input validation:** Sanitización de parámetros
4. **Error sanitization:** No exposición de credenciales en logs

## 🧪 Testing Strategy

### Validation Approach

**Niveles de testing implementados:**
1. **Unit level:** Cada método individualmente
2. **Integration level:** Handlers trabajando juntos
3. **E2E level:** Operaciones completas de usuario
4. **Error handling:** Scenarios de fallo controlado

### TestExample.ssjs

**Cobertura implementada:**
- Authentication flow completo
- List operations para todos los handlers
- Connection handler validation
- Response wrapper functionality
- Error scenarios y recovery
- Logging functionality

## 📦 Deployment Strategy

### Manual Installation

**Proceso estándar:**
1. Crear Content Blocks manualmente en SFMC
2. Copiar código de cada archivo .ssjs
3. Configurar credenciales en Setup.html
4. Validar instalación con TestExample.ssjs

### Automated Installation ✅

**Proceso automático implementado:**
1. EnhancedInstaller.html - Instalación completa con interfaz visual
2. Installer.ssjs lee archivos desde Git o usa código embebido
3. AssetCreator.ssjs crea automáticamente DEs, Templates, Triggered Sends
4. JourneyCreator.ssjs opcional para alertas avanzadas
5. Validación automática y reporte de resultados

**Características disponibles:** 
- ✅ Creación automática de Content Blocks vía REST API
- ✅ Lectura de archivos desde Git público con fallback local
- ✅ Asset creation para DEs, Email Templates y Triggered Sends
- ✅ Version management con metadata
- ✅ Instalación zero-config con interfaz visual

## 🔄 Version Management

### Current Version: 1.0

**Características de v1.0:**
- 10 Content Blocks completos y funcionales (8 handlers + AssetCreator + JourneyCreator)
- Response wrapper estándar
- Creación automática de Data Extensions, Email Templates y Triggered Sends
- Journey Builder opcional para alertas avanzadas
- Documentation completa actualizada
- Setup y testing tools
- Instalación automatizada completa disponible

### Future Versions (Roadmap)

**v1.1 (Planned):**
- Git integration completa
- Version checking y updates automáticos
- Enhanced error reporting
- Performance optimizations adicionales

**v1.2 (Planned):**
- Additional handlers (Journey, Automation)
- Performance optimizations
- Extended logging capabilities
- Multi-environment support

## 🚨 Known Limitations

### Technical Constraints

1. **SSJS Timeout:** 30 segundos máximo por ejecución
2. **Enterprise DEs:** Limitaciones en SSJS functions
3. **CORS Restrictions:** Acceso limitado a recursos externos
4. **Rate Limits:** APIs de SFMC tienen límites por minuto
5. **Memory Constraints:** SSJS tiene limitaciones de memoria

### Workarounds Implemented

1. **Chunking:** Para operaciones grandes
2. **Retry Logic:** Para rate limiting
3. **Fallback Methods:** SSJS → REST API
4. **Error Recovery:** Reintentos automáticos
5. **Memory Management:** Cleanup de variables grandes

## 🔍 Debugging Guide

### Common Issues

**Authentication Failures:**
- Verificar credenciales en Installed Package
- Confirmar permisos REST API
- Validar Auth Base URL format

**Timeout Issues:**
- Reducir pageSize en list operations
- Implementar chunking para operaciones grandes
- Usar async patterns donde sea posible

**Permission Errors:**
- Verificar scopes en Installed Package
- Confirmar user permissions en SFMC
- Validar Content Builder access

### Debug Tools Included

**LogHandler:** Para tracking detallado
**TestExample.ssjs:** Para validation completa
**Setup.html:** Para configuración paso a paso
**Response wrapper:** Para error details consistentes

## 📚 Resources Used

### Documentation Sources

1. **Official Salesforce Marketing Cloud Documentation**
   - REST API Reference
   - SSJS Platform Functions
   - Data Extension Functions
   - Script.Util.HttpRequest

2. **Community Resources**
   - ssjsdocs.xyz para ejemplos prácticos
   - Gortonington.com para patterns avanzados
   - SFMC-Cookbook para best practices

3. **Inspiration Sources**
   - ssjs-lib de EMAIL360 para arquitectura
   - Marketing Cloud APIs documentation
   - Community forums y Stack Overflow

### Key Learning Sources

**Web Searches Performed:**
- "Salesforce Marketing Cloud REST API v1 reference 2025"
- "SSJS functions documentation Marketing Cloud"
- "Script.Util.HttpRequest examples"
- "Marketing Cloud Data Extension operations"

**Documentation Analyzed:**
- developer.salesforce.com/docs/marketing/marketing-cloud/
- REST API overview y reference
- SSJS Platform Functions guide
- Data Extension Functions reference

## 🎯 Success Criteria Met

### Original Requirements ✅

1. ✅ **Modular Architecture:** 10 Content Blocks independientes
2. ✅ **CRUD Operations:** Para emails, DEs, assets, folders
3. ✅ **Unified Pattern:** Patrón de instancia como EMAIL360
4. ✅ **Standard Response:** Wrapper consistente para todos
5. ✅ **No Dependencies:** Cada bloque independiente (excepto Log)
6. ✅ **Official SSJS Only:** Solo funciones documentadas
7. ✅ **Advanced Logging:** Multi-destino con email alerts
8. ✅ **Automatic Asset Creation:** DEs, Templates, Triggered Sends
9. ✅ **Journey Builder:** Para alertas avanzadas (opcional)

### Technical Excellence ✅

1. ✅ **Error Handling:** Múltiples capas de validación
2. ✅ **Performance:** Retry logic y optimizaciones
3. ✅ **Security:** No hardcoding, validation, sanitization
4. ✅ **Documentation:** Completa y detallada
5. ✅ **Testing:** Tools de validation incluidos
6. ✅ **Maintainability:** Código limpio y estructurado

### Future Extensibility ✅

1. ✅ **Git Integration Ready:** Arquitectura preparada
2. ✅ **Version Management:** Structure para updates
3. ✅ **Automated Deployment:** Foundation implementada
4. ✅ **Scalability:** Patterns para nuevos handlers

## 🚀 Next Steps

### Immediate Actions for User

1. **Test Installation:** Seguir Documentation.html paso a paso
2. **Validate Functionality:** Ejecutar TestExample.ssjs
3. **Implement Use Cases:** Usar en CloudPages/emails reales
4. **Provide Feedback:** Reportar issues o mejoras needed

### Development Roadmap

1. ✅ **Complete Installer:** Automatización completa implementada
2. ✅ **Asset Creation:** DEs, Templates, Triggered Sends automático
3. ✅ **Journey Integration:** Journey Builder para alertas avanzadas
4. **Git Integration:** Repository structure y deployment (pendiente)
5. **Extended Handlers:** Automation Studio, etc. (futuro)

---

**Este documento sirve como contexto completo para futuras modificaciones, debugging, o extensiones del OmegaFramework. Contiene toda la información necesaria para que Claude u otros desarrolladores puedan continuar el trabajo de manera efectiva.**