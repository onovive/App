function showAllImagesPreview() {

    // Clear the existing content
    const clueContainer = document.getElementById("clueContainer");
    clueContainer.innerHTML = "";

    // Create a new container for the images
    const previewContainer = document.createElement("div");
    previewContainer.id = "imagesPreviewContainer";
    previewContainer.className = "images-preview-container p-4 bg-gray-100 rounded-lg shadow-lg";

    const title = document.createElement("h2");
    title.textContent = "Preview delle Immagini";
    title.className = "text-xl font-semibold mb-4 text-gray-800";
    previewContainer.appendChild(title);

    // Collect all image previews from uploadedImages array
    const uploadedImagesUrls = Object.entries(uploadedImages).filter(([key, url]) => url);
    // console.log('Uploaded Images URLs:', uploadedImagesUrls);

    if (uploadedImagesUrls.length === 0) {
        const noImagesMessage = document.createElement("p");
        noImagesMessage.textContent = "Nessuna immagine caricata.";
        noImagesMessage.className = "text-gray-600";
        previewContainer.appendChild(noImagesMessage);
    } else {
        uploadedImagesUrls.forEach(([clueNumber, dataUrl]) => {
            // Ensure clueNumber is an integer and adjust for display
            clueNumber = parseInt(clueNumber, 10) + 1; // Add 1 to clueNumber for display

            // Ensure that the clueNumber is within bounds
            if (clueNumber - 1 < clues.length) {
                const imgContainer = document.createElement("div");
                imgContainer.className = "image-preview";

                // Create a container for clue number and text
                const clueInfo = document.createElement("div");
                clueInfo.className = "clue-info mb-2 text-center";

                // Add clue number
                const clueNumberText = document.createElement("p");
                clueNumberText.className = "clue-number text-lg font-semibold text-blue-600";
                clueNumberText.textContent = `Indizio n° ${clueNumber}`;
                clueInfo.appendChild(clueNumberText);

                // Add clue text
                const clueQuestionText = document.createElement("p");
                clueQuestionText.className = "clue-question text-gray-800";
                clueQuestionText.textContent = clues[clueNumber - 1] ? clues[clueNumber - 1].question : "Testo mancante"; // Adjust index for clues array
                clueInfo.appendChild(clueQuestionText);

                imgContainer.appendChild(clueInfo);
                // console.log(dataUrl)
                // Create and add image
                const img = document.createElement("img");
                img.src = dataUrl.url;
                img.className = "block w-full h-auto object-cover rounded-lg shadow-sm"; // Tailwind classes for image styling
                imgContainer.appendChild(img);

                previewContainer.appendChild(imgContainer);
            }
        });
    }

    // Add Back and Submit buttons

    const backButton = document.createElement("button");
    backButton.className = "navigation-button mr-2 py-2 px-4 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 focus:outline-none transition duration-300";
    backButton.innerHTML = `<i class="fas fa-chevron-left"></i>`;
    backButton.addEventListener("click", function () {
        currentClueIndex = clues.length - 1
        displayAllClues();
    });

    const submitButton = document.createElement("button");
    submitButton.innerHTML = `
      <span class="spinner hidden mr-2 border-t-2 border-white border-solid rounded-full w-4 h-4 animate-spin"></span>
      <span class="button-text">Invio</span>
    `;
    submitButton.className = "loading-button px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500";

    submitButton.addEventListener("click", async function () {
        // Show the spinner
        submitButton.classList.add("loading");
        submitButton.disabled = true;
        submitButton.textContent = "Attendi";
        const buttonText = submitButton.querySelector(".button-text");

        // Call completion function or handle submission
        addStatus(currentPasscode)
        setTimeout(showSuccessMessage, 5000); // Waits for 5000 milliseconds (5 seconds) before calling showSuccessMessage


    });



    // Append the preview container to the body or any other desired location
    clueContainer.appendChild(previewContainer);
    clueContainer.appendChild(backButton);

    clueContainer.appendChild(submitButton);


    // Scroll to the new preview section
    window.scrollTo(0, 0);
}



function showCompletionMessage() {
    // Call your existing completion message logic here

    // Show all images preview
    showAllImagesPreview();


}

function showSuccessMessage() {
    const clueContainer = document.getElementById("clueContainer");
    clueContainer.innerHTML = ""; // Clear the container    
    // Create a completion message
    const messageDiv = document.createElement("div");
    messageDiv.className =
        "flex justify-center items-center h-screen bg-white p-4";

    const message = document.createElement("h1");
    message.className = "text-2xl font-bold text-green-600";
    message.textContent = "Congratulazioni! Hai completato tutti gli indizi!";

    messageDiv.appendChild(message);
    clueContainer.appendChild(messageDiv);


    // Reload the page after 5 seconds
    setTimeout(() => {
        location.reload();
    }, 6000);
}
