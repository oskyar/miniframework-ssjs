<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * VeevaVaultSyncTask - Veeva Vault to SFMC Email Synchronization
 *
 * Migrated from IntegrationVeevaVaultHPAmer.ssjs to use OmegaFramework.
 * Synchronizes approved/staged/expired documents from Veeva Vault
 * to SFMC Content Builder as HTML emails.
 *
 * Flow:
 * 1. Authenticate with SFMC (via SFMCIntegration)
 * 2. Authenticate with Veeva Vault (via VeevaVaultIntegration)
 * 3. Query Vault for documents matching criteria
 * 4. For each document:
 *    - Get HTML rendition from Vault
 *    - Extract subject and preheader
 *    - Create or update email in SFMC Content Builder
 *    - Log to Data Extension
 *    - Create proof records for approvers (if Staged)
 *
 * @version 1.0.0
 * @author OmegaFramework
 * @requires OmegaFramework, VeevaVaultIntegration, SFMCIntegration, DataExtensionHandler
 */

// ============================================================================
// LOAD OMEGAFRAMEWORK AND DEPENDENCIES
// ============================================================================
Platform.Function.ContentBlockByName("OMG_FW_OmegaFramework");
Platform.Function.ContentBlockByName("OMG_FW_ResponseWrapper");
Platform.Function.ContentBlockByName("OMG_FW_ConnectionHandler");
Platform.Function.ContentBlockByName("OMG_FW_BaseIntegration");
Platform.Function.ContentBlockByName("OMG_FW_DataExtensionTokenCache");
Platform.Function.ContentBlockByName("OMG_FW_SFMCIntegration");
Platform.Function.ContentBlockByName("OMG_FW_VeevaVaultIntegration");
Platform.Function.ContentBlockByName("OMG_FW_WSProxyWrapper");
Platform.Function.ContentBlockByName("OMG_FW_DataExtensionHandler");
</script>

<h2>Veeva Vault to SFMC Sync Task (OmegaFramework)</h2>
<p>Version 1.0.0 - Migrated integration using OmegaFramework patterns</p>

<form method="POST" style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h3>SFMC Credentials</h3>
    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div style="margin-bottom: 15px;">
            <label><strong>Client ID:</strong></label><br>
            <input type="text" name="sfmcClientId" value="%%=RequestParameter('sfmcClientId')=%%"
                   placeholder="SFMC Client ID" style="width: 300px; padding: 8px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label><strong>Client Secret:</strong></label><br>
            <input type="password" name="sfmcClientSecret" value="%%=RequestParameter('sfmcClientSecret')=%%"
                   placeholder="SFMC Client Secret" style="width: 300px; padding: 8px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label><strong>Account ID:</strong></label><br>
            <input type="text" name="sfmcAccountId" value="%%=RequestParameter('sfmcAccountId')=%%"
                   placeholder="MID" style="width: 150px; padding: 8px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label><strong>Subdomain:</strong></label><br>
            <input type="text" name="sfmcSubdomain" value="%%=RequestParameter('sfmcSubdomain')=%%"
                   placeholder="mcXXXXXXXX" style="width: 200px; padding: 8px;">
        </div>
    </div>

    <h3>Veeva Vault Credentials</h3>
    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div style="margin-bottom: 15px;">
            <label><strong>Vault DNS:</strong></label><br>
            <input type="text" name="vaultDNS" value="%%=RequestParameter('vaultDNS')=%%"
                   placeholder="yourcompany.veevavault.com" style="width: 300px; padding: 8px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label><strong>API Version:</strong></label><br>
            <input type="text" name="vaultVersion" value="%%=RequestParameter('vaultVersion')=%%"
                   placeholder="v24.1" style="width: 100px; padding: 8px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label><strong>Username:</strong></label><br>
            <input type="text" name="vaultUsername" value="%%=RequestParameter('vaultUsername')=%%"
                   placeholder="user@company.com" style="width: 300px; padding: 8px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label><strong>Password:</strong></label><br>
            <input type="password" name="vaultPassword" value="%%=RequestParameter('vaultPassword')=%%"
                   placeholder="Password" style="width: 300px; padding: 8px;">
        </div>
    </div>

    <h3>Sync Configuration</h3>
    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div style="margin-bottom: 15px;">
            <label><strong>Days to Look Back:</strong></label><br>
            <input type="number" name="daysBack" value="%%=RequestParameter('daysBack')=%%"
                   placeholder="5" style="width: 100px; padding: 8px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label><strong>Country ID:</strong></label><br>
            <input type="text" name="countryId" value="%%=RequestParameter('countryId')=%%"
                   placeholder="1360098690065" style="width: 200px; padding: 8px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label><strong>Channel ID:</strong></label><br>
            <input type="text" name="channelId" value="%%=RequestParameter('channelId')=%%"
                   placeholder="V41000000001006" style="width: 200px; padding: 8px;">
        </div>
    </div>

    <h3>SFMC Folder Configuration</h3>
    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div style="margin-bottom: 15px;">
            <label><strong>Staged Folder ID:</strong></label><br>
            <input type="text" name="stagedFolderId" value="%%=RequestParameter('stagedFolderId')=%%"
                   placeholder="51937" style="width: 150px; padding: 8px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label><strong>Approved Folder ID:</strong></label><br>
            <input type="text" name="approvedFolderId" value="%%=RequestParameter('approvedFolderId')=%%"
                   placeholder="51934" style="width: 150px; padding: 8px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label><strong>Expired Folder ID:</strong></label><br>
            <input type="text" name="expiredFolderId" value="%%=RequestParameter('expiredFolderId')=%%"
                   placeholder="51935" style="width: 150px; padding: 8px;">
        </div>
    </div>

    <button type="submit" style="background-color: #0176d3; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">
        Run Sync
    </button>
</form>

<script runat="server">
// ============================================================================
// GET FORM PARAMETERS
// ============================================================================
var sfmcClientId = Request.GetFormField('sfmcClientId') || Request.GetQueryStringParameter('sfmcClientId');
var sfmcClientSecret = Request.GetFormField('sfmcClientSecret') || Request.GetQueryStringParameter('sfmcClientSecret');
var sfmcAccountId = Request.GetFormField('sfmcAccountId') || Request.GetQueryStringParameter('sfmcAccountId');
var sfmcSubdomain = Request.GetFormField('sfmcSubdomain') || Request.GetQueryStringParameter('sfmcSubdomain');

var vaultDNS = Request.GetFormField('vaultDNS') || Request.GetQueryStringParameter('vaultDNS');
var vaultVersion = Request.GetFormField('vaultVersion') || Request.GetQueryStringParameter('vaultVersion') || 'v24.1';
var vaultUsername = Request.GetFormField('vaultUsername') || Request.GetQueryStringParameter('vaultUsername');
var vaultPassword = Request.GetFormField('vaultPassword') || Request.GetQueryStringParameter('vaultPassword');

var daysBack = parseInt(Request.GetFormField('daysBack') || Request.GetQueryStringParameter('daysBack') || '5');
var countryId = Request.GetFormField('countryId') || Request.GetQueryStringParameter('countryId') || '1360098690065';
var channelId = Request.GetFormField('channelId') || Request.GetQueryStringParameter('channelId') || 'V41000000001006';

var stagedFolderId = parseInt(Request.GetFormField('stagedFolderId') || Request.GetQueryStringParameter('stagedFolderId') || '51937');
var approvedFolderId = parseInt(Request.GetFormField('approvedFolderId') || Request.GetQueryStringParameter('approvedFolderId') || '51934');
var expiredFolderId = parseInt(Request.GetFormField('expiredFolderId') || Request.GetQueryStringParameter('expiredFolderId') || '51935');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets ISO date string for N days ago
 * @param {number} days - Number of days to subtract
 * @returns {string} ISO formatted date string
 */
function getISODateMinusDays(days) {
    var now = new Date();
    now.setDate(now.getDate() - days);

    var year = now.getUTCFullYear();
    var month = ('0' + (now.getUTCMonth() + 1)).slice(-2);
    var day = ('0' + now.getUTCDate()).slice(-2);
    var hours = ('0' + now.getUTCHours()).slice(-2);
    var mins = ('0' + now.getUTCMinutes()).slice(-2);
    var seconds = ('0' + now.getUTCSeconds()).slice(-2);

    return year + '-' + month + '-' + day + 'T' + hours + ':' + mins + ':' + seconds + '.000Z';
}

/**
 * Trims whitespace from string (ES3 compatible)
 * @param {string} str - String to trim
 * @returns {string} Trimmed string
 */
function trim(str) {
    if (!str) return "";
    var result = String(str);
    while (result.length > 0 && (result.charAt(0) === ' ' || result.charAt(0) === '\t' || result.charAt(0) === '\n' || result.charAt(0) === '\r')) {
        result = result.substring(1);
    }
    while (result.length > 0 && (result.charAt(result.length - 1) === ' ' || result.charAt(result.length - 1) === '\t' || result.charAt(result.length - 1) === '\n' || result.charAt(result.length - 1) === '\r')) {
        result = result.substring(0, result.length - 1);
    }
    return result;
}

/**
 * Cleans text by removing HTML tags and trimming
 * @param {string} str - String to clean
 * @returns {string} Cleaned string
 */
function cleanText(str) {
    if (!str) return "";
    var result = String(str);
    result = result.replace(/<[^>]*>/g, '');
    return trim(result);
}

/**
 * Extracts subject and preheader from HTML content
 * @param {string} htmlContent - HTML content
 * @returns {object} Object with subject and preheader
 */
function extractSubjectAndPreheader(htmlContent) {
    var result = {
        subject: null,
        preheader: null
    };

    if (!htmlContent || typeof htmlContent !== "string" || htmlContent.length <= 0) {
        return result;
    }

    try {
        // Extract subject from <span class="Subjectline">
        var subjectStart = htmlContent.indexOf('<span class="Subjectline"');
        if (subjectStart > -1) {
            var subjectTagEnd = htmlContent.indexOf('>', subjectStart);
            if (subjectTagEnd > -1) {
                var subjectEnd = htmlContent.indexOf('</span>', subjectTagEnd);
                if (subjectEnd > -1) {
                    var subjectRaw = htmlContent.substring(subjectTagEnd + 1, subjectEnd);
                    var subjectClean = cleanText(subjectRaw);
                    if (subjectClean && subjectClean.length > 0 && subjectClean.length < 300) {
                        result.subject = subjectClean;
                    }
                }
            }
        }

        // Extract preheader from <span class="preheader">
        var preheaderStart = htmlContent.indexOf('<span class="preheader"');
        if (preheaderStart > -1) {
            var preheaderTagEnd = htmlContent.indexOf('>', preheaderStart);
            if (preheaderTagEnd > -1) {
                var preheaderEnd = htmlContent.indexOf('</span>', preheaderTagEnd);
                if (preheaderEnd > -1) {
                    var preheaderRaw = htmlContent.substring(preheaderTagEnd + 1, preheaderEnd);
                    var preheaderClean = cleanText(preheaderRaw);
                    if (preheaderClean && preheaderClean.length > 0 && preheaderClean.length < 500) {
                        result.preheader = preheaderClean;
                    }
                }
            }
        }
    } catch (error) {
        // Silently fail, return defaults
    }

    return result;
}

/**
 * Maps Vault status to SFMC folder ID
 * @param {string} status - Vault document status
 * @returns {number} SFMC folder ID
 */
function getStatusToFolderId(status) {
    switch (status) {
        case "Staged": return stagedFolderId;
        case "Expired": return expiredFolderId;
        case "Approved": return approvedFolderId;
        default: return stagedFolderId;
    }
}

/**
 * Maps folder ID to sync status
 * @param {number} folderId - SFMC folder ID
 * @returns {string} Sync status
 */
function getFolderIdToStatus(folderId) {
    if (folderId === stagedFolderId) return "Staged";
    if (folderId === expiredFolderId) return "Expired";
    if (folderId === approvedFolderId) return "Validated";
    return "Staged";
}

/**
 * Logs a message with icon
 * @param {string} icon - Icon to display
 * @param {string} message - Message to log
 */
function log(icon, message) {
    Write('<p>' + icon + ' ' + message + '</p>');
}

// ============================================================================
// MAIN SYNC TASK CLASS
// ============================================================================

/**
 * VeevaVaultSyncTask - Main synchronization task
 */
function VeevaVaultSyncTask(config) {
    var handler = 'VeevaVaultSyncTask';
    var response = OmegaFramework.require('ResponseWrapper', {});

    var sfmc = null;
    var vault = null;
    var deHandler = null;

    // Sync statistics
    var stats = {
        documentsFound: 0,
        documentsProcessed: 0,
        documentsCreated: 0,
        documentsUpdated: 0,
        documentsSkipped: 0,
        documentsFailed: 0,
        proofsCreated: 0
    };

    /**
     * Initializes SFMC connection
     * @returns {object} Response
     */
    function initSFMC() {
        try {
            sfmc = OmegaFramework.create('SFMCIntegration', {
                clientId: config.sfmc.clientId,
                clientSecret: config.sfmc.clientSecret,
                accountId: config.sfmc.accountId,
                subdomain: config.sfmc.subdomain
            });

            // Test authentication
            var tokenResult = sfmc.getToken();
            if (!tokenResult.success) {
                return response.error('SFMC authentication failed: ' + (tokenResult.error ? tokenResult.error.message : 'Unknown error'), handler, 'initSFMC');
            }

            log('', 'SFMC authenticated successfully');
            return response.success({ authenticated: true }, handler, 'initSFMC');
        } catch (ex) {
            return response.error('SFMC initialization failed: ' + (ex.message || String(ex)), handler, 'initSFMC');
        }
    }

    /**
     * Initializes Veeva Vault connection
     * @returns {object} Response
     */
    function initVault() {
        try {
            vault = OmegaFramework.create('VeevaVaultIntegration', {
                baseUrl: 'https://' + config.vault.dns,
                apiVersion: config.vault.version,
                username: config.vault.username,
                password: config.vault.password
            });

            // Test authentication
            var authResult = vault.authenticate();
            if (!authResult.success) {
                return response.error('Vault authentication failed: ' + (authResult.error ? authResult.error.message : 'Unknown error'), handler, 'initVault');
            }

            log('', 'Veeva Vault authenticated successfully');
            return response.success({ authenticated: true }, handler, 'initVault');
        } catch (ex) {
            return response.error('Vault initialization failed: ' + (ex.message || String(ex)), handler, 'initVault');
        }
    }

    /**
     * Initializes DataExtension handler
     * @returns {object} Response
     */
    function initDataExtension() {
        try {
            deHandler = OmegaFramework.create('DataExtensionHandler', {});
            log('', 'DataExtension handler initialized');
            return response.success({ initialized: true }, handler, 'initDataExtension');
        } catch (ex) {
            return response.error('DataExtension initialization failed: ' + (ex.message || String(ex)), handler, 'initDataExtension');
        }
    }

    /**
     * Queries Vault for documents matching criteria
     * @returns {object} Response with documents array
     */
    function queryVaultDocuments() {
        try {
            var recentDate = getISODateMinusDays(config.daysBack);

            var vqlQuery = "SELECT id, version_id, status__v, name__v, country__v " +
                          "FROM ALLVERSIONS documents " +
                          "WHERE type__v = 'Composite' " +
                          "AND (status__v = 'Approved' OR status__v = 'Staged' OR status__v = 'Expired') " +
                          "AND version_modified_date__v >= '" + recentDate + "' " +
                          "AND country__v = '" + config.countryId + "' " +
                          "AND intended_channel2__c = '" + config.channelId + "'";

            log('', 'Querying Vault for documents...');
            var queryResult = vault.query(vqlQuery);

            if (!queryResult.success) {
                return response.error('Vault query failed: ' + (queryResult.error ? queryResult.error.message : 'Unknown error'), handler, 'queryVaultDocuments');
            }

            var documents = queryResult.data || [];
            stats.documentsFound = documents.length;

            log('', 'Found ' + documents.length + ' documents');
            return response.success(documents, handler, 'queryVaultDocuments');
        } catch (ex) {
            return response.error('Query failed: ' + (ex.message || String(ex)), handler, 'queryVaultDocuments');
        }
    }

    /**
     * Gets HTML rendition from Vault document
     * @param {string} docId - Document ID
     * @returns {object} Response with HTML content
     */
    function getDocumentHTML(docId) {
        try {
            var renditionResult = vault.getDocumentRendition(docId, 'source_file__c');

            if (!renditionResult.success) {
                return response.error('Failed to get rendition: ' + (renditionResult.error ? renditionResult.error.message : 'Unknown error'), handler, 'getDocumentHTML');
            }

            return response.success(renditionResult.data, handler, 'getDocumentHTML');
        } catch (ex) {
            return response.error('Get HTML failed: ' + (ex.message || String(ex)), handler, 'getDocumentHTML');
        }
    }

    /**
     * Finds email in SFMC by customerKey
     * @param {string} customerKey - Email customer key
     * @returns {object} Response with email or null
     */
    function findEmail(customerKey) {
        try {
            var queryResult = sfmc.queryAssets({
                query: {
                    property: 'customerKey',
                    simpleOperator: 'equals',
                    value: customerKey
                }
            });

            if (queryResult.success && queryResult.data && queryResult.data.items && queryResult.data.items.length > 0) {
                return response.success(queryResult.data.items[0], handler, 'findEmail');
            }

            return response.success(null, handler, 'findEmail');
        } catch (ex) {
            return response.error('Find email failed: ' + (ex.message || String(ex)), handler, 'findEmail');
        }
    }

    /**
     * Creates email in SFMC
     * @param {object} emailData - Email data
     * @returns {object} Response with created email
     */
    function createEmail(emailData) {
        try {
            var payload = {
                name: emailData.name,
                customerKey: emailData.customerKey,
                assetType: { id: 208 }, // HTML Email
                category: { id: emailData.folderId },
                views: {
                    html: { content: emailData.html || '<html><body>Default content</body></html>' },
                    subjectline: { content: emailData.subject || 'Email Communication' },
                    preheader: { content: emailData.preheader || '' }
                }
            };

            var createResult = sfmc.createAsset(payload);

            if (createResult.success) {
                stats.documentsCreated++;
                log('', 'Email created: ' + emailData.name);
            }

            return createResult;
        } catch (ex) {
            return response.error('Create email failed: ' + (ex.message || String(ex)), handler, 'createEmail');
        }
    }

    /**
     * Updates email in SFMC
     * @param {number} assetId - Asset ID
     * @param {object} emailData - Email data
     * @returns {object} Response
     */
    function updateEmail(assetId, emailData) {
        try {
            // Update content
            var contentPayload = {
                views: {
                    html: { content: emailData.html },
                    subjectline: { content: emailData.subject || 'Email Communication' },
                    preheader: { content: emailData.preheader || '' }
                }
            };

            var updateResult = sfmc.updateAsset(assetId, contentPayload);

            if (updateResult.success) {
                stats.documentsUpdated++;
                log('', 'Email updated: ' + emailData.name);
            }

            return updateResult;
        } catch (ex) {
            return response.error('Update email failed: ' + (ex.message || String(ex)), handler, 'updateEmail');
        }
    }

    /**
     * Updates email folder in SFMC
     * @param {number} assetId - Asset ID
     * @param {number} folderId - Target folder ID
     * @returns {object} Response
     */
    function updateEmailFolder(assetId, folderId) {
        try {
            var payload = {
                category: { id: folderId }
            };

            return sfmc.updateAsset(assetId, payload);
        } catch (ex) {
            return response.error('Update folder failed: ' + (ex.message || String(ex)), handler, 'updateEmailFolder');
        }
    }

    /**
     * Saves email data to log Data Extension
     * @param {object} emailData - Email data to log
     * @returns {object} Response
     */
    function saveToLog(emailData) {
        try {
            var currentDate = new Date();

            // Truncate HTML if too long
            var html = emailData.html || '';
            if (html.length > 40000) {
                html = html.substring(0, 40000);
            }

            var upsertResult = deHandler.upsertRow('VV_Email_Synchronization_Log', {
                email_customerkey: emailData.customerKey,
                Email_Name: emailData.name,
                Email_HTML: html,
                Sync_Status: emailData.syncStatus,
                Sync_Date: currentDate,
                Email_Subject: emailData.subject || '',
                Email_Preheader: emailData.preheader || '',
                SFMC_Asset_ID: emailData.assetId || ''
            });

            return upsertResult;
        } catch (ex) {
            return response.error('Save to log failed: ' + (ex.message || String(ex)), handler, 'saveToLog');
        }
    }

    /**
     * Creates proof records for approvers
     * @param {string} customerKey - Email customer key
     * @returns {object} Response
     */
    function createProofRecords(customerKey) {
        try {
            log('', 'Creating proof records for: ' + customerKey);

            // Get approvers from Data Extension
            var approversResult = deHandler.getRows('VV_Approvers_List', {
                filter: { retrieve: 'true' }
            });

            if (!approversResult.success || !approversResult.data || approversResult.data.length === 0) {
                log('', 'No approvers found');
                return response.success({ created: 0 }, handler, 'createProofRecords');
            }

            var approvers = approversResult.data;
            var currentDate = new Date();
            var successCount = 0;

            for (var i = 0; i < approvers.length; i++) {
                var approver = approvers[i];

                if (!approver.SubscriberKey || !approver.EmailAddress) {
                    continue;
                }

                try {
                    var proofResult = deHandler.upsertRow('VV_Email_Send_Proof', {
                        SubscriberKey: approver.SubscriberKey,
                        Email_CustomerKey: customerKey,
                        Send_Date: currentDate,
                        Proof_Sent: false,
                        EmailAddress: approver.EmailAddress,
                        LastName: approver.LastName || '',
                        IsColorado: approver.IsColorado || ''
                    });

                    if (proofResult.success) {
                        successCount++;
                        stats.proofsCreated++;
                    }
                } catch (recordError) {
                    // Continue with other approvers
                }
            }

            log('', 'Proof records created: ' + successCount + '/' + approvers.length);
            return response.success({ created: successCount }, handler, 'createProofRecords');
        } catch (ex) {
            return response.error('Create proofs failed: ' + (ex.message || String(ex)), handler, 'createProofRecords');
        }
    }

    /**
     * Processes a single document
     * @param {object} doc - Vault document
     * @returns {object} Response
     */
    function processDocument(doc) {
        var docId = doc.id;
        var status = doc.status__v;
        var name = doc.name__v + ' [' + docId + ']';
        var customerKey = 'EmailVV-' + docId;
        var folderId = getStatusToFolderId(status);

        try {
            log('', 'Processing: ' + name);

            // Get HTML from Vault
            var htmlResult = getDocumentHTML(docId);
            if (!htmlResult.success || !htmlResult.data) {
                stats.documentsSkipped++;
                log('', 'No HTML available for: ' + docId);
                return response.error('No HTML available', handler, 'processDocument');
            }

            var html = htmlResult.data;
            var meta = extractSubjectAndPreheader(html);

            // Determine final subject
            var finalSubject = meta.subject;
            if (!finalSubject) {
                var tempName = name.replace(/\s*\[.*?\]\s*$/, '');
                finalSubject = trim(tempName) || 'Email Communication';
            }

            log('', 'Subject: ' + finalSubject);

            // Check if email exists
            var existingResult = findEmail(customerKey);
            var existingEmail = existingResult.success ? existingResult.data : null;

            var syncStatus = getFolderIdToStatus(folderId);
            var assetId = null;
            var isExisting = !!existingEmail;

            if (existingEmail) {
                // Email exists
                assetId = existingEmail.id;
                var currentFolderId = existingEmail.category ? existingEmail.category.id : null;

                // Only update if status is "Staged"
                if (syncStatus === "Staged") {
                    // Update folder if different
                    if (currentFolderId && currentFolderId !== folderId) {
                        updateEmailFolder(assetId, folderId);
                    }

                    // Update content
                    updateEmail(assetId, {
                        name: name,
                        html: html,
                        subject: finalSubject,
                        preheader: meta.preheader
                    });
                } else {
                    log('', 'Skipping update (status: ' + syncStatus + ')');
                    stats.documentsSkipped++;
                }
            } else {
                // Create new email
                var createResult = createEmail({
                    name: name,
                    customerKey: customerKey,
                    folderId: folderId,
                    html: html,
                    subject: finalSubject,
                    preheader: meta.preheader
                });

                if (createResult.success && createResult.data) {
                    assetId = createResult.data.id;
                }
            }

            // Log and create proofs for Staged status
            var logStatus = syncStatus;
            if (syncStatus === "Staged" && isExisting) {
                logStatus = "Pending";
            }

            if (syncStatus === "Staged" && html) {
                saveToLog({
                    customerKey: customerKey,
                    name: name,
                    html: html,
                    syncStatus: logStatus,
                    subject: finalSubject,
                    preheader: meta.preheader,
                    assetId: assetId
                });

                createProofRecords(customerKey);
            }

            stats.documentsProcessed++;
            return response.success({ processed: true }, handler, 'processDocument');

        } catch (ex) {
            stats.documentsFailed++;
            return response.error('Process failed: ' + (ex.message || String(ex)), handler, 'processDocument');
        }
    }

    /**
     * Runs the full sync task
     * @returns {object} Response with statistics
     */
    function run() {
        var startTime = new Date().getTime();

        log('', 'Starting Veeva Vault to SFMC Sync');
        log('', '================================');

        // Initialize connections
        var sfmcInit = initSFMC();
        if (!sfmcInit.success) {
            return sfmcInit;
        }

        var vaultInit = initVault();
        if (!vaultInit.success) {
            return vaultInit;
        }

        var deInit = initDataExtension();
        if (!deInit.success) {
            return deInit;
        }

        // Query documents
        var docsResult = queryVaultDocuments();
        if (!docsResult.success) {
            return docsResult;
        }

        var documents = docsResult.data;

        if (documents.length === 0) {
            log('', 'No documents to process');
            return response.success(stats, handler, 'run');
        }

        // Process each document
        log('', 'Processing ' + documents.length + ' documents...');
        Write('<ul>');

        for (var i = 0; i < documents.length; i++) {
            var doc = documents[i];
            Write('<li>');
            processDocument(doc);
            Write('</li>');
        }

        Write('</ul>');

        // Calculate duration
        var endTime = new Date().getTime();
        var duration = Math.round((endTime - startTime) / 1000);

        // Summary
        log('', '================================');
        log('', 'Sync completed in ' + duration + ' seconds');
        log('', 'Documents found: ' + stats.documentsFound);
        log('', 'Documents processed: ' + stats.documentsProcessed);
        log('', 'Documents created: ' + stats.documentsCreated);
        log('', 'Documents updated: ' + stats.documentsUpdated);
        log('', 'Documents skipped: ' + stats.documentsSkipped);
        log('', 'Documents failed: ' + stats.documentsFailed);
        log('', 'Proof records created: ' + stats.proofsCreated);

        return response.success(stats, handler, 'run');
    }

    // Public API
    this.run = run;
    this.initSFMC = initSFMC;
    this.initVault = initVault;
    this.queryVaultDocuments = queryVaultDocuments;
    this.processDocument = processDocument;
    this.getStats = function() { return stats; };
}

// ============================================================================
// EXECUTE SYNC IF CREDENTIALS PROVIDED
// ============================================================================

Write('<hr>');
Write('<h3>Sync Execution</h3>');

if (sfmcClientId && sfmcClientSecret && sfmcSubdomain && vaultDNS && vaultUsername && vaultPassword) {

    try {
        var syncConfig = {
            sfmc: {
                clientId: sfmcClientId,
                clientSecret: sfmcClientSecret,
                accountId: sfmcAccountId,
                subdomain: sfmcSubdomain
            },
            vault: {
                dns: vaultDNS,
                version: vaultVersion,
                username: vaultUsername,
                password: vaultPassword
            },
            daysBack: daysBack,
            countryId: countryId,
            channelId: channelId,
            folders: {
                staged: stagedFolderId,
                approved: approvedFolderId,
                expired: expiredFolderId
            }
        };

        var syncTask = new VeevaVaultSyncTask(syncConfig);
        var result = syncTask.run();

        if (result.success) {
            Write('<div style="background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 10px 0;">');
            Write('<strong>Sync completed successfully</strong>');
            Write('</div>');
        } else {
            Write('<div style="background-color: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 10px 0;">');
            Write('<strong>Sync failed:</strong> ' + (result.error ? result.error.message : 'Unknown error'));
            Write('</div>');
        }

    } catch (ex) {
        Write('<div style="background-color: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin: 10px 0;">');
        Write('<strong>Error:</strong> ' + (ex.message || String(ex)));
        Write('</div>');
    }

} else {
    Write('<div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 10px 0;">');
    Write('<strong>Credentials Required</strong><br>');
    Write('Please provide both SFMC and Veeva Vault credentials above to run the sync.');
    Write('</div>');
}

Write('<hr>');
Write('<h3>Integration Notes</h3>');
Write('<div style="background-color: #e7f3ff; padding: 15px; border-left: 4px solid #0176d3; margin: 10px 0;">');
Write('<strong>OmegaFramework Components Used:</strong><br><br>');
Write('<ul>');
Write('<li><strong>SFMCIntegration:</strong> SFMC REST API authentication and asset management</li>');
Write('<li><strong>VeevaVaultIntegration:</strong> Vault authentication, queries, and document renditions</li>');
Write('<li><strong>DataExtensionHandler:</strong> Logging and proof record management</li>');
Write('<li><strong>ResponseWrapper:</strong> Standardized response handling</li>');
Write('</ul>');
Write('</div>');

Write('<div style="background-color: #f0f0f0; padding: 15px; border-left: 4px solid #6c757d; margin: 10px 0;">');
Write('<strong>Data Extensions Required:</strong><br><br>');
Write('<ul>');
Write('<li><strong>VV_Email_Synchronization_Log:</strong> Stores sync history (email_customerkey, Email_Name, Email_HTML, Sync_Status, Sync_Date, Email_Subject, Email_Preheader, SFMC_Asset_ID)</li>');
Write('<li><strong>VV_Approvers_List:</strong> List of approvers for proofs (SubscriberKey, EmailAddress, LastName, IsColorado, retrieve)</li>');
Write('<li><strong>VV_Email_Send_Proof:</strong> Proof tracking (SubscriberKey, Email_CustomerKey, Send_Date, Proof_Sent, EmailAddress, LastName, IsColorado)</li>');
Write('</ul>');
Write('</div>');

</script>
