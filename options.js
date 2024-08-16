document.addEventListener('DOMContentLoaded', function () {
    function log(...args) {
        console.log("[JumpLink]", ...args);
    }

    // shows message content
    function notify({ message, type }) {
        let container = document.getElementById('alerts-container');
        container.innerHTML += `
<div class="alert alert-${type} alert-dismissible fade show" role="alert">
    ${message}
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>        `;
    }

    const mappingsList = document.getElementById('mappings-list');
    const addMappingForm = document.getElementById('add-mapping-form');
    const newShortUrlInput = document.getElementById('new-short-url');
    const newLongUrlInput = document.getElementById('new-long-url');

    // Load and display existing mappings
    function loadMappings() {
        chrome.storage.sync.get("mappings", function ({ mappings }) {
            log("mappings", mappings);
            if (mappings) {
                mappingsList.innerHTML = ''; // Clear the list
                for (let mapping of mappings) {
                    addMappingElement({
                        shortUrl: mapping.shortUrl,
                        longUrl: mapping.longUrl,
                    });
                }
                if (mappings.length === 0) {
                    mappingsList.innerHTML = '<p>Nothing here yet. Add a new mapping to get started!</p>';
                }
            } else {
                mappingsList.innerHTML = '<p>Nothing here yet. Add a new mapping to get started!</p>';
            }
        });
    }

    // Add a mapping element to the DOM
    function addMappingElement({ shortUrl, longUrl }) {
        const mappingDiv = document.createElement('div');
        mappingDiv.className = 'mapping';

        const shortInput = document.createElement('input');
        shortInput.value = shortUrl;
        shortInput.className = "form-control";
        shortInput.disabled = true;

        const longInput = document.createElement('input');
        longInput.value = longUrl;
        longInput.className = "form-control"

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.className = 'btn btn-success';
        saveButton.onclick = function () {
            const updatedLongUrl = longInput.value;
            updateMapping({ shortUrl, longUrl: updatedLongUrl });
        };

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'btn btn-danger';
        deleteButton.onclick = () => deleteMapping(shortUrl);

        mappingDiv.appendChild(shortInput);
        mappingDiv.appendChild(longInput);
        mappingDiv.appendChild(saveButton);
        mappingDiv.appendChild(deleteButton);
        mappingsList.appendChild(mappingDiv);
    }

    function updateMapping({ shortUrl, longUrl}) {
        chrome.storage.sync.get("mappings", function ({ mappings }){
            log("mappings", mappings);
            if (mappings) {
                let index = mappings.findIndex(mapping => mapping.shortUrl === shortUrl);
                if (index !== -1) {
                    log("updating", mappings[index]);
                    let mapping = mappings[index];
                    mapping.longUrl = longUrl;
                    chrome.storage.sync.set({ mappings }, function(){
                        notify({ message: 'Mapping updated successfully.', type: 'success' });
                        loadMappings();    
                    });
                }
            }
        });
    }

    function deleteMapping(shortUrl) {
        if (!confirm('Are you sure you want to delete this mapping?')) return;
        chrome.storage.sync.get("mappings", function ({ mappings }) {
            log("mappings", mappings);
            if (mappings) {
                let index = mappings.findIndex(mapping => mapping.shortUrl === shortUrl);
                if (index !== -1) {
                    log("deleting", mappings[index]);
                    mappings.splice(index, 1);
                    chrome.storage.sync.set({ mappings }, function(){
                        notify({ message: 'Mapping removed successfully.', type: 'success' });
                        loadMappings();
                    });
                }
            }
        });
    }

    // Add new mapping with a check for duplicates
    addMappingForm.onsubmit = function (event) {
        event.preventDefault();
        event.stopPropagation();
        const shortUrl = `jump/${newShortUrlInput.value.trim()}`;
        const longUrl = newLongUrlInput.value.trim();

        if (shortUrl && longUrl) {
            chrome.storage.sync.get("mappings", function({ mappings }){
                log("mappings", mappings);
                const updatedMappings = mappings ? [...mappings] : [];
                // Ensure no duplicate short URL exists
                let index = updatedMappings.findIndex(mapping => mapping.shortUrl === shortUrl);
                if (index === -1) {
                    log("adding", { shortUrl, longUrl });
                    updatedMappings.push({ shortUrl, longUrl });
                    chrome.storage.sync.set({ mappings: updatedMappings }, function() {
                        notify({ message: 'New mapping added successfully.', type: 'success' });
                        loadMappings();    
                    });
                } else {
                    log("already exist", updatedMappings[index]);
                    notify({ message: 'This keyword already exists. Please choose a different one.', type: 'danger' });
                }
            });
        } else {
            notify({ message: 'Please enter both a short URL and a long URL.', type: 'danger' });
        }
    };

    // Initial load
    loadMappings();
});
