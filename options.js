document.addEventListener('DOMContentLoaded', function () {
    const mappingsList = document.getElementById('mappings-list');
    const addMappingButton = document.getElementById('add-mapping');
    const newShortUrlInput = document.getElementById('new-short-url');
    const newLongUrlInput = document.getElementById('new-long-url');

    // Load and display existing mappings
    function loadMappings() {
        chrome.storage.sync.get(null, function (mappings) {
            mappingsList.innerHTML = ''; // Clear the list

            for (let shortUrl in mappings) {
                addMappingElement(shortUrl, mappings[shortUrl]);
            }

            if (mappings.length === 0) {
                mappingsList.innerHTML = '<p>Nothing here yet. Add a new mapping to get started!</p>';
            }
        });
    }

    // Add a mapping element to the DOM
    function addMappingElement(shortUrl, longUrl) {
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
            chrome.storage.sync.set({ [shortUrl]: updatedLongUrl }, loadMappings);
            notify({message: 'Mapping updated successfully.', type: 'success'});
        };

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'btn btn-danger';
        deleteButton.onclick = function () {
            if (!confirm('Are you sure you want to delete this mapping?')) return;
            chrome.storage.sync.remove(shortUrl, loadMappings);
            notify({message: 'Mapping removed successfully.', type: 'success'});
        };

        mappingDiv.appendChild(shortInput);
        mappingDiv.appendChild(longInput);
        mappingDiv.appendChild(saveButton);
        mappingDiv.appendChild(deleteButton);
        mappingsList.appendChild(mappingDiv);
    }

    // shows message content
    function notify({message, type}) {
        let container = document.getElementById('alerts-container');
        container.innerHTML += `
<div class="alert alert-${danger} alert-dismissible fade show" role="alert">
    ${message}
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>        `;
    }

    // Add new mapping with a check for duplicates
    addMappingButton.onclick = function () {
        const shortUrl = `jump/${newShortUrlInput.value.trim()}`;
        const longUrl = newLongUrlInput.value.trim();

        if (shortUrl && longUrl) {
            // Check if the short URL already exists
            chrome.storage.sync.get(shortUrl, function (result) {
                if (result[shortUrl]) {
                    notify({message: 'This keyword already exists. Please choose a different one.', type: 'danger'});
                } else {
                    // If not, add the new mapping
                    chrome.storage.sync.set({ [shortUrl]: longUrl }, function () {
                        newShortUrlInput.value = '';
                        newLongUrlInput.value = '';
                        loadMappings();
                    });
                    notify({message: 'New mapping added successfully.', type: 'success'});
                }
            });
        } else {
            notify({message: 'Please enter both a short URL and a long URL.', type: 'danger'});
        }
    };

    // Initial load
    loadMappings();
});
