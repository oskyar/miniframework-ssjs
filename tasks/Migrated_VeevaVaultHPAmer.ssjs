%%[
    /*
        SCRIPT: Migrated_VeevaVaultHPAmer.ssjs
        DESCRIPTION: 
            This script retrieves document data from Veeva Vault using a VQL query
            and upserts it into an SFMC Data Extension.
            It is built using the Omega Framework, which handles all authentication,
            API communication, and data extension operations.
        FRAMEWORK VERSION: 2.0
        AUTHOR: Gemini
    */
]%%
<script runat="server">
    Platform.Load("core", "1.1.1");

    // ===================================================================================
    // 1. LOAD OMEGA FRAMEWORK
    // ===================================================================================
    // This single call loads the entire framework and its dependencies.
    var frameworkLoaded = Platform.Function.ContentBlockByKey("OMG_OmegaFramework");

</script>
<script runat="server">

    // Write("\nFramework Loaded. Initializing script...\n");

    try {
        // ===================================================================================
        // 2. INSTANTIATE INTEGRATIONS
        // ===================================================================================
        // Create instances of each integration using the correct 'create' method.
        // The framework will use the credentialName to securely fetch credentials
        // from the OMG_FW_CredentialStore Data Extension.

        // VeevaVault Integration
        var veeva = OmegaFramework.create('VeevaVaultIntegration', {
            credentialName: "VeevaVaultTestAmerHP"
        });

        // SFMC Integration
        var sfmc = OmegaFramework.create('SFMCIntegration', {
            credentialName: "SFMC_VeevaVaultTestAmerHP"
        });

        // DataExtension Handler - MUST be instantiated separately
        var deHandler = OmegaFramework.create('DataExtensionHandler', {});

        // ===================================================================================
        // 3. DEFINE VEEVA QUERY AND DATA EXTENSION KEY
        // ===================================================================================
        var VQL_QUERY = "SELECT id, hp_amer_custom_id__c, name__v, created_date__v, last_modified_date__v FROM documents WHERE status__v = 'Approved'";
        var DE_KEY = "Veeva_HP_Amer_Master";
        
        // Write("Configuration complete. Querying Veeva Vault...\n");

        // ===================================================================================
        // 4. EXECUTE VEEVA VAULT QUERY
        // ===================================================================================
        // The framework handles the entire authentication flow (session ID) automatically.
        var veevaResult = veeva.query(VQL_QUERY);

        if (veevaResult.success && veevaResult.data && veevaResult.data.responseStatus == "SUCCESS") {

            var documents = veevaResult.data.data;
            Write("Successfully retrieved " + documents.length + " documents from Veeva Vault.\n");

            if (documents.length > 0) {
                // ===================================================================================
                // 5. TRANSFORM DATA FOR SFMC
                // ===================================================================================
                // Map the fields from the Veeva response to the Data Extension columns.
                var rowsToUpsert = [];
                for (var i = 0; i < documents.length; i++) {
                    var doc = documents[i];
                    rowsToUpsert.push({
                        "Id": doc.id,
                        "HP_Amer_Custom_Id__c": doc.hp_amer_custom_id__c,
                        "Name__v": doc.name__v,
                        "CreatedDate": doc.created_date__v,
                        "LastModifiedDate": doc.last_modified_date__v
                    });
                }

                // Write("Data transformation complete. Upserting " + rowsToUpsert.length + " rows to Data Extension: " + DE_KEY + "\n");

                // ===================================================================================
                // 6. UPSERT DATA INTO SFMC DATA EXTENSION
                // ===================================================================================
                // Use the separately instantiated DataExtensionHandler and its 'upsert' method.
                var upsertResult = deHandler.upsert(DE_KEY, rowsToUpsert);

                if (upsertResult.success) {
                    Write("Successfully upserted " + rowsToUpsert.length + " rows into '" + DE_KEY + "'.\n");
                } else {
                    // Write detailed error if the upsert operation failed
                    Write("Error upserting rows into Data Extension. Details: " + Stringify(upsertResult.error) + "\n");
                }
            }

        } else {
            // Write detailed error if the Veeva query failed
            Write("Error retrieving data from Veeva Vault. Details: " + Stringify(veevaResult.error) + "\n");
        }

    } catch (e) {
        // Catch any critical script errors
        Write("A critical error occurred: " + Stringify(e) + "\n");
    }

</script>
