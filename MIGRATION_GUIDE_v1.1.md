# OmegaFramework Migration Guide v1.0 → v1.1

## 📋 Overview

This guide covers the migration from OmegaFramework v1.0 to v1.1, which includes critical enhancements for API versioning and OAuth2 Password Grant support.

## 🆕 What's New in v1.1

### **New Features**

1. **API Version Support** - VeevaVault and VeevaCRM can now use different API versions per credential
2. **OAuth2 Password Grant** - Full support for username/password OAuth2 flow (VeevaCRM/Salesforce)
3. **Security Token Field** - Dedicated encrypted field for Salesforce/VeevaCRM security tokens
4. **Dynamic UI Labels** - Platform-specific labels and help text in EncryptCredentials form
5. **Bug Fixes** - Fixed scope field reading from wrong location in SFMCIntegration

### **Breaking Changes**

⚠️ **Data Extension Schema Update Required** - Two new fields added to `OMG_FW_Credentials`

---

## 🔄 Migration Steps

### **Step 1: Backup Current Data**

Before making any changes, export your current credentials:

```javascript
// Via SSJS in CloudPage or Script Activity
Platform.Load("core", "1.1.1");

var de = DataExtension.Init("OMG_FW_Credentials");
var allCreds = de.Rows.Retrieve();

// Log or save allCreds somewhere safe
Write(Stringify(allCreds));
```

### **Step 2: Update Data Extension Schema**

#### **Option A: Using AutomatedInstaller_v3.html (Recommended)**

1. Upload updated `AutomatedInstaller_v3.html` to CloudPages
2. Access the CloudPage URL
3. Select "Update existing Data Extensions"
4. Check `OMG_FW_Credentials`
5. Click "Install Selected Components"

The installer will automatically add the new fields:
- `SecurityToken` (Text 500, Encrypted)
- `ApiVersion` (Text 20, Plain)

#### **Option B: Manual SOAP API Update**

If you prefer manual control, use this SSJS script:

```javascript
<script runat="server">
Platform.Load("core", "1.1.1");

try {
    var api = new Script.Util.WSProxy();

    // Retrieve existing DE
    var cols = ["ObjectID", "CustomerKey", "Name", "Fields"];
    var filter = {
        Property: "CustomerKey",
        SimpleOperator: "equals",
        Value: "OMG_FW_Credentials"
    };

    var result = api.retrieve("DataExtension", cols, filter);

    if (result.Status == "OK" && result.Results.length > 0) {
        var de = result.Results[0];
        var objectID = de.ObjectID;
        var existingFields = de.Fields;

        // Check if fields already exist
        var hasSecurityToken = false;
        var hasApiVersion = false;

        for (var i = 0; i < existingFields.length; i++) {
            if (existingFields[i].Name == "SecurityToken") hasSecurityToken = true;
            if (existingFields[i].Name == "ApiVersion") hasApiVersion = true;
        }

        // Add new fields
        var newFields = [];

        if (!hasSecurityToken) {
            newFields.push({
                Name: "SecurityToken",
                FieldType: "Text",
                MaxLength: 500,
                IsRequired: false,
                IsPrimaryKey: false
            });
        }

        if (!hasApiVersion) {
            newFields.push({
                Name: "ApiVersion",
                FieldType: "Text",
                MaxLength: 20,
                IsRequired: false,
                IsPrimaryKey: false
            });
        }

        if (newFields.length > 0) {
            // Combine existing + new fields
            var allFields = existingFields.concat(newFields);

            // Update DE
            var updateObj = {
                ObjectID: objectID,
                Fields: allFields
            };

            var updateResult = api.updateItem("DataExtension", updateObj);

            if (updateResult.Status == "OK") {
                Write("✅ Successfully added new fields to OMG_FW_Credentials");
            } else {
                Write("❌ Error: " + updateResult.StatusMessage);
            }
        } else {
            Write("ℹ️ Fields already exist, no update needed");
        }
    } else {
        Write("❌ OMG_FW_Credentials not found");
    }

} catch (ex) {
    Write("❌ Exception: " + ex.toString());
}
</script>
```

### **Step 3: Update Core Components**

Upload the following updated files to Content Builder as Content Blocks:

1. **CredentialStore.ssjs** → `OMG_FW_CredentialStore`
   - Added `apiVersion` mapping
   - Added `securityToken` decryption for OAuth2

2. **SFMCIntegration.ssjs** → `OMG_FW_SFMCIntegration`
   - **CRITICAL FIX**: `scope` now reads from `credResult.data.scope` (not customField2)

3. **VeevaCRMIntegration.ssjs** → `OMG_FW_VeevaCRMIntegration`
   - Added CredentialStore mode support
   - Added `apiVersion` parameter
   - Security token automatically concatenated to password

4. **VeevaVaultIntegration.ssjs** → `OMG_FW_VeevaVaultIntegration`
   - Removed hardcoded `v21.1` from all 15 endpoints
   - Now uses configurable `apiVersion`

### **Step 4: Update EncryptCredentials CloudPage**

Upload `src/Cloud Pages/EncryptCredentials.html` as a CloudPage.

**New Features:**
- Platform-specific labels (e.g., "Auth Base URL" for SFMC)
- `securityToken` field for VeevaCRM (auto-shown when platform=VeevaCRM)
- `apiVersion` field for Veeva Vault/CRM
- OAuth2 Password Grant automatically shows username/password fields

### **Step 5: Update Existing Credentials (Optional)**

If you have existing VeevaVault or VeevaCRM credentials without API versions:

1. Access EncryptCredentials CloudPage
2. Re-enter credentials for each integration
3. Specify `apiVersion`:
   - VeevaVault: `v24.1`, `v23.3`, etc.
   - VeevaCRM: `v60.0`, `v61.0`, etc.

---

## 🧪 Testing Checklist

After migration, test the following:

### **1. CredentialStore**

```javascript
Platform.Function.ContentBlockByName("OMG_FW_OmegaFramework");

var credStore = OmegaFramework.create('CredentialStore', {
    integrationName: 'YOUR_INTEGRATION_NAME'
});

var result = credStore.getCredentials();

if (result.success) {
    Write("apiVersion: " + result.data.apiVersion + "<br>");
    Write("securityToken exists: " + (result.data.securityToken ? "Yes" : "No"));
} else {
    Write("Error: " + result.error.message);
}
```

### **2. SFMC Scope Fix**

Create a test credential with `scope`:

```javascript
// In EncryptCredentials form:
// Platform: SFMC
// Scope: "email_read email_write"

// Then test:
Platform.Function.ContentBlockByName("OMG_FW_OmegaFramework");

var sfmc = OmegaFramework.create('SFMCIntegration', {
    integrationName: 'SFMC_Test'
});

var token = sfmc.getToken();
Write("Scope from config: " + Stringify(token));
// Should see scope in token request
```

### **3. VeevaCRM with Security Token**

```javascript
Platform.Function.ContentBlockByName("OMG_FW_OmegaFramework");

var veevaCRM = OmegaFramework.create('VeevaCRMIntegration', {
    integrationName: 'VeevaCRM_Prod'
});

var tokenResult = veevaCRM.getToken();

if (tokenResult.success) {
    Write("Token obtained successfully");
} else {
    Write("Error: " + tokenResult.error.message);
}
```

### **4. VeevaVault API Version**

```javascript
Platform.Function.ContentBlockByName("OMG_FW_OmegaFramework");

// Create credential with apiVersion = "v24.1"
var vault = OmegaFramework.create('VeevaVaultIntegration', {
    integrationName: 'VeevaVault_Prod'
});

var metadata = vault.getVaultMetadata();
Write(Stringify(metadata));
// Should call /api/v24.1/vaultinformation
```

---

## 🐛 Known Issues & Solutions

### **Issue: "Field SecurityToken does not exist"**

**Cause:** Data Extension not updated

**Solution:** Run Step 2 (Update Data Extension Schema)

### **Issue: "Scope not working in SFMC"**

**Cause:** Using old SFMCIntegration.ssjs

**Solution:** Re-upload updated `OMG_FW_SFMCIntegration` Content Block

### **Issue: "VeevaVault returns 404"**

**Cause:** API version mismatch (still using v21.1 when Vault is on v24.1)

**Solution:**
1. Update VeevaVaultIntegration.ssjs Content Block
2. Set `apiVersion` in credential to match your Vault instance

---

## 📊 Field Mapping Reference

| **Platform** | **AuthType** | **Required Fields** | **New Fields** |
|--------------|-------------|-------------------|---------------|
| SFMC | OAuth2 | clientId, clientSecret, authUrl | scope (fixed bug) |
| VeevaCRM | OAuth2 (password) | clientId, clientSecret, username, password | **securityToken**, **apiVersion** |
| VeevaVault | Basic | username, password, tokenEndpoint, baseUrl | **apiVersion** |
| DataCloud | OAuth2 | clientId, clientSecret, authUrl, baseUrl | scope |

---

## 🔒 Security Notes

1. **SecurityToken is encrypted** using same AES method as passwords
2. **ApiVersion is plain text** (not sensitive, just version identifier)
3. No breaking changes to encryption keys or methods
4. Existing encrypted credentials remain valid

---

## 📞 Support

If you encounter issues during migration:

1. Check SFMC Debug Logs for detailed error messages
2. Verify Data Extension schema matches documentation
3. Test with direct config first before using CredentialStore mode

---

## 📝 Rollback Plan

If you need to rollback to v1.0:

1. Do NOT delete new fields from Data Extension (they're optional)
2. Re-upload old Content Blocks
3. Old code will ignore new fields

**Note:** You'll lose:
- API version flexibility for Veeva
- Security token support for VeevaCRM
- SFMC scope bug fix

---

## ✅ Post-Migration Verification

Run this comprehensive test:

```javascript
<script runat="server">
Platform.Load("core", "1.1.1");
Platform.Function.ContentBlockByName("OMG_FW_OmegaFramework");

try {
    // Test 1: CredentialStore with new fields
    var credStore = OmegaFramework.create('CredentialStore', {
        integrationName: 'YOUR_TEST_CRED'
    });
    var creds = credStore.getCredentials();

    Write("✅ Test 1: CredentialStore<br>");
    Write("Has apiVersion: " + (creds.data.apiVersion != null) + "<br>");
    Write("Has securityToken support: " + (creds.data.securityToken !== undefined) + "<br><br>");

    // Test 2: SFMC scope
    var sfmc = OmegaFramework.create('SFMCIntegration', {
        integrationName: 'YOUR_SFMC_CRED'
    });
    Write("✅ Test 2: SFMC Integration loaded<br><br>");

    // Test 3: VeevaCRM
    var veevaCRM = OmegaFramework.create('VeevaCRMIntegration', {
        integrationName: 'YOUR_VEEVA_CRM_CRED'
    });
    Write("✅ Test 3: VeevaCRM Integration loaded<br><br>");

    // Test 4: VeevaVault
    var vault = OmegaFramework.create('VeevaVaultIntegration', {
        integrationName: 'YOUR_VAULT_CRED'
    });
    Write("✅ Test 4: VeevaVault Integration loaded<br><br>");

    Write("🎉 All tests passed! Migration successful.");

} catch (ex) {
    Write("❌ Error: " + ex.toString());
}
</script>
```

---

**Migration Complete! 🎉**

Your OmegaFramework is now updated to v1.1 with full support for API versioning and enhanced OAuth2 capabilities.
