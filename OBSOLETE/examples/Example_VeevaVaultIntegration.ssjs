%%=ContentBlockByKey("OMG_FW_ResponseWrapper")=%%
%%=ContentBlockByKey("OMG_FW_ConnectionHandler")=%%
%%=ContentBlockByKey("OMG_FW_OAuth2AuthStrategy")=%%
%%=ContentBlockByKey("OMG_FW_BaseIntegration")=%%
%%=ContentBlockByKey("OMG_FW_VeevaVaultIntegration")=%%

<script runat="server">
Platform.Load("core", "1.1.1");

// ============================================================================
// EXAMPLE: Veeva Vault Integration Usage
// ============================================================================

try {
    // Configuration for Veeva Vault
    var vaultConfig = {
        baseUrl: 'https://YOUR_VAULT.veevavault.com',
        apiVersion: 'v23.1',
        auth: {
            tokenUrl: 'https://YOUR_VAULT.veevavault.com/api/v23.1/auth',
            clientId: 'YOUR_CLIENT_ID',
            clientSecret: 'YOUR_CLIENT_SECRET',
            scope: 'openid'
        }
    };

    // Initialize Veeva Vault integration
    var vault = new VeevaVaultIntegration(vaultConfig);

    Write('<h2>Veeva Vault Integration Example</h2>');

    // Example 1: Get Vault Metadata
    Write('<h3>Example 1: Get Vault Metadata</h3>');
    var metadataResult = vault.getVaultMetadata();

    if (metadataResult.success) {
        Write('<p>✅ Metadata retrieved successfully</p>');
        Write('<pre>' + Stringify(metadataResult.data, null, 2) + '</pre>');
    } else {
        Write('<p>❌ Failed to get metadata</p>');
        Write('<pre>' + Stringify(metadataResult.error, null, 2) + '</pre>');
    }

    // Example 2: Execute VQL Query
    Write('<h3>Example 2: Execute VQL Query</h3>');
    var queryResult = vault.executeQuery('SELECT id, name__v, status__v FROM documents WHERE type__v = \'protocol__v\'');

    if (queryResult.success) {
        Write('<p>✅ Query executed successfully</p>');
        Write('<pre>' + Stringify(queryResult.data, null, 2) + '</pre>');
    } else {
        Write('<p>❌ Query failed</p>');
        Write('<pre>' + Stringify(queryResult.error, null, 2) + '</pre>');
    }

    // Example 3: Get Document
    Write('<h3>Example 3: Get Document by ID</h3>');
    var docResult = vault.getDocument('12345');

    if (docResult.success) {
        Write('<p>✅ Document retrieved successfully</p>');
        Write('<pre>' + Stringify(docResult.data, null, 2) + '</pre>');
    } else {
        Write('<p>❌ Failed to get document</p>');
        Write('<pre>' + Stringify(docResult.error, null, 2) + '</pre>');
    }

    // Example 4: Create Document
    Write('<h3>Example 4: Create New Document</h3>');
    var newDoc = {
        name__v: 'New Protocol Document',
        type__v: 'protocol__v',
        subtype__v: 'clinical_protocol__v',
        classification__v: 'draft__v',
        lifecycle__v: 'protocol_lifecycle__v',
        study__v: ['STUDY-001']
    };

    var createResult = vault.createDocument(newDoc);

    if (createResult.success) {
        Write('<p>✅ Document created successfully</p>');
        Write('<pre>' + Stringify(createResult.data, null, 2) + '</pre>');
    } else {
        Write('<p>❌ Failed to create document</p>');
        Write('<pre>' + Stringify(createResult.error, null, 2) + '</pre>');
    }

    Write('<hr>');
    Write('<p><strong>Note:</strong> Replace configuration values with your actual Veeva Vault credentials.</p>');

} catch (ex) {
    Write('<p style="color:red;">❌ ERROR: ' + ex.toString() + '</p>');
}

</script>
