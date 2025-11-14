<script runat="server">

Platform.Load("core", "1.1.1");

function EmailHandler(authConfig, authInstance, connectionInstance) {
    // Initialize base handler with common functionality
    var base = new BaseHandler('EmailHandler', authConfig, authInstance, connectionInstance);

    // Extract base properties for convenience
    var handler = base.handler;
    var response = base.response;
    var auth = base.auth;
    var connection = base.connection;
    var config = base.config;
    var getAuthHeaders = base.getAuthHeaders;
    var getRestUrl = base.getRestUrl;
    
    function create(emailData) {
        try {
            if (!emailData) {
                return response.validationError('emailData', 'Email data is required', handler, 'create');
            }
            
            if (!emailData.name) {
                return response.validationError('name', 'Email name is required', handler, 'create');
            }
            
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/asset/v1/content/assets';
            
            var assetPayload = {
                name: emailData.name,
                assetType: {
                    name: emailData.assetType || 'htmlemail',
                    id: emailData.assetTypeId || 208
                },
                content: emailData.content || '',
                meta: emailData.meta || {},
                category: emailData.category || {}
            };
            
            if (emailData.subject) {
                assetPayload.meta.subject = emailData.subject;
            }
            
            if (emailData.preheader) {
                assetPayload.meta.preheader = emailData.preheader;
            }
            
            return connection.post(url, assetPayload, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'create');
        }
    }
    
    function update(emailId, emailData) {
        try {
            if (!emailId) {
                return response.validationError('emailId', 'Email ID is required', handler, 'update');
            }
            
            if (!emailData) {
                return response.validationError('emailData', 'Email data is required', handler, 'update');
            }
            
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/asset/v1/content/assets/' + emailId;
            
            return connection.put(url, emailData, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'update');
        }
    }
    
    function get(emailId) {
        try {
            if (!emailId) {
                return response.validationError('emailId', 'Email ID is required', handler, 'get');
            }
            
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/asset/v1/content/assets/' + emailId;
            
            return connection.get(url, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'get');
        }
    }
    
    function list(options) {
        try {
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }

            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }

            var url = restUrlResult + '/asset/v1/content/assets' + base.buildQueryString(options);

            return connection.get(url, authResult.data);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'list');
        }
    }
    
    function del(emailId) {
        try {
            if (!emailId) {
                return response.validationError('emailId', 'Email ID is required', handler, 'delete');
            }
            
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/asset/v1/content/assets/' + emailId;
            
            return connection.delete(url, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'delete');
        }
    }
    
    function send(sendData) {
        try {
            if (!sendData) {
                return response.validationError('sendData', 'Send data is required', handler, 'send');
            }
            
            if (!sendData.triggeredSendId && !sendData.emailId) {
                return response.validationError('identifier', 'Either triggeredSendId or emailId is required', handler, 'send');
            }
            
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/messaging/v1/email/messages';
            
            var messagePayload = {
                recipients: sendData.recipients || [],
                options: sendData.options || {}
            };
            
            if (sendData.triggeredSendId) {
                messagePayload.definitionKey = sendData.triggeredSendId;
            }
            
            if (sendData.emailId) {
                messagePayload.contentKey = sendData.emailId;
            }
            
            return connection.post(url, messagePayload, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'send');
        }
    }
    
    function getTemplates(options) {
        try {
            var authResult = getAuthHeaders();
            if (!authResult.success) {
                return authResult;
            }
            
            var restUrlResult = getRestUrl();
            if (!restUrlResult.success) {
                return restUrlResult;
            }
            
            var url = restUrlResult + '/asset/v1/content/assets';
            var filter = "assetType.name eq 'template_email'";
            
            if (options && options.additionalFilter) {
                filter += ' and ' + options.additionalFilter;
            }
            
            var queryParams = ['$filter=' + encodeURIComponent(filter)];
            
            if (options) {
                if (options.pageSize) {
                    queryParams.push('$pageSize=' + options.pageSize);
                }
                if (options.page) {
                    queryParams.push('$page=' + options.page);
                }
            }
            
            url += '?' + queryParams.join('&');
            
            return connection.get(url, authResult.data);
            
        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getTemplates');
        }
    }
    
    // Public API - Using this pattern for SFMC Content Block compatibility
    this.create = create;
    this.update = update;
    this.get = get;
    this.list = list;
    this.delete = del;
    this.send = send;
    this.getTemplates = getTemplates;
}

</script>