<script runat="server">

Platform.Load("core", "1.1.1");

// MiniFramework Asset Creator
// Creates all necessary Data Extensions, Triggered Sends, and Email Templates

function MiniFrameworkAssetCreator() {
    var creator = 'AssetCreator';
    var response = new MiniFrameworkResponse();
    
    // Asset definitions
    var assetDefinitions = {
        dataExtensions: [
            {
                name: 'MiniFramework_Logs',
                externalKey: 'miniframework_logs',
                description: 'Log storage for MiniFramework operations',
                fields: [
                    {
                        name: 'LogId',
                        fieldType: 'Number',
                        isPrimaryKey: true,
                        isRequired: true,
                        isAutoNumber: true
                    },
                    {
                        name: 'Timestamp',
                        fieldType: 'Date',
                        isRequired: true
                    },
                    {
                        name: 'Level',
                        fieldType: 'Text',
                        length: 10,
                        isRequired: true
                    },
                    {
                        name: 'Message',
                        fieldType: 'Text',
                        length: 500,
                        isRequired: true
                    },
                    {
                        name: 'Source',
                        fieldType: 'Text',
                        length: 100
                    },
                    {
                        name: 'SessionId',
                        fieldType: 'Text',
                        length: 50
                    },
                    {
                        name: 'Data',
                        fieldType: 'Text',
                        length: 4000
                    },
                    {
                        name: 'ErrorCode',
                        fieldType: 'Text',
                        length: 50
                    },
                    {
                        name: 'Handler',
                        fieldType: 'Text',
                        length: 50
                    },
                    {
                        name: 'Operation',
                        fieldType: 'Text',
                        length: 100
                    }
                ]
            },
            {
                name: 'MiniFramework_Config',
                externalKey: 'miniframework_config',
                description: 'Configuration storage for MiniFramework settings',
                fields: [
                    {
                        name: 'ConfigKey',
                        fieldType: 'Text',
                        length: 100,
                        isPrimaryKey: true,
                        isRequired: true
                    },
                    {
                        name: 'ConfigValue',
                        fieldType: 'Text',
                        length: 4000,
                        isRequired: true
                    },
                    {
                        name: 'Description',
                        fieldType: 'Text',
                        length: 500
                    },
                    {
                        name: 'LastUpdated',
                        fieldType: 'Date',
                        isRequired: true
                    },
                    {
                        name: 'Environment',
                        fieldType: 'Text',
                        length: 20,
                        defaultValue: 'production'
                    },
                    {
                        name: 'IsActive',
                        fieldType: 'Boolean',
                        defaultValue: true
                    }
                ]
            },
            {
                name: 'MiniFramework_AlertQueue',
                externalKey: 'miniframework_alert_queue',
                description: 'Queue for email alerts from MiniFramework',
                fields: [
                    {
                        name: 'AlertId',
                        fieldType: 'Number',
                        isPrimaryKey: true,
                        isRequired: true,
                        isAutoNumber: true
                    },
                    {
                        name: 'AlertLevel',
                        fieldType: 'Text',
                        length: 10,
                        isRequired: true
                    },
                    {
                        name: 'AlertMessage',
                        fieldType: 'Text',
                        length: 500,
                        isRequired: true
                    },
                    {
                        name: 'AlertSource',
                        fieldType: 'Text',
                        length: 100,
                        isRequired: true
                    },
                    {
                        name: 'AlertData',
                        fieldType: 'Text',
                        length: 4000
                    },
                    {
                        name: 'Recipients',
                        fieldType: 'Text',
                        length: 1000,
                        isRequired: true
                    },
                    {
                        name: 'CreatedDate',
                        fieldType: 'Date',
                        isRequired: true
                    },
                    {
                        name: 'SentDate',
                        fieldType: 'Date'
                    },
                    {
                        name: 'Status',
                        fieldType: 'Text',
                        length: 20,
                        defaultValue: 'pending'
                    },
                    {
                        name: 'ErrorMessage',
                        fieldType: 'Text',
                        length: 500
                    }
                ]
            }
        ],
        
        emailTemplate: {
            name: 'MiniFramework_Alert_Template',
            subject: '[SFMC Alert] %%=v(@AlertLevel)=%% from %%=v(@AlertSource)=%%',
            htmlContent: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SFMC Alert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .header.warn { background: #ffc107; color: #212529; }
        .header.info { background: #17a2b8; }
        .content { padding: 20px; }
        .alert-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { background: #6c757d; color: white; padding: 15px; text-align: center; font-size: 12px; }
        .timestamp { color: #666; font-size: 12px; }
        .data-section { background: #e9ecef; padding: 10px; border-radius: 3px; margin: 10px 0; font-family: monospace; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header %%=IIF(@AlertLevel=="ERROR","","")=%%%%=IIF(@AlertLevel=="WARN","warn","")=%%%%=IIF(@AlertLevel=="INFO","info","")=%%">
            <h1>🚨 Salesforce Marketing Cloud Alert</h1>
            <p>Level: <strong>%%=v(@AlertLevel)=%%</strong></p>
        </div>
        
        <div class="content">
            <h2>Alert Details</h2>
            
            <div class="alert-details">
                <p><strong>Source:</strong> %%=v(@AlertSource)=%%</p>
                <p><strong>Message:</strong> %%=v(@AlertMessage)=%%</p>
                <p><strong>Timestamp:</strong> <span class="timestamp">%%=v(@CreatedDate)=%%</span></p>
            </div>
            
            %%[ IF NOT EMPTY(@AlertData) THEN ]%%
            <h3>Additional Data</h3>
            <div class="data-section">
                %%=v(@AlertData)=%%
            </div>
            %%[ ENDIF ]%%
            
            <h3>Recommended Actions</h3>
            %%[ IF @AlertLevel == "ERROR" THEN ]%%
            <ul>
                <li>Check the application logs for more details</li>
                <li>Verify system connectivity and credentials</li>
                <li>Contact the development team if issue persists</li>
                <li>Check SFMC status page for known issues</li>
            </ul>
            %%[ ELSEIF @AlertLevel == "WARN" THEN ]%%
            <ul>
                <li>Monitor the situation for escalation</li>
                <li>Review configuration settings if applicable</li>
                <li>Consider preventive maintenance</li>
            </ul>
            %%[ ELSE ]%%
            <ul>
                <li>This is an informational alert</li>
                <li>No immediate action required</li>
                <li>Keep for monitoring purposes</li>
            </ul>
            %%[ ENDIF ]%%
        </div>
        
        <div class="footer">
            <p>This alert was generated automatically by MiniFramework</p>
            <p>Salesforce Marketing Cloud - %%=Format(Now(), "yyyy-MM-dd HH:mm:ss")=%%</p>
        </div>
    </div>
</body>
</html>`,
            textContent: `
SALESFORCE MARKETING CLOUD ALERT

Level: %%=v(@AlertLevel)=%%
Source: %%=v(@AlertSource)=%%
Message: %%=v(@AlertMessage)=%%
Timestamp: %%=v(@CreatedDate)=%%

%%[ IF NOT EMPTY(@AlertData) THEN ]%%
Additional Data:
%%=v(@AlertData)=%%
%%[ ENDIF ]%%

This alert was generated automatically by MiniFramework.
`
        },
        
        triggeredSend: {
            name: 'MiniFramework_Alert_Send',
            externalKey: 'miniframework_alert_send',
            description: 'Triggered Send for MiniFramework alerts',
            classification: 'System Alert'
        }
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
    
    function createDataExtension(authConfig, deDefinition) {
        try {
            var tokenResult = getAuthToken(authConfig);
            if (!tokenResult.success) {
                return tokenResult;
            }
            
            var token = tokenResult.data;
            var restUrl = token.restInstanceUrl;
            
            var url = restUrl + '/hub/v1/dataevents/key:' + deDefinition.externalKey + '/rowset';
            
            // First try to check if DE exists
            var checkRequest = new Script.Util.HttpRequest(url);
            checkRequest.method = 'GET';
            checkRequest.setHeader('Authorization', token.tokenType + ' ' + token.accessToken);
            checkRequest.continueOnError = true;
            
            var checkResponse = checkRequest.send();
            
            if (checkResponse.statusCode == 200) {
                // DE already exists
                return response.success({
                    name: deDefinition.name,
                    externalKey: deDefinition.externalKey,
                    status: 'already_exists',
                    message: 'Data Extension already exists'
                }, creator, 'createDataExtension');
            }
            
            // DE doesn't exist, create it using Legacy SOAP API (more reliable for DE creation)
            try {
                var deProxy = new Script.Util.WSProxy();
                
                var deObj = {
                    Name: deDefinition.name,
                    CustomerKey: deDefinition.externalKey,
                    Description: deDefinition.description || '',
                    IsSendable: false,
                    IsTestable: false,
                    Fields: []
                };
                
                // Convert field definitions
                for (var i = 0; i < deDefinition.fields.length; i++) {
                    var field = deDefinition.fields[i];
                    var fieldObj = {
                        Name: field.name,
                        FieldType: field.fieldType,
                        IsPrimaryKey: field.isPrimaryKey || false,
                        IsRequired: field.isRequired || false
                    };
                    
                    if (field.length) {
                        fieldObj.MaxLength = field.length;
                    }
                    
                    if (field.defaultValue !== undefined) {
                        fieldObj.DefaultValue = field.defaultValue;
                    }
                    
                    if (field.isAutoNumber) {
                        fieldObj.IsIdentity = true;
                    }
                    
                    deObj.Fields.push(fieldObj);
                }
                
                var result = deProxy.createItem('DataExtension', deObj);
                
                if (result && result.Status == 'OK') {
                    return response.success({
                        name: deDefinition.name,
                        externalKey: deDefinition.externalKey,
                        status: 'created',
                        id: result.Results[0].NewID,
                        message: 'Data Extension created successfully'
                    }, creator, 'createDataExtension');
                } else {
                    return response.error('DE_CREATE_FAILED', 
                        'Failed to create Data Extension via SOAP', 
                        {result: result}, creator, 'createDataExtension');
                }
                
            } catch (soapEx) {
                return response.error('SOAP_EXCEPTION', 
                    'SOAP API failed: ' + (soapEx.message || soapEx.toString()), 
                    {exception: soapEx}, creator, 'createDataExtension');
            }
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, creator, 'createDataExtension');
        }
    }
    
    function createEmailTemplate(authConfig, templateDefinition) {
        try {
            var tokenResult = getAuthToken(authConfig);
            if (!tokenResult.success) {
                return tokenResult;
            }
            
            var token = tokenResult.data;
            var restUrl = token.restInstanceUrl;
            
            var url = restUrl + '/asset/v1/content/assets';
            
            var emailPayload = {
                name: templateDefinition.name,
                assetType: {
                    name: 'htmlemail',
                    id: 208
                },
                content: templateDefinition.htmlContent,
                meta: {
                    isFrameworkAsset: true,
                    framework: 'MiniFramework',
                    purpose: 'alert_template'
                },
                views: {
                    html: {
                        content: templateDefinition.htmlContent
                    },
                    text: {
                        content: templateDefinition.textContent
                    },
                    subjectline: {
                        content: templateDefinition.subject
                    }
                }
            };
            
            var request = new Script.Util.HttpRequest(url);
            request.method = 'POST';
            request.contentType = 'application/json';
            request.setHeader('Authorization', token.tokenType + ' ' + token.accessToken);
            request.postData = Stringify(emailPayload);
            request.continueOnError = true;
            
            var httpResponse = request.send();
            
            if (httpResponse.statusCode >= 200 && httpResponse.statusCode < 300) {
                var responseData = Platform.Function.ParseJSON(httpResponse.content);
                return response.success({
                    name: templateDefinition.name,
                    id: responseData.id,
                    customerKey: responseData.customerKey,
                    status: 'created',
                    message: 'Email template created successfully'
                }, creator, 'createEmailTemplate');
            } else {
                return response.httpError(httpResponse.statusCode, httpResponse.content, creator, 'createEmailTemplate');
            }
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, creator, 'createEmailTemplate');
        }
    }
    
    function createTriggeredSend(authConfig, triggeredSendDefinition, emailTemplateId) {
        try {
            var tokenResult = getAuthToken(authConfig);
            if (!tokenResult.success) {
                return tokenResult;
            }
            
            var token = tokenResult.data;
            var restUrl = token.restInstanceUrl;
            
            var url = restUrl + '/messaging/v1/email/definitions';
            
            var tsPayload = {
                name: triggeredSendDefinition.name,
                definitionKey: triggeredSendDefinition.externalKey,
                description: triggeredSendDefinition.description,
                classification: triggeredSendDefinition.classification,
                status: 'Active',
                content: {
                    emailId: emailTemplateId
                },
                subscriptions: {
                    dataExtension: 'miniframework_alert_queue',
                    autoAddSubscriber: true,
                    updateSubscriber: true
                },
                options: {
                    trackLinks: false,
                    trackOpens: false
                }
            };
            
            var request = new Script.Util.HttpRequest(url);
            request.method = 'POST';
            request.contentType = 'application/json';
            request.setHeader('Authorization', token.tokenType + ' ' + token.accessToken);
            request.postData = Stringify(tsPayload);
            request.continueOnError = true;
            
            var httpResponse = request.send();
            
            if (httpResponse.statusCode >= 200 && httpResponse.statusCode < 300) {
                var responseData = Platform.Function.ParseJSON(httpResponse.content);
                return response.success({
                    name: triggeredSendDefinition.name,
                    definitionKey: triggeredSendDefinition.externalKey,
                    id: responseData.definitionId,
                    status: 'created',
                    message: 'Triggered Send created successfully'
                }, creator, 'createTriggeredSend');
            } else {
                return response.httpError(httpResponse.statusCode, httpResponse.content, creator, 'createTriggeredSend');
            }
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, creator, 'createTriggeredSend');
        }
    }
    
    function createInitialConfiguration(authConfig) {
        try {
            // Add initial configuration records to the config DE
            var configRecords = [
                {
                    ConfigKey: 'FRAMEWORK_VERSION',
                    ConfigValue: '1.0.0',
                    Description: 'Current version of MiniFramework',
                    LastUpdated: new Date().toISOString(),
                    Environment: 'production',
                    IsActive: true
                },
                {
                    ConfigKey: 'LOG_LEVEL',
                    ConfigValue: 'INFO',
                    Description: 'Default logging level (ERROR, WARN, INFO, DEBUG)',
                    LastUpdated: new Date().toISOString(),
                    Environment: 'production',
                    IsActive: true
                },
                {
                    ConfigKey: 'ALERT_RECIPIENTS',
                    ConfigValue: '["admin@example.com"]',
                    Description: 'Default email recipients for alerts (JSON array)',
                    LastUpdated: new Date().toISOString(),
                    Environment: 'production',
                    IsActive: true
                },
                {
                    ConfigKey: 'ENABLE_EMAIL_ALERTS',
                    ConfigValue: 'true',
                    Description: 'Enable/disable email alerts for errors',
                    LastUpdated: new Date().toISOString(),
                    Environment: 'production',
                    IsActive: true
                },
                {
                    ConfigKey: 'RETRY_ATTEMPTS',
                    ConfigValue: '3',
                    Description: 'Default number of retry attempts for HTTP requests',
                    LastUpdated: new Date().toISOString(),
                    Environment: 'production',
                    IsActive: true
                },
                {
                    ConfigKey: 'RETRY_DELAY',
                    ConfigValue: '1000',
                    Description: 'Default delay between retry attempts (milliseconds)',
                    LastUpdated: new Date().toISOString(),
                    Environment: 'production',
                    IsActive: true
                }
            ];
            
            try {
                var de = DataExtension.Init('miniframework_config');
                var addedRecords = 0;
                
                for (var i = 0; i < configRecords.length; i++) {
                    var result = de.Rows.Add(configRecords[i]);
                    if (result > 0) {
                        addedRecords++;
                    }
                }
                
                return response.success({
                    totalRecords: configRecords.length,
                    addedRecords: addedRecords,
                    message: 'Initial configuration created'
                }, creator, 'createInitialConfiguration');
                
            } catch (deEx) {
                return response.error('CONFIG_DE_ERROR', 'Failed to add configuration records', 
                    {exception: deEx.message}, creator, 'createInitialConfiguration');
            }
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, creator, 'createInitialConfiguration');
        }
    }
    
    function createAllAssets(authConfig, options) {
        try {
            var authValidation = validateAuthConfig(authConfig);
            if (authValidation) {
                return authValidation;
            }
            
            var createOptions = options || {};
            var results = {
                framework: 'MiniFramework',
                timestamp: new Date().toISOString(),
                dataExtensions: [],
                emailTemplate: null,
                triggeredSend: null,
                configuration: null,
                errors: [],
                summary: {
                    total: 0,
                    created: 0,
                    failed: 0,
                    skipped: 0
                }
            };
            
            // 1. Create Data Extensions
            for (var i = 0; i < assetDefinitions.dataExtensions.length; i++) {
                var deDefinition = assetDefinitions.dataExtensions[i];
                var deResult = createDataExtension(authConfig, deDefinition);
                
                results.dataExtensions.push({
                    name: deDefinition.name,
                    externalKey: deDefinition.externalKey,
                    result: deResult
                });
                
                results.summary.total++;
                
                if (deResult.success) {
                    if (deResult.data.status === 'created') {
                        results.summary.created++;
                    } else {
                        results.summary.skipped++;
                    }
                } else {
                    results.summary.failed++;
                    results.errors.push({
                        asset: 'DataExtension',
                        name: deDefinition.name,
                        error: deResult.error
                    });
                }
            }
            
            // 2. Create Email Template
            var emailResult = createEmailTemplate(authConfig, assetDefinitions.emailTemplate);
            results.emailTemplate = emailResult;
            results.summary.total++;
            
            var emailTemplateId = null;
            if (emailResult.success) {
                results.summary.created++;
                emailTemplateId = emailResult.data.id;
            } else {
                results.summary.failed++;
                results.errors.push({
                    asset: 'EmailTemplate',
                    name: assetDefinitions.emailTemplate.name,
                    error: emailResult.error
                });
            }
            
            // 3. Create Triggered Send (only if email template was created)
            if (emailTemplateId && !createOptions.skipTriggeredSend) {
                var tsResult = createTriggeredSend(authConfig, assetDefinitions.triggeredSend, emailTemplateId);
                results.triggeredSend = tsResult;
                results.summary.total++;
                
                if (tsResult.success) {
                    results.summary.created++;
                } else {
                    results.summary.failed++;
                    results.errors.push({
                        asset: 'TriggeredSend',
                        name: assetDefinitions.triggeredSend.name,
                        error: tsResult.error
                    });
                }
            }
            
            // 4. Create Initial Configuration
            if (!createOptions.skipConfiguration) {
                var configResult = createInitialConfiguration(authConfig);
                results.configuration = configResult;
                results.summary.total++;
                
                if (configResult.success) {
                    results.summary.created++;
                } else {
                    results.summary.failed++;
                    results.errors.push({
                        asset: 'Configuration',
                        name: 'Initial Config',
                        error: configResult.error
                    });
                }
            }
            
            return response.success(results, creator, 'createAllAssets');
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, creator, 'createAllAssets');
        }
    }
    
    // Public interface
    return {
        createAllAssets: createAllAssets,
        createDataExtension: createDataExtension,
        createEmailTemplate: createEmailTemplate,
        createTriggeredSend: createTriggeredSend,
        createInitialConfiguration: createInitialConfiguration,
        getAssetDefinitions: function() { return assetDefinitions; }
    };
}

// Public functions
function createMiniFrameworkAssets(authConfig, options) {
    var creator = new MiniFrameworkAssetCreator();
    return creator.createAllAssets(authConfig, options);
}

// Auto-execute if form parameters are provided
try {
    var action = Platform.Request.GetFormField("action");
    var clientId = Platform.Request.GetFormField("clientId");
    var clientSecret = Platform.Request.GetFormField("clientSecret");
    var authBaseUrl = Platform.Request.GetFormField("authBaseUrl");
    
    if (action === "createAssets" && clientId && clientSecret && authBaseUrl) {
        var authConfig = {
            clientId: clientId,
            clientSecret: clientSecret,
            authBaseUrl: authBaseUrl
        };
        
        var skipTriggeredSend = Platform.Request.GetFormField("skipTriggeredSend") === "true";
        var skipConfiguration = Platform.Request.GetFormField("skipConfiguration") === "true";
        
        var result = createMiniFrameworkAssets(authConfig, {
            skipTriggeredSend: skipTriggeredSend,
            skipConfiguration: skipConfiguration
        });
        
        if (result) {
            Variable.SetValue("@assetResult", Stringify(result, null, 2));
        }
    }
} catch (ex) {
    Variable.SetValue("@assetError", ex.message);
}

</script>