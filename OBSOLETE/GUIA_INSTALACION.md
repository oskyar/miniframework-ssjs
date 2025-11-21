# Guía de Instalación - OmegaFramework v1.1

## 🚀 Instalación Automática (RECOMENDADO)

La forma más rápida de instalar OmegaFramework es usando el **Quick Installer** - una CloudPage autocontenida que crea todos los Content Blocks automáticamente.

### Paso 1: Preparar Credenciales

Necesitas tener configurado un **Installed Package** en SFMC con los siguientes permisos:

#### Permisos Requeridos:
- ✅ **Email**: Read, Write
- ✅ **Web**: Read, Write
- ✅ **Documents and Images**: Read, Write
- ✅ **Content**: Read, Write
- ✅ **Data Extensions**: Read, Write (opcional, si usarás LogHandler con DE)

#### Información Necesaria:
1. **Client ID**: Desde tu Installed Package
2. **Client Secret**: Desde tu Installed Package
3. **Auth Base URL**: URL de autenticación de tu stack SFMC
   - Formato: `https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/`
   - Encuentra tu subdomain en Setup > Installed Packages

---

### Paso 2: Crear CloudPage del Instalador

#### Opción A: Desde Content Builder

1. Ve a **Content Builder** en SFMC
2. Crea una nueva **CloudPage**
3. Copia el contenido completo de `install/OmegaFrameworkInstaller.html`
4. Pega el código en la CloudPage
5. Guarda y publica la CloudPage
6. Copia la URL de la CloudPage

#### Opción B: Desde CloudPages

1. Ve a **CloudPages** en SFMC
2. Crea una nueva página
3. Pega el código de `install/OmegaFrameworkInstaller.html`
4. Publica y copia la URL

---

### Paso 3: Ejecutar el Instalador

1. Abre la URL de tu CloudPage del instalador en un navegador
2. Verás una interfaz moderna con un formulario
3. Completa los campos:

   ```
   📝 Formulario de Instalación

   Client ID: [tu_client_id]
   Client Secret: [tu_client_secret]
   Auth Base URL: [https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/]

   Repositorio GitHub (opcional): [dejar vacío o poner tu repo]

   ☑️ Instalar módulos opcionales (AssetCreator, JourneyCreator)
   ```

4. Haz clic en **🚀 Iniciar Instalación**
5. Espera 30-60 segundos mientras se crea todo
6. Verás un log en tiempo real de la instalación

---

### Paso 4: Verificar Instalación

Después de la instalación, verifica que los Content Blocks fueron creados:

1. Ve a **Content Builder** en SFMC
2. Busca la carpeta **"OmegaFramework"**
3. Deberías ver los siguientes Content Blocks:

   ```
   ✅ OMG_FW_Core                    (Principal - REQUERIDO)
   ✅ OMG_FW_Settings                (Configuración)
   ✅ OMG_FW_ResponseWrapper         (Base)
   ✅ OMG_FW_AuthHandler             (Autenticación)
   ✅ OMG_FW_ConnectionHandler       (HTTP)
   ✅ OMG_FW_EmailHandler            (Emails)
   ✅ OMG_FW_DataExtensionHandler    (Data Extensions)
   ✅ OMG_FW_AssetHandler            (Assets)
   ✅ OMG_FW_FolderHandler           (Folders)
   ✅ OMG_FW_LogHandler              (Logging)

   (Si marcaste opcionales)
   ☑️ OMG_FW_AssetCreator            (Opcional)
   ☑️ OMG_FW_JourneyCreator          (Opcional)
   ```

---

### Paso 5: Probar el Framework

Crea una CloudPage de prueba:

```javascript
%%=ContentBlockByKey("OMG_FW_Core")=%%
<script runat="server">

// Configurar el framework
OmegaFramework.configure({
    auth: {
        clientId: "TU_CLIENT_ID",
        clientSecret: "TU_CLIENT_SECRET",
        authBaseUrl: "https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/"
    }
});

// Obtener información del framework
var info = OmegaFramework.getInfo();

Write("<h1>✅ OmegaFramework Instalado</h1>");
Write("<p><strong>Nombre:</strong> " + info.name + "</p>");
Write("<p><strong>Versión:</strong> " + info.version + "</p>");
Write("<p><strong>Inicializado:</strong> " + (info.initialized ? "Sí" : "No") + "</p>");

// Probar autenticación
var auth = OmegaFramework.getAuth();
var tokenResult = auth.getToken();

if (tokenResult.success) {
    Write("<p style='color:green;'><strong>✅ Autenticación funciona correctamente</strong></p>");
} else {
    Write("<p style='color:red;'><strong>❌ Error de autenticación: " + tokenResult.error.message + "</strong></p>");
}

</script>
```

Si ves "✅ Autenticación funciona correctamente", **¡todo está instalado correctamente!**

---

## 🛠️ Instalación Manual

Si prefieres instalar manualmente o el instalador automático no funciona:

### Paso 1: Crear Carpeta

1. Ve a Content Builder
2. Crea una carpeta llamada **"OmegaFramework"**

### Paso 2: Crear Content Blocks

Para cada archivo en `src/`, crea un Content Block:

#### 2.1 Orden de Instalación (IMPORTANTE):

1. **OMG_FW_ResponseWrapper** (`src/ResponseWrapper.ssjs`)
2. **OMG_FW_Settings** (`src/Settings.ssjs`)
3. **OMG_FW_AuthHandler** (`src/AuthHandler.ssjs`)
4. **OMG_FW_ConnectionHandler** (`src/ConnectionHandler.ssjs`)
5. **OMG_FW_Core** (`src/Core.ssjs`)
6. Luego los handlers restantes (en cualquier orden)

#### 2.2 Para cada Content Block:

1. Ve a Content Builder > Create > Content Block
2. Selecciona **"Code Snippet"**
3. Nombre: `OMG_FW_NombreDelHandler` (ej: `OMG_FW_EmailHandler`)
4. Copia el contenido del archivo `.ssjs` correspondiente
5. Pega en el editor de código
6. Guarda

#### 2.3 Verificar Keys:

Asegúrate de que cada Content Block tenga la key correcta:
- `OMG_FW_Core`
- `OMG_FW_Settings`
- `OMG_FW_ResponseWrapper`
- etc.

---

## 🔧 Configuración Post-Instalación

### Configurar Variables Globales (Opcional)

Si quieres evitar pasar credenciales cada vez, puedes usar Variables AMPscript:

```
%%[
SET @clientId = "tu_client_id"
SET @clientSecret = "tu_client_secret"
SET @authBaseUrl = "https://..."
]%%

%%=ContentBlockByKey("OMG_FW_Core")=%%
<script runat="server">

OmegaFramework.configure({
    auth: {
        clientId: Variable.GetValue("@clientId"),
        clientSecret: Variable.GetValue("@clientSecret"),
        authBaseUrl: Variable.GetValue("@authBaseUrl")
    }
});

</script>
```

---

## ❓ Solución de Problemas

### Error: "Authentication failed"

**Causa**: Credenciales incorrectas o permisos insuficientes

**Solución**:
1. Verifica que Client ID y Client Secret sean correctos
2. Verifica que Auth Base URL termine en `/`
3. Revisa permisos del Installed Package
4. Asegúrate de que el package esté activo

### Error: "Content Block not found"

**Causa**: Content Block no creado o key incorrecta

**Solución**:
1. Verifica que el Content Block exista en Content Builder
2. Verifica que la key sea exactamente `OMG_FW_Core` (case sensitive)
3. Intenta refrescar el Content Builder

### Error: "Folder creation failed"

**Causa**: Permisos insuficientes o carpeta ya existe

**Solución**:
1. El instalador usará la carpeta raíz si no puede crear la carpeta
2. Puedes crear manualmente la carpeta y mover los Content Blocks allí

### Error: "Module already exists" durante instalación

**Esto NO es un error** - significa que el Content Block ya existe y se omitió. Es normal en reinstalaciones.

---

## 📚 Próximos Pasos

Después de instalar:

1. ✅ Lee `MIGRACION_v1.1.md` si vienes de v1.0
2. ✅ Revisa `examples/PracticalExample.ssjs` para patrones de uso
3. ✅ Consulta `CLAUDE.md` para referencia técnica
4. ✅ Experimenta con los handlers en una CloudPage de prueba

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa esta guía completamente
2. Verifica los logs del instalador
3. Prueba la instalación manual
4. Consulta `ANALISIS_COMPARATIVO.md` para detalles técnicos
5. Crea un issue en el repositorio GitHub

---

**¡Bienvenido a OmegaFramework v1.1! 🎉**
