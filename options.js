document.addEventListener('DOMContentLoaded', async function () {
    function log(...args) {
        console.log("[JumpLink]", ...args);
    }

    function generateRandomId(length = 8) {
        return Math.random().toString(36).substr(2, length);
    }

    // shows message content
    function notify({ message, type }) {
        let container = document.getElementById('alerts-container');
        let closeBtnId = generateRandomId();
        container.innerHTML += `
<div class="alert alert-${type} alert-dismissible fade show" role="alert">
    ${message}
  <button type="button" id="${closeBtnId}" class="btn-close"  data-bs-dismiss="alert" aria-label="Close"></button>
</div>        `;
        setTimeout(() => {
            let closeBtn = document.getElementById(closeBtnId);
            if (closeBtn) closeBtn.click();
        }, 5000);
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
    async function loadMappings() {
        const data = await chrome.storage.sync.get("mappings");
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
        saveButton.onclick = async function () {
            const updatedLongUrl = longInput.value;
            await updateMapping({ shortUrl, longUrl: updatedLongUrl });
        };

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'btn btn-danger';
        deleteButton.onclick = async () => await deleteMapping(shortUrl);

        mappingDiv.appendChild(shortInput);
        mappingDiv.appendChild(longInput);
        mappingDiv.appendChild(saveButton);
        mappingDiv.appendChild(deleteButton);
        mappingsList.appendChild(mappingDiv);
    }

    async function updateMapping({ shortUrl, longUrl }) {
        const data = await chrome.storage.sync.get("mappings");
        const mappings = data.mappings || {};
        log("mappings", mappings);
        if (mappings) {
            if (mappings.hasOwnProperty(shortUrl)) {
                let updatedMappings = { ...mappings };
                updatedMappings[shortUrl] = longUrl;
                await chrome.storage.sync.set({ mappings: updatedMappings });
                notify({ message: 'Mapping updated successfully.', type: 'success' });
                await loadMappings();
            }
        }
    }

    async function deleteMapping(shortUrl) {
        if (!confirm('Are you sure you want to delete this mapping?')) return;
        const data = await chrome.storage.sync.get("mappings");
        const mappings = data.mappings || {};
        log("mappings", mappings);
        if (mappings) {
            if (mappings.hasOwnProperty(shortUrl)) {
                let updatedMappings = { ...mappings };
                delete updatedMappings[shortUrl];
                await chrome.storage.sync.set({ mappings: updatedMappings });
                notify({ message: 'Mapping removed successfully.', type: 'success' });
                await loadMappings();
            }
        }
    }

    async function addNewMapping({ shortUrl, longUrl, debug }) {
        if (!isValidKeyword(shortUrl)) {
            notify({ message: `Keyword "${shortUrl}" should not contain whitespaces.`, type: "danger" });
            return;
        }

        if (shortUrl && longUrl) {
            log("adding", shortUrl, longUrl);
            const data = await chrome.storage.sync.get("mappings");
            const mappings = data.mappings || {};
            log("mappings", mappings);
            if (!mappings.hasOwnProperty(shortUrl)) {
                let updatedMappings = { ...mappings };
                updatedMappings[shortUrl] = longUrl;
                await chrome.storage.sync.set({ mappings: updatedMappings });
                if (debug) {
                    notify({ message: 'New mapping added successfully.', type: 'success' });
                    newShortUrlInput.value = '';
                    newLongUrlInput.value = '';
                }
                await loadMappings();
            } else {
                log(`already exist: ${shortUrl} -> ${mappings[shortUrl]}`);
                notify({ message: `Keyword ${shortUrl} already exists. Please choose a different one.`, type: 'danger' });
            }
        } else {
            notify({ message: 'Please provide both a short URL and a long URL.', type: 'danger' });
        }
    }

    // Add new mapping with a check for duplicates
    addMappingForm.onsubmit = async function (event) {
        event.preventDefault();
        event.stopPropagation();
        const shortUrl = newShortUrlInput.value;
        const longUrl = newLongUrlInput.value;
        await addNewMapping({ shortUrl, longUrl, debug: true });
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
    cancelImportBtn.onclick = function () {
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
        importMappingsButton.onclick = async function () {
            closeModal.click();
            for (const [shortUrl, longUrl] of Object.entries(mappings)) {
                await addNewMapping({ shortUrl, longUrl, debug: false });
            }
        };
    }

    // Initial load
    await loadMappings();
});
