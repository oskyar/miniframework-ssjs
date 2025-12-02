# Guía de Uso: OmegaFramework Factory (v3)

Esta guía explica cómo utilizar el `OmegaFramework` a través de su punto de entrada único, la **Factory**. El objetivo de la factory es simplificar drásticamente el uso del framework, proporcionando una interfaz intuitiva y de alto rendimiento.

---

## 1. El Concepto de la Factory Inteligente

La "Factory" (Fábrica) es un componente que se encarga de "fabricar" y darte acceso a todas las piezas del framework de una manera sencilla y eficiente.

**Características Clave:**
- **Simplicidad**: Solo necesitas interactuar con un objeto, `OmegaFramework`, y sus métodos auto-generados.
- **Carga Dinámica (Lazy Loading)**: Para un rendimiento máximo, la fábrica solo carga el código de los componentes que realmente utilizas en tu script. Si solo usas el `AssetHandler`, no se cargará el código de `JourneyHandler` ni el de otras integraciones.
- **Métodos Dinámicos**: La fábrica crea automáticamente métodos "atajo" como `getAssetHandler()` y `getSFMCIntegration()`, haciendo el código más legible e intuitivo.

---

## 2. Instalación y Carga

Para usar el framework en cualquier CloudPage o Script Activity, solo necesitas cargar **un único bloque de contenido**: `OMG_OmegaFrameworkFactory`.

```javascript
<script runat="server">
    Platform.Load("core", "1.1.1");

    // Carga todo el framework con un solo bloque
</script>
%%=ContentBlockByKey("OMG_OmegaFrameworkFactory")=%%
<script runat="server">

    // A partir de aquí, ya puedes usar el objeto global "OmegaFramework"

</script>
```

---

## 3. El Objeto `OmegaFramework`

Al cargar el bloque, tendrás acceso a un objeto global llamado `OmegaFramework`. Este objeto se ha inicializado con métodos dinámicos para cada componente disponible.

**Forma de Uso Principal: Métodos Dinámicos (Recomendado)**
- `OmegaFramework.getAssetHandler(config)`
- `OmegaFramework.getDataExtensionHandler(config)`
- `OmegaFramework.getSFMCIntegration(config)`
- ...y así para todos los demás componentes.

**Forma de Uso Genérica (Alternativa)**
- `OmegaFramework.getHandler('Asset', config)`
- `OmegaFramework.getIntegration('SFMC', config)`

---

## 4. El Objeto de Respuesta (ResponseWrapper)

**IMPORTANTE:** Todas las funciones del framework devuelven un objeto estandarizado con la siguiente estructura:

```javascript
{
    success: true, // o false si hubo un error
    data: { ... }, // Los datos solicitados si success es true
    error: { ... } // Un objeto con detalles del error si success es false
}
```

**Siempre** debes comprobar el valor de `success` antes de intentar usar `data`.

---

## 5. Uso de Handlers (Método Recomendado)

Los Handlers son la forma **más sencilla** de trabajar para tareas comunes en SFMC. La forma recomendada de obtener un handler es a través de su método dinámico.

### Ejemplo: Usar `AssetHandler` para buscar un asset

```javascript
<script runat="server">
try {
    // La configuración es un objeto simple
    var config = {
        credentialAlias: "Mi_Conexion_SFMC", // El 'Name' de la credencial en la DE
        restBaseUrl: "https://{{et_subdomain}}.rest.marketingcloudapis.com/"
    };

    // Pides el handler directamente con su método dinámico
    var assetHandlerResponse = OmegaFramework.getAssetHandler(config);

    if (assetHandlerResponse.success) {
        var assetHandler = assetHandlerResponse.data;

        var assetName = "MiImagen.jpg";
        Write("Buscando el asset: " + assetName);

        var asset = assetHandler.getAssetByName(assetName);

        if(asset.success) {
            Write("¡Asset encontrado! ID: " + asset.data.id);
        } else {
            Write("No se encontró el asset. Error: " + Stringify(asset.error));
        }

    } else {
        Write("Error al crear el handler: " + Stringify(assetHandlerResponse.error));
    }
} catch(e) {
    Write(Stringify(e));
}
</script>
```

#### Parámetros de `config`:
- `credentialAlias` (Obligatorio): El nombre (llave primaria) de la credencial guardada en la Data Extension `OMG_FW_Credentials`.
- `restBaseUrl` (Obligatorio para la mayoría): La URL base de la API a la que te quieres conectar.
- `credentialDEKey` (Opcional): La clave externa de tu DE de credenciales, si no usas la estándar `OMG_FW_Credentials`.
- `tokenCacheDEKey` (Opcional): La clave externa de tu DE de caché de tokens, si no usas la estándar `OMG_FW_TokenCache`.


---

## 6. Uso de Integraciones (Nivel Bajo)

Las integraciones se usan cuando necesitas hacer una llamada a la API que no está cubierta por un Handler.

### Ejemplo: Obtener una `SFMCIntegration`

```javascript
<script runat="server">
try {
    var config = {
        credentialAlias: "Mi_Conexion_SFMC",
        restBaseUrl: "https://{{et_subdomain}}.rest.marketingcloudapis.com/"
    };

    // Pides la integración con su método dinámico
    var sfmcIntegrationResponse = OmegaFramework.getSFMCIntegration(config);

    if (sfmcIntegrationResponse.success) {
        var sfmc = sfmcIntegrationResponse.data;

        // Haces una llamada GET a una ruta específica de la API de SFMC
        var apiResponse = sfmc.get("/asset/v1/content/categories/12345");

        if(apiResponse.success) {
            Write(Stringify(apiResponse.data));
        } else {
            Write(Stringify(apiResponse.error));
        }

    } else {
        Write("Error al crear la integración: " + Stringify(sfmcIntegrationResponse.error));
    }
} catch(e) {
    Write(Stringify(e));
}
</script>
```

---
## 7. Ejemplo Completo: Fin a Fin

Este script usa los métodos dinámicos para obtener el `FolderHandler` y el `DataExtensionHandler` y crear una DE en una carpeta específica.

```javascript
<script runat="server">
    Platform.Load("core", "1.1.1");
</script>
%%=ContentBlockByKey("OMG_OmegaFrameworkFactory")=%%
<script runat="server">
try {
    // --- Configuración Centralizada ---
    var frameworkConfig = {
        credentialAlias: "Mi_Conexion_SFMC",
        restBaseUrl: "https://{{et_subdomain}}.rest.marketingcloudapis.com/"
    };

    // --- 1. Obtener el FolderHandler y buscar una carpeta ---
    var folderHandlerResponse = OmegaFramework.getFolderHandler(frameworkConfig);

    if (!folderHandlerResponse.success) {
        throw "No se pudo crear el FolderHandler: " + Stringify(folderHandlerResponse.error);
    }
    var folderHandler = folderHandlerResponse.data;

    var targetFolderName = "Mis Data Extensions de Test";
    var folder = folderHandler.getCategoryByName(targetFolderName, "dataextension");

    if (!folder.success) {
        throw "La carpeta '" + targetFolderName + "' no existe. Por favor, créala primero.";
    }
    var targetFolderId = folder.data.id;
    Write("Carpeta de destino encontrada. ID: " + targetFolderId + "<br>");


    // --- 2. Obtener el DataExtensionHandler y crear una DE ---
    var deHandlerResponse = OmegaFramework.getDataExtensionHandler(frameworkConfig);

    if (!deHandlerResponse.success) {
        throw "No se pudo crear el DataExtensionHandler: " + Stringify(deHandlerResponse.error);
    }
    var deHandler = deHandlerResponse.data;

    var deDetails = {
        name: "Test_DE_Desde_Factory_v3",
        customerKey: "Test_DE_Desde_Factory_v3",
        folderId: targetFolderId,
        fields: [
            { "name": "SubscriberKey", "fieldType": "Text", "maxLength": 254, "isPrimaryKey": true, "isRequired": true },
            { "name": "Email", "fieldType": "EmailAddress", "maxLength": 254 }
        ]
    };

    Write("Intentando crear la Data Extension: " + deDetails.name + "<br>");
    var createResult = deHandler.createDataExtension(deDetails);

    if (createResult.success) {
        Write("<strong>¡Éxito! Data Extension creada correctamente.</strong>");
    } else {
        Write("<strong>Error al crear la Data Extension:</strong> " + Stringify(createResult.error));
    }

} catch (e) {
    Write("<h3 style='color:red;'>Ocurrió un error crítico</h3>");
    Write(Stringify(e));
}
</script>
```