# TASK: Refactor - Eliminar Auth Strategies y Centralizar Auth en Integrations

**Prioridad**: Alta
**Tipo**: Refactoring arquitectónico
**Estimación**: 3-4 horas
**Asignado a**: Developer Agent

---

## Contexto

Actualmente, el framework tiene una arquitectura de autenticación descentralizada con estrategias separadas (`BasicAuthStrategy`, `BearerAuthStrategy`, `OAuth2AuthStrategy`) que:
- Añaden complejidad innecesaria
- Dificultan el debugging (múltiples saltos entre archivos)
- No manejan bien casos específicos de cada plataforma (SFMC tiene `rest_instance_url`, Salesforce tiene `instance_url`)
- Complican el testing (necesitas mockear múltiples estrategias)

**Decisión arquitectónica**: Mover la lógica de autenticación dentro de cada integración específica.

---

## Objetivo

1. **Eliminar** los archivos de estrategias de autenticación
2. **Mover** la lógica OAuth2 dentro de `SFMCIntegration.ssjs`
3. **Simplificar** `BaseIntegration.ssjs` (eliminar `authStrategy`, `setAuthStrategy`, `getAuthHeaders`)
4. **Actualizar** tests para reflejar la nueva arquitectura
5. **Mantener** `CredentialStore` y `DataExtensionTokenCache` (son útiles)

---

## Archivos a ELIMINAR

```
src/auth/BasicAuthStrategy.ssjs
src/auth/BearerAuthStrategy.ssjs
src/auth/OAuth2AuthStrategy.ssjs
src/tests/auth/Test_BasicAuthStrategy.ssjs
src/tests/auth/Test_BearerAuthStrategy.ssjs
src/tests/auth/Test_OAuth2AuthStrategy.ssjs
```

**Acción**: Eliminar estos 6 archivos completamente.

---

## Archivo 1: `src/core/BaseIntegration.ssjs`

### Cambios Requeridos

**ELIMINAR** (líneas ~18-25):
```javascript
function BaseIntegration(responseWrapper, connectionHandler, integrationName, integrationConfig, authStrategy) {
    var handler = integrationName || 'BaseIntegration';
    var response = responseWrapper;
    var config = integrationConfig || {};

    // Dependencies
    var connection = connectionHandler;
    var auth = authStrategy || null;  // ← ELIMINAR esta línea
```

**REEMPLAZAR CON**:
```javascript
function BaseIntegration(responseWrapper, connectionHandler, integrationName, integrationConfig) {
    var handler = integrationName || 'BaseIntegration';
    var response = responseWrapper;
    var config = integrationConfig || {};

    // Dependencies
    var connection = connectionHandler;
    // Auth is now handled by each specific integration
```

**ELIMINAR funciones** (líneas ~50-120):
- `setAuthStrategy(strategy)` - Ya no necesaria
- `getAuthHeaders()` - Cada integración maneja sus propios headers

**ELIMINAR de validateConfig()** (líneas ~130-145):
- La validación de authStrategy
- Simplificar solo a validar `baseUrl`

**SIMPLIFICAR buildHeaders()** (líneas ~200-230):
```javascript
// ANTES (con auth):
function buildHeaders(customHeaders) {
    var headers = {
        'Content-Type': 'application/json'
    };

    // Get auth headers if auth strategy is set
    if (auth) {
        var authHeadersResult = auth.getHeaders();
        if (authHeadersResult.success) {
            var authHeaders = authHeadersResult.data;
            for (var key in authHeaders) {
                headers[key] = authHeaders[key];
            }
        }
    }

    // Merge custom headers
    if (customHeaders) {
        for (var key in customHeaders) {
            headers[key] = customHeaders[key];
        }
    }

    return headers;
}

// DESPUÉS (sin auth - solo custom headers):
function buildHeaders(customHeaders) {
    var headers = {
        'Content-Type': 'application/json'
    };

    // Merge custom headers
    if (customHeaders) {
        for (var key in customHeaders) {
            headers[key] = customHeaders[key];
        }
    }

    return headers;
}
```

**ACTUALIZAR factory registration** (líneas ~280-295):
```javascript
// ANTES:
OmegaFramework.register('BaseIntegration', {
    dependencies: ['ResponseWrapper', 'ConnectionHandler'],
    blockKey: 'OMG_FW_BaseIntegration',
    factory: function(responseWrapper, connectionHandler, config) {
        return new BaseIntegration(
            responseWrapper,
            connectionHandler,
            config.integrationName,
            config.integrationConfig,
            config.authStrategy  // ← ELIMINAR
        );
    }
});

// DESPUÉS:
OmegaFramework.register('BaseIntegration', {
    dependencies: ['ResponseWrapper', 'ConnectionHandler'],
    blockKey: 'OMG_FW_BaseIntegration',
    factory: function(responseWrapper, connectionHandler, config) {
        return new BaseIntegration(
            responseWrapper,
            connectionHandler,
            config.integrationName,
            config.integrationConfig
        );
    }
});
```

---

## Archivo 2: `src/integrations/SFMCIntegration.ssjs`

### Cambios Requeridos

**ELIMINAR** (líneas 139-151):
```javascript
// Initialize OAuth2 strategy with SFMC-specific configuration
var oauth2Config = {
    tokenUrl: config.authBaseUrl + 'v2/token',
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    grantType: 'client_credentials',
    scope: config.scope || null,
    refreshBuffer: config.refreshBuffer || 300000, // 5 minutes
    cacheKey: config.clientId // Use clientId as cache key
};

var authStrategy = OmegaFramework.create('OAuth2AuthStrategy', oauth2Config);
base.setAuthStrategy(authStrategy);
```

**AÑADIR después de línea 133** (después de crear `base`):
```javascript
// ====================================================================
// SFMC OAUTH2 AUTHENTICATION (Internal)
// ====================================================================

// Initialize token cache
var tokenCache = null;
if (!__OmegaFramework.loaded['DataExtensionTokenCache']) {
    Platform.Function.ContentBlockByKey("OMG_FW_DataExtensionTokenCache");
}

// Create token cache with clientId as key
var tokenCacheFactory = OmegaFramework.require('DataExtensionTokenCache', {});
tokenCache = tokenCacheFactory(config.clientId, {
    refreshBuffer: config.refreshBuffer || 300000 // 5 minutes
});

/**
 * Requests new OAuth2 token from SFMC
 * @private
 * @returns {object} Response with token info
 */
function requestNewToken() {
    try {
        var tokenPayload = {
            grant_type: 'client_credentials',
            client_id: config.clientId,
            client_secret: config.clientSecret
        };

        if (config.scope) {
            tokenPayload.scope = config.scope;
        }

        // Make OAuth2 token request
        var httpResult = connection.post(config.authBaseUrl + 'v2/token', tokenPayload);

        if (!httpResult.success) {
            return httpResult;
        }

        // Parse SFMC token response
        var tokenData = httpResult.data.parsedContent;

        // Fallback manual parsing if needed
        if (!tokenData && httpResult.data.content) {
            try {
                tokenData = Platform.Function.ParseJSON(String(httpResult.data.content));
            } catch (parseEx) {
                return response.error(
                    'Failed to parse SFMC OAuth2 token response: ' + parseEx.message,
                    handler,
                    'requestNewToken',
                    { response: httpResult.data.content }
                );
            }
        }

        if (!tokenData || !tokenData.access_token) {
            return response.error(
                'SFMC OAuth2 token response missing access_token',
                handler,
                'requestNewToken',
                {
                    response: httpResult.data.content,
                    parsedContent: tokenData
                }
            );
        }

        // Build SFMC-specific token info
        var tokenInfo = {
            accessToken: tokenData.access_token,
            tokenType: tokenData.token_type || 'Bearer',
            expiresIn: tokenData.expires_in || 1080,
            obtainedAt: new Date().getTime(),
            expiresAt: null, // Will be calculated by cache
            scope: tokenData.scope || config.scope || null,
            restInstanceUrl: tokenData.rest_instance_url || null,
            soapInstanceUrl: tokenData.soap_instance_url || null
        };

        // Calculate expiresAt
        tokenInfo.expiresAt = tokenInfo.obtainedAt + (tokenInfo.expiresIn * 1000);

        // Store in cache
        var cacheResult = tokenCache.set(tokenInfo);

        if (!cacheResult.success) {
            // Token obtained but caching failed - log warning but continue
        }

        return response.success(tokenInfo, handler, 'requestNewToken');

    } catch (ex) {
        return response.error(
            'Failed to request SFMC OAuth2 token: ' + (ex.message || ex.toString()),
            handler,
            'requestNewToken',
            { exception: ex.toString() }
        );
    }
}

/**
 * Checks if a token is expired
 * @private
 * @param {object} tokenInfo - Token info to check
 * @returns {boolean} true if expired
 */
function isTokenExpired(tokenInfo) {
    return tokenCache.isExpired(tokenInfo);
}
```

**REEMPLAZAR `getToken()` function** (líneas 157-174):
```javascript
// ANTES:
/**
 * Gets OAuth2 token (from cache or new request)
 *
 * @returns {object} Response with token information
 */
function getToken() {
    if (!auth) {
        return response.authError('No authentication strategy configured', handler, 'getToken');
    }

    return auth.getToken();
}

// DESPUÉS:
/**
 * Gets OAuth2 token (from cache or new request)
 *
 * @returns {object} Response with token information
 */
function getToken() {
    // Check cache first
    var cachedResult = tokenCache.get();

    if (cachedResult.success && cachedResult.data !== null && !isTokenExpired(cachedResult.data)) {
        return response.success(cachedResult.data, handler, 'getToken');
    }

    // No valid cached token, request new one
    return requestNewToken();
}
```

**REEMPLAZAR `refreshToken()` function** (líneas 176-188):
```javascript
// ANTES:
/**
 * Forces token refresh (clears cache and requests new token)
 *
 * @returns {object} Response with new token
 */
function refreshToken() {
    if (!auth) {
        return response.authError('No authentication strategy configured', handler, 'refreshToken');
    }

    return auth.refreshToken();
}

// DESPUÉS:
/**
 * Forces token refresh (clears cache and requests new token)
 *
 * @returns {object} Response with new token
 */
function refreshToken() {
    tokenCache.clear();
    return getToken();
}
```

**ACTUALIZAR `makeRestRequest()` function** (líneas 190-250):
```javascript
// ANTES (usa base.getAuthHeaders()):
function makeRestRequest(method, endpoint, payload, options) {
    // Get auth headers from base integration
    var authHeadersResult = base.getAuthHeaders();
    if (!authHeadersResult.success) {
        return authHeadersResult;
    }

    // Build full URL
    var url = base.buildUrl(endpoint);

    // Build headers
    var headers = authHeadersResult.data;
    // ... rest of function
}

// DESPUÉS (construye auth headers internamente):
function makeRestRequest(method, endpoint, payload, options) {
    // Get OAuth2 token
    var tokenResult = getToken();
    if (!tokenResult.success) {
        return tokenResult;
    }

    var tokenInfo = tokenResult.data;

    // Build auth headers
    var headers = {
        'Authorization': tokenInfo.tokenType + ' ' + tokenInfo.accessToken,
        'Content-Type': 'application/json'
    };

    // Use rest_instance_url from token if available
    var baseUrl = tokenInfo.restInstanceUrl || config.baseUrl;
    var url = baseUrl + endpoint;

    // Add query params if provided
    if (options && options.queryParams) {
        url += base.buildQueryString(options.queryParams);
    }

    // Merge custom headers
    if (options && options.headers) {
        for (var key in options.headers) {
            headers[key] = options.headers[key];
        }
    }

    // Make HTTP request
    var httpResult = connection.request(method, url, payload, headers);

    return httpResult;
}
```

**ACTUALIZAR `makeSoapRequest()` function** (líneas 252-290):
```javascript
// ANTES (usa base.getAuthHeaders()):
function makeSoapRequest(soapAction, soapEnvelope, options) {
    // Get auth headers from base integration
    var authHeadersResult = base.getAuthHeaders();
    if (!authHeadersResult.success) {
        return authHeadersResult;
    }
    // ... rest
}

// DESPUÉS (construye auth headers internamente):
function makeSoapRequest(soapAction, soapEnvelope, options) {
    // Get OAuth2 token
    var tokenResult = getToken();
    if (!tokenResult.success) {
        return tokenResult;
    }

    var tokenInfo = tokenResult.data;

    // Use soap_instance_url from token if available
    var soapUrl = tokenInfo.soapInstanceUrl || config.baseUrl;

    // Build SOAP headers
    var headers = {
        'Authorization': tokenInfo.tokenType + ' ' + tokenInfo.accessToken,
        'Content-Type': 'text/xml',
        'SOAPAction': soapAction
    };

    // Merge custom headers
    if (options && options.headers) {
        for (var key in options.headers) {
            headers[key] = options.headers[key];
        }
    }

    // Make SOAP request
    var httpResult = connection.post(soapUrl, soapEnvelope, headers);

    return httpResult;
}
```

**ELIMINAR** línea 301 (debugging):
```javascript
Write(Stringify(base))  // ← ELIMINAR esta línea
```

**ACTUALIZAR factory registration** (líneas 480-500):
```javascript
// ANTES:
OmegaFramework.register('SFMCIntegration', {
    dependencies: ['ResponseWrapper', 'ConnectionHandler', 'BaseIntegration', 'OAuth2AuthStrategy', 'DataExtensionTokenCache', 'CredentialStore'],
    blockKey: 'OMG_FW_SFMCIntegration',
    factory: function(responseWrapper, connectionHandler, baseIntegrationFactory, oauth2Factory, tokenCacheFactory, credStoreFactory, config) {
        return new SFMCIntegration(config);
    }
});

// DESPUÉS:
OmegaFramework.register('SFMCIntegration', {
    dependencies: ['ResponseWrapper', 'ConnectionHandler', 'BaseIntegration', 'DataExtensionTokenCache', 'CredentialStore'],
    blockKey: 'OMG_FW_SFMCIntegration',
    factory: function(responseWrapper, connectionHandler, baseIntegrationFactory, tokenCacheFactory, credStoreFactory, config) {
        return new SFMCIntegration(config);
    }
});
```

---

## Archivo 3: `src/integrations/DataCloudIntegration.ssjs`

### Cambios Similares a SFMCIntegration

**ELIMINAR** (líneas 26-39):
```javascript
// Setup OAuth2 authentication for Data Cloud
if (config.auth) {
    var oauth2Config = {
        tokenUrl: config.auth.tokenUrl,
        clientId: config.auth.clientId,
        clientSecret: config.auth.clientSecret,
        grantType: config.auth.grantType || 'client_credentials',
        scope: config.auth.scope || 'cdp_api',
        cacheKey: config.auth.clientId
    };

    var authStrategy = OmegaFramework.create('OAuth2AuthStrategy', oauth2Config);
    base.setAuthStrategy(authStrategy);
}
```

**AÑADIR** después de crear `base`:
```javascript
// ====================================================================
// DATA CLOUD OAUTH2 AUTHENTICATION (Internal)
// ====================================================================

var tokenCache = null;
var authConfig = config.auth || {};

if (authConfig && authConfig.clientId) {
    if (!__OmegaFramework.loaded['DataExtensionTokenCache']) {
        Platform.Function.ContentBlockByKey("OMG_FW_DataExtensionTokenCache");
    }

    var tokenCacheFactory = OmegaFramework.require('DataExtensionTokenCache', {});
    tokenCache = tokenCacheFactory(authConfig.clientId, {
        refreshBuffer: 300000 // 5 minutes
    });
}

function requestNewToken() {
    if (!authConfig || !authConfig.clientId) {
        return response.authError('Data Cloud OAuth2 configuration missing', handler, 'requestNewToken');
    }

    try {
        var tokenPayload = {
            grant_type: authConfig.grantType || 'client_credentials',
            client_id: authConfig.clientId,
            client_secret: authConfig.clientSecret
        };

        if (authConfig.scope) {
            tokenPayload.scope = authConfig.scope;
        }

        var httpResult = connection.post(authConfig.tokenUrl, tokenPayload);

        if (!httpResult.success) {
            return httpResult;
        }

        var tokenData = httpResult.data.parsedContent;

        if (!tokenData && httpResult.data.content) {
            try {
                tokenData = Platform.Function.ParseJSON(String(httpResult.data.content));
            } catch (parseEx) {
                return response.error(
                    'Failed to parse Data Cloud OAuth2 token response: ' + parseEx.message,
                    handler,
                    'requestNewToken',
                    { response: httpResult.data.content }
                );
            }
        }

        if (!tokenData || !tokenData.access_token) {
            return response.error(
                'Data Cloud OAuth2 token response missing access_token',
                handler,
                'requestNewToken',
                { response: httpResult.data.content }
            );
        }

        var tokenInfo = {
            accessToken: tokenData.access_token,
            tokenType: tokenData.token_type || 'Bearer',
            expiresIn: tokenData.expires_in || 3600,
            obtainedAt: new Date().getTime(),
            scope: tokenData.scope || authConfig.scope || null
        };

        tokenInfo.expiresAt = tokenInfo.obtainedAt + (tokenInfo.expiresIn * 1000);

        tokenCache.set(tokenInfo);

        return response.success(tokenInfo, handler, 'requestNewToken');

    } catch (ex) {
        return response.error(
            'Failed to request Data Cloud OAuth2 token: ' + ex.message,
            handler,
            'requestNewToken',
            { exception: ex.toString() }
        );
    }
}

function getToken() {
    if (!tokenCache) {
        return response.authError('No token cache configured for Data Cloud', handler, 'getToken');
    }

    var cachedResult = tokenCache.get();

    if (cachedResult.success && cachedResult.data !== null && !tokenCache.isExpired(cachedResult.data)) {
        return response.success(cachedResult.data, handler, 'getToken');
    }

    return requestNewToken();
}
```

**ACTUALIZAR** todas las funciones que usan `base.getAuthHeaders()` para usar `getToken()` internamente (similar a SFMCIntegration).

**ACTUALIZAR factory registration** (líneas 239-245):
```javascript
// ANTES:
dependencies: ['ResponseWrapper', 'ConnectionHandler', 'OAuth2AuthStrategy', 'BaseIntegration']

// DESPUÉS:
dependencies: ['ResponseWrapper', 'ConnectionHandler', 'BaseIntegration', 'DataExtensionTokenCache']
```

---

## Archivo 4: `src/integrations/VeevaCRMIntegration.ssjs`

### Cambios Similares

**ELIMINAR** (líneas 30-44):
```javascript
// Setup OAuth2 authentication (password grant for Veeva)
if (config.auth) {
    var oauth2Config = {
        tokenUrl: config.auth.tokenUrl || 'https://login.salesforce.com/services/oauth2/token',
        clientId: config.auth.clientId,
        clientSecret: config.auth.clientSecret,
        grantType: config.auth.grantType || 'password',
        username: config.auth.username,
        password: config.auth.password, // Password + Security Token
        cacheKey: config.auth.username
    };

    var authStrategy = OmegaFramework.create('OAuth2AuthStrategy', oauth2Config);
    base.setAuthStrategy(authStrategy);
}
```

**AÑADIR** OAuth2 password grant interno (similar a Data Cloud pero con `username/password`).

**ACTUALIZAR factory registration**.

---

## Archivo 5: `src/integrations/VeevaVaultIntegration.ssjs`

### Cambios Similares

**ELIMINAR** (líneas 26-32):
```javascript
// Setup Bearer token authentication
if (config.auth && config.auth.token) {
    var bearerAuth = OmegaFramework.create('BearerAuthStrategy', {
        token: config.auth.token
    });
    base.setAuthStrategy(bearerAuth);
}
```

**AÑADIR** bearer token interno:
```javascript
// ====================================================================
// VEEVA VAULT BEARER TOKEN AUTHENTICATION (Internal)
// ====================================================================

var bearerToken = (config.auth && config.auth.token) ? config.auth.token : null;

function getAuthHeaders() {
    if (!bearerToken) {
        return response.authError('No bearer token configured for Veeva Vault', handler, 'getAuthHeaders');
    }

    return response.success({
        'Authorization': 'Bearer ' + bearerToken,
        'Content-Type': 'application/json'
    }, handler, 'getAuthHeaders');
}
```

**ACTUALIZAR** todas las funciones que usan `base.getAuthHeaders()` para usar `getAuthHeaders()` local.

---

## Archivo 6: `src/tests/handlers/Test_AssetHandler.ssjs`

### Actualizar carga de dependencias

**ELIMINAR** (línea 27):
```javascript
Platform.Function.ContentBlockByKey("OMG_FW_OAuth2AuthStrategy");
```

**MANTENER**:
```javascript
Platform.Function.ContentBlockByKey("OMG_FW_ResponseWrapper");
Platform.Function.ContentBlockByKey("OMG_FW_ConnectionHandler");
Platform.Function.ContentBlockByKey("OMG_FW_BaseIntegration");
Platform.Function.ContentBlockByKey("OMG_FW_DataExtensionTokenCache");
Platform.Function.ContentBlockByKey("OMG_FW_CredentialStore");
Platform.Function.ContentBlockByKey("OMG_FW_SFMCIntegration");
Platform.Function.ContentBlockByKey("OMG_FW_AssetHandler");
```

---

## Archivo 7: Actualizar `install/AutomatedInstaller_v3.html`

### Eliminar bloques de Auth Strategies

**BUSCAR y ELIMINAR** estos bloques del instalador:

1. Bloque `OMG_FW_BasicAuthStrategy`
2. Bloque `OMG_FW_BearerAuthStrategy`
3. Bloque `OMG_FW_OAuth2AuthStrategy`

**ELIMINAR de la lista de instalación**:
```javascript
{ name: 'BasicAuthStrategy', file: 'auth/BasicAuthStrategy.ssjs' },
{ name: 'BearerAuthStrategy', file: 'auth/BearerAuthStrategy.ssjs' },
{ name: 'OAuth2AuthStrategy', file: 'auth/OAuth2AuthStrategy.ssjs' },
```

---

## Tests a Actualizar/Crear

### Eliminar
- `src/tests/auth/Test_BasicAuthStrategy.ssjs`
- `src/tests/auth/Test_BearerAuthStrategy.ssjs`
- `src/tests/auth/Test_OAuth2AuthStrategy.ssjs`

### Actualizar
- `src/tests/handlers/Test_AssetHandler.ssjs` - Ya no carga OAuth2AuthStrategy
- Cualquier test que use `base.setAuthStrategy()` debe actualizarse

### Crear (opcional)
- `src/tests/integrations/Test_SFMCIntegration_OAuth2.ssjs` - Test específico de OAuth2 de SFMC

---

## Verificación Post-Refactor

### ✅ Checklist

1. **Archivos eliminados**:
   - [ ] `src/auth/BasicAuthStrategy.ssjs` eliminado
   - [ ] `src/auth/BearerAuthStrategy.ssjs` eliminado
   - [ ] `src/auth/OAuth2AuthStrategy.ssjs` eliminado
   - [ ] Tests correspondientes eliminados

2. **BaseIntegration simplificado**:
   - [ ] No tiene parámetro `authStrategy`
   - [ ] No tiene función `setAuthStrategy()`
   - [ ] No tiene función `getAuthHeaders()`
   - [ ] `buildHeaders()` solo maneja custom headers

3. **SFMCIntegration refactorizado**:
   - [ ] Tiene OAuth2 interno con `requestNewToken()`
   - [ ] Usa `DataExtensionTokenCache` internamente
   - [ ] `makeRestRequest()` construye auth headers internamente
   - [ ] Usa `rest_instance_url` del token
   - [ ] `makeSoapRequest()` usa `soap_instance_url` del token

4. **Otras integraciones actualizadas**:
   - [ ] `DataCloudIntegration` - OAuth2 interno
   - [ ] `VeevaCRMIntegration` - OAuth2 password grant interno
   - [ ] `VeevaVaultIntegration` - Bearer token interno

5. **Tests actualizados**:
   - [ ] `Test_AssetHandler.ssjs` funciona sin OAuth2AuthStrategy
   - [ ] No hay referencias a estrategias eliminadas

6. **Instalador actualizado**:
   - [ ] Bloques de auth eliminados del instalador
   - [ ] Lista de instalación actualizada

---

## Beneficios Esperados

1. **Simplicidad**: Menos archivos, menos complejidad
2. **Debugging**: Todo el flujo OAuth2 de SFMC en un solo lugar
3. **Testing**: Solo mockear ConnectionHandler
4. **Mantenibilidad**: Cambios específicos de SFMC solo afectan SFMCIntegration
5. **Rendimiento**: Menos saltos entre módulos

---

## Riesgos y Mitigaciones

**Riesgo**: Breaking changes para código existente que usa `base.setAuthStrategy()`
**Mitigación**: Esta es v3.0, se espera breaking changes. Documentar en migration guide.

**Riesgo**: Duplicación de lógica OAuth2 entre integraciones
**Mitigación**: Aceptable - cada integración tiene suficientes diferencias que justifican la duplicación.

---

## Orden de Implementación Recomendado

1. **Paso 1**: Actualizar `BaseIntegration.ssjs` (eliminar auth)
2. **Paso 2**: Refactorizar `SFMCIntegration.ssjs` (OAuth2 interno)
3. **Paso 3**: Actualizar `Test_AssetHandler.ssjs` y verificar que funciona
4. **Paso 4**: Refactorizar `DataCloudIntegration.ssjs`
5. **Paso 5**: Refactorizar `VeevaCRMIntegration.ssjs`
6. **Paso 6**: Refactorizar `VeevaVaultIntegration.ssjs`
7. **Paso 7**: Eliminar archivos de auth strategies
8. **Paso 8**: Actualizar instalador
9. **Paso 9**: Ejecutar todos los tests

---

## Notas Finales

- **Mantener**: `CredentialStore` y `DataExtensionTokenCache` son útiles y reutilizables
- **Eliminar**: Estrategias de auth que añaden capas innecesarias
- **Simplicidad > Abstracción**: Cada integración maneja su auth de forma específica

**Fin del Task**
