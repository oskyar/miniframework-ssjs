%%=ContentBlockByKey("OMG_FW_Core")=%%
<script runat="server">

Platform.Load("core", "1.1.1");

/*
=================================================================
OmegaFramework - Ejemplo Práctico de Uso (v1.1.0)
=================================================================

Este ejemplo muestra cómo usar el NUEVO patrón del framework:
1. Cargar solo el Core
2. Configurar credenciales UNA VEZ
3. Cargar solo los handlers necesarios
4. Usar handlers sin pasar config cada vez

NUEVO PATRÓN (v1.1.0):
- Solo cargas OMG_FW_Core
- Configuras UNA vez con OmegaFramework.configure()
- Los handlers ya tienen acceso a la config
- Instancias singleton de Auth y Connection compartidas

REQUISITOS:
- Content Blocks: OMG_FW_Core (carga automáticamente ResponseWrapper, Settings, Auth, Connection)
- Content Blocks específicos: OMG_FW_EmailHandler, OMG_FW_DataExtensionHandler, OMG_FW_LogHandler
- Configured API credentials
*/

// ===============================
// 1. CONFIGURACIÓN DEL FRAMEWORK (UNA SOLA VEZ)
// ===============================

var config = {
    // Credenciales de SFMC (cambiar por las tuyas)
    auth: {
        clientId: "nhf4gqflwiyfkqlle32te8ba",
        clientSecret: "jUaDSm9MTF4zoq0HfwKGLAeD",
        authBaseUrl: "https://mcgwsh19xsfbh858gh-fc-cy7-w4.auth.marketingcloudapis.com/"
    },

    // Configuración de logging (opcional)
    logging: {
        level: "INFO",
        enableConsole: true,
        enableDataExtension: false,
        enableEmailAlerts: false
    },

    // Configuración de conexión (opcional)
    connection: {
        maxRetries: 3,
        retryDelay: 1000
    }
};

// Configurar el framework
var setupResult = OmegaFramework.configure(config);
if (!setupResult.success) {
    Write('<div style="color: red;">❌ Error configurando framework: ' + setupResult.error + '</div>');
}

// ===============================
// 2. CARGAR HANDLERS NECESARIOS
// ===============================

// Método 1: Cargar individualmente
OmegaFramework.load("EmailHandler");
OmegaFramework.load("DataExtensionHandler");
OmegaFramework.load("LogHandler");

// Método 2: Cargar múltiples a la vez
// OmegaFramework.loadMultiple(["EmailHandler", "DataExtensionHandler", "LogHandler"]);

// ===============================
// 3. CREAR INSTANCIAS DE HANDLERS
// ===============================

// NUEVO: Ya no necesitas pasar config porque el framework ya la tiene
var emailHandler = new EmailHandler();
var deHandler = new DataExtensionHandler();
var logger = new LogHandler();

// También puedes usar el método del framework:
// var emailHandler = OmegaFramework.createHandler("EmailHandler");

// ===============================
// 4. EJEMPLO 1: CONECTAR CON SISTEMA EXTERNO
// ===============================
function connectToExternalSystem() {
    try {
        Write('<h3>🌐 Conectando con Sistema Externo</h3>');

        // Obtener la instancia singleton de Connection
        var connection = OmegaFramework.getConnection();

        // Configurar headers para API externa
        var headers = {
            'Authorization': 'Bearer YOUR_EXTERNAL_API_KEY',
            'Content-Type': 'application/json'
        };

        // Hacer petición GET a sistema externo
        var url = 'https://api.example.com/customers';
        var result = connection.get(url, headers);

        if (result.success) {
            Write('<div style="color: green;">✅ Conexión exitosa con sistema externo</div>');
            Write('<p>Status: ' + result.data.statusCode + '</p>');

            // Log de éxito
            logger.info('Conexión exitosa con sistema externo', {
                statusCode: result.data.statusCode
            });

            return result.data.parsedContent;
        } else {
            Write('<div style="color: red;">❌ Error en conexión externa</div>');
            Write('<p>Error: ' + result.error.message + '</p>');

            // Log de error
            logger.error('Error en conexión externa', {
                error: result.error,
                url: url
            });
        }

    } catch (ex) {
        Write('<div style="color: red;">❌ Excepción: ' + ex.message + '</div>');
        logger.error('Excepción en conexión externa', {exception: ex.message});
    }

    return null;
}

// ===============================
// 5. EJEMPLO 2: GESTIÓN DE EMAILS EN SFMC
// ===============================
function manageEmails() {
    try {
        Write('<h3>📧 Gestionando Emails en SFMC</h3>');

        // Obtener la instancia singleton de Auth
        var auth = OmegaFramework.getAuth();

        // Obtener token de autenticación
        var tokenResult = auth.getToken();
        if (!tokenResult.success) {
            Write('<div style="color: red;">❌ Error de autenticación: ' + tokenResult.error.message + '</div>');
            return;
        }

        Write('<div style="color: green;">✅ Autenticación exitosa</div>');

        // NUEVO: Ya no necesitas pasar config, el handler ya la tiene
        var emailsResult = emailHandler.list({pageSize: 5});

        if (emailsResult.success) {
            var emails = emailsResult.data;
            Write('<p>Emails encontrados: ' + (emails.length || 0) + '</p>');

            // Mostrar algunos emails
            if (emails && emails.length > 0) {
                for (var i = 0; i < Math.min(emails.length, 3); i++) {
                    var email = emails[i];
                    Write('<li>' + email.name + ' (ID: ' + email.id + ')</li>');
                }
            }

            // Log de éxito
            logger.info('Listado de emails completado', {
                emailCount: emails.length || 0
            });

        } else {
            Write('<div style="color: red;">❌ Error listando emails: ' + emailsResult.error.message + '</div>');
            logger.error('Error listando emails', {error: emailsResult.error});
        }

    } catch (ex) {
        Write('<div style="color: red;">❌ Excepción: ' + ex.message + '</div>');
        logger.error('Excepción en gestión de emails', {exception: ex.message});
    }
}

// ===============================
// 6. EJEMPLO 3: TRABAJAR CON DATA EXTENSIONS
// ===============================
function workWithDataExtensions() {
    try {
        Write('<h3>📊 Trabajando con Data Extensions</h3>');

        // Crear registro en Data Extension
        var recordData = {
            CustomerID: 'CUST_' + new Date().getTime(),
            Email: 'ejemplo@test.com',
            Name: 'Cliente Ejemplo',
            LastUpdated: new Date().toISOString(),
            Status: 'Active'
        };

        // NUEVO: Ya no necesitas pasar config
        var addResult = deHandler.addRecord('customers_de', recordData);

        if (addResult.success) {
            Write('<div style="color: green;">✅ Registro agregado a Data Extension</div>');
            Write('<p>Registros añadidos: ' + (addResult.data.rowsAdded || 0) + '</p>');

            // Log de éxito
            logger.info('Registro agregado a DE', {
                deKey: 'customers_de',
                recordId: recordData.CustomerID
            });

        } else {
            Write('<div style="color: red;">❌ Error agregando registro: ' + addResult.error.message + '</div>');
            logger.error('Error agregando registro a DE', {error: addResult.error});
        }

    } catch (ex) {
        Write('<div style="color: red;">❌ Excepción: ' + ex.message + '</div>');
        logger.error('Excepción en Data Extension', {exception: ex.message});
    }
}

// ===============================
// 7. EJEMPLO 4: MANEJO DE ERRORES Y LOGGING
// ===============================
function errorHandlingExample() {
    try {
        Write('<h3>🚨 Ejemplo de Manejo de Errores</h3>');

        var connection = OmegaFramework.getConnection();

        // Simular error de conexión
        var badUrl = 'https://api-inexistente.com/data';
        var errorResult = connection.get(badUrl);

        if (!errorResult.success) {
            Write('<div style="color: red;">❌ Error esperado capturado</div>');
            Write('<p>Código: ' + errorResult.error.code + '</p>');
            Write('<p>Mensaje: ' + errorResult.error.message + '</p>');

            // Log del error
            logger.error('Error de conexión simulado', {
                url: badUrl,
                error: errorResult.error
            });
        }

        // Simular error de validación
        var auth = OmegaFramework.getAuth();
        var invalidConfig = {
            clientSecret: 'secret',
            authBaseUrl: 'https://test.com/'
        };

        var authResult = auth.getToken(invalidConfig);
        if (!authResult.success) {
            Write('<div style="color: red;">❌ Error de validación capturado</div>');
            Write('<p>Código: ' + authResult.error.code + '</p>');
            Write('<p>Mensaje: ' + authResult.error.message + '</p>');

            // Log del error
            logger.error('Error de validación simulado', {
                error: authResult.error
            });
        }

    } catch (ex) {
        Write('<div style="color: red;">❌ Excepción: ' + ex.message + '</div>');
        logger.error('Excepción en manejo de errores', {exception: ex.message});
    }
}

// ===============================
// 8. EJEMPLO 5: INFORMACIÓN DEL FRAMEWORK
// ===============================
function showFrameworkInfo() {
    try {
        Write('<h3>ℹ️ Información del Framework</h3>');

        var info = OmegaFramework.getInfo();

        Write('<ul>');
        Write('<li><strong>Nombre:</strong> ' + info.name + '</li>');
        Write('<li><strong>Versión:</strong> ' + info.version + '</li>');
        Write('<li><strong>Inicializado:</strong> ' + (info.initialized ? 'Sí' : 'No') + '</li>');
        Write('<li><strong>Handlers cargados:</strong> ' + info.loadedHandlers.length + '</li>');

        if (info.loadedHandlers.length > 0) {
            Write('<li><strong>Lista de handlers:</strong><ul>');
            for (var i = 0; i < info.loadedHandlers.length; i++) {
                Write('<li>' + info.loadedHandlers[i] + '</li>');
            }
            Write('</ul></li>');
        }

        Write('</ul>');

    } catch (ex) {
        Write('<div style="color: red;">❌ Excepción: ' + ex.message + '</div>');
    }
}

// ===============================
// 9. EJECUTAR EJEMPLOS
// ===============================
try {
    Write('<h1>🚀 OmegaFramework v1.1.0 - Ejemplo Práctico</h1>');
    Write('<p><strong>Fecha:</strong> ' + new Date().toISOString() + '</p>');

    // Mostrar información del framework
    showFrameworkInfo();
    Write('<hr>');

    // Ejecutar ejemplos
    // connectToExternalSystem();
    // Write('<hr>');

    manageEmails();
    Write('<hr>');

    workWithDataExtensions();
    Write('<hr>');

    errorHandlingExample();
    Write('<hr>');

    Write('<h3>✅ Ejemplos completados</h3>');
    Write('<p><strong>Ventajas del nuevo patrón:</strong></p>');
    Write('<ul>');
    Write('<li>✅ Solo cargas OMG_FW_Core</li>');
    Write('<li>✅ Configuración centralizada una sola vez</li>');
    Write('<li>✅ No repites credenciales en cada handler</li>');
    Write('<li>✅ Instancias singleton compartidas (más eficiente)</li>');
    Write('<li>✅ Cargas solo los handlers que necesitas</li>');
    Write('</ul>');

} catch (mainEx) {
    Write('<div style="color: red;">❌ Error principal: ' + mainEx.message + '</div>');
}

</script>

<!DOCTYPE html>
<html>
<head>
    <title>OmegaFramework v1.1.0 - Ejemplo Práctico</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f9f9f9; }
        h1 { color: #0176d3; border-bottom: 3px solid #0176d3; padding-bottom: 10px; }
        h3 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 20px; }
        hr { margin: 30px 0; border: 1px solid #eee; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        ul { line-height: 1.8; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        code { background: #e8e8e8; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; }
    </style>
</head>
<body>
    <div id="results">
        <!-- Los resultados se muestran aquí -->
    </div>
</body>
</html>
