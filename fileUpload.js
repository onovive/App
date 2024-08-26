async function addImageToDrive(currentPasscode) {
    console.log("uploading image..")
    
    // Get the filenames from the globalData object
    const fileNames = Object.keys(globalData);

    // Array to hold all the upload promises
    const uploadPromises = []; 
    
    // Loop through each filename to process the image upload
    for (const fileName of fileNames) {

        // Prepare the payload object with the image data and metadata
        const payload = {
            file: globalData[fileName].array, // Access the image array from globalData
            filename: fileName, // Set the filename
            passcode: currentPasscode, // Set the current passcode
            index: globalData[fileName].clueNumber, // Set the clueNumber from globalData
        };

        // Skip the iteration if the file or filename is missing
        if (!(payload.file && payload.filename)) continue;

        // Create a promise to handle the image upload
        const uploadPromise = fetch(`${SCRIPT_URL}?action=imgUpload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: JSON.stringify(payload), // Send the payload as a JSON string
            mode: 'cors',
            cache: 'no-cache',
        })
            .then(async response => {
                // Check if the response is not successful
                if (!response.ok) {
                    throw new Error(`An error has occurred: ${response.status}`);
                }
                
                // Parse the response as JSON
                const fileUploadResponse = await response.json();
                
                // Check if the upload was successful
                if (fileUploadResponse.status === 'success') {
                    const fileResponse = JSON.parse(fileUploadResponse.response);
                    console.log(`Successfully uploaded ${fileName}`);
                    // Remove the file data from globalData after successful upload
                    delete globalData[fileName];
                    return true; // Return true to indicate success
                } else {
                    console.log(`Failed to upload ${fileName}`);
                    return false; // Return false to indicate failure
                }
            })
            .catch(error => {
                // Log any errors that occur during the upload
                console.error(`Error uploading ${fileName}:`, error);
                return false; // Return false to indicate failure
            });

        // Add each upload promise to the array
        uploadPromises.push(uploadPromise); 
    }

    // Wait for all the image upload promises to complete
    const uploadResults = await Promise.all(uploadPromises);

    // Check if all uploads were successful
    const allUploadsSuccessful = uploadResults.every(result => result === true);


}

async function addStatus(currentPasscode) {
    // Prepare the payload object with the passcode
    const payload = {
        passcode: currentPasscode,
    };

    // Send a request to update the status
    fetch(`${SCRIPT_URL}?action=addStatus`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify(payload), // Send the payload as a JSON string
        mode: 'cors',
        cache: 'no-cache',
    })
        .then(async response => {
            // Check if the response is not successful
            if (!response.ok) {
                throw new Error(`An error has occurred: ${response.status}`);
            }
            // Handle any other logic if needed after status update
        })
        .catch(error => {
            // Log any errors that occur during the status update
            console.error(`Error updating status:`, error);
        });
}
