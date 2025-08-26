/**
 * @fileoverview AdminService.gs - Handles all administrative functions such as user management
 * and system configuration settings. These functions are typically restricted to users with an 'Admin' role.
 */

/**
 * ตรวจสอบว่าผู้ใช้ที่ระบุมีสิทธิ์เป็นผู้ดูแลระบบหรือไม่
 * Checks if a given user has the 'Admin' role in the App_Users_Master sheet.
 * @param {string} [userEmail=Session.getActiveUser().getEmail()] The email of the user to check. Defaults to the current active user.
 * @returns {boolean} True if the user is an admin, false otherwise.
 */
function isAdmin(userEmail = Session.getActiveUser().getEmail()) {
  const sheet = getSheet_(SHEETS.USERS); // getSheet_ is from DataService.gs
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const roleColumnIndex = headers.indexOf('Role');
  const emailColumnIndex = headers.indexOf('User_ID');

  if (roleColumnIndex === -1 || emailColumnIndex === -1) {
    throw new Error("Could not find 'Role' or 'User_ID' column in App_Users_Master sheet.");
  }

  const userRow = data.find(row => row[emailColumnIndex] === userEmail);

  if (userRow && userRow[roleColumnIndex].toLowerCase() === 'admin') {
    Logger.log(`User ${userEmail} is confirmed as an Admin.`);
    return true;
  }
  
  Logger.log(`User ${userEmail} is not an Admin.`);
  return false;
}

/**
 * ดึงข้อมูลการตั้งค่าระบบทั้งหมดจากชีท Config_Settings
 * Fetches all system settings from the Config_Settings sheet.
 * @returns {object} An object where keys are setting names and values are the setting values.
 */
function getSystemSettings() {
  // For security, only admins should be able to view all settings.
  if (!isAdmin()) {
    throw new Error("Authorization error: Only admins can access system settings.");
  }

  const sheet = getSheet_(SHEETS.CONFIG); // Assuming SHEETS.CONFIG = "Config_Settings"
  const data = sheet.getDataRange().getValues();
  data.shift(); // Remove header row

  const settings = {};
  data.forEach(row => {
    const settingName = row[0]; // Setting_Name
    const settingValue = row[1]; // Setting_Value
    if (settingName) {
      settings[settingName] = settingValue;
    }
  });

  Logger.log("Fetched system settings for admin panel.");
  return settings;
}

/**
 * อัปเดตค่าการตั้งค่าระบบ
 * Updates a specific system setting. Handles sensitive keys by saving them to Script Properties.
 * @param {string} settingName The name of the setting to update.
 * @param {string} newValue The new value for the setting.
 */
function updateSystemSetting(settingName, newValue) {
  if (!isAdmin()) {
    throw new Error("Authorization error: Only admins can update system settings.");
  }

  // Handle sensitive API keys by storing them in Script Properties
  if (settingName === 'GEMINI_API_KEY' || settingName === 'GOOGLE_SEARCH_API_KEY') {
    PropertiesService.getScriptProperties().setProperty(settingName, newValue);
    Logger.log(`Securely updated ${settingName} in Script Properties.`);
    // Optionally, you could store a placeholder or metadata in the sheet
    // For now, we just log it and don't update the sheet for keys.
    return { status: 'success', message: `${settingName} updated securely.` };
  }

  // For non-sensitive keys, update the Google Sheet
  const sheet = getSheet_(SHEETS.CONFIG);
  const data = sheet.getDataRange().getValues();
  const settingRowIndex = data.findIndex(row => row[0] === settingName);

  if (settingRowIndex > 0) { // Found the setting (index > 0 to skip header)
    sheet.getRange(settingRowIndex + 1, 2).setValue(newValue); // Column 2 is 'Setting_Value'
    Logger.log(`Updated setting "${settingName}" to "${newValue}" in the sheet.`);
    return { status: 'success', message: `${settingName} updated.` };
  } else {
    throw new Error(`Setting "${settingName}" not found in Config_Settings.`);
  }
}

/**
 * ดึงรายชื่อผู้ใช้ทั้งหมด
 * Fetches the list of all authorized users.
 * @returns {Array<Object>} An array of user objects.
 */
function getUserList() {
    if (!isAdmin()) {
        throw new Error("Authorization error: Only admins can view the user list.");
    }
    const sheet = getSheet_(SHEETS.USERS);
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();

    const users = data.map(row => {
        let user = {};
        headers.forEach((header, index) => {
            user[header] = row[index];
        });
        return user;
    });
    return users;
}

/**
 * เพิ่มผู้ใช้ใหม่เข้าสู่ระบบ
 * Adds a new user to the App_Users_Master sheet.
 * @param {string} newUserEmail The email of the new user to add.
 * @returns {Object} The newly created user object.
 */
function addUser(newUserEmail) {
    if (!isAdmin()) {
        throw new Error("Authorization error: Only admins can add new users.");
    }
    if (!newUserEmail || !newUserEmail.includes('@')) {
        throw new Error("Invalid email format provided.");
    }

    const sheet = getSheet_(SHEETS.USERS);
    const data = sheet.getRange("A:A").getValues();
    const existingUsers = data.flat();

    if (existingUsers.includes(newUserEmail)) {
        throw new Error(`User with email "${newUserEmail}" already exists.`);
    }

    const timestamp = new Date();
    const newUserRow = [
      newUserEmail,
      newUserEmail.split('@')[0], // Default Display Name
      'User', // Default Role
      timestamp,
      timestamp
    ];
    sheet.appendRow(newUserRow);
    Logger.log(`Admin added new user: ${newUserEmail}`);
    
    return {
        User_ID: newUserEmail,
        Display_Name: newUserRow[1],
        Role: newUserRow[2]
    };
}
