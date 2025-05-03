// FINAL SCRIPT for the provided HTML structure

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM ELEMENT SELECTIONS ---
    // Header
    const headerContainer = document.querySelector('.header-container'); // Select header container

    // Intro Elements
    const introContainer = document.getElementById('intro-container');
    const introVideo = document.getElementById('intro-video');
    const postIntroScreen = document.getElementById('post-intro-screen');
    const exploreButton = document.getElementById('start-button-left');
    const skipIntroButton = document.getElementById('skip-intro-button');
    const skipControlsContainer = document.getElementById('skip-controls-container');
    const mainContent = document.getElementById('main-content');

    // Main Interaction Elements (Cat, Popup, Hotspots)
    const hotspots = document.querySelectorAll('.hotspot');
    const popup = document.getElementById('info-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupInfo = document.getElementById('popup-info');
    const closeButton = document.getElementById('close-popup');
    const catHelperImage = document.getElementById('cat-helper-image');
    const catQuestionInput = document.getElementById('cat-question-input');
    const askCatButton = document.getElementById('ask-cat-button');

    // --- 2. CONFIGURATION & LOCAL DATA ---

    const BACKEND_URL = 'http://localhost:3000/ask-ollama';

    const hotspotData = {};
    if (hotspots) {
        hotspots.forEach(hotspot => {
            const id = hotspot.id || hotspot.dataset.title;
            if (id) {
                 hotspotData[id] = {
                    title: hotspot.dataset.title || "Info",
                    info: hotspot.dataset.info || "No details available."
                };
            } else {
                console.warn("Hotspot found without id or data-title, cannot store data:", hotspot);
            }
        });
    }

    const basicResponses = {
        'hola': "¡Miau! Hola. ¿En qué puedo ayudarte con el coche?",
        'adios': "¡Miau! Hasta luego.",
        'gracias': "¡De nada! Siempre es un placer ayudar. Miau.",
        'ayuda': "Puedes preguntarme sobre el coche (volante, pantalla, etc.) o hacer clic en los puntos naranjas. También respondo a 'hola', 'gracias', etc. Miau!",
        'como estas': "¡Genial! Listo para ayudarte con el coche. Miau.",
        'que haces': "Estoy consultando mi información para ayudarte. Pregúntame algo. Miau!",
        'miau': "¡Miau! ¿Decías?"
    };

    const catClickPhrases = [
        "¿En qué puedo ayudarte?",
        "¡Hey! ¿Qué tal?",
        "Pregúntame algo sobre el coche...",
        "Haz clic en los puntos naranjas para info rápida.",
        "Miau."
    ];


    // --- 3. FUNCTIONS ---

    // --- Intro Transition Functions ---
    function transitionToPostIntro() {
        // Check if already on post-intro OR main content is visible
        const isMainContentVisible = mainContent && !mainContent.classList.contains('hidden');
        if ((postIntroScreen && !postIntroScreen.classList.contains('hidden')) || isMainContentVisible) {
            console.log("Transition to post-intro/main content already happened or in progress.");
            return;
        }
        console.log("Transitioning to post-intro screen...");

        if (introVideo) introVideo.pause();
        if (skipControlsContainer) skipControlsContainer.classList.add('hidden');
        if (postIntroScreen) postIntroScreen.classList.remove('hidden');
        // introContainer remains visible as background until main content is shown
    }

    function showMainContent() {
        console.log("Showing main content...");

        // --- START: Add Header Buttons ---
        // Check if the buttons container already exists to prevent adding them multiple times
        if (headerContainer && !headerContainer.querySelector('.header-nav-buttons')) {
            console.log("Adding header navigation buttons...");
            const navButtonsContainer = document.createElement('div');
            navButtonsContainer.className = 'header-nav-buttons';

            const exteriorButton = document.createElement('button');
            exteriorButton.className = 'header-nav-button';
            exteriorButton.textContent = 'Exterior';
            // Add event listener if needed later: exteriorButton.addEventListener('click', () => { /* handle exterior click */ });

            const interiorButton = document.createElement('button');
            interiorButton.className = 'header-nav-button active-view'; // Start with Interior active
            interiorButton.textContent = 'Interior';
             // Add event listener if needed later: interiorButton.addEventListener('click', () => { /* handle interior click */ });

            navButtonsContainer.appendChild(exteriorButton);
            navButtonsContainer.appendChild(interiorButton);

            headerContainer.appendChild(navButtonsContainer);
        }
        // --- END: Add Header Buttons ---

        if (postIntroScreen) postIntroScreen.classList.add('hidden');
        if (introContainer) introContainer.classList.add('hidden'); // Hide video bg NOW
        if (mainContent) mainContent.classList.remove('hidden');
        document.body.style.overflow = 'auto'; // Enable scrolling
    }

    // --- Popup Functions ---
    function showPopup(title, info) {
        if (!popup || !popupTitle || !popupInfo) return;
        popupTitle.textContent = title;
        popupInfo.textContent = info;
        popupInfo.classList.remove('loading'); // Ensure loading state is cleared
        popup.classList.remove('hidden');
    }

    function hidePopup() {
        if (!popup) return;
        popup.classList.add('hidden');
    }

    // --- Backend Interaction Function ---
    async function processQuestion() {
        if (!catQuestionInput || !askCatButton || !popup) return;

        const question = catQuestionInput.value.trim();
        if (!question) return;

        const lowerQ = question.toLowerCase();
        let handledLocally = false;

        // 1. Check for basic local responses first
        for (const keyword in basicResponses) {
             if (lowerQ === keyword || lowerQ.startsWith(keyword + ' ') || lowerQ.endsWith(' ' + keyword) || lowerQ.includes(' ' + keyword + ' ')) {
                showPopup("Gato Ayudante", basicResponses[keyword]);
                handledLocally = true;
                break;
            }
        }

        if (handledLocally) {
            catQuestionInput.value = '';
            catQuestionInput.focus();
            return; // Don't proceed to backend
        }

        // 2. If not basic, send to backend
        showPopup("Gato Ayudante", "Miau... Pensando...");
        if (popupInfo) popupInfo.classList.add('loading');
        askCatButton.disabled = true;
        catQuestionInput.disabled = true;

        try {
            console.log(`Sending to backend (${BACKEND_URL}): ${question}`);
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify({ question: question }),
            });

            if (!response.ok) {
                let errorMsg = `Miau! Error ${response.status}. No pude conectar con mi cerebro...`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorData.answer || errorMsg;
                    console.error("Backend error response:", errorData);
                } catch (e) {
                     console.error("Could not parse error response from backend.");
                     const textError = await response.text().catch(() => "Could not read text response");
                     console.error("Backend error response (text):", textError);
                     errorMsg += ` Server response: ${response.statusText || 'Unknown'}`;
                }
                 if (response.status === 404) errorMsg += " Endpoint no encontrado.";
                 if (response.status === 500) errorMsg += " Problema interno del servidor.";
                throw new Error(errorMsg);
            }

            const data = await response.json();
            console.log(`Received from backend:`, data);
            showPopup("Gato Ayudante", data.answer || "Miau... No recibí una respuesta clara.");

        } catch (error) {
            console.error('Error asking cat:', error);
            showPopup("Error", error.message || "Miau! Hubo un problema al procesar tu pregunta.");
        } finally {
            askCatButton.disabled = false;
            catQuestionInput.disabled = false;
            if (popupInfo) popupInfo.classList.remove('loading');
            catQuestionInput.value = '';
            catQuestionInput.focus();
        }
    }


    // --- 4. EVENT LISTENERS ---

    // --- Intro Event Listeners ---
    if (introVideo) {
        introVideo.addEventListener('ended', transitionToPostIntro);
        introVideo.addEventListener('error', (e) => {
            console.error("Error loading/playing intro video:", e);
             // Decide how to handle video error: show post-intro or main content?
             // Option 1: Show post-intro with fallback background
            if (introContainer) introContainer.classList.add('hidden'); // Hide broken video area
            if (skipControlsContainer) skipControlsContainer.classList.add('hidden');
            if (postIntroScreen) {
                postIntroScreen.style.backgroundColor = '#404042'; // Fallback background
                postIntroScreen.classList.remove('hidden');
            } else {
                 console.warn("Post-intro screen not found, attempting to show main content directly on video error.");
                 showMainContent(); // Fallback to showing main content
            }
            // Option 2 (Alternative): Go directly to main content on video error
            // console.warn("Video error, skipping directly to main content.");
            // showMainContent();
        });
    } else {
         // If no intro video element exists at all, skip straight to main content
         console.warn("Intro video element not found. Skipping intro phase.");
         showMainContent(); // Show main content directly
         if (introContainer) introContainer.classList.add('hidden');
         if (postIntroScreen) postIntroScreen.classList.add('hidden');
         if (skipControlsContainer) skipControlsContainer.classList.add('hidden');
    }


    if (skipIntroButton) {
        skipIntroButton.addEventListener('click', transitionToPostIntro);
    }

    // Enter key listener (to skip intro)
    document.addEventListener('keydown', (event) => {
        // Only allow skip if skip controls are visible AND post-intro isn't shown yet
        const isIntroPhaseActive = skipControlsContainer && !skipControlsContainer.classList.contains('hidden');
        const isPostIntroVisible = postIntroScreen && !postIntroScreen.classList.contains('hidden');

        if (event.code === 'Enter' && isIntroPhaseActive && !isPostIntroVisible) {
            event.preventDefault();
            console.log("Enter key pressed during intro video - Skipping...");
            transitionToPostIntro();
        }
    });


    // Explore button click listener
    if (exploreButton) {
        exploreButton.addEventListener('click', () => {
             console.log("Explore button clicked!");
             showMainContent(); // Call the function to show the main content area AND add header buttons
        });
    } else {
         console.warn("Could not find the 'Explore' button with ID 'start-button-left'.");
    }

    // --- Main Interaction Event Listeners ---

    // Hotspot Clicks
    if (hotspots) {
        hotspots.forEach(hotspot => {
            hotspot.addEventListener('click', () => {
                 const id = hotspot.id || hotspot.dataset.title;
                const data = hotspotData[id];
                if (data) {
                    showPopup(data.title, data.info);
                } else {
                    showPopup(hotspot.dataset.title || "Info", "Details not found for this hotspot.");
                    console.warn("Could not find stored data for hotspot:", hotspot);
                }
            });
        });
    }

    // Popup Close Button Click
    if (closeButton) {
        closeButton.addEventListener('click', hidePopup);
    }

    // Cat Image Click
    if (catHelperImage) {
        catHelperImage.addEventListener('click', () => {
            const randomIndex = Math.floor(Math.random() * catClickPhrases.length);
            showPopup("Gato Ayudante", catClickPhrases[randomIndex]);
        });
    }

    // Ask Button Click
    if (askCatButton) {
        askCatButton.addEventListener('click', processQuestion);
    }

    // Enter Key in Input Field (for asking cat)
    if (catQuestionInput) {
        catQuestionInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent potential form submission
                processQuestion();
            }
        });
    }

    // Click Outside Popup to Close (Added check for popup existence)
    document.addEventListener('click', (event) => {
        // Check if popup exists and is visible
        if (popup && !popup.classList.contains('hidden')) {
            // Check if the click was outside the popup content AND not on the cat image (which opens the popup)
            // AND not on a hotspot (which also opens the popup)
            const isClickInsidePopup = popup.contains(event.target);
            const isClickOnCat = catHelperImage && catHelperImage.contains(event.target);
            const isClickOnHotspot = event.target.classList.contains('hotspot');

            if (!isClickInsidePopup && !isClickOnCat && !isClickOnHotspot) {
                hidePopup();
            }
        }
    });


    // --- 5. STYLING (For Loading Indicator) ---
    const style = document.createElement('style');
    style.textContent = `
        #popup-info.loading::after {
            content: ' ';
            display: inline-block;
            width: 0.8em;
            height: 0.8em;
            border: 2px solid #ccc;
            border-radius: 50%;
            border-top-color: #333;
            animation: spin 1s linear infinite;
            margin-left: 8px;
            vertical-align: middle;
            box-sizing: border-box;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Style for the close button if it's just text */
        #close-popup::before {
          content: '\\00d7'; /* Unicode multiplication sign (X) */
          display: inline-block; /* Needed for positioning */
        }

    `;
    document.head.appendChild(style);

    // Initial check: If post-intro screen exists but is hidden, and main content is also hidden,
    // assume we should be showing the post-intro screen (e.g., JS loaded after HTML fully rendered).
    // This handles edge cases where the initial hidden state might be incorrect on load.
    if (postIntroScreen && postIntroScreen.classList.contains('hidden') &&
        mainContent && mainContent.classList.contains('hidden') &&
        introContainer && introContainer.classList.contains('hidden') && /* Ensure intro isn't supposed to be playing */
        skipControlsContainer && skipControlsContainer.classList.contains('hidden') /* Ensure skip isn't showing */
        ) {
          console.log("Initial state check: Forcing post-intro screen visibility.");
          postIntroScreen.classList.remove('hidden');
          // Keep intro container hidden if it was already hidden (e.g., video error case handled earlier)
          if(introContainer) introContainer.classList.add('hidden');
    }


}); // End of DOMContentLoaded