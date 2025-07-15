<script runat="server">

Platform.Load("core", "1.1.1");

// MiniFramework Journey Creator
// Creates a Journey for email alerts (optional enhancement to Triggered Sends)

function MiniFrameworkJourneyCreator() {
    var creator = 'JourneyCreator';
    var response = new MiniFrameworkResponse();
    
    // Journey definition for MiniFramework alerts
    var journeyDefinition = {
        name: 'MiniFramework_Alert_Journey',
        key: 'miniframework_alert_journey',
        description: 'Journey for processing MiniFramework alerts with enhanced logic',
        version: '1.0.0',
        
        // Journey structure
        activities: [
            {
                key: 'data_extension_entry',
                name: 'Alert Queue Entry',
                type: 'DataExtensionEntryEvent',
                description: 'Triggered when new alert is added to queue',
                configurationArguments: {
                    dataExtensionKey: 'miniframework_alert_queue',
                    eventDefinitionKey: 'alert_entry_event'
                }
            },
            {
                key: 'wait_activity',
                name: 'Processing Delay',
                type: 'Wait',
                description: 'Brief delay to allow for data processing',
                configurationArguments: {
                    waitDefinition: {
                        waitForEventKey: '',
                        waitQueueTimeoutKey: '',
                        waitDuration: 30,
                        waitUnit: 'SECONDS'
                    }
                }
            },
            {
                key: 'decision_activity',
                name: 'Alert Level Decision',
                type: 'MultiCriteriaDecision',
                description: 'Route based on alert level and configuration',
                outcomes: [
                    {
                        key: 'critical_path',
                        name: 'Critical Alert Path',
                        arguments: {
                            criteria: [
                                {
                                    leftOperand: {
                                        dataExtensionField: {
                                            dataExtensionKey: 'miniframework_alert_queue',
                                            fieldKey: 'AlertLevel'
                                        }
                                    },
                                    operator: 'Equal',
                                    rightOperand: {
                                        value: 'ERROR'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        key: 'warning_path',
                        name: 'Warning Alert Path',
                        arguments: {
                            criteria: [
                                {
                                    leftOperand: {
                                        dataExtensionField: {
                                            dataExtensionKey: 'miniframework_alert_queue',
                                            fieldKey: 'AlertLevel'
                                        }
                                    },
                                    operator: 'Equal',
                                    rightOperand: {
                                        value: 'WARN'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        key: 'info_path',
                        name: 'Info Alert Path',
                        arguments: {
                            criteria: [
                                {
                                    leftOperand: {
                                        dataExtensionField: {
                                            dataExtensionKey: 'miniframework_alert_queue',
                                            fieldKey: 'AlertLevel'
                                        }
                                    },
                                    operator: 'Equal',
                                    rightOperand: {
                                        value: 'INFO'
                                    }
                                }
                            ]
                        }
                    }
                ]
            },
            {
                key: 'immediate_email_critical',
                name: 'Immediate Critical Alert',
                type: 'EmailV2',
                description: 'Send immediate email for critical alerts',
                configurationArguments: {
                    emailDefinitionKey: 'miniframework_alert_send',
                    priority: 'High',
                    suppressTracking: false
                }
            },
            {
                key: 'batched_email_warning',
                name: 'Batched Warning Alert',
                type: 'EmailV2',
                description: 'Send batched email for warning alerts',
                configurationArguments: {
                    emailDefinitionKey: 'miniframework_alert_send',
                    priority: 'Normal',
                    suppressTracking: false
                }
            },
            {
                key: 'daily_digest_info',
                name: 'Daily Info Digest',
                type: 'EmailV2',
                description: 'Send daily digest for info alerts',
                configurationArguments: {
                    emailDefinitionKey: 'miniframework_alert_send',
                    priority: 'Low',
                    suppressTracking: true
                }
            },
            {
                key: 'update_status',
                name: 'Update Alert Status',
                type: 'UpdateContact',
                description: 'Mark alert as processed',
                configurationArguments: {
                    contactUpdateDefinition: {
                        dataExtensionKey: 'miniframework_alert_queue',
                        updateFields: [
                            {
                                fieldKey: 'Status',
                                value: 'sent'
                            },
                            {
                                fieldKey: 'SentDate',
                                value: '%%=NOW()=%%'
                            }
                        ]
                    }
                }
            }
        ],
        
        // Journey flow connections
        transitions: [
            {
                from: 'data_extension_entry',
                to: 'wait_activity'
            },
            {
                from: 'wait_activity',
                to: 'decision_activity'
            },
            {
                from: 'decision_activity',
                to: 'immediate_email_critical',
                condition: 'critical_path'
            },
            {
                from: 'decision_activity',
                to: 'batched_email_warning',
                condition: 'warning_path'
            },
            {
                from: 'decision_activity',
                to: 'daily_digest_info',
                condition: 'info_path'
            },
            {
                from: 'immediate_email_critical',
                to: 'update_status'
            },
            {
                from: 'batched_email_warning',
                to: 'update_status'
            },
            {
                from: 'daily_digest_info',
                to: 'update_status'
            }
        ]
    };
    
    function validateAuthConfig(authConfig) {
        if (!authConfig || !authConfig.clientId || !authConfig.clientSecret || !authConfig.authBaseUrl) {
            return response.authError('Authentication configuration is required', creator, 'validateAuthConfig');
        }
        return null;
    }
    
    function getAuthToken(authConfig) {
        try {
            var tokenUrl = authConfig.authBaseUrl + 'v2/token';
            var postData = {
                'grant_type': 'client_credentials',
                'client_id': authConfig.clientId,
                'client_secret': authConfig.clientSecret
            };
            
            var request = new Script.Util.HttpRequest(tokenUrl);
            request.emptyContentHandling = 0;
            request.retries = 1;
            request.continueOnError = true;
            request.contentType = 'application/json';
            request.method = 'POST';
            request.postData = Stringify(postData);
            
            var httpResponse = request.send();
            
            if (httpResponse.statusCode == 200) {
                var tokenData = Platform.Function.ParseJSON(httpResponse.content);
                if (tokenData && tokenData.access_token) {
                    return response.success({
                        accessToken: tokenData.access_token,
                        tokenType: tokenData.token_type || 'Bearer',
                        restInstanceUrl: tokenData.rest_instance_url
                    }, creator, 'getAuthToken');
                }
            }
            
            return response.httpError(httpResponse.statusCode, httpResponse.content, creator, 'getAuthToken');
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, creator, 'getAuthToken');
        }
    }
    
    function createJourney(authConfig, customJourneyDef) {
        try {
            var authValidation = validateAuthConfig(authConfig);
            if (authValidation) {
                return authValidation;
            }
            
            var tokenResult = getAuthToken(authConfig);
            if (!tokenResult.success) {
                return tokenResult;
            }
            
            var token = tokenResult.data;
            var restUrl = token.restInstanceUrl;
            
            var journeyDef = customJourneyDef || journeyDefinition;
            
            // Note: Journey Builder REST API is complex and requires specific structure
            // This is a simplified version - actual implementation would need more detailed configuration
            var url = restUrl + '/interaction/v1/interactions';
            
            var journeyPayload = {
                name: journeyDef.name,
                key: journeyDef.key,
                description: journeyDef.description,
                version: 1,
                workflowApiVersion: 1.0,
                
                // Simplified journey structure
                // In production, this would need full activity and transition definitions
                triggers: [
                    {
                        key: 'data_extension_trigger',
                        name: 'Alert Queue Trigger',
                        type: 'Event',
                        eventDefinitionKey: 'alert_entry_event',
                        dataExtensionKey: 'miniframework_alert_queue'
                    }
                ],
                
                defaults: {
                    email: ['miniframework_alert_send']
                },
                
                status: 'Draft' // Create in Draft status first
            };
            
            var request = new Script.Util.HttpRequest(url);
            request.method = 'POST';
            request.contentType = 'application/json';
            request.setHeader('Authorization', token.tokenType + ' ' + token.accessToken);
            request.postData = Stringify(journeyPayload);
            request.continueOnError = true;
            
            var httpResponse = request.send();
            
            if (httpResponse.statusCode >= 200 && httpResponse.statusCode < 300) {
                var responseData = Platform.Function.ParseJSON(httpResponse.content);
                return response.success({
                    id: responseData.id,
                    key: responseData.key,
                    name: responseData.name,
                    status: responseData.status,
                    version: responseData.version,
                    message: 'Journey created successfully in Draft status'
                }, creator, 'createJourney');
            } else {
                return response.httpError(httpResponse.statusCode, httpResponse.content, creator, 'createJourney');
            }
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, creator, 'createJourney');
        }
    }
    
    function createEventDefinition(authConfig) {
        try {
            var authValidation = validateAuthConfig(authConfig);
            if (authValidation) {
                return authValidation;
            }
            
            var tokenResult = getAuthToken(authConfig);
            if (!tokenResult.success) {
                return tokenResult;
            }
            
            var token = tokenResult.data;
            var restUrl = token.restInstanceUrl;
            
            var url = restUrl + '/interaction/v1/eventDefinitions';
            
            var eventDefPayload = {
                key: 'alert_entry_event',
                name: 'MiniFramework Alert Entry Event',
                description: 'Triggered when new alert is added to the queue',
                type: 'APIEvent',
                dataExtensionKey: 'miniframework_alert_queue',
                
                schema: [
                    {
                        key: 'AlertLevel',
                        type: 'Text'
                    },
                    {
                        key: 'AlertMessage', 
                        type: 'Text'
                    },
                    {
                        key: 'AlertSource',
                        type: 'Text'
                    },
                    {
                        key: 'Recipients',
                        type: 'Text'
                    },
                    {
                        key: 'CreatedDate',
                        type: 'Date'
                    }
                ]
            };
            
            var request = new Script.Util.HttpRequest(url);
            request.method = 'POST';
            request.contentType = 'application/json';
            request.setHeader('Authorization', token.tokenType + ' ' + token.accessToken);
            request.postData = Stringify(eventDefPayload);
            request.continueOnError = true;
            
            var httpResponse = request.send();
            
            if (httpResponse.statusCode >= 200 && httpResponse.statusCode < 300) {
                var responseData = Platform.Function.ParseJSON(httpResponse.content);
                return response.success({
                    key: responseData.key,
                    name: responseData.name,
                    id: responseData.eventDefinitionId,
                    message: 'Event definition created successfully'
                }, creator, 'createEventDefinition');
            } else {
                return response.httpError(httpResponse.statusCode, httpResponse.content, creator, 'createEventDefinition');
            }
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, creator, 'createEventDefinition');
        }
    }
    
    function createAlertJourneySystem(authConfig, options) {
        try {
            var createOptions = options || {};
            var results = {
                framework: 'MiniFramework',
                timestamp: new Date().toISOString(),
                eventDefinition: null,
                journey: null,
                errors: [],
                summary: {
                    total: 2,
                    created: 0,
                    failed: 0
                }
            };
            
            // Step 1: Create Event Definition
            var eventResult = createEventDefinition(authConfig);
            results.eventDefinition = eventResult;
            
            if (eventResult.success) {
                results.summary.created++;
            } else {
                results.summary.failed++;
                results.errors.push({
                    component: 'EventDefinition',
                    error: eventResult.error
                });
            }
            
            // Step 2: Create Journey (only if event definition was successful)
            if (eventResult.success && !createOptions.skipJourney) {
                var journeyResult = createJourney(authConfig);
                results.journey = journeyResult;
                
                if (journeyResult.success) {
                    results.summary.created++;
                } else {
                    results.summary.failed++;
                    results.errors.push({
                        component: 'Journey',
                        error: journeyResult.error
                    });
                }
            }
            
            return response.success(results, creator, 'createAlertJourneySystem');
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, creator, 'createAlertJourneySystem');
        }
    }
    
    // Public interface
    return {
        createJourney: createJourney,
        createEventDefinition: createEventDefinition,
        createAlertJourneySystem: createAlertJourneySystem,
        getJourneyDefinition: function() { return journeyDefinition; }
    };
}

// Public functions
function createMiniFrameworkJourney(authConfig, options) {
    var creator = new MiniFrameworkJourneyCreator();
    return creator.createAlertJourneySystem(authConfig, options);
}

// Auto-execute if form parameters are provided
try {
    var action = Platform.Request.GetFormField("action");
    var clientId = Platform.Request.GetFormField("clientId");
    var clientSecret = Platform.Request.GetFormField("clientSecret");
    var authBaseUrl = Platform.Request.GetFormField("authBaseUrl");
    
    if (action === "createJourney" && clientId && clientSecret && authBaseUrl) {
        var authConfig = {
            clientId: clientId,
            clientSecret: clientSecret,
            authBaseUrl: authBaseUrl
        };
        
        var skipJourney = Platform.Request.GetFormField("skipJourney") === "true";
        
        var result = createMiniFrameworkJourney(authConfig, {
            skipJourney: skipJourney
        });
        
        if (result) {
            Variable.SetValue("@journeyResult", Stringify(result, null, 2));
        }
    }
} catch (ex) {
    Variable.SetValue("@journeyError", ex.message);
}

</script>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MiniFramework - Journey Creator</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
        }
        h1 {
            color: #0176d3;
            text-align: center;
            margin-bottom: 30px;
        }
        .info {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .form-group {
            margin: 20px 0;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 14px;
        }
        button {
            background: #0176d3;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px 5px;
        }
        button:hover {
            background: #014486;
        }
        .result {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
            max-height: 400px;
            overflow-y: auto;
        }
        .success {
            background: #d4edda;
            border-color: #c3e6cb;
            color: #155724;
        }
        .error {
            background: #f8d7da;
            border-color: #f5c6cb;
            color: #721c24;
        }
        pre {
            white-space: pre-wrap;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛤️ MiniFramework - Journey Creator</h1>
        
        <div class="info">
            <h3>📋 Journey Builder para Alertas Avanzadas</h3>
            <p>Esta herramienta crea un Journey Builder que proporciona lógica avanzada para el procesamiento de alertas:</p>
            <ul>
                <li><strong>🚨 Alertas críticas:</strong> Envío inmediato</li>
                <li><strong>⚠️ Alertas de advertencia:</strong> Envío agrupado</li>
                <li><strong>ℹ️ Alertas informativas:</strong> Digest diario</li>
                <li><strong>📊 Tracking:</strong> Estado de procesamiento</li>
            </ul>
        </div>

        <div class="warning">
            <h4>⚠️ Nota Importante:</h4>
            <p><strong>El Journey Builder es OPCIONAL.</strong> El sistema de Triggered Send ya proporciona funcionalidad completa de alertas. Este Journey agrega capacidades avanzadas como:</p>
            <ul>
                <li>Lógica de decisión basada en nivel de alerta</li>
                <li>Agrupación de alertas por prioridad</li>
                <li>Procesamiento diferido para alertas no críticas</li>
                <li>Tracking avanzado del estado de alertas</li>
            </ul>
            <p><strong>Solo crear si necesitas estas funcionalidades avanzadas.</strong></p>
        </div>

        <form method="POST">
            <div class="form-group">
                <label for="clientId">Client ID *</label>
                <input type="text" id="clientId" name="clientId" required placeholder="Tu Client ID de Salesforce Marketing Cloud">
            </div>
            
            <div class="form-group">
                <label for="clientSecret">Client Secret *</label>
                <input type="password" id="clientSecret" name="clientSecret" required placeholder="Tu Client Secret">
            </div>
            
            <div class="form-group">
                <label for="authBaseUrl">Auth Base URL *</label>
                <input type="text" id="authBaseUrl" name="authBaseUrl" required placeholder="https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/" value="https://YOUR_SUBDOMAIN.auth.marketingcloudapis.com/">
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" id="skipJourney" name="skipJourney" value="true">
                    Solo crear Event Definition (sin Journey completo)
                </label>
            </div>
            
            <div class="form-group">
                <button type="submit" name="action" value="createJourney">🛤️ Crear Journey System</button>
            </div>
        </form>

        <div class="warning">
            <h4>🔧 Configuración Manual Requerida:</h4>
            <p>Debido a la complejidad del Journey Builder REST API, después de la creación automática necesitarás:</p>
            <ol>
                <li>Abrir Journey Builder en SFMC</li>
                <li>Localizar el Journey "MiniFramework_Alert_Journey"</li>
                <li>Configurar las actividades específicas (Email, Wait, Decision)</li>
                <li>Conectar las transiciones entre actividades</li>
                <li>Activar el Journey una vez configurado</li>
            </ol>
            <p><strong>💡 Alternativa:</strong> Usar solo el sistema de Triggered Send que ya está completamente funcional.</p>
        </div>

        <script runat="server">
            var journeyResult = Variable.GetValue("@journeyResult");
            var journeyError = Variable.GetValue("@journeyError");
            
            if (journeyResult) {
                var resultObj = Platform.Function.ParseJSON(journeyResult);
                
                if (resultObj.success) {
                    Write('<div class="result success">');
                    Write('<h3>✅ Journey System Creado</h3>');
                    
                    if (resultObj.data.eventDefinition && resultObj.data.eventDefinition.success) {
                        Write('<p><strong>✅ Event Definition:</strong> ' + resultObj.data.eventDefinition.data.name + ' creado exitosamente</p>');
                    }
                    
                    if (resultObj.data.journey && resultObj.data.journey.success) {
                        Write('<p><strong>✅ Journey:</strong> ' + resultObj.data.journey.data.name + ' creado en estado Draft</p>');
                        Write('<div class="info">');
                        Write('<h4>📋 Próximos pasos:</h4>');
                        Write('<ol>');
                        Write('<li>Abrir Journey Builder en SFMC</li>');
                        Write('<li>Buscar "MiniFramework_Alert_Journey"</li>');
                        Write('<li>Configurar las actividades específicas</li>');
                        Write('<li>Activar el Journey</li>');
                        Write('</ol>');
                        Write('</div>');
                    } else if (resultObj.data.eventDefinition && resultObj.data.eventDefinition.success) {
                        Write('<div class="info">');
                        Write('<h4>ℹ️ Solo Event Definition creado</h4>');
                        Write('<p>El Event Definition está listo. Puedes crear el Journey manualmente en Journey Builder usando este evento.</p>');
                        Write('</div>');
                    }
                    
                    Write('<p><strong>📊 Resumen:</strong> ' + resultObj.data.summary.created + '/' + resultObj.data.summary.total + ' componentes creados exitosamente</p>');
                    
                    Write('<details>');
                    Write('<summary>Ver detalles técnicos</summary>');
                    Write('<pre>' + journeyResult + '</pre>');
                    Write('</details>');
                    Write('</div>');
                } else {
                    Write('<div class="result error">');
                    Write('<h3>❌ Error al crear Journey System</h3>');
                    Write('<p><strong>Error:</strong> ' + (resultObj.error ? resultObj.error.message : 'Error desconocido') + '</p>');
                    Write('<details>');
                    Write('<summary>Ver detalles del error</summary>');
                    Write('<pre>' + journeyResult + '</pre>');
                    Write('</details>');
                    Write('</div>');
                }
            }
            
            if (journeyError) {
                Write('<div class="result error">');
                Write('<h3>❌ Excepción durante la ejecución</h3>');
                Write('<p>' + journeyError + '</p>');
                Write('</div>');
            }
        </script>
    </div>
</body>
</html>