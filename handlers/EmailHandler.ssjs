<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * EmailHandler - Email and template management via SFMC REST API
 *
 * Provides comprehensive email operations including creation, updates,
 * retrieval, deletion, and sending capabilities.
 *
 * Uses SFMCIntegration internally for all API calls.
 *
 * @version 2.0.0
 * @author OmegaFramework
 */
function EmailHandler(sfmcIntegrationInstance) {
    var handler = 'EmailHandler';
    var response = new ResponseWrapper();
    var sfmc = sfmcIntegrationInstance;

    /**
     * Validates SFMC integration instance
     */
    function validateIntegration() {
        if (!sfmc) {
            return response.error(
                'SFMCIntegration instance is required',
                handler,
                'validateIntegration'
            );
        }
        return null;
    }

    /**
     * Lists all email assets
     *
     * @param {object} options - Query options {pageSize, page, filter}
     * @returns {object} Response with email list
     */
    function list(options) {
        var validation = validateIntegration();
        if (validation) return validation;

        options = options || {};
        options.pageSize = options.pageSize || 50;

        return sfmc.makeRestRequest('GET', '/asset/v1/content/assets', null, {
            queryParams: options
        });
    }

    /**
     * Gets email by ID
     *
     * @param {number} emailId - Email asset ID
     * @returns {object} Response with email details
     */
    function get(emailId) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!emailId) {
            return response.validationError('emailId', 'Email ID is required', handler, 'get');
        }

        return sfmc.makeRestRequest('GET', '/asset/v1/content/assets/' + emailId);
    }

    /**
     * Creates new email asset
     *
     * @param {object} emailData - Email configuration
     * @returns {object} Response with created email
     */
    function create(emailData) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!emailData || !emailData.name) {
            return response.validationError('name', 'Email name is required', handler, 'create');
        }

        var payload = {
            name: emailData.name,
            assetType: emailData.assetType || { id: 208 }, // Email type
            category: emailData.category || { id: 0 },
            content: emailData.content || '',
            views: emailData.views || {
                html: {
                    content: emailData.htmlContent || ''
                },
                text: {
                    content: emailData.textContent || ''
                },
                subjectline: {
                    content: emailData.subject || ''
                },
                preheader: {
                    content: emailData.preheader || ''
                }
            }
        };

        return sfmc.makeRestRequest('POST', '/asset/v1/content/assets', payload);
    }

    /**
     * Updates existing email
     *
     * @param {number} emailId - Email ID to update
     * @param {object} emailData - Updated email data
     * @returns {object} Response
     */
    function update(emailId, emailData) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!emailId) {
            return response.validationError('emailId', 'Email ID is required', handler, 'update');
        }

        return sfmc.makeRestRequest('PATCH', '/asset/v1/content/assets/' + emailId, emailData);
    }

    /**
     * Deletes email
     *
     * @param {number} emailId - Email ID to delete
     * @returns {object} Response
     */
    function remove(emailId) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!emailId) {
            return response.validationError('emailId', 'Email ID is required', handler, 'remove');
        }

        return sfmc.makeRestRequest('DELETE', '/asset/v1/content/assets/' + emailId);
    }

    /**
     * Sends email via triggered send
     *
     * @param {string} triggeredSendKey - Triggered send definition key
     * @param {object} sendData - Send configuration with subscribers
     * @returns {object} Response
     */
    function send(triggeredSendKey, sendData) {
        var validation = validateIntegration();
        if (validation) return validation;

        if (!triggeredSendKey) {
            return response.validationError('triggeredSendKey', 'Triggered send key is required', handler, 'send');
        }

        var payload = {
            From: sendData.from || {},
            To: sendData.to || {},
            Subscriber: sendData.subscriber || {},
            Options: sendData.options || {}
        };

        return sfmc.sendTransactionalEmail(triggeredSendKey, payload);
    }

    /**
     * Gets all email templates
     *
     * @param {object} options - Query options
     * @returns {object} Response with templates
     */
    function getTemplates(options) {
        var validation = validateIntegration();
        if (validation) return validation;

        options = options || {};
        options.assetType = 'template-email';

        return list(options);
    }

    // Public API
    this.list = list;
    this.get = get;
    this.create = create;
    this.update = update;
    this.remove = remove;
    this.send = send;
    this.getTemplates = getTemplates;
}

</script>
