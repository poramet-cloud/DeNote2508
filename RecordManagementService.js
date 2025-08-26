/**
 * @fileoverview RecordManagementService.gs - Handles file and folder operations in Google Drive,
 * and manages the structured logging of conversations in Google Docs.
 */

const ROOT_FOLDER_NAME = "DeNote2508_Projects";

/**
 * Gets the root folder for all projects. Creates it if it doesn't exist.
 * @returns {GoogleAppsScript.Drive.Folder} The root folder object.
 * @private
 */
function getRootFolder_() {
    const folders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
    if (folders.hasNext()) {
        return folders.next();
    } else {
        return DriveApp.createFolder(ROOT_FOLDER_NAME);
    }
}

/**
 * Creates the folder structure for a new project.
 * @param {string} projectName The name of the project.
 * @returns {string} The ID of the created project folder.
 */
function createProjectFolders_(projectName) {
    const rootFolder = getRootFolder_();
    // Check if a folder with the same name already exists to avoid duplicates
    const existingFolders = rootFolder.getFoldersByName(projectName);
    if (existingFolders.hasNext()) {
        throw new Error(`A project named "${projectName}" already exists.`);
    }
    const projectFolder = rootFolder.createFolder(projectName);

    // Create subfolders
    projectFolder.createFolder('Code');
    projectFolder.createFolder('UI');
    projectFolder.createFolder('Documents');
    projectFolder.createFolder('Uploads');

    console.log(`Created folder structure for project: ${projectName}`);
    return projectFolder.getId();
}

/**
 * Creates a new project entry in the database and its corresponding folder structure.
 * This function is called from the client-side.
 * @param {string} projectName The name for the new project.
 * @returns {Object} The newly created project object.
 */
function createNewProject(projectName) {
  if (!projectName || projectName.trim() === "") {
    throw new Error("Project name cannot be empty.");
  }

  const userEmail = Session.getActiveUser().getEmail();
  const timestamp = new Date();
  const projectId = `PROJ-${Utilities.getUuid()}`;

  // --- 1. Create Folder Structure in Google Drive ---
  const folderId = createProjectFolders_(projectName.trim());

  // --- 2. Add record to Project_List sheet ---
  const projectSheet = getSheet_(SHEETS.PROJECTS); // getSheet_ is from DataService.gs
  const newProjectRow = [
    projectId,
    projectName.trim(),
    userEmail,
    timestamp,
    timestamp // Last_Activity_At
  ];
  projectSheet.appendRow(newProjectRow);
  console.log(`New project "${projectName}" added to sheet by ${userEmail}.`);

  const newProjectData = {
    Project_ID: projectId,
    Project_Name: projectName.trim(),
    Created_By_User_ID: userEmail,
    Created_At: timestamp.toISOString(), // Use ISOString for consistency
    Last_Activity_At: timestamp.toISOString()
  };

  return newProjectData;
}