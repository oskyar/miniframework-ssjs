<script runat="server">
Platform.Load("Core", "1.1.1");
//aliasName: SFMC_VeevaVaultTestAmerHP
var clientId = "xxxxx";
var clientSecret = "xxxx";
var AccountId = "xxx";
var subdomain = "xxxxx";

var vaultDNS = "xxxxx.veevavault.com";
var vaultVersion = "v24.1";
var vaultUsername = "xxxxxxx.com";
var vaultPassword = "xxxxxx";

// === DEPENDENCY LOADING ===
//Platform.Function.ContentBlockByKey("TEST_API_AUTH_HP");
<script runat="server">
/**
 * Función para autenticar con Veeva Vault
 */
function authenticateVeeva(config) {
    var result = {
        success: false,
        sessionId: null,
        error: null
    };
    
    try {
        if (!config || !config.baseUrl || !config.username || !config.password) {
            result.error = 'Se requieren baseUrl, username y password';
            return result;
        }
        
        var apiVersion = config.version || "v24.1";
        var url = config.baseUrl + "/api/" + apiVersion + "/auth";
        var payload = "username=" + encodeURIComponent(config.username) + 
                     "&password=" + encodeURIComponent(config.password);
        
        var request = new Script.Util.HttpRequest(url);
        request.method = "POST";
        request.encoding = "UTF-8";
        request.contentType = "application/x-www-form-urlencoded";
        request.postData = payload;
        
        var response = request.send();
        
        if (!response || !response.content) {
            result.error = "No se recibió respuesta del servidor";
            return result;
        }
        
        var parsedResponse = Platform.Function.ParseJSON(String(response.content));
        
        if (parsedResponse.responseStatus === "SUCCESS" && parsedResponse.sessionId) {
            result.success = true;
            result.sessionId = parsedResponse.sessionId;
        } else {
            result.error = parsedResponse.responseMessage || "Error de autenticación";
        }
        
    } catch (e) {
        result.error = e.message;
    }
    
    return result;
}

/**
 * Función para obtener token de acceso de Marketing Cloud
 */
function getAccessToken(clientId, clientSecret, AccountId, subdomain) {
    try {
        var payload = {
            "grant_type": "client_credentials",
            "client_id": clientId,
            "client_secret": clientSecret,
            "account_id": AccountId
        };

        var url = "https://" + subdomain + ".auth.marketingcloudapis.com/v2/token";
        var result = HTTP.Post(url, "application/json", Stringify(payload));
        
        if (!result || !result.Response || result.Response.length === 0) {
            Write("❌ No se recibió respuesta del servidor de autenticación");
            return null;
        }
        
        var response = Platform.Function.ParseJSON(result.Response[0]);

        if (response.access_token) {
            return response.access_token;
        } else {
            Write("❌ Error al obtener el token: " + result.Response[0]);
            return null;
        }
    } catch (e) {
        Write("❌ Excepción al obtener token: " + Stringify(e));
        return null;
    }
}
</script>

//===================================
//Platform.Function.ContentBlockByKey("TEST_VV_Connector_HP");
<script runat="server">
Platform.Load("Core", "1.1.1");

function getVaultHTML(docId, vaultDNS, version, sessionId) {
    try {
        if (!docId || !vaultDNS || !version || !sessionId) {
            Write("<p>❌ Missing parameters for Vault</p>");
            return "";
        }

        var url = "https://" + vaultDNS + "/api/" + version + "/objects/documents/" + docId + "/renditions/source_file__c";
        
        var request = new Script.Util.HttpRequest(url);
        request.method = "GET";
        request.encoding = "UTF-8";
        request.setHeader("Authorization", "Vault " + sessionId);

        Write("<p>🔧 Requesting HTML from Vault: " + docId + "</p>");
        
        var response = request.send();
        
        if (!response) {
            Write("<p>❌ No response from Vault for document " + docId + "</p>");
            return "";
        }
        
        if (!response.content) {
            Write("<p>❌ Empty response from Vault for document " + docId + "</p>");
            return "";
        }

        var contentString = String(response.content);
        
        if (!contentString || contentString.length === 0) {
            Write("<p>❌ Empty content after CLR conversion for document " + docId + "</p>");
            return "";
        }

        if (contentString.indexOf('"status":"FAILURE"') > -1 || contentString.indexOf('"errors"') > -1) {
            Write("<p>❌ Vault returned error for document " + docId + ":</p>");
            Write("<p>📝 Error: " + contentString.substring(0, 200) + "...</p>");
            return "";
        }

        Write("<p>✅ HTML obtained from Vault: " + docId + " (" + contentString.length + " characters)</p>");
        
        return contentString;

    } catch (error) {
        Write("<p>❌ Error obtaining HTML from Vault for document " + docId + ": " + String(error) + "</p>");
        return "";
    }
}

function getISODateMinusMinutes(minutes) {
    var now = new Date();
    now.setMinutes(now.getMinutes() - minutes);

    var year = now.getUTCFullYear();
    var month = ('0' + (now.getUTCMonth() + 1)).slice(-2);
    var day = ('0' + now.getUTCDate()).slice(-2);
    var hours = ('0' + now.getUTCHours()).slice(-2);
    var mins = ('0' + now.getUTCMinutes()).slice(-2);
    var seconds = ('0' + now.getUTCSeconds()).slice(-2);

    return year + '-' + month + '-' + day + 'T' + hours + ':' + mins + ':' + seconds + '.000Z';
}
  
  function getISODateMinusHours(hours) {
    var now = new Date();
    now.setHours(now.getHours() - hours);

    var year = now.getUTCFullYear();
    var month = ('0' + (now.getUTCMonth() + 1)).slice(-2);
    var day = ('0' + now.getUTCDate()).slice(-2);
    var hours = ('0' + now.getUTCHours()).slice(-2);
    var mins = ('0' + now.getUTCMinutes()).slice(-2);
    var seconds = ('0' + now.getUTCSeconds()).slice(-2);

    return year + '-' + month + '-' + day + 'T' + hours + ':' + mins + ':' + seconds + '.000Z';
}
  
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

function queryVaultDocuments(vaultDNS, vaultVersion, vaultSessionId) {
    try {
        var url = "https://" + vaultDNS + "/api/" + vaultVersion + "/query";
        
        var recentDate = getISODateMinusDays(5);

        var sqlQuery = "SELECT id, version_id, status__v, name__v, country__v " +
                       "FROM ALLVERSIONS documents " +
                       "WHERE type__v = 'Composite' " +
                       "AND (status__v = 'Approved' OR status__v = 'Staged' OR status__v = 'Expired') " +
                       "AND version_modified_date__v >= '" + recentDate + "' " +
                       "AND country__v = '1360098690065' " +
                       "AND intended_channel2__c = 'V41000000001006'";

        var payload = "q=" + encodeURIComponent(sqlQuery);
        var headerNames = ["Authorization", "Accept", "X-VaultAPI-DescribeQuery"];
        var headerValues = [vaultSessionId, "application/json", "true"];
        
        Write("<p>🔍 Querying Vault for documents...</p>");
        var result = HTTP.Post(url, "application/x-www-form-urlencoded", payload, headerNames, headerValues);
        
        if (result && result.Response) {
            var parsed = eval('(' + result.Response + ')');
            
            if (parsed.responseStatus === "SUCCESS") {
                Write("<p>✅ Found " + (parsed.data ? parsed.data.length : 0) + " documents</p>");
                return parsed.data || [];
            } else {
                Write("<p>❌ Vault query failed: " + (parsed.errors ? parsed.errors[0].message : "Unknown error") + "</p>");
                return [];
            }
        }
        
        return [];
    } catch (error) {
        Write("<p>❌ Error querying Vault: " + String(error) + "</p>");
        return [];
    }
}
</script>


//===================================
//Platform.Function.ContentBlockByKey("TEST_VV_SFMC_Email_Manager_HP");
<script runat="server">
Platform.Load("Core", "1.1.1");

// Function to save email data to Data Extension - Updated to include SFMC_Asset_ID and correct UpsertData usage
function saveEmailToDataExtension(emailName, customerKey, emailHTML, syncStatus, assetId, finalSubject, finalPreheader) {
    try {
        if (!emailName || !customerKey || !emailHTML || !syncStatus) {
            Write("<p>⚠️ Missing parameters for Data Extension</p>");
            return false;
        }

        Write("<p>💾 Saving to DE: " + customerKey + " | Status: " + syncStatus + " | Asset ID: " + (assetId || "none") + " (" + emailHTML.length + " chars)   </p>");
        Write("<p>💾 Email_Subject " + finalSubject + "</p>");

        var currentDate = new Date();

        // Maximum length of Email_HTML in the Data Extension (adjust as needed)
        var maxLength = 40000;
        if (emailHTML.length > maxLength) {
            Write("<p>⚠️ Email HTML length (" + emailHTML.length + ") exceeds max allowed (" + maxLength + "), truncating</p>");
            emailHTML = emailHTML.substring(0, maxLength);
        }

        if (!customerKey || customerKey === "") {
            Write("<p>❌ Missing or empty customerKey</p>");
            return false;
        }
        if (!emailName) emailName = "";
        if (!syncStatus) syncStatus = "";

        var keyColumns = ["email_customerkey"];
        var keyValues = [customerKey];

        var updateColumns = ["Email_Name", "Email_HTML", "Sync_Status", "Sync_Date", "Email_Subject", "Email_Preheader"];
        var updateValues = [emailName, emailHTML, syncStatus, currentDate, finalSubject, finalPreheader];

        if (assetId) {
            updateColumns.push("SFMC_Asset_ID");
            updateValues.push(assetId);
        }

        var upsertResult = Platform.Function.UpsertData(
            "VV_Email_Synchronization_Log",
            keyColumns,
            keyValues,
            updateColumns,
            updateValues
        );

        if (upsertResult && upsertResult > 0) {
            Write("<p>✅ Email upserted to Data Extension with Asset ID (" + upsertResult + " records)</p>");
            return true;
        } else {
            Write("<p>❌ UpsertData failed: " + upsertResult + "</p>");
            return false;
        }
    } catch (deError) {
        Write("<p>❌ DE Error: " + String(deError) + "</p>");
        return false;
    }
}

function updateEmailContent(accessToken, assetId, htmlContent, subject, preheader, subdomain, name) {
    try {
        if (!htmlContent || htmlContent.length === 0) {
            Write("<p>⚠️ No HTML content provided to update for asset " + assetId + "</p>");
            return false;
        }

        Write("<p>📝 Updating email content for asset: " + assetId + " (" + name + ")</p>");

        // Reutilizamos la misma lógica de subject/preheader que en createEmail
        var finalSubject;
        if (subject && subject !== "Subject not found" && subject !== "Asunto no encontrado" && subject.length > 0) {
            finalSubject = subject;
        } else {
            if (name && typeof name === "string") {
                var tempName = name.replace(/\s*\[.*?\]\s*$/, '');
                finalSubject = trim(tempName);
                if (!finalSubject || finalSubject.length === 0) {
                    finalSubject = "Email Communication";
                }
            } else {
                finalSubject = "Email Communication";
            }
            Write("<p>📧 Subject not found in params, using name as subject: " + finalSubject + "</p>");
        }

        var finalPreheader;
        if (preheader && preheader !== "Preheader not found" && preheader !== "Preheader no encontrado" && preheader.length > 0) {
            finalPreheader = preheader;
        } else {
            finalPreheader = "";
        }

        var patchUrl = "https://" + subdomain + ".rest.marketingcloudapis.com/asset/v1/content/assets/" + assetId;

        var patchPayload = Stringify({
            "views": {
                "html": {
                    "content": htmlContent
                },
                "subjectline": {
                    "content": finalSubject
                },
                "preheader": {
                    "content": finalPreheader
                }
            }
        });

        var request = new Script.Util.HttpRequest(patchUrl);
        request.emptyContentHandling = 0;
        request.retries = 2;
        request.continueOnError = true;
        request.method = "PATCH";
        request.encoding = "UTF-8";
        request.contentType = "application/json";
        request.setHeader("Authorization", "Bearer " + accessToken);
        request.postData = patchPayload;

        Write("<p>🔄 Sending PATCH request for content update...</p>");
        var response = request.send();

        if (response) {
            if (response.content) {
                var content = String(response.content);
                Write("<p>📋 PATCH Content Update Response: " + content.substring(0, 200) + "...</p>");

                if (content.indexOf('"error"') > -1 || content.indexOf('"message"') > -1) {
                    Write("<p>❌ API Error in content update: " + content + "</p>");
                    return false;
                } else {
                    Write("<p>✅ Email content updated successfully for asset " + assetId + "</p>");
                    return true;
                }
            } else {
                Write("<p>✅ Email content updated (no content in response) for asset " + assetId + "</p>");
                return true;
            }
        } else {
            Write("<p>❌ No response from PATCH request (content update)</p>");
            return false;
        }

    } catch (updateError) {
        Write("<p>❌ Error updating email content: " + String(updateError) + "</p>");
        Write("<p>🔍 Error context - AssetID: " + assetId + "</p>");
        return false;
    }
}

function updateEmailFolder(accessToken, assetId, folderId, subdomain, name) {
    try {
        var patchUrl = "https://" + subdomain + ".rest.marketingcloudapis.com/asset/v1/content/assets/" + assetId;
        var patchPayload = Stringify({
            "category": {
                "id": folderId
            }
        });

        var request = new Script.Util.HttpRequest(patchUrl);
        request.method = "PATCH";
        request.encoding = "UTF-8";
        request.contentType = "application/json";
        request.setHeader("Authorization", "Bearer " + accessToken);
        request.postData = patchPayload;

        Write("<p>🔄 Sending PATCH request for folder update...</p>");
        var response = request.send();

        if (response) {
            if (response.content) {
                var content = String(response.content);
                Write("<p>📋 PATCH Response: " + content.substring(0, 200) + "...</p>");

                if (content.indexOf('"error"') > -1 || content.indexOf('"message"') > -1) {
                    Write("<p>❌ API Error in folder update: " + content + "</p>");
                    return false;
                } else {
                    Write("<p>✅ Folder updated: " + name + "</p>");
                    return true;
                }
            } else {
                Write("<p>✅ Folder updated (no content response): " + name + "</p>");
                return true;
            }
        } else {
            Write("<p>❌ No response from PATCH request</p>");
            return false;
        }
    } catch (patchError) {
        Write("<p>❌ Error updating folder: " + String(patchError) + "</p>");
        Write("<p>🔍 Error context - AssetID: " + assetId + ", FolderID: " + folderId + "</p>");
        return false;
    }
}

function createEmail(accessToken, htmlContent, name, customerKey, folderId, subdomain, subject, preheader) {
    Write("<p>🆕 Creating email: " + name + "</p>");

    try {
        var finalSubject;
        if (subject && subject !== "Subject not found" && subject !== "Asunto no encontrado" && subject.length > 0) {
            finalSubject = subject;
        } else {
            if (name && typeof name === "string") {
                var tempName = name.replace(/\s*\[.*?\]\s*$/, '');
                finalSubject = trim(tempName);
                if (!finalSubject || finalSubject.length === 0) {
                    finalSubject = "Email Communication";
                }
            } else {
                finalSubject = "Email Communication";
            }
            Write("<p>📧 Subject not found, using name as subject: " + finalSubject + "</p>");
        }

        var finalPreheader;
        if (preheader && preheader !== "Preheader not found" && preheader !== "Preheader no encontrado" && preheader.length > 0) {
            finalPreheader = preheader;
        } else {
            finalPreheader = "";
        }

        var createPayload = Stringify({
            "name": name,
            "customerKey": customerKey,
            "assetType": {
                "id": 208
            },
            "category": {
                "id": folderId
            },
            "views": {
                "html": {
                    "content": htmlContent || "<html><body>Default content</body></html>"
                },
                "subjectline": {
                    "content": finalSubject
                },
                "preheader": {
                    "content": finalPreheader
                }
            }
        });

        var createUrl = "https://" + subdomain + ".rest.marketingcloudapis.com/asset/v1/content/assets";

        var request = new Script.Util.HttpRequest(createUrl);
        request.emptyContentHandling = 0;
        request.retries = 2;
        request.continueOnError = true;
        request.method = "POST";
        request.contentType = "application/json";
        request.setHeader("Authorization", "Bearer " + accessToken);
        request.postData = createPayload;

        Write("<p>🔄 Sending POST request for email creation...</p>");
        var response = request.send();

        if (response) {
            if (response.content) {
                var content = String(response.content);
                Write("<p>📋 POST Response: " + content.substring(0, 200) + "...</p>");

                var parsed = Platform.Function.ParseJSON(content);

                if (parsed && parsed.id) {
                    Write("<p>✅ Email created successfully (ID: " + parsed.id + ")</p>");
                    return parsed;
                } else {
                    if (content.indexOf('"error"') === -1) {
                        Write("<p>✅ Email created (no ID confirmation)</p>");
                        return { id: null };
                    }
                    Write("<p>❌ Error in creation: " + content + "</p>");
                    return null;
                }
            } else {
                Write("<p>❌ No content in POST response</p>");
                return null;
            }
        } else {
            Write("<p>❌ No response from POST request</p>");
            return null;
        }

    } catch (createError) {
        Write("<p>❌ Error creating email: " + String(createError) + "</p>");
        Write("<p>🔍 Error context - CustomerKey: " + customerKey + ", FolderID: " + folderId + "</p>");
        return null;
    }
}

function findEmail(accessToken, customerKey, subdomain) {
    Write("<p>🔍 Searching for email with customerKey: " + customerKey + "</p>");

    try {
        var queryUrl = "https://" + subdomain + ".rest.marketingcloudapis.com/asset/v1/content/assets/query";
        var queryPayload = Stringify({
            "query": {
                "property": "customerKey",
                "simpleOperator": "equals",
                "value": customerKey
            }
        });

        var request = new Script.Util.HttpRequest(queryUrl);
        request.method = "POST";
        request.encoding = "UTF-8";
        request.contentType = "application/json";
        request.setHeader("Authorization", "Bearer " + accessToken);
        request.postData = queryPayload;

        Write("<p>🔄 Sending search request...</p>");
        var response = request.send();

        if (response && response.content) {
            var content = String(response.content);
            Write("<p>📋 Search Response: " + content.substring(0, 200) + "...</p>");

            var parsed = Platform.Function.ParseJSON(content);
            if (parsed && parsed.items && parsed.items.length > 0) {
                Write("<p>✅ Email found</p>");
                return parsed.items[0];
            }
        }
    } catch (queryError) {
        Write("<p>❌ Error in email search: " + String(queryError) + "</p>");
    }

    Write("<p>💡 Email not found - will be created</p>");
    return null;
}

function extractSubjectAndPreheader(htmlContent) {
    var result = {
        subject: "Subject not found",
        preheader: "Preheader not found"
    };

    if (!htmlContent || typeof htmlContent !== "string" || htmlContent.length <= 0) {
        Write("<p>⚠️ Invalid HTML for extraction (length: " + (htmlContent ? htmlContent.length : "null") + ")</p>");
        return result;
    }

    try {
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
                        Write("<p>✅ Subject extracted: " + result.subject + "</p>");
                    }
                }
            }
        }

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
                        Write("<p>✅ Preheader extracted: " + result.preheader + "</p>");
                    }
                }
            }
        }

    } catch (error) {
        Write("<p>❌ Error in extraction: " + String(error) + "</p>");
    }

    return result;
}

function upsertEmail(accessToken, htmlContent, name, customerKey, folderId, subdomain, subject, preheader) {
    try {
        if (!accessToken || !name || !customerKey || !folderId || !subdomain) {
            Write("<p>❌ Error: Missing required parameters</p>");
            return false;
        }

        var existingEmail = findEmail(accessToken, customerKey, subdomain);
        var emailCreated = false;
        var syncStatus = "";
        var finalAssetId = null;
        var isExisting = !!existingEmail; // flag: email ya existía

        if (existingEmail) {
            // 📌 Caso 1: el email YA existe
            if (!existingEmail.id) {
                Write("<p>❌ Error: Email without valid ID</p>");
                return false;
            }

            var assetId = existingEmail.id;
            finalAssetId = assetId;
            var currentFolderId = existingEmail.category ? existingEmail.category.id : null;

            // Status según la carpeta destino
            syncStatus = getFolderIdToStatus(folderId); // "Staged", "Expired", "Validated", etc.

            // ✅ SOLO actualizamos si el estado es "Staged"
            if (syncStatus === "Staged") {

                // 1) Si la carpeta es distinta, actualizamos carpeta
                if (currentFolderId && currentFolderId != folderId) {
                    var folderUpdated = updateEmailFolder(accessToken, assetId, folderId, subdomain, name);
                    if (!folderUpdated) {
                        Write("<p>⚠️ Folder could not be updated for asset " + assetId + "</p>");
                    }
                } else {
                    Write("<p>✅ Email already exists in correct folder</p>");
                }

                // 2) Actualizamos siempre el contenido si tenemos HTML
                if (htmlContent) {
                    var contentUpdated = updateEmailContent(accessToken, assetId, htmlContent, subject, preheader, subdomain, name);
                    if (!contentUpdated) {
                        Write("<p>⚠️ Email content could not be updated for asset " + assetId + "</p>");
                    } else {
                        Write("<p>✅ Existing email content updated</p>");
                    }
                } else {
                    Write("<p>⚠️ No HTML content provided, skipping content update for existing email</p>");
                }

            } else {
                // ⏸ No tocar el asset si no está en Staged
                Write("<p>⏸ Email found but no updates applied because status is '" + syncStatus + "' (only 'Staged' is allowed for updates)</p>");
            }

            // Consideramos el "upsert" del asset como correcto si el email ya existía
            emailCreated = true;

        } else {
            // 📌 Caso 2: el email NO existe → lo creamos
            var createdEmail = createEmail(accessToken, htmlContent, name, customerKey, folderId, subdomain, subject, preheader);
            if (createdEmail) {
                emailCreated = true;
                finalAssetId = createdEmail.id;
                syncStatus = getFolderIdToStatus(folderId);
            }
        }

        // 👇 CAMBIO CLAVE: decidir qué estado se guarda en la DE
        var logStatus = syncStatus;

        // Si viene en Staged y YA existía → lo marcamos como Pending (nuevo ciclo)
        if (syncStatus === "Staged" && isExisting) {
            logStatus = "Pending";
            Write("<p>🔁 Existing template in Staged detected – setting Sync_Status to Pending</p>");
        }

        // 📝 Log + creación de proofs solo si viene como Staged
        if (syncStatus === "Staged" && htmlContent) {
            var saveResult = saveEmailToDataExtension(
                name,
                customerKey,
                htmlContent,
                logStatus,     // "Staged" (nuevo) o "Pending" (ya existía)
                finalAssetId,
                subject,
                preheader
            );

            if (saveResult) {
                createProofRecords(customerKey);
            }
        }

        return emailCreated;

    } catch (error) {
        Write("<p>❌ Error in upsertEmail: " + String(error) + "</p>");
        return false;
    }
}

function getFolderIdToStatus(folderId) {
    switch (parseInt(folderId)) {
        case 51937: return "Staged";
        case 51935: return "Expired";
        case 51934: return "Validated";
        default: return "Staged";
    }
}

function getStatusToFolderId(status) {
    switch (status) {
        case "Staged": return 51937;
        case "Expired": return 51935;
        case "Approved": return 51934;
        default: return 51937;
    }
}

function createProofRecords(customerKey) {
    try {
        Write("<p>📮 Creating proof records for Staged email: " + customerKey + "</p>");


        var approversResult = Platform.Function.LookupRows("VV_Approvers_List", "retrieve", "true");


        if (!approversResult || approversResult.length === 0) {
            Write("<p>⚠️ No approvers found in VV_Approvers_List</p>");
            return false;
        }


        Write("<p>👥 Found " + approversResult.length + " approvers</p>");


        var currentDate = new Date();
        var successCount = 0;


        for (var i = 0; i < approversResult.length; i++) {
            var approver = approversResult[i];


            if (!approver.SubscriberKey || !approver.EmailAddress) {
                Write("<p>⚠️ Skipping approver " + (i + 1) + " - missing SubscriberKey or EmailAddress</p>");
                continue;
            }


            try {
                // 👉 Añadimos LastName e IsColorado como columnas a actualizar, no como claves
                var proofColumnNames = ["Send_Date", "Proof_Sent", "EmailAddress", "LastName", "IsColorado"];
                var proofValues = [
                    currentDate,
                    false,
                    approver.EmailAddress,
                    approver.LastName,
                    approver.IsColorado
                ];


                var proofUpsertResult = Platform.Function.UpsertData(
                    "VV_Email_Send_Proof",
                    ["SubscriberKey", "Email_CustomerKey"],              // 👈 claves igual que antes
                    [approver.SubscriberKey, customerKey],
                    proofColumnNames,
                    proofValues
                );


                if (proofUpsertResult && proofUpsertResult > 0) {
                    successCount++;
                    Write("<p>✅ Proof record upserted for: " + approver.EmailAddress + "</p>");
                } else {
                    Write("<p>❌ Failed to upsert proof record for: " + approver.EmailAddress + "</p>");
                }


            } catch (recordError) {
                Write("<p>❌ Error creating proof record for " + approver.EmailAddress + ": " + String(recordError) + "</p>");
            }
        }


        Write("<p>📊 Proof records summary: " + successCount + "/" + approversResult.length + " created successfully</p>");


        return successCount > 0;


    } catch (error) {
        Write("<p>❌ Error in createProofRecords: " + String(error) + "</p>");
        return false;
    }
}
</script>

//===================================
//Platform.Function.ContentBlockByKey("TEST_VV_Utilities_HP");
<script runat="server">
Platform.Load("Core", "1.1.1");

/**
 * VV_Utilities
 * Common utility functions for VV integrations
 * Reusable across different integration projects
 */

// === STRING UTILITIES === //

/**
 * Manual trim function for environments where native trim might not work
 * @param {string} str - String to trim
 * @returns {string} Trimmed string
 */
function trim(str) {
    if (!str) return "";
    // Implementación manual sin usar .trim()
    var result = String(str);
    // Remover espacios del inicio
    while (result.length > 0 && (result.charAt(0) === ' ' || result.charAt(0) === '\t' || result.charAt(0) === '\n' || result.charAt(0) === '\r')) {
        result = result.substring(1);
    }
    // Remover espacios del final
    while (result.length > 0 && (result.charAt(result.length-1) === ' ' || result.charAt(result.length-1) === '\t' || result.charAt(result.length-1) === '\n' || result.charAt(result.length-1) === '\r')) {
        result = result.substring(0, result.length-1);
    }
    return result;
}

function cleanText(str) {
    if (!str) return "";
    
    var result = String(str);
    result = result.replace(/<[^>]*>/g, '');  // Quitar HTML tags
    
    // Manual trim sin regex
    while (result.length > 0 && result.charAt(0) === ' ') {
        result = result.substring(1);
    }
    while (result.length > 0 && result.charAt(result.length-1) === ' ') {
        result = result.substring(0, result.length-1);
    }
    
    return result;
}

/**
 * Validates if a string is not empty and meaningful
 * @param {string} str - String to validate
 * @param {number} minLength - Minimum length (default: 1)
 * @param {number} maxLength - Maximum length (default: 1000)
 * @returns {boolean} True if string is valid
 */
function isValidString(str, minLength) {
    if (!str || typeof str !== "string") return false;
    
    var cleanStr = cleanText(str);
    var min = minLength || 1;
    
    return cleanStr.length >= min;
}

/**
 * Safely converts any value to string
 * @param {*} value - Value to convert
 * @returns {string} String representation
 */
function safeString(value) {
    if (value === null || value === undefined) return "";
    return String(value);
}

// === VALIDATION UTILITIES ===

/**
 * Validates if a value exists and is not empty
 * @param {*} value - Value to check
 * @returns {boolean} True if value exists
 */
function hasValue(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === "string" && trim(value).length === 0) return false;
    if (typeof value === "object" && Object.keys(value).length === 0) return false;
    return true;
}

/**
 * Validates required parameters for functions
 * @param {object} params - Object with parameter values
 * @param {array} required - Array of required parameter names
 * @returns {object} Validation result with success and missing fields
 */
function validateRequired(params, required) {
    var missing = [];
    
    for (var i = 0; i < required.length; i++) {
        var paramName = required[i];
        if (!hasValue(params[paramName])) {
            missing.push(paramName);
        }
    }
    
    return {
        success: missing.length === 0,
        missing: missing,
        message: missing.length > 0 ? "Missing required parameters: " + missing.join(", ") : ""
    };
}

/**
 * Validates email address format (basic validation)
 * @param {string} email - Email to validate
 * @returns {boolean} True if email format is valid
 */
function isValidEmail(email) {
    if (!email || typeof email !== "string") return false;
    
    var cleanEmail = trim(email);
    
    // Basic email validation
    return cleanEmail.indexOf("@") > 0 && 
           cleanEmail.indexOf(".") > cleanEmail.indexOf("@") &&
           cleanEmail.length > 5 &&
           cleanEmail.length < 255;
}

// === OBJECT UTILITIES ===

/**
 * Safely gets a nested property from an object
 * @param {object} obj - Object to search
 * @param {string} path - Dot notation path (e.g., "user.profile.name")
 * @param {*} defaultValue - Default value if property not found
 * @returns {*} Property value or default
 */
function getNestedProperty(obj, path, defaultValue) {
    if (!obj || !path) return defaultValue;
    
    var keys = path.split('.');
    var current = obj;
    
    for (var i = 0; i < keys.length; i++) {
        if (current[keys[i]] === null || current[keys[i]] === undefined) {
            return defaultValue;
        }
        current = current[keys[i]];
    }
    
    return current;
}

/**
 * Creates a safe copy of an object with only specified properties
 * @param {object} obj - Source object
 * @param {array} allowedProps - Array of allowed property names
 * @returns {object} Filtered object
 */
function filterObject(obj, allowedProps) {
    if (!obj || !allowedProps) return {};
    
    var filtered = {};
    for (var i = 0; i < allowedProps.length; i++) {
        var prop = allowedProps[i];
        if (obj[prop] !== undefined) {
            filtered[prop] = obj[prop];
        }
    }
    
    return filtered;
}

// === ARRAY UTILITIES ===

/**
 * Safely converts a value to array
 * @param {*} value - Value to convert
 * @returns {array} Array representation
 */
function ensureArray(value) {
    if (!value) return [];
    if (typeof value === "string") return [value];
    if (value.length !== undefined) return value; // Already array-like
    return [value];
}

/**
 * Removes duplicate values from array (primitive values only)
 * @param {array} arr - Array to deduplicate
 * @returns {array} Array without duplicates
 */
function removeDuplicates(arr) {
    if (!arr || arr.length === undefined) return [];
    
    var unique = [];
    for (var i = 0; i < arr.length; i++) {
        var found = false;
        for (var j = 0; j < unique.length; j++) {
            if (unique[j] === arr[i]) {
                found = true;
                break;
            }
        }
        if (!found) {
            unique.push(arr[i]);
        }
    }
    
    return unique;
}

// === HTTP UTILITIES ===

/**
 * Generic HTTP request wrapper with consistent error handling
 * @param {string} method - HTTP method (GET, POST, PATCH, etc.)
 * @param {string} url - Request URL
 * @param {object} options - Request options
 * @returns {object} Standardized response object
 */
function httpRequest(method, url, options) {
    options = options || {};
    
    try {
        var request = new Script.Util.HttpRequest(url);
        request.method = method.toUpperCase();
        request.encoding = "UTF-8";
        
        // Set headers
        if (options.headers) {
            for (var header in options.headers) {
                request.setHeader(header, options.headers[header]);
            }
        }
        
        // Set content type
        if (options.contentType) {
            request.contentType = options.contentType;
        }
        
        // Set body for POST/PATCH requests
        if (options.data) {
            request.postData = typeof options.data === "string" ? options.data : Stringify(options.data);
        }
        
        var response = request.send();
        
        if (response && response.content) {
            var content = String(response.content);
            return {
                success: true,
                content: content,
                parsed: tryParseJSON(content)
            };
        } else {
            return {
                success: false,
                error: "No content in response"
            };
        }
        
    } catch (error) {
        return {
            success: false,
            error: String(error)
        };
    }
}

// === JSON UTILITIES ===

/**
 * Safely parses JSON without throwing errors
 * @param {string} jsonString - JSON string to parse
 * @returns {object|null} Parsed object or null if invalid
 */
function tryParseJSON(jsonString) {
    try {
        if (!jsonString) return null;
        return Platform.Function.ParseJSON(String(jsonString));
    } catch (error) {
        return null;
    }
}

/**
 * Safely stringifies an object
 * @param {*} obj - Object to stringify
 * @returns {string} JSON string or empty string if failed
 */
function safeStringify(obj) {
    try {
        if (obj === null || obj === undefined) return "";
        return Stringify(obj);
    } catch (error) {
        return "";
    }
}

// === LOGGING UTILITIES ===

/**
 * Structured logging with consistent format
 * @param {string} level - Log level (INFO, WARN, ERROR, SUCCESS)
 * @param {string} message - Log message
 * @param {*} data - Optional data to include
 */
function log(level, message, data) {
    var icon = {
        "INFO": "ℹ️",
        "WARN": "⚠️", 
        "ERROR": "❌",
        "SUCCESS": "✅",
        "DEBUG": "🔧"
    }[level.toUpperCase()] || "📝";
    
    var logMessage = "<p>" + icon + " " + message;
    
    if (data) {
        logMessage += " | Data: " + safeString(data);
    }
    
    logMessage += "</p>";
    Write(logMessage);
}

/**
 * Logs execution time for performance monitoring
 * @param {string} operation - Operation name
 * @param {function} func - Function to execute and time
 * @returns {*} Function result
 */
function timeExecution(operation, func) {
    var startTime = new Date().getTime();
    log("DEBUG", "Starting: " + operation);
    
    try {
        var result = func();
        var endTime = new Date().getTime();
        var duration = endTime - startTime;
        
        log("SUCCESS", "Completed: " + operation + " (" + duration + "ms)");
        return result;
        
    } catch (error) {
        var endTime = new Date().getTime();
        var duration = endTime - startTime;
        
        log("ERROR", "Failed: " + operation + " (" + duration + "ms)", String(error));
        throw error;
    }
}

// === DATE UTILITIES ===

/**
 * Gets current timestamp in a readable format
 * @returns {string} Formatted timestamp
 */
function getTimestamp() {
    var now = new Date();
    return now.getFullYear() + "-" + 
           String(now.getMonth() + 1).padStart(2, '0') + "-" + 
           String(now.getDate()).padStart(2, '0') + " " +
           String(now.getHours()).padStart(2, '0') + ":" + 
           String(now.getMinutes()).padStart(2, '0') + ":" + 
           String(now.getSeconds()).padStart(2, '0');
}

// === ERROR HANDLING UTILITIES ===

/**
 * Wraps a function with error handling and logging
 * @param {function} func - Function to wrap
 * @param {string} context - Context for error logging
 * @returns {function} Wrapped function
 */
function withErrorHandling(func, context) {
    return function() {
        try {
            return func.apply(this, arguments);
        } catch (error) {
            log("ERROR", "Error in " + context + ": " + String(error));
            return null;
        }
    };
}
</script>

//===================================


try {
    var token = getAccessToken(clientId, clientSecret, AccountId, subdomain);
    if (!token) {
        Write("<p>❌ No se pudo obtener el token de acceso.</p>");
        return;
    }

    var vaultConfig = {
        baseUrl: "https://" + vaultDNS,
        version: vaultVersion,
        username: vaultUsername,
        password: vaultPassword
    };
    
    var authResult = authenticateVeeva(vaultConfig);
    
    if (!authResult.success) {
        Write("<p>❌ No se pudo autenticar con Veeva Vault.</p>");
        if (authResult.error) {
            Write("<p>Error: " + authResult.error + "</p>");
        }
        return;
    }
    
    var vaultSessionId = authResult.sessionId;
    var dataArray = queryVaultDocuments(vaultDNS, vaultVersion, vaultSessionId);
   
    if (dataArray.length === 0) {
        Write("<p>⚠️ No se encontraron documentos.</p>");
        return;
    }

    Write("<p>Procesando documentos...</p><ul>");
    for (var i = 0; i < dataArray.length; i++) {
        var doc = dataArray[i];
        var docId = doc.id;
        var status = doc.status__v;
        var name = doc.name__v + " [" + docId + "]";
        var customerKey = "EmailVV-" + docId;
        var folderId = getStatusToFolderId(status);  // CAMBIO: Usar la función correcta
        try {
            var html = getVaultHTML(docId, vaultDNS, vaultVersion, vaultSessionId);
            if (!html || html.length === 0) {
                Write("<li>⚠️ Documento ID " + docId + " no tiene HTML válido.</li>");
                continue;
            }
            var meta = extractSubjectAndPreheader(html);
            Write("<li>📧 Procesando: " + name + " | Subject: " + meta.subject + "</li>");
                upsertEmail(token, html, name, customerKey, folderId, subdomain, meta.subject, meta.preheader);

        } catch (innerErr) {
            Write("<li>❌ Error al procesar documento ID  " + docId + ": " + String(innerErr) + "</li>");
        }
    }
    Write("</ul>");
} catch (e) {
    Write("<p>❌ Error general al ejecutar el flujo: " + String(e) + "</p>");
}
</script>