// Listen for messages from the React UI
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'NOTION_API_CALL') {
    const { endpoint, method, token, body } = request;

    fetch(`https://api.notion.com/v1${endpoint}`, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28', // Use the latest Notion version
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) {
          sendResponse({ success: true, data });
        } else {
          sendResponse({ success: false, error: data.message || 'Notion API Error' });
        }
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keeps the message channel open for the async fetch
  }
});