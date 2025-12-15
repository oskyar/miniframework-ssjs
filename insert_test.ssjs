<script runat="server">
Platform.Load("core", "1.1.1");

try {
    var api = new Script.Util.WSProxy();

    var dataExtensionKey = "Test_data_Framework";
    var testId = "TEST_" + new Date().getTime(); // Unique ID for testing

    // Prepare the row data
    var rowData = {
        Id: testId,
        Name: "Test User " + testId,
        LastName: "SSJS Test",
        Mobile: "1234567890",
        Email: "test." + testId + "@example.com"
    };

    // Convert rowData to WSProxy Properties array format
    function toPropertiesArray(obj) {
        var result = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                result.push({ Name: key, Value: obj[key] });
            }
        }
        return result;
    }

    // Build the DataExtensionObject payload for createItem
    // This structure is required for single-item operations on DataExtensionObject
    var deObjectPayload = { CustomerKey: dataExtensionKey,
        Properties: toPropertiesArray(rowData)
    };


    Write("Attempting to insert row: " + Stringify(rowData) + "<br>");
    Write("Payload for WSProxy.createItem: " + Stringify(deObjectPayload) + "<br>");

    // Perform the single item creation
    var result = api.createItem("DataExtensionObject", deObjectPayload);

    if (result.Status === "OK") {
        Write("<p style='color:green;'>SUCCESS: Row inserted successfully!</p>");
        Write("Result: " + Stringify(result) + "<br>");
    } else {
        Write("<p style='color:red;'>ERROR: Failed to insert row.</p>");
        Write("Status: " + result.Status + "<br>");
        if (result.Results && result.Results.length > 0) {
            Write("Error Message: " + (result.Results[0].ErrorMessage || "N/A") + "<br>");
            Write("Result Details: " + Stringify(result.Results[0]) + "<br>");
        }
        Write("Full Result: " + Stringify(result) + "<br>");
    }

} catch (ex) {
    Write("<p style='color:red;'>A critical error occurred:</p>");
    Write("Error: " + (ex.message || String(ex)) + "<br>");
}
</script>