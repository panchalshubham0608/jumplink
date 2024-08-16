// Initialize the extension by loading stored mappings and setting up rules
chrome.runtime.onInstalled.addListener(async () => {
    await updateRulesFromStorage();
});

// Function to update rules based on stored mappings
async function updateRulesFromStorage() {
    const { mappings } = await chrome.storage.sync.get("mappings");

    if (mappings) {
        const rules = mappings.map((mapping, index) => ({
            id: index + 1,
            priority: 1,
            action: {
                type: "redirect",
                redirect: {
                    url: mapping.longUrl
                }
            },
            condition: {
                urlFilter: `*://*/*${mapping.shortUrl}*`,
                resourceTypes: ["main_frame"]
            }
        }));

        // Clear existing rules and add new ones
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: rules.map(rule => rule.id),
            addRules: rules
        });
    }
}

// Listen for changes in storage to update rules
chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === "sync" && changes.mappings) {
        await updateRulesFromStorage();
    }
});
