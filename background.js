// Listen for when the user enters text in the Omnibox
chrome.omnibox.onInputEntered.addListener((text) => {
  // Retrieve the stored mappings from chrome.storage.sync
  chrome.storage.sync.get("mappings", (data) => {
    // Check if the input text matches any stored mapping
    const mappings = data.mappings || {};
    if (mappings[text]) {
      const longUrl = mappings[text];
      // Open the long URL in a new tab
      chrome.tabs.update({ url: longUrl });
    } else {
      // If no match is found, perform a Google search with the entered text
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
      chrome.tabs.update({ url: googleSearchUrl });
    }
  });
});
