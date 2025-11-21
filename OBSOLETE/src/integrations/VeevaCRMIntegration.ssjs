<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * VeevaCRMIntegration - Veeva CRM API integration
 *
 * Provides methods for interacting with Veeva CRM API:
 * - Account management
 * - Contact management
 * - Call/Activity tracking
 * - Custom object operations
 *
 * @version 1.0.0
 * @see https://developer.veeva.com/api/crm-api/
 */

function VeevaCRMIntegration(crmConfig, connectionInstance) {
    // Initialize base integration
    var base = new BaseIntegration('VeevaCRMIntegration', crmConfig, null, connectionInstance);

    // Extract base properties
    var handler = base.handler;
    var response = base.response;
    var connection = base.connection;
    var config = base.config;

    // Setup authentication for Veeva CRM (typically OAuth2 or Session-based)
    if (config.auth && config.auth.tokenUrl) {
        var authStrategy = new OAuth2AuthStrategy({
            tokenUrl: config.auth.tokenUrl,
            clientId: config.auth.clientId,
            clientSecret: config.auth.clientSecret,
            scope: config.auth.scope || 'full',
            grantType: config.auth.grantType || 'password',
            additionalParams: {
                username: config.auth.username,
                password: config.auth.password
            }
        }, connection);

        base.setAuthStrategy(authStrategy);
    }

    /**
     * Queries Veeva CRM using SOQL
     * @param {String} soqlQuery - SOQL query string
     * @returns {Object} Response with query results
     */
    function query(soqlQuery) {
        try {
            if (!soqlQuery) {
                return response.validationError('soqlQuery', 'SOQL query is required', handler, 'query');
            }

            var endpoint = '/services/data/' + (config.apiVersion || 'v60.0') + '/query';
            var queryParams = '?q=' + encodeURIComponent(soqlQuery);

            return base.get(endpoint + queryParams);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'query');
        }
    }

    /**
     * Gets account by ID
     * @param {String} accountId - Account ID
     * @returns {Object} Response with account data
     */
    function getAccount(accountId) {
        try {
            if (!accountId) {
                return response.validationError('accountId', 'Account ID is required', handler, 'getAccount');
            }

            var endpoint = '/services/data/' + (config.apiVersion || 'v60.0') + '/sobjects/Account/' + accountId;
            return base.get(endpoint);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getAccount');
        }
    }

    /**
     * Creates account
     * @param {Object} accountData - Account data
     * @returns {Object} Response with created account
     */
    function createAccount(accountData) {
        try {
            if (!accountData) {
                return response.validationError('accountData', 'Account data is required', handler, 'createAccount');
            }

            var endpoint = '/services/data/' + (config.apiVersion || 'v60.0') + '/sobjects/Account';
            return base.post(endpoint, accountData);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'createAccount');
        }
    }

    /**
     * Updates account
     * @param {String} accountId - Account ID
     * @param {Object} accountData - Updated account data
     * @returns {Object} Response
     */
    function updateAccount(accountId, accountData) {
        try {
            if (!accountId) {
                return response.validationError('accountId', 'Account ID is required', handler, 'updateAccount');
            }

            if (!accountData) {
                return response.validationError('accountData', 'Account data is required', handler, 'updateAccount');
            }

            var endpoint = '/services/data/' + (config.apiVersion || 'v60.0') + '/sobjects/Account/' + accountId;
            return base.put(endpoint, accountData);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'updateAccount');
        }
    }

    /**
     * Gets contact by ID
     * @param {String} contactId - Contact ID
     * @returns {Object} Response with contact data
     */
    function getContact(contactId) {
        try {
            if (!contactId) {
                return response.validationError('contactId', 'Contact ID is required', handler, 'getContact');
            }

            var endpoint = '/services/data/' + (config.apiVersion || 'v60.0') + '/sobjects/Contact/' + contactId;
            return base.get(endpoint);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getContact');
        }
    }

    /**
     * Creates contact
     * @param {Object} contactData - Contact data
     * @returns {Object} Response with created contact
     */
    function createContact(contactData) {
        try {
            if (!contactData) {
                return response.validationError('contactData', 'Contact data is required', handler, 'createContact');
            }

            var endpoint = '/services/data/' + (config.apiVersion || 'v60.0') + '/sobjects/Contact';
            return base.post(endpoint, contactData);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'createContact');
        }
    }

    /**
     * Creates call/activity record
     * @param {Object} callData - Call data
     * @returns {Object} Response with created call
     */
    function createCall(callData) {
        try {
            if (!callData) {
                return response.validationError('callData', 'Call data is required', handler, 'createCall');
            }

            var endpoint = '/services/data/' + (config.apiVersion || 'v60.0') + '/sobjects/Call2_vod__c';
            return base.post(endpoint, callData);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'createCall');
        }
    }

    /**
     * Gets custom object record
     * @param {String} objectName - Custom object API name
     * @param {String} recordId - Record ID
     * @returns {Object} Response with record data
     */
    function getCustomObject(objectName, recordId) {
        try {
            if (!objectName || !recordId) {
                return response.validationError('params', 'Object name and record ID are required', handler, 'getCustomObject');
            }

            var endpoint = '/services/data/' + (config.apiVersion || 'v60.0') + '/sobjects/' + objectName + '/' + recordId;
            return base.get(endpoint);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'getCustomObject');
        }
    }

    /**
     * Creates custom object record
     * @param {String} objectName - Custom object API name
     * @param {Object} recordData - Record data
     * @returns {Object} Response with created record
     */
    function createCustomObject(objectName, recordData) {
        try {
            if (!objectName) {
                return response.validationError('objectName', 'Object name is required', handler, 'createCustomObject');
            }

            if (!recordData) {
                return response.validationError('recordData', 'Record data is required', handler, 'createCustomObject');
            }

            var endpoint = '/services/data/' + (config.apiVersion || 'v60.0') + '/sobjects/' + objectName;
            return base.post(endpoint, recordData);

        } catch (ex) {
            return response.error('EXCEPTION', ex.message || ex.toString(), {exception: ex}, handler, 'createCustomObject');
        }
    }

    // Public API - Veeva CRM specific methods
    this.query = query;
    this.getAccount = getAccount;
    this.createAccount = createAccount;
    this.updateAccount = updateAccount;
    this.getContact = getContact;
    this.createContact = createContact;
    this.createCall = createCall;
    this.getCustomObject = getCustomObject;
    this.createCustomObject = createCustomObject;

    // Expose base methods
    this.get = base.get;
    this.post = base.post;
    this.put = base.put;
    this.remove = base.remove;
}

</script>
