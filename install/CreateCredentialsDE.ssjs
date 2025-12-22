<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * CreateCredentialsDE - Creates or Updates the OMG_FW_Credentials Data Extension
 *
 * This script ensures the Data Extension required by CredentialStore module exists
 * and has all the necessary fields.
 *
 * @version 1.1.2
 * @update Added CustomerKey to fields per official documentation for better SOAP compliance
 */

Write('<h2>Creating or Updating OMG_FW_Credentials Data Extension</h2>');

try {
    var api = new Script.Util.WSProxy();

    // Define the Data Extension structure
    var config = {
        Name: "OMG_FW_Credentials",
        CustomerKey: "OMG_FW_Credentials",
        Description: "OmegaFramework - Encrypted credential storage for API integrations",
        IsSendable: false,
        IsTestable: false,
        // CategoryID: If not specified, it defaults to the root "Data Extensions" folder
        Fields: [
            // Primary Key
            {
                Name: "Name",
                CustomerKey: "Name",
                FieldType: "Text",
                MaxLength: 100,
                IsRequired: true,
                IsPrimaryKey: true
            },
            // Metadata
            {
                Name: "Description",
                CustomerKey: "Description",
                FieldType: "Text",
                MaxLength: 500,
                IsRequired: false
            },
            {
                Name: "AuthType",
                CustomerKey: "AuthType",
                FieldType: "Text",
                MaxLength: 50,
                IsRequired: true,
                DefaultValue: "OAuth2"
            },
            {
                Name: "Platform",
                CustomerKey: "Platform",
                FieldType: "Text",
                MaxLength: 100,
                IsRequired: false
            },
            {
                Name: "IsActive",
                CustomerKey: "IsActive",
                FieldType: "Boolean",
                IsRequired: true,
                DefaultValue: "true"
            },
            // Common fields
            {
                Name: "BaseUrl",
                CustomerKey: "BaseUrl",
                FieldType: "Text",
                MaxLength: 500,
                IsRequired: false
            },
            {
                Name: "Domain",
                CustomerKey: "Domain",
                FieldType: "Text",
                MaxLength: 200,
                IsRequired: false
            },
            // OAuth2 fields
            {
                Name: "ClientId",
                CustomerKey: "ClientId",
                FieldType: "Text",
                MaxLength: 1000,
                IsRequired: false
            },
            {
                Name: "ClientSecret",
                CustomerKey: "ClientSecret",
                FieldType: "Text",
                MaxLength: 1000,
                IsRequired: false
            },
            {
                Name: "AuthUrl",
                CustomerKey: "AuthUrl",
                FieldType: "Text",
                MaxLength: 500,
                IsRequired: false
            },
            {
                Name: "TokenEndpoint",
                CustomerKey: "TokenEndpoint",
                FieldType: "Text",
                MaxLength: 500,
                IsRequired: false
            },
            {
                Name: "GrantType",
                CustomerKey: "GrantType",
                FieldType: "Text",
                MaxLength: 50,
                IsRequired: false,
                DefaultValue: "client_credentials"
            },
            {
                Name: "Scope",
                CustomerKey: "Scope",
                FieldType: "Text",
                MaxLength: 500,
                IsRequired: false
            },
            // Basic Auth fields
            {
                Name: "Username",
                CustomerKey: "Username",
                FieldType: "Text",
                MaxLength: 1000,
                IsRequired: false
            },
            {
                Name: "Password",
                CustomerKey: "Password",
                FieldType: "Text",
                MaxLength: 1000,
                IsRequired: false
            },
            // Bearer Token fields
            {
                Name: "StaticToken",
                CustomerKey: "StaticToken",
                FieldType: "Text",
                MaxLength: 2000,
                IsRequired: false
            },
            // ApiKey fields
            {
                Name: "ApiKey",
                CustomerKey: "ApiKey",
                FieldType: "Text",
                MaxLength: 1000,
                IsRequired: false
            },
            {
                Name: "ApiSecret",
                CustomerKey: "ApiSecret",
                FieldType: "Text",
                MaxLength: 1000,
                IsRequired: false
            },
            // Platform-specific fields
            {
                Name: "MID",
                CustomerKey: "MID",
                FieldType: "Text",
                MaxLength: 50,
                IsRequired: false
            },
            {
                Name: "SecurityToken",
                CustomerKey: "SecurityToken",
                FieldType: "Text",
                MaxLength: 1000,
                IsRequired: false
            },
            {
                Name: "ApiVersion",
                CustomerKey: "ApiVersion",
                FieldType: "Text",
                MaxLength: 50,
                IsRequired: false
            },
            // Custom fields (for future extensibility)
            {
                Name: "CustomField1",
                CustomerKey: "CustomField1",
                FieldType: "Text",
                MaxLength: 500,
                IsRequired: false
            },
            {
                Name: "CustomField2",
                CustomerKey: "CustomField2",
                FieldType: "Text",
                MaxLength: 500,
                IsRequired: false
            },
            {
                Name: "CustomField3",
                CustomerKey: "CustomField3",
                FieldType: "Text",
                MaxLength: 500,
                IsRequired: false
            },
            // Audit fields
            {
                Name: "CreatedAt",
                CustomerKey: "CreatedAt",
                FieldType: "Date",
                IsRequired: false
            },
            {
                Name: "UpdatedAt",
                CustomerKey: "UpdatedAt",
                FieldType: "Date",
                IsRequired: false
            },
            {
                Name: "CreatedBy",
                CustomerKey: "CreatedBy",
                FieldType: "Text",
                MaxLength: 100,
                IsRequired: false
            }
        ]
    };

    Write('<p>Checking if Data Extension exists...</p>');

    // 1. Check existence
    var deReq = api.retrieve("DataExtension", ["CustomerKey", "Name"], {
        Property: "CustomerKey",
        SimpleOperator: "equals",
        Value: config.CustomerKey
    });

    var deExists = (deReq.Status == "OK" && deReq.Results.length > 0);

    if (deExists) {
        Write('<div style="padding: 15px; background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; border-radius: 4px; margin: 10px 0;">');
        Write('<h3 style="margin-top: 0;">ℹ INFO: Data Extension Exists</h3>');
        Write('<p>Scanning for missing fields...</p>');

        // 2. Get existing fields
        var existingFieldsReq = api.retrieve("DataExtensionField", ["Name"], {
            Property: "DataExtension.CustomerKey",
            SimpleOperator: "equals",
            Value: config.CustomerKey
        });

        var existingFieldNames = {};
        if (existingFieldsReq.Status == "OK" && existingFieldsReq.Results) {
            for (var k = 0; k < existingFieldsReq.Results.length; k++) {
                existingFieldNames[existingFieldsReq.Results[k].Name] = true;
            }
        }

        // 3. Add missing fields using Core Library
        var addedCount = 0;
        var errorCount = 0;
        var deObj = DataExtension.Init(config.CustomerKey);

        Write('<ul style="list-style-type: none; padding-left: 0;">');
        
        for (var i = 0; i < config.Fields.length; i++) {
            var fieldDef = config.Fields[i];
            
            if (!existingFieldNames[fieldDef.Name]) {
                try {
                    var newFieldConfig = {
                        Name: fieldDef.Name,
                        CustomerKey: fieldDef.CustomerKey,
                        FieldType: fieldDef.FieldType,
                        IsRequired: fieldDef.IsRequired
                    };
                    
                    if (fieldDef.MaxLength) newFieldConfig.MaxLength = fieldDef.MaxLength;
                    if (fieldDef.DefaultValue) newFieldConfig.DefaultValue = fieldDef.DefaultValue;

                    var addRes = deObj.Fields.Add(newFieldConfig);
                    
                    if (addRes) {
                        Write('<li><span style="color:green">✓ Added field: <strong>' + fieldDef.Name + '</strong></span></li>');
                        addedCount++;
                    } else {
                         Write('<li><span style="color:red">✗ Failed to add field: <strong>' + fieldDef.Name + '</strong></span></li>');
                         errorCount++;
                    }

                } catch (err) {
                    Write('<li><span style="color:red">✗ Failed to add field: <strong>' + fieldDef.Name + '</strong>. Error: ' + (err.message || Stringify(err)) + '</span></li>');
                    errorCount++;
                }
            }
        }
        Write('</ul>');

        if (addedCount === 0 && errorCount === 0) {
            Write('<p>✓ All standard fields are present. No changes made.</p>');
        } else {
            Write('<p><strong>Update Summary:</strong> ' + addedCount + ' fields added, ' + errorCount + ' errors.</p>');
        }
        
        Write('</div>');

    } else {
        // 4. Create New Logic
        Write('<p>Data Extension not found. Creating new...</p>');
        
        var result = api.createItem("DataExtension", config);

        if (result.Status === "OK") {
            Write('<div style="padding: 15px; background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; border-radius: 4px; margin: 10px 0;">');
            Write('<h3 style="margin-top: 0;">✓ SUCCESS</h3>');
            Write('<p><strong>Data Extension created successfully!</strong></p>');
            Write('<p>Name: ' + config.Name + '</p>');
            Write('<p>Customer Key: ' + config.CustomerKey + '</p>');
            Write('</div>');
        } else {
            Write('<div style="padding: 15px; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px; margin: 10px 0;">');
            Write('<h3 style="margin-top: 0;">✗ ERROR</h3>');
            Write('<p><strong>Failed to create Data Extension</strong></p>');
            Write('<p>Status: ' + result.Status + '</p>');
            Write('<p>Message: ' + result.StatusMessage + '</p>');
            Write('</div>');
        }
    }

    Write('<h3>Next Steps:</h3>');
    Write('<ol>');
    Write('<li>Ensure Platform Variables are created in Key Management (Sym_Cred, Salt_Cred, IV_Cred)</li>');
    Write('<li>Run Test_CredentialStore.ssjs to verify the setup</li>');
    Write('</ol>');

} catch (ex) {
    Write('<div style="padding: 15px; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px; margin: 10px 0;">');
    Write('<h3 style="margin-top: 0;">✗ EXCEPTION</h3>');
    Write('<p>Message: ' + (ex.message || ex.toString() || 'Unknown error') + '</p>');
    Write('</div>');
}
</script>