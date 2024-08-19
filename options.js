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

    function isValidKeyword(keyword) {
        const regex = /^[^\s]+$/; // Matches any string without spaces
        return regex.test(keyword);
      }

    const mappingsList = document.getElementById('mappings-list');
    const addMappingForm = document.getElementById('add-mapping-form');
    const newShortUrlInput = document.getElementById('new-short-url');
    const newLongUrlInput = document.getElementById('new-long-url');

    // Load and display existing mappings
    function loadMappings() {
        chrome.storage.sync.get("mappings", function (data) {
            const mappings = data.mappings || {};
            log("mappings", mappings);
            if (mappings) {
                mappingsList.innerHTML = ''; // Clear the list
                for (let shortUrl in mappings) {
                    if (mappings.hasOwnProperty(shortUrl)) {
                        let longUrl = mappings[shortUrl];
                        addMappingElement({ shortUrl, longUrl });    
                    }
                }
                if (Object.keys(mappings).length === 0) {
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
        shortInput.value = `jump ${shortUrl}`;
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
        chrome.storage.sync.get("mappings", function (data){
            const mappings = data.mappings || {};
            log("mappings", mappings);
            if (mappings) {
                if (mappings.hasOwnProperty(shortUrl)) {
                    mappings[shortUrl] = longUrl;
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
        chrome.storage.sync.get("mappings", function (data) {
            const mappings = data.mappings || {};
            log("mappings", mappings);
            if (mappings) {
                if (mappings.hasOwnProperty(shortUrl)) {
                    delete mappings[shortUrl];
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
        const shortUrl = newShortUrlInput.value.trim();
        if (!isValidKeyword(shortUrl)) {
            notify({ message: "Keyword should not contain whitespaces.", type: "danger"});
            return;
        }
        const longUrl = newLongUrlInput.value.trim();

        if (shortUrl && longUrl) {
            chrome.storage.sync.get("mappings", function(data){
                const mappings = data.mappings || {};
                log("mappings", mappings);
                if (!mappings.hasOwnProperty(shortUrl)) {
                    mappings[shortUrl] = longUrl;
                    chrome.storage.sync.set({ mappings }, function() {
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
