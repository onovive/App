function createNavigationButtons() {
    const clueContainer = document.getElementById("clueContainer");

    // Remove previous navigation buttons if they exist
    const existingButtons = document.querySelectorAll(".navigation-button");
    existingButtons.forEach(button => button.remove());

    // Get the current image input element
    const imageInput = document.querySelector(".clue-image-input");

    // Save the uploaded image for the current clue (if any)
    if (imageInput && imageInput.files.length > 0) {
        uploadedImages[currentClueIndex] = { file: imageInput.files[0], url: URL.createObjectURL(imageInput.files[0]) }; // Save the file and its URL
    }
    console.log(currentClueIndex)

    // // Create Back button
    if (currentClueIndex === 0) {
        const backButton = document.createElement("button");
        backButton.className = "navigation-button mr-2 py-2 px-4 bg-gray-500 text-white rounded-lg shadow-lg hover:bg-gray-600 focus:outline-none transition duration-300";
        backButton.innerHTML = `<i class="fas fa-chevron-left"></i>`;
        backButton.addEventListener("click", function () {
           
        });
        clueContainer.appendChild(backButton);
    }

    // Create Back button
    if (currentClueIndex > 0) {
        const backButton = document.createElement("button");
        backButton.className = "navigation-button mr-2 py-2 px-4 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none transition duration-300";
        backButton.innerHTML = `<i class="fas fa-chevron-left"></i>`;
        backButton.addEventListener("click", function () {
            currentClueIndex--;
            displayAllClues();
        });
        clueContainer.appendChild(backButton);
    }

    // Create Next button
    if (currentClueIndex < clues.length - 1) {
        const nextButton = document.createElement("button");
        nextButton.className = "navigation-button py-2 px-4 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none transition duration-300";
        nextButton.innerHTML = `<i class="fas fa-chevron-right"></i>`;
        nextButton.addEventListener("click", function () {
            // Check if an image is uploaded or previously uploaded for the current clue
            if ((uploadedImages[currentClueIndex] && uploadedImages[currentClueIndex].url !== '') || (imageInput && imageInput.files.length > 0)) {
                // Remove error message if it exists
             


                showErrorMessage("");
                currentClueIndex++;
                displayAllClues();
            } else {
                showErrorMessage("Per favore, carica un'immagine prima di procedere al prossimo indizio.");
            }
        });
        clueContainer.appendChild(nextButton);
    }

    // Create Completion button
    if (currentClueIndex === clues.length - 1) {
        const completionButton = document.createElement("button");
        completionButton.className = "navigation-button py-2 px-4 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none transition duration-300";
        completionButton.innerHTML = `<i class="fas fa-chevron-right"></i>`;
        completionButton.addEventListener("click", function () {
            // Check if an image is uploaded or previously uploaded for the current clue
            if ((uploadedImages[currentClueIndex] && uploadedImages[currentClueIndex].url !== '') || (imageInput && imageInput.files.length > 0)) {
            
                // Remove error message if it exists
                showErrorMessage("");
                showCompletionMessage();
            } else {
                showErrorMessage("Per favore, carica un'immagine prima di completare il processo.");
            }
        });
        clueContainer.appendChild(completionButton);
    }
}


function showErrorMessage(message) {
    let existingError = document.getElementById("error-message");
    if (existingError) {
        existingError.remove(); // Remove existing error message if present
    }

    const clueContainer = document.getElementById("clueContainer");
    const errorDiv = document.createElement("div");
    errorDiv.id = "error-message";
    errorDiv.className = "py-2 px-4 mb-4 text-white bg-red-600 rounded-lg text-center";
    errorDiv.textContent = message;
    clueContainer.insertBefore(errorDiv, clueContainer.firstChild); // Add the error message at the top
}