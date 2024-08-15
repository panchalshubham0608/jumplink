chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        const url = new URL(details.url);

        // Check if the URL starts with "jumplink/"
        if (url.hostname === "jumplink") {
            const path = url.pathname.substring(1); // Remove the leading "/"
            const shortUrl = `jumplink/${path}`;

            // Retrieve the long URL from storage
            chrome.storage.sync.get([shortUrl], function (result) {
                if (result[shortUrl]) {
                    // Redirect to the long URL
                    chrome.tabs.update(details.tabId, { url: result[shortUrl] });
                }
            });
        }

        return {}; // No redirect by default
    },
    { urls: ["<all_urls>"] }, // Monitor all URLs
    ["blocking"]
);
