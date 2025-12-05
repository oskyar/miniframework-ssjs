<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * VeevaCRMIntegration - Veeva CRM API Integration
 *
 * Veeva CRM is built on Salesforce, so this integration uses
 * Salesforce REST API patterns with Veeva-specific objects.
 *
 * @version 3.0.0 (transitional - supports both v2 and v3 patterns)
 * @author OmegaFramework
 */
function VeevaCRMIntegration(veevaConfig, connectionInstance) {
    var handler = 'VeevaCRMIntegration';
    var response = connectionInstance ? OmegaFramework.require('ResponseWrapper', {}) : OmegaFramework.require('ResponseWrapper', {});
    var config = veevaConfig || {};

    // Set API version
    var apiVersion = config.apiVersion || 'v60.0';
    config.baseUrl = config.baseUrl || 'https://login.salesforce.com';

    // Initialize base integration
    var connection = connectionInstance || OmegaFramework.require('ConnectionHandler', {});
    var base = OmegaFramework.create('BaseIntegration', {
        integrationName: handler,
        integrationConfig: config,
        authStrategy: null
    });

    // Setup OAuth2 authentication (password grant for Veeva)
    if (config.auth) {
        var oauth2Config = {
            tokenUrl: config.auth.tokenUrl || 'https://login.salesforce.com/services/oauth2/token',
            clientId: config.auth.clientId,
            clientSecret: config.auth.clientSecret,
            grantType: config.auth.grantType || 'password',
            username: config.auth.username,
            password: config.auth.password, // Password + Security Token
            cacheKey: config.auth.username
        };

        var authStrategy = OmegaFramework.create('OAuth2AuthStrategy', oauth2Config);
        base.setAuthStrategy(authStrategy);
    }

    /**
     * Executes SOQL query
     *
     * @param {string} soql - SOQL query string
     * @returns {object} Response with query results
     */
    function query(soql) {
        if (!soql) {
            return response.validationError('soql', 'SOQL query is required', handler, 'query');
        }

        return base.get('/services/data/' + apiVersion + '/query', {
            queryParams: { q: soql }
        });
    }

    /**
     * Gets account by ID
     *
     * @param {string} accountId - Account Salesforce ID
     * @returns {object} Response with account details
     */
    function getAccount(accountId) {
        if (!accountId) {
            return response.validationError('accountId', 'Account ID is required', handler, 'getAccount');
        }

        return base.get('/services/data/' + apiVersion + '/sobjects/Account/' + accountId);
    }

    /**
     * Creates new account
     *
     * @param {object} accountData - Account data
     * @returns {object} Response with created account ID
     */
    function createAccount(accountData) {
        if (!accountData || !accountData.Name) {
            return response.validationError('Name', 'Account name is required', handler, 'createAccount');
        }

        return base.post('/services/data/' + apiVersion + '/sobjects/Account', accountData);
    }

    /**
     * Updates account
     *
     * @param {string} accountId - Account ID
     * @param {object} accountData - Updated account data
     * @returns {object} Response
     */
    function updateAccount(accountId, accountData) {
        if (!accountId) {
            return response.validationError('accountId', 'Account ID is required', handler, 'updateAccount');
        }

        return base.patch('/services/data/' + apiVersion + '/sobjects/Account/' + accountId, accountData);
    }

    /**
     * Gets contact by ID
     *
     * @param {string} contactId - Contact Salesforce ID
     * @returns {object} Response with contact details
     */
    function getContact(contactId) {
        if (!contactId) {
            return response.validationError('contactId', 'Contact ID is required', handler, 'getContact');
        }

        return base.get('/services/data/' + apiVersion + '/sobjects/Contact/' + contactId);
    }

    /**
     * Creates new contact
     *
     * @param {object} contactData - Contact data
     * @returns {object} Response with created contact ID
     */
    function createContact(contactData) {
        if (!contactData || !contactData.LastName) {
            return response.validationError('LastName', 'Contact last name is required', handler, 'createContact');
        }

        return base.post('/services/data/' + apiVersion + '/sobjects/Contact', contactData);
    }

    /**
     * Creates call report (Medical Inquiry)
     *
     * @param {object} callData - Call data
     * @returns {object} Response with created call ID
     */
    function createCall(callData) {
        if (!callData || !callData.Account_vod__c) {
            return response.validationError('Account_vod__c', 'Account is required for call', handler, 'createCall');
        }

        if (!callData.Call_Date_vod__c) {
            return response.validationError('Call_Date_vod__c', 'Call date is required', handler, 'createCall');
        }

        return base.post('/services/data/' + apiVersion + '/sobjects/Call2_vod__c', callData);
    }

    /**
     * Gets call report by ID
     *
     * @param {string} callId - Call Salesforce ID
     * @returns {object} Response with call details
     */
    function getCall(callId) {
        if (!callId) {
            return response.validationError('callId', 'Call ID is required', handler, 'getCall');
        }

        return base.get('/services/data/' + apiVersion + '/sobjects/Call2_vod__c/' + callId);
    }

    /**
     * Creates sample order
     *
     * @param {object} orderData - Sample order data
     * @returns {object} Response with created order ID
     */
    function createSampleOrder(orderData) {
        if (!orderData || !orderData.Account_vod__c) {
            return response.validationError('Account_vod__c', 'Account is required', handler, 'createSampleOrder');
        }

        return base.post('/services/data/' + apiVersion + '/sobjects/Sample_Order_vod__c', orderData);
    }

    /**
     * Gets custom object record
     *
     * @param {string} objectName - Object API name
     * @param {string} recordId - Record ID
     * @returns {object} Response with record details
     */
    function getCustomObject(objectName, recordId) {
        if (!objectName) {
            return response.validationError('objectName', 'Object name is required', handler, 'getCustomObject');
        }

        if (!recordId) {
            return response.validationError('recordId', 'Record ID is required', handler, 'getCustomObject');
        }

        return base.get('/services/data/' + apiVersion + '/sobjects/' + objectName + '/' + recordId);
    }

    /**
     * Creates custom object record
     *
     * @param {string} objectName - Object API name
     * @param {object} recordData - Record data
     * @returns {object} Response with created record ID
     */
    function createCustomObject(objectName, recordData) {
        if (!objectName) {
            return response.validationError('objectName', 'Object name is required', handler, 'createCustomObject');
        }

        if (!recordData) {
            return response.validationError('recordData', 'Record data is required', handler, 'createCustomObject');
        }

        return base.post('/services/data/' + apiVersion + '/sobjects/' + objectName, recordData);
    }

    /**
     * Updates custom object record
     *
     * @param {string} objectName - Object API name
     * @param {string} recordId - Record ID
     * @param {object} recordData - Updated record data
     * @returns {object} Response
     */
    function updateCustomObject(objectName, recordId, recordData) {
        if (!objectName) {
            return response.validationError('objectName', 'Object name is required', handler, 'updateCustomObject');
        }

        if (!recordId) {
            return response.validationError('recordId', 'Record ID is required', handler, 'updateCustomObject');
        }

        return base.patch('/services/data/' + apiVersion + '/sobjects/' + objectName + '/' + recordId, recordData);
    }

    /**
     * Deletes record
     *
     * @param {string} objectName - Object API name
     * @param {string} recordId - Record ID
     * @returns {object} Response
     */
    function deleteRecord(objectName, recordId) {
        if (!objectName) {
            return response.validationError('objectName', 'Object name is required', handler, 'deleteRecord');
        }

        if (!recordId) {
            return response.validationError('recordId', 'Record ID is required', handler, 'deleteRecord');
        }

        return base.remove('/services/data/' + apiVersion + '/sobjects/' + objectName + '/' + recordId);
    }

    // Public API
    this.query = query;
    this.getAccount = getAccount;
    this.createAccount = createAccount;
    this.updateAccount = updateAccount;
    this.getContact = getContact;
    this.createContact = createContact;
    this.createCall = createCall;
    this.getCall = getCall;
    this.createSampleOrder = createSampleOrder;
    this.getCustomObject = getCustomObject;
    this.createCustomObject = createCustomObject;
    this.updateCustomObject = updateCustomObject;
    this.deleteRecord = deleteRecord;

    // Base HTTP methods
    this.get = base.get;
    this.post = base.post;
    this.put = base.put;
    this.patch = base.patch;
    this.remove = base.remove;
}

// ============================================================================
// OMEGAFRAMEWORK MODULE REGISTRATION
// ============================================================================
if (typeof OmegaFramework !== 'undefined' && typeof OmegaFramework.register === 'function') {
    OmegaFramework.register('VeevaCRMIntegration', {
        dependencies: ['ResponseWrapper', 'ConnectionHandler', 'OAuth2AuthStrategy', 'BaseIntegration'],
        blockKey: 'OMG_FW_VeevaCRMIntegration',
        factory: function(responseWrapper, connectionHandler, oauth2Factory, baseIntegrationFactory, config) {
            // Note: VeevaCRMIntegration currently uses traditional instantiation pattern
            // This registration enables future refactoring to full dependency injection
            return new VeevaCRMIntegration(config);
        }
    });
}

</script>
