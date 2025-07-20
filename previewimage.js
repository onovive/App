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
    // Disable the button and show a loading message
    submitButton.classList.add("loading");
    submitButton.disabled = true;
    submitButton.textContent = "Attendi";

    // Show animated status messages
    const statusMessage = document.createElement("p");
    statusMessage.className = "mt-4 text-center text-gray-700 text-base animate-pulse";
    statusMessage.textContent = "Attendere, le immagini sono in fase di caricamento...";
    clueContainer.appendChild(statusMessage);

    // Update status after 10 seconds
    setTimeout(() => {
      statusMessage.className = "mt-4 text-center text-gray-700 text-base animate-bounce";
      statusMessage.textContent = "Calcolo del punteggio in corso, per favore attendi...";
    }, 10000);

    // Simulate the async operation
    const { validCount, clueCount, dataIndex, timeTaken } = await addStatus(currentPasscode);

    // Final message after operation completes
    setTimeout(() => showSuccessMessage(validCount, clueCount, dataIndex, timeTaken), 1000);
  });




  // Append the preview container to the body or any other desired location
  clueContainer.appendChild(previewContainer);
  clueContainer.appendChild(backButton);

  clueContainer.appendChild(submitButton);


  // Scroll to the new preview section
  window.scrollTo(0, 0);
}



function showCompletionMessage() {

  showAllImagesPreview();
}


function showSuccessMessage(validCount, clueCount, dataIndex, timeTaken) {
  const clueContainer = document.getElementById("clueContainer");
  clueContainer.innerHTML = "";

  const successRate = Math.round((validCount / clueCount) * 100);

  const container = document.createElement("div");
  container.setAttribute("style", `
    background: white;
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    max-width: 600px;
    width: 100%;
    animation: slideUp 0.6s ease-out;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  `);

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 4rem; margin-bottom: 10px; animation: bounce 2s infinite;">🏆</div>
      <h1 style="font-size: 2.5rem; color: #333; margin-bottom: 10px; font-weight: 700;">Il Tuo Risultato</h1>
    </div>

      <div class="stats flex flex-col md:flex-row md:justify-around items-center gap-4 mb-8">
  
  <div class="stat-item bg-gray-100 rounded-lg p-4 text-center flex-1 min-w-[150px] md:min-w-[120px]">
    <div class="stat-icon text-xl md:text-2xl">🔍</div>
    <div class="stat-number text-lg md:text-xl font-bold text-green-600">${validCount}/${clueCount}</div>
    <div class="stat-label text-sm text-gray-500">Indizi Trovati</div>
  </div>

  <div class="stat-item bg-gray-100 rounded-lg p-4 text-center flex-1 min-w-[150px] md:min-w-[120px]">
    <div class="stat-icon text-xl md:text-2xl">⏱</div>
    <div class="stat-number text-lg md:text-xl font-bold text-green-600">${timeTaken}</div>
    <div class="stat-label text-sm text-gray-500">Tempo Impiegato</div>
  </div>

  <div class="stat-item bg-gray-100 rounded-lg p-4 text-center flex-1 min-w-[150px] md:min-w-[120px]">
    <div class="stat-icon text-xl md:text-2xl">📊</div>
    <div class="stat-number text-lg md:text-xl font-bold text-green-600">${successRate}%</div>
    <div class="stat-label text-sm text-gray-500">Tasso di Successo</div>
  </div>

</div>

    <div style="text-align: center; font-size: 1.2rem; color: #333; margin-bottom: 10px;">Progresso Generale</div>
    <div style="height: 10px; background: #e0e0e0; border-radius: 9999px; overflow: hidden; margin-bottom: 30px;">
      <div style="height: 100%; background: linear-gradient(90deg, #28a745, #20c997); width: ${successRate}%; transition: width 1s ease-out;"></div>
    </div>

    <div class="clues-section">
      <h2 style="font-size: 1.5rem; color: #333; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
        <span>📝</span> Riassunto
      </h2>
    </div>

    <div style="margin-top: 30px; text-align: center;">
      <p style="color: #333; font-size: 1.1rem; margin: 0;">
        Non appena tutti i giocatori avranno completato la sfida riceverai una email con la classifica finale.
      </p>
    </div>
  `;

  const cluesSection = container.querySelector(".clues-section");
  for (let i = 0; i < clues.length; i++) {
    const clue = clues[i];
    const imageEntry = uploadedImages[i];
    const correctEntry = dataIndex.find(([index]) => index === i);
    const correct = correctEntry ? correctEntry[1] : false;
    const hasImage = imageEntry && imageEntry.url;

    let clueStyle = '';
    let reasonText = '';
    let status = '';
    if (!hasImage) {
      clueStyle = "background: #fff3cd; border-left: 4px solid #ffc107;";
      reasonText = '<div style="font-size: 0.85rem; color: #666; margin-top: 5px; font-style: italic;">Nessuna foto inviata</div>';
      status = '🟡';
    } else if (!correct) {
      clueStyle = "background: #f8d7da; border-left: 4px solid #dc3545;";
      reasonText = `<div style="font-size: 0.85rem; color: #666; margin-top: 5px; font-style: italic;">${dataIndex[i][2]}</div>`;
      status = '❌';
    } else {
      clueStyle = "background: #d4edda; border-left: 4px solid #28a745;";
      status = '✅';
    }

    const imageHTML = hasImage
      ? `<img src="${imageEntry.url}" alt="Clue ${i + 1}" style="width: 120px; height: 90px; border-radius: 8px; object-fit: cover; border: 2px solid #ddd;" />`
      : `<div style="width: 120px; height: 90px; background: #f8f9fa; border: 2px dashed #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #999;">📷</div>`;

    const clueItem = document.createElement("div");
    clueItem.setAttribute("style", `
      display: flex;
      align-items: center;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 10px;
      transition: all 0.3s ease;
      animation: fadeIn 0.5s ease-out;
      ${clueStyle}
    `);
    clueItem.innerHTML = `
<div style="font-size: 0.8rem; height: 147px; margin-right: 15px; min-width: 20px; flex-shrink: 0;">${status}</div>
  <div style="display: flex; flex-direction: column; gap: 10px; flex: 1;">
    <div style="font-weight: 500; color: #333;">${clue.question}${reasonText}</div>
    <div style="display: flex; justify-content: center; align-items: center;">
      ${imageHTML}
    </div>
  </div>
`;
    cluesSection.appendChild(clueItem);
  }

  clueContainer.appendChild(container);
  window.scrollTo(0, 0);
}

function createStat(icon, value, label) {
  return `
    <div style="
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 15px;
      flex: 1;
      min-width: 150px;
      transition: transform 0.3s ease;
    ">
      <div style="font-size: 2rem; margin-bottom: 10px;">${icon}</div>
      <div style="font-size: 2rem; font-weight: bold; color: #667eea;">${value}</div>
      <div style="color: #666; font-size: 0.9rem; margin-top: 5px;">${label}</div>
    </div>
  `;
}

// function showSuccessMessage(validCount, clueCount, dataIndex, timeTaken) {
//     const clueContainer = document.getElementById("clueContainer");
//     clueContainer.innerHTML = "";

//     const successRate = Math.round((validCount / clueCount) * 100);
//     const dummyTime = "42:15"; // Replace with real timing if needed

//     const container = document.createElement("div");
//     container.className = "container bg-white rounded-lg p-8 shadow-lg max-w-3xl mx-auto animate-slideUp";

//     container.innerHTML = `
//         <div class="header text-center mb-8">
//             <div class="trophy text-5xl animate-bounce">🏆</div>
//             <h1 class="title text-3xl font-bold text-gray-800">Il Tuo Risultato</h1>
//         </div>

//         <div class="stats flex flex-col items-center gap-4 mb-8 md:flex-row md:justify-around" 
//              style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; 
//                     @media (max-width: 640px) { display: flex !important; flex-direction: row !important; justify-content: space-between !important; gap: 5px !important; }">
//             <div class="stat-item bg-gray-100 rounded-lg p-4 text-center flex-1" 
//                  style="background-color: #f3f4f6; border-radius: 0.5rem; padding: 4px; text-align: center; flex: 1; min-width: 150px; 
//                         @media (max-width: 640px) { min-width: 80px !important; padding: 2px !important; flex: 1 !important; }">
//                 <div class="stat-icon text-2xl" style="font-size: 1.25rem; @media (max-width: 640px) { font-size: 1rem !important; }">🌿</div>
//                 <div class="stat-number text-xl font-bold text-green-600" style="font-size: 1.25rem; font-weight: bold; color: #16a34a; 
//                         @media (max-width: 640px) { font-size: 0.8rem !important; }">${validCount}/${clueCount}</div>
//                 <div class="stat-label text-sm text-gray-500" style="font-size: 0.875rem; color: #6b7280; 
//                         @media (max-width: 640px) { font-size: 0.9rem !important; }">Indizi Trovati</div>
//             </div>
//             <div class="stat-item bg-gray-100 rounded-lg p-4 text-center flex-1" 
//                  style="background-color: #f3f4f6; border-radius: 0.5rem; padding: 4px; text-align: center; flex: 1; min-width: 150px; 
//                         @media (max-width: 640px) { min-width: 80px !important; padding: 2px !important; flex: 1 !important; }">
//                 <div class="stat-icon text-2xl" style="font-size: 1.25 rem; @media (max-width: 640px) { font-size: 1rem !important; }"> ⏱</div>
//                 <div class="stat-number text-xl font-bold text-green-600" style="font-size: 1.25rem; font-weight: bold; color: #16a34a; 
//                         @media (max-width: 640px) { font-size: 0.8rem !important; }">${timeTaken}</div>
//                 <div class="stat-label text-sm text-gray-500" style="font-size: 0.875rem; color: #6b7280; 
//                         @media (max-width: 640px) { font-size: 0.9rem !important; }">Tempo Impiegato</div>
//             </div>
//             <div class="stat-item bg-gray-100 rounded-lg p-4 text-center flex-1" 
//                  style="background-color: #f3f4f6; border-radius: 0.5rem; padding: 4px; text-align: center; flex: 1; min-width: 150px; 
//                         @media (max-width: 640px) { min-width: 80px !important; padding: 2px !important; flex: 1 !important; }">
//                 <div class="stat-icon text-2xl" style="font-size: 1.25rem; @media (max-width: 640px) { font-size: 1rem !important; }">📊</div>
//                 <div class="stat-number text-xl font-bold text-green-600" style="font-size: 1.25rem; font-weight: bold; color: #16a34a; 
//                         @media (max-width: 640px) { font-size: 0.8rem !important; }">${successRate}%</div>
//                 <div class="stat-label text-sm text-gray-500" style="font-size: 0.875rem; color: #6b7280; 
//                         @media (max-width: 640px) { font-size: 0.9rem !important; }">Tasso di Successo</div>
//             </div>
//         </div>

// <div class="score-text text-center text-gray-700 font-medium text-lg mb-2">Progresso Generale</div>
// <div class="progress-bar mb-6 rounded-full overflow-hidden bg-gray-200 h-3">
//   <div class="progress-fill h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" style="width:${successRate}%"></div>
// </div>

//         <div class="clues-section">
//         <h2 class="section-title text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
// <span class="font-bold">📝 Riassunto</span>
//             </h2>
//         </div>

//         <div class="final-message text-center mt-6 text-gray-700 text-base">
//             Non appena tutti i giocatori avranno completato la sfida riceverai una email con la classifica finale.
//         </div>
//     `;

//     const cluesSection = container.querySelector(".clues-section");
//     for (let i = 0; i < clues.length; i++) {
//         const clue = clues[i];
//         const imageEntry = uploadedImages[i];
//         const correctEntry = dataIndex.find(([index]) => index === i);
//         const correct = correctEntry ? correctEntry[1] : false;
//         const hasImage = imageEntry && imageEntry.url;

//         const clueItem = document.createElement("div");
//         clueItem.className = `
//         clue-item flex flex-col items-center justify-center gap-4 bg-white rounded-lg p-4 mb-4 relative w-full
//         ${!hasImage ? 'bg-yellow-50 border border-yellow-300 before:bg-yellow-500' : (correct ? 'bg-green-50 border border-green-300 before:bg-green-500' : 'bg-red-50 border border-red-300 before:bg-red-500')}
//         before:content-[''] before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:rounded-tl-lg before:rounded-bl-lg
//     `;
//         clueItem.innerHTML = `
//         <div class="flex items-center justify-center gap-2 w-full text-center">
//             <span class="status-icon text-base">${!hasImage ? '🟡' : (correct ? '✅' : '❌')}</span>
//             <span class="clue-text font-bold text-gray-800">${clue.question}</span>
//         </div>
//         ${!hasImage
//                 ? `<div class="text-sm italic text-yellow-700 text-center">Nessuna foto inviata</div>`
//                 : (!correct ? `<div class="text-sm italic text-red-700 text-center">Oggetto sbagliato</div>` : '')
//             }
//         <div class="clue-image mt-2">
//             ${hasImage
//                 ? `<img src="${imageEntry.url}" alt="Clue ${i + 1}" class="w-[70px] h-[50px] object-cover rounded border border-gray-300 mx-auto">`
//                 : `<div class="w-[70px] h-[50px] flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded mx-auto">📷</div>`
//             }
//         </div>
//     `;

//         cluesSection.appendChild(clueItem);
//     }

//     clueContainer.appendChild(container);
//     window.scrollTo(0, 0);
// }
