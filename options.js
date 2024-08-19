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
    const exportButton = document.getElementById('export-btn');
    const importButton = document.getElementById('import-btn');
    const importModal = document.getElementById('import-modal');
    const closeModal = document.getElementById('close-modal');
    const cancelImportBtn = document.getElementById('cancel-import-btn');
    const tableContainer = document.getElementById('table-container');
    const importMappingsButton = document.getElementById('import-mappings-btn');

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

    function updateMapping({ shortUrl, longUrl }) {
        chrome.storage.sync.get("mappings", function (data) {
            const mappings = data.mappings || {};
            log("mappings", mappings);
            if (mappings) {
                if (mappings.hasOwnProperty(shortUrl)) {
                    mappings[shortUrl] = longUrl;
                    chrome.storage.sync.set({ mappings }, function () {
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
                    chrome.storage.sync.set({ mappings }, function () {
                        notify({ message: 'Mapping removed successfully.', type: 'success' });
                        loadMappings();
                    });
                }
            }
        });
    }

    function addNewMapping({ shortUrl, longUrl, debug }) {
        if (!isValidKeyword(shortUrl)) {
            notify({ message: `Keyword "${shortUrl}" should not contain whitespaces.`, type: "danger" });
            return;
        }

        if (shortUrl && longUrl) {
            log("adding", shortUrl, longUrl);
            chrome.storage.sync.get("mappings", function (data) {
                const mappings = data.mappings || {};
                log("mappings", mappings);
                if (!mappings.hasOwnProperty(shortUrl)) {
                    let updatedMappings = {...mappings};
                    updatedMappings[shortUrl] = longUrl;
                    chrome.storage.sync.set({ mappings: updatedMappings }, function () {
                        if (debug) {
                            notify({ message: 'New mapping added successfully.', type: 'success' });
                        }
                        loadMappings();
                    });
                } else {
                    log(`already exist: ${shortUrl} -> ${mappings[shortUrl]}`);
                    notify({ message: `Keyword ${shortUrl} already exists. Please choose a different one.`, type: 'danger' });
                }
            });
        } else {
            notify({ message: 'Please provide both a short URL and a long URL.', type: 'danger' });
        }
    }

    // Add new mapping with a check for duplicates
    addMappingForm.onsubmit = function (event) {
        event.preventDefault();
        event.stopPropagation();
        const shortUrl = newShortUrlInput.value;
        const longUrl = newLongUrlInput.value;
        addNewMapping({ shortUrl, longUrl, debug: true });
    };

    // Add click handler to export button
    exportButton.onclick = function () {
        // Retrieve the mappings from chrome.storage.sync
        chrome.storage.sync.get("mappings", (data) => {
            const mappings = data.mappings || {};

            // Convert the mappings object to a JSON string
            const jsonString = JSON.stringify(mappings, null, 2); // Pretty print with 2 spaces indentation

            // Create a Blob from the JSON string
            const blob = new Blob([jsonString], { type: 'application/json' });

            // Create a link element to download the blob as a file
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mappings.json'; // The name of the file to be downloaded

            // Append the link to the document body and trigger the download
            document.body.appendChild(a);
            a.click();

            // Clean up by revoking the object URL and removing the link
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        });
    };

    // add click listener to import button
    importButton.onclick = function () {
        importModal.style.display = 'block';
    }

    // add click listener to close modal button
    closeModal.onclick = function () {
        importModal.style.display = 'none';
    }
    cancelImportBtn.onclick = function(){
        importModal.style.display = 'none';
    }

    // Close modal when clicking outside of modal content
    window.addEventListener('click', (event) => {
        if (event.target === importModal) {
            importModal.style.display = 'none';
        }
    });

    // Handle file selection
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];

        if (!file) {
            alert('Please select a file to import.');
            return;
        }

        if (file.type !== 'application/json') {
            alert('Please select a valid JSON file.');
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {
            try {
                const jsonString = event.target.result;
                const mappings = JSON.parse(jsonString);

                if (typeof mappings !== 'object' || Array.isArray(mappings)) {
                    alert('Invalid JSON format. Expected an object with mappings.');
                    return;
                }

                // Generate table
                generateTable(mappings);

            } catch (error) {
                alert('Failed to parse JSON file. Please ensure the file is valid JSON.');
            }
        };

        reader.onerror = function () {
            alert('Failed to read the file. Please try again.');
        };

        reader.readAsText(file);
    });

    // Function to generate and display table
    function generateTable(mappings) {
        tableContainer.innerHTML = ''; // Clear previous table

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Create table header
        const headerRow = document.createElement('tr');
        const th1 = document.createElement('th');
        th1.textContent = 'Short URL';
        const th2 = document.createElement('th');
        th2.textContent = 'Long URL';
        headerRow.appendChild(th1);
        headerRow.appendChild(th2);
        thead.appendChild(headerRow);

        // Create table rows
        for (const [shortUrl, longUrl] of Object.entries(mappings)) {
            const row = document.createElement('tr');
            const cell1 = document.createElement('td');
            cell1.textContent = shortUrl;
            const cell2 = document.createElement('td');
            cell2.textContent = longUrl;
            row.appendChild(cell1);
            row.appendChild(cell2);
            tbody.appendChild(row);
        }

        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);

        // add click listener to button
        importMappingsButton.onclick = function(){
            closeModal.click();
            Object.entries(mappings).forEach(entry => {
                const [shortUrl, longUrl] = entry;
                addNewMapping({ shortUrl, longUrl, debug: false });                
            });
        };
    }

    // Initial load
    loadMappings();
});
