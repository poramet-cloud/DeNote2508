/**
 * @fileoverview UserActivityService.gs - Handles logging of user activities.
 */

/**
 * Logs a specific user activity to the User_Activity_Log sheet.
 * This is a flexible function that can be called from various points in the application.
 * @param {object} activityObject An object containing activity details.
 * - {string} userId The user's email.
 * - {string} projectId The ID of the project involved.
 * - {string} activityType A category for the activity (e.g., 'CHAT_MESSAGE', 'CREATE_PROJECT').
 * - {string} activityDetails A description of the activity.
 * - {number} [apiCallCount=0] Number of AI API calls for this activity.
 * - {number} [apiTokenCount=0] Number of tokens used in AI calls.
 */
function logActivity(activityObject) {
  try {
    const sheet = getSheet_(SHEETS.ACTIVITY_LOG);
    const timestamp = new Date();
    const activityId = `ACT-${Utilities.getUuid()}`;

    const newRow = [
      activityId,
      activityObject.userId || Session.getActiveUser().getEmail(),
      activityObject.projectId || null,
      activityObject.activityType,
      activityObject.activityDetails,
      timestamp,
      activityObject.apiCallCount || 0,
      activityObject.apiTokenCount || 0
    ];

    sheet.appendRow(newRow);
    console.log(`Logged activity: ${activityObject.activityType} for user ${activityObject.userId}`);
  } catch (e) {
    console.error(`Failed to log activity. Error: ${e.toString()}`);
    // Optionally log this failure to the System_Errors sheet
    logError('logActivity', e.toString(), Session.getActiveUser().getEmail());
  }
}

/**
 * Logs an error to the System_Errors sheet.
 * @param {string} functionName The name of the function where the error occurred.
 * @param {string} errorMessage The error message.
 * @param {string} userId The email of the user who experienced the error.
 */
function logError(functionName, errorMessage, userId) {
    try {
        const sheet = getSheet_(SHEETS.ERRORS);
        const timestamp = new Date();
        const errorId = `ERR-${Utilities.getUuid()}`;

        sheet.appendRow([
            errorId,
            timestamp,
            functionName,
            errorMessage,
            userId || Session.getActiveUser().getEmail()
        ]);
    } catch (e) {
        // If logging the error itself fails, log to the Apps Script console as a last resort.
        console.error(`CRITICAL: Failed to write to System_Errors sheet. Original error in ${functionName}: ${errorMessage}. Logging error: ${e.toString()}`);
    }
}