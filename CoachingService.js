/**
 * @fileoverview CoachingService.gs - Handles the automated daily analysis of user behavior
 * to generate personalized coaching insights and recommendations.
 */

// --- PUBLIC FUNCTIONS ---

/**
 * ฟังก์ชันหลักที่จะถูกเรียกใช้โดย Time-driven Trigger ทุกวัน
 * This is the main function intended to be run by a daily time-driven trigger (e.g., every evening).
 * It iterates through all users and generates a coaching report for each based on their activity for the day.
 */
function runDailyAnalysis() {
  Logger.log("Starting daily behavioral analysis for all users...");
  
  const usersSheet = getSheet_(SHEETS.USERS); // From DataService.gs
  const usersData = usersSheet.getDataRange().getValues();
  usersData.shift(); // Remove header row

  usersData.forEach(userRow => {
    const userEmail = userRow[0]; // User_ID column
    if (userEmail) {
      try {
        generateReportForUser_(userEmail);
      } catch (e) {
        Logger.log(`Failed to generate report for ${userEmail}. Error: ${e.toString()}`);
        // logErrorToSheet('runDailyAnalysis', e, userEmail); // Optional: Log error to System_Errors sheet
      }
    }
  });
  
  Logger.log("Daily behavioral analysis completed.");
}

/**
 * ดึงข้อมูลรายงาน Co-pilot ล่าสุดสำหรับผู้ใช้ที่ระบุ
 * Fetches the most recent coaching report for a specific user to display on the dashboard.
 * @param {string} userEmail The email of the user whose report is being requested.
 * @returns {object|null} The latest report object (content and date) or null if not found.
 */
function getLatestCoachingReport(userEmail = Session.getActiveUser().getEmail()) {
  try {
    const reportSheet = getSheet_(SHEETS.COACHING_REPORTS); // Assuming SHEETS.COACHING_REPORTS = "Daily_Coaching_Reports"
    const data = reportSheet.getDataRange().getValues();
    const headers = data.shift();
    
    // Find the last report for the given user by searching from the bottom up.
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i][1] === userEmail) { // Column 1 is User_ID
        const report = {
          Report_Date: data[i][2], // Column 2 is Report_Date
          Report_Content: data[i][3] // Column 3 is Report_Content
        };
        Logger.log(`Found latest coaching report for ${userEmail} from ${report.Report_Date}`);
        return report;
      }
    }
    
    Logger.log(`No coaching report found for ${userEmail}.`);
    return null; // No report found
  } catch(e) {
    Logger.log(`Error fetching coaching report for ${userEmail}: ${e.toString()}`);
    // Return null but don't throw an error to the client, as this is not a critical failure.
    return null;
  }
}


// --- PRIVATE HELPER FUNCTIONS ---

/**
 * สร้างรายงานสำหรับผู้ใช้คนเดียว
 * Generates and saves a coaching report for a single user.
 * @param {string} userEmail The email of the user to analyze.
 * @private
 */
function generateReportForUser_(userEmail) {
  Logger.log(`Generating report for: ${userEmail}`);
  
  // --- 1. Aggregate Data ---
  const activitySummary = getDailyActivitySummary_(userEmail);
  
  // If there's no activity, don't generate a report.
  if (!activitySummary) {
    Logger.log(`No activity found for ${userEmail} today. Skipping report generation.`);
    return;
  }

  // --- 2. Build the Meta-Prompt ---
  const metaPrompt = `
    As a professional Productivity Coach, your task is to analyze the following daily activity summary of a user.
    Provide insights and actionable recommendations based on their behavior.

    Analyze the data in these 3 dimensions:
    1.  Problem-Solving Style: How do they approach tasks? Are they systematic, iterative, etc.?
    2.  Core Goals: What seems to be their main focus based on their actions?
    3.  Collaboration Style: (If applicable) How do they interact with the AI?

    After the analysis, provide 2 concrete, actionable recommendations to help them improve their workflow, learn a new skill, or be more efficient.
    Format your entire response in Markdown.

    --- USER ACTIVITY SUMMARY ---
    ${activitySummary}
    --- END OF SUMMARY ---
  `;

  // --- 3. Call AI for Analysis ---
  // We use a lower temperature for more consistent, analytical responses.
  const reportContent = callGeminiAPI_(metaPrompt, { temperature: 0.5 }); 

  // --- 4. Save the Report ---
  const reportSheet = getSheet_(SHEETS.COACHING_REPORTS);
  const newReportRow = [
    `REP-${Utilities.getUuid()}`, // Report_ID
    userEmail,                   // User_ID
    new Date(),                  // Report_Date
    reportContent                // Report_Content
  ];
  reportSheet.appendRow(newReportRow);
  Logger.log(`Successfully generated and saved report for ${userEmail}.`);
}

/**
 * รวบรวมและสรุปกิจกรรมของผู้ใช้ในวันนั้น
 * Gathers and summarizes a user's activity for the current day from the User_Activity_Log.
 * @param {string} userEmail The user's email.
 * @returns {string|null} A formatted string summarizing the day's activities, or null if no activities.
 * @private
 */
function getDailyActivitySummary_(userEmail) {
  const activitySheet = getSheet_(SHEETS.ACTIVITY_LOG);
  const data = activitySheet.getDataRange().getValues();
  data.shift(); // Remove header

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to the beginning of the day

  const userActivitiesToday = data.filter(row => {
    const rowEmail = row[1]; // User_ID
    const rowTimestamp = new Date(row[5]); // Timestamp
    return rowEmail === userEmail && rowTimestamp >= today;
  });

  if (userActivitiesToday.length === 0) {
    return null;
  }

  // Create a simple text summary of activities.
  let summary = `Total activities today: ${userActivitiesToday.length}\n\n`;
  summary += "Activity Timeline:\n";
  userActivitiesToday.forEach(row => {
    const timestamp = new Date(row[5]).toLocaleTimeString();
    const activityType = row[3];
    const activityDetails = row[4];
    summary += `- [${timestamp}] ${activityType}: ${activityDetails}\n`;
  });

  return summary;
}
