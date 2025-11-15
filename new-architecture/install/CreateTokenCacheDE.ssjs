<script runat="server">
Platform.Load("core", "1.1.1");

/**
 * CreateTokenCacheDE - Installer for OmegaFramework Token Cache Data Extension
 *
 * This script creates the Data Extension required for persistent token caching
 * using SFMC's native SSJS DataExtension.Add() method.
 *
 * Run this ONCE during framework installation.
 *
 * Data Extension: OMG_FW_TokenCache
 * Purpose: Store OAuth2 tokens across script executions
 *
 * @version 2.0.0
 * @author OmegaFramework
 */

Write('<h1>OmegaFramework Token Cache Data Extension Installer</h1>');
Write('<hr>');

// Data Extension configuration
var deName = 'OMG_FW_TokenCache';
var deCustomerKey = 'OMG_FW_TokenCache';

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
            "Description": "OmegaFramework OAuth2 token cache for cross-execution token persistence. DO NOT DELETE.",
            "Fields": [
                {
                    "Name": "CacheKey",
                    "FieldType": "Text",
                    "MaxLength": 200,
                    "IsPrimaryKey": true,
                    "IsRequired": true
                },
                {
                    "Name": "AccessToken",
                    "FieldType": "Text",
                    "MaxLength": 500,
                    "IsRequired": true
                },
                {
                    "Name": "TokenType",
                    "FieldType": "Text",
                    "MaxLength": 50,
                    "DefaultValue": "Bearer"
                },
                {
                    "Name": "ExpiresIn",
                    "FieldType": "Number",
                    "DefaultValue": 3600
                },
                {
                    "Name": "ObtainedAt",
                    "FieldType": "Number",
                    "IsRequired": true
                },
                {
                    "Name": "Scope",
                    "FieldType": "Text",
                    "MaxLength": 500
                },
                {
                    "Name": "RestInstanceUrl",
                    "FieldType": "Text",
                    "MaxLength": 200
                },
                {
                    "Name": "SoapInstanceUrl",
                    "FieldType": "Text",
                    "MaxLength": 200
                },
                {
                    "Name": "UpdatedAt",
                    "FieldType": "Date"
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
        Write('<li>Start using OmegaFramework integrations - tokens will be automatically cached</li>');
        Write('</ol>');

        Write('<div style="margin-top: 20px; padding: 15px; background-color: #d4edda; border-left: 4px solid #28a745;">');
        Write('<strong>✓ Installation Complete!</strong><br>');
        Write('The token cache Data Extension is ready to use.<br>');
        Write('You can now use OAuth2AuthStrategy with automatic token caching.');
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
        Write('<tr style="background-color: #f0f0f0;"><th>Field Name</th><th>Field Type</th><th>Length</th><th>Primary Key</th><th>Required</th><th>Default Value</th></tr>');
        Write('<tr><td>CacheKey</td><td>Text</td><td>200</td><td>✓</td><td>✓</td><td>-</td></tr>');
        Write('<tr><td>AccessToken</td><td>Text</td><td>500</td><td></td><td>✓</td><td>-</td></tr>');
        Write('<tr><td>TokenType</td><td>Text</td><td>50</td><td></td><td></td><td>Bearer</td></tr>');
        Write('<tr><td>ExpiresIn</td><td>Number</td><td>-</td><td></td><td></td><td>3600</td></tr>');
        Write('<tr><td>ObtainedAt</td><td>Number</td><td>-</td><td></td><td>✓</td><td>-</td></tr>');
        Write('<tr><td>Scope</td><td>Text</td><td>500</td><td></td><td></td><td>-</td></tr>');
        Write('<tr><td>RestInstanceUrl</td><td>Text</td><td>200</td><td></td><td></td><td>-</td></tr>');
        Write('<tr><td>SoapInstanceUrl</td><td>Text</td><td>200</td><td></td><td></td><td>-</td></tr>');
        Write('<tr><td>UpdatedAt</td><td>Date</td><td>-</td><td></td><td></td><td>-</td></tr>');
        Write('</table>');

        Write('<div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">');
        Write('<strong>Note:</strong> The Data Extension must be created before using OAuth2AuthStrategy with token caching.<br>');
        Write('Without this DE, token caching will fail and new tokens will be requested on every execution.');
        Write('</div>');
    }
}

Write('<hr>');
Write('<p><em>OmegaFramework v2.0 - Token Cache Data Extension Installer</em></p>');
Write('<p><small>Using SSJS DataExtension.Add() - No REST API credentials required</small></p>');

</script>
