<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * CreateCredentialsDE - Installer for OmegaFramework Credentials Data Extension
 *
 * This script creates the Data Extension required for storing encrypted API credentials
 * using SFMC's native SSJS DataExtension.Add() method.
 *
 * Run this ONCE during framework installation.
 *
 * Data Extension: OMG_FW_Credentials
 * Purpose: Store encrypted API credentials for multiple platforms and integrations
 *
 * Supported Platforms: SFMC, DataCloud, Veeva CRM, Veeva Vault, MDG
 * Supported Auth Types: OAuth2, Basic, Bearer, ApiKey
 *
 * @version 2.0.0
 * @author OmegaFramework
 */

Write('<h1>OmegaFramework Credentials Data Extension Installer</h1>');
Write('<hr>');

// Data Extension configuration
var deName = 'OMG_FW_Credentials';
var deCustomerKey = 'OMG_FW_Credentials';

// Step 1: Check if Data Extension already exists
Write('<h2>Step 1: Checking for existing Data Extension</h2>');

var prox = new Script.Util.WSProxy();

var props = ["CustomerKey", "Name"];
var filter = {
    Property: "CustomerKey",
    SimpleOperator: "equals",
    Value: deCustomerKey
};

var result = prox.retrieve("DataExtension", props, filter);

if (result && result.Results && result.Results.length > 0) {
    deExists = true;
} else {
    deExists = false;
}

if (deExists) {
    Write('<p style="color: orange;"><strong>⚠️ WARNING:</strong> Data Extension "' + deName + '" already exists!</p>');
    Write('<p>If you want to recreate it, please delete it manually first from Contact Builder → Data Extensions.</p>');
    Write('<p>Otherwise, you can use the existing one - no action needed.</p>');
} else {
    Write('<p style="color: green;">✓ Data Extension "' + deName + '" does not exist. Proceeding with creation...</p>');

    // Step 2: Create Data Extension using SSJS native method
    Write('<h2>Step 2: Creating Data Extension using SSJS</h2>');

    try {
        // Define Data Extension structure
        var deConfig = {
            "CustomerKey": deCustomerKey,
            "Name": deName,
            "Description": "OmegaFramework encrypted API credentials storage for multiple platforms. DO NOT DELETE.",
            "Fields": [
                // Primary Identifier
                {
                    "Name": "Name",
                    "FieldType": "Text",
                    "MaxLength": 50,
                    "IsPrimaryKey": true,
                    "IsRequired": true
                },
                {
                    "Name": "Description",
                    "FieldType": "Text",
                    "MaxLength": 500
                },
                // Configuration
                {
                    "Name": "AuthType",
                    "FieldType": "Text",
                    "MaxLength": 20,
                    "IsRequired": true
                },
                {
                    "Name": "Platform",
                    "FieldType": "Text",
                    "MaxLength": 50,
                    "IsRequired": false
                },
                {
                    "Name": "IsActive",
                    "FieldType": "Boolean",
                    "DefaultValue": "true"
                },
                // OAuth2 Credentials (Encrypted)
                {
                    "Name": "ClientId",
                    "FieldType": "Text",
                    "MaxLength": 500
                },
                {
                    "Name": "ClientSecret",
                    "FieldType": "Text",
                    "MaxLength": 500
                },
                // Basic Auth Credentials (Encrypted)
                {
                    "Name": "Username",
                    "FieldType": "Text",
                    "MaxLength": 500
                },
                {
                    "Name": "Password",
                    "FieldType": "Text",
                    "MaxLength": 500
                },
                // Bearer/ApiKey Credentials (Encrypted)
                {
                    "Name": "StaticToken",
                    "FieldType": "Text",
                    "MaxLength": 1000
                },
                {
                    "Name": "ApiKey",
                    "FieldType": "Text",
                    "MaxLength": 500
                },
                {
                    "Name": "ApiSecret",
                    "FieldType": "Text",
                    "MaxLength": 500
                },
                // OAuth2 Configuration (Not Encrypted)
                {
                    "Name": "AuthUrl",
                    "FieldType": "Text",
                    "MaxLength": 250
                },
                {
                    "Name": "TokenEndpoint",
                    "FieldType": "Text",
                    "MaxLength": 250
                },
                {
                    "Name": "GrantType",
                    "FieldType": "Text",
                    "MaxLength": 50,
                    "DefaultValue": "client_credentials"
                },
                {
                    "Name": "Scope",
                    "FieldType": "Text",
                    "MaxLength": 500
                },
                // API Endpoints (Not Encrypted)
                {
                    "Name": "BaseUrl",
                    "FieldType": "Text",
                    "MaxLength": 250
                },
                {
                    "Name": "Domain",
                    "FieldType": "Text",
                    "MaxLength": 250
                },
                // SFMC-Specific Fields
                {
                    "Name": "MID",
                    "FieldType": "Text",
                    "MaxLength": 50
                },
                // Custom Fields for Extensibility
                {
                    "Name": "CustomField1",
                    "FieldType": "Text",
                    "MaxLength": 500
                },
                {
                    "Name": "CustomField2",
                    "FieldType": "Text",
                    "MaxLength": 500
                },
                {
                    "Name": "CustomField3",
                    "FieldType": "Text",
                    "MaxLength": 500
                },
                // Audit Fields
                {
                    "Name": "CreatedAt",
                    "FieldType": "Date"
                },
                {
                    "Name": "UpdatedAt",
                    "FieldType": "Date"
                },
                {
                    "Name": "CreatedBy",
                    "FieldType": "Text",
                    "MaxLength": 100
                }
            ]
        };

        Write('<h3>Data Extension Configuration:</h3>');
        Write('<pre>' + Stringify(deConfig) + '</pre>');

        // Create the Data Extension
        Write('<p>Creating Data Extension...</p>');

        var newDE = DataExtension.Add(deConfig);

        Write('<h2 style="color: green;">✓ SUCCESS!</h2>');
        Write('<p>Data Extension "' + deName + '" has been created successfully.</p>');
        Write('<h3>Created Data Extension:</h3>');
        Write('<pre>' + Stringify(newDE) + '</pre>');

        Write('<h3>Next Steps:</h3>');
        Write('<ol>');
        Write('<li>Verify the Data Extension exists in Contact Builder → Data Extensions</li>');
        Write('<li>Search for: <strong>' + deName + '</strong></li>');
        Write('<li>Create Platform Variables for encryption:</li>');
        Write('<ul>');
        Write('<li><strong>Sym_Cred</strong> - Symmetric encryption key (AES 256-bit)</li>');
        Write('<li><strong>Salt_Cred</strong> - Salt for key derivation</li>');
        Write('<li><strong>IV_Cred</strong> - Initialization vector</li>');
        Write('</ul>');
        Write('<li>Use EncryptCredentials.html to add encrypted credentials</li>');
        Write('<li>Start using OmegaFramework integrations with CredentialStore</li>');
        Write('</ol>');

        Write('<div style="margin-top: 20px; padding: 15px; background-color: #d4edda; border-left: 4px solid #28a745;">');
        Write('<strong>✓ Installation Complete!</strong><br>');
        Write('The credentials Data Extension is ready to use.<br>');
        Write('Supported Platforms: SFMC, DataCloud, Veeva CRM, Veeva Vault, MDG<br>');
        Write('Supported Auth Types: OAuth2, Basic, Bearer, ApiKey');
        Write('</div>');

    } catch (ex) {
        Write('<h2 style="color: red;">✗ ERROR</h2>');
        Write('<p><strong>Failed to create Data Extension</strong></p>');
        Write('<p><strong>Error:</strong> ' + (ex.message || ex.toString()) + '</p>');

        Write('<h3>Troubleshooting:</h3>');
        Write('<ul>');
        Write('<li>Ensure you have permission to create Data Extensions</li>');
        Write('<li>Check if the Data Extension name is already in use</li>');
        Write('<li>Verify Platform.Load("core", "1.1.1") is supported in your SFMC instance</li>');
        Write('<li>Try the manual creation method below</li>');
        Write('</ul>');

        Write('<h3>Manual Creation Instructions:</h3>');
        Write('<p>If automated creation failed, create the Data Extension manually:</p>');
        Write('<ol>');
        Write('<li>Go to Contact Builder → Data Extensions → Create</li>');
        Write('<li>Choose "Standard Data Extension"</li>');
        Write('<li>Set Name and Customer Key to: <strong>' + deName + '</strong></li>');
        Write('<li>Add the following fields:</li>');
        Write('</ol>');

        Write('<table border="1" cellpadding="10" style="border-collapse: collapse; margin-top: 10px;">');
        Write('<tr style="background-color: #f0f0f0;"><th>Field Name</th><th>Field Type</th><th>Length</th><th>Primary Key</th><th>Required</th><th>Notes</th></tr>');
        Write('<tr><td>Name</td><td>Text</td><td>50</td><td>✓</td><td>✓</td><td>Integration identifier</td></tr>');
        Write('<tr><td>Description</td><td>Text</td><td>500</td><td></td><td></td><td>-</td></tr>');
        Write('<tr><td>AuthType</td><td>Text</td><td>20</td><td></td><td>✓</td><td>OAuth2, Basic, Bearer, ApiKey</td></tr>');
        Write('<tr><td>Platform</td><td>Text</td><td>50</td><td></td><td>✓</td><td>SFMC, DataCloud, Veeva, MDG</td></tr>');
        Write('<tr><td>IsActive</td><td>Boolean</td><td>-</td><td></td><td></td><td>Default: true</td></tr>');
        Write('<tr style="background-color: #fff3cd;"><td>ClientId</td><td>Text</td><td>500</td><td></td><td></td><td>ENCRYPTED</td></tr>');
        Write('<tr style="background-color: #fff3cd;"><td>ClientSecret</td><td>Text</td><td>500</td><td></td><td></td><td>ENCRYPTED</td></tr>');
        Write('<tr style="background-color: #fff3cd;"><td>Username</td><td>Text</td><td>500</td><td></td><td></td><td>ENCRYPTED</td></tr>');
        Write('<tr style="background-color: #fff3cd;"><td>Password</td><td>Text</td><td>500</td><td></td><td></td><td>ENCRYPTED</td></tr>');
        Write('<tr style="background-color: #fff3cd;"><td>StaticToken</td><td>Text</td><td>1000</td><td></td><td></td><td>ENCRYPTED</td></tr>');
        Write('<tr style="background-color: #fff3cd;"><td>ApiKey</td><td>Text</td><td>500</td><td></td><td></td><td>ENCRYPTED</td></tr>');
        Write('<tr style="background-color: #fff3cd;"><td>ApiSecret</td><td>Text</td><td>500</td><td></td><td></td><td>ENCRYPTED</td></tr>');
        Write('<tr><td>AuthUrl</td><td>Text</td><td>250</td><td></td><td></td><td>OAuth2 auth endpoint</td></tr>');
        Write('<tr><td>TokenEndpoint</td><td>Text</td><td>250</td><td></td><td></td><td>OAuth2 token endpoint</td></tr>');
        Write('<tr><td>GrantType</td><td>Text</td><td>50</td><td></td><td></td><td>Default: client_credentials</td></tr>');
        Write('<tr><td>Scope</td><td>Text</td><td>500</td><td></td><td></td><td>OAuth2 scope</td></tr>');
        Write('<tr><td>BaseUrl</td><td>Text</td><td>250</td><td></td><td></td><td>API base URL</td></tr>');
        Write('<tr><td>Domain</td><td>Text</td><td>250</td><td></td><td></td><td>-</td></tr>');
        Write('<tr><td>MID</td><td>Text</td><td>50</td><td></td><td></td><td>SFMC Business Unit MID (optional)</td></tr>');
        Write('<tr><td>CustomField1</td><td>Text</td><td>500</td><td></td><td></td><td>Extensibility</td></tr>');
        Write('<tr><td>CustomField2</td><td>Text</td><td>500</td><td></td><td></td><td>Extensibility</td></tr>');
        Write('<tr><td>CustomField3</td><td>Text</td><td>500</td><td></td><td></td><td>Extensibility</td></tr>');
        Write('<tr><td>CreatedAt</td><td>Date</td><td>-</td><td></td><td></td><td>-</td></tr>');
        Write('<tr><td>UpdatedAt</td><td>Date</td><td>-</td><td></td><td></td><td>-</td></tr>');
        Write('<tr><td>CreatedBy</td><td>Text</td><td>100</td><td></td><td></td><td>-</td></tr>');
        Write('</table>');

        Write('<div style="margin-top: 20px; padding: 15px; background-color: #f8d7da; border-left: 4px solid #dc3545;">');
        Write('<strong>IMPORTANT:</strong> Fields marked ENCRYPTED must be encrypted using EncryptSymmetric() before storage.<br>');
        Write('Create Platform Variables: Sym_Cred, Salt_Cred, IV_Cred for encryption keys.');
        Write('</div>');
    }
}

Write('<hr>');
Write('<p><em>OmegaFramework v2.0 - Credentials Data Extension Installer</em></p>');
Write('<p><small>Using SSJS DataExtension.Add() - No REST API credentials required</small></p>');

</script>