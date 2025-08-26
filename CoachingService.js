function getLatestCoachingReport() {
  Logger.log('--- เริ่มการทำงานของ getLatestCoachingReport ---');
  try {
    const userEmail = Session.getActiveUser().getEmail();
    Logger.log('1. ดึงอีเมลผู้ใช้สำเร็จ: ' + userEmail);

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Daily_Coaching_Reports');
    if (!sheet) {
      Logger.log('!!! ข้อผิดพลาด: ไม่พบชีท "Daily_Coaching_Reports"');
      throw new Error('Sheet "Daily_Coaching_Reports" not found.');
    }
    Logger.log('2. เปิดชีทสำเร็จ');

    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    Logger.log('3. ดึงข้อมูลทั้งหมดจากชีทสำเร็จ');

    const reportContentIndex = headers.indexOf('Report_Content');
    const userIdIndex = headers.indexOf('User_ID');
    const reportDateIndex = headers.indexOf('Report_Date');

    if (userIdIndex === -1 || reportContentIndex === -1 || reportDateIndex === -1) {
      Logger.log('!!! ข้อผิดพลาด: ไม่พบคอลัมน์ที่ต้องการในชีท');
      throw new Error('Required columns not found in sheet.');
    }

    const userReports = values.slice(1)
      .filter(row => row[userIdIndex] === userEmail)
      .sort((a, b) => new Date(b[reportDateIndex]) - new Date(a[reportDateIndex]));
    
    Logger.log('4. กรองข้อมูลหา report ของผู้ใช้สำเร็จ พบ ' + userReports.length + ' รายการ');

    if (userReports.length > 0) {
      Logger.log('5. พบ report ล่าสุด กำลังจะส่งข้อมูลกลับไป');
      return userReports[0][reportContentIndex];
    } else {
      Logger.log('5. ไม่พบ report สำหรับผู้ใช้นี้');
      return 'ยังไม่มีข้อมูล Co-pilot Insights สำหรับคุณในวันนี้';
    }
  } catch (error) {
    Logger.log('!!! เกิดข้อผิดพลาดในบล็อก CATCH: ' + error.toString());
    console.error('Error in getLatestCoachingReport: ' + error.toString());
    return `เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}`;
  }
}

// ฟังก์ชัน addSampleCoachingReport ไม่ต้องแก้ไข
function addSampleCoachingReport() {
  const userEmail = Session.getActiveUser().getEmail();
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Daily_Coaching_Reports');
  if (!sheet) {
    console.error('Sheet "Daily_Coaching_Reports" not found.');
    return;
  }
  const newReport = [ `Report_${Date.now()}`, userEmail, new Date(), `### สรุปการทำงานของคุณ 🚀\n\n* **Project ที่ใช้งานบ่อย:** DeNote2508\n* **คำแนะนำ:** ทำงานได้ดีมาก!` ];
  sheet.appendRow(newReport);
  console.log('Added a sample report for ' + userEmail);
}