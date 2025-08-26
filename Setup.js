/**
 * @fileoverview Setup.gs - Contains a utility function to initialize or reset the database schema.
 */

/**
 * This function completely resets the Google Sheet database.
 * It clears all sheets, creates them if they don't exist, and writes the correct headers.
 * RUN THIS FUNCTION ONCE to set up your database correctly.
 */
function setupDatabase() {
  // This schema is based on the Master Requirement Document
  const SCHEMA = {
    "App_Users_Master": ["User_ID", "Display_Name", "Role", "Created_At", "Updated_At"],
    "Project_List": ["Project_ID", "Project_Name", "Created_By_User_ID", "Created_At", "Last_Activity_At"],
    "Conversation_Records": ["Record_ID", "Project_Name", "Doc_File_ID", "Doc_File_Name", "Doc_File_URL", "Char_Count", "File_Size_MB", "Sequence_Number", "Previous_Doc_File_ID", "Created_By", "Created_At", "Last_Updated_At"],
    "Code_Catalog_Log": ["Code_ID", "Code_Name", "Project_Name", "Code_File_ID", "Code_File_URL", "Code_Type", "Generated_By_AI_Timestamp", "Requested_By_User_ID", "Status", "Updated_At"],
    "UI_Prototypes_Log": ["UI_ID", "UI_Name", "Project_Name", "Code_File_ID", "Code_File_URL", "Code_Type", "Generated_By_AI_Timestamp", "Requested_By_User_ID", "Status", "Updated_At"],
    "Document_Catalog_Log": ["Doc_ID", "Doc_Name", "Project_Name", "File_ID", "File_URL", "Doc_Type", "Version", "AI_Generated_Summary", "Updated_At"],
    "User_Activity_Log": ["Activity_ID", "User_ID", "Project_ID", "Activity_Type", "Activity_Details", "Timestamp", "AI_API_Call_Count", "AI_API_Token_Count"],
    "System_Errors": ["Error_ID", "Timestamp", "Function_Name", "Error_Message", "User_ID"],
    "Config_Settings": ["Setting_Name", "Setting_Value", "Description", "Data_Type", "Is_Editable_By_Admin"],
    "Daily_Coaching_Reports": ["Report_ID", "User_ID", "Report_Date", "Report_Content"]
  };

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID); // SPREADSHEET_ID is from DataService.gs
    SpreadsheetApp.setActiveSpreadsheet(ss);

    for (const sheetName in SCHEMA) {
      Logger.log(`Processing sheet: ${sheetName}...`);
      let sheet = ss.getSheetByName(sheetName);

      // If sheet doesn't exist, create it
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        Logger.log(`Sheet "${sheetName}" did not exist. Created a new one.`);
      }

      // Clear all existing data and formatting
      sheet.clear();

      // Set the new headers
      const headers = SCHEMA[sheetName];
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setValues([headers]);

      // Apply formatting
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);

      // Auto-resize columns for better readability
      headers.forEach((_, i) => {
        sheet.autoResizeColumn(i + 1);
      });
    }

    Browser.msgBox("✅ Database Setup Complete!", "All sheets have been reset with the correct headers.", Browser.Buttons.OK);

  } catch (e) {
    Logger.log(`Error during database setup: ${e.toString()}`);
    Browser.msgBox("❌ Error", `Failed to set up database. Please ensure SPREADSHEET_ID in DataService.gs is correct. Error: ${e.message}`, Browser.Buttons.OK);
  }
}