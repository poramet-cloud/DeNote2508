

const SHEETS = {
  USERS: "App_Users_Master",
  PROJECTS: "Project_List",
  ERRORS: "System_Errors",
  // Add other sheet names as needed
};

// --- PRIVATE HELPER FUNCTIONS ---

function getDb_() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    console.error(`FATAL: Could not open spreadsheet. Check SPREADSHEET_ID. Error: ${e}`);
    throw new Error("Database spreadsheet not found or inaccessible.");
  }
}

function getSheet_(sheetName) {
  const db = getDb_();
  const sheet = db.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found in the database.`);
  }
  return sheet;
}

function logError(functionName, errorMessage, userId) {
    try {
        const sheet = getSheet_(SHEETS.ERRORS);
        sheet.appendRow([ new Date(), functionName, errorMessage, userId ]);
    } catch (e) {
        console.error(`CRITICAL: Failed to write to System_Errors sheet. Original error in ${functionName}: ${errorMessage}. Logging error: ${e.toString()}`);
    }
}


// --- PUBLIC API FUNCTIONS ---

/**
 * Fetches all projects from the Project_List sheet.
 * This is the final, reliable version.
 */
function getProjectList() {
  try {
    const sheet = getSheet_(SHEETS.PROJECTS);
    const data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      return []; // No data rows, only header or empty
    }

    const headers = data.shift(); // First row is the header

    const projects = data.map(row => {
      let project = {};
      headers.forEach((header, index) => {
        let value = row[index];
        // Convert dates to ISO strings for safe transfer
        if (value instanceof Date) {
          project[header] = value.toISOString();
        } else {
          project[header] = value;
        }
      });
      return project;
    });

    console.log(`Successfully retrieved ${projects.length} projects.`);
    return projects;

  } catch (e) {
    console.error(`A critical error occurred in getProjectList: ${e.toString()}`);
    logError('getProjectList', e.toString(), Session.getActiveUser().getEmail());
    return [];
  }
}

/**
 * Gets the profile of the current active user.
 * This is the final, reliable version.
 */
function getUserProfile() {
  const userEmail = Session.getActiveUser().getEmail();
  const sheet = getSheet_(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift(); // Get headers

  const userRow = data.find(row => row[0] === userEmail);

  if (userRow) {
    let userProfile = {};
    headers.forEach((header, index) => {
      let value = userRow[index];
      if (value instanceof Date) {
        userProfile[header] = value.toISOString();
      } else {
        userProfile[header] = value;
      }
    });
    return userProfile;
  } else {
    const timestamp = new Date();
    const newUserRow = [
      userEmail,
      userEmail.split('@')[0],
      'User',
      timestamp,
      timestamp
    ];
    sheet.appendRow(newUserRow);

    return {
      User_ID: newUserRow[0],
      Display_Name: newUserRow[1],
      Role: newUserRow[2],
      Created_At: timestamp.toISOString(),
      Updated_At: timestamp.toISOString()
    };
  }
}