<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * VeevaVaultSyncTask - Veeva Vault to SFMC Email Synchronization
 *
 * Automated script for SFMC Automation Studio (Script Activity).
 * Synchronizes approved/staged/expired documents from Veeva Vault
 * to SFMC Content Builder as HTML emails.
 *
 * Credentials loaded from CredentialStore:
 * - SFMC: SFMC_VeevaVaultTestAmerHP (OAuth2)
 * - Veeva Vault: VeevaVaultTestAmerHP (Basic)
 *
 * Flow:
 * 1. Authenticate with SFMC (via SFMCIntegration + CredentialStore)
 * 2. Authenticate with Veeva Vault (via VeevaVaultIntegration + CredentialStore)
 * 3. Query Vault for documents matching criteria
 * 4. For each document:
 *    - Get HTML rendition from Vault
 *    - Extract subject and preheader
 *    - Create or update email in SFMC Content Builder
 *    - Log to Data Extension
 *    - Create proof records for approvers (if Staged)
 *
 * @version 1.0.0
 * @author OmegaFramework Team
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

var CONFIG = {
    // CredentialStore alias names
    sfmcCredentialName: 'SFMC_VeevaVaultTestAmerHP',
    vaultCredentialName: 'VeevaVaultTestAmerHP',

    // Vault query parameters
    daysBack: 5,
    countryId: '1360098690065',
    channelId: 'V41000000001006',

    // SFMC folder IDs for email organization
    folders: {
        staged: 51937,
        approved: 51934,
        expired: 51935
    },

    // Data Extension names
    dataExtensions: {
        syncLog: 'VV_Email_Synchronization_Log',
        approversList: 'VV_Approvers_List',
        sendProof: 'VV_Email_Send_Proof'
    },

    // Debug mode - set to true to show output for testing
    debug: true
};

// ============================================================================
// LOAD OMEGAFRAMEWORK
// ============================================================================
// OmegaFramework handles dependency loading automatically via blockKey
// when calling OmegaFramework.create() or OmegaFramework.require()

Platform.Function.ContentBlockByName("OMG_FW_OmegaFramework");

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Debug output - only writes if debug mode is enabled
 * @param {string} message - Message to output
 */
function debug(message) {
    if (CONFIG.debug) {
        Write(message + '\n');
    }
}

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
        case "Staged": return CONFIG.folders.staged;
        case "Expired": return CONFIG.folders.expired;
        case "Approved": return CONFIG.folders.approved;
        default: return CONFIG.folders.staged;
    }
}

/**
 * Maps folder ID to sync status
 * @param {number} folderId - SFMC folder ID
 * @returns {string} Sync status
 */
function getFolderIdToStatus(folderId) {
    if (folderId === CONFIG.folders.staged) return "Staged";
    if (folderId === CONFIG.folders.expired) return "Expired";
    if (folderId === CONFIG.folders.approved) return "Validated";
    return "Staged";
}

// ============================================================================
// MAIN SYNC EXECUTION
// ============================================================================

try {
    var response = OmegaFramework.require('ResponseWrapper', {});
    var startTime = new Date().getTime();

    // Statistics
    var stats = {
        documentsFound: 0,
        documentsProcessed: 0,
        documentsCreated: 0,
        documentsUpdated: 0,
        documentsSkipped: 0,
        documentsFailed: 0,
        proofsCreated: 0
    };

    debug('========================================');
    debug('Veeva Vault to SFMC Sync Task');
    debug('Started: ' + new Date().toISOString());
    debug('========================================');

    // ========================================================================
    // STEP 1: Initialize SFMC Integration
    // ========================================================================
    debug('\n[1/4] Initializing SFMC Integration...');

    var sfmc = OmegaFramework.create('SFMCIntegration', { integrationName: CONFIG.sfmcCredentialName });

    var sfmcTokenResult = sfmc.getToken();
    if (!sfmcTokenResult.success) {
        throw new Error('SFMC authentication failed: ' + (sfmcTokenResult.error ? sfmcTokenResult.error.message : 'Unknown error'));
    }
    debug('SFMC authenticated successfully');

    // ========================================================================
    // STEP 2: Initialize Veeva Vault Integration
    // ========================================================================
    debug('\n[2/4] Initializing Veeva Vault Integration...');

    var vault = OmegaFramework.create('VeevaVaultIntegration', { integrationName: CONFIG.vaultCredentialName });

    var vaultAuthResult = vault.authenticate();
    if (!vaultAuthResult.success) {
        throw new Error('Vault authentication failed: ' + (vaultAuthResult.error ? vaultAuthResult.error.message : 'Unknown error'));
    }
    debug('Veeva Vault authenticated successfully');

    // ========================================================================
    // STEP 3: Query Vault Documents
    // ========================================================================
    debug('\n[3/4] Querying Vault for documents...');

    var recentDate = getISODateMinusDays(CONFIG.daysBack);

    var vqlQuery = "SELECT id, version_id, status__v, name__v, country__v " +
                  "FROM ALLVERSIONS documents " +
                  "WHERE type__v = 'Composite' " +
                  "AND (status__v = 'Approved' OR status__v = 'Staged' OR status__v = 'Expired') " +
                  "AND version_modified_date__v >= '" + recentDate + "' " +
                  "AND country__v = '" + CONFIG.countryId + "' " +
                  "AND intended_channel2__c = '" + CONFIG.channelId + "'";

    var queryResult = vault.query(vqlQuery);

    if (!queryResult.success) {
        throw new Error('Vault query failed: ' + (queryResult.error ? queryResult.error.message : 'Unknown error'));
    }

    var documents = queryResult.data || [];
    stats.documentsFound = documents.length;

    debug('Found ' + documents.length + ' documents');

    // ========================================================================
    // STEP 4: Process Documents
    // ========================================================================
    debug('\n[4/4] Processing documents...');
    debug('----------------------------------------');

    if (documents.length === 0) {
        debug('No documents to process');
    } else {
        // Initialize DataExtension handler for logging
        var deHandler = OmegaFramework.create('DataExtensionHandler', {});

        for (var i = 0; i < documents.length; i++) {
            var doc = documents[i];
            var docId = doc.id;
            var status = doc.status__v;
            var name = doc.name__v + ' [' + docId + ']';
            var customerKey = 'EmailVV-' + docId;
            var folderId = getStatusToFolderId(status);

            debug('\nDocument ' + (i + 1) + '/' + documents.length + ': ' + name);
            debug('  Status: ' + status);
            debug('  CustomerKey: ' + customerKey);

            try {
                // Get HTML from Vault
                var htmlResult = vault.getDocumentRendition(docId, 'source_file__c');

                if (!htmlResult.success || !htmlResult.data) {
                    debug('  [SKIP] No HTML rendition available');
                    stats.documentsSkipped++;
                    continue;
                }

                var html = htmlResult.data;
                debug('  HTML retrieved: ' + html.length + ' characters');

                // Extract metadata
                var meta = extractSubjectAndPreheader(html);

                // Determine final subject
                var finalSubject = meta.subject;
                if (!finalSubject) {
                    var tempName = name.replace(/\s*\[.*?\]\s*$/, '');
                    finalSubject = trim(tempName) || 'Email Communication';
                }

                debug('  Subject: ' + finalSubject);
                if (meta.preheader) {
                    debug('  Preheader: ' + meta.preheader.substring(0, 50) + '...');
                }

                // Check if email exists in SFMC
                var existingResult = sfmc.queryAssets({
                    query: {
                        property: 'customerKey',
                        simpleOperator: 'equals',
                        value: customerKey
                    }
                });

                var existingEmail = null;
                if (existingResult.success && existingResult.data && existingResult.data.items && existingResult.data.items.length > 0) {
                    existingEmail = existingResult.data.items[0];
                }

                var syncStatus = getFolderIdToStatus(folderId);
                var assetId = null;
                var isExisting = !!existingEmail;

                if (existingEmail) {
                    // Email exists
                    assetId = existingEmail.id;
                    var currentFolderId = existingEmail.category ? existingEmail.category.id : null;

                    debug('  [EXISTS] Asset ID: ' + assetId);

                    // Only update if status is "Staged"
                    if (syncStatus === "Staged") {
                        // Update folder if different
                        if (currentFolderId && currentFolderId !== folderId) {
                            sfmc.updateAsset(assetId, { category: { id: folderId } });
                            debug('  Folder updated');
                        }

                        // Update content
                        var updatePayload = {
                            views: {
                                html: { content: html },
                                subjectline: { content: finalSubject },
                                preheader: { content: meta.preheader || '' }
                            }
                        };

                        var updateResult = sfmc.updateAsset(assetId, updatePayload);
                        if (updateResult.success) {
                            stats.documentsUpdated++;
                            debug('  [UPDATED] Content updated successfully');
                        } else {
                            debug('  [ERROR] Update failed: ' + (updateResult.error ? updateResult.error.message : 'Unknown'));
                        }
                    } else {
                        debug('  [SKIP] No update (status: ' + syncStatus + ')');
                        stats.documentsSkipped++;
                    }
                } else {
                    // Create new email
                    debug('  [NEW] Creating email...');

                    var createPayload = {
                        name: name,
                        customerKey: customerKey,
                        assetType: { id: 208 }, // HTML Email
                        category: { id: folderId },
                        views: {
                            html: { content: html },
                            subjectline: { content: finalSubject },
                            preheader: { content: meta.preheader || '' }
                        }
                    };

                    var createResult = sfmc.createAsset(createPayload);

                    if (createResult.success && createResult.data) {
                        assetId = createResult.data.id;
                        stats.documentsCreated++;
                        debug('  [CREATED] Asset ID: ' + assetId);
                    } else {
                        stats.documentsFailed++;
                        debug('  [ERROR] Create failed: ' + (createResult.error ? createResult.error.message : 'Unknown'));
                        continue;
                    }
                }

                // Log and create proofs for Staged status
                var logStatus = syncStatus;
                if (syncStatus === "Staged" && isExisting) {
                    logStatus = "Pending";
                }

                if (syncStatus === "Staged" && html) {
                    // Save to log Data Extension
                    var logHtml = html;
                    if (logHtml.length > 40000) {
                        logHtml = logHtml.substring(0, 40000);
                    }

                    var logResult = deHandler.upsertRow(CONFIG.dataExtensions.syncLog, {
                        email_customerkey: customerKey,
                        Email_Name: name,
                        Email_HTML: logHtml,
                        Sync_Status: logStatus,
                        Sync_Date: new Date(),
                        Email_Subject: finalSubject,
                        Email_Preheader: meta.preheader || '',
                        SFMC_Asset_ID: String(assetId || '')
                    });

                    if (logResult.success) {
                        debug('  Logged to DE');
                    }

                    // Create proof records for approvers
                    var approversResult = deHandler.getRows(CONFIG.dataExtensions.approversList, {
                        filter: { retrieve: 'true' }
                    });

                    if (approversResult.success && approversResult.data && approversResult.data.length > 0) {
                        var approvers = approversResult.data;
                        var proofCount = 0;

                        for (var j = 0; j < approvers.length; j++) {
                            var approver = approvers[j];
                            if (!approver.SubscriberKey || !approver.EmailAddress) continue;

                            var proofResult = deHandler.upsertRow(CONFIG.dataExtensions.sendProof, {
                                SubscriberKey: approver.SubscriberKey,
                                Email_CustomerKey: customerKey,
                                Send_Date: new Date(),
                                Proof_Sent: false,
                                EmailAddress: approver.EmailAddress,
                                LastName: approver.LastName || '',
                                IsColorado: approver.IsColorado || ''
                            });

                            if (proofResult.success) {
                                proofCount++;
                                stats.proofsCreated++;
                            }
                        }

                        debug('  Proof records created: ' + proofCount);
                    }
                }

                stats.documentsProcessed++;

            } catch (docError) {
                stats.documentsFailed++;
                debug('  [ERROR] ' + (docError.message || String(docError)));
            }
        }
    }

    // ========================================================================
    // SUMMARY
    // ========================================================================
    var endTime = new Date().getTime();
    var duration = Math.round((endTime - startTime) / 1000);

    debug('\n========================================');
    debug('Sync completed in ' + duration + ' seconds');
    debug('========================================');
    debug('Documents found:     ' + stats.documentsFound);
    debug('Documents processed: ' + stats.documentsProcessed);
    debug('Documents created:   ' + stats.documentsCreated);
    debug('Documents updated:   ' + stats.documentsUpdated);
    debug('Documents skipped:   ' + stats.documentsSkipped);
    debug('Documents failed:    ' + stats.documentsFailed);
    debug('Proof records:       ' + stats.proofsCreated);
    debug('========================================');

} catch (ex) {
    debug('\n[FATAL ERROR] ' + (ex.message || String(ex)));

    // In production, you might want to log this error to a DE
    // or send an alert email
}

</script>
