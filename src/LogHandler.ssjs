<script runat="server">

Platform.Load("core", "1.1.1");

function LogHandler(authConfig, logConfig, authInstance, connectionInstance) {
    // Initialize base handler with common functionality
    var base = new BaseHandler('LogHandler', authConfig, authInstance, connectionInstance);

    // Extract base properties for convenience
    var handler = base.handler;
    var response = base.response;
    var auth = base.auth;
    var connection = base.connection;
    var config = base.config;
    var getAuthHeaders = base.getAuthHeaders;
    var getRestUrl = base.getRestUrl;

    // LogHandler-specific configuration
    var logSettings = logConfig || {};

    var logLevels = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3
    };
    
    function getTimestamp() {
        return new Date().toISOString();
    }
    
    function formatLogEntry(level, message, data, source) {
        return {
            timestamp: getTimestamp(),
            level: level,
            message: message,
            data: data || {},
            source: source || 'unknown',
            sessionId: generateSessionId()
        };
    }
    
    function generateSessionId() {
        return 'sess_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000);
    }
    
    function shouldLog(level) {
        var currentLevel = logSettings.level || logLevels.INFO;
        return logLevels[level] <= currentLevel;
    }
    
    function logToConsole(logEntry) {
        try {
            var logMessage = '[' + logEntry.timestamp + '] ' + logEntry.level + ': ' + logEntry.message;
            if (logEntry.data && Object.keys(logEntry.data).length > 0) {
                logMessage += ' | Data: ' + Stringify(logEntry.data);
            }
            
            Write(logMessage + '<br/>');
            return true;
            
        } catch (ex) {
            return false;
        }
    }
    
    function logToDataExtension(logEntry) {
        try {
            if (!logSettings.dataExtensionKey) {
                return response.error('CONFIG_ERROR', 'Data Extension key not configured for logging', {}, handler, 'logToDataExtension');
            }
            
            var logRecord = {
                Timestamp: logEntry.timestamp,
                Level: logEntry.level,
                Message: logEntry.message,
                Source: logEntry.source,
                SessionId: logEntry.sessionId,
                Data: Stringify(logEntry.data || {})
            };
            
            var de = DataExtension.Init(logSettings.dataExtensionKey);
            var result = de.Rows.Add(logRecord);
            
            if (result > 0) {
                return response.success({method: 'DataExtension', rowsAdded: result}, handler, 'logToDataExtension');
            } else {
                return response.error('DE_LOG_FAILED', 'Failed to log to Data Extension', {deKey: logSettings.dataExtensionKey}, handler, 'logToDataExtension');
            }
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'logToDataExtension');
        }
    }
    
    function sendEmailAlert(logEntry, recipients) {
        try {
            if (!recipients || recipients.length === 0) {
                recipients = logSettings.alertRecipients || [];
            }
            
            if (recipients.length === 0) {
                return response.error('NO_RECIPIENTS', 'No alert recipients configured', {}, handler, 'sendEmailAlert');
            }
            
            var emailSubject = '[SFMC Alert] ' + logEntry.level + ': ' + logEntry.source;
            var emailBody = buildAlertEmailBody(logEntry);
            
            if (logSettings.triggeredSendKey) {
                return sendTriggeredAlert(logEntry, recipients, emailSubject, emailBody);
            } else {
                return sendSimpleAlert(recipients, emailSubject, emailBody);
            }
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'sendEmailAlert');
        }
    }
    
    function buildAlertEmailBody(logEntry) {
        var body = '<html><body>';
        body += '<h2>Salesforce Marketing Cloud Alert</h2>';
        body += '<p><strong>Level:</strong> ' + logEntry.level + '</p>';
        body += '<p><strong>Source:</strong> ' + logEntry.source + '</p>';
        body += '<p><strong>Timestamp:</strong> ' + logEntry.timestamp + '</p>';
        body += '<p><strong>Session ID:</strong> ' + logEntry.sessionId + '</p>';
        body += '<p><strong>Message:</strong> ' + logEntry.message + '</p>';
        
        if (logEntry.data && Object.keys(logEntry.data).length > 0) {
            body += '<h3>Additional Data:</h3>';
            body += '<pre>' + Stringify(logEntry.data, null, 2) + '</pre>';
        }
        
        body += '<p><em>This is an automated alert from the Miniframework LogHandler.</em></p>';
        body += '</body></html>';
        
        return body;
    }
    
    function sendTriggeredAlert(logEntry, recipients, subject, body) {
        try {
            var authResult = validateAuthConfig();
            if (!authResult || !authResult.success) {
                return response.authError('Authentication required for triggered send alerts', handler, 'sendTriggeredAlert');
            }
            
            var emailHandler = new EmailHandler(config);
            
            var sendData = {
                triggeredSendId: logSettings.triggeredSendKey,
                recipients: recipients.map(function(email) {
                    return {
                        emailAddress: email,
                        attributes: {
                            AlertLevel: logEntry.level,
                            AlertMessage: logEntry.message,
                            AlertSource: logEntry.source,
                            AlertTimestamp: logEntry.timestamp,
                            AlertData: Stringify(logEntry.data || {})
                        }
                    };
                })
            };
            
            return emailHandler.send(sendData);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'sendTriggeredAlert');
        }
    }
    
    function sendSimpleAlert(recipients, subject, body) {
        try {
            var emailResults = [];
            
            for (var i = 0; i < recipients.length; i++) {
                try {
                    var email = {
                        to: recipients[i],
                        subject: subject,
                        htmlBody: body
                    };
                    
                    emailResults.push({
                        recipient: recipients[i],
                        success: true,
                        method: 'simple'
                    });
                    
                } catch (emailEx) {
                    emailResults.push({
                        recipient: recipients[i],
                        success: false,
                        error: emailEx.message,
                        method: 'simple'
                    });
                }
            }
            
            return response.success(emailResults, handler, 'sendSimpleAlert');
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'sendSimpleAlert');
        }
    }
    
    function log(level, message, data, source) {
        try {
            if (!shouldLog(level)) {
                return response.success({skipped: true, reason: 'Log level filtered'}, handler, 'log');
            }
            
            var logEntry = formatLogEntry(level, message, data, source);
            var results = {
                console: false,
                dataExtension: false,
                email: false,
                logEntry: logEntry
            };
            
            if (logSettings.enableConsole !== false) {
                results.console = logToConsole(logEntry);
            }
            
            if (logSettings.enableDataExtension && logSettings.dataExtensionKey) {
                var deResult = logToDataExtension(logEntry);
                results.dataExtension = deResult.success || false;
                results.dataExtensionError = deResult.success ? null : deResult.error;
            }
            
            if (level === 'ERROR' && logSettings.enableEmailAlerts) {
                var emailResult = sendEmailAlert(logEntry);
                results.email = emailResult.success || false;
                results.emailError = emailResult.success ? null : emailResult.error;
            }
            
            return response.success(results, handler, 'log');
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'log');
        }
    }
    
    function error(message, data, source) {
        return log('ERROR', message, data, source);
    }
    
    function warn(message, data, source) {
        return log('WARN', message, data, source);
    }
    
    function info(message, data, source) {
        return log('INFO', message, data, source);
    }
    
    function debug(message, data, source) {
        return log('DEBUG', message, data, source);
    }
    
    function sendAlert(message, level, recipients, data) {
        try {
            var alertLevel = level || 'INFO';
            var logEntry = formatLogEntry(alertLevel, message, data, 'MANUAL_ALERT');
            
            return sendEmailAlert(logEntry, recipients);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'sendAlert');
        }
    }
    
    function createLogDataExtension() {
        try {
            if (!config.clientId || !config.clientSecret || !config.authBaseUrl) {
                return response.authError('Authentication configuration required to create logging Data Extension', handler, 'createLogDataExtension');
            }
            
            var deHandler = new DataExtensionHandler(config);
            
            var logDEStructure = {
                name: 'OmegaFramework_Logs',
                externalKey: 'omegaframework_logs',
                description: 'Log storage for OmegaFramework operations',
                fields: [
                    {
                        name: 'LogId',
                        fieldType: 'Number',
                        isPrimaryKey: true,
                        isRequired: true
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
                    }
                ]
            };
            
            return deHandler.createDE(logDEStructure);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'createLogDataExtension');
        }
    }
    
    function getLogSettings() {
        return response.success({
            authConfigured: !!(config.clientId && config.clientSecret && config.authBaseUrl),
            logLevel: logSettings.level || logLevels.INFO,
            enableConsole: logSettings.enableConsole !== false,
            enableDataExtension: logSettings.enableDataExtension || false,
            enableEmailAlerts: logSettings.enableEmailAlerts || false,
            dataExtensionKey: logSettings.dataExtensionKey || null,
            triggeredSendKey: logSettings.triggeredSendKey || null,
            alertRecipients: logSettings.alertRecipients || []
        }, handler, 'getLogSettings');
    }
    
    // Public API - Using this pattern for SFMC Content Block compatibility
    this.log = log;
    this.error = error;
    this.warn = warn;
    this.info = info;
    this.debug = debug;
    this.sendAlert = sendAlert;
    this.createLogDataExtension = createLogDataExtension;
    this.getLogSettings = getLogSettings;
}

</script>