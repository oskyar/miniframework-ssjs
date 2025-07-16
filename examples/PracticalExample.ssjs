<script runat="server">

Platform.Load("core", "1.1.1");

/* 
=================================================================
OmegaFramework - Ejemplo Práctico de Uso
=================================================================

Este ejemplo muestra cómo usar el framework para:
1. Conectar con sistemas externos
2. Gestionar emails en SFMC
3. Trabajar con Data Extensions
4. Manejar logging y errores

REQUISITOS:
- Content Blocks: OMG_FW_ResponseWrapper, OMG_FW_AuthHandler, OMG_FW_ConnectionHandler
- Content Blocks: OMG_FW_EmailHandler, OMG_FW_DataExtensionHandler, OMG_FW_LogHandler
- Configured API credentials
*/

// ===============================
// 1. CARGAR COMPONENTES DEL FRAMEWORK
// ===============================
%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_AuthHandler")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_FW_EmailHandler")=%%
%%=ContentBlockByKey("OMG_FW_DataExtensionHandler")=%%
%%=ContentBlockByKey("OMG_FW_LogHandler")=%%

// ===============================
// 2. CONFIGURACIÓN DE CREDENCIALES
// ===============================
var config = {
    // Credenciales de SFMC (cambiar por las tuyas)
    sfmc: {
        clientId: "nhf4gqflwiyfkqlle32te8ba",
        clientSecret: "jUaDSm9MTF4zoq0HfwKGLAeD", 
        authBaseUrl: "https://mcgwsh19xsfbh858gh-fc-cy7-w4.auth.marketingcloudapis.com/"
    },
    
    // API externa de ejemplo (cambiar por tu sistema)
    external: {
        apiKey: "tu_api_key_externa",
        baseUrl: "https://api.tu-sistema.com/v1/"
    }
};

// ===============================
// 3. INICIALIZAR HANDLERS
// ===============================
var auth = new AuthHandler();
var connection = new ConnectionHandler();
var emailHandler = new EmailHandler();
var deHandler = new DataExtensionHandler();
var logger = new LogHandler();

// ===============================
// 4. EJEMPLO 1: CONECTAR CON SISTEMA EXTERNO
// ===============================
function connectToExternalSystem() {
    try {
        Write('<h3>🌐 Conectando con Sistema Externo</h3>');
        
        // Configurar headers para API externa
        var headers = {
            'Authorization': 'Bearer ' + config.external.apiKey,
            'Content-Type': 'application/json'
        };
        
        // Hacer petición GET a sistema externo
        var url = config.external.baseUrl + 'customers';
        var result = connection.get(url, headers);
        
        if (result.success) {
            Write('<div style="color: green;">✅ Conexión exitosa con sistema externo</div>');
            Write('<p>Status: ' + result.data.statusCode + '</p>');
            
            // Procesar datos recibidos
            if (result.data.parsedContent) {
                var customers = result.data.parsedContent.customers || [];
                Write('<p>Clientes encontrados: ' + customers.length + '</p>');
                
                // Log de éxito
                logger.info('Conexión exitosa con sistema externo', 'ExternalSystem', {
                    customersCount: customers.length,
                    responseTime: result.data.responseTime
                });
                
                return customers;
            }
        } else {
            Write('<div style="color: red;">❌ Error en conexión externa</div>');
            Write('<p>Error: ' + result.error.message + '</p>');
            
            // Log de error
            logger.error('Error en conexión externa', 'ExternalSystem', {
                error: result.error,
                url: url
            });
        }
        
    } catch (ex) {
        Write('<div style="color: red;">❌ Excepción: ' + ex.message + '</div>');
        logger.error('Excepción en conexión externa', 'ExternalSystem', {exception: ex.message});
    }
    
    return null;
}

// ===============================
// 5. EJEMPLO 2: GESTIÓN DE EMAILS EN SFMC
// ===============================
function manageEmails() {
    try {
        Write('<h3>📧 Gestionando Emails en SFMC</h3>');
        
        // Obtener token de autenticación
        var tokenResult = auth.getToken(config.sfmc);
        if (!tokenResult.success) {
            Write('<div style="color: red;">❌ Error de autenticación: ' + tokenResult.error.message + '</div>');
            return;
        }
        
        Write('<div style="color: green;">✅ Autenticación exitosa</div>');
        
        // Listar emails existentes
        var emailsResult = emailHandler.list(config.sfmc);
        if (emailsResult.success) {
            var emails = emailsResult.data;
            Write('<p>Emails encontrados: ' + emails.length + '</p>');
            
            // Mostrar algunos emails
            for (var i = 0; i < Math.min(emails.length, 3); i++) {
                var email = emails[i];
                Write('<li>' + email.name + ' (ID: ' + email.id + ')</li>');
            }
            
            // Log de éxito
            logger.info('Listado de emails completado', 'EmailManagement', {
                emailCount: emails.length
            });
            
        } else {
            Write('<div style="color: red;">❌ Error listando emails: ' + emailsResult.error.message + '</div>');
            logger.error('Error listando emails', 'EmailManagement', {error: emailsResult.error});
        }
        
    } catch (ex) {
        Write('<div style="color: red;">❌ Excepción: ' + ex.message + '</div>');
        logger.error('Excepción en gestión de emails', 'EmailManagement', {exception: ex.message});
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
        
        var addResult = deHandler.addRecord('customers_de', recordData);
        if (addResult.success) {
            Write('<div style="color: green;">✅ Registro agregado a Data Extension</div>');
            Write('<p>Registros añadidos: ' + addResult.data.rowsAdded + '</p>');
            
            // Log de éxito
            logger.info('Registro agregado a DE', 'DataExtension', {
                deKey: 'customers_de',
                recordId: recordData.CustomerID
            });
            
        } else {
            Write('<div style="color: red;">❌ Error agregando registro: ' + addResult.error.message + '</div>');
            logger.error('Error agregando registro a DE', 'DataExtension', {error: addResult.error});
        }
        
    } catch (ex) {
        Write('<div style="color: red;">❌ Excepción: ' + ex.message + '</div>');
        logger.error('Excepción en Data Extension', 'DataExtension', {exception: ex.message});
    }
}

// ===============================
// 7. EJEMPLO 4: INTEGRACIÓN COMPLETA
// ===============================
function fullIntegrationExample() {
    try {
        Write('<h3>🔄 Ejemplo de Integración Completa</h3>');
        
        // Paso 1: Obtener datos del sistema externo
        var externalCustomers = connectToExternalSystem();
        
        if (externalCustomers && externalCustomers.length > 0) {
            Write('<p>Procesando ' + externalCustomers.length + ' clientes...</p>');
            
            // Paso 2: Procesar cada cliente
            for (var i = 0; i < Math.min(externalCustomers.length, 5); i++) {
                var customer = externalCustomers[i];
                
                // Paso 3: Agregar a Data Extension
                var deRecord = {
                    CustomerID: customer.id,
                    Email: customer.email,
                    Name: customer.name,
                    Source: 'External_API',
                    ImportedDate: new Date().toISOString()
                };
                
                var addResult = deHandler.addRecord('imported_customers', deRecord);
                if (addResult.success) {
                    Write('<div style="color: green;">✅ Cliente ' + customer.name + ' importado</div>');
                } else {
                    Write('<div style="color: orange;">⚠️ Error importando ' + customer.name + '</div>');
                }
            }
            
            // Paso 4: Log de resumen
            logger.info('Integración completa finalizada', 'Integration', {
                processedCustomers: Math.min(externalCustomers.length, 5),
                totalCustomers: externalCustomers.length
            });
            
        } else {
            Write('<div style="color: orange;">⚠️ No se encontraron clientes para procesar</div>');
        }
        
    } catch (ex) {
        Write('<div style="color: red;">❌ Excepción en integración: ' + ex.message + '</div>');
        logger.error('Excepción en integración completa', 'Integration', {exception: ex.message});
    }
}

// ===============================
// 8. EJEMPLO 5: MANEJO DE ERRORES Y LOGGING
// ===============================
function errorHandlingExample() {
    try {
        Write('<h3>🚨 Ejemplo de Manejo de Errores</h3>');
        
        // Simular error de conexión
        var badUrl = 'https://api-inexistente.com/data';
        var errorResult = connection.get(badUrl);
        
        if (!errorResult.success) {
            Write('<div style="color: red;">❌ Error esperado capturado</div>');
            Write('<p>Código: ' + errorResult.error.code + '</p>');
            Write('<p>Mensaje: ' + errorResult.error.message + '</p>');
            
            // Log del error
            logger.error('Error de conexión simulado', 'ErrorHandling', {
                url: badUrl,
                error: errorResult.error
            });
        }
        
        // Simular error de validación
        var invalidConfig = {
            // Falta clientId requerido
            clientSecret: 'secret',
            authBaseUrl: 'https://test.com/'
        };
        
        var authResult = auth.getToken(invalidConfig);
        if (!authResult.success) {
            Write('<div style="color: red;">❌ Error de validación capturado</div>');
            Write('<p>Campo: ' + authResult.error.details.field + '</p>');
            Write('<p>Mensaje: ' + authResult.error.details.validationMessage + '</p>');
            
            // Log del error
            logger.error('Error de validación simulado', 'ErrorHandling', {
                error: authResult.error
            });
        }
        
    } catch (ex) {
        Write('<div style="color: red;">❌ Excepción: ' + ex.message + '</div>');
        logger.error('Excepción en manejo de errores', 'ErrorHandling', {exception: ex.message});
    }
}

// ===============================
// 9. EJECUTAR EJEMPLOS
// ===============================
try {
    Write('<h1>🚀 OmegaFramework - Ejemplo Práctico</h1>');
    Write('<p><strong>Fecha:</strong> ' + new Date().toISOString() + '</p>');
    
    // Ejecutar todos los ejemplos
    connectToExternalSystem();
    Write('<hr>');
    
    manageEmails();
    Write('<hr>');
    
    workWithDataExtensions();
    Write('<hr>');
    
    errorHandlingExample();
    Write('<hr>');
    
    // fullIntegrationExample(); // Descomenta para ejecutar
    
    Write('<h3>✅ Ejemplos completados</h3>');
    Write('<p>Revisa los logs en la Data Extension para más detalles.</p>');
    
} catch (mainEx) {
    Write('<div style="color: red;">❌ Error principal: ' + mainEx.message + '</div>');
}

</script>

<!DOCTYPE html>
<html>
<head>
    <title>OmegaFramework - Ejemplo Práctico</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #0176d3; }
        h3 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        hr { margin: 20px 0; border: 1px solid #eee; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div id="results">
        <!-- Los resultados se muestran aquí -->
    </div>
</body>
</html>