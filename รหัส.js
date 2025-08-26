/**
 * @fileoverview Code.gs - Main server file for the DeNote2508 Web App.
 * Contains the main entry point for the web app and utility functions.
 */

/**
 * Serves the main HTML page of the application.
 * This function is the entry point when a user accesses the web app URL.
 * @param {GoogleAppsScript.Events.DoGet} e The event parameter for a GET request.
 * @returns {HtmlOutput} The HTML page to be rendered.
 */
function doGet(e) {
  const htmlOutput = HtmlService.createTemplateFromFile('Index').evaluate();
  htmlOutput.addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  htmlOutput.setTitle('DeNote2508');
  return htmlOutput;
}

/**
 * Utility function to include content from other files (like CSS or other HTML partials)
 * into the main HTML template. This allows for better code organization.
 * @param {string} filename The name of the file to include.
 * @returns {string} The content of the file.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}