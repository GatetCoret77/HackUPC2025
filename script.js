// FINAL SCRIPT (with changes marked)

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM ELEMENT SELECTIONS ---
    const headerContainer = document.querySelector('.header-container');
    const headerElement = document.querySelector('.cupra-header');
    const introContainer = document.getElementById('intro-container');
    const introVideo = document.getElementById('intro-video');
    const postIntroScreen = document.getElementById('post-intro-screen');
    const exploreButton = document.getElementById('start-button-left');
    const skipIntroButton = document.getElementById('skip-intro-button');
    const skipControlsContainer = document.getElementById('skip-controls-container');
    const mainContent = document.getElementById('main-content');
    const exteriorView = document.getElementById('exterior-view');
    const interiorView = document.getElementById('interior-view');
    const exteriorVideo = document.getElementById('exterior-video');
    const interiorVideo = document.getElementById('interior-video');
    let headerNavButtonsContainer = null;
    let exteriorButton = null;
    let interiorButton = null;
    const catHelperContainer = document.getElementById('cat-helper-container');
    const catHelperImage = document.getElementById('cat-helper-image');
    const catQuestionInput = document.getElementById('cat-question-input');
    const askCatButton = document.getElementById('ask-cat-button');
    const popup = document.getElementById('info-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupInfo = document.getElementById('popup-info');
    const closeButton = document.getElementById('close-popup');
    const allHotspots = document.querySelectorAll('.hotspot');
    const moreOptionsTrigger = document.getElementById('more-options-trigger');
    const fixedMoreOptionsContainer = document.getElementById('fixed-more-options-container'); 
    const modalOverlay = document.getElementById('modal-overlay');
    const infoModal = document.getElementById('info-modal');
    const modalTitle = document.getElementById('modal-title');
    const closeModalButton = document.getElementById('close-modal-button');
    const bodyElement = document.body; // Selecciona el body

    // --- 2. STATE & CONFIGURATION ---
    const BACKEND_URL = 'http://localhost:3000/ask-ollama';
    let currentViewId = 'exterior-view';
    const basicResponses = {
        'hola': "¡Miau! Hola. ¿En qué puedo ayudarte con el coche?",
        'adios': "¡Miau! Hasta luego.",
        'gracias': "¡De nada! Siempre es un placer ayudar. Miau.",
        'ayuda': "Puedes preguntarme sobre el coche (volante, pantalla, etc.) o hacer clic en los puntos naranjas. También respondo a 'hola', 'gracias', etc. Miau!",
        'como estas': "¡Genial! Listo para ayudarte con el coche. Miau.",
        'que haces': "Estoy consultando mi información para ayudarte. Pregúntame algo. Miau!",
        'miau': "¡Miau! ¿Decías?"
    }; // Assume these are filled
    const catClickPhrases = [
        "¿En qué puedo ayudarte?",
        "¡Hey! ¿Qué tal?",
        "Pregúntame algo sobre el coche...",
        "Haz clic en los puntos naranjas para info rápida.",
        "Miau."
    ]; // Assume these are filled
    let isIntroSkippedOrEnded = false;
    let hasCatGreeted = false;

    // --- 3. FUNCTIONS ---

    // --- Frame Capture Function ---
    function captureAndSetBackground(videoElement, targetContainer) {
        if (!videoElement || !targetContainer) return;
        // Basic check for readiness (more robust checks might be needed)
        if (videoElement.readyState < 2 || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
            console.warn("Video not ready for capture, skipping background set.");
            // Optionally set a fallback background color
            targetContainer.style.backgroundColor = '#000'; // Example fallback
            return;
        }
        console.log("Capturing frame...");
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        try {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            // Use lower quality JPEG for faster conversion and smaller size
            const dataURL = canvas.toDataURL('image/jpeg', 0.7); // Quality 0.7
            targetContainer.style.backgroundImage = `url(${dataURL})`;
            console.log("Frame captured and set as background.");
        } catch (error) {
            console.error("Error capturing or setting frame:", error);
             targetContainer.style.backgroundColor = '#000'; // Fallback on error
        }
    }

    // --- View Switching Function ---
    // --- View Switching Function ---
function showView(viewIdToShow) {
    console.log(`Switching view to: ${viewIdToShow}`);
    currentViewId = viewIdToShow;
    const views = [exteriorView, interiorView];

    views.forEach(view => {
        // ... (código existente para ocultar/mostrar vistas y videos) ...
         if (!view) return;
         const isActive = view.id === viewIdToShow;
         view.classList.toggle('hidden', !isActive);

         // Play/pause corresponding video
         let videoElement = null;
         if (view.id === 'exterior-view') videoElement = exteriorVideo;
         else if (view.id === 'interior-view') videoElement = interiorVideo;

         if (videoElement) {
             if (isActive) {
                 if (videoElement.paused) {
                     videoElement.play().catch(e => console.warn(`${view.id} video play failed (might be intended):`, e));
                 }
             } else {
                 if (!videoElement.paused) {
                     videoElement.pause();
                 }
             }
         }
    });

    // Toggle hotspots visibility based on the current view
    allHotspots.forEach(hotspot => {
       // ... (código existente para ocultar/mostrar hotspots) ...
        const isInExterior = hotspot.classList.contains('exterior-hotspot');
        const isInInterior = hotspot.classList.contains('interior-hotspot');
        let shouldBeVisible = false;

        if (viewIdToShow === 'exterior-view' && isInExterior) {
            shouldBeVisible = true;
        } else if (viewIdToShow === 'interior-view' && isInInterior) {
            shouldBeVisible = true;
        }
        hotspot.classList.toggle('hidden', !shouldBeVisible);
    });

    // Update header button active state
    // ... (código existente para actualizar botones del header) ...
    if (exteriorButton) exteriorButton.classList.remove('active-view');
    if (interiorButton) interiorButton.classList.remove('active-view');

    if (viewIdToShow === 'exterior-view' && interiorButton) {
        interiorButton.classList.add('active-view');
    } else if (viewIdToShow === 'interior-view' && exteriorButton) {
        exteriorButton.classList.add('active-view');
    }


    // ===> AÑADE ESTA LÓGICA PARA EL BOTÓN FIJO <===
           // Control visibility of the fixed More Options button
           if (fixedMoreOptionsContainer) {
            // Show if the current view is either Exterior OR Interior
            const shouldShow = viewIdToShow === 'exterior-view' || viewIdToShow === 'interior-view';

            if (shouldShow) {
                fixedMoreOptionsContainer.classList.remove('hidden'); // Show the button
            } else {
                fixedMoreOptionsContainer.classList.add('hidden');    // Hide the button otherwise
            }
            // Opcional: Añadir un log para confirmar
            console.log(`Fixed button should show: ${shouldShow}. Current classes: ${fixedMoreOptionsContainer.className}`);
        } else {
            console.error("Fixed more options container not found!"); // Log si el elemento no existe
        }
}


    // --- Intro Transition Functions ---
    function transitionToPostIntro() {
        const isPostIntroVisible = postIntroScreen && !postIntroScreen.classList.contains('hidden');
        const isMainContentVisible = mainContent && !mainContent.classList.contains('hidden');

        // Prevent multiple transitions
        if (isPostIntroVisible || isMainContentVisible || isIntroSkippedOrEnded) {
            console.log("Transition already happened or in progress.");
            return;
        }
        console.log("Transitioning to post-intro...");
        isIntroSkippedOrEnded = true; // Mark that intro phase is over

        if (introVideo) {
            // Attempt to capture frame just before hiding video
            captureAndSetBackground(introVideo, introContainer);
            introVideo.pause();
            // Hide the video element itself, keep container for background
            introVideo.classList.add('capture-hidden'); // Use CSS to hide it
        }
        if (skipControlsContainer) skipControlsContainer.classList.add('hidden');

        // Show the post-intro screen overlay
        if (postIntroScreen) postIntroScreen.classList.remove('hidden');
    }

    // --- Function to create Header Buttons ---
    function createHeaderButtonsIfNotExists() {
        if (headerContainer && !headerNavButtonsContainer) {
            console.log("Adding header nav buttons...");
            headerNavButtonsContainer = document.getElementById('header-nav'); // Get existing container

            // Create Exterior Button
            exteriorButton = document.createElement('button');
            exteriorButton.className = 'header-nav-button'; // Base class
            exteriorButton.textContent = 'Exterior';
            exteriorButton.dataset.view = 'exterior-view';
            exteriorButton.addEventListener('click', () => showView('exterior-view'));

            // Create Interior Button
            interiorButton = document.createElement('button');
            interiorButton.className = 'header-nav-button'; // Base class
            interiorButton.textContent = 'Interior';
            interiorButton.dataset.view = 'interior-view';
            interiorButton.addEventListener('click', () => showView('interior-view'));

            // Append buttons to the container
            headerNavButtonsContainer.appendChild(exteriorButton);
            headerNavButtonsContainer.appendChild(interiorButton);

            console.log("Header buttons created and added.");
        } else if (headerNavButtonsContainer) {
             console.log("Header buttons already exist.");
        } else {
             console.warn("Header container or nav button container not found for creating buttons.");
        }
    }

    // --- Function to Show Main Content ---
    function showMainContentAndInit() {
        console.log("Showing main content and initializing...");

        createHeaderButtonsIfNotExists(); // Ensure buttons are created

        // Hide intro/post-intro elements
        if (postIntroScreen) postIntroScreen.classList.add('hidden');
        if (introContainer) introContainer.classList.add('hidden'); // Hide intro container completely now

        // Show header and main content
        if (headerElement) headerElement.classList.remove('hidden');
        if (mainContent) mainContent.classList.remove('hidden');

        // Show Cat Helper and greet if first time
        if (catHelperContainer) {
            catHelperContainer.classList.remove('hidden');
            if (!hasCatGreeted) {
                // Delay greeting slightly for smoother appearance
                setTimeout(() => {
                    // Use the standard showPopup function
                     showPopup("TavasCAT", "Hi, I'm TavasCAT, your assistant and buddy. Feel free to ask me anything about your car!");
                    hasCatGreeted = true; // Mark as greeted
                }, 600); // 600ms delay
            }
        }

        // Show the initial view (e.g., exterior)
        showView('exterior-view'); // Start with exterior

        // Enable body scrolling
        document.body.style.overflow = 'auto';
    }

    // --- Popup Functions ---
    function showPopup(title, info, isLoading = false) {
        if (!popup || !popupTitle || !popupInfo) return;

        let displayTitle = "TavasCAT"; // Default to TavasCAT
        if (title && title !== "Error") {
            displayTitle = title; // Use specific title from hotspot or specific call
        } else if (title === "Error") {
            displayTitle = "Error"; // Keep "Error" title if it's an error message
        }
        // If title is null, undefined, or empty string, it stays "TavasCAT"

        popupTitle.textContent = displayTitle;
        popupInfo.textContent = info; // Display the info text
        popupInfo.scrollTop = 0; // Scroll to top when showing new content

        popupInfo.classList.toggle('loading', isLoading);
        popup.classList.remove('hidden'); // Make sure it's visible
    }

    function hidePopup() {
        if (!popup) return;
        popup.classList.add('hidden');
        // Clear loading state when hiding
        if(popupInfo) popupInfo.classList.remove('loading');
    }

    // ===> AÑADE ESTAS FUNCIONES PARA EL MODAL <===
    function openInfoModal() {
        if (!infoModal || !modalOverlay || !modalTitle || !bodyElement) return; // Comprobación de existencia

        console.log("Opening info modal...");
        modalTitle.textContent = "Take a look at the manual!"; // Establece el título solicitado

        modalOverlay.classList.remove('hidden'); // Muestra el fondo oscuro
        infoModal.classList.remove('hidden');    // Muestra el modal
        bodyElement.classList.add('modal-open');   // Bloquea el scroll del body
    }

    function closeInfoModal() {
        if (!infoModal || !modalOverlay || !bodyElement) return; // Comprobación de existencia

        console.log("Closing info modal...");
        modalOverlay.classList.add('hidden'); // Oculta el fondo oscuro
        infoModal.classList.add('hidden');    // Oculta el modal
        bodyElement.classList.remove('modal-open'); // Desbloquea el scroll del body
    }
    // ===> FIN FUNCIONES MODAL <===

    // --- Backend Interaction Function ---
    async function processQuestion() {
        if (!catQuestionInput || !askCatButton || !popup) return;
        const question = catQuestionInput.value.trim();
        if (!question) return;
        const originalQuestion = question; // Keep original case for backend
        catQuestionInput.value = ''; // Clear input immediately

        const lowerQ = question.toLowerCase();

        // 1. Check basic local responses
        for (const keyword in basicResponses) {
            // More precise matching for basic keywords
            if (lowerQ === keyword || (basicResponses[keyword].length < 30 && lowerQ.includes(keyword))) { // Match exact or if response is short
                showPopup("TavasCAT", basicResponses[keyword]); // Use TavasCAT title
                catQuestionInput.focus();
                return; // Handled locally
            }
        }

        // 2. If not basic, show thinking state and send to backend
        showPopup("TavasCAT", "Miau... Thinking...", true); // Use TavasCAT title, add loading state
        askCatButton.disabled = true;
        catQuestionInput.disabled = true;

        try {
            console.log(`Sending to backend (${BACKEND_URL}): ${originalQuestion}`);
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: originalQuestion }), // Send original case question
            });

            if (!response.ok) {
                let errorMsg = `Miau! Error ${response.status}. Could not reach my brain...`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorData.message || errorData.answer || errorMsg;
                    console.error("Backend error response:", errorData);
                } catch (e) {
                    const textError = await response.text().catch(() => "Could not read error text");
                    console.error("Could not parse error JSON from backend. Status:", response.status, "Text:", textError);
                     errorMsg = `Miau! Error ${response.status}. ${response.statusText || textError}`;
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            console.log("Received from backend:", data);
            // Use TavasCAT title for backend response
            showPopup("TavasCAT", data.answer || "Miau... I didn't get a clear answer.");

        } catch (error) {
            console.error('Error asking cat:', error);
             // Use Error title for fetch/network errors
            showPopup("Error", error.message || "Miau! There was a problem processing your question.");
        } finally {
            // Re-enable controls, remove loading state happens in showPopup now
            askCatButton.disabled = false;
            catQuestionInput.disabled = false;
             if (popupInfo) popupInfo.classList.remove('loading'); // Ensure loading is off
            catQuestionInput.focus();
        }
    }


    // --- 4. EVENT LISTENERS ---

    // --- Intro Video / Skip / Explore ---
    if (introVideo) {
        introVideo.addEventListener('ended', transitionToPostIntro);
        introVideo.addEventListener('error', (e) => {
            console.error("Intro video error:", e);
            isIntroSkippedOrEnded = true; // Mark intro as over
            // Directly show main content on video error
            if (introContainer) introContainer.classList.add('hidden');
            if (postIntroScreen) postIntroScreen.classList.add('hidden');
            if (skipControlsContainer) skipControlsContainer.classList.add('hidden');
            showMainContentAndInit();
        });
    } else {
        // If no video element, skip intro phase immediately
        console.warn("Intro video element not found. Skipping intro.");
        isIntroSkippedOrEnded = true;
        if (introContainer) introContainer.classList.add('hidden');
        if (postIntroScreen) postIntroScreen.classList.add('hidden');
        if (skipControlsContainer) skipControlsContainer.classList.add('hidden');
        showMainContentAndInit();
    }

    if (skipIntroButton) {
        skipIntroButton.addEventListener('click', transitionToPostIntro);
    }

    // --- Keydown Listener (Handles BOTH Intro Skip and Post-Intro Explore) ---
    document.addEventListener('keydown', (event) => {
        // Condition 1: Skip intro video if Enter is pressed and intro is active
        const isIntroVideoVisible = introContainer && !introContainer.classList.contains('hidden') && !isIntroSkippedOrEnded;
        if (event.key === 'Enter' && isIntroVideoVisible) {
            event.preventDefault(); // Prevent default Enter behavior
            console.log("Enter pressed during intro - Skipping...");
            transitionToPostIntro();
        }
        // **** NEW CONDITION: Activate Explore from post-intro screen ****
        else if (event.key === 'Enter' && postIntroScreen && !postIntroScreen.classList.contains('hidden')) {
             event.preventDefault(); // Prevent default Enter behavior
             console.log("Enter pressed on post-intro - Exploring...");
             showMainContentAndInit(); // Call the function to show main content
        }
    });

    if (exploreButton) {
        exploreButton.addEventListener('click', showMainContentAndInit);
    } else {
        console.warn("Explore button not found.");
    }

    // --- Hotspot Clicks ---
    allHotspots.forEach(hotspot => {
        hotspot.addEventListener('click', (e) => {
            // Check if the clicked hotspot is actually visible (belongs to the current view)
            if (!hotspot.classList.contains('hidden')) {
                const specificTitle = hotspot.dataset.title || "Information"; // Get title from data attribute
                const info = hotspot.dataset.info || "No details available.";
                showPopup(specificTitle, info); // Pass the specific title
                e.stopPropagation(); // Prevent click bubbling to document listener immediately
            }
        });
    });

    // --- Popup Close Button ---
    if (closeButton) {
        closeButton.addEventListener('click', (e) => {
            hidePopup();
            e.stopPropagation(); // Prevent click bubbling
        });
    }

    // --- Cat Image Click ---
    if (catHelperImage) {
        catHelperImage.addEventListener('click', (e) => {
            const randomIndex = Math.floor(Math.random() * catClickPhrases.length);
            showPopup("TavasCAT", catClickPhrases[randomIndex] || "¡Meow!"); // Explicit TavasCAT title
            e.stopPropagation(); // Prevent click bubbling
        });
    }

    // --- Ask Button Click ---
    if (askCatButton) {
        askCatButton.addEventListener('click', processQuestion);
    }

    // --- Enter Key in Input Field ---
    if (catQuestionInput) {
        catQuestionInput.addEventListener('keypress', (event) => {
            // Check for Enter key without Shift/Ctrl/Alt modifiers
            if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
                event.preventDefault(); // Prevent potential form submission/newline
                processQuestion();
            }
        });
    }
    // --- 4. EVENT LISTENERS ---
// ... (tus listeners existentes: intro, skip, header, hotspots, popup gato, etc.) ...

// ===> AÑADE ESTOS LISTENERS PARA EL MODAL <===

// Listener para el botón "Still Curious?" / "More Options"
if (moreOptionsTrigger) {
    moreOptionsTrigger.addEventListener('click', openInfoModal); // Llama a la función para abrir
} else {
    console.warn("More Options trigger button not found.");
}

// Listener para el botón de cierre del modal
if (closeModalButton) {
    closeModalButton.addEventListener('click', closeInfoModal);
} else {
    console.warn("Close modal button not found.");
}

// Listener para cerrar el modal haciendo clic en el fondo oscuro
if (modalOverlay) {
    modalOverlay.addEventListener('click', closeInfoModal);
} else {
    console.warn("Modal overlay not found.");
}
// ===> FIN LISTENERS MODAL <===


    // --- Click Outside Popup to Close ---
    document.addEventListener('click', (event) => {
        if (popup && !popup.classList.contains('hidden')) {
            const isClickInsidePopup = popup.contains(event.target);
            // Check if the click target is the cat image OR a visible hotspot OR the ask button/input area
            const isClickOnTrigger =
                (catHelperImage && catHelperImage.contains(event.target)) ||
                event.target.closest('.hotspot:not(.hidden)') || // Check only visible hotspots
                event.target.closest('#cat-input-area') || // Include input area
                event.target.closest('#ask-cat-button'); // Include ask button

            if (!isClickInsidePopup && !isClickOnTrigger) {
                hidePopup();
            }
        }
    });


    // --- 5. Initialisation ---
    console.log("Initializing page state...");

    // Ensure elements start hidden correctly using the .hidden class
    if (headerElement) headerElement.classList.add('hidden');
    if (postIntroScreen) postIntroScreen.classList.add('hidden');
    if (mainContent) mainContent.classList.add('hidden');
    if (catHelperContainer) catHelperContainer.classList.add('hidden');
    if (popup) popup.classList.add('hidden');
    [exteriorView, interiorView].forEach(view => { if (view) view.classList.add('hidden'); });
    allHotspots.forEach(hotspot => hotspot.classList.add('hidden')); // Hide all hotspots initially

    // Keep intro visible if it exists, hide others
    if (introContainer) introContainer.classList.remove('hidden');
    if (skipControlsContainer) skipControlsContainer.classList.remove('hidden'); // Show skip initially if intro exists
    if(introVideo) introVideo.classList.remove('capture-hidden'); // Ensure video element is visible initially

    if (popup) popup.classList.add('hidden'); // Popup del gato
    if (fixedMoreOptionsContainer) fixedMoreOptionsContainer.classList.add('hidden');
    // ===> AÑADE ESTAS LÍNEAS <===
    if (modalOverlay) modalOverlay.classList.add('hidden');
    if (infoModal) infoModal.classList.add('hidden');
    // ===========================
    [exteriorView, interiorView].forEach(view => { if (view) view.classList.add('hidden'); });
    // Prevent body scroll during intro
    document.body.style.overflow = 'hidden';

    console.log("Initialization complete.");

}); // End of DOMContentLoaded