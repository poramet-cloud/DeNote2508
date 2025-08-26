/**
 * @fileoverview AIService.gs - Handles all communication with the Gemini AI model and Google Search.
 */

// --- UTILITY FUNCTIONS ---
function getApiKey_(keyName) {
  const apiKey = PropertiesService.getScriptProperties().getProperty(keyName);
  if (!apiKey) throw new Error(`API Key "${keyName}" not found in Script Properties.`);
  return apiKey;
}

// --- EXTERNAL API CALLS ---

/**
 * Searches online using the Google Search API (Custom Search JSON API).
 * @param {string} query The search query.
 * @returns {string} A formatted string of search results.
 */
function searchOnline(query) {
  try {
    const apiKey = getApiKey_('GOOGLE_SEARCH_API_KEY');
    // You need to create a Custom Search Engine (CSE) and get its ID.
    const cseId = "YOUR_CUSTOM_SEARCH_ENGINE_ID"; 
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}&num=3`;

    const response = UrlFetchApp.fetch(url);
    const results = JSON.parse(response.getContentText());

    if (!results.items || results.items.length === 0) {
      return "No relevant information found online.";
    }

    let formattedResults = "Here is the latest information from the web:\n\n";
    results.items.forEach((item, index) => {
      formattedResults += `${index + 1}. ${item.title}\nSource: ${item.link}\nSnippet: ${item.snippet}\n\n`;
    });
    return formattedResults;
  } catch (e) {
    console.error("Google Search API Error:", e);
    return "Could not perform an online search at this time.";
  }
}

/**
 * The core function for making calls to the Gemini API via Vertex AI.
 * @param {string} prompt The complete prompt to send to the model.
 * @returns {string} The text content from the AI's response.
 */
function callGeminiAPI_(prompt) {
  // This is a simplified placeholder. Your existing Vertex AI call logic should be used here.
  // For testing, we can return a simulated response.
  console.log(`Sending to AI: ${prompt.substring(0, 100)}...`);
  // return `This is a simulated AI response to your prompt: "${prompt.substring(0, 50)}..."`;

  // ** IMPORTANT: Replace this with your actual, working call to Vertex AI **
  const geminiApiKey = getApiKey_('GEMINI_API_KEY');
  const modelName = "gemini-1.5-pro-preview-0409";
  const gcpProjectId = "293377957156";
  const gcpRegion = "us-central1";

  const url = `https://${gcpRegion}-aiplatform.googleapis.com/v1/projects/${gcpProjectId}/locations/${gcpRegion}/publishers/google/models/${modelName}:generateContent`;

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }]
  };

  const params = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': `Bearer ${ScriptApp.getOAuthToken()}` },
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, params);
  const data = JSON.parse(response.getContentText());
  return data.candidates[0].content.parts[0].text;
}


// --- MAIN WORKFLOW FUNCTION ---

/**
 * The main controller function that processes the user's chat message.
 * @param {object} payload The data object from the client.
 * @param {string} payload.userPrompt The user's message.
 * @param {boolean} payload.searchOnline Whether to search online.
 * @returns {string} The AI's final response to be displayed.
 */
function processUserPrompt(payload) {
  try {
    let finalPrompt = "";
    let context = "";

    // Step 1: Online Search (if requested)
    if (payload.searchOnline) {
      console.log(`Performing online search for: "${payload.userPrompt}"`);
      const searchResults = searchOnline(payload.userPrompt);
      context += "--- START OF ONLINE SEARCH RESULTS ---\n" + searchResults + "\n--- END OF ONLINE SEARCH RESULTS ---\n\n";
    }

    // Step 2: Add other context (e.g., from past conversations) - To be implemented later

    // Step 3: Build the final prompt for the AI
    finalPrompt = `Based on the following context, please answer the user's request.\n\nContext:\n${context}\nUser Request: ${payload.userPrompt}`;

    // Step 4: Call the AI
    const aiResponse = callGeminiAPI_(finalPrompt);

    return aiResponse;

  } catch (e) {
    console.error("Error in processUserPrompt:", e);
    return `I'm sorry, an error occurred while processing your request: ${e.message}`;
  }
}