<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * CreateCredentialsDE - Creates the OMG_FW_Credentials Data Extension
 *
 * This script creates the Data Extension required by CredentialStore module.
 * Run this ONCE in SFMC to set up the credential storage.
 *
 * @version 1.0.0
 */

Write('<h2>Creating OMG_FW_Credentials Data Extension</h2>');

try {
    var api = new Script.Util.WSProxy();

    // Define the Data Extension structure
    var config = {
        Name: "OMG_FW_Credentials",
        CustomerKey: "OMG_FW_Credentials",
        Description: "OmegaFramework - Encrypted credential storage for API integrations",
        IsSendable: false,
        IsTestable: false,
        CategoryID: 0, // Root folder - change if needed
        Fields: [
            // Primary Key
            {
                Name: "Name",
                FieldType: "Text",
                MaxLength: 100,
                IsRequired: true,
                IsPrimaryKey: true
            },
            // Metadata
            {
                Name: "Description",
                FieldType: "Text",
                MaxLength: 500,
                IsRequired: false
            },
            {
                Name: "AuthType",
                FieldType: "Text",
                MaxLength: 50,
                IsRequired: true,
                DefaultValue: "OAuth2"
            },
            {
                Name: "Platform",
                FieldType: "Text",
                MaxLength: 100,
                IsRequired: false
            },
            {
                Name: "IsActive",
                FieldType: "Boolean",
                IsRequired: true,
                DefaultValue: "true"
            },
            // Common fields
            {
                Name: "BaseUrl",
                FieldType: "Text",
                MaxLength: 500,
                IsRequired: false
            },
            {
                Name: "Domain",
                FieldType: "Text",
                MaxLength: 200,
                IsRequired: false
            },
            // OAuth2 fields
            {
                Name: "ClientId",
                FieldType: "Text",
                MaxLength: 1000,
                IsRequired: false
            },
            {
                Name: "ClientSecret",
                FieldType: "Text",
                MaxLength: 1000,
                IsRequired: false
            },
            {
                Name: "AuthUrl",
                FieldType: "Text",
                MaxLength: 500,
                IsRequired: false
            },
            {
                Name: "TokenEndpoint",
                FieldType: "Text",
                MaxLength: 500,
                IsRequired: false
            },
            {
                Name: "GrantType",
                FieldType: "Text",
                MaxLength: 50,
                IsRequired: false,
                DefaultValue: "client_credentials"
            },
            {
                Name: "Scope",
                FieldType: "Text",
                MaxLength: 500,
                IsRequired: false
            },
            // Basic Auth fields
            {
                Name: "Username",
                FieldType: "Text",
                MaxLength: 1000,
                IsRequired: false
            },
            {
                Name: "Password",
                FieldType: "Text",
                MaxLength: 1000,
                IsRequired: false
            },
            // Bearer Token fields
            {
                Name: "StaticToken",
                FieldType: "Text",
                MaxLength: 2000,
                IsRequired: false
            },
            // ApiKey fields
            {
                Name: "ApiKey",
                FieldType: "Text",
                MaxLength: 1000,
                IsRequired: false
            },
            {
                Name: "ApiSecret",
                FieldType: "Text",
                MaxLength: 1000,
                IsRequired: false
            },
            // Custom fields (for future extensibility)
            {
                Name: "CustomField1",
                FieldType: "Text",
                MaxLength: 500,
                IsRequired: false
            },
            {
                Name: "CustomField2",
                FieldType: "Text",
                MaxLength: 500,
                IsRequired: false
            },
            {
                Name: "CustomField3",
                FieldType: "Text",
                MaxLength: 500,
                IsRequired: false
            },
            // Audit fields
            {
                Name: "CreatedAt",
                FieldType: "Date",
                IsRequired: false
            },
            {
                Name: "UpdatedAt",
                FieldType: "Date",
                IsRequired: false
            },
            {
                Name: "CreatedBy",
                FieldType: "Text",
                MaxLength: 100,
                IsRequired: false
            }
        ]
    };

    Write('<p>Attempting to create Data Extension...</p>');

    // Create the Data Extension
    var result = api.createItem("DataExtension", config);

    if (result.Status === "OK") {
        Write('<div style="padding: 15px; background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; border-radius: 4px; margin: 10px 0;">');
        Write('<h3 style="margin-top: 0;">✓ SUCCESS</h3>');
        Write('<p><strong>Data Extension created successfully!</strong></p>');
        Write('<p>Name: OMG_FW_Credentials</p>');
        Write('<p>Customer Key: OMG_FW_Credentials</p>');
        Write('<p>Total Fields: ' + config.Fields.length + '</p>');
        Write('</div>');

        Write('<h3>Next Steps:</h3>');
        Write('<ol>');
        Write('<li>Ensure Platform Variables are created in Key Management:<ul>');
        Write('<li><strong>Sym_Cred</strong> (Password/Key type)</li>');
        Write('<li><strong>Salt_Cred</strong> (Salt type)</li>');
        Write('<li><strong>IV_Cred</strong> (Initialization Vector type)</li>');
        Write('</ul></li>');
        Write('<li>Run Test_CredentialStore.ssjs to verify the setup</li>');
        Write('</ol>');

    } else if (result.Status === "Error") {
        Write('<div style="padding: 15px; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px; margin: 10px 0;">');
        Write('<h3 style="margin-top: 0;">✗ ERROR</h3>');

        // Check if error is because DE already exists
        if (result.StatusMessage && result.StatusMessage.indexOf('already exists') > -1) {
            Write('<p><strong>Data Extension already exists!</strong></p>');
            Write('<p>This is not necessarily a problem. The DE may have been created previously.</p>');
            Write('<p>Status Message: ' + result.StatusMessage + '</p>');

            Write('<h4>Verification Steps:</h4>');
            Write('<ol>');
            Write('<li>Go to Email Studio > Email > Data Extensions</li>');
            Write('<li>Search for "OMG_FW_Credentials"</li>');
            Write('<li>Verify it has all required fields (see field list below)</li>');
            Write('</ol>');
        } else {
            Write('<p><strong>Failed to create Data Extension</strong></p>');
            Write('<p>Status: ' + result.Status + '</p>');
            Write('<p>Message: ' + result.StatusMessage + '</p>');
        }

        Write('</div>');
    }

    // Display full result for debugging
    Write('<h3>Full API Response:</h3>');
    Write('<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; overflow: auto;">');
    Write(Stringify(result, null, 2));
    Write('</pre>');

    // Display field list for reference
    Write('<h3>Expected Field Structure:</h3>');
    Write('<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">');
    Write('<tr style="background-color: #f2f2f2;"><th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Field Name</th><th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Type</th><th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Max Length</th><th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Required</th></tr>');

    for (var i = 0; i < config.Fields.length; i++) {
        var field = config.Fields[i];
        var isPK = field.IsPrimaryKey ? ' (PK)' : '';
        Write('<tr>');
        Write('<td style="border: 1px solid #ddd; padding: 8px;"><strong>' + field.Name + isPK + '</strong></td>');
        Write('<td style="border: 1px solid #ddd; padding: 8px;">' + field.FieldType + '</td>');
        Write('<td style="border: 1px solid #ddd; padding: 8px;">' + (field.MaxLength || '-') + '</td>');
        Write('<td style="border: 1px solid #ddd; padding: 8px;">' + (field.IsRequired ? 'Yes' : 'No') + '</td>');
        Write('</tr>');
    }
    Write('</table>');

} catch (ex) {
    Write('<div style="padding: 15px; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px; margin: 10px 0;">');
    Write('<h3 style="margin-top: 0;">✗ EXCEPTION</h3>');
    Write('<p><strong>An error occurred:</strong></p>');
    Write('<p>Message: ' + (ex.message || ex.toString() || 'Unknown error') + '</p>');
    Write('<p>Type: ' + (typeof ex) + '</p>');
    Write('</div>');

    Write('<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px;">');
    Write(Stringify(ex, null, 2));
    Write('</pre>');

    if (ex.stack) {
        Write('<h4>Stack Trace:</h4>');
        Write('<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px;">');
        Write(ex.stack);
        Write('</pre>');
    }
}

</script>
