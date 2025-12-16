<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * IntegrationVeevaVaultHPAmer.ssjs
 * * Sincronización de documentos desde Veeva Vault (HP Amer) hacia SFMC.
 * Utiliza OmegaFramework v3.0 para gestión de dependencias, credenciales y conexiones.
 *
 * Flujo:
 * 1. Carga el Framework.
 * 2. Obtiene credenciales seguras desde CredentialStore.
 * 3. Autentica contra Veeva Vault.
 * 4. Ejecuta consulta VQL (Veeva Query Language).
 * 5. Transforma y escribe los datos en Data Extension.
 *
 * @version 2.0.0 (OmegaFramework Adapter)
 */

try {
    // ========================================================================
    // 1. CONFIGURACIÓN
    // ========================================================================
    
    // Nombre de la integración en OMG_FW_Credentials
    // Debe existir un registro con AuthType='Basic' y Platform='VeevaVault'
    var INTEGRATION_NAME = "VeevaVaultHPAmer"; 
    
    // Data Extension destino en SFMC
    var TARGET_DE_KEY = "ENT_Veeva_Documents_HPAmer";
    
    // Data Extension de Log (Opcional)
    var LOG_DE_KEY = "Integration_Logs";
    
    // Consulta VQL para obtener documentos aprobados
    var VQL_QUERY = "SELECT id, name__v, type__v, status__v, title__v, version_id, lifecycle__v ";
    VQL_QUERY    += "FROM documents ";
    VQL_QUERY    += "WHERE status__v = 'Approved' ";
    VQL_QUERY    += "LIMIT 1000";

    // ========================================================================
    // 2. INICIALIZACIÓN DEL FRAMEWORK
    // ========================================================================
    
    // Cargar el núcleo del framework
    Platform.Function.ContentBlockByKey("OMG_FW_OmegaFramework");

    if (typeof OmegaFramework === 'undefined') {
        throw new Error("OmegaFramework no se pudo cargar. Verifique el Content Block.");
    }

    Write("<p>✅ OmegaFramework cargado correctamente.</p>");

    // ========================================================================
    // 3. INSTANCIACIÓN DE MÓDULOS
    // ========================================================================

    // A. VeevaVaultIntegration
    // Al pasar un string, el framework busca automáticamente en CredentialStore,
    // desencripta usuario/password y configura la Base URL.
    var vault = OmegaFramework.create('VeevaVaultIntegration', {
        integrationName: INTEGRATION_NAME
    });

    // B. DataExtensionHandler
    // Se encarga de las operaciones en SFMC DEs usando WSProxy internamente.
    var deHandler = OmegaFramework.create('DataExtensionHandler', {});

    Write("<p>✅ Módulos (VeevaVault, DataExtensionHandler) instanciados.</p>");

    // ========================================================================
    // 4. AUTENTICACIÓN Y CONSULTA (Veeva Vault)
    // ========================================================================

    Write("<p>🔄 Iniciando autenticación con Veeva Vault (" + INTEGRATION_NAME + ")...</p>");

    // La autenticación es automática al hacer peticiones, pero la forzamos para validar conexión temprana.
    var authResult = vault.authenticate();

    if (!authResult.success) {
        throw new Error("Error de Autenticación Veeva: " + authResult.error.message);
    }

    Write("<p>✅ Autenticación exitosa. Session ID obtenido.</p>");
    Write("<p>🔍 Ejecutando VQL: <code>" + VQL_QUERY + "</code></p>");

    // Ejecutar consulta VQL
    var queryResult = vault.executeQuery(VQL_QUERY);

    if (!queryResult.success) {
        throw new Error("Error en consulta VQL: " + queryResult.error.message);
    }

    // Veeva devuelve los datos dentro de data.data (dependiendo de la versión de la API y el wrapper)
    // El ResponseWrapper normaliza esto, pero verificamos la estructura.
    var documents = [];
    if (queryResult.data && queryResult.data.data) {
        documents = queryResult.data.data;
    } else if (queryResult.data && queryResult.data.responseStatus === 'SUCCESS') {
        documents = queryResult.data.data; // Fallback structure
    }

    Write("<p>📄 Documentos encontrados: <strong>" + documents.length + "</strong></p>");

    // ========================================================================
    // 5. TRANSFORMACIÓN Y ESCRITURA (SFMC Data Extension)
    // ========================================================================

    if (documents.length > 0) {
        
        var rowsToUpsert = [];
        var timestamp = new Date();

        // Mapeo de campos: Veeva JSON -> SFMC DE Columns
        for (var i = 0; i < documents.length; i++) {
            var doc = documents[i];
            
            rowsToUpsert.push({
                DocumentID:     doc.id,              // Clave Primaria en DE
                Name:           doc.name__v,
                DocumentType:   doc.type__v,
                Status:         doc.status__v,
                Title:          doc.title__v,
                Version:        doc.version_id,
                Lifecycle:      doc.lifecycle__v,
                LastSyncedDate: timestamp
            });
        }

        Write("<p>💾 Guardando datos en Data Extension: <strong>" + TARGET_DE_KEY + "</strong>...</p>");

        // DataExtensionHandler v2.0 detecta automáticamente batch upsert
        var upsertResult = deHandler.upsert(TARGET_DE_KEY, rowsToUpsert);

        if (upsertResult.success) {
            Write("<div style='color:green; border:1px solid green; padding:10px;'>");
            Write("<strong>✓ Sincronización Exitosa</strong><br>");
            Write("Registros procesados: " + upsertResult.data.count);
            Write("</div>");

            // ========================================================================
            // 6. LOGGING (Opcional)
            // ========================================================================
            try {
                deHandler.insert(LOG_DE_KEY, {
                    IntegrationName: INTEGRATION_NAME,
                    Status: "Success",
                    RecordsProcessed: upsertResult.data.count,
                    Message: "Sincronización completada correctamente",
                    LogDate: timestamp
                });
            } catch(e) { /* Ignorar errores de log */ }

        } else {
            // Manejo de error en escritura a DE
            var errorMsg = upsertResult.error.message;
            if (upsertResult.error.details) {
                errorMsg += " - Details: " + Stringify(upsertResult.error.details);
            }
            throw new Error("Error escribiendo en DE: " + errorMsg);
        }

    } else {
        Write("<p style='color:orange'>⚠️ No se encontraron documentos para procesar.</p>");
    }

} catch (ex) {
    // ========================================================================
    // MANEJO GLOBAL DE ERRORES
    // ========================================================================
    var errorDetails = (ex.message || ex) + (ex.description ? " - " + ex.description : "");
    
    Write("<div style='color:white; background-color:red; padding:15px;'>");
    Write("<strong>❌ ERROR CRÍTICO EN INTEGRACIÓN:</strong><br>");
    Write(errorDetails);
    Write("</div>");
    
    // Intento de log de error en DE
    try {
        if (typeof deHandler !== 'undefined' && typeof LOG_DE_KEY !== 'undefined') {
            deHandler.insert(LOG_DE_KEY, {
                IntegrationName: (typeof INTEGRATION_NAME !== 'undefined' ? INTEGRATION_NAME : "Unknown"),
                Status: "Error",
                RecordsProcessed: 0,
                Message: errorDetails.substring(0, 4000), // Limitar longitud
                LogDate: new Date()
            });
        }
    } catch(logEx) {
        Write("No se pudo escribir el log de error.");
    }
}
</script>